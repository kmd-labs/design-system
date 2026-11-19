import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  TemplateRef,
  Type,
  ViewChild,
  effect,
  inject
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { LucideAngularModule, X } from 'lucide-angular';
import { ButtonComponent } from '../button/button.component';
import { PopupAction, PopupSize } from './popup.model';
import { PopupService } from './popup.service';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]:not([contenteditable="false"])'
].join(', ');

/**
 * Design System Popup Component (`<app-popup>`).
 * Can be used as a global host driven by `PopupService` OR declaratively in templates
 * with `<ng-content>` projection, dynamic `component` projection, and `actions`.
 */
@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet, ButtonComponent, LucideAngularModule],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss'
})
export class PopupComponent implements OnChanges, OnDestroy {
  readonly popupService = inject(PopupService);
  readonly closeIcon = X;

  @ViewChild('dialogEl') dialogEl?: ElementRef<HTMLElement>;

  /** Accessible label for the header close button. */
  @Input() closeAriaLabel = 'Close';

  /** When true, binds automatically to `PopupService.config()`. */
  @Input() useService = true;

  /** Declarative inputs when used standalone in a template */
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() description = '';
  @Input() component?: Type<unknown>;
  @Input() componentInputs?: Record<string, unknown>;
  @Input() template?: TemplateRef<unknown>;
  @Input() actions: PopupAction[] = [];
  @Input() size: PopupSize = 'md';

  @Output() closed = new EventEmitter<void>();

  private wasVisible = false;
  private previouslyFocused: HTMLElement | null = null;
  private focusTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      this.popupService.config();
      if (this.useService) {
        this.syncVisibility(this.isVisible);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.useService && (changes['open'] || changes['useService'])) {
      this.syncVisibility(this.isVisible);
    }
  }

  ngOnDestroy(): void {
    this.clearFocusTimer();
    if (this.wasVisible) {
      this.wasVisible = false;
      this.restoreFocus();
    }
  }

  get isVisible(): boolean {
    return this.useService ? this.popupService.config() !== null : this.open;
  }

  get activeTitle(): string {
    if (this.useService) {
      return this.popupService.resolveText(this.popupService.config()?.title);
    }
    return this.title;
  }

  get activeSubtitle(): string {
    if (this.useService) {
      return this.popupService.resolveText(this.popupService.config()?.subtitle);
    }
    return this.subtitle;
  }

  get activeDescription(): string {
    if (this.useService) {
      return this.popupService.resolveText(this.popupService.config()?.description);
    }
    return this.description;
  }

  get activeComponent(): Type<unknown> | undefined {
    return this.useService ? this.popupService.config()?.component : this.component;
  }

  get activeComponentInputs(): Record<string, unknown> | undefined {
    return this.useService ? this.popupService.config()?.componentInputs : this.componentInputs;
  }

  get activeTemplate(): TemplateRef<unknown> | undefined {
    return this.useService ? this.popupService.config()?.template : this.template;
  }

  get activeActions(): PopupAction[] {
    return this.useService ? (this.popupService.config()?.actions ?? []) : this.actions;
  }

  get activeSize(): PopupSize {
    return this.useService ? (this.popupService.config()?.size ?? 'md') : this.size;
  }

  handleClose() {
    if (this.useService) {
      this.popupService.close();
    } else {
      this.closed.emit();
    }
  }

  handleActionClick(action: PopupAction) {
    action.onClick?.();
    if (action.closeOnClick !== false) {
      this.handleClose();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.handleClose();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent) {
    if (!this.isVisible) return;
    if (event.key === 'Escape') {
      this.handleClose();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private syncVisibility(visible: boolean): void {
    if (visible && !this.wasVisible) {
      this.wasVisible = true;
      this.previouslyFocused =
        typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
      this.clearFocusTimer();
      this.focusTimer = setTimeout(() => {
        this.focusTimer = null;
        this.focusInitialElement();
      }, 0);
    } else if (!visible && this.wasVisible) {
      this.wasVisible = false;
      this.clearFocusTimer();
      this.restoreFocus();
    }
  }

  private focusInitialElement(): void {
    if (!this.isVisible || typeof document === 'undefined') return;
    const dialog = this.dialogEl?.nativeElement;
    if (!dialog) return;
    // Respect autofocus or explicit focus already placed by a projected child component
    if (dialog.contains(document.activeElement)) return;
    const focusables = this.getFocusableElements(dialog);
    (focusables[0] ?? dialog).focus({ preventScroll: true });
  }

  private restoreFocus(): void {
    const target = this.previouslyFocused;
    this.previouslyFocused = null;
    if (!target || typeof document === 'undefined' || target === document.body) return;
    queueMicrotask(() => {
      if (target.isConnected) {
        target.focus({ preventScroll: true });
      }
    });
  }

  private trapFocus(event: KeyboardEvent): void {
    const dialog = this.dialogEl?.nativeElement;
    if (!dialog || typeof document === 'undefined') return;

    const focusables = this.getFocusableElements(dialog);
    if (focusables.length === 0) {
      event.preventDefault();
      dialog.focus({ preventScroll: true });
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (!active || !dialog.contains(active)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus({ preventScroll: true });
      return;
    }

    if (event.shiftKey) {
      if (active === first || active === dialog) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      }
    } else if (active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(el => {
      if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') {
        return false;
      }
      return el.getClientRects().length > 0;
    });
  }

  private clearFocusTimer(): void {
    if (this.focusTimer !== null) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }
  }
}

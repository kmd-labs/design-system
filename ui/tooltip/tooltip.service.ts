import { Injectable, signal } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

export type TooltipPlacement = 'top' | 'bottom';

export interface TooltipOptions {
  html?: SafeHtml | string;
  noWrap?: boolean;
  interactive?: boolean;
  closable?: boolean;
  onClose?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class TooltipService {
  readonly text = signal<string>('');
  readonly html = signal<SafeHtml | string | null>(null);
  readonly noWrap = signal<boolean>(false);
  readonly interactive = signal<boolean>(false);
  readonly closable = signal<boolean>(false);
  readonly onClose = signal<(() => void) | null>(null);
  readonly x = signal<number>(0);
  readonly y = signal<number>(0);
  readonly placement = signal<TooltipPlacement>('bottom');
  readonly visible = signal<boolean>(false);

  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;

  show(
    text: string,
    x: number,
    y: number,
    placement: TooltipPlacement = 'bottom',
    autoHideMs = 0,
    options?: TooltipOptions
  ) {
    if (!text && !options?.html) {
      this.hide();
      return;
    }
    if (this.autoHideTimer !== null) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }

    const padX = options?.closable ? 100 : options?.noWrap ? 140 : Math.min(142, Math.max(48, (text || '').length * 3.6));
    const clampedX = Math.max(padX, Math.min(window.innerWidth - padX, x));
    const clampedY = Math.max(12, Math.min(window.innerHeight - 12, y));

    this.text.set(text);
    this.html.set(options?.html ?? null);
    this.noWrap.set(options?.noWrap ?? false);
    this.interactive.set(options?.interactive ?? false);
    this.closable.set(options?.closable ?? false);
    this.onClose.set(options?.onClose ?? null);
    this.x.set(clampedX);
    this.y.set(clampedY);
    this.placement.set(placement);
    this.visible.set(true);

    if (autoHideMs > 0) {
      this.autoHideTimer = setTimeout(() => {
        this.autoHideTimer = null;
        this.hide();
      }, autoHideMs);
    }
  }

  close() {
    const cb = this.onClose();
    this.hide();
    cb?.();
  }

  hide() {
    if (this.autoHideTimer !== null) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
    this.html.set(null);
    this.noWrap.set(false);
    this.interactive.set(false);
    this.closable.set(false);
    this.onClose.set(null);
    this.visible.set(false);
  }
}

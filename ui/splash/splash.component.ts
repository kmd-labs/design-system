import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplashService } from './splash.service';

/**
 * Full-screen KMD splash loader with the official SVG logotype and progress bar.
 * Can be driven declaratively via `@Input()` properties OR automatically by injecting `SplashService`.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.scss'
})
export class SplashComponent implements AfterViewInit, OnDestroy {
  readonly splashService = inject(SplashService, { optional: true });

  @Input() visible?: boolean;
  @Input() fading?: boolean;
  @Input() progress?: number;
  @Input() status?: string;
  @Input() error?: boolean;
  @Output() revealed = new EventEmitter<void>();

  private emitted = false;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  get isVisible(): boolean {
    return this.visible !== undefined ? this.visible : (this.splashService?.visible() ?? true);
  }

  get isFading(): boolean {
    return this.fading !== undefined ? this.fading : (this.splashService?.fading() ?? false);
  }

  get currentProgress(): number {
    return this.progress !== undefined ? this.progress : (this.splashService?.progress() ?? 0);
  }

  get currentStatus(): string {
    return this.status !== undefined ? this.status : (this.splashService?.status() ?? '');
  }

  get isError(): boolean {
    return this.error !== undefined ? this.error : (this.splashService?.error() ?? false);
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.emitRevealed();
      return;
    }
    this.fallbackTimer = setTimeout(() => this.emitRevealed(), 6000);
  }

  onRevealAnimationEnd(event: AnimationEvent) {
    if (!event.animationName.endsWith('kmd-splash-reveal')) return;
    this.emitRevealed();
  }

  ngOnDestroy() {
    if (this.fallbackTimer !== null) clearTimeout(this.fallbackTimer);
  }

  private emitRevealed() {
    if (this.emitted) return;
    this.emitted = true;
    this.splashService?.revealed.set(true);
    this.revealed.emit();
  }
}

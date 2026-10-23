import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Design System Splash Component (`<app-splash>`).
 *
 * Full-screen KMD loader with the Borel wordmark, an orange accent dot and a
 * thin progress bar. Purely presentational: the host owns readiness detection,
 * timing and the fade-out, then unmounts the splash via `visible`.
 *
 * `revealed` fires once the wordmark reveal and the dot animation have both
 * finished (or immediately when reduced motion is requested), so a host can
 * keep the splash up until the brand animation is actually complete.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.scss'
})
export class SplashComponent implements AfterViewInit, OnDestroy {
  /** Whether the splash is mounted. */
  @Input() visible = true;

  /** Fade-out state controlled by the host. */
  @Input() fading = false;

  /** 0–100 progress for the thin bar. */
  @Input() progress = 0;

  /** Localized loading status announced to assistive technology. */
  @Input() status = '';

  /** Error state: tints the status text with the warning colour. */
  @Input() error = false;

  /** Emits once the wordmark reveal and dot animation have finished. */
  @Output() revealed = new EventEmitter<void>();

  private wordDone = false;
  private dotDone = false;
  private emitted = false;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit() {
    // Reduced motion skips both CSS animations, so there is nothing to wait for.
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.emitRevealed();
      return;
    }
    // Safety net if an animation event is missed (e.g. the tab was backgrounded).
    this.fallbackTimer = setTimeout(() => this.emitRevealed(), 1800);
  }

  onWordAnimationEnd(event: AnimationEvent) {
    if (event.animationName !== 'kmd-splash-reveal') return;
    this.wordDone = true;
    this.emitIfDone();
  }

  onDotAnimationEnd(event: AnimationEvent) {
    if (event.animationName !== 'kmd-splash-dot') return;
    this.dotDone = true;
    this.emitIfDone();
  }

  ngOnDestroy() {
    if (this.fallbackTimer !== null) clearTimeout(this.fallbackTimer);
  }

  private emitIfDone() {
    if (this.wordDone && this.dotDone) this.emitRevealed();
  }

  private emitRevealed() {
    if (this.emitted) return;
    this.emitted = true;
    this.revealed.emit();
  }
}

import { Injectable, NgZone, Signal, inject, signal } from '@angular/core';
import { BreakpointName, breakpointPx } from '../utils/breakpoints';

/**
 * Reactive viewport breakpoints. Widths come from `$breakpoints` in `_variables.scss`
 * (via the `--bp-*` CSS variables), so templates can react exactly like `respond-to()` does.
 */
@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private zone = inject(NgZone);

  /** True while the viewport is at or below the `mobile` breakpoint. */
  readonly mobile: Signal<boolean> = this.atMost('mobile');
  /** True while the viewport is at or below the `tablet` breakpoint. */
  readonly tablet: Signal<boolean> = this.atMost('tablet');
  /** True while the viewport is mobile landscape (≤500px height, ≤960px width, landscape). */
  readonly mobileLandscape: Signal<boolean> = this.createMobileLandscape();

  private createMobileLandscape(): Signal<boolean> {
    const state = signal(false);
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return state;
    const mql = window.matchMedia(
      `(max-height: ${breakpointPx('mobile-landscape')}px) and (orientation: landscape) and (max-width: ${breakpointPx('tablet')}px)`
    );
    state.set(mql.matches);
    mql.addEventListener('change', e => this.zone.run(() => state.set(e.matches)));
    return state;
  }

  private atMost(name: BreakpointName): Signal<boolean> {
    const state = signal(false);
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return state;
    const mql = window.matchMedia(`(max-width: ${breakpointPx(name)}px)`);
    state.set(mql.matches);
    mql.addEventListener('change', e => this.zone.run(() => state.set(e.matches)));
    return state;
  }
}

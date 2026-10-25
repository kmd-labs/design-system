/**
 * Breakpoints are defined once in `src/_variables.scss` ($breakpoints) and emitted as
 * `--bp-<name>` CSS custom properties in `src/styles.scss`. This helper reads them so
 * TypeScript never hard-codes a width that could drift from the stylesheets.
 */
export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'mobile-landscape';

const FALLBACK: Record<BreakpointName, number> = { mobile: 640, tablet: 960, desktop: 1280, 'mobile-landscape': 500 };

export function breakpointPx(name: BreakpointName): number {
  if (typeof document === 'undefined') return FALLBACK[name];
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--bp-${name}`).trim();
  const px = parseFloat(raw);
  return Number.isFinite(px) ? px : FALLBACK[name];
}

/** True when the viewport is at or below the named breakpoint (mirrors `respond-to`). */
export function isAtMost(name: BreakpointName): boolean {
  if (name === 'mobile-landscape') {
    return isMobileLandscape();
  }
  return window.innerWidth <= breakpointPx(name);
}

/** True when the viewport is in landscape orientation with short height (≤500px) and tablet width (≤960px). */
export function isMobileLandscape(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerHeight <= breakpointPx('mobile-landscape') &&
    window.innerWidth <= breakpointPx('tablet') &&
    window.innerWidth > window.innerHeight;
}

import { Injectable, computed, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

/**
 * Provides runtime access to SCSS design token CSS custom properties (`--color-*`, `--font-family`)
 * emitted on `:root` from `_variables.scss`, and coordinates opt-in light/dark mode state.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _mode = signal<ThemeMode>(this.readDomMode());

  /** Active resolved theme mode (`'light'` by default unless `<html data-theme="dark">` is set). */
  readonly mode = this._mode.asReadonly();
  readonly isDark = computed(() => this._mode() === 'dark');

  /** Theme-appropriate KMD logotype SVG asset path. */
  readonly logoSrc = computed(() =>
    this.isDark()
      ? 'assets/design-system/logo/kmd-white-orange.svg'
      : 'assets/design-system/logo/kmd-black-orange.svg'
  );

  /** Applies `<html data-theme>` and updates `<meta name="theme-color">`. Persistence belongs to the host app. */
  setMode(mode: ThemeMode): void {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
      const bgDeep = this.getTokenColor('bg-deep', '');
      if (bgDeep) {
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bgDeep);
      }
    }
    this._mode.set(mode);
  }

  private readDomMode(): ThemeMode {
    return typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'dark'
      : 'light';
  }
  /** Reads a `--color-<token>` CSS custom property from `:root` (derived from `_variables.scss`). */
  getTokenColor(token: string, fallback = '#000000'): string {
    if (typeof document === 'undefined') return fallback;
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(`--color-${token}`)
      .trim();
    return val || fallback;
  }

  /** Reads `--font-family` from `:root` so `<canvas>` 2D/3D text uses the exact same font ("Inter", sans-serif) as the DOM UI. */
  getFontFamily(fallback = '"Inter", sans-serif'): string {
    if (typeof document === 'undefined') return fallback;
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue('--font-family')
      .trim();
    return val || fallback;
  }

  /** Reads `--opacity-<token>` from `:root` with a numerical fallback. */
  getTokenOpacity(token: string, fallback = 1.0): number {
    if (typeof document === 'undefined') return fallback;
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue(`--opacity-${token}`)
      .trim();
    const num = parseFloat(val);
    return isNaN(num) ? fallback : num;
  }
}

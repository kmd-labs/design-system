import { Injectable } from '@angular/core';

/**
 * Provides runtime access to SCSS design token CSS custom properties (`--color-*`, `--font-family`)
 * emitted on `:root` from `_variables.scss`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
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
}

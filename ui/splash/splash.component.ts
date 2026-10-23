import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Design System Splash Component (`<app-splash>`).
 *
 * Full-screen KMD loader with the Borel wordmark, an orange accent dot and a
 * thin progress bar. Purely presentational: the host owns readiness detection,
 * timing and the fade-out, then unmounts the splash via `visible`.
 */
@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.scss'
})
export class SplashComponent {
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
}

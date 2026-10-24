import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SplashService {
  /** Whether the splash screen container is rendered in the DOM. */
  readonly visible = signal(true);

  /** Whether the splash screen is playing its fade-out exit transition. */
  readonly fading = signal(false);

  /** Numeric loading progress (0 - 100). */
  readonly progress = signal(0);

  /** Descriptive status text shown beneath the progress bar. */
  readonly status = signal('');

  /** Whether a critical loading error has occurred. */
  readonly error = signal(false);

  /** Emitted once the brand mark reveal animation finishes. */
  readonly revealed = signal(false);

  private fadeTimer: ReturnType<typeof setTimeout> | null = null;

  show() {
    this.fading.set(false);
    this.visible.set(true);
  }

  setProgress(progress: number, status?: string) {
    this.progress.set(Math.max(0, Math.min(100, Math.round(progress))));
    if (status !== undefined) {
      this.status.set(status);
    }
  }

  setStatus(status: string) {
    this.status.set(status);
  }

  setError(status?: string) {
    this.error.set(true);
    if (status !== undefined) {
      this.status.set(status);
    }
  }

  finish(fadeMs = 620) {
    if (!this.visible() || this.fading()) return;
    this.fading.set(true);
    if (this.fadeTimer !== null) clearTimeout(this.fadeTimer);
    this.fadeTimer = setTimeout(() => {
      this.visible.set(false);
      this.fading.set(false);
    }, fadeMs);
  }
}

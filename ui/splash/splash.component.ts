import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.scss'
})
export class SplashComponent implements AfterViewInit, OnDestroy {
  @Input() visible = true;
  @Input() fading = false;
  @Input() progress = 0;
  @Input() status = '';
  @Input() error = false;
  @Output() revealed = new EventEmitter<void>();

  private emitted = false;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.revealed.emit();
  }
}

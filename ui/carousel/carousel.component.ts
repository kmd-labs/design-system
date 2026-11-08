import {
  ChangeDetectorRef,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';
import { CarouselPill, CarouselSlide } from './carousel.model';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.scss'
})
export class CarouselComponent<T = any> implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  // Inputs
  readonly items = input.required<T[]>();
  readonly pills = input<CarouselPill[]>([]);
  readonly ariaLabel = input<string>('');
  readonly prevAria = input<string>('Previous');
  readonly nextAria = input<string>('Next');
  readonly autoPlayMs = input<number>(0);
  readonly stopOnInteraction = input<boolean>(true);
  readonly slideWidth = input<string>('clamp(280px, 80vw, 440px)');
  readonly slideGap = input<string>('16px');

  // Outputs
  @Output() activeIndexChange = new EventEmitter<number>();

  // Template projection for slide content
  @ContentChild(TemplateRef) slideTemplate!: TemplateRef<{
    $implicit: T;
    index: number;
    isActive: boolean;
    isPeeking: boolean;
    isClone: boolean;
    hasDragged: boolean;
  }>;

  // Icons
  readonly chevronLeftIcon = ChevronLeft;
  readonly chevronRightIcon = ChevronRight;

  // Internal reactive state
  readonly trackIndex = signal(1);
  readonly transitionEnabled = signal(true);
  readonly isPaused = signal(false);
  readonly dragOffsetPx = signal(0);
  readonly isDragging = signal(false);
  readonly userInteracted = signal(false);

  private autoTimer?: ReturnType<typeof setInterval>;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private isHorizontalDrag = false;
  private activePointerId?: number;
  hasDragged = false;

  readonly activeRealIndex = computed(() => {
    const list = this.items();
    const count = list?.length || 1;
    const trackIdx = this.trackIndex();
    return ((trackIdx - 1) % count + count) % count;
  });

  readonly slides = computed<CarouselSlide<T>[]>(() => {
    const list = this.items();
    if (!list || list.length === 0) return [];
    const count = list.length;
    const last = list[count - 1];
    const first = list[0];

    return [
      { slideId: 'clone-prefix', realIndex: count - 1, item: last, isClone: true },
      ...list.map((item, idx) => ({
        slideId: `real-${idx}`,
        realIndex: idx,
        item,
        isClone: false
      })),
      { slideId: 'clone-suffix', realIndex: 0, item: first, isClone: true }
    ];
  });

  ngOnInit(): void {
    this.restartAutoPlay();
    // Emit initial active index
    this.activeIndexChange.emit(this.activeRealIndex());
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  trackSlideById(_index: number, slide: CarouselSlide<T>): string {
    return slide.slideId;
  }

  setPaused(paused: boolean): void {
    this.isPaused.set(paused);
  }

  markUserInteracted(): void {
    this.userInteracted.set(true);
    this.stopAutoPlay();
  }

  select(realIndex: number, isUserAction = true): void {
    if (isUserAction && this.stopOnInteraction()) {
      this.markUserInteracted();
    }
    const list = this.items();
    if (!list || list.length === 0) return;
    const count = list.length;
    const target = ((realIndex % count) + count) % count;
    this.transitionEnabled.set(true);
    this.trackIndex.set(target + 1);
    this.notifyActiveChange();
    if (!this.userInteracted()) {
      this.restartAutoPlay();
    }
  }

  prev(isUserAction = true): void {
    if (isUserAction && this.stopOnInteraction()) {
      this.markUserInteracted();
    }
    this.transitionEnabled.set(true);
    this.trackIndex.update((i) => i - 1);
    this.notifyActiveChange();
    if (!this.userInteracted()) {
      this.restartAutoPlay();
    }
  }

  next(isUserAction = true): void {
    if (isUserAction && this.stopOnInteraction()) {
      this.markUserInteracted();
    }
    this.transitionEnabled.set(true);
    this.trackIndex.update((i) => i + 1);
    this.notifyActiveChange();
    if (!this.userInteracted()) {
      this.restartAutoPlay();
    }
  }

  onTrackTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName !== 'transform') return;
    const list = this.items();
    if (!list || list.length === 0) return;
    const count = list.length;
    const current = this.trackIndex();

    // Boundary check for infinite loop
    if (current === 0) {
      // Landed on prefix clone -> snap silently to real last slide
      this.transitionEnabled.set(false);
      this.trackIndex.set(count);
      this.cdr.detectChanges();
    } else if (current === count + 1) {
      // Landed on suffix clone -> snap silently to real first slide
      this.transitionEnabled.set(false);
      this.trackIndex.set(1);
      this.cdr.detectChanges();
    }
  }

  onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (this.stopOnInteraction()) {
      this.markUserInteracted();
    }
    this.activePointerId = event.pointerId;
    this.pointerStartX = event.clientX;
    this.pointerStartY = event.clientY;
    this.isHorizontalDrag = false;
    this.hasDragged = false;
    this.dragOffsetPx.set(0);
    this.isPaused.set(true);

    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;

    const dx = event.clientX - this.pointerStartX;
    const dy = event.clientY - this.pointerStartY;

    if (!this.isHorizontalDrag) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        this.isHorizontalDrag = true;
        this.isDragging.set(true);
        this.transitionEnabled.set(false);
      } else if (Math.abs(dy) > 10) {
        this.releasePointer(event);
        return;
      }
    }

    if (this.isHorizontalDrag) {
      event.preventDefault();
      this.dragOffsetPx.set(dx);
      if (Math.abs(dx) > 6) {
        this.hasDragged = true;
      }
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;
    this.finishDrag(event);
  }

  onPointerCancel(event: PointerEvent): void {
    if (this.activePointerId !== event.pointerId) return;
    this.finishDrag(event);
  }

  onSlideClick(slideIndex: number): void {
    if (this.hasDragged) return;
    if (this.stopOnInteraction()) {
      this.markUserInteracted();
    }
    if (this.trackIndex() !== slideIndex) {
      this.transitionEnabled.set(true);
      this.trackIndex.set(slideIndex);
      this.notifyActiveChange();
      if (!this.userInteracted()) {
        this.restartAutoPlay();
      }
    }
  }

  private finishDrag(event: PointerEvent): void {
    const dx = this.dragOffsetPx();
    const wasDragging = this.isHorizontalDrag;
    this.releasePointer(event);

    this.transitionEnabled.set(true);
    this.dragOffsetPx.set(0);
    this.isDragging.set(false);
    this.isHorizontalDrag = false;

    if (wasDragging) {
      if (this.stopOnInteraction()) {
        this.markUserInteracted();
      }
      const threshold = 45;
      if (dx < -threshold) {
        this.next(false);
      } else if (dx > threshold) {
        this.prev(false);
      }
    }

    // Reset hasDragged after click dispatch cycle
    setTimeout(() => {
      this.hasDragged = false;
    }, 100);

    this.isPaused.set(false);
    if (!this.userInteracted()) {
      this.restartAutoPlay();
    }
  }

  private releasePointer(event: PointerEvent): void {
    try {
      const target = event.currentTarget as HTMLElement;
      if (target?.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore
    }
    this.activePointerId = undefined;
  }

  private notifyActiveChange(): void {
    const realIdx = this.activeRealIndex();
    this.activeIndexChange.emit(realIdx);
  }

  private restartAutoPlay(): void {
    this.stopAutoPlay();
    if (this.userInteracted() && this.stopOnInteraction()) return;
    const interval = this.autoPlayMs();
    if (interval <= 0) return;

    this.zone.runOutsideAngular(() => {
      this.autoTimer = setInterval(() => {
        if (this.isPaused() || this.isDragging()) return;
        this.zone.run(() => {
          this.next(false);
        });
      }, interval);
    });
  }

  private stopAutoPlay(): void {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = undefined;
    }
  }
}

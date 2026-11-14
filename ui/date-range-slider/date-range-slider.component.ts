import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, input, model, output, signal } from '@angular/core';
import { DateRangeValue } from './date-range-slider.model';

const MS_PER_DAY = 86_400_000;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseIsoDay(iso: string): number | null {
  const m = ISO_DATE_RE.exec((iso ?? '').trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() + 1 !== month ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.floor(utc / MS_PER_DAY);
}

function formatIsoDay(day: number): string {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Dual-handle date range slider with two grabbable circular thumbs,
 * optional synchronized `<input type="date">` boxes, keyboard navigation,
 * and missing/unset visual states.
 */
@Component({
  selector: 'app-date-range-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-range-slider.component.html',
  styleUrl: './date-range-slider.component.scss'
})
export class DateRangeSliderComponent {
  @ViewChild('trackRef', { static: true }) trackRef!: ElementRef<HTMLDivElement>;

  readonly minDate = input<string>('2000-01-01');
  readonly maxDate = input<string>(formatIsoDay(Math.floor(Date.now() / MS_PER_DAY)));
  readonly startDate = model<string>('');
  readonly endDate = model<string>('');
  readonly startLabel = input<string>('');
  readonly endLabel = input<string>('');
  readonly ariaLabel = input<string>('Date range');
  readonly showInputs = input<boolean>(true);
  readonly missingStart = input<boolean>(false);
  readonly missingEnd = input<boolean>(false);
  readonly stepDays = input<number>(1);
  readonly disabled = input<boolean>(false);

  readonly rangeChange = output<DateRangeValue>();

  readonly activeThumb = signal<'start' | 'end' | null>(null);
  readonly lastMovedThumb = signal<'start' | 'end'>('end');

  readonly minDay = computed(() => parseIsoDay(this.minDate()) ?? 10957);
  readonly maxDay = computed(() => {
    const lo = this.minDay();
    const parsed = parseIsoDay(this.maxDate());
    return parsed !== null && parsed > lo ? parsed : lo + 1;
  });

  readonly minIso = computed(() => formatIsoDay(this.minDay()));
  readonly maxIso = computed(() => formatIsoDay(this.maxDay()));

  readonly hasStart = computed(() => parseIsoDay(this.startDate()) !== null);
  readonly hasEnd = computed(() => parseIsoDay(this.endDate()) !== null);

  private readonly rawStartDay = computed(() => {
    const lo = this.minDay();
    const hi = this.maxDay();
    const parsed = parseIsoDay(this.startDate());
    return parsed === null ? lo : Math.max(lo, Math.min(hi, parsed));
  });

  private readonly rawEndDay = computed(() => {
    const lo = this.minDay();
    const hi = this.maxDay();
    const parsed = parseIsoDay(this.endDate());
    return parsed === null ? hi : Math.max(lo, Math.min(hi, parsed));
  });

  readonly displayStartDay = computed(() => Math.min(this.rawStartDay(), this.rawEndDay()));
  readonly displayEndDay = computed(() => Math.max(this.rawStartDay(), this.rawEndDay()));

  readonly startPct = computed(() => {
    const span = this.maxDay() - this.minDay();
    return span > 0 ? ((this.displayStartDay() - this.minDay()) / span) * 100 : 0;
  });

  readonly endPct = computed(() => {
    const span = this.maxDay() - this.minDay();
    return span > 0 ? ((this.displayEndDay() - this.minDay()) / span) * 100 : 100;
  });

  readonly rangeWidthPct = computed(() => Math.max(0, this.endPct() - this.startPct()));

  readonly startElevated = computed(
    () =>
      this.activeThumb() === 'start' ||
      this.lastMovedThumb() === 'start' ||
      (this.startPct() === this.endPct() && this.startPct() > 50)
  );

  onStartInput(value: string): void {
    this.startDate.set(value);
    this.rangeChange.emit({ start: value, end: this.endDate() });
  }

  onEndInput(value: string): void {
    this.endDate.set(value);
    this.rangeChange.emit({ start: this.startDate(), end: value });
  }

  onThumbPointerDown(thumb: 'start' | 'end', event: PointerEvent): void {
    if (this.disabled()) return;
    event.stopPropagation();
    event.preventDefault();
    this.activeThumb.set(thumb);
    this.lastMovedThumb.set(thumb);
    this.trackRef.nativeElement.setPointerCapture(event.pointerId);
  }

  onTrackPointerDown(event: PointerEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    const day = this.dayFromClientX(event.clientX);
    const sDay = this.displayStartDay();
    const eDay = this.displayEndDay();
    const distStart = Math.abs(day - sDay);
    const distEnd = Math.abs(day - eDay);
    const thumb: 'start' | 'end' =
      distStart === distEnd ? (day > eDay ? 'end' : 'start') : distStart < distEnd ? 'start' : 'end';

    this.activeThumb.set(thumb);
    this.lastMovedThumb.set(thumb);
    this.trackRef.nativeElement.setPointerCapture(event.pointerId);
    this.commitThumbDay(thumb, day);
  }

  onTrackPointerMove(event: PointerEvent): void {
    const thumb = this.activeThumb();
    if (!thumb || this.disabled()) return;
    this.commitThumbDay(thumb, this.dayFromClientX(event.clientX));
  }

  onTrackPointerUp(event: PointerEvent): void {
    if (this.activeThumb()) {
      this.activeThumb.set(null);
      if (this.trackRef.nativeElement.hasPointerCapture(event.pointerId)) {
        this.trackRef.nativeElement.releasePointerCapture(event.pointerId);
      }
    }
  }

  onThumbKeyDown(thumb: 'start' | 'end', event: KeyboardEvent): void {
    if (this.disabled()) return;
    const step = Math.max(1, this.stepDays());
    const delta = event.shiftKey ? step * 30 : step;
    const lo = this.minDay();
    const hi = this.maxDay();
    const cur = thumb === 'start' ? this.displayStartDay() : this.displayEndDay();

    let next: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = cur - delta;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = cur + delta;
    else if (event.key === 'PageDown') next = cur - 365;
    else if (event.key === 'PageUp') next = cur + 365;
    else if (event.key === 'Home') next = thumb === 'start' ? lo : this.displayStartDay();
    else if (event.key === 'End') next = thumb === 'end' ? hi : this.displayEndDay();

    if (next !== null) {
      event.preventDefault();
      this.lastMovedThumb.set(thumb);
      this.commitThumbDay(thumb, next);
    }
  }

  private dayFromClientX(clientX: number): number {
    const rect = this.trackRef.nativeElement.getBoundingClientRect();
    const ratio = rect.width > 0 ? Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) : 0;
    const step = Math.max(1, this.stepDays());
    const lo = this.minDay();
    const hi = this.maxDay();
    const raw = lo + ratio * (hi - lo);
    const snapped = lo + Math.round((raw - lo) / step) * step;
    return Math.max(lo, Math.min(hi, snapped));
  }

  private commitThumbDay(thumb: 'start' | 'end', rawDay: number): void {
    const lo = this.minDay();
    const hi = this.maxDay();

    if (thumb === 'start') {
      const boundEnd = this.hasEnd() ? this.rawEndDay() : hi;
      const clamped = Math.max(lo, Math.min(boundEnd, rawDay));
      const iso = formatIsoDay(clamped);
      if (iso !== this.startDate()) {
        this.startDate.set(iso);
        this.rangeChange.emit({ start: iso, end: this.endDate() });
      }
    } else {
      const boundStart = this.hasStart() ? this.rawStartDay() : lo;
      const clamped = Math.min(hi, Math.max(boundStart, rawDay));
      const iso = formatIsoDay(clamped);
      if (iso !== this.endDate()) {
        this.endDate.set(iso);
        this.rangeChange.emit({ start: this.startDate(), end: iso });
      }
    }
  }
}

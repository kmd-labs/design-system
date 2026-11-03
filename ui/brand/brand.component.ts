import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Handshake } from 'lucide-angular';
import { BreakpointService } from '../../services/breakpoint.service';
import { AboutService } from '../about/about.service';
import { ABOUT_DICTS } from '../about/about.data';
import { PopupService } from '../popup/popup.service';

/**
 * Standardized KMD Labs Brand Logotype & Interactive Collaboration Pill.
 * Shows the official KMD logotype and application name. When any modal dialog or popup
 * is open (or on hover/expand when no appName is present), smoothly transitions to display
 * "Open to new projects" with the Handshake icon. Clicking triggers the About modal.
 */
@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.scss'
})
export class BrandComponent {
  private readonly bp = inject(BreakpointService);
  private readonly about = inject(AboutService, { optional: true });
  private readonly popup = inject(PopupService, { optional: true });

  @Input() appName?: string;
  @Input() cta?: string;
  @Input() lang?: 'en' | 'pl' | 'es';
  @Input() logoSrc = 'assets/design-system/logo/kmd-black-orange.svg';
  @Input() logoAlt = 'KMD';
  @Input() expanded?: boolean;
  @Input() popupOpen?: boolean;

  @Output() readonly btnClick = new EventEmitter<MouseEvent>();

  readonly ctaIcon = Handshake;

  private readonly hovered = signal(false);
  private readonly mobileExpanded = signal(false);

  readonly isPopupOpen = computed<boolean>(() => {
    if (typeof this.popupOpen === 'boolean') return this.popupOpen;
    return Boolean(this.popup && this.popup.config() !== null);
  });

  readonly isCtaVisible = computed<boolean>(() => {
    if (this.isPopupOpen()) return true;
    return !this.appName;
  });

  readonly resolvedLang = computed<'en' | 'pl' | 'es'>(() => {
    if (this.lang && (this.lang === 'en' || this.lang === 'pl' || this.lang === 'es')) {
      return this.lang;
    }
    const serviceLang = this.about?.currentLang();
    if (serviceLang && (serviceLang === 'en' || serviceLang === 'pl' || serviceLang === 'es')) {
      return serviceLang;
    }
    if (typeof document !== 'undefined') {
      const docLang = document.documentElement.lang?.slice(0, 2);
      if (docLang === 'pl' || docLang === 'es' || docLang === 'en') {
        return docLang;
      }
    }
    return 'en';
  });

  readonly resolvedCta = computed<string>(() => {
    if (this.cta) return this.cta;
    const dict = ABOUT_DICTS[this.resolvedLang()] ?? ABOUT_DICTS.en;
    return dict.cta ?? 'Open to new projects';
  });

  readonly isExpanded = computed<boolean>(() => {
    if (typeof this.expanded === 'boolean') return this.expanded;
    if (this.isPopupOpen()) return true;
    if (this.bp.mobileLandscape()) return true;
    if (!this.bp.mobile()) return true;
    return this.mobileExpanded();
  });

  readonly ariaLabel = computed<string>(() => {
    const dict = ABOUT_DICTS[this.resolvedLang()] ?? ABOUT_DICTS.en;
    if (this.isCtaVisible()) {
      return `${dict.openAbout} – ${this.resolvedCta()}`;
    }
    return `${dict.openAbout} – ${this.appName ?? 'KMD'}`;
  });

  onHover(entering: boolean): void {
    this.hovered.set(entering);
    if (this.bp.mobile() && !this.bp.mobileLandscape() && !this.isPopupOpen()) {
      this.mobileExpanded.set(entering);
    }
  }

  onBrandClick(event: MouseEvent): void {
    if (this.bp.mobile() && !this.bp.mobileLandscape() && !this.isPopupOpen()) {
      if (!this.mobileExpanded()) {
        event.stopPropagation();
        this.mobileExpanded.set(true);
        return;
      }
    }

    this.mobileExpanded.set(false);
    if (this.btnClick.observed) {
      this.btnClick.emit(event);
    } else if (this.about) {
      this.about.open({ lang: this.resolvedLang() });
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    if (!this.mobileExpanded() || this.isPopupOpen()) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.header__brand')) return;
    this.mobileExpanded.set(false);
  }
}

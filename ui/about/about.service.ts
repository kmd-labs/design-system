import { Injectable, computed, inject, signal } from '@angular/core';
import { PopupService } from '../popup/popup.service';
import { AboutModalComponent } from './about-modal.component';
import { ABOUT_DICTS } from './about.data';

export interface OpenAboutOptions {
  lang?: 'en' | 'pl' | 'es';
  title?: string;
  subtitle?: string;
  closeLabel?: string;
  onClose?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class AboutService {
  private readonly popup = inject(PopupService);

  readonly currentLang = signal<'en' | 'pl' | 'es'>('en');

  setLang(lang: 'en' | 'pl' | 'es') {
    this.currentLang.set(lang);
  }

  open(options?: OpenAboutOptions) {
    const lang = options?.lang ?? this.currentLang();
    const dict = ABOUT_DICTS[lang] ?? ABOUT_DICTS.en;

    this.popup.open({
      id: 'about',
      title: computed(() => options?.title ?? dict.title),
      subtitle: computed(() => options?.subtitle ?? dict.kicker),
      component: AboutModalComponent,
      componentInputs: { lang },
      size: 'lg',
      actions: [
        {
          label: computed(() => options?.closeLabel ?? (lang === 'pl' ? 'Zamknij' : lang === 'es' ? 'Cerrar' : 'Close')),
          variant: 'default'
        }
      ],
      onClose: options?.onClose
    });
  }

  close() {
    if (this.popup.config()?.id === 'about') {
      this.popup.close();
    }
  }
}

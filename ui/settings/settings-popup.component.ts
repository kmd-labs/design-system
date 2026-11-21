import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Sun, Moon } from 'lucide-angular';
import { ThemeMode, ThemeService } from '../../services/theme.service';

export interface SettingsLangOption {
  id: string;
  label: string;
}

@Component({
  selector: 'kmd-settings-popup',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './settings-popup.component.html',
  styleUrl: './settings-popup.component.scss'
})
export class SettingsPopupComponent {
  readonly theme = inject(ThemeService);

  readonly sunIcon = Sun;
  readonly moonIcon = Moon;

  @Input() themeLabel = 'Appearance';
  @Input() lightLabel = 'Light';
  @Input() darkLabel = 'Dark';
  @Input() langLabel = 'Language';
  @Input() languages: SettingsLangOption[] = [
    { id: 'en', label: 'English' },
    { id: 'pl', label: 'Polski' }
  ];
  @Input() set activeLang(val: string) {
    this.selectedLang.set(val);
  }
  @Input() onThemeChange?: (mode: ThemeMode) => void;
  @Input() onLangChange?: (lang: string) => void;

  readonly selectedLang = signal<string>('en');

  selectTheme(mode: ThemeMode): void {
    this.theme.setMode(mode);
    this.onThemeChange?.(mode);
  }

  selectLang(langId: string): void {
    this.selectedLang.set(langId);
    this.onLangChange?.(langId);
  }
}

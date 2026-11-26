/**
 * Generates core Angular 21 application config, i18n, and HUD shell files.
 */
export function createAppFiles({ appSlug, appTitle, appDescription = '', withGlobe }) {
  const htmlDescription =
    appDescription || 'Interactive scientific data visualization by KMD Labs.';
  return [
    ['.npmrc', 'legacy-peer-deps=true\n'],
    [
      'package.json',
      JSON.stringify(
        {
          name: appSlug,
          version: '1.0.0',
          scripts: {
            ng: 'ng',
            start: 'ng serve',
            'start-devcontainer': 'ng serve --host 0.0.0.0',
            build: 'ng build',
            'build:gh-pages': `ng build --base-href /${appSlug}/`,
            'build:og':
              '[ -d src/design-system/node_modules ] || npm ci --prefix src/design-system --silent; node src/design-system/cli/og.mjs',
            watch: 'ng build --watch --configuration development',
            'setup:github': 'node scripts/setup-github.mjs'
          },
          kmd: {
            og: {
              title: appTitle,
              description: appDescription
            }
          },
          private: true,
          dependencies: {
            '@angular/animations': '~21.2.0',
            '@angular/common': '~21.2.0',
            '@angular/compiler': '~21.2.0',
            '@angular/core': '~21.2.0',
            '@angular/forms': '~21.2.0',
            '@angular/platform-browser': '~21.2.0',
            '@angular/platform-browser-dynamic': '~21.2.0',
            '@angular/router': '~21.2.0',
            'lucide-angular': '^1.0.0',
            rxjs: '~7.8.0',
            ...(withGlobe ? { three: '^0.187.0' } : {}),
            tslib: '^2.3.0',
            'zone.js': '~0.15.0'
          },
          devDependencies: {
            '@angular-devkit/build-angular': '~21.2.0',
            '@angular/cli': '~21.2.0',
            '@angular/compiler-cli': '~21.2.0',
            ...(withGlobe ? { '@types/three': '^0.187.0' } : {}),
            typescript: '~5.9.0'
          }
        },
        null,
        2
      ) + '\n'
    ],
    [
      'angular.json',
      JSON.stringify(
        {
          $schema: './node_modules/@angular/cli/lib/config/schema.json',
          version: 1,
          newProjectRoot: 'projects',
          projects: {
            [appSlug]: {
              projectType: 'application',
              root: '',
              sourceRoot: 'src',
              prefix: 'app',
              architect: {
                build: {
                  builder: '@angular-devkit/build-angular:application',
                  options: {
                    outputPath: `dist/${appSlug}`,
                    index: 'src/index.html',
                    browser: 'src/main.ts',
                    polyfills: ['zone.js'],
                    tsConfig: 'tsconfig.app.json',
                    assets: [
                      'src/assets',
                      {
                        glob: '**/*',
                        input: 'src/design-system/assets',
                        output: 'assets/design-system'
                      }
                    ],
                    styles: ['src/styles.scss'],
                    scripts: [],
                    stylePreprocessorOptions: {
                      includePaths: ['src', 'src/design-system']
                    }
                  },
                  configurations: {
                    production: {
                      optimization: true,
                      outputHashing: 'all'
                    },
                    development: {
                      optimization: false,
                      extractLicenses: false,
                      sourceMap: true
                    }
                  },
                  defaultConfiguration: 'production'
                },
                serve: {
                  builder: '@angular-devkit/build-angular:dev-server',
                  configurations: {
                    production: { buildTarget: `${appSlug}:build:production` },
                    development: { buildTarget: `${appSlug}:build:development` }
                  },
                  defaultConfiguration: 'development'
                }
              }
            }
          }
        },
        null,
        2
      ) + '\n'
    ],
    [
      'tsconfig.json',
      JSON.stringify(
        {
          compileOnSave: false,
          compilerOptions: {
            baseUrl: '.',
            paths: {
              '@kmd/design-system': ['./src/design-system/index.ts'],
              '@kmd/design-system/*': ['./src/design-system/*']
            },
            outDir: './dist/out-tsc',
            strict: true,
            noImplicitOverride: true,
            noPropertyAccessFromIndexSignature: true,
            noImplicitReturns: true,
            noFallthroughCasesInSwitch: true,
            skipLibCheck: true,
            esModuleInterop: true,
            sourceMap: true,
            declaration: false,
            experimentalDecorators: true,
            moduleResolution: 'bundler',
            importHelpers: true,
            target: 'ES2022',
            module: 'ES2022',
            useDefineForClassFields: false,
            lib: ['ES2022', 'dom']
          },
          angularCompilerOptions: {
            enableI18nLegacyMessageIdFormat: false,
            strictInjectionParameters: true,
            strictInputAccessModifiers: true,
            strictTemplates: true
          }
        },
        null,
        2
      ) + '\n'
    ],
    [
      'tsconfig.app.json',
      JSON.stringify(
        {
          extends: './tsconfig.json',
          compilerOptions: {
            outDir: './out-tsc/app',
            types: []
          },
          files: ['src/main.ts'],
          include: ['src/**/*.d.ts']
        },
        null,
        2
      ) + '\n'
    ],
    ['.gitignore', `dist/\nnode_modules/\n.angular/\n.DS_Store\n*.log\n`],
    ['src/assets/.gitkeep', ''],
    [
      'src/index.html',
      `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>KMD · ${appTitle}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${htmlDescription}">
  <meta name="theme-color" content="#f5f7fb">
  <link rel="icon" type="image/svg+xml" href="assets/design-system/favicon.svg">
  <link rel="alternate icon" type="image/x-icon" href="assets/design-system/favicon.ico">

  <!-- Open Graph / Social Media Preview -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="KMD Labs">
  <meta property="og:title" content="KMD · ${appTitle}">
  <meta property="og:description" content="${htmlDescription}">
  <meta property="og:image" content="https://kmd-labs.github.io/${appSlug}/assets/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="KMD · ${appTitle}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="KMD · ${appTitle}">
  <meta name="twitter:description" content="${htmlDescription}">
  <meta name="twitter:image" content="https://kmd-labs.github.io/${appSlug}/assets/og-image.png">
  <meta name="twitter:image:alt" content="KMD · ${appTitle}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`
    ],
    ['src/styles.scss', `@use "variables" as *;\n@use "base";\n`],
    [
      'src/main.ts',
      `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch(err => console.error(err));
`
    ],
    [
      'src/app/core/i18n/i18n.types.ts',
      `export type Lang = 'en' | 'pl';

/**
 * Every user-facing text of the application in one language.
 * Add new translation keys here first so TypeScript enforces parity across en.ts and pl.ts.
 */
export interface Dict {
  htmlLang: string;
  docTitle: string;
  langName: string;

  // Top HUD & Navigation
  settingsTitle: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  changeLanguage: string;
  chooseView: string;
  viewPrimary: string;
  viewSecondary: string;
  stageAriaLabel: string;

  // Bottom Dock & Glossary
  timelineLabel: string;
  glossary: string;
  glossaryDesc: string;
  close: string;

  // Application-specific keys (add below in both en.ts and pl.ts):
}
`
    ],
    [
      'src/app/core/i18n/en.ts',
      `import { Dict } from './i18n.types';

export const EN: Dict = {
  htmlLang: 'en',
  docTitle: 'KMD · ${appTitle}',
  langName: 'English',

  // Top HUD & Navigation
  settingsTitle: 'Settings',
  themeLabel: 'Appearance',
  themeLight: 'Light',
  themeDark: 'Dark',
  changeLanguage: 'Language',
  chooseView: 'View',
  viewPrimary: 'Overview',
  viewSecondary: 'Analysis',
  stageAriaLabel: '${appTitle} Visualization',

  // Bottom Dock & Glossary
  timelineLabel: 'Timeline',
  glossary: 'Glossary',
  glossaryDesc: '',
  close: 'Close'

  // Application-specific keys:
};
`
    ],
    [
      'src/app/core/i18n/pl.ts',
      `import { Dict } from './i18n.types';

export const PL: Dict = {
  htmlLang: 'pl',
  docTitle: 'KMD · ${appTitle}',
  langName: 'Polski',

  // Top HUD & Navigation
  settingsTitle: 'Ustawienia',
  themeLabel: 'Wygląd',
  themeLight: 'Jasny',
  themeDark: 'Ciemny',
  changeLanguage: 'Język',
  chooseView: 'Widok',
  viewPrimary: 'Przegląd',
  viewSecondary: 'Analiza',
  stageAriaLabel: 'Wizualizacja ${appTitle}',

  // Bottom Dock & Glossary
  timelineLabel: 'Oś czasu',
  glossary: 'Słowniczek',
  glossaryDesc: '',
  close: 'Zamknij'

  // Application-specific keys:
};
`
    ],
    [
      'src/app/core/i18n/i18n.service.ts',
      `import { Injectable, computed, effect, signal } from '@angular/core';
import { Dict, Lang } from './i18n.types';
import { EN } from './en';
import { PL } from './pl';

const DICTS: Record<Lang, Dict> = { en: EN, pl: PL };
const STORAGE_KEY = '${appSlug}.lang';

/**
 * Manages UI language and localized texts.
 * Resolves initial language from localStorage ('${appSlug}.lang') or Navigator API,
 * falling back to 'en', and persists selection to localStorage.
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly dicts = DICTS;
  readonly langs: Lang[] = ['en', 'pl'];
  readonly lang = signal<Lang>(this.resolveInitialLang());
  readonly t = computed(() => DICTS[this.lang()]);

  constructor() {
    effect(() => {
      const currentLang = this.lang();
      const d = this.t();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = d.htmlLang;
        document.title = d.docTitle;
      }
      this.persistLang(currentLang);
    });
  }

  setLang(lang: Lang) {
    this.lang.set(lang);
  }

  private resolveInitialLang(): Lang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (this.isSupportedLang(stored)) {
        return stored;
      }
    } catch {
      // localStorage unavailable
    }

    if (typeof navigator !== 'undefined') {
      const candidates = [
        ...(Array.isArray(navigator.languages) ? navigator.languages : []),
        navigator.language
      ].filter(Boolean);

      for (const candidate of candidates) {
        const prefix = candidate.slice(0, 2).toLowerCase();
        if (this.isSupportedLang(prefix)) {
          return prefix;
        }
      }
    }

    return 'en';
  }

  private isSupportedLang(val: string | null | undefined): val is Lang {
    return val === 'en' || val === 'pl';
  }

  private persistLang(lang: Lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage unavailable
    }
  }
}
`
    ],
    [
      'src/app/app.component.ts',
      `import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Settings, Activity, Layers, BookOpen } from 'lucide-angular';
import {
  BrandComponent,
  ButtonComponent,
  DropdownComponent,
  DropdownOption,
  PopupComponent,
  PopupService,
  SettingsPopupComponent,
  SplashComponent,
  SplashService,
  AboutService,
  TimelineSliderComponent,
  ThemeService,
  TooltipComponent,
  TooltipDirective,
  BreakpointService,
  SeoService
} from '@kmd/design-system';
import { I18nService } from './core/i18n/i18n.service';
import { Lang } from './core/i18n/i18n.types';
${withGlobe ? "import { GlobeComponent } from './components/globe/globe.component';\n" : ''}
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    BrandComponent,
    ButtonComponent,
    DropdownComponent,
    PopupComponent,
    SplashComponent,
    TimelineSliderComponent,
    TooltipComponent,
    TooltipDirective${withGlobe ? ',\n    GlobeComponent' : ''}
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly i18n = inject(I18nService);
  readonly bp = inject(BreakpointService);
  readonly popup = inject(PopupService);
  readonly about = inject(AboutService);
  readonly splash = inject(SplashService);
  readonly seo = inject(SeoService);
  readonly theme = inject(ThemeService);

  readonly settingsIcon = Settings;
  readonly bookOpenIcon = BookOpen;

  readonly currentView = signal<string>('primary');
  readonly sliderValue = signal<number>(0);

  constructor() {
    this.seo.update({
      title: 'KMD · ${appTitle}',
      description: '${htmlDescription.replace(/'/g, "\\'")}'
    });
    try {
      const saved = localStorage.getItem('${appSlug}.theme');
      if (saved === 'dark' || saved === 'light') this.theme.setMode(saved);
    } catch {}
  }

  openSettings() {
    const t = this.i18n.t();
    this.popup.open({
      id: 'settings',
      title: computed(() => this.i18n.t().settingsTitle),
      component: SettingsPopupComponent,
      componentInputs: {
        themeLabel: t.themeLabel,
        lightLabel: t.themeLight,
        darkLabel: t.themeDark,
        langLabel: t.changeLanguage,
        languages: this.i18n.langs.map(id => ({ id, label: this.i18n.dicts[id].langName })),
        activeLang: this.i18n.lang(),
        onThemeChange: (mode: 'light' | 'dark') => {
          try {
            localStorage.setItem('${appSlug}.theme', mode);
          } catch {}
        },
        onLangChange: (lang: string) => this.i18n.setLang(lang as Lang)
      },
      size: 'sm',
      actions: [{ label: computed(() => this.i18n.t().close), variant: 'default' }]
    });
  }

  readonly viewOptions = computed<DropdownOption<string>[]>(() => {
    const t = this.i18n.t();
    return [
      { value: 'primary', label: t.viewPrimary, icon: Activity },
      { value: 'secondary', label: t.viewSecondary, icon: Layers }
    ];
  });

  readonly currentViewIcon = computed(
    () => this.viewOptions().find(o => o.value === this.currentView())?.icon ?? Activity
  );

  readonly isPopupOpen = computed(() => this.popup.config() !== null);

  openGlossary() {
    this.popup.open({
      id: 'glossary',
      title: computed(() => this.i18n.t().glossary),
      description: computed(() => this.i18n.t().glossaryDesc),
      size: 'md',
      actions: [{ label: computed(() => this.i18n.t().close), variant: 'default' }]
    });
  }
}
`
    ],
    [
      'src/app/app.component.html',
      `@let t = i18n.t();

<main class="viewport">
  <app-splash (revealed)="splash.finish()"></app-splash>

  <!-- Top HUD: Left Logotype + Language, Right View Switcher -->
  <header class="header" [class.header--popup-open]="isPopupOpen()">
    <div class="header__left">
      <app-brand
        [appName]="'${appTitle}'"
        [lang]="i18n.lang()"
        (btnClick)="about.open({ lang: i18n.lang() })">
      </app-brand>

      <div class="header__settings glass-panel">
        <app-button
          variant="ghost"
          [size]="bp.mobileLandscape() ? 'sm' : 'md'"
          [iconOnly]="true"
          [ariaLabel]="t.settingsTitle"
          [appTooltip]="t.settingsTitle"
          (btnClick)="openSettings()">
          <lucide-icon [img]="settingsIcon" [size]="16" aria-hidden="true"></lucide-icon>
        </app-button>
      </div>
    </div>

    <div class="header__right">
      <div class="header__view glass-panel">
        <app-dropdown
          variant="ghost"
          [size]="bp.mobileLandscape() ? 'sm' : 'md'"
          align="right"
          [fullWidth]="true"
          [options]="viewOptions()"
          [value]="currentView()"
          [icon]="currentViewIcon()"
          [ariaLabel]="t.chooseView"
          (valueChange)="currentView.set($event)">
        </app-dropdown>
      </div>
    </div>
  </header>

  <!-- Fullscreen Visualization Stage -->
  <section class="stage" [attr.aria-label]="t.stageAriaLabel">${
    withGlobe ? '\n    <app-globe></app-globe>\n  ' : ''
  }</section>

  <!-- Bottom Dock: Sliders & Glossaries -->
  <footer class="dock-wrap">
    <div class="dock glass-panel">
      <div class="dock__slider">
        <app-timeline-slider
          [min]="-100"
          [max]="100"
          [step]="1"
          [value]="sliderValue()"
          [ariaLabel]="t.timelineLabel"
          (valueChange)="sliderValue.set($event)">
        </app-timeline-slider>
      </div>
      <app-button variant="ghost" (btnClick)="openGlossary()">
        <lucide-icon [img]="bookOpenIcon" [size]="15"></lucide-icon>
        <span>{{ t.glossary }}</span>
      </app-button>
    </div>
  </footer>

  <app-popup [closeAriaLabel]="t.close"></app-popup>
  <app-tooltip></app-tooltip>
</main>
`
    ],
    [
      'src/app/app.component.scss',
      `@use "variables" as *;

.viewport {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: color("bg-deep");
}

.header {
  position: fixed;
  top: var(--header-offset-top, 16px);
  left: var(--header-offset-x, 16px);
  right: var(--header-offset-x, 16px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  pointer-events: none;
  z-index: 25;

  &--popup-open {
    z-index: 120;

    .header__settings,
    .header__view {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity transition("fast"), visibility transition("fast");
    }
  }

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: auto;
  }

  &__settings,
  &__view {
    @include header-pill;
    transition: opacity transition("fast"), visibility transition("fast");
  }

  &__view {
    width: 180px;
  }

  @include respond-to("mobile") {
    &:not(.header--popup-open):has(::ng-deep .header__brand--expanded) {
      .header__settings,
      .header__view {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
    }

    &__view {
      width: 140px;
    }
  }

  @include respond-to("mobile-landscape") {
    &:not(.header--popup-open):has(::ng-deep .header__brand--expanded) {
      .header__settings,
      .header__view {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }
    }
  }
}

.stage {
  width: 100%;
  height: 100%;
}

.dock-wrap {
  position: fixed;
  bottom: var(--dock-offset-bottom, 16px);
  left: var(--dock-offset-x, 16px);
  right: var(--dock-offset-x, 16px);
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 20;
}

.dock {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  width: min(720px, 100%);

  &__slider {
    flex: 1;
  }
}
`
    ]
  ];
}

#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DESIGN_SYSTEM_ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2).filter(a => !a.startsWith('-'));
const rawName = args[0] === 'new' || args[0] === 'create' ? args[1] : args[0];

if (!rawName) {
  console.error('\nUsage: npx github:kmd-labs/design-system <app-name>\n');
  process.exit(1);
}

const appSlug = rawName
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '');

const appTitle = appSlug
  .split('-')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');

const targetDir = path.resolve(process.cwd(), appSlug);

if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
  console.error(`\nError: Directory "${targetDir}" already exists and is not empty.\n`);
  process.exit(1);
}

console.log(`\n🚀 Scaffolding KMD Angular Visualization App: ${appTitle} (${appSlug})...`);

const write = (relPath, content) => {
  const fullPath = path.join(targetDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
};

// 1. Copy AGENTS.md and CLAUDE.md from design-system
const agentsMdPath = path.join(DESIGN_SYSTEM_ROOT, 'AGENTS.md');
if (fs.existsSync(agentsMdPath)) {
  write('AGENTS.md', fs.readFileSync(agentsMdPath, 'utf8'));
}
write('CLAUDE.md', '@AGENTS.md\n');

// 2. package.json
write(
  'package.json',
  JSON.stringify(
    {
      name: appSlug,
      version: '1.0.0',
      scripts: {
        ng: 'ng',
        start: 'ng serve',
        build: 'ng build',
        'build:gh-pages': `ng build --base-href /${appSlug}/`,
        watch: 'ng build --watch --configuration development'
      },
      private: true,
      dependencies: {
        '@angular/animations': '^21.0.0',
        '@angular/common': '^21.0.0',
        '@angular/compiler': '^21.0.0',
        '@angular/core': '^21.0.0',
        '@angular/forms': '^21.0.0',
        '@angular/platform-browser': '^21.0.0',
        '@angular/platform-browser-dynamic': '^21.0.0',
        '@angular/router': '^21.0.0',
        'lucide-angular': '^1.0.0',
        rxjs: '~7.8.0',
        tslib: '^2.3.0',
        'zone.js': '~0.15.0'
      },
      devDependencies: {
        '@angular-devkit/build-angular': '^21.0.0',
        '@angular/cli': '^21.0.0',
        '@angular/compiler-cli': '^21.0.0',
        typescript: '~5.9.0'
      }
    },
    null,
    2
  ) + '\n'
);

// 3. angular.json
write(
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
                assets: ['src/assets'],
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
);

// 4. tsconfig.json & tsconfig.app.json
write(
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
);

write(
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
);

// 5. .gitignore
write(
  '.gitignore',
  `dist/\nnode_modules/\n.angular/\n.DS_Store\n*.log\n`
);

// 6. GitHub Workflows (Deploy + 6-hour Design System Submodule Sync)
write(
  '.github/workflows/deploy.yml',
  `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout with Design System submodule
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Angular application for GitHub Pages
        run: npm run build:gh-pages

      - name: Upload GitHub Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/${appSlug}/browser

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`
);

write(
  '.github/workflows/sync-design-system.yml',
  `name: Sync Design System Submodule

on:
  schedule:
    - cron: '0 */6 * * *'
  repository_dispatch:
    types: [design-system-updated]
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository with submodules
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Update design-system submodule to latest main
        run: |
          git submodule update --remote --merge src/design-system

      - name: Create Pull Request or Push Update
        if: \${{ success() }}
        uses: peter-evans/create-pull-request@v7
        with:
          commit-message: "chore(design-system): sync kmd-labs/design-system to latest"
          title: "chore(design-system): sync kmd-labs/design-system to latest"
          body: "Automated update of \`src/design-system\` submodule from \`kmd-labs/design-system\`."
          branch: chore/sync-design-system
          delete-branch: true
`
);

// 7. Angular src files
write('src/assets/.gitkeep', '');
write(
  'src/index.html',
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>KMD · ${appTitle}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`
);

write(
  'src/styles.scss',
  `@use "variables" as *;\n@use "base";\n`
);

write(
  'src/main.ts',
  `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch(err => console.error(err));
`
);

write(
  'src/app/core/i18n/i18n.service.ts',
  `import { Injectable, computed, effect, signal } from '@angular/core';

export type Lang = 'en' | 'pl' | 'es';

export interface Dict {
  htmlLang: string;
  docTitle: string;
  langName: string;
  changeLanguage: string;
  chooseView: string;
  viewPrimary: string;
  viewSecondary: string;
  timelineLabel: string;
  glossary: string;
  close: string;
}

const STORAGE_KEY = '${appSlug}.lang';

const DICTS: Record<Lang, Dict> = {
  en: {
    htmlLang: 'en',
    docTitle: 'KMD · ${appTitle}',
    langName: 'English',
    changeLanguage: 'Language',
    chooseView: 'View',
    viewPrimary: 'Overview',
    viewSecondary: 'Analysis',
    timelineLabel: 'Timeline',
    glossary: 'Glossary',
    close: 'Close'
  },
  pl: {
    htmlLang: 'pl',
    docTitle: 'KMD · ${appTitle}',
    langName: 'Polski',
    changeLanguage: 'Język',
    chooseView: 'Widok',
    viewPrimary: 'Przegląd',
    viewSecondary: 'Analiza',
    timelineLabel: 'Oś czasu',
    glossary: 'Słowniczek',
    close: 'Zamknij'
  },
  es: {
    htmlLang: 'es',
    docTitle: 'KMD · ${appTitle}',
    langName: 'Español',
    changeLanguage: 'Idioma',
    chooseView: 'Vista',
    viewPrimary: 'Resumen',
    viewSecondary: 'Análisis',
    timelineLabel: 'Línea de tiempo',
    glossary: 'Glosario',
    close: 'Cerrar'
  }
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly dicts = DICTS;
  readonly langs: Lang[] = ['en', 'pl', 'es'];
  readonly lang = signal<Lang>(this.resolveInitialLang());
  readonly t = computed(() => DICTS[this.lang()]);

  constructor() {
    effect(() => {
      const current = this.lang();
      const d = this.t();
      if (typeof document !== 'undefined') {
        document.documentElement.lang = d.htmlLang;
        document.title = d.docTitle;
      }
      try {
        localStorage.setItem(STORAGE_KEY, current);
      } catch {}
    });
  }

  setLang(lang: Lang) {
    this.lang.set(lang);
  }

  private resolveInitialLang(): Lang {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'pl' || stored === 'es') return stored;
    } catch {}
    if (typeof navigator !== 'undefined') {
      const candidates = [...(navigator.languages ?? []), navigator.language].filter(Boolean);
      for (const c of candidates) {
        const prefix = c.slice(0, 2).toLowerCase();
        if (prefix === 'en' || prefix === 'pl' || prefix === 'es') return prefix;
      }
    }
    return 'en';
  }
}
`
);

write(
  'src/app/app.component.ts',
  `import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Globe, Activity, Layers, BookOpen } from 'lucide-angular';
import {
  ButtonComponent,
  DropdownComponent,
  DropdownOption,
  PopupComponent,
  PopupService,
  TimelineSliderComponent,
  TooltipComponent,
  BreakpointService
} from '@kmd/design-system';
import { I18nService, Lang } from './core/i18n/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ButtonComponent,
    DropdownComponent,
    PopupComponent,
    TimelineSliderComponent,
    TooltipComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly i18n = inject(I18nService);
  readonly bp = inject(BreakpointService);
  readonly popup = inject(PopupService);

  readonly globeIcon = Globe;
  readonly bookOpenIcon = BookOpen;

  readonly currentView = signal<string>('primary');
  readonly sliderValue = signal<number>(0);

  readonly langOptions = computed<DropdownOption<Lang>[]>(() =>
    this.i18n.langs.map(l => ({
      value: l,
      label: this.i18n.dicts[l].langName,
      shortLabel: l.toUpperCase(),
      badge: l.toUpperCase()
    }))
  );

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

  openGlossary() {
    this.popup.open({
      id: 'glossary',
      title: computed(() => this.i18n.t().glossary),
      description: '${appTitle} interactive visualization glossary.',
      size: 'md',
      actions: [{ label: computed(() => this.i18n.t().close), variant: 'default' }]
    });
  }
}
`
);

write(
  'src/app/app.component.html',
  `@let t = i18n.t();

<main class="viewport">
  <!-- Top HUD: Left Logotype + Language, Right View Switcher -->
  <header class="header">
    <div class="header__left">
      <div class="header__brand glass-panel">
        <span class="header__logo-mark">KMD</span>
        <span class="header__divider" aria-hidden="true"></span>
        <h1 class="header__app-name">${appTitle}</h1>
      </div>

      <div class="header__settings glass-panel" role="group" [attr.aria-label]="t.changeLanguage">
        <app-dropdown
          variant="ghost"
          [icon]="bp.mobile() ? null : globeIcon"
          [options]="langOptions()"
          [value]="i18n.lang()"
          [ariaLabel]="t.changeLanguage"
          (valueChange)="i18n.setLang($event)">
        </app-dropdown>
      </div>
    </div>

    <div class="header__right">
      <div class="header__view glass-panel">
        <app-dropdown
          variant="ghost"
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
  <section class="stage" aria-label="${appTitle} Visualization"></section>

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
);

write(
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
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  pointer-events: none;
  z-index: 20;

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
    pointer-events: auto;
  }

  &__brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 42px;
    padding: 4px 14px;
    border-radius: radius("pill");
  }

  &__logo-mark {
    font-size: font-size("base");
    font-weight: font-weight("bold");
    letter-spacing: 0.12em;
    color: color("text-bright");

    &::after {
      content: "";
      display: inline-block;
      width: 5px;
      height: 5px;
      margin-left: 2px;
      border-radius: 50%;
      background: color("accent");
    }
  }

  &__divider {
    width: 1px;
    height: 16px;
    background: color("line-strong");
  }

  &__app-name {
    margin: 0;
    font-size: font-size("xs");
    font-weight: font-weight("medium");
    color: color("text-dim");
  }

  &__settings,
  &__view {
    display: inline-flex;
    align-items: center;
    padding: 4px;
    border-radius: radius("pill");
  }

  &__view {
    width: 180px;
  }

  @include respond-to("mobile") {
    top: 10px;
    left: 8px;
    right: 8px;

    &__app-name,
    &__divider {
      display: none;
    }

    &__view {
      width: 140px;
    }
  }
}

.stage {
  width: 100%;
  height: 100%;
}

.dock-wrap {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
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
);

// 8. Initialize git repository and link kmd-labs/design-system submodule
try {
  execSync('git init -b main', { cwd: targetDir, stdio: 'inherit' });
  execSync(
    'git submodule add -b main https://github.com/kmd-labs/design-system.git src/design-system',
    { cwd: targetDir, stdio: 'inherit' }
  );
} catch {
  console.warn('⚠️ Could not automatically add git submodule (check network/git status).');
}

console.log(\`
✅ Successfully scaffolded \${appTitle} in ./\${appSlug}!

Next steps:
  cd \${appSlug}
  npm install
  npm start
\`);

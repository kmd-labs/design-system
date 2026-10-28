#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DESIGN_SYSTEM_ROOT = path.resolve(__dirname, '..');

const toSlug = str =>
  str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toTitle = slug =>
  slug
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const args = process.argv.slice(2).filter(a => !a.startsWith('-'));
const cliArg = args[0] === 'new' || args[0] === 'create' ? args[1] : args[0];
const isPlaceholder = !cliArg || toSlug(cliArg) === 'my-visualization-app';

let appSlug = isPlaceholder ? '' : toSlug(cliArg);
let appTitle = appSlug ? toTitle(appSlug) : '';

if (process.stdin.isTTY && !process.argv.includes('--yes') && !process.argv.includes('-y')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    while (true) {
      const promptText = appSlug
        ? `\n? Project / repository name (${appSlug}): `
        : `\n? What is your visualization app name? (e.g. solar-wind): `;
      const answer = (await rl.question(promptText)).trim();
      const candidate = toSlug(answer || appSlug);
      if (!candidate) {
        console.log('⚠️  Please enter a valid project name.');
        continue;
      }
      const candidateDir = path.resolve(process.cwd(), candidate);
      if (fs.existsSync(candidateDir) && fs.readdirSync(candidateDir).length > 0) {
        console.log(`⚠️  Directory "./${candidate}" already exists and is not empty. Please choose another name.`);
        appSlug = '';
        continue;
      }
      appSlug = candidate;
      break;
    }

    const defaultTitle = toTitle(appSlug);
    const titleAnswer = (await rl.question(`? Application display title (${defaultTitle}): `)).trim();
    appTitle = titleAnswer || defaultTitle;
  } finally {
    rl.close();
  }
} else if (!appSlug) {
  console.error('\nUsage: npx github:kmd-labs/design-system [app-name]\n');
  process.exit(1);
}

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
write('.npmrc', 'legacy-peer-deps=true\n');

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
        watch: 'ng build --watch --configuration development',
        'setup:github': 'node scripts/setup-github.mjs'
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
        tslib: '^2.3.0',
        'zone.js': '~0.15.0'
      },
      devDependencies: {
        '@angular-devkit/build-angular': '~21.2.0',
        '@angular/cli': '~21.2.0',
        '@angular/compiler-cli': '~21.2.0',
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
  schedule:
    - cron: '0 */6 * * *'
  repository_dispatch:
    types: [design-system-updated]
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
          fetch-depth: 0

      - name: Pull latest Design System changes
        run: git submodule update --remote --force src/design-system

      - name: Generate GitHub App Token
        id: app-token
        uses: actions/create-github-app-token@v1
        continue-on-error: true
        with:
          app-id: \${{ secrets.KMD_BOT_APP_ID }}
          private-key: \${{ secrets.KMD_BOT_PRIVATE_KEY }}

      - name: Configure GitHub Pages (auto-enable)
        uses: actions/configure-pages@v5
        with:
          enablement: true
          token: \${{ steps.app-token.outputs.token != '' && steps.app-token.outputs.token || github.token }}

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: |
          if [ -f package-lock.json ]; then
            npm ci --legacy-peer-deps
          else
            npm install --legacy-peer-deps
          fi

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
      - name: Generate GitHub App Token
        id: app-token
        uses: actions/create-github-app-token@v1
        with:
          app-id: \${{ secrets.KMD_BOT_APP_ID }}
          private-key: \${{ secrets.KMD_BOT_PRIVATE_KEY }}

      - name: Checkout repository with submodules
        uses: actions/checkout@v4
        with:
          token: \${{ steps.app-token.outputs.token }}
          submodules: recursive
          fetch-depth: 0

      - name: Update design-system submodule to latest main
        run: |
          git submodule update --remote --force src/design-system

      - name: Create Pull Request with design-system updates
        id: cpr
        uses: peter-evans/create-pull-request@v7
        with:
          token: \${{ steps.app-token.outputs.token }}
          commit-message: "chore(design-system): sync kmd-labs/design-system to latest"
          title: "chore(design-system): sync kmd-labs/design-system to latest"
          body: "Automated update of \`src/design-system\` submodule from \`kmd-labs/design-system\`."
          branch: chore/sync-design-system
          delete-branch: true

      - name: Auto-merge Pull Request
        if: steps.cpr.outputs.pull-request-number != ''
        env:
          GH_TOKEN: \${{ steps.app-token.outputs.token }}
        run: |
          gh pr merge \${{ steps.cpr.outputs.pull-request-number }} --admin --squash --delete-branch
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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
);

write(
  'src/app/core/i18n/en.ts',
  `import { Dict } from './i18n.types';

export const EN: Dict = {
  htmlLang: 'en',
  docTitle: 'KMD · ${appTitle}',
  langName: 'English',

  // Top HUD & Navigation
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
);

write(
  'src/app/core/i18n/pl.ts',
  `import { Dict } from './i18n.types';

export const PL: Dict = {
  htmlLang: 'pl',
  docTitle: 'KMD · ${appTitle}',
  langName: 'Polski',

  // Top HUD & Navigation
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
);

write(
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
  SplashComponent,
  SplashService,
  AboutService,
  TimelineSliderComponent,
  TooltipComponent,
  BreakpointService
} from '@kmd/design-system';
import { I18nService } from './core/i18n/i18n.service';
import { Lang } from './core/i18n/i18n.types';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ButtonComponent,
    DropdownComponent,
    PopupComponent,
    SplashComponent,
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
  readonly about = inject(AboutService);
  readonly splash = inject(SplashService);

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
);

write(
  'src/app/app.component.html',
  `@let t = i18n.t();

<main class="viewport">
  <app-splash (revealed)="splash.finish()"></app-splash>

  <!-- Top HUD: Left Logotype + Language, Right View Switcher -->
  <header class="header" [class.header--popup-open]="isPopupOpen()">
    <div class="header__left">
      <div class="header__brand glass-panel">
        <button
          type="button"
          class="header__brand-btn"
          aria-label="KMD Labs – About us"
          (click)="about.open({ lang: i18n.lang() })">
          <img
            class="header__logo-img"
            src="assets/design-system/logo/kmd-black-orange.svg"
            alt="KMD" />
          <span class="header__divider" aria-hidden="true"></span>
          <h1 class="header__app-name">${appTitle}</h1>
        </button>
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
  <section class="stage" [attr.aria-label]="t.stageAriaLabel"></section>

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

  &__brand {
    display: inline-flex;
    align-items: center;
    height: 42px;
    padding: 4px;
    border-radius: radius("pill");
  }

  &__brand-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 34px;
    padding: 0 12px 0 8px;
    border-radius: radius("pill");
    border: 0;
    background: transparent;
    font: inherit;
    color: color("text-bright");
    cursor: pointer;
    text-decoration: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    transition: background transition("fast"), transform transition("fast");

    &:hover {
      background: color("btn-hover");
    }

    &:active {
      background: color("btn-hover");
      transform: scale(0.98);
    }

    &:focus-visible {
      outline: 2px solid color("accent");
      outline-offset: 1px;
    }
  }

  &__logo-img {
    height: 16px;
    width: auto;
    display: block;
    user-select: none;
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
    transition: opacity transition("fast"), visibility transition("fast");
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

// 8. Generate scripts/setup-github.mjs for applying canonical KMD branch protection
const protectionPayload = JSON.stringify(
  {
    required_status_checks: null,
    enforce_admins: false,
    required_pull_request_reviews: {
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false,
      require_last_push_approval: false,
      required_approving_review_count: 1
    },
    restrictions: null,
    required_linear_history: false,
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: false,
    lock_branch: false,
    allow_fork_syncing: false
  },
  null,
  2
);

write(
  'scripts/setup-github.mjs',
  `#!/usr/bin/env node
import { execSync } from 'node:child_process';

const repo = 'kmd-labs/${appSlug}';
const protection = ${protectionPayload};

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const runSilent = (cmd, opts = {}) => execSync(cmd, { stdio: 'pipe', ...opts });

try {
  // 1. Verify GitHub CLI authentication
  try {
    runSilent('gh auth status');
  } catch {
    console.warn('⚠️ GitHub CLI (gh) is not authenticated. Please run "gh auth login" and then "npm run setup:github".');
    process.exit(0);
  }

  // 2. Ensure repo exists on GitHub under kmd-labs (or create it if missing)
  try {
    runSilent(\`gh repo view \${repo}\`);
  } catch {
    console.log(\`Creating public repository \${repo}...\`);
    run(\`gh repo create \${repo} --public\`);
  }

  // 3. Ensure origin remote is configured
  try {
    runSilent('git remote get-url origin');
  } catch {
    run(\`git remote add origin https://github.com/\${repo}.git\`);
  }

  // 4. Enable GitHub Pages via GitHub Actions BEFORE pushing so the initial workflow succeeds immediately
  console.log(\`🌐 Enabling GitHub Pages (GitHub Actions) on \${repo}...\`);
  try {
    runSilent(\`gh api repos/\${repo}/pages -X POST -f build_type=workflow\`);
    console.log('✅ GitHub Pages enabled with GitHub Actions!');
  } catch {
    try {
      runSilent(\`gh api repos/\${repo}/pages -X PUT -f build_type=workflow\`);
      console.log('✅ GitHub Pages updated to GitHub Actions!');
    } catch {}
  }

  // 5. Push main branch
  console.log(\`🚀 Pushing main branch to \${repo}...\`);
  run('git push -u origin main');

  // 6. Confirm GitHub Pages status after branch creation
  try {
    runSilent(\`gh api repos/\${repo}/pages -X POST -f build_type=workflow\`);
  } catch {
    try {
      runSilent(\`gh api repos/\${repo}/pages -X PUT -f build_type=workflow\`);
    } catch {}
  }

  // 7. Apply canonical KMD main branch protection (1 PR review, dismiss stale reviews, org admins bypass)
  console.log(\`🔒 Applying KMD branch protection rules to \${repo} (main)...\`);
  try {
    execSync(\`gh api repos/\${repo}/branches/main/protection -X PUT --input -\`, {
      input: JSON.stringify(protection),
      stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log(\`✅ Branch protection applied to main!\`);
  } catch (protErr) {
    console.warn('⚠️ Could not apply branch protection rules automatically (requires org admin privileges).');
  }

  // 8. Ensure the design-system sync workflow can authenticate (GitHub App secrets).
  //    Preferred: org-level secrets shared with the repo. Fallback: set repo secrets from local env vars.
  console.log(\`🔑 Checking design-system sync secrets on \${repo}...\`);
  const requiredSecrets = ['KMD_BOT_APP_ID', 'KMD_BOT_PRIVATE_KEY'];
  const listNames = (cmd) => {
    try {
      return runSilent(cmd).toString().split('\\n').map((s) => s.trim()).filter(Boolean);
    } catch {
      return [];
    }
  };
  const available = new Set([
    ...listNames(\`gh api repos/\${repo}/actions/secrets --jq '.secrets[].name'\`),
    ...listNames(\`gh api repos/\${repo}/actions/organization-secrets --jq '.secrets[].name'\`)
  ]);
  for (const name of requiredSecrets) {
    if (available.has(name)) continue;
    const value = process.env[name];
    if (value) {
      try {
        execSync(\`gh secret set \${name} --repo \${repo}\`, { input: value, stdio: ['pipe', 'ignore', 'inherit'] });
        available.add(name);
        console.log(\`✅ Set repo secret \${name} from local environment.\`);
      } catch {}
    }
  }
  const missing = requiredSecrets.filter((n) => !available.has(n));
  if (missing.length) {
    console.warn(
      \`⚠️ Missing secrets: \${missing.join(', ')}. The "Sync Design System Submodule" workflow will fail until they exist.\\n\` +
        \`   Fix once for all apps: add them as kmd-labs ORG secrets (Settings → Secrets → Actions) with access to all repositories,\\n\` +
        \`   or export them locally and re-run "npm run setup:github".\`
    );
  } else {
    console.log('✅ Design-system sync secrets available.');
  }

  console.log(\`\n🎉 Repository setup complete: https://github.com/\${repo}\`);
  console.log(\`🌐 Live site URL: https://kmd-labs.github.io/${appSlug}/\n\`);
} catch (err) {
  console.error('⚠️ Could not complete GitHub repo setup automatically:', err.message);
  console.warn('Run "npm run setup:github" once your repository is ready.');
}
`
);

// 9. Initialize git repository, link kmd-labs/design-system submodule, and apply GitHub branch protection
const skipGithub = process.argv.includes('--no-github');
try {
  execSync('git init -b main', { cwd: targetDir, stdio: 'inherit' });
  execSync(
    'git submodule add -b main https://github.com/kmd-labs/design-system.git src/design-system',
    { cwd: targetDir, stdio: 'inherit' }
  );
  try {
    execSync('npm install --package-lock-only --legacy-peer-deps --ignore-scripts', {
      cwd: targetDir,
      stdio: 'ignore'
    });
  } catch {}
  execSync('git add -A && git commit -m "feat: initial KMD app scaffold"', {
    cwd: targetDir,
    stdio: 'inherit'
  });
} catch (gitErr) {
  console.warn('⚠️ Local git initialization encountered an issue:', gitErr.message);
}

if (!skipGithub) {
  try {
    execSync('node scripts/setup-github.mjs', { cwd: targetDir, stdio: 'inherit' });
  } catch (ghErr) {
    console.warn('⚠️ GitHub auto-setup was not completed. Run "npm run setup:github" once your repo is ready.');
  }
}

console.log(`
✅ Successfully scaffolded ${appTitle} in ./${appSlug}!

Next steps:
  cd ${appSlug}
  npm install
  npm start
`);


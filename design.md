# KMD Design System Guide (`design.md`)

Welcome to the **KMD (`kmd-labs`) Design System** specification and documentation. This guide details the foundational design tokens, viewport layout architecture, WebGL/Canvas rendering integration, responsive behaviors, and Angular UI primitives that power all KMD interactive visualization applications.

---

## 1. Core Philosophy: Zero Friction, Visualization First

All KMD visualization applications are built upon four fundamental design pillars:

1. **Immediate Immersion:**
   - The interactive visualization (3D WebGL globe, 2D simulation canvas, or interactive diagram) occupies `100vw × 100vh` and is directly interactive upon page load.
   - UI elements float cleanly above the canvas as lightweight, non-intrusive frosted glass HUD panels.
2. **No Settings Bloat:**
   - Never introduce settings modals, preferences sidebars, theme toggles, or multistep onboarding walkthroughs that block the user from interacting with the data.
   - Key mode switches and controls are readily accessible directly on the primary viewport.
3. **Single Light Theme:**
   - KMD applications use a single, cohesive **Light Theme** engineered around an airy `neutral-50` (`#f5f7fb`) background with frosted glass surfaces (`rgba(255, 255, 255, 0.84)`).
   - We do **not** support or implement a dark mode, light/dark toggles, or theme persistence.
   - High contrast, subtle borders, and precise alpha blending ensure optimal readability under all ambient lighting conditions.
4. **Unified Typography:**
   - A single primary font family—**Inter** (`$font-family: "Inter", sans-serif;`)—is used across all UI elements, HUD controls, dialogs, and `<canvas>` 2D/3D labels.
   - Monospaced numeric readouts (dates, anomaly numbers, lat/long degrees) use **JetBrains Mono** / system monospace (`$font-family-mono`).
5. **Zero Hardcoded Strings (Mandatory i18n):**
   - Every user-facing string across templates, popups, tooltips, ARIA labels, and canvas graphics is resolved dynamically via `I18nService` with type-safe English (`en.ts`) and Polish (`pl.ts`) dictionaries.

---

## 2. Canonical Viewport Architecture (HUD)

Every KMD visualization follows a strict three-zone Head-Up Display (HUD) layout floating above the full-screen canvas:

```
┌────────────────────────────────────────────────────────────────────────┐
│ [KMD | App Name]  [EN ▾]                         [View Switcher ▾]    │ ← Zone 1 & 2
│                                                                        │
│                                                                        │
│                          FULL-VIEWPORT CANVAS                          │
│                             (100vw × 100vh)                            │
│                                                                        │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │  [⏮] [▶] [⏭]  ══════════════●══════════════  [Data]  [Glossary]     │ │ ← Zone 3 (Dock)
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Zone 1: Top-Left — Brand Logotype & Language Selector (`.header__left`)
- **Brand Pill (`.header__brand.glass-panel`):**
  - Displays the official KMD SVG logotype (`assets/logo/kmd-black-orange.svg` — black wordmark with `#D37400` orange accent dot).
  - A `1px` vertical divider (`color("line")`) separates the logotype from the application subtitle (e.g., `El Niño`).
  - On mobile (`≤ 640px`), the divider and subtitle automatically collapse, displaying only the compact KMD logotype mark.
- **Language Selector Pill (`.header__settings.glass-panel`):**
  - Contains **only** the compact language dropdown `app-dropdown` (`EN`, `PL`, `ES`).
  - Persists preference automatically to `localStorage` (`<app-slug>.lang`).

### 2.2 Zone 2: Top-Right — View Switcher (`.header__right`)
- **View Pill (`.header__view.glass-panel`):**
  - Contains a single right-aligned `app-dropdown` (`align="right"`) that switches between primary visualization modes/views (e.g., *3D Globe*, *Walker Cell*, *Historical Cycles*).
  - Styled with adequate width and truncation safeguards to prevent text clipping across languages.

### 2.3 Zone 3: Bottom Dock — Controls, Sliders & Panels (`.dock-wrap`)
- Anchored to the bottom center of the viewport with safe-area inset handling (`env(safe-area-inset-bottom, 0px)`).
- Contains interactive timeline sliders (`app-timeline-slider`), transport controls (play/pause/step), layer toggles, color scale legends, and glossary modal triggers (`PopupService`).
- On mobile devices, dock panels collapse into stacked, icon-only button configurations.

### 2.4 Canonical HUD CSS Layout Tokens (`_base.scss`)

| CSS Custom Property | Default (Desktop) | Mobile (`≤ 640px`) | Mobile Landscape | Description |
| :--- | :--- | :--- | :--- | :--- |
| `--dock-gap` | `16px` (`spacing-lg`) | `10px` (`spacing-sm`) | `8px` (`spacing-xs`) | Spacing between dock panels |
| `--dock-offset-x` | `16px` | `8px` | `8px` | Horizontal viewport margin |
| `--dock-offset-bottom`| `calc(16px + env(...))` | `calc(10px + env(...))` | `calc(8px + env(...))` | Bottom margin with safe area |
| `--dock-clearance` | `calc(140px + ...)` | `calc(140px + ...)` | `calc(140px + ...)` | Clearance for canvas labels above dock |
| `--header-offset-top` | `16px` | `10px` | `8px` | Top clearance for header pills |
| `--header-offset-x` | `16px` | `8px` | `max(8px, env(...))`| Horizontal clearance for header pills |
| `--kmd-brand-h` | `42px` | `38px` | `34px` | Height of top brand pill |
| `--popup-top-padding` | `calc(42px + 32px)` | `calc(38px + 20px)` | `calc(34px + 16px)` | Minimum top offset for popups |

---

## 3. Design Tokens & Variables

All design tokens are defined as Sass maps in `_variables.scss` and exported to `:root` as CSS custom properties in `_base.scss`.

### 3.1 Color Palette

#### Neutral Grays
Airy light surface background grading to deep contrast ink.
```scss
$palette-neutral: (
  "neutral-0":   #ffffff,
  "neutral-50":  #f5f7fb, // Canvas & viewport base background
  "neutral-100": #eef2f7,
  "neutral-200": #e2e8f0,
  "neutral-300": #cfd8e3,
  "neutral-400": #94a3b8,
  "neutral-500": #64748b, // Subdued / secondary text
  "neutral-600": #475569,
  "neutral-700": #334155,
  "neutral-800": #1e293b, // Primary body text
  "neutral-850": #25332d,
  "neutral-900": #0f172a, // Emphasized titles & headings
  "neutral-925": #0a1222,
  "neutral-950": #040812,
);
```

#### Brand & Accent
KMD Signature Orange (`#d37400`) provides active cues, focus outlines, and primary highlights.
```scss
$palette-warning: (
  "warning-50":  #fdf6ed,
  "warning-100": #fbe8d0,
  "warning-200": #f7cfa0,
  "warning-300": #f2b263,
  "warning-400": #e6922e, // Accent hover
  "warning-500": #d37400, // Primary KMD Accent
  "warning-600": #b86300,
  "warning-700": #965000,
  "warning-800": #783f00,
  "warning-900": #5e3100,
);
```

#### Status & Semantic Colors
Each semantic state provides a solid color and a matching 16% alpha soft background:
- **Danger:** `danger-500` (`#ef4444`) / `danger-soft` (`rgba(239, 68, 68, 0.16)`)
- **Warning:** `warning-500` (`#d37400`) / `warning-soft` (`rgba(211, 116, 0, 0.16)`)
- **Success:** `success-500` (`#10b981`) / `success-soft` (`rgba(16, 185, 129, 0.16)`)
- **Info:** `info-400` (`#38bdf8`) / `info-soft` (`rgba(56, 189, 248, 0.16)`)

#### Domain-Specific Scales (Climate & Oceanography)
- **ENSO Phase Colors:**
  - `phase-super`: `danger-600` (`#dc2626`)
  - `phase-nino`: `warning-500` (`#d37400`)
  - `phase-nina`: `primary-600` (`#2563eb`)
  - `phase-neu`: `neutral-500` (`#64748b`)
- **Sea Surface Temperature (SST Thermal Scale):**
  Stops from `sst-m2` (`#829c9e` for -2°C) up to `sst-35` (`#a40d19` for 35°C).
- **Temperature Anomaly Scale:**
  Stops from `anom-m3` (`#2563eb` for -3.0°C) to `anom-0` (`#f5f7fb` for 0.0°C) to `anom-p3` (`#dc2626` for +3.0°C).

### 3.2 Surface & Glassmorphism Tokens

Frosted glass panels provide crisp visual separation from the active visualization underneath:

```scss
$theme-colors: (
  "bg-deep":        palette("neutral-50"),             // #f5f7fb
  "panel-bg":       rgba(palette("neutral-0"), 0.84),  // Frosted glass background
  "panel-bg-solid": palette("neutral-0"),              // Fallback solid
  "panel-bg-heavy": rgba(palette("neutral-0"), 0.96),  // Opaque frosted glass
  "popup-backdrop": rgba(palette("neutral-900"), 0.35),// Dimmer backdrop
  "tooltip-bg":     rgba(palette("neutral-0"), 0.96),  // High-contrast tooltip
  "badge-bg":       palette("neutral-500"),
  "line":           rgba(palette("neutral-900"), 0.1), // Subtle borders
  "line-strong":    rgba(palette("neutral-900"), 0.2), // Emphasized borders
  "shadow-panel":   rgba(palette("neutral-900"), 0.08),// Soft depth shadow
  "shadow-heavy":   rgba(palette("neutral-900"), 0.16),
  "text-main":      palette("neutral-800"),            // #1e293b
  "text-dim":       palette("neutral-500"),            // #64748b
  "text-bright":    palette("neutral-900"),            // #0f172a
);
```

#### The `glass-panel` SCSS Mixin
```scss
@include glass-panel($heavy: false);
```
Outputs:
- Normal (`$heavy: false`): `background: color("panel-bg"); backdrop-filter: blur(14px); border: 1px solid color("line"); box-shadow: 0 8px 30px color("shadow-panel"); border-radius: radius("panel");`
- Heavy (`$heavy: true`): `background: color("panel-bg-heavy"); backdrop-filter: blur(14px); border: 1px solid color("line-strong"); box-shadow: 0 16px 48px color("shadow-heavy");`

### 3.3 Typography

- **UI & Canvas Text:** `"Inter", sans-serif;` (`--font-family`)
- **Data & Numeric Displays:** `"JetBrains Mono", "SFMono-Regular", ui-monospace, monospace;` (`--font-family-mono`)

| Size Token | Rem Value | Pixel Equivalent | Typical Usage |
| :--- | :--- | :--- | :--- |
| `xxs` | `0.6875rem` | 11px | Canvas sub-labels, axis ticks, date tags |
| `xs` | `0.75rem` | 12px | Badges, metadata subtitles, tooltips |
| `sm` | `0.8125rem` | 13px | Compact dropdown items, control secondary text |
| `base` | `0.875rem` | 14px | Standard button text, dropdown triggers, body copy |
| `md` | `0.9375rem` | 15px | Modal subheadings, highlighted labels |
| `lg` | `1.125rem` | 18px | Panel headings, modal card titles |
| `xl` | `1.375rem` | 22px | Main modal titles, splash headlines |

| Weight Token | Numeric Value | Usage |
| :--- | :--- | :--- |
| `regular` | 400 | Body copy, secondary readouts |
| `medium` | 500 | Standard button text, dropdown labels |
| `semibold` | 600 | Headings, badge labels, emphasized metrics |
| `bold` | 700 | Brand wordmarks, strong callouts |

### 3.4 Control Metrics & Geometry

- **Universal Control Height:** `$control-height: 32px` (`--control-height: 32px`). Every button, dropdown trigger, and input shares an identical `32px` touch/click target height to maintain optical alignment in floating HUD bars.
- **Corner Radii:**
  - `xs`: `4px` (subtle tooltips, small callouts)
  - `sm`: `8px` (interactive items, inner cards)
  - `card`: `16px` (popover cards, timeline summaries)
  - `panel`: `20px` (floating HUD panels, modal dialogs)
  - `control` / `badge` / `pill`: `9999px` (buttons, dropdown triggers, tag badges)
- **Spacings:**
  - `xxs`: `4px` | `xs`: `8px` | `sm`: `10px` | `md`: `12px` | `base`: `14px` | `lg`: `16px` | `xl`: `20px` | `2xl`: `24px` | `3xl`: `32px`

---

## 4. Responsive Breakpoints

Breakpoints are defined in `_variables.scss` and mirrored in TypeScript via `BreakpointService`:

| Token | Threshold | Behavior |
| :--- | :--- | :--- |
| `mobile` | `max-width: 640px` | Single-column dock, icon-only buttons, hidden app title in brand pill |
| `tablet` | `max-width: 960px` | Narrower view switcher, stacked dock panels |
| `desktop` | `max-width: 1280px` | Full multi-panel dock layout with inline labels |
| `mobile-landscape` | `max-height: 500px` & `orientation: landscape` | Compact header, condensed timeline slider, safe-area horizontal padding |

### SCSS Breakpoint Mixin
```scss
@use "variables" as *;

.my-panel {
  padding: spacing("lg");

  @include respond-to("tablet") {
    padding: spacing("md");
  }

  @include respond-to("mobile") {
    padding: spacing("xs");
  }
}
```

### TypeScript Breakpoint Service
```typescript
import { Component, inject } from '@angular/core';
import { BreakpointService } from '@kmd/design-system';

@Component({ ... })
export class MyComponent {
  readonly bp = inject(BreakpointService);

  // bp.mobile() -> Signal<boolean>
  // bp.tablet() -> Signal<boolean>
  // bp.desktop() -> Signal<boolean>
  // bp.mobileLandscape() -> Signal<boolean>
}
```

---

## 5. WebGL & Canvas 2D/3D Integration

Interactive visualizations must honor the design tokens dynamically without hardcoded hex strings.

### 5.1 Dynamic Token Color Resolution (`ThemeService`)
The stateless `ThemeService` reads live CSS custom properties from `:root`:

```typescript
import { inject } from '@angular/core';
import { ThemeService } from '@kmd/design-system';

export class CanvasRenderer {
  private readonly theme = inject(ThemeService);

  render(ctx: CanvasRenderingContext2D) {
    // Resolve CSS tokens dynamically with safe fallbacks
    const textColor = this.theme.getTokenColor('text-main', '#1e293b');
    const accentColor = this.theme.getTokenColor('accent', '#d37400');
    const panelBg = this.theme.getTokenColor('panel-bg', 'rgba(255, 255, 255, 0.84)');
    const font = this.theme.getFontFamily(); // "Inter", sans-serif

    ctx.font = `600 12px ${font}`;
    ctx.fillStyle = textColor;
    ctx.fillText('Equatorial Pacific', 100, 50);
  }
}
```

### 5.2 Canvas Text Badges & Anti-Collision Guidelines
When rendering text directly onto complex visual fields (e.g., animated particles, ocean currents, thermal maps):
1. **Always render a frosted pill badge** behind the text using `roundRect()` with `panel-bg` (or dark tint for deep water) and subtle border `line`.
2. **Apply Canvas Clamping:** Ensure badges clamp against `(0, 0, width, height)` to prevent text clipping at viewport borders.
3. **Collision Avoidance:** If dynamic timeline indicators or cursor crosshairs pass over static label badges, reposition or offset the badge with an arrow or leader line to prevent overlapping pills.

---

## 6. Angular UI Component Library (`@kmd/design-system`)

The design system exports standalone Angular components, directives, and services from `@kmd/design-system`.

### 6.1 Button (`ButtonComponent` / `app-button`)
Universal pill button maintaining `$control-height: 32px`.

```html
<!-- Default pill button -->
<app-button (clicked)="onAction()">
  <span class="btn-text">Reset View</span>
</app-button>

<!-- Primary accent button -->
<app-button variant="primary" (clicked)="onPlay()">
  <svg class="icon">...</svg>
  <span>Play</span>
</app-button>

<!-- Icon-only button (retains circular 32x32 hit target) -->
<app-button [iconOnly]="true" [appTooltip]="'Toggle Data'" (clicked)="toggle()">
  <svg class="icon">...</svg>
</app-button>

<!-- Active toggle button -->
<app-button variant="toggle" [active]="isActive()" (clicked)="onToggle()">
  <span>Anomalies</span>
</app-button>
```

### 6.2 Dropdown (`DropdownComponent` / `app-dropdown`)
Accessible floating dropdown menu with keyboard navigation, active state indicator, and optional badge/icon support.

```html
<app-dropdown
  [items]="viewOptions"
  [selectedId]="currentView()"
  [align]="'right'"
  (selected)="onViewChange($event)"
/>
```

### 6.3 Timeline Slider (`TimelineSliderComponent` / `app-timeline-slider`)
High-performance scrubbing timeline slider designed for continuous climate and temporal simulations:
- Drag, touch-scrub, and keyboard arrow step support.
- Configurable preset markers (e.g., major El Niño/La Niña event years).
- Formatted date/time label tooltips.

```html
<app-timeline-slider
  [min]="0"
  [max]="totalMonths"
  [value]="currentMonth()"
  [markers]="eventMarkers"
  (valueChange)="onSeek($event)"
/>
```

### 6.4 Popup Modal (`PopupComponent` & `PopupService` / `app-popup`)
Modal dialog system for glossaries, scientific background explanations, and deep-dive tables:
- Centered frosted glass dialog on desktop; responsive bottom-sheet on mobile.
- Accessible backdrop with focus trapping and ESC key dismiss.
- Search filter input and category tabs.

```typescript
import { inject } from '@angular/core';
import { PopupService } from '@kmd/design-system';

export class DockComponent {
  private readonly popupService = inject(PopupService);

  openGlossary() {
    this.popupService.open({
      title: 'Glossary & Scientific Methodology',
      items: GLOSSARY_ITEMS,
    });
  }
}
```

### 6.5 Tooltip (`TooltipDirective` / `[appTooltip]`)
Lightweight contextual tooltip directive positioned automatically:

```html
<app-button [iconOnly]="true" [appTooltip]="'Download historical SST data'">
  <svg class="icon">...</svg>
</app-button>
```

### 6.6 Splash Screen (`SplashComponent` & `SplashService` / `app-splash`)
Full-screen loading overlay displaying the official KMD logotype and progress bar during asset preloading:

```html
<app-splash [appName]="'El Niño'" />
```

```typescript
import { inject } from '@angular/core';
import { SplashService } from '@kmd/design-system';

export class AppService {
  private readonly splash = inject(SplashService);

  async loadAssets() {
    this.splash.setProgress(0.4);
    await load3DTextures();
    this.splash.setProgress(1.0);
    this.splash.complete(); // triggers smooth fade-out
  }
}
```

### 6.7 About Modal (`AboutModalComponent` & `AboutService` / `app-about-modal`)
Shared KMD Labs team presentation and project mission dialog:

```typescript
import { inject } from '@angular/core';
import { AboutService } from '@kmd/design-system';

export class HeaderComponent {
  private readonly aboutService = inject(AboutService);

  openAbout() {
    this.aboutService.open();
  }
}
```

---

## 7. Official Brand Assets

All official KMD logotypes and icons are located in `src/design-system/assets`:

- `assets/logo/kmd-black-orange.svg`: **Canonical logotype** (black wordmark with `#D37400` orange accent dot). Used on all light theme headers.
- `assets/logo/kmd-white-orange.svg`: Inverse logotype for dark marketing or terminal contexts.
- `assets/favicon.svg` & `assets/favicon.ico`: Orange accent circle icon mark for browser tabs.

---

## 8. Integration Checklist for KMD Applications

When scaffolding or modifying any KMD application, verify compliance against this checklist:

- [ ] Visualization occupies `100vw × 100vh` without scrollbars (`overflow: hidden` on `html, body`).
- [ ] No dark mode switch or theme toggle exists; theme is exclusively the canonical Light Theme (`#f5f7fb`).
- [ ] Top-Left header contains brand pill (`kmd-black-orange.svg` + app name) and compact language selector.
- [ ] Top-Right header contains single mode/view switcher dropdown.
- [ ] Bottom dock hosts timeline sliders, controls, and glossary trigger using `$control-height: 32px` buttons.
- [ ] All typography uses `Inter` (`--font-family`), with monospace (`--font-family-mono`) for numerical data.
- [ ] Breakpoints strictly use `@include respond-to(...)` or `BreakpointService`.
- [ ] Canvas renderers resolve colors at runtime via `ThemeService.getTokenColor(...)`.
- [ ] Every user-visible text string is translated in both `en.ts` and `pl.ts`.

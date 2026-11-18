# design-system (`@kmd-labs/design-system`)

Unified design system (canonical Light Theme default with opt-in Midnight dark theme), Angular UI primitives, and zero-friction app scaffolder CLI for **KMD (`kmd-labs`)** interactive visualizations.

---

## 1. Scaffold a New KMD Angular Visualization App

Run directly from GitHub with `npx` (it will interactively prompt you for the project name and display title):

```bash
npx github:kmd-labs/design-system
```

Or pass your project name and optional flags directly:

```bash
npx github:kmd-labs/design-system <your-app-name> [--globe] [--docker] [--yes] [--no-github]
```

Running the bare command (or passing `--yes` without feature flags) scaffolds a **barebones** visualization app by default. In interactive mode, the CLI also asks whether to include the optional extras below:

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--globe` | `false` | Adds `three` / `@types/three` and scaffolds a fullscreen `GlobeComponent` (`OrbitControls` with 1:1 cursor tracking and live theme reactivity) inside `.stage`. |
| `--docker` | `false` | Adds a multi-stage production `Dockerfile` (Nginx SPA), `nginx.conf`, `.dockerignore`, and `.devcontainer/` configuration. |
| `--yes`, `-y` | `false` | Skips interactive prompts and accepts defaults. |
| `--no-github` | `false` | Skips automatic GitHub repository creation and Pages setup. |

### What the CLI Scaffolder Generates:
- **Angular 21 Standalone Application** pre-wired with the KMD single Light Theme (`_variables.scss` + `_base.scss`).
- **Git Submodule (`src/design-system`)** linked to `https://github.com/kmd-labs/design-system.git` with TypeScript path alias `@kmd/design-system/*` and SCSS `includePaths`.
- **Shared brand assets:** the official KMD logotype plus the accent-orange circle favicon (`assets/favicon.svg` / `.ico`).
- **Canonical KMD HUD Layout:**
  - **Top-Left:** `KMD | <App Name>` logotype pill + compact language selector (`EN` / `PL` / `ES`) initialized from `localStorage` and `navigator.languages`.
  - **Top-Right:** Visualization view/mode switcher dropdown.
  - **Bottom Dock:** Interactive timeline slider (`app-timeline-slider`), play/pause controls, and searchable Glossary popup trigger (`PopupService`).
- **Agent Guidelines:** Includes `AGENTS.md` and `CLAUDE.md` (`@AGENTS.md`) at the repository root.
- **Automated Submodule Sync Action (`.github/workflows/sync-design-system.yml`):** Automatically pulls the latest `kmd-labs/design-system` commits on push webhook (`repository_dispatch`) and every 6 hours (`0 */6 * * *`), triggering a fresh build and deployment.

---

## 2. Consuming as a Git Submodule in Existing Apps

```bash
git submodule add -b main https://github.com/kmd-labs/design-system.git src/design-system
```

In `angular.json`:
```json
"stylePreprocessorOptions": {
  "includePaths": ["src", "src/design-system"]
}
```

In `tsconfig.json`:
```json
"paths": {
  "@kmd/design-system": ["./src/design-system/index.ts"],
  "@kmd/design-system/*": ["./src/design-system/*"]
}
```

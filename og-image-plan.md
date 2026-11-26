# Plan: Modular OG (social preview) image in `@kmd/design-system`

**Branch:** `feat/modular-og-image` (in `src/design-system`, from `main` @ `v1.33.0`)

## What's there today

| Where | What | Problem |
| :--- | :--- | :--- |
| `cli/templates/workflows.mjs` | Template for `scripts/generate-og.mjs`, **copied into each app** at scaffold time | Once copied, apps never get fixes. Text is hardcoded ("SCIENTIFIC VISUALIZATION", EUSPA award pill, "3D WebGL… planetary telemetry"), so every app looks like el-nino. |
| `scripts/generate-og.mjs` (app copy) | SVG with gradient, glows, grid and a glass card → PNG via ImageMagick `convert` | Has background decoration, uses DejaVu instead of Inter, doesn't wrap long titles, and depends on system binaries. |
| `cli/index.mjs` | Runs the generator **once** at scaffold time | Deploy never re-runs it, so renaming the repo or adding a description later doesn't update the image. |
| `services/seo.service.ts` + `app.component.ts` | At runtime, sets `og:image` to `assets/design-system/og-image.png` | Doesn't match the per-app `assets/og-image.png` in `index.html`. |

## Target design (light theme, text only)

```
┌──────────────────────────────────────────────────────────────┐  1200×630, solid #f5f7fb (neutral-50)
│                                                              │
│  KMD•                                                        │  logo slot: kmd-black-orange.svg
│                                                              │
│  Wrocławski Węzeł Wodny                                      │  title slot: Inter 700, auto-wrap ≤2 lines,
│                                                              │              shrinks to fit (68→48px)
│  Interactive 3D hydrotechnical visualization of the          │  description slot (optional): Inter 400,
│  Wrocław Water Node and historical floods.                   │              ≤3 lines, "…" if too long
│                                                              │
│  kmd-labs.github.io/wroclawski-wezel-wodny                   │  address slot: JetBrains Mono, neutral-500
████████████████████████████████████████████████████████████████  8px #D37400 accent strip
```

- **Light version only**, solid `neutral-50` (`#f5f7fb`) background, no decorative background patterns or cards.
- **4 modular slots:** KMD logo, title, optional description (empty if omitted), and `kmd-labs.github.io/<slug>` address.

## How it works

1. **Shared generator (`cli/og.mjs`):** Uses `satori` (flexbox layout + text wrapping) and `@resvg/resvg-js` (PNG rendering) with `@fontsource/inter` and `@fontsource/jetbrains-mono` `.woff` fonts.
2. **Input precedence (field by field):**
   - CLI flags (`--title`, `--description`, `--no-description`, `--footer`, `--slug`, `--out`)
   - App `package.json` → `"kmd": { "og": { "title": "...", "description": "..." } }`
   - GitHub repository description via `gh api` (if `description` is empty and `gh` / `GH_TOKEN` is available)
   - Fallback: repo slug converted to title, empty description, `kmd-labs.github.io/<slug>` address.
3. **App initialization (`cli/index.mjs`):** Prompts for an optional description (`? Short description (optional): `). If omitted, stores `"description": ""` in `package.json` under `kmd.og`, leaving the field empty in the initial OG image.
4. **Re-runnable anytime:** `npm run build:og` (or `node src/design-system/cli/og.mjs`) regenerates `src/assets/og-image.png` whenever `kmd.og` or the GitHub repo description is updated, and `.github/workflows/deploy.yml` runs it automatically before every build.
5. **Testing:** `npm test` (`node --test cli/og.test.mjs`) verifies PNG output, dimensions (1200×630), empty-description handling, long-text wrapping, and config precedence; `.github/workflows/test-scaffold.yml` runs both `npm test` and `npm run build:og` on scaffolded apps.

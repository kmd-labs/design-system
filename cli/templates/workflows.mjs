/**
 * Generates GitHub Actions workflows and helper scripts (OG image generation & GitHub repo setup).
 */
export function createWorkflowFiles({ appSlug, appTitle }) {
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

  return [
    [
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
    ],
    [
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
    ],
    [
      'scripts/generate-og.mjs',
      `#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const appTitle = ${JSON.stringify(appTitle)};
const appSlug = ${JSON.stringify(appSlug)};

let logoSvg = '';
const logoCandidates = [
  path.join(root, 'src/design-system/assets/logo/kmd-black-orange.svg'),
  path.join(root, 'assets/design-system/logo/kmd-black-orange.svg')
];
for (const p of logoCandidates) {
  if (fs.existsSync(p)) {
    logoSvg = fs.readFileSync(p, 'utf8');
    break;
  }
}

let logoPaths = '';
if (logoSvg) {
  const match = logoSvg.match(/<svg[^>]*>([\\s\\S]*?)<\\/svg>/i);
  if (match) {
    logoPaths = match[1].replace(/<defs>[\\s\\S]*?<\\/defs>/gi, '').trim();
  }
}

const cardW = 1040;
const cardH = 470;
const cardX = 80;
const cardY = 80;

const svgContent = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="50%" stop-color="#f5f7fb"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <radialGradient id="glow-1" cx="0.2" cy="0.25" r="0.6">
      <stop offset="0%" stop-color="#D37400" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#D37400" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow-2" cx="0.85" cy="0.8" r="0.6">
      <stop offset="0%" stop-color="#0284c7" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
    </radialGradient>
    <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Airy Light Background -->
  <rect width="1200" height="630" fill="url(#bg-grad)"/>
  <rect width="1200" height="630" fill="url(#glow-1)"/>
  <rect width="1200" height="630" fill="url(#glow-2)"/>

  <!-- Subtle Geometric Grid -->
  <g stroke="#0f172a" stroke-opacity="0.035" stroke-width="1">
    <line x1="0" y1="157" x2="1200" y2="157"/>
    <line x1="0" y1="315" x2="1200" y2="315"/>
    <line x1="0" y1="472" x2="1200" y2="472"/>
    <line x1="300" y1="0" x2="300" y2="630"/>
    <line x1="600" y1="0" x2="600" y2="630"/>
    <line x1="900" y1="0" x2="900" y2="630"/>
  </g>

  <!-- Frosted Glass Hero Card -->
  <g filter="url(#card-shadow)">
    <rect x="\${cardX}" y="\${cardY}" width="\${cardW}" height="\${cardH}" rx="28" fill="#ffffff" fill-opacity="0.88" stroke="#0f172a" stroke-opacity="0.08" stroke-width="1.5"/>
  </g>

  <!-- Content Container -->
  <g transform="translate(\${cardX + 64}, \${cardY + 60})">
    <!-- Top Header: Official KMD Logotype + Badge -->
    <g transform="translate(0, 0)">
      <g transform="scale(0.062)">
        \${logoPaths}
      </g>
      <rect x="190" y="14" width="228" height="32" rx="16" fill="#0f172a" fill-opacity="0.06"/>
      <text x="304" y="35" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="13" font-weight="bold" fill="#475569" text-anchor="middle" letter-spacing="1">SCIENTIFIC VISUALIZATION</text>
    </g>

    <!-- App Title (Dynamically bound to repository) -->
    <text x="0" y="218" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="52" font-weight="bold" fill="#0f172a">\${appTitle}</text>

    <!-- App Description -->
    <text x="0" y="274" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="22" fill="#475569">Zero-friction 3D WebGL simulation and planetary telemetry.</text>
    <text x="0" y="308" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="20" fill="#64748b">Open scientific datasets by KMD Labs.</text>

    <!-- Divider Line -->
    <line x1="0" y1="344" x2="\${cardW - 128}" y2="344" stroke="#e2e8f0" stroke-width="1.5"/>

    <!-- Bottom Footer Badges -->
    <g transform="translate(0, 368)">
      <!-- Repo URL Pill -->
      <rect x="0" y="0" width="270" height="34" rx="17" fill="#fdf6ed" stroke="#f7cfa0" stroke-width="1"/>
      <text x="135" y="22" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="13" font-weight="bold" fill="#D37400" text-anchor="middle">kmd-labs.github.io/\${appSlug}</text>

      <!-- Award Pill -->
      <rect x="284" y="0" width="320" height="34" rx="17" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
      <text x="444" y="22" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="13" fill="#334155" text-anchor="middle">EUSPA 11th CASSINI Hackathon EU Winners</text>

      <!-- Main Domain link -->
      <text x="\${cardW - 128}" y="22" font-family="DejaVu-Sans, Inter, -apple-system, sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="end">kmd-labs.org →</text>
    </g>
  </g>
</svg>\`;

const assetsDir = path.join(root, 'src/assets');
fs.mkdirSync(assetsDir, { recursive: true });

const svgPath = path.join(assetsDir, 'og-image.svg');
const pngPath = path.join(assetsDir, 'og-image.png');
fs.writeFileSync(svgPath, svgContent, 'utf8');

let converted = false;
try {
  execSync(\`convert -font DejaVu-Sans "\${svgPath}" "\${pngPath}"\`, { stdio: 'pipe' });
  converted = true;
} catch {
  try {
    execSync(\`rsvg-convert -w 1200 -h 630 "\${svgPath}" -o "\${pngPath}"\`, { stdio: 'pipe' });
    converted = true;
  } catch {}
}

if (!converted) {
  const fallbackPng = path.join(root, 'src/design-system/assets/og-image.png');
  if (fs.existsSync(fallbackPng)) {
    fs.copyFileSync(fallbackPng, pngPath);
  }
}
console.log('✅ Generated OpenGraph social preview assets (og-image.svg & og-image.png)');
`
    ],
    [
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

  console.log(\`\\n🎉 Repository setup complete: https://github.com/\${repo}\`);
  console.log(\`🌐 Live site URL: https://kmd-labs.github.io/${appSlug}/\\n\`);
} catch (err) {
  console.error('⚠️ Could not complete GitHub repo setup automatically:', err.message);
  console.warn('Run "npm run setup:github" once your repository is ready.');
}
`
    ]
  ];
}

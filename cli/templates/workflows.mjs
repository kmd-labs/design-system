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

      - name: Generate OpenGraph social preview
        env:
          GH_TOKEN: \${{ github.token }}
        run: npm run build:og

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
      '.github/workflows/generate-og.yml',
      `name: Generate OpenGraph Image

on:
  workflow_dispatch:
    inputs:
      title:
        description: 'Optional title override (defaults to package.json kmd.og.title)'
        required: false
        type: string
      description:
        description: 'Optional description override (defaults to package.json or GitHub repo description)'
        required: false
        type: string
      force:
        description: 'Overwrite existing custom og-image.png'
        required: false
        default: true
        type: boolean

permissions:
  contents: write

jobs:
  generate-og:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository with Design System submodule
        uses: actions/checkout@v4
        with:
          submodules: recursive

      - name: Pull latest Design System changes
        run: git submodule update --remote --force src/design-system

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install design-system dependencies
        run: npm ci --prefix src/design-system --silent

      - name: Render OpenGraph image
        env:
          GH_TOKEN: \${{ github.token }}
          INPUT_TITLE: \${{ inputs.title }}
          INPUT_DESC: \${{ inputs.description }}
          INPUT_FORCE: \${{ inputs.force }}
        run: |
          ARGS=()
          if [ -n "$INPUT_TITLE" ]; then ARGS+=(--title "$INPUT_TITLE"); fi
          if [ -n "$INPUT_DESC" ]; then ARGS+=(--description "$INPUT_DESC"); fi
          if [ "$INPUT_FORCE" = "true" ]; then ARGS+=(--force); fi
          node src/design-system/cli/og.mjs "\${ARGS[@]}"

      - name: Commit updated og-image.png
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add src/assets/og-image.png
          if ! git diff --cached --quiet; then
            git commit -m "chore(og): regenerate social preview image"
            git push
          else
            echo "No changes to src/assets/og-image.png"
          fi
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

#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createAppFiles } from './templates/app.mjs';
import { createWorkflowFiles } from './templates/workflows.mjs';
import { createGlobeFiles } from './templates/globe.mjs';
import { createDockerFiles } from './templates/docker.mjs';

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

let withDocker = process.argv.includes('--docker');
let withGlobe = process.argv.includes('--globe');
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

    if (!withGlobe) {
      const globeAnswer = (await rl.question(`? Include 3D Three.js globe component? (y/N): `)).trim();
      withGlobe = /^y(es)?$/i.test(globeAnswer);
    }

    if (!withDocker) {
      const dockerAnswer = (await rl.question(`? Include Docker & Dev Container setup? (y/N): `)).trim();
      withDocker = /^y(es)?$/i.test(dockerAnswer);
    }
  } finally {
    rl.close();
  }
} else if (!appSlug) {
  console.error('\nUsage: npx github:kmd-labs/design-system [app-name] [--docker] [--globe] [--yes] [--no-github]\n');
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

// 2. Write Angular app, workflows, and optional --globe / --docker templates
const files = [
  ...createAppFiles({ appSlug, appTitle, withGlobe }),
  ...createWorkflowFiles({ appSlug, appTitle }),
  ...(withGlobe ? createGlobeFiles() : []),
  ...(withDocker ? createDockerFiles({ appSlug, appTitle }) : [])
];

for (const [relPath, content] of files) {
  write(relPath, content);
}

// 3. Initialize git repository, link kmd-labs/design-system submodule, and apply GitHub branch protection
const skipGithub = process.argv.includes('--no-github');
try {
  execSync('git init -b main', { cwd: targetDir, stdio: 'inherit' });
  execSync(
    'git submodule add -b main https://github.com/kmd-labs/design-system.git src/design-system',
    { cwd: targetDir, stdio: 'inherit' }
  );
  try {
    execSync('node scripts/generate-og.mjs', { cwd: targetDir, stdio: 'inherit' });
  } catch (ogErr) {
    console.warn('⚠️ Could not generate dynamic og-image automatically:', ogErr.message);
  }
  try {
    execSync('npm install --package-lock-only --legacy-peer-deps --ignore-scripts', {
      cwd: targetDir,
      stdio: 'pipe'
    });
  } catch (lockErr) {
    console.warn('⚠️ Could not generate package-lock.json automatically:', lockErr.message);
  }
  execSync('git add -A && git commit -m "feat: initial kmd-labs app scaffold"', {
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

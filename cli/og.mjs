#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DESIGN_SYSTEM_ROOT = path.resolve(__dirname, '..');

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Design tokens from _variables.scss (light theme)
const TOKENS = {
  bg: '#f5f7fb',       // neutral-50
  title: '#0f172a',    // neutral-900
  body: '#475569',     // neutral-600
  muted: '#64748b',    // neutral-500
  accent: '#d37400',   // warning-500 (KMD orange)
};

/** Converts a kebab-case slug into a readable title. */
export function slugToTitle(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function loadFont(relPath) {
  const fullPath = path.join(DESIGN_SYSTEM_ROOT, 'node_modules', relPath);
  return fs.readFileSync(fullPath);
}

let cachedFonts = null;
function getFonts() {
  if (cachedFonts) return cachedFonts;
  cachedFonts = [
    {
      name: 'Inter',
      data: loadFont('@fontsource/inter/files/inter-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: loadFont('@fontsource/inter/files/inter-latin-ext-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: loadFont('@fontsource/inter/files/inter-latin-700-normal.woff'),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'Inter',
      data: loadFont('@fontsource/inter/files/inter-latin-ext-700-normal.woff'),
      weight: 700,
      style: 'normal',
    },
    {
      name: 'JetBrains Mono',
      data: loadFont('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'JetBrains Mono',
      data: loadFont('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-ext-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
  ];
  return cachedFonts;
}

let cachedLogoDataUri = null;
function getLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  const logoPath = path.join(DESIGN_SYSTEM_ROOT, 'assets/logo/kmd-black-orange.svg');
  const svg = fs.readFileSync(logoPath, 'utf8');
  cachedLogoDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return cachedLogoDataUri;
}

function pickTitleSize(title) {
  const len = title.length;
  if (len <= 22) return 68;
  if (len <= 40) return 58;
  return 48;
}

/**
 * Renders a 1200x630 light-theme OpenGraph PNG and SVG for a KMD Labs app.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.description]
 * @param {string} [opts.footer]
 * @returns {Promise<{ png: Buffer, svg: string }>}
 */
export async function renderOgImage({ title, description = '', footer = '' }) {
  const cleanTitle = (title || 'KMD Labs').trim();
  const cleanDescription = (description || '').trim();
  const cleanFooter = (footer || '').trim();
  const titleFontSize = pickTitleSize(cleanTitle);

  const logoSrc = getLogoDataUri();
  // kmd-black-orange.svg natural aspect ratio is 319:128
  const logoHeight = 56;
  const logoWidth = Math.round((319 / 128) * logoHeight);

  const children = [
    // Main padded content area
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexGrow: 1,
          padding: '64px 80px 56px 80px',
        },
        children: [
          // Top slot: KMD logo
          {
            type: 'div',
            props: {
              style: { display: 'flex', alignItems: 'center' },
              children: [
                {
                  type: 'img',
                  props: {
                    src: logoSrc,
                    width: logoWidth,
                    height: logoHeight,
                  },
                },
              ],
            },
          },
          // Middle slot: Title + optional Description
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '22px',
                marginTop: '12px',
                marginBottom: '12px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontFamily: 'Inter',
                      fontWeight: 700,
                      fontSize: `${titleFontSize}px`,
                      lineHeight: 1.15,
                      letterSpacing: '-0.025em',
                      color: TOKENS.title,
                      maxWidth: '1040px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    },
                    children: cleanTitle,
                  },
                },
                ...(cleanDescription
                  ? [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontFamily: 'Inter',
                            fontWeight: 400,
                            fontSize: '28px',
                            lineHeight: 1.45,
                            color: TOKENS.body,
                            maxWidth: '980px',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          },
                          children: cleanDescription,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          // Bottom slot: GitHub Pages address
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                minHeight: '30px',
              },
              children: cleanFooter
                ? [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontFamily: 'JetBrains Mono',
                          fontWeight: 400,
                          fontSize: '22px',
                          color: TOKENS.muted,
                        },
                        children: cleanFooter,
                      },
                    },
                  ]
                : [],
            },
          },
        ],
      },
    },
    // Bottom 8px KMD orange accent strip
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '8px',
          backgroundColor: TOKENS.accent,
          flexShrink: 0,
        },
      },
    },
  ];

  const element = {
    type: 'div',
    props: {
      style: {
        width: `${OG_WIDTH}px`,
        height: `${OG_HEIGHT}px`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: TOKENS.bg,
      },
      children,
    },
  };

  const svg = await satori(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: getFonts(),
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: OG_WIDTH },
  });
  const png = resvg.render().asPng();

  return { png, svg };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-description') {
      args.noDescription = true;
    } else if (a === '--force' || a === '-f') {
      args.force = true;
    } else if (a.startsWith('--') && i + 1 < argv.length) {
      const key = a.slice(2);
      args[key] = argv[++i];
    }
  }
  return args;
}

function detectGitHubRepo(cwd) {
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY.trim();
  }
  try {
    const url = execSync('git remote get-url origin', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const match = url.match(/github\.com[:/]([^/]+\/[^/.]+?)(?:\.git)?$/);
    if (match) return match[1];
  } catch {
    // ignore when not a git repo or no origin remote
  }
  return '';
}

function fetchGitHubDescription(repo, cwd) {
  if (!repo) return '';
  try {
    const out = execSync(`gh api "repos/${repo}" --jq ".description // empty"`, {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    })
      .toString()
      .trim();
    return out;
  } catch {
    return '';
  }
}

/**
 * Resolves OG card configuration from CLI flags, package.json (`kmd.og`),
 * GitHub repository metadata, and slug fallbacks.
 */
export function resolveOgConfig({ cwd = process.cwd(), argv = [] } = {}) {
  const cli = parseArgs(argv);

  let pkg = {};
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {
      pkg = {};
    }
  }

  const kmdOg = pkg?.kmd?.og ?? {};
  const repo = detectGitHubRepo(cwd);
  const repoSlug = repo ? repo.split('/')[1] : '';
  const slug = cli.slug ?? kmdOg.slug ?? pkg.name ?? repoSlug ?? path.basename(cwd);

  const title = cli.title ?? kmdOg.title ?? slugToTitle(slug);

  let description = '';
  if (!cli.noDescription) {
    if (cli.description !== undefined) {
      description = cli.description;
    } else if (typeof kmdOg.description === 'string' && kmdOg.description.trim() !== '') {
      description = kmdOg.description;
    } else {
      description = fetchGitHubDescription(repo, cwd);
    }
  }

  const owner = repo ? repo.split('/')[0] : 'kmd-labs';
  const footer =
    cli.footer !== undefined
      ? cli.footer
      : (kmdOg.footer ?? (slug ? `${owner}.github.io/${slug}` : ''));

  const outPath = path.resolve(cwd, cli.out ?? 'src/assets/og-image.png');
  const svgOutPath = cli['svg-out'] ? path.resolve(cwd, cli['svg-out']) : null;
  const hasKmdOg = Boolean(pkg?.kmd?.og);
  const custom = Boolean(kmdOg.custom);
  const force = Boolean(cli.force);

  return { slug, title, description, footer, outPath, svgOutPath, hasKmdOg, custom, force };
}

/** Generates the OG image file(s) for a KMD app directory. */
export async function generateOgImage(options = {}) {
  const config = resolveOgConfig(options);

  if (fs.existsSync(config.outPath) && !config.force) {
    if (config.custom || !config.hasKmdOg) {
      return { ...config, skipped: true };
    }
  }

  const { png, svg } = await renderOgImage(config);

  fs.mkdirSync(path.dirname(config.outPath), { recursive: true });
  fs.writeFileSync(config.outPath, png);

  if (config.svgOutPath) {
    fs.mkdirSync(path.dirname(config.svgOutPath), { recursive: true });
    fs.writeFileSync(config.svgOutPath, svg, 'utf8');
  }

  return { ...config, skipped: false };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  try {
    const config = await generateOgImage({
      cwd: process.cwd(),
      argv: process.argv.slice(2),
    });
    if (config.skipped) {
      console.log(
        `ℹ️  Preserved existing ${path.relative(process.cwd(), config.outPath)} (pass --force to overwrite).`
      );
    } else {
      console.log(
        `✅ Generated OG image (${OG_WIDTH}x${OG_HEIGHT}): ${path.relative(process.cwd(), config.outPath)}`
      );
    }
  } catch (err) {
    console.error('❌ Failed to generate OG image:', err);
    process.exit(1);
  }
}

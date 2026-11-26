import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  OG_WIDTH,
  OG_HEIGHT,
  slugToTitle,
  renderOgImage,
  resolveOgConfig,
  generateOgImage,
} from './og.mjs';

function readPngDimensions(buf) {
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  assert.equal(buf.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Expected valid PNG header');
  // IHDR chunk starts at byte 8 (4 len, 4 'IHDR', 4 width, 4 height)
  assert.equal(buf.subarray(12, 16).toString('ascii'), 'IHDR');
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

test('slugToTitle converts kebab-case to Title Case', () => {
  assert.equal(slugToTitle('el-nino'), 'El Nino');
  assert.equal(slugToTitle('wroclawski-wezel-wodny'), 'Wroclawski Wezel Wodny');
});

test('renderOgImage generates a 1200x630 PNG with title, description, and address', async () => {
  const { png, svg } = await renderOgImage({
    title: 'El Nino',
    description: 'Interactive 3D Pacific sea-surface temperature anomaly visualization.',
    footer: 'kmd-labs.github.io/el-nino',
  });

  const dims = readPngDimensions(png);
  assert.equal(dims.width, OG_WIDTH);
  assert.equal(dims.height, OG_HEIGHT);
  assert.ok(svg.includes('<svg'), 'Expected SVG output');
  assert.ok(svg.includes('data:image/svg+xml;base64,'), 'Expected embedded KMD logo');
});

test('renderOgImage omits description when empty', async () => {
  const withDesc = await renderOgImage({
    title: 'El Nino',
    description: 'Unique description sentinel',
    footer: 'kmd-labs.github.io/el-nino',
  });
  const withoutDesc = await renderOgImage({
    title: 'El Nino',
    description: '',
    footer: 'kmd-labs.github.io/el-nino',
  });

  const dims = readPngDimensions(withoutDesc.png);
  assert.equal(dims.width, OG_WIDTH);
  assert.equal(dims.height, OG_HEIGHT);
  assert.notEqual(withDesc.svg, withoutDesc.svg);
});

test('renderOgImage handles long titles and Polish diacritics without throwing', async () => {
  const { png } = await renderOgImage({
    title: 'Wrocławski Węzeł Wodny — Hydrotechnical Simulation & Historical Floods',
    description:
      'Interactive 3D hydrotechnical visualization of the Wrocław Water Node, historical floods (1997, 2010, 2024), and channel evolution across the Odra river basin.',
    footer: 'kmd-labs.github.io/wroclawski-wezel-wodny',
  });

  const dims = readPngDimensions(png);
  assert.equal(dims.width, OG_WIDTH);
  assert.equal(dims.height, OG_HEIGHT);
});

test('resolveOgConfig respects precedence: CLI > package.json kmd.og > slug fallback', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kmd-og-cfg-'));
  try {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'el-nino',
        kmd: {
          og: {
            title: 'El Niño Southern Oscillation',
            description: 'From package.json',
          },
        },
      })
    );

    const fromPkg = resolveOgConfig({ cwd: tmpDir, argv: [] });
    assert.equal(fromPkg.title, 'El Niño Southern Oscillation');
    assert.equal(fromPkg.description, 'From package.json');
    assert.equal(fromPkg.footer, 'kmd-labs.github.io/el-nino');

    const fromCli = resolveOgConfig({
      cwd: tmpDir,
      argv: ['--title', 'Override Title', '--no-description'],
    });
    assert.equal(fromCli.title, 'Override Title');
    assert.equal(fromCli.description, '');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('generateOgImage writes src/assets/og-image.png in target app directory', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kmd-og-gen-'));
  try {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        name: 'solar-wind',
        kmd: { og: { title: 'Solar Wind', description: '' } },
      })
    );

    const result = await generateOgImage({ cwd: tmpDir, argv: [] });
    assert.ok(fs.existsSync(result.outPath), 'Expected og-image.png to be created');
    const dims = readPngDimensions(fs.readFileSync(result.outPath));
    assert.equal(dims.width, OG_WIDTH);
    assert.equal(dims.height, OG_HEIGHT);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('generateOgImage preserves existing og-image.png unless kmd.og is configured or --force is passed', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kmd-og-keep-'));
  try {
    const outPath = path.join(tmpDir, 'src/assets/og-image.png');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, 'custom-existing-png');
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'el-nino' }));

    const skipped = await generateOgImage({ cwd: tmpDir, argv: [] });
    assert.equal(skipped.skipped, true);
    assert.equal(fs.readFileSync(outPath, 'utf8'), 'custom-existing-png');

    // Also preserved when kmd.og.custom is true
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'el-nino', kmd: { og: { custom: true, title: 'El Niño' } } })
    );
    const skippedCustom = await generateOgImage({ cwd: tmpDir, argv: [] });
    assert.equal(skippedCustom.skipped, true);
    assert.equal(fs.readFileSync(outPath, 'utf8'), 'custom-existing-png');

    // Overwritten when --force is passed
    const forced = await generateOgImage({ cwd: tmpDir, argv: ['--force'] });
    assert.equal(forced.skipped, false);
    const dims = readPngDimensions(fs.readFileSync(outPath));
    assert.equal(dims.width, OG_WIDTH);
    assert.equal(dims.height, OG_HEIGHT);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

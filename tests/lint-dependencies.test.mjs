import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { ESLint } from 'eslint';

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve('@next/eslint-plugin-next'));
const { getRootDirs } = pluginRequire('./utils/get-root-dirs.js');

// The override is intentionally scoped to Next's sole fast-glob consumer.
// Exercise the actual plugin entry point, including settings used by monorepos.
test('Next resolves configured roots through the safe glob implementation', () => {
  assert.equal(pluginRequire('fast-glob/package.json').name, '@lexio/next-eslint-glob');
  const root = mkdtempSync(join(tmpdir(), 'lexio-lint-'));
  try {
    for (const name of ['web', 'admin']) mkdirSync(join(root, 'apps', name), { recursive: true });
    writeFileSync(join(root, 'apps', 'not-a-directory.ts'), '');
    mkdirSync(join(root, 'apps', 'web', 'pages'));
    mkdirSync(join(root, 'apps', 'web', 'pages', 'nested'));
    const resolve = (rootDir) => getRootDirs({ cwd: root, settings: { next: { rootDir } } }).sort();
    const expected = [join(root, 'apps', 'admin'), join(root, 'apps', 'web')];
    assert.deepEqual(getRootDirs({ cwd: root, settings: {} }), [root]);
    assert.deepEqual(resolve(join(root, 'apps', '*')), expected);
    assert.deepEqual(resolve(join(root, 'apps', '{web,admin}')), expected);
    assert.deepEqual(resolve([join(root, 'apps', 'web'), join(root, 'apps', 'admin'), null]), expected);
    assert.deepEqual(resolve(join(root, 'apps', 'missing*')), []);
    assert.deepEqual(resolve(join(root, 'apps', '*').replaceAll('/', '\\')), expected);
    const relativePattern = relative(process.cwd(), join(root, 'apps', '*'));
    assert.deepEqual(resolve(relativePattern), expected.map((path) => relative(process.cwd(), path)).sort());
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Next, React Hooks and TypeScript protections remain active', async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(`
    'use client';
    import { useState } from 'react';
    export default async function Example({ enabled }: { enabled: boolean }) {
      const unused = 1;
      if (enabled) useState(0);
      return <p>Hello</p>;
    }
  `, { filePath: 'src/app/lint-regression.tsx' });
  const rules = result.messages.map((message) => message.ruleId);
  for (const rule of ['@next/next/no-async-client-component', 'react-hooks/rules-of-hooks', '@typescript-eslint/no-unused-vars']) {
    assert.ok(rules.includes(rule), `Missing protection: ${rule}; received ${rules.join(', ')}`);
  }
});

test('Next page-link rule still finds pages through a configured root glob', async () => {
  const root = mkdtempSync(join(tmpdir(), 'lexio-pages-'));
  try {
    mkdirSync(join(root, 'web', 'pages'), { recursive: true });
    writeFileSync(join(root, 'web', 'pages', 'about.js'), 'export default function About() {}');
    const eslint = new ESLint({ overrideConfig: [{ settings: { next: { rootDir: join(root, '*') } } }] });
    const [result] = await eslint.lintText('export default function Link() { return <a href="/about">About</a>; }', {
      filePath: 'src/app/lint-links-regression.tsx',
    });
    assert.ok(result.messages.some((message) => message.ruleId === '@next/next/no-html-link-for-pages'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('adapter rejects unsupported calls instead of silently skipping lint roots', () => {
  const { globSync } = pluginRequire('fast-glob');
  assert.throws(() => globSync(['apps/*'], { onlyDirectories: true }), TypeError);
  assert.throws(() => globSync('apps/*', { onlyDirectories: true, ignore: ['x'] }), TypeError);
});

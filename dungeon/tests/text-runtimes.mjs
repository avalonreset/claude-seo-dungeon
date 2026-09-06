import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const bridge = createRequire(import.meta.url)('../server/index.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-text-runtimes-'));
const saved = { ...process.env };
try {
  for (const key of Object.keys(process.env)) {
    if (/^SEO_DUNGEON_(GROK|GEMINI|CLAUDE)_/.test(key)) delete process.env[key];
  }
  assert.equal(bridge.normalizeRuntime('GROK'), 'grok');
  assert.deepEqual(bridge.getBridgeCapabilities().supportedRuntimes, ['codex', 'claude', 'gemini', 'grok']);
  assert.deepEqual(bridge.resolveTextCli('grok').args,
    ['--single', '{{prompt}}', '--output-format', 'plain', '--permission-mode', 'acceptEdits']);
  assert.equal(bridge.getTextCliProfileConfig('grok', 'deep').model, '');
  assert.equal(bridge.getTextCliProfileConfig('grok', 'deep').effort, 'high');
  assert.equal(bridge.getTextCliProfileConfig('grok', 'fast').effort, 'medium');
  process.env.SEO_DUNGEON_GROK_MODEL = 'configured-model';
  process.env.SEO_DUNGEON_GROK_MODEL_FAST = 'configured-fast-model';
  assert.equal(bridge.getTextCliProfileConfig('grok', 'fast').model, 'configured-fast-model');
  assert.equal(bridge.getTextCliProfileConfig('grok', 'deep').model, 'configured-model');
  delete process.env.SEO_DUNGEON_GROK_MODEL;
  delete process.env.SEO_DUNGEON_GROK_MODEL_FAST;

  const fixture = path.join(tmp, 'fake text agent.cjs');
  fs.writeFileSync(fixture, `
const args = process.argv.slice(2);
const promptFlag = args.includes('--single') ? '--single' : args.includes('--prompt') ? '--prompt' : null;
const prompt = promptFlag ? args[args.indexOf(promptFlag) + 1] : args[args.length - 1];
if (prompt.includes('FORCE_FAILURE')) { process.stderr.write('fixture account unavailable'); process.exit(2); }
process.stdout.write(JSON.stringify({args, prompt, cwd: process.cwd()}) + '\\n');
`);
  const prompt = 'Check example.com; literal $() and "quotes" stay in the prompt.\nSecond line.';
  for (const runtime of ['claude', 'gemini', 'grok']) {
    const defaults = bridge.resolveTextCli(runtime).args;
    const env = runtime.toUpperCase();
    process.env[`SEO_DUNGEON_${env}_CLI`] = process.execPath;
    process.env[`SEO_DUNGEON_${env}_ARGS`] = [`"${fixture}"`, ...defaults].join(' ');
    const stream = [];
    const result = await bridge.runAgent(prompt, line => stream.push(line), tmp, `test-${runtime}`, { runtime, profile: 'fast' });
    assert.equal(result.cwd, tmp);
    assert(result.prompt.endsWith(prompt));
    assert(result.prompt.includes(`using ${runtime}`));
    assert(stream.length > 0);
    assert(!result.args.includes('app-server'), 'text runtimes must never fall back to Codex');
    if (runtime === 'grok') {
      assert.equal(result.args[result.args.indexOf('--reasoning-effort') + 1], 'medium');
      assert(!result.args.includes('--model'), 'use the authenticated CLI model by default');
    }
    await assert.rejects(bridge.runAgent('FORCE_FAILURE', () => {}, tmp, `fail-${runtime}`, { runtime }), /fixture account unavailable/);
  }
  console.log('Text runtime launch, streaming, profile, quoting, and failure tests passed (Claude, Gemini, Grok).');
} finally {
  for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
  Object.assign(process.env, saved);
  fs.rmSync(tmp, { recursive: true, force: true });
}

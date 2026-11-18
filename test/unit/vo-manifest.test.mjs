import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkVoiceManifest, checkAudioFiles } from '../content_keys.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const LINES = path.join(ROOT, 'src/content/lines.json');
const narration = args => spawnSync('python3', [path.join(ROOT, 'art/narration.py'), ...args], { cwd: ROOT, encoding: 'utf8' });
const narrationEnv = (args, env) => spawnSync('python3', [path.join(ROOT, 'art/narration.py'), ...args], { cwd: ROOT, encoding: 'utf8', env });

export function realGameAudioFilesAndManifestAreInSync({ assert }) {
  const fileProbs = checkAudioFiles('game');
  assert.deepEqual(fileProbs, [], fileProbs.join('\n'));
  const manProbs = checkVoiceManifest('game');
  assert.deepEqual(manProbs, [], manProbs.join('\n'));
}

export function hermeticRealRunRedoesOnlyEditedClipAndDoesNotRequireNetwork({ assert }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forest-vo-test-'));
  try {
    const all = narration(['--all', '--dry-run', '--out', dir]).stdout.split('\n').filter(Boolean).map(l => l.split(' | ')[0]);
    for (const f of all) fs.writeFileSync(path.join(dir, f), 'x');
    assert.equal(narration(['--write-manifest', '--out', dir]).status, 0);

    const bin = path.join(dir, 'bin'), py = path.join(dir, 'py');
    fs.mkdirSync(bin); fs.mkdirSync(py);
    fs.writeFileSync(path.join(py, 'sitecustomize.py'), [
      'import urllib.request',
      'class _R:',
      '    def __enter__(self): return self',
      '    def __exit__(self, *a): pass',
      '    def read(self): return b"RAW" * 50',
      'urllib.request.urlopen = lambda req, timeout=None: _R()',
      ''].join('\n'));
    fs.writeFileSync(path.join(bin, 'ffmpeg'), '#!/bin/sh\nfor last; do :; done\n[ "$last" = "-" ] || head -c 600 /dev/zero | tr "\\0" "M" > "$last"\n');
    fs.writeFileSync(path.join(bin, 'ffprobe'), '#!/bin/sh\necho 1.4\n');
    fs.chmodSync(path.join(bin, 'ffmpeg'), 0o755); fs.chmodSync(path.join(bin, 'ffprobe'), 0o755);

    const doc = JSON.parse(fs.readFileSync(LINES, 'utf8'));
    const editedKey = 'p1';
    doc.lines[editedKey].say[0] += '呀';
    const editedPath = path.join(dir, 'lines.edited.json');
    fs.writeFileSync(editedPath, JSON.stringify(doc));

    const env = { ...process.env, ELEVENLABS_API_KEY: 'fake-key', PATH: bin + path.delimiter + process.env.PATH, PYTHONPATH: py };
    const r = narrationEnv(['--lines', editedPath, '--out', dir], env);
    assert.equal(r.status, 0, r.stderr);
    const touched = all.filter(f => fs.readFileSync(path.join(dir, f), 'utf8') !== 'x');
    assert.deepEqual(touched, [`vo_${editedKey}.mp3`]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

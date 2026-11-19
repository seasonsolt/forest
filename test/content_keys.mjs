/* Content key, lines.json <-> view <-> words.json <-> game audio manifest integrity check. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, loadLogic } from './harness.mjs';

const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

export function checkAudioFiles(dir = 'game') {
  const run = args => spawnSync('python3', ['art/narration.py', ...args, '--out', dir], { cwd: ROOT, encoding: 'utf8' });
  const rows = r => r.stdout.split('\n').filter(Boolean).map(l => l.split(' | '));
  const missing = run(['--dry-run']), orphan = run(['--prune', '--dry-run']);
  const problems = [];
  for (const [what, r] of [['dry run', missing], ['prune dry run', orphan]]) {
    if (r.error || r.status !== 0) problems.push(`audio files: art/narration.py ${what} failed (${r.error ? r.error.message : r.stderr.trim().split('\n').pop()})`);
  }
  if (problems.length) return problems;
  for (const [f, reason] of rows(missing)) if (reason === 'missing') problems.push(`audio: ${dir}/${f} is missing`);
  for (const [f] of rows(orphan)) problems.push(`audio: ${dir}/${f} is an orphan`);
  return problems;
}

export function checkVoiceManifest(dir = 'game') {
  const r = spawnSync('python3', ['art/narration.py', '--verify-manifest', '--out', dir], { cwd: ROOT, encoding: 'utf8' });
  if (r.error || r.status > 1) return [`voice manifest: art/narration.py --verify-manifest failed (${r.error ? r.error.message : r.stderr.trim().split('\n').pop()})`];
  const why = { stale: 'recipe changed since audio was made', unrecorded: 'unlisted in manifest', extra: 'not needed anymore' };
  const rows = r.stdout.split('\n').filter(Boolean).map(l => l.split(' | '));
  const problems = rows.map(([f, kind]) => `voice manifest: ${dir}/${f} ${why[kind] || kind}`);
  if (r.status === 1 && !problems.length) problems.push('voice manifest exited 1 without naming a clip');
  return problems;
}

export function checkContentKeys(logic = loadLogic()) {
  const problems = [];
  const doc = JSON.parse(read('src/content/lines.json'));
  const lines = doc.lines || {};
  const words = JSON.parse(read('src/content/words.json'));
  const wordIds = new Set(words.map(w => w.id));
  const viewSrc = ['src/lib', 'src/view'].flatMap(dir =>
    fs.readdirSync(path.join(ROOT, dir)).filter(f => f.endsWith('.js')).sort().map(f => read(`${dir}/${f}`))
  ).join('\n');

  const need = ['p1', 'p2', 'p3', 'win', 'end', 'me_labrador', 'me_skye', 'screen2_letter',
    'stone_assist', 'tutor_tap', 'tutor_phonics', 'tutor_fullscreen',
    'ui_play', 'ui_continue', 'ui_next', 'ui_replay', 'ui_back', 'ui_words', 'ui_stickers', 'ui_wardrobe',
    'ui_settings', 'ui_hint', 'ui_fullscreen', 'ui_sound', 'ui_quiz_skip', 'ui_meet', 'ui_rooms',
    'clue_1', 'clue_2', 'clue_3', 'clue_4', 'stone_try_1', 'stone_try_2', 'stone_try_3',
    'quiz_right_1', 'quiz_right_2', 'quiz_right_3', 'quiz_wrong_1', 'quiz_wrong_2', 'quiz_wrong_3',
    'idle_1', 'idle_2', 'idle_3', 'idle_4', 'cheer_1', 'cheer_2', 'cheer_3', 'cheer_4'];

  logic.levels.forEach((lv, i) => {
    need.push(`ch_${lv.id}`, `case_${lv.id}`, `clear_${lv.id}`, `mem_${lv.memoryId}`, `ui_room_${lv.id}`);
    for (const w of lv.words) {
      need.push(`learn_${w}`, `spot_${w}`, `blend_${w}`, `quiz_${w}`);
      if (i < logic.levels.length - 1) need.push(`recall_${w}`);
    }
    for (const r of lv.rounds) {
      for (const c of r.choices || []) need.push(`ph_${c}`);
    }
  });

  for (const k of new Set(need)) if (!lines[k]) problems.push(`lines.json missing key '${k}'`);
  for (const [k, def] of Object.entries(lines)) {
    for (const seg of def.say || []) if (seg && typeof seg === 'object' && seg.w && !wordIds.has(seg.w)) problems.push(`lines.${k} unknown word ${seg.w}`);
  }
  const uis = new Set();
  for (const m of viewSrc.matchAll(/\bui:\s*'([a-z0-9_]+)'/g)) uis.add(m[1]);
  for (const ui of uis) if (!lines['ui_' + ui]) problems.push(`view references ui:'${ui}' but lines.json lacks 'ui_${ui}'`);

  if (fs.existsSync(path.join(ROOT, 'art/sizes.json'))) {
    const sizes = JSON.parse(read('art/sizes.json'));
    for (const w of words.filter(x => x.kind === 'core')) {
      const pic = w.icon || `word_${w.id}`;
      if (!fs.existsSync(path.join(ROOT, 'game', `${pic}.webp`))) problems.push(`missing game/${pic}.webp`);
      if (!sizes[pic]) problems.push(`art/sizes.json missing '${pic}'`);
    }
    for (const lv of logic.levels) {
      if (!fs.existsSync(path.join(ROOT, 'game', `${lv.bg}.webp`))) problems.push(`missing game/${lv.bg}.webp`);
      for (const h of lv.sceneA) if (!fs.existsSync(path.join(ROOT, 'game', `${h.prop}.webp`))) problems.push(`missing game/${h.prop}.webp`);
    }
  }
  return problems;
}

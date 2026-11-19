#!/usr/bin/env node
/* Word exposure report & gate: every core word must appear >= 6 times in context per playthrough. */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadLogic } from './harness.mjs';

export const THRESHOLD = 6;
const DOC = 'src/content/exposure.md';
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

export function computeExposure({ levels, lines, words }) {
  const hearings = (key, w) => {
    const def = lines[key];
    return def && Array.isArray(def.say) ? def.say.filter(s => s && typeof s === 'object' && s.w === w).length : 0;
  };
  const roomIdx = new Map(levels.map((lv, idx) => [lv.id, idx]));
  const core = (words || JSON.parse(read('src/content/words.json'))).filter(w => w.kind === 'core');
  const rows = [];
  for (const entry of core) {
    const idx = roomIdx.get(entry.room) ?? 0;
    const lv = levels[idx];
    const next = levels[idx + 1];
    const w = entry.id;
    let learn = 0;
    for (const x of lv.words) learn += hearings(`learn_${x}`, w);
    const chapter = hearings(`ch_${lv.id}`, w);
    const spot = hearings(`spot_${w}`, w);
    const blend = hearings(`blend_${w}`, w);
    const clear = hearings(`clear_${lv.id}`, w);
    const quiz = hearings(`quiz_${w}`, w);
    const inContext = learn + chapter + spot + blend + clear + quiz;
    const recall = next ? hearings(`recall_${w}`, w) : 0;
    rows.push({ room: lv.id, word: w, learn, chapter, spot, blend, clear, quiz, inContext, recall, low: inContext < THRESHOLD });
  }
  return rows;
}

export function formatTable(rows) {
  const COLS = [['room', 'room'], ['word', 'word'], ['learn', 'learn'], ['chapter', 'chapter'], ['spot', 'spot'], ['blend', 'blend'], ['clear', 'clear'], ['quiz', 'quiz'], ['inContext', 'in-context'], ['recall', 'recall']];
  const cells = rows.map(r => COLS.map(([k]) => String(r[k])).concat(r.low ? '<' : ''));
  const head = COLS.map(c => c[1]).concat('');
  const width = head.map((h, i) => Math.max(h.length, ...cells.map(c => c[i].length)));
  const line = c => c.map((x, i) => (i < 2 ? x.padEnd(width[i]) : x.padStart(width[i]))).join('  ').trimEnd();
  return [line(head), line(width.map(w => '-'.repeat(w))), ...cells.map(line)].join('\n');
}

export function exposureReport(logic = loadLogic()) {
  const lines = JSON.parse(read('src/content/lines.json')).lines || {};
  const rows = computeExposure({ levels: logic.levels, lines });
  const low = rows.filter(r => r.low).length;
  const min = Math.min(...rows.map(r => r.inContext));
  const max = Math.max(...rows.map(r => r.inContext));
  const summary = `${low} of ${rows.length} core words are below ${THRESHOLD} in-context hearings; in-context ranges ${min}..${max}`;
  const text = formatTable(rows);
  const md = `# 单词曝光量表（核心词过关门槛 ≥ ${THRESHOLD}）\n\n\`\`\`\n${text}\n\`\`\`\n\n${summary}\n`;
  return { rows, text, summary, md };
}

export function exposureProblems(rep) {
  const out = [];
  for (const r of rep.rows) if (r.low) out.push(`${r.room}/${r.word}: ${r.inContext} < ${THRESHOLD}`);
  const docPath = path.join(ROOT, DOC);
  if (!fs.existsSync(docPath) || fs.readFileSync(docPath, 'utf8') !== rep.md) out.push(`${DOC} is stale (run node test/exposure.mjs --write)`);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rep = exposureReport();
  console.log(rep.text + '\n' + rep.summary);
  if (process.argv.includes('--write')) {
    fs.writeFileSync(path.join(ROOT, DOC), rep.md);
    console.log('wrote', DOC);
  }
  if (process.argv.includes('--check')) {
    const probs = exposureProblems(rep);
    if (probs.length) { console.error(probs.join('\n')); process.exit(1); }
  }
}

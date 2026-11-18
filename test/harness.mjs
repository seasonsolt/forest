/* Test harness for forest: loads src/*.js (or built forest.html <script id="logic">) and drives Scene A + Scene B in Node. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DT = 1 / 60;

const EXPORTS = `;({ createGame, LEVELS, STAGE_W, STAGE_H, IDLE_HINT_SEC })`;

export function loadLogic({ html = null } = {}) {
  let code, source;
  if (html) {
    const file = path.resolve(html);
    const page = fs.readFileSync(file, 'utf8');
    const m = page.match(/<script id="logic">([\s\S]*?)<\/script>/);
    if (!m) throw new Error(`${file}: no <script id="logic"> found`);
    code = m[1];
    source = `html:${path.relative(ROOT, file) || file}`;
  } else {
    const dir = path.join(ROOT, 'src');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort();
    code = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('');
    source = `src:${files.join('+')}`;
  }
  const api = vm.runInNewContext(code + '\n' + EXPORTS, {}, { filename: source });
  return Object.assign(api, { levels: api.LEVELS, source });
}

export function libNames() {
  return fs.readdirSync(path.join(ROOT, 'src', 'lib')).filter(f => f.endsWith('.js')).sort().map(f => f.slice(0, -3));
}

export function loadLib(names, context = {}, expr = 'undefined') {
  const list = names || libNames();
  const code = list.map(n => fs.readFileSync(path.join(ROOT, 'src', 'lib', `${n}.js`), 'utf8')).join('');
  return vm.runInNewContext(code + '\n' + expr, context, { filename: `lib:${list.join('+')}` });
}

export function solveRoom(logic, idx) {
  const g = logic.createGame();
  g.start(idx);
  const lv = logic.LEVELS[idx];
  const expectedFinal = idx === logic.LEVELS.length - 1 ? 'win' : 'clear';
  for (const h of lv.sceneA) {
    if (!g.tapHotspot(h.id)) throw new Error(`${lv.id}: failed tapping hotspot ${h.id}`);
    for (let k = 0; k < 10; k++) g.step(DT);
  }
  if (g.screen !== 1) throw new Error(`${lv.id}: expected auto-advance to screen 1 after opening all 6 hotspots`);
  for (let rIdx = 0; rIdx < lv.rounds.length; rIdx++) {
    const r = lv.rounds[rIdx];
    if (!g.tapStone(r.onset)) throw new Error(`${lv.id} round ${rIdx}: failed onset ${r.onset}`);
    if (lv.mode === 'blend') {
      if (!g.tapStone(r.rime)) throw new Error(`${lv.id} round ${rIdx}: failed rime ${r.rime}`);
    }
    for (let k = 0; k < 10; k++) g.step(DT);
  }
  if (g.state !== expectedFinal) throw new Error(`${lv.id}: ended in ${g.state}, expected ${expectedFinal}`);
  if (!g.memoryFound || g.acorns.got !== g.acorns.total) throw new Error(`${lv.id}: missing memory or acorns`);
  return { state: g.state, time: g.time, events: g.drain() };
}

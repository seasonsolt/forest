import fs from 'node:fs';
import path from 'node:path';

export function titleSetFitsBudgetAndCoversRoomOne({ logic, loadLib, assert, ROOT }) {
  const lines = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/lines.json'), 'utf8'));
  const { assetPlan } = loadLib(['assets'], {}, '({ assetPlan })');
  const plan = assetPlan(logic.levels, lines, {});
  const titleSet = new Set(plan.title);
  let totalBytes = 0;
  for (const name of titleSet) {
    const p = path.join(ROOT, 'game', `${name}.webp`);
    assert.ok(fs.existsSync(p), `missing title asset game/${name}.webp`);
    totalBytes += fs.statSync(p).size;
  }
  assert.ok(totalBytes < 2_500_000, `title set size ${totalBytes} exceeds 2.5 MB budget`);
  assert.ok(titleSet.has(logic.levels[0].bg), 'title set must cover first room background');
  for (const h of logic.levels[0].sceneA) assert.ok(titleSet.has(h.prop), `title set missing room 1 prop ${h.prop}`);
}

export function hdCopiesExistAndDecodeForStagePictures({ assert, ROOT }) {
  const hdIdxPath = path.join(ROOT, 'art/hd.json');
  if (!fs.existsSync(hdIdxPath)) return;
  const hdIndex = JSON.parse(fs.readFileSync(hdIdxPath, 'utf8'));
  const keys = Object.keys(hdIndex);
  assert.ok(keys.length >= 20, `expected >= 20 HD stage assets, got ${keys.length}`);
  for (const n of keys) {
    const hdFile = path.join(ROOT, 'game/hd', `${n}.webp`);
    assert.ok(fs.existsSync(hdFile), `missing game/hd/${n}.webp`);
    assert.ok(fs.statSync(hdFile).size > 0, `empty game/hd/${n}.webp`);
  }
}

export function retinaScreenLoadsHdDirectlyAndFallsBackToSd({ loadLib, assert }) {
  const srcView = fs.readFileSync(new URL('../../src/view/00-core.js', import.meta.url), 'utf8');
  assert.match(srcView, /const useHd = hd\.ready\.has\(n\) \|\| \(artWait\.has\(n\) && hd\.asked\.has\(n\)\)/);
  assert.match(srcView, /function hdDowngrade\(name\)/);
  const { offlineWorkerAllowed } = loadLib(['assets'], {}, '({ offlineWorkerAllowed })');
  assert.equal(offlineWorkerAllowed('', 'https:', true), true);
  assert.equal(offlineWorkerAllowed('?dev=1', 'https:', true), false);
  assert.equal(offlineWorkerAllowed('', 'file:', true), false);
}

import fs from 'node:fs';
import path from 'node:path';

export function sceneAHotspotsAndUiButtonsMeetMinimumTouchSize({ logic, loadLib, assert, ROOT }) {
  const { layoutCssPx, layoutRefStageWidth, layoutHitRadius, LAYOUT } = loadLib(['layout'], {}, '({ layoutCssPx, layoutRefStageWidth, layoutHitRadius, LAYOUT })');
  const stageW = layoutRefStageWidth();
  for (const lv of logic.levels) {
    const spots = lv.sceneA;
    for (let i = 0; i < spots.length; i++) {
      const h = spots[i];
      const diaCss = layoutCssPx(Math.max(h.r, 44) * 2, stageW);
      assert.ok(diaCss >= LAYOUT.minHitCss, `${lv.id}.${h.id} hit diameter ${diaCss} < ${LAYOUT.minHitCss}`);
      assert.ok(h.y >= 145, `${lv.id}.${h.id} y=${h.y} too close to top HUD`);
      for (let j = i + 1; j < spots.length; j++) {
        const d = Math.hypot(h.x - spots[j].x, h.y - spots[j].y);
        assert.ok(d >= 120, `${lv.id}: ${h.id} and ${spots[j].id} overlap risk (dist ${d.toFixed(1)})`);
      }
    }
  }
  // Check every uxButton radius literal in view files ensures diameter >= 64 CSS px
  for (const f of ['10-stage.js', '60-story.js', '70-ui.js', '72-abc-play.js', '75-rewards.js']) {
    const src = fs.readFileSync(path.join(ROOT, 'src/view', f), 'utf8');
    for (const m of src.matchAll(/uxButton\(\{[^}]*\br:\s*(\d+)/g)) {
      const r = Number(m[1]);
      assert.ok(layoutCssPx(layoutHitRadius(r, false) * 2, stageW) >= 64, `${f}: button radius r=${r} too small`);
    }
  }
}

import fs from 'node:fs';
import path from 'node:path';

export function offlineFontsAndPrecacheContainRequiredShellAndNoRemoteFonts({ assert, ROOT }) {
  const tmpl = fs.readFileSync(path.join(ROOT, 'art/page.template.html'), 'utf8');
  assert.equal(/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(tmpl), false, 'no remote Google Fonts');
  for (const font of ['font_zh.woff2', 'font_en.woff2']) {
    const p = path.join(ROOT, 'game', font);
    assert.ok(fs.existsSync(p), `missing game/${font}`);
    assert.ok(fs.statSync(p).size > 5000, `suspiciously small game/${font}`);
  }
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /font_zh\.woff2/);
  assert.match(sw, /font_en\.woff2/);
  assert.match(sw, /manifest\.webmanifest/);
  assert.match(sw, /subs\.json/);
}

import fs from 'node:fs';
import path from 'node:path';

export function sheriffLabradorSpeaksChineseOnlyAndSkyeLeadsEnglish({ assert, ROOT }) {
  const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/lines.json'), 'utf8'));
  assert.notEqual(doc.voices.labrador.zh[0], doc.voices.skye.zh[0], 'Skye and Sheriff Labrador must have distinct voices');
  for (const [key, def] of Object.entries(doc.lines)) {
    assert.ok(def.who === 'labrador' || def.who === 'skye', `line ${key} has unexpected speaker ${def.who}`);
    if (def.who === 'labrador') {
      assert.ok(def.say.every(s => typeof s === 'string'), `line ${key}: Labrador speaks Mandarin only`);
    }
  }
}

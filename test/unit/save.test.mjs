export function saveSanitizesMergesAndIsolatesOutfits({ loadLib, assert }) {
  const { defaultSave, sanitizeSave, mergeSaves } = loadLib(['save'], {}, '({ defaultSave, sanitizeSave, mergeSaves })');
  const d = defaultSave();
  assert.equal(d.unlocked.rooms, 1);
  assert.ok('skye' in d.outfit && 'labrador' in d.outfit);

  const a = sanitizeSave({ rooms: { tree: { cleared: true, stars: [true, true, false] } }, words: { cat: { heard: 4, quiz: 1 } }, stickers: ['cat'] });
  const b = sanitizeSave({ rooms: { tree: { cleared: true, stars: [true, false, true] } }, words: { cat: { heard: 2, quiz: 0 } }, stickers: ['bat'] });
  const m = mergeSaves(a, b);
  assert.deepEqual(Array.from(m.rooms.tree.stars), [true, true, true]);
  assert.equal(m.words.cat.heard, 4);
  assert.deepEqual(Array.from(m.stickers).sort(), ['bat', 'cat']);
}

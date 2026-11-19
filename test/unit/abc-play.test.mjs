const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function abcSongNotesCoverAll26LettersWithValidTiming({ loadLib, assert }) {
  const { ABC_SONG_NOTES } = loadLib(['letter-paths'], {}, '({ ABC_SONG_NOTES })');
  assert.equal(ABC_SONG_NOTES.length, 26);
  assert.deepEqual(Array.from(ABC_SONG_NOTES, n => n.id), LETTERS);
  for (const n of ABC_SONG_NOTES) {
    assert.ok(Number.isInteger(n.midi) && n.midi >= 48 && n.midi <= 84, `${n.id}: invalid midi ${n.midi}`);
    assert.ok(typeof n.beats === 'number' && n.beats > 0, `${n.id}: invalid beats ${n.beats}`);
    assert.ok([0, 1, 2, 3].includes(n.row), `${n.id}: invalid row ${n.row}`);
  }
}

export function letterStrokesCoverAll26LettersAndAdvanceSmoothly({ loadLib, assert }) {
  const { LETTER_STROKES, traceSampleStroke, traceAdvance, traceProjectStroke } = loadLib(
    ['letter-paths'],
    {},
    '({ LETTER_STROKES, traceSampleStroke, traceAdvance, traceProjectStroke })',
  );
  assert.deepEqual(Object.keys(LETTER_STROKES).sort(), LETTERS);

  for (const id of LETTERS) {
    const strokes = LETTER_STROKES[id];
    assert.ok(Array.isArray(strokes) && strokes.length >= 1, `${id}: missing strokes`);
    for (const raw of strokes) {
      assert.ok(raw.length >= 2, `${id}: stroke too short`);
      for (const [x, y] of raw) {
        assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100, `${id}: point [${x},${y}] out of [0,100]`);
      }
      const proj = traceProjectStroke(raw, 223, 116, 290);
      const cp = traceSampleStroke(proj, 11);
      assert.ok(cp.length >= 2, `${id}: sampled checkpoints too short`);
      let p = 0;
      for (const [cx, cy] of cp) {
        p = traceAdvance(cp, p, cx + 6, cy - 6, 58);
      }
      assert.equal(p, cp.length, `${id}: tracing along sampled path did not finish (${p} < ${cp.length})`);
    }
  }
}

export function savePreservesAndMergesTracedLettersCaseMatchesAndAbcSongs({ loadLib, assert }) {
  const { defaultSave, sanitizeSave, mergeSaves } = loadLib(['save'], {}, '({ defaultSave, sanitizeSave, mergeSaves })');
  const d = defaultSave();
  assert.deepEqual(Object.keys(d.traced), []);
  assert.equal(d.caseMatches, 0);
  assert.equal(d.abcSongs, 0);

  const a = sanitizeSave({ traced: { a: true, zz: true, b: false }, caseMatches: 2, abcSongs: 1 });
  const b = sanitizeSave({ traced: { c: true }, caseMatches: 1, abcSongs: 3 });
  assert.deepEqual(Object.keys(a.traced), ['a']);
  const m = mergeSaves(a, b);
  assert.deepEqual(Object.keys(m.traced).sort(), ['a', 'c']);
  assert.equal(m.caseMatches, 2);
  assert.equal(m.abcSongs, 3);
}

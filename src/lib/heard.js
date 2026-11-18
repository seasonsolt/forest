  /* Word-heard bookkeeping: saved counter and per-room dev counter. Plain global script, no DOM access. */
  const heardLog = {};
  function noteWordHeard(wordId) {
    if (typeof wordId !== 'string' || !wordId) return;
    if (!noteHeard(save.words, wordId, reviewContext(save))) return;
    const word = WORDS.find(w => w.id === wordId);
    const lv = LEVELS[game.index], room = (word && word.room) || (lv && lv.id) || '?';
    const byRoom = heardLog[wordId] || (heardLog[wordId] = {});
    byRoom[room] = (byRoom[room] || 0) + 1;
    saveSoon();
  }

  /* Orchestration: main game flow, Scene A / Scene B interactive handlers, animation loop, dev QA hooks & offline worker. */
  const playFlow = { phase: 'title', prevIdx: null, workshopQueued: false, wsLock: false, wsNonce: 0, wsAdvanceTimer: 0 };
  const uxHooksReady = () => { uxHooks.replay = i => openRoom(i, true); };
  uxHooksReady();

  function registerOfflineWorker() {
    if (!offlineWorkerAllowed(location.search, location.protocol, 'serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  function onSettingChanged(key, value) {
    if (key === 'sound') { muted = !value; if (typeof refreshAudioGains === 'function') refreshAudioGains(); }
    if (key === 'subtitles' && typeof TK !== 'undefined') TK.refreshSubtitles();
  }

  function roomArtSet(idx, extraWords) {
    const lv = LEVELS[idx];
    if (!lv) return [];
    return roomArt(lv, LINES, { wear: save.outfit, extraWords: extraWords || [], last: idx === LEVELS.length - 1 });
  }

  function onStartJourney() {
    const idx = nextRoomIndex();
    const go = () => openRoom(idx);
    if (!save.flags.prologue && idx === 0) {
      loadArt(assetPlan(LEVELS, LINES, { wear: save.outfit }).prologue, ART_PATIENCE).then(() => {
        save.flags.prologue = true; saveWrite();
        showStory(['p1', 'p2', 'p3'], go);
      });
    } else go();
  }

  function openRoom(idx, skipRecall) {
    const lv = LEVELS[idx];
    if (!lv) return;
    const prevIdx = playFlow.prevIdx;
    const prevLv = !skipRecall && prevIdx != null && prevIdx !== idx ? LEVELS[prevIdx] : null;
    const recallIds = prevLv ? recallWordsFor(prevLv.words, save.words, reviewContext(save)) : [];
    const needArt = roomArtSet(idx, recallIds);
    playFlow.phase = 'story';
    playFlow.workshopQueued = false;
    playFlow.wsNonce++;
    playFlow.wsLock = false;
    clearTimeout(playFlow.wsAdvanceTimer);
    playFlow.wsAdvanceTimer = 0;

    loadArt(needArt, ART_PATIENCE).then(() => {
      const startPlay = () => {
        reviewAdvanceClock(save); saveWrite();
        playFlow.phase = 'play';
        game.start(idx);
        sceneDrawn.idx = -1;
        renderStage(game, true);
        syncHud();
        talkOnEvents(game.drain(), game);
      };
      const showCard = () => showChapter(idx, startPlay);
      if (recallIds.length) showRecall(prevLv, showCard, recallIds);
      else showCard();
    });
  }

  function onHudReplay() {
    if (game.state !== 'play') return;
    playFlow.workshopQueued = false;
    playFlow.wsNonce++;
    playFlow.wsLock = false;
    clearTimeout(playFlow.wsAdvanceTimer);
    playFlow.wsAdvanceTimer = 0;
    game.start(game.index);
    sceneDrawn.idx = -1;
    renderStage(game, true);
    syncHud();
    talkOnEvents(game.drain(), game);
  }

  function onHotspotClick(id) {
    if (!canPlay() || game.screen !== 0) return;
    unlockAudio();
    const h = game.hotspots.find(x => x.id === id);
    if (!h || h.opened) return;
    const prevReady = game.workshopReady;
    if (!game.tapHotspot(id)) return;
    if (h.kind === 'word') spawnOrbArc(h.x, h.y, 130, 45);
    uxConfetti($('fx'), h.x, h.y, h.kind === 'word' ? 16 : 12);
    renderStage(game, false);
    const evs = game.drain();
    audioOnEvents(evs, game);
    talkOnEvents(evs, game);
    if (!prevReady && game.workshopReady && game.screen === 0 && !playFlow.workshopQueued) {
      playFlow.workshopQueued = true;
      setTimeout(() => {
        if (game.state === 'play' && game.screen === 0 && !storyIsOpen()) onEnterWorkshop();
      }, 2600);
    }
  }

  function onEnterWorkshop() {
    if (!canPlay() || game.screen !== 0) return;
    unlockAudio();
    if (!game.enterWorkshop(false)) return;
    uxSfx('page');
    renderStage(game, false);
    const evs = game.drain();
    audioOnEvents(evs, game);
    talkOnEvents(evs, game);
  }

  function onWorkshopPromptReplay() {
    if (!canPlay() || game.screen !== 1) return;
    unlockAudio();
    const r = game.currentRound();
    if (r) TK.say('quiz_' + r.word, { interrupt: true, tag: 'prompt', maxWait: 4000 });
  }

  let lastHoverStone = { chunk: '', t: 0 };
  function onStoneHover(chunk) {
    if (!canPlay() || game.screen !== 1) return;
    const now = performance.now();
    if (chunk === lastHoverStone.chunk && now - lastHoverStone.t < 450) return;
    lastHoverStone = { chunk, t: now };
    if (hasLineKey('ph_' + chunk)) voice.line('ph_' + chunk, { interrupt: true, priority: 0, tag: 'ui', maxWait: 500, subtitle: false });
  }

  function onStoneClick(chunk, btnNode) {
    if (!canPlay() || game.screen !== 1 || playFlow.wsLock) return;
    unlockAudio();
    const ok = game.tapStone(chunk);
    const evs = game.drain();
    audioOnEvents(evs, game);
    talkOnEvents(evs, game);
    if (!ok) {
      uxNudge(btnNode);
      renderStage(game, false);
      return;
    }
    const blended = evs.find(e => e.type === 'word_blended');
    if (!blended) {
      renderStage(game, false);
      return;
    }

    playFlow.wsLock = true;
    const nonce = ++playFlow.wsNonce;
    clearTimeout(playFlow.wsAdvanceTimer);
    playFlow.wsAdvanceTimer = 0;
    let pausedForTrace = false;

    const advanceWorkshop = () => {
      if (nonce !== playFlow.wsNonce || game.state === 'title' || playFlow.phase !== 'play') return;
      clearTimeout(playFlow.wsAdvanceTimer);
      playFlow.wsAdvanceTimer = 0;
      playFlow.wsLock = false;
      if (game.state === 'clear' || game.state === 'win') {
        completeRoom(game.index);
        return;
      }
      if (game.state === 'play') {
        renderStage(game, false);
        const nr = game.currentRound();
        if (nr) TK.say('quiz_' + nr.word, { tag: 'prompt', maxWait: 4500 });
      }
    };

    if (typeof revealWorkshopMascot === 'function') {
      revealWorkshopMascot(blended.word, {
        onTrace: typeof showTrace === 'function'
          ? () => {
              if (nonce !== playFlow.wsNonce) return;
              pausedForTrace = true;
              clearTimeout(playFlow.wsAdvanceTimer);
              playFlow.wsAdvanceTimer = 0;
              showTrace(blended.word, () => {
                if (nonce !== playFlow.wsNonce || game.state === 'title') return;
                syncHud();
                advanceWorkshop();
              }, { single: true });
            }
          : null,
        onNext: () => advanceWorkshop(),
      });
    }

    uxConfetti($('fx'), 480, 212, 38);
    setTimeout(() => {
      if ($('fx')) { uxConfetti($('fx'), 370, 165, 18); uxConfetti($('fx'), 590, 165, 18); }
    }, 220);

    const blendDone = TK.say('blend_' + blended.word, { interrupt: true, tag: 'blend', maxWait: 6000 });
    Promise.all([uxWait(2200), Promise.race([blendDone, uxWait(9000)])]).then(() => {
      if (pausedForTrace || nonce !== playFlow.wsNonce || game.state === 'title' || storyIsOpen()) return;
      playFlow.wsAdvanceTimer = setTimeout(() => {
        if (!pausedForTrace && !storyIsOpen()) advanceWorkshop();
      }, 450);
    });
  }

  function onPupTap(who) {
    if (!canPlay()) return;
    unlockAudio();
    game.cheerFriend(who);
    const pt = who === 'skye' ? game.skye : game.labrador;
    uxConfetti($('fx'), pt.x, pt.y - 45, 14);
    const evs = game.drain();
    audioOnEvents(evs, game);
    talkOnEvents(evs, game);
  }

  function openMemoryOverlay(memId) {
    showMemory(game.level(), memId, () => {
      playFlow.phase = 'play';
      syncHud();
    });
  }

  function triggerHint() {
    if (!canPlay()) return;
    unlockAudio();
    game.idleTime = 12;
    game.hintTarget = game.computeHintTarget();
    uxSfx('tap');
    voice.line('idle_' + (1 + Math.floor(Math.random() * 4)), { interrupt: true, tag: 'hint', maxWait: 3000 });
  }

  function completeRoom(lvIdx) {
    const lv = LEVELS[lvIdx];
    playFlow.phase = 'clear';
    playFlow.prevIdx = lvIdx;
    const acornsAll = !game.acorns || game.acorns.total === 0 ? true : game.acorns.got >= game.acorns.total;
    markRoom(lv.id, { cleared: true, memory: !!game.memoryFound, stars: [true, !!game.memoryFound, acornsAll] });
    for (const wid of lv.words) if (!save.stickers.includes(wid)) save.stickers.push(wid);
    saveWrite();

    showClear(lvIdx, () => {
      if (lvIdx >= LEVELS.length - 1) {
        const endPlan = assetPlan(LEVELS, LINES, { wear: save.outfit });
        loadArt(endPlan.ending, ART_PATIENCE).then(() => showStory(['win', 'end'], () => showFinale(showTitle)));
      } else {
        openRoom(lvIdx + 1);
      }
    });
  }

  /* Main loop */
  let lastT = performance.now(), secAcc = 0;
  function frame(now) {
    const dt = Math.min(.05, (now - lastT) / 1000);
    lastT = now;
    const tSec = now / 1000;
    inputView.panX += (inputView.targetPan - inputView.panX) * Math.min(1, dt * 6);
    if (canPlay()) {
      game.step(dt);
      const evs = game.drain();
      if (evs.length) { audioOnEvents(evs, game); talkOnEvents(evs, game); }
      renderPups(game, tSec);
      secAcc += dt;
      if (secAcc >= 1) { save.totalPlaySeconds += Math.floor(secAcc); secAcc %= 1; saveSoon(); }
    }
    updateAmbientMotion(tSec, inputView.panX);
    fxTick(dt, tSec, game);
    audioTick();
    padTick(tSec);
    requestAnimationFrame(frame);
  }

  /* Boot sequence: preload title set (< 2.5 MB), render Title (or DEV ?dev=1&qa=...) */
  const titlePlan = assetPlan(LEVELS, LINES, { wear: save.outfit });
  const qaMode = DEV ? new URLSearchParams(location.search).get('qa') : null;
  if (DEV && qaMode === 'unlock') {
    save.unlocked.rooms = LEVELS.length;
    for (const lv of LEVELS) markRoom(lv.id, { cleared: true, memory: true, stars: [true, true, true] });
    for (const w of WORDS) if (w.kind === 'core' && !save.stickers.includes(w.id)) save.stickers.push(w.id);
    save.outfit.skye = { dress: 1, hat: 'wreath' };
    save.outfit.labrador = { dress: 1, hat: 'detective' };
  }

  loadArt(titlePlan.title, ART_PATIENCE).then(() => {
    registerOfflineWorker();
    if (DEV && qaMode === 'win') {
      save.unlocked.rooms = LEVELS.length;
      for (const lv of LEVELS) markRoom(lv.id, { cleared: true, memory: true, stars: [true, true, true] });
      for (const w of WORDS) {
        if (w.kind !== 'core') continue;
        if (!save.stickers.includes(w.id)) save.stickers.push(w.id);
        save.words[w.id] = { heard: 8, quiz: 1, seen: true };
      }
      save.outfit.skye = { dress: 1, hat: 'crown' };
      save.outfit.labrador = { dress: 2, hat: 'detective' };
      loadArt(titlePlan.ending, ART_PATIENCE).then(() => showStory(['win', 'end'], () => showFinale(showTitle)));
    } else {
      showTitle();
    }
    requestAnimationFrame(frame);
  });

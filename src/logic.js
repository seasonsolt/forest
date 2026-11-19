/* Pure game state machine for 天天和警长的森林探案 (<script id="logic">). Zero DOM access; runs in Node tests and browser. */
const STAGE_W = 960;
const STAGE_H = 520;
const IDLE_HINT_SEC = 12;

function createGame() {
  const g = {
    state: 'title',   // 'title' | 'play' | 'clear' | 'win'
    index: 0,
    screen: 0,        // 0 = Scene A (Letter Clue Hunt), 1 = Scene B (Letter Workshop)
    time: 0,
    idleTime: 0,
    hintTarget: null,
    workshopReady: false,
    memoryFound: false,
    hotspots: [],
    orbs: { got: 0, total: 4, words: [] },
    acorns: { got: 0, total: 1 },
    stars: { got: 0, total: 1 },
    skye: { x: 165, y: 150, tx: 165, ty: 150, facing: 1, cheer: 0 },
    labrador: { x: 120, y: 405, tx: 120, ty: 405, facing: 1, cheer: 0 },
    workshop: null,
    events: [],

    level() {
      return LEVELS[g.index];
    },

    emit(ev) {
      g.events.push(ev);
    },

    drain() {
      return g.events.splice(0, g.events.length);
    },

    load(i) {
      const idx = Math.max(0, Math.min(LEVELS.length - 1, i | 0));
      const lv = LEVELS[idx];
      g.index = idx;
      g.screen = 0;
      g.time = 0;
      g.idleTime = 0;
      g.hintTarget = null;
      g.workshopReady = false;
      g.memoryFound = false;
      g.hotspots = lv.sceneA.map(h => Object.assign({}, h, { opened: false }));
      g.orbs = { got: 0, total: lv.words.length, words: [] };
      g.acorns = { got: 0, total: lv.sceneA.filter(h => h.kind === 'acorn').length };
      g.stars = { got: 0, total: g.acorns.total };
      g.skye = { x: 145, y: 148, tx: 145, ty: 148, facing: 1, cheer: 0 };
      g.labrador = { x: 92, y: 416, tx: 92, ty: 416, facing: 1, cheer: 0 };
      g.workshop = {
        mode: lv.mode || 'letter',
        rounds: lv.rounds.map(r => ({
          word: r.word,
          letter: r.letter,
          lower: r.lower,
          choices: r.choices.slice(),
        })),
        roundIdx: 0,
        step: 'pick',
        pickedLetter: '',
        misses: 0,
        assistGlow: false,
        solved: lv.rounds.map(() => false),
      };
      g.events = [];
      g.emit({ type: 'load', index: idx, id: lv.id });
    },

    start(i) {
      g.load(i);
      g.state = 'play';
    },

    currentRound() {
      const w = g.workshop;
      return w && w.rounds[w.roundIdx] ? w.rounds[w.roundIdx] : null;
    },

    currentChoices() {
      const r = g.currentRound();
      return r ? r.choices : [];
    },

    resetIdle() {
      g.idleTime = 0;
      g.hintTarget = null;
    },

    computeHintTarget() {
      if (g.state !== 'play') return null;
      if (g.screen === 0) {
        if (g.workshopReady) return { screen: 0, kind: 'workshop' };
        const nextWord = g.hotspots.find(h => !h.opened && h.kind === 'word');
        if (nextWord) return { screen: 0, kind: 'hotspot', id: nextWord.id };
        const nextAny = g.hotspots.find(h => !h.opened);
        return nextAny ? { screen: 0, kind: 'hotspot', id: nextAny.id } : null;
      }
      const r = g.currentRound();
      return r ? { screen: 1, kind: 'stone', val: r.word } : null;
    },

    tapHotspot(id) {
      if (g.state !== 'play' || g.screen !== 0) return false;
      const h = g.hotspots.find(x => x.id === id);
      if (!h || h.opened) return false;
      h.opened = true;
      g.resetIdle();
      g.skye.tx = Math.max(80, Math.min(STAGE_W - 80, h.x));
      g.skye.ty = Math.max(95, Math.min(STAGE_H - 95, h.y - 36));
      g.skye.facing = g.skye.tx >= g.skye.x ? 1 : -1;
      g.skye.cheer = 1.1;
      g.labrador.facing = h.x >= g.labrador.x ? 1 : -1;
      g.labrador.cheer = 0.8;

      if (h.kind === 'word') {
        g.orbs.got++;
        if (h.word && !g.orbs.words.includes(h.word)) g.orbs.words.push(h.word);
        g.emit({ type: 'clue', id: h.id, kind: 'word', word: h.word, x: h.x, y: h.y, got: g.orbs.got, total: g.orbs.total });
      } else if (h.kind === 'memory') {
        g.memoryFound = true;
        g.emit({ type: 'memory', id: h.id, x: h.x, y: h.y, memoryId: g.level().memoryId });
      } else {
        g.acorns.got++;
        g.stars.got = g.acorns.got;
        g.emit({ type: 'acorn', id: h.id, x: h.x, y: h.y, got: g.acorns.got, total: g.acorns.total });
      }

      if (g.orbs.got >= g.orbs.total && !g.workshopReady) {
        g.workshopReady = true;
        g.emit({ type: 'workshop_ready', screen: 0 });
      }
      if (g.hotspots.every(x => x.opened)) g.enterWorkshop(true);
      return true;
    },

    enterWorkshop(auto) {
      if (g.state !== 'play' || g.screen !== 0 || g.orbs.got < g.orbs.total) return false;
      g.screen = 1;
      g.resetIdle();
      g.skye.tx = 175; g.skye.ty = 215; g.skye.facing = 1;
      g.labrador.tx = 100; g.labrador.ty = 408; g.labrador.facing = 1;
      g.emit({ type: 'screen2', auto: !!auto, mode: g.level().mode || 'letter' });
      return true;
    },

    tapStone(choice) {
      if (g.state !== 'play' || g.screen !== 1 || !g.workshop) return false;
      const w = g.workshop, r = g.currentRound();
      if (!r || w.step === 'done') return false;
      const val = typeof choice === 'number' ? g.currentChoices()[choice] : String(choice || '').toLowerCase();
      if (!val) return false;
      g.resetIdle();

      if (val !== r.word) {
        w.misses++;
        if (w.misses >= 1) {
          w.assistGlow = true;
          g.emit({ type: 'stone_assist', val: r.word, word: r.word });
        }
        g.emit({ type: 'stone_try', val, expected: r.word, misses: w.misses });
        return false;
      }

      w.pickedLetter = val;
      w.step = 'done';
      w.misses = 0;
      w.assistGlow = false;
      w.solved[w.roundIdx] = true;
      g.skye.cheer = 1.4;
      g.labrador.cheer = 1.2;
      g.emit({ type: 'word_blended', word: r.word, letter: r.letter, roundIdx: w.roundIdx });

      const nextIdx = w.roundIdx + 1;
      if (nextIdx >= w.rounds.length) {
        const lastRoom = g.index >= LEVELS.length - 1;
        g.state = lastRoom ? 'win' : 'clear';
        g.emit({ type: lastRoom ? 'win' : 'clear', index: g.index, id: g.level().id });
      } else {
        w.roundIdx = nextIdx;
        w.step = 'pick';
        w.pickedLetter = '';
      }
      return true;
    },

    cheerFriend(who) {
      if (who === 'skye') { g.skye.cheer = 1.0; g.emit({ type: 'cheer', who: 'skye' }); return true; }
      if (who === 'labrador') { g.labrador.cheer = 1.0; g.emit({ type: 'cheer', who: 'labrador' }); return true; }
      return false;
    },

    step(dt) {
      if (g.state !== 'play') return;
      const clamped = Math.min(0.05, Math.max(0, dt || 0));
      g.time += clamped;
      g.idleTime += clamped;
      for (const ch of [g.skye, g.labrador]) {
        const k = Math.min(1, clamped * 8);
        ch.x += (ch.tx - ch.x) * k;
        ch.y += (ch.ty - ch.y) * k;
        if (ch.cheer > 0) ch.cheer = Math.max(0, ch.cheer - clamped);
      }
      if (!g.hintTarget && g.idleTime >= IDLE_HINT_SEC) {
        g.hintTarget = g.computeHintTarget();
        if (g.hintTarget) g.emit({ type: 'hint_auto', target: g.hintTarget });
      }
    },
  };
  return g;
}

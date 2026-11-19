  /* 99-point Interactive Playgrounds: ABC Twinkle Rainbow Piano, Toddler Starlight Tracing & A<->a Case-Match Egg. */
  let traceIntroSaid = false;

  const PIANO_FILLS = ['#ffe4f0', '#e4f4ff', '#fff3cc', '#ebfae8', '#f2e8ff', '#ffeede'];
  const PIANO_RIMS = ['#f287b7', '#6dbbe8', '#efb646', '#7ec476', '#a884e6', '#f29a5e'];

  /* ---------- 1. ABC Song Twinkle Rainbow Piano Wall (Embeddable & Standalone) ---------- */
  function renderAbcPianoWall(host, s, opts) {
    const o = opts || {};
    const notesById = Object.fromEntries(ABC_SONG_NOTES.map(n => [n.id, n]));
    const wordsById = Object.fromEntries(WORDS.filter(w => w.kind === 'core').map(w => [w.id, w]));
    const rows = [0, 1, 2, 3].map(r => ABC_SONG_NOTES.filter(n => n.row === r));
    const specs = [
      { bw: 94, bh: 72, gap: 10, y: 100 },
      { bw: 78, bh: 72, gap: 8, y: 186 },
      { bw: 98, bh: 72, gap: 12, y: 272 },
      { bw: 112, bh: 72, gap: 14, y: 358 },
    ];

    let songTimer = 0;
    let mode = 'free'; // 'free' | 'auto' | 'guide'
    let guideIdx = 0;
    let autoIdx = 0;

    const pillW = o.standalone ? 440 : 410;
    const pillX = o.standalone ? 190 : 275;
    const pillHtml = `<g id="abcPreviewPill" filter="url(#softShadow)">
      <rect x="${pillX}" y="16" width="${pillW}" height="64" rx="32" fill="#13261b" opacity=".9" stroke="#ffd27a" stroke-width="3"/>
      <image id="abcPrevImg" href="${SRC('word_a')}" x="${pillX + 14}" y="22" width="52" height="52" preserveAspectRatio="xMidYMid meet" opacity="0"/>
      <text id="abcPrevTxt" x="${pillX + pillW / 2}" y="55" text-anchor="middle" font-size="22" fill="#fff7df">A – Z 彩虹字母琴键（点一点会唱歌！）</text>
    </g>`;

    const backBtn = o.standalone ? uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 }) : '';
    const songBtnX = o.standalone ? 772 : 760;
    const guideBtnX = o.standalone ? 862 : 850;
    const keysHtml = rows.map((rowNotes, rIdx) => {
      const sp = specs[rIdx];
      const rx0 = 480 - (rowNotes.length * sp.bw + (rowNotes.length - 1) * sp.gap) / 2;
      return rowNotes.map((n, k) => {
        const w = wordsById[n.id];
        if (!w) return '';
        const bx = rx0 + k * (sp.bw + sp.gap);
        const ci = (rIdx * 7 + k) % PIANO_FILLS.length;
        const hitR = sp.bw < 84 ? sp.bw + 6 : sp.bw;
        return `<g class="ux-btn abc-key" data-pkey="${w.id}" role="button" tabindex="0" aria-label="${w.en}" transform="translate(${bx} ${sp.y})">
          <rect x="${(sp.bw - hitR) / 2}" y="-4" width="${hitR}" height="${sp.bh + 8}" rx="18" fill="transparent"/>
          <g class="btn-vis" filter="url(#softShadow)">
            <rect class="key-bg" width="${sp.bw}" height="${sp.bh}" rx="18" fill="${PIANO_FILLS[ci]}" stroke="${PIANO_RIMS[ci]}" stroke-width="3.2"/>
            <rect x="6" y="4" width="${sp.bw - 12}" height="18" rx="9" fill="#ffffff" opacity=".52"/>
            <text class="latin" x="${sp.bw / 2 - 11}" y="44" text-anchor="middle" font-size="30" fill="#4e1f3a">${w.letter}</text>
            <text class="latin" x="${sp.bw / 2 + 16}" y="44" text-anchor="middle" font-size="22" fill="#8a4a6e">${w.lower}</text>
            <circle cx="${sp.bw / 2}" cy="60" r="3.5" fill="${PIANO_RIMS[ci]}" opacity=".75"/>
          </g>
          <rect class="guide-ring" x="-4" y="-4" width="${sp.bw + 8}" height="${sp.bh + 8}" rx="20" fill="none" stroke="#ffd27a" stroke-width="5" opacity="0" pointer-events="none"/>
        </g>`;
      }).join('');
    }).join('');

    host.innerHTML = `${pillHtml}${backBtn}
      ${uxButton({ act: 'songPlay', ui: 'abc_song', icon: 'note', x: songBtnX, y: 48, r: 34, plate: 'gold' })}
      ${uxButton({ act: 'songGuide', ui: 'hint', icon: 'sticker', x: guideBtnX, y: 48, r: 34 })}
      <g id="abcKeysLayer">${keysHtml}</g>`;

    const getKeyEl = id => host.querySelector(`[data-pkey="${id}"]`);
    const updatePreview = id => {
      const w = wordsById[id];
      const imgEl = host.querySelector('#abcPrevImg');
      const txtEl = host.querySelector('#abcPrevTxt');
      if (!w || !txtEl) return;
      if (imgEl) {
        imgEl.setAttribute('href', SRC(w.icon || 'word_' + w.id));
        imgEl.setAttribute('opacity', '1');
      }
      txtEl.setAttribute('class', 'latin');
      txtEl.setAttribute('x', String(pillX + pillW / 2 + 22));
      txtEl.setAttribute('font-size', '25');
      txtEl.setAttribute('fill', '#ffe794');
      txtEl.textContent = `${w.letter}${w.lower} · ${w.wordEn || w.en}`;
    };

    const flashKey = (id, boost) => {
      const kEl = getKeyEl(id);
      if (!kEl) return;
      kEl.classList.remove('piano-hit');
      void kEl.getBoundingClientRect();
      kEl.classList.add('piano-hit');
      const m = kEl.getAttribute('transform');
      const mm = /translate\(([-\d.]+)\s+([-\d.]+)\)/.exec(m || '');
      if (mm) {
        const cx = Number(mm[1]) + 42;
        const cy = Number(mm[2]) + 36;
        uxConfetti(host.closest('.page') || host, cx, cy, boost ? 14 : 6);
      }
    };

    const syncModeVisuals = () => {
      host.querySelectorAll('.guide-ring').forEach(r => r.setAttribute('opacity', '0'));
      host.querySelectorAll('.abc-key').forEach(k => k.classList.remove('ux-pulse'));
      const btnAuto = host.querySelector('[data-act="songPlay"]');
      const btnGuide = host.querySelector('[data-act="songGuide"]');
      if (btnAuto) btnAuto.classList.toggle('ux-pulse', mode === 'auto');
      if (btnGuide) btnGuide.classList.toggle('ux-pulse', mode === 'guide');
      if (mode === 'guide' && guideIdx < ABC_SONG_NOTES.length) {
        const tid = ABC_SONG_NOTES[guideIdx].id;
        const kEl = getKeyEl(tid);
        if (kEl) {
          kEl.classList.add('ux-pulse');
          const gr = kEl.querySelector('.guide-ring');
          if (gr) gr.setAttribute('opacity', '1');
        }
      }
    };

    const stop = () => {
      clearTimeout(songTimer);
      songTimer = 0;
      mode = 'free';
      if (typeof setPianoDuck === 'function') setPianoDuck(false);
      syncModeVisuals();
    };

    const stepAuto = () => {
      if (!uxAlive(s) || mode !== 'auto') { stop(); return; }
      if (autoIdx >= ABC_SONG_NOTES.length) {
        uxSfx('gliss');
        uxConfetti(host.closest('.page') || host, 480, 240, 36);
        stop();
        return;
      }
      const note = ABC_SONG_NOTES[autoIdx++];
      playPianoNote(note.midi, note.beats >= 2);
      updatePreview(note.id);
      const phraseEnd = note.id === 'g' || note.id === 'p' || note.id === 'v' || note.id === 'z';
      flashKey(note.id, phraseEnd);
      songTimer = setTimeout(stepAuto, Math.round(note.beats * 430));
    };

    const toggleAuto = () => {
      unlockAudio();
      uxStopVoice();
      if (mode === 'auto') { stop(); return; }
      stop();
      mode = 'auto';
      autoIdx = 0;
      if (typeof setPianoDuck === 'function') setPianoDuck(true);
      syncModeVisuals();
      stepAuto();
    };

    const toggleGuide = () => {
      unlockAudio();
      if (mode === 'guide') { stop(); return; }
      stop();
      mode = 'guide';
      guideIdx = 0;
      if (typeof setPianoDuck === 'function') setPianoDuck(true);
      syncModeVisuals();
      uxLine('abc_piano_guide', { interrupt: true, maxWait: 3000 });
    };

    host.querySelectorAll('[data-pkey]').forEach(kEl => {
      const id = kEl.getAttribute('data-pkey');
      const press = () => {
        if (!uxAlive(s)) return;
        unlockAudio();
        if (mode === 'auto') stop();
        const note = notesById[id];
        if (note) playPianoNote(note.midi, note.beats >= 2);
        updatePreview(id);
        flashKey(id, false);
        uxWordVoice(id);
        if (mode === 'guide') {
          const target = ABC_SONG_NOTES[guideIdx];
          if (target && target.id === id) {
            guideIdx++;
            if (guideIdx >= ABC_SONG_NOTES.length) {
              save.abcSongs = (save.abcSongs || 0) + 1;
              saveWrite();
              stop();
              uxSfx('gliss');
              uxConfetti(host.closest('.page') || host, 340, 220, 26);
              uxConfetti(host.closest('.page') || host, 620, 220, 26);
              uxLine('abc_piano_win', { maxWait: 4500 });
              return;
            }
            syncModeVisuals();
          } else {
            syncModeVisuals();
          }
        }
      };
      kEl.addEventListener('click', press);
      kEl.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); press(); }
      });
    });

    const bAuto = host.querySelector('[data-act="songPlay"]');
    if (bAuto) {
      bAuto.addEventListener('click', toggleAuto);
      bAuto.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAuto(); } });
    }
    const bGuide = host.querySelector('[data-act="songGuide"]');
    if (bGuide) {
      bGuide.addEventListener('click', toggleGuide);
      bGuide.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGuide(); } });
    }

    return { stop, toggleAuto, toggleGuide };
  }

  function showAbcPiano(returnFn) {
    const s = uxScreen('abcPiano');
    const root = uxPaint(`<g class="page">
      <image href="${SRC('bg_canopy')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
      <rect width="960" height="520" fill="#112219" opacity=".54"/>
      <g id="abcPianoHost"></g>
    </g>`);
    const host = root.querySelector('#abcPianoHost');
    const ctl = renderAbcPianoWall(host, s, { standalone: true });
    const back = () => {
      ctl.stop();
      uxEnd(s, () => (typeof returnFn === 'function' ? returnFn() : showTitle()));
    };
    s.onKey = back;
    const backBtn = root.querySelector('[data-act="back"]');
    if (backBtn) {
      backBtn.addEventListener('click', back);
      backBtn.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); back(); } });
    }
    uxLine('abc_piano_intro', { maxWait: 4500 });
  }

  /* ---------- 2. Ultra-Forgiving Toddler Starlight Letter Tracing ---------- */
  function ptsToPath(pts) {
    if (!pts || !pts.length) return '';
    return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  }

  function showTrace(letterId, onDone, opts) {
    const o = opts || {};
    const core = WORDS.filter(w => w.kind === 'core');
    let curIdx = Math.max(0, core.findIndex(w => w.id === letterId));
    const s = uxScreen('trace');

    const renderLetter = () => {
      if (!uxAlive(s)) return;
      const w = core[curIdx] || core[0];
      const lid = w.id;
      const rawStrokes = LETTER_STROKES[lid] || LETTER_STROKES.a;
      const boxX = 223, boxY = 116, boxSize = 290;
      const projStrokes = rawStrokes.map(st => traceProjectStroke(st, boxX, boxY, boxSize));
      const checkpoints = projStrokes.map(st => traceSampleStroke(st, 11));
      let activeStroke = 0;
      let prog = 0;
      let finished = false;
      let drawing = false;
      const tracedCount = Object.keys(save.traced || {}).filter(k => save.traced[k]).length;

      const tracksHtml = projStrokes.map((st, idx) => {
        const d = ptsToPath(st);
        return `<path d="${d}" fill="none" stroke="#ead8b8" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${d}" fill="none" stroke="#cbb286" stroke-width="3" stroke-dasharray="8 9" stroke-linecap="round"/>
          <g class="trace-num" data-num="${idx}" opacity="${idx === 0 ? '1' : '.42'}" transform="translate(${st[0][0].toFixed(1)} ${st[0][1].toFixed(1)})">
            <circle r="13" fill="#ff85b3" stroke="#fffaf0" stroke-width="2.5"/>
            <text class="latin" y="5" text-anchor="middle" font-size="14" fill="#ffffff">${idx + 1}</text>
          </g>`;
      }).join('');

      const navBtns = o.single
        ? uxButton({ act: 'reset', ui: 'replay', icon: 'replay', x: 682, y: 428, r: 34 }) +
          uxButton({ act: 'finishDone', ui: 'next', icon: 'next', x: 800, y: 428, r: 38, plate: 'gold' })
        : uxButton({ act: 'prevL', ui: 'back', icon: 'back', x: 640, y: 428, r: 34 }) +
          uxButton({ act: 'reset', ui: 'replay', icon: 'replay', x: 742, y: 428, r: 34 }) +
          uxButton({ act: 'nextL', ui: 'next', icon: 'next', x: 844, y: 428, r: 34, plate: 'gold' });

      const root = uxPaint(`<g class="page">
        <image href="${SRC('bg_woods')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
        <rect width="960" height="520" fill="#112219" opacity=".58"/>
        ${uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 })}
        <g filter="url(#softShadow)">
          <rect x="275" y="16" width="410" height="42" rx="21" fill="#13261b" opacity=".88" stroke="#ffd27a" stroke-width="2.5"/>
          <text id="traceBanner" x="480" y="44" text-anchor="middle" font-size="21" fill="#fff7df">跟着发光小星星写字母（${w.letter}${w.lower} · ${tracedCount}/26）</text>
        </g>

        <g id="traceBoardGroup" filter="url(#softShadow)">
          <rect x="148" y="68" width="440" height="394" rx="34" fill="#fffaf0" stroke="#e4b457" stroke-width="5"/>
          <line x1="184" y1="151" x2="552" y2="151" stroke="#f0dfbe" stroke-width="2" stroke-dasharray="8 8"/>
          <line x1="184" y1="261" x2="552" y2="261" stroke="#f5e7ca" stroke-width="2" stroke-dasharray="6 8"/>
          <line x1="184" y1="371" x2="552" y2="371" stroke="#f0dfbe" stroke-width="2.5"/>
          <g id="traceTracks">${tracksHtml}</g>
          <g id="traceDoneGroup"></g>
          <path id="traceProgPath" d="" fill="none" stroke="#ff7cb8" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
          <path id="traceProgCore" d="" fill="none" stroke="#ffd27a" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
          <g id="traceStar" transform="translate(${checkpoints[0][0][0].toFixed(1)} ${checkpoints[0][0][1].toFixed(1)})" pointer-events="none">
            <circle class="ux-ripple" r="22" fill="none" stroke="#ffd27a" stroke-width="4"/>
            <circle r="19" fill="#ffe89c" opacity=".38"/>
            <path d="${UX_STAR_D}" transform="scale(18)" fill="url(#goldGrad)" stroke="#b85a12" stroke-width=".07"/>
          </g>
          <rect id="traceHit" x="148" y="68" width="440" height="394" rx="34" fill="transparent" style="touch-action:none;cursor:crosshair"/>
        </g>

        <g id="traceMascotCard" class="ux-btn" data-word="${lid}" role="button" tabindex="0" transform="translate(624 84)">
          <g class="btn-vis" filter="url(#softShadow)">
            <rect width="236" height="278" rx="28" fill="#fffaf0" stroke="#f287b7" stroke-width="4"/>
            <rect x="52" y="14" width="132" height="44" rx="22" fill="#ffe5f1" stroke="#f287b7" stroke-width="2.5"/>
            <text class="latin" x="118" y="45" text-anchor="middle" font-size="32" fill="#b8326a">${w.letter}${w.lower}</text>
            <image href="${SRC(w.icon || 'word_' + lid)}" x="43" y="66" width="150" height="148" preserveAspectRatio="xMidYMid meet"/>
            <text class="latin" x="118" y="254" text-anchor="middle" font-size="28" fill="#2b1f09">${w.wordEn || w.en}</text>
          </g>
        </g>
        <g id="tracePrize" opacity="0" transform="translate(836 84)" pointer-events="none">
          <circle r="30" fill="#ffe4f0" stroke="#ffd27a" stroke-width="3"/>
          <image href="${SRC('hat_bow')}" x="-24" y="-20" width="48" height="40" preserveAspectRatio="xMidYMid meet"/>
        </g>
        ${navBtns}
      </g>`);

      const doneGroup = root.querySelector('#traceDoneGroup');
      const progPath = root.querySelector('#traceProgPath');
      const progCore = root.querySelector('#traceProgCore');
      const starEl = root.querySelector('#traceStar');
      const hitEl = root.querySelector('#traceHit');

      const syncStar = () => {
        if (!starEl) return;
        if (finished || activeStroke >= checkpoints.length) {
          starEl.setAttribute('opacity', '0');
          return;
        }
        const cp = checkpoints[activeStroke];
        const pt = cp[Math.min(prog, cp.length - 1)];
        starEl.setAttribute('opacity', '1');
        starEl.setAttribute('transform', `translate(${pt[0].toFixed(1)} ${pt[1].toFixed(1)})`);
        root.querySelectorAll('.trace-num').forEach(n => {
          const ni = Number(n.getAttribute('data-num'));
          n.setAttribute('opacity', ni < activeStroke ? '0' : (ni === activeStroke ? '1' : '.42'));
        });
      };

      const renderProgressPath = () => {
        const cp = checkpoints[activeStroke] || [];
        const slice = prog > 0 ? cp.slice(0, Math.min(prog, cp.length)) : [];
        const d = ptsToPath(slice);
        if (progPath) progPath.setAttribute('d', d);
        if (progCore) progCore.setAttribute('d', d);
      };

      const completeLetter = () => {
        if (finished) return;
        finished = true;
        drawing = false;
        syncStar();
        const hadCount = Object.keys(save.traced || {}).filter(k => save.traced[k]).length;
        if (!save.traced) save.traced = {};
        save.traced[lid] = true;
        saveWrite();
        const newCount = Object.keys(save.traced).filter(k => save.traced[k]).length;
        const banner = root.querySelector('#traceBanner');
        if (banner) banner.textContent = `太棒了！${w.letter}${w.lower} 描红完成（${newCount}/26）`;
        if (hadCount < 3 && newCount >= 3) {
          const pz = root.querySelector('#tracePrize');
          if (pz) pz.setAttribute('opacity', '1');
        }
        uxNudge(root.querySelector('#traceMascotCard'));
        uxSfx('gliss');
        uxConfetti(root.querySelector('.page'), 368, 250, 34);
        uxConfetti(root.querySelector('.page'), 742, 220, 22);
        const nextBtn = root.querySelector('[data-act="nextL"], [data-act="finishDone"]');
        if (nextBtn) nextBtn.classList.add('ux-pulse');
        uxWordVoice(lid);
        uxLine('trace_done_' + (1 + Math.floor(Math.random() * 2)), { maxWait: 4000 });
      };

      const stepPoint = (sx, sy) => {
        if (!uxAlive(s) || finished || activeStroke >= checkpoints.length) return;
        const cp = checkpoints[activeStroke];
        const nextProg = traceAdvance(cp, prog, sx, sy, 58);
        if (nextProg <= prog) return;
        prog = nextProg;
        playPianoNote(60 + ((prog + activeStroke * 3) % 12), false);
        const curPt = cp[Math.min(prog - 1, cp.length - 1)];
        uxConfetti(root.querySelector('.page'), curPt[0], curPt[1], 4);
        renderProgressPath();
        if (prog >= cp.length) {
          const fullD = ptsToPath(projStrokes[activeStroke]);
          if (doneGroup) {
            doneGroup.insertAdjacentHTML('beforeend',
              `<path d="${fullD}" fill="none" stroke="#ff7cb8" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
               <path d="${fullD}" fill="none" stroke="#ffd27a" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`);
          }
          if (progPath) progPath.setAttribute('d', '');
          if (progCore) progCore.setAttribute('d', '');
          uxSfx('stone_ok');
          uxConfetti(root.querySelector('.page'), curPt[0], curPt[1], 14);
          activeStroke++;
          prog = 0;
          if (activeStroke >= checkpoints.length) {
            completeLetter();
            return;
          }
        }
        syncStar();
      };

      const toStagePt = e => {
        const svg = /** @type {SVGSVGElement} */ (/** @type {unknown} */ ($('stage')));
        const ctm = svg && svg.getScreenCTM && svg.getScreenCTM();
        if (svg && ctm && svg.createSVGPoint) {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX; pt.y = e.clientY;
          return pt.matrixTransform(ctm.inverse());
        }
        return { x: e.clientX || 0, y: e.clientY || 0 };
      };

      if (hitEl) {
        hitEl.addEventListener('pointerdown', /** @param {PointerEvent} e */ e => {
          if (finished) return;
          unlockAudio();
          drawing = true;
          try { if (hitEl.setPointerCapture) hitEl.setPointerCapture(e.pointerId); } catch (_) {}
          const pt = toStagePt(e);
          stepPoint(pt.x, pt.y);
        });
        hitEl.addEventListener('pointermove', /** @param {PointerEvent} e */ e => {
          if (!drawing || finished) return;
          const pt = toStagePt(e);
          stepPoint(pt.x, pt.y);
        });
        const endDraw = () => { drawing = false; };
        hitEl.addEventListener('pointerup', endDraw);
        hitEl.addEventListener('pointercancel', endDraw);
      }

      const closeTrace = () => uxEnd(s, () => (typeof onDone === 'function' ? onDone() : showTitle()));
      s.onKey = closeTrace;
      uxBind(root, {
        back: closeTrace,
        finishDone: closeTrace,
        reset: () => { uxSfx('tap'); renderLetter(); },
        prevL: () => { curIdx = (curIdx - 1 + core.length) % core.length; uxSfx('page'); renderLetter(); uxWordVoice(core[curIdx].id); },
        nextL: () => { curIdx = (curIdx + 1) % core.length; uxSfx('page'); renderLetter(); uxWordVoice(core[curIdx].id); },
        word: card => { uxNudge(card); uxWordVoice(lid); },
      });
    };

    renderLetter();
    if (!traceIntroSaid) {
      traceIntroSaid = true;
      uxLine('trace_intro', { maxWait: 4000 });
    } else {
      uxWordVoice(letterId);
    }
  }

  /* ---------- 3. A <-> a Uppercase/Lowercase Hand-in-Hand Match ---------- */
  function showCaseMatch(onDone) {
    const core = WORDS.filter(w => w.kind === 'core');
    const learned = core.filter(w => save.words[w.id] && (save.words[w.id].heard > 0 || save.words[w.id].seen));
    const seedIds = ['a', 'b', 'd', 'e', 'g', 'h', 'm', 'n', 'q', 'r'];
    const pool = [...learned];
    for (const id of seedIds) {
      const obj = core.find(w => w.id === id);
      if (obj && !pool.some(x => x.id === id)) pool.push(obj);
    }
    const shuffled = pool.slice().sort(() => Math.random() - .5).slice(0, 4);
    const s = uxScreen('caseMatch');
    let roundIdx = 0;

    const renderRound = () => {
      if (!uxAlive(s)) return;
      if (roundIdx >= shuffled.length) {
        save.caseMatches = (save.caseMatches || 0) + 1;
        saveWrite();
        const root = uxPaint(`<g class="page">
          <image href="${SRC('bg_meadow')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
          <rect width="960" height="520" fill="#112219" opacity=".52"/>
          <rect x="230" y="96" width="500" height="260" rx="34" fill="#fffaf0" stroke="#ffd27a" stroke-width="5" filter="url(#softShadow)"/>
          <image href="${SRC('hat_butterfly')}" x="415" y="114" width="130" height="114" preserveAspectRatio="xMidYMid meet" class="ux-anim-pulse"/>
          <text x="480" y="274" text-anchor="middle" font-size="30" fill="#b8326a">大小写全部牵手成功！</text>
          <text x="480" y="316" text-anchor="middle" font-size="20" fill="#3b5e46">装扮间蝴蝶发箍彩蛋已解锁（已完成 ${save.caseMatches} 次）</text>
          ${uxButton({ act: 'again', ui: 'replay', icon: 'replay', x: 392, y: 426, r: 38 })}
          ${uxButton({ act: 'back', ui: 'next', icon: 'home', x: 568, y: 426, r: 42, plate: 'gold', cls: 'ux-pulse' })}
        </g>`);
        const finish = () => uxEnd(s, () => (typeof onDone === 'function' ? onDone() : showTitle()));
        s.onKey = finish;
        uxBind(root, { again: () => showCaseMatch(onDone), back: finish });
        uxSfx('gliss');
        uxConfetti(root.querySelector('.page'), 340, 200, 28);
        uxConfetti(root.querySelector('.page'), 620, 200, 28);
        uxLine('match_done', { maxWait: 4500 });
        return;
      }

      const target = shuffled[roundIdx];
      const distractors = core.filter(w => w.id !== target.id).sort(() => Math.random() - .5).slice(0, 2);
      const choices = [target, ...distractors].sort(() => Math.random() - .5);
      let assist = false;
      let locked = false;

      const palette = [['#ffe5f1', '#f287b7'], ['#e4f4ff', '#6dbbe8'], ['#fff3cc', '#efb646']];
      const xs = [250, 480, 710];
      const dots = shuffled.map((_, i) => `<circle cx="${480 + (i - 1.5) * 28}" cy="38" r="${i < roundIdx ? 7 : (i === roundIdx ? 9 : 6)}" fill="${i <= roundIdx ? '#ffd27a' : '#587863'}" stroke="#fff7e6" stroke-width="2"/>`).join('');

      const choiceHtml = choices.map((c, idx) => {
        const [bgCol, rimCol] = palette[idx % palette.length];
        return `<g class="stone-btn" data-pick="${c.id}" role="button" tabindex="0" aria-label="${c.lower}" transform="translate(${xs[idx]} 398)">
          <rect x="-80" y="-56" width="160" height="112" rx="28" fill="transparent"/>
          <rect class="match-assist" x="-80" y="-56" width="160" height="112" rx="28" fill="none" stroke="#ffd27a" stroke-width="5" opacity="0"/>
          <g class="stone-vis" filter="url(#softShadow)">
            <rect x="-74" y="-50" width="148" height="100" rx="24" fill="${bgCol}" stroke="${rimCol}" stroke-width="4.5"/>
            <rect x="-66" y="-42" width="132" height="84" rx="18" fill="#ffffff" opacity=".55"/>
            <text class="latin" x="0" y="22" text-anchor="middle" font-size="60" fill="#4e1f3a">${c.lower}</text>
          </g>
        </g>`;
      }).join('');

      const root = uxPaint(`<g class="page">
        <image href="${SRC('bg_meadow')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
        <rect width="960" height="520" fill="#112219" opacity=".48"/>
        ${uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 })}
        ${dots}
        <g class="ux-btn" data-word="${target.id}" role="button" tabindex="0" transform="translate(200 94)">
          <g class="btn-vis" filter="url(#softShadow)">
            <rect width="196" height="196" rx="28" fill="#fffaf0" stroke="#f287b7" stroke-width="4.5"/>
            <text class="latin" x="98" y="114" text-anchor="middle" font-size="88" fill="#b8326a">${target.letter}</text>
            <text class="latin" x="98" y="168" text-anchor="middle" font-size="24" fill="#36260b">${target.wordEn || target.en}</text>
          </g>
        </g>
        <line x1="406" y1="192" x2="554" y2="192" stroke="#ffd27a" stroke-width="5" stroke-dasharray="10 8" stroke-linecap="round"/>
        <image id="matchHeart" href="${SRC('fx_heart')}" x="454" y="166" width="52" height="52" opacity=".45" preserveAspectRatio="xMidYMid meet"/>
        <g transform="translate(564 94)" filter="url(#softShadow)">
          <rect id="matchTargetBg" width="196" height="196" rx="28" fill="#fffaf0" fill-opacity=".86" stroke="#ffd27a" stroke-width="4" stroke-dasharray="10 6"/>
          <image href="${SRC(target.icon || 'word_' + target.id)}" x="58" y="24" width="80" height="80" preserveAspectRatio="xMidYMid meet"/>
          <text id="matchTargetTxt" class="latin" x="98" y="168" text-anchor="middle" font-size="68" fill="#9a7b42">?</text>
        </g>
        ${choiceHtml}
      </g>`);

      const back = () => uxEnd(s, () => (typeof onDone === 'function' ? onDone() : showTitle()));
      s.onKey = back;
      uxBind(root, { back, word: el => { uxNudge(el); uxWordVoice(target.id); } });
      if (roundIdx === 0) uxLine('match_intro', { maxWait: 4000 });
      else uxWordVoice(target.id);

      root.querySelectorAll('[data-pick]').forEach(btn => {
        const pid = btn.getAttribute('data-pick');
        const pick = () => {
          if (!uxAlive(s) || locked) return;
          unlockAudio();
          if (pid === target.id) {
            locked = true;
            const heart = root.querySelector('#matchHeart');
            const tBg = root.querySelector('#matchTargetBg');
            const tTxt = root.querySelector('#matchTargetTxt');
            if (heart) { heart.setAttribute('opacity', '1'); heart.setAttribute('class', 'ux-anim-pulse'); }
            if (tBg) { tBg.removeAttribute('stroke-dasharray'); tBg.setAttribute('fill', '#fff3cc'); tBg.setAttribute('fill-opacity', '1'); tBg.setAttribute('stroke', '#f287b7'); }
            if (tTxt) { tTxt.setAttribute('fill', '#4e1f3a'); tTxt.textContent = target.lower; }
            uxSfx('blend');
            uxConfetti(root.querySelector('.page'), 480, 192, 26);
            uxWordVoice(target.id);
            setTimeout(() => {
              if (!uxAlive(s)) return;
              roundIdx++;
              renderRound();
            }, 1350);
          } else {
            uxSfx('wrong');
            uxNudge(btn);
            if (!assist) {
              assist = true;
              const rightBtn = root.querySelector(`[data-pick="${target.id}"]`);
              if (rightBtn) {
                rightBtn.classList.add('ux-pulse');
                const ring = rightBtn.querySelector('.match-assist');
                if (ring) ring.setAttribute('opacity', '1');
              }
            }
          }
        };
        btn.addEventListener('click', pick);
        btn.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
    };

    renderRound();
  }

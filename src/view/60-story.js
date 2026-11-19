  /* Storybooks, Chapter Card (跟我说 ripple), Recall, Clear Quiz, Memory Postcard, and Grand Finale Keepsake Album. */
  let story = null;
  let storyDraws = 0;
  const storyIsOpen = () => !!story;
  const uxHooks = { replay: /** @type {(i: number) => void} */ (() => {}), back: () => {} };

  const UX_STAR_D = 'M0 -.8L.22 -.25L.8 -.22L.35 .15L.5 .72L0 .4L-.5 .72L-.35 .15L-.8 -.22L-.22 -.25Z';

  function uxLevel(v) { return typeof v === 'number' ? LEVELS[v] : v; }
  function uxLevelIndex(lv) { return LEVELS.indexOf(lv); }
  function uxRoomWords(lv) { return (lv && lv.words ? lv.words : []).map(id => WORDS.find(w => w.id === id)).filter(Boolean); }
  function uxWordList(ids) { return (ids || []).map(id => typeof id === 'string' ? WORDS.find(w => w.id === id) : id).filter(Boolean); }

  function uxKey(prefix, id) { return prefix + '_' + id; }
  function uxLine(key, opts) { return hasLineKey(key) ? voice.line(key, opts) : Promise.resolve(false); }
  function uxLineArt(key, fallback) { const L = lineOf(key); return (L && L.art) || fallback; }
  function uxPreload(keys) { if (typeof voice !== 'undefined' && voice.preload) voice.preload(keys); }
  function uxStopVoice() { if (typeof voice !== 'undefined' && voice.stop) voice.stop(); }
  function uxWordVoice(id) { if (typeof voice !== 'undefined' && voice.word) voice.word(id); }
  function uxWait(ms) { return new Promise(ok => setTimeout(ok, ms)); }
  function uxSaveNow() { saveWrite(); }
  function uxNoteReviewed(id) { noteReviewed(save.words, id, reviewContext(save)); saveWrite(); }

  function uxScreen(name) {
    story = { name, seq: 0, onKey: null };
    return story;
  }
  const uxAlive = s => story === s;
  function uxEnd(s, done) {
    if (story !== s) return;
    story = null;
    $('overlay').textContent = '';
    uxStopVoice();
    if (typeof done === 'function') done();
  }

  function uxPaint(html) {
    const root = $('overlay');
    root.innerHTML = html;
    return root;
  }

  function uxPic(name, x, y, w, h, fallback, fit) {
    if (SIZES[name]) return `<image href="${SRC(name)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid ${fit || 'slice'}"/>`;
    return fallback || '';
  }

  function uxIcon(kind, r, col) {
    const s = r || 20, c = col || '#fff7e6';
    if (kind === 'next') return `<path d="M${-s * .35} ${-s * .4}L${s * .4} 0L${-s * .35} ${s * .4}Z" fill="${c}"/>`;
    if (kind === 'back') return `<path d="M${s * .35} ${-s * .4}L${-s * .4} 0L${s * .35} ${s * .4}Z" fill="${c}"/>`;
    if (kind === 'home') return `<path d="M0 ${-s * .55}L${s * .58} ${-s * .05}V${s * .55}H${s * .18}V${s * .12}H${-s * .18}V${s * .55}H${-s * .58}V${-s * .05}Z" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>`;
    if (kind === 'replay') return `<path d="M${s * .45} ${-s * .15}A${s * .48} ${s * .48} 0 1 0 ${s * .35} ${s * .32}" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/><path d="M${s * .25} ${-s * .35}L${s * .52} ${-s * .08}L${s * .18} ${s * .04}Z" fill="${c}"/>`;
    if (kind === 'play') return `<path d="M${-s * .28} ${-s * .45}L${s * .52} 0L${-s * .28} ${s * .45}Z" fill="${c}"/>`;
    if (kind === 'book') return `<rect x="${-s * .55}" y="${-s * .45}" width="${s * 1.1}" height="${s * .9}" rx="4" fill="none" stroke="${c}" stroke-width="2.6"/><line x1="0" y1="${-s * .45}" x2="0" y2="${s * .45}" stroke="${c}" stroke-width="2.2"/>`;
    if (kind === 'sticker') return `<path d="${UX_STAR_D}" transform="scale(${s * .68})" fill="${c}"/>`;
    if (kind === 'wardrobe') return `<path d="M0 ${-s * .5}L${s * .45} ${-s * .1}L${s * .3} ${s * .55}H${-s * .3}L${-s * .45} ${-s * .1}Z" fill="none" stroke="${c}" stroke-width="2.6" stroke-linejoin="round"/>`;
    if (kind === 'rooms') return `<rect x="${-s * .5}" y="${-s * .5}" width="${s * .42}" height="${s * .42}" rx="4" fill="${c}"/><rect x="${s * .08}" y="${-s * .5}" width="${s * .42}" height="${s * .42}" rx="4" fill="${c}"/><rect x="${-s * .5}" y="${s * .08}" width="${s * .42}" height="${s * .42}" rx="4" fill="${c}"/><rect x="${s * .08}" y="${s * .08}" width="${s * .42}" height="${s * .42}" rx="4" fill="${c}"/>`;
    if (kind === 'gear') return `<circle r="${s * .42}" fill="none" stroke="${c}" stroke-width="3.2" stroke-dasharray="5 3"/><circle r="${s * .16}" fill="${c}"/>`;
    return `<circle r="${s * .35}" fill="${c}"/>`;
  }

  function uxButton(o) {
    const r = Math.max(32, o.r || 36);
    const hitR = layoutHitRadius(r, !!o.ring);
    const fill = o.plate === 'gold' ? 'url(#goldGrad)' : 'url(#plateGrad)';
    const stroke = o.plate === 'gold' ? '#fff7dc' : '#80a875';
    const icCol = o.plate === 'gold' ? '#4a2605' : '#1b3824';
    const cls = 'ux-btn' + (o.cls ? ' ' + o.cls : '');
    const pic = o.pic ? uxPic(o.pic, -r * .78, -r * .78, r * 1.56, r * 1.56) : uxIcon(o.icon || o.ui, r * .65, icCol);
    return `<g class="${cls}" data-act="${o.act}" data-ui="${o.ui || o.act}" role="button" tabindex="0" aria-label="${o.ui || o.act}" transform="translate(${o.x} ${o.y})">
      <circle r="${hitR}" fill="transparent"/><g class="btn-vis" filter="url(#softShadow)">
      <circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="3.5"/>${pic}</g></g>`;
  }

  function uxNudge(node) {
    if (!node) return;
    node.classList.remove('ux-shake');
    void node.getBoundingClientRect();
    node.classList.add('ux-shake');
  }

  function uxPopSlot(root, k) {
    const n = root.querySelector(`[data-pop="${k}"]`);
    if (n) n.classList.add('on');
  }

  function uxBind(root, handlers) {
    if (!root) return;
    root.querySelectorAll('[data-act]').forEach(btn => {
      const act = btn.getAttribute('data-act'), ui = btn.getAttribute('data-ui');
      btn.addEventListener('pointerenter', () => { if (ui && typeof voice !== 'undefined') voice.ui(ui); });
      btn.addEventListener('focus', () => { if (ui && typeof voice !== 'undefined') voice.ui(ui); });
      btn.addEventListener('click', () => { if (handlers[act]) handlers[act](btn); });
      btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (handlers[act]) handlers[act](btn); } });
    });
    if (handlers.word) {
      root.querySelectorAll('[data-word]').forEach(card => {
        const go = () => handlers.word(card);
        card.addEventListener('click', go);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
    }
  }

  function uxCardRow(words, y, cw, ch, gap) {
    const n = words.length, x0 = 480 - (n * cw + (n - 1) * gap) / 2;
    const tones = [['#ffe5f1', '#f287b7'], ['#e4f4ff', '#6dbbe8'], ['#fff2cc', '#efb646'], ['#ebfae8', '#7ec476']];
    return words.map((w, i) => {
      const x = x0 + i * (cw + gap), pad = Math.round(cw * .12);
      const imgY = w.letter ? 54 : 14;
      const imgH = ch - imgY - 46;
      const [pillBg, pillRim] = tones[i % tones.length];
      const badge = w.letter
        ? `<rect x="${cw / 2 - 42}" y="12" width="84" height="36" rx="18" fill="${pillBg}" stroke="${pillRim}" stroke-width="2.5"/>
           <text class="latin" x="${cw / 2}" y="38" text-anchor="middle" font-size="25" fill="#4e1f3a">${w.letter}${w.lower}</text>`
        : '';
      const subLabel = w.wordEn || w.en;
      return `<g class="ux-pop" data-pop="${i}"><g class="ux-btn" data-word="${w.id}" role="button" tabindex="0" aria-label="${w.en}" transform="translate(${x} ${y})">
        <g class="btn-vis" filter="url(#softShadow)">
        <rect width="${cw}" height="${ch}" rx="22" fill="#fffaf0" stroke="#e4b457" stroke-width="3.5"/>
        ${badge}
        ${uxPic(w.icon || 'word_' + w.id, pad, imgY, cw - pad * 2, imgH, '', 'meet')}
        <text class="latin" x="${cw / 2}" y="${ch - 14}" text-anchor="middle" font-size="${cw > 180 ? 28 : 23}" fill="#2b1f09">${subLabel}</text>
      </g></g></g>`;
    }).join('');
  }

  /* ---------- story sequence (prologue / finale story) ---------- */
  function showStory(keys, done) {
    const s = uxScreen('story');
    storyDraws++;
    uxPreload(keys);
    let idx = 0;
    const render = () => {
      if (!uxAlive(s)) return;
      const key = keys[idx], art = uxLineArt(key, 'story_open');
      const root = uxPaint(`<g class="page">
        <image href="${SRC(art)}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
        <rect width="960" height="520" fill="url(#bottomFade)" opacity=".45" pointer-events="none"/>
        <g transform="translate(480 492)">${keys.map((_, k) => `<circle cx="${(k - (keys.length - 1) / 2) * 20}" cy="0" r="${k === idx ? 6 : 4.5}" fill="${k === idx ? '#ffd27a' : '#b7d4c0'}"/>`).join('')}</g>
        ${uxButton({ act: 'next', ui: 'next', icon: 'next', x: 886, y: 452, r: 38, plate: 'gold' })}
      </g>`);
      const next = () => {
        if (!uxAlive(s)) return;
        uxStopVoice();
        if (++idx < keys.length) render();
        else uxEnd(s, done);
      };
      s.onKey = next;
      uxBind(root, { next });
      uxLine(key).then(() => {
        if (!uxAlive(s)) return;
        const b = root.querySelector('[data-act="next"]');
        if (b) b.classList.add('ux-pulse');
      });
    };
    render();
  }

  /* ---------- chapter card with "跟我说" sound-wave ripple & confetti (plus interactive A-Z Rainbow Wall on Room 8) ---------- */
  function showChapter(level, done) {
    const lv = uxLevel(level), words = uxRoomWords(lv), s = uxScreen('chapter');
    uxPreload([uxKey('ch', lv.id), ...words.map(w => uxKey('learn', w.id))]);
    const isRainbow = lv.id === 'camp';
    const n = words.length, cw = n >= 4 ? 192 : 216, ch = n >= 4 ? 238 : 250, gap = n >= 4 ? 20 : 28;
    const x0 = 480 - (n * cw + (n - 1) * gap) / 2;
    const cardY = n >= 4 ? 126 : 118;

    let cardsHtml = uxCardRow(words, cardY, cw, ch, gap);
    if (isRainbow) {
      const allAz = WORDS.filter(w => w.kind === 'core');
      const fills = ['#ffe4f0', '#e4f4ff', '#fff3cc', '#ebfae8', '#f2e8ff', '#ffeede'];
      const rims = ['#f287b7', '#6dbbe8', '#efb646', '#7ec476', '#a884e6', '#f29a5e'];
      const rowLens = [7, 7, 6, 6];
      let cursor = 0;
      const wall = [];
      rowLens.forEach((cnt, rIdx) => {
        const bw = 96, bh = 74, bgap = 12;
        const rx0 = 480 - (cnt * bw + (cnt - 1) * bgap) / 2;
        const ry = 76 + rIdx * 86;
        for (let k = 0; k < cnt && cursor < allAz.length; k++) {
          const w = allAz[cursor++];
          const bx = rx0 + k * (bw + bgap);
          const ci = (rIdx * 7 + k) % fills.length;
          wall.push(`<g class="ux-pop on"><g class="ux-btn" data-word="${w.id}" role="button" tabindex="0" aria-label="${w.en}" transform="translate(${bx} ${ry})">
            <g class="btn-vis" filter="url(#softShadow)">
              <rect width="${bw}" height="${bh}" rx="18" fill="${fills[ci]}" stroke="${rims[ci]}" stroke-width="3.2"/>
              <text class="latin" x="${bw / 2 - 11}" y="47" text-anchor="middle" font-size="31" fill="#4e1f3a">${w.letter}</text>
              <text class="latin" x="${bw / 2 + 17}" y="47" text-anchor="middle" font-size="23" fill="#8a4a6e">${w.lower}</text>
            </g>
          </g></g>`);
        }
      });
      cardsHtml = `<g filter="url(#softShadow)">
        <rect x="275" y="18" width="410" height="44" rx="22" fill="#13261b" opacity=".88" stroke="#ffd27a" stroke-width="2.5"/>
        <text x="480" y="47" text-anchor="middle" font-size="22" fill="#fff7df">A – Z 字母彩虹墙（点字母听发音！）</text>
      </g>` + wall.join('');
    }

    const root = uxPaint(`<g class="page">
      <image href="${SRC(uxLineArt('ch_' + lv.id, lv.bg))}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
      <rect width="960" height="520" fill="#112219" opacity=".52"/>
      ${cardsHtml}
      <g id="uxCue" opacity="0" transform="translate(480 68)" pointer-events="none">
        <circle class="ux-ripple" r="24" fill="none" stroke="#ffd27a" stroke-width="4"/>
        <circle r="22" fill="#ffd27a" opacity=".25"/>
      </g>
      ${uxButton({ act: 'go', ui: 'next', icon: 'next', x: 886, y: 452, r: 38, plate: 'gold', cls: isRainbow ? 'ux-pulse' : '' })}
    </g>`);
    const finish = () => uxEnd(s, done);
    s.onKey = finish;
    uxBind(root, { go: finish, word: el => { uxNudge(el); uxWordVoice(el.dataset.word); uxConfetti(root.querySelector('.page'), 480, 220, 8); } });
    const cue = root.querySelector('#uxCue');
    const setCue = k => {
      if (k == null) { cue.setAttribute('opacity', '0'); return; }
      cue.setAttribute('transform', `translate(${x0 + k * (cw + gap) + cw / 2} 92)`);
      cue.setAttribute('opacity', '1');
    };
    (async () => {
      await uxLine('ch_' + lv.id);
      if (isRainbow) return;
      for (let k = 0; k < n; k++) {
        if (!uxAlive(s)) return;
        uxPopSlot(root, k); uxSfx('page'); setCue(k);
        await uxLine('learn_' + words[k].id);
        if (!uxAlive(s)) return;
        await uxWait(1200);
        if (!uxAlive(s)) return;
        uxSfx('star');
        uxConfetti(root.querySelector('.page'), x0 + k * (cw + gap) + cw / 2, 110, 10);
        setCue(null);
        await uxWait(220);
      }
      if (!uxAlive(s)) return;
      const b = root.querySelector('[data-act="go"]');
      if (b) b.classList.add('ux-pulse');
    })();
  }

  /* ---------- spaced recall before entering the next room ---------- */
  function showRecall(prevLevel, done, ids) {
    const lv = prevLevel == null ? null : uxLevel(prevLevel), own = lv ? lv.words || [] : [];
    const words = uxWordList(Array.isArray(ids) ? ids : own);
    if (!lv || !words.length) { if (done) done(); return; }
    const s = uxScreen('recall');
    const older = recallOlderIds(own, words.map(w => w.id));
    uxPreload(words.map(w => uxKey('recall', w.id)));
    const wide = words.length > 3;
    const root = uxPaint(`<g class="page">
      <image href="${SRC(lv.bg)}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
      <rect width="960" height="520" fill="#112219" opacity=".54"/>
      ${wide ? uxCardRow(words, 145, 160, 196, 16) : uxCardRow(words, 130, 210, 240, 28)}
      ${uxButton({ act: 'skip', ui: 'next', icon: 'next', x: 886, y: 452, r: 36, plate: 'gold' })}
    </g>`);
    const finish = () => uxEnd(s, done);
    s.onKey = finish;
    uxBind(root, { skip: finish, word: el => { uxNudge(el); uxWordVoice(el.dataset.word); } });
    (async () => {
      for (let k = 0; k < words.length; k++) {
        if (!uxAlive(s)) return;
        uxPopSlot(root, k); uxSfx('page');
        await uxLine('recall_' + words[k].id);
        if (!uxAlive(s)) return;
        if (older.includes(words[k].id)) uxNoteReviewed(words[k].id);
        await uxWait(180);
      }
      await uxWait(450);
      finish();
    })();
  }

  /* ---------- memory postcard popup ---------- */
  function showMemory(level, id, done) {
    const lv = uxLevel(level), s = uxScreen('memory');
    const root = uxPaint(`<g class="page">
      <rect width="960" height="520" fill="#112219" opacity=".72"/>
      <g transform="translate(480 240)" filter="url(#softShadow)">
        <rect x="-250" y="-155" width="500" height="310" rx="28" fill="#fffaf0" stroke="#ffd27a" stroke-width="5"/>
        ${uxPic(uxLineArt('mem_' + id, lv.bg), -230, -135, 460, 250)}
        ${uxPic('prop_postcard', 165, -130, 68, 68)}
      </g>
      ${uxButton({ act: 'ok', ui: 'next', icon: 'next', x: 480, y: 446, r: 38, plate: 'gold', cls: 'ux-pulse' })}
    </g>`);
    const ok = () => uxEnd(s, done);
    s.onKey = ok;
    uxBind(root, { ok });
    uxSfx('star');
    uxConfetti(root.querySelector('.page'), 480, 200, 20);
    uxLine('mem_' + id);
  }

  /* ---------- clear page: 3 stars -> word cards -> listening quiz ---------- */
  function showClear(level, done) {
    const lv = uxLevel(level), idx = uxLevelIndex(lv), words = uxRoomWords(lv), s = uxScreen('clear');
    const memory = !!game.memoryFound, acorns = !game.acorns || game.acorns.total === 0 ? true : game.acorns.got >= game.acorns.total;
    const got = [true, memory, acorns];
    s.seq = 0;

    const starsHtml = got.map((g, k) => `<g transform="translate(${(k - 1) * 140} 0)"><g class="ux-pop" data-pop="s${k}">
      ${g ? '<circle r="60" fill="#fff2b5" opacity=".32"/>' : ''}
      <path d="${UX_STAR_D}" transform="scale(56)" fill="${g ? 'url(#goldGrad)' : '#1d3627'}" stroke="${g ? '#fff5cf' : '#588267'}" stroke-width=".06" opacity="${g ? 1 : .85}"/>
    </g></g>`).join('');

    uxPaint(`<g class="page">
      <image href="${SRC(lv.bg)}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
      <rect width="960" height="520" fill="#112219" opacity=".58"/>
      <g id="uxStars" transform="translate(480 155)">${starsHtml}</g>
      <g id="uxBody"></g><g id="uxCtl"></g>
    </g>`);
    const root = $('overlay'), body = root.querySelector('#uxBody'), ctl = root.querySelector('#uxCtl');
    const mark = () => { const me = ++s.seq; return () => uxAlive(s) && s.seq === me; };
    const setCtl = html => { ctl.innerHTML = html; uxBind(ctl, { next: () => s.onKey && s.onKey(), replay: () => { if (uxAlive(s)) { uxEnd(s, null); uxHooks.replay(idx); } }, done: () => uxEnd(s, done) }); };
    const nextBtn = () => uxButton({ act: 'next', ui: 'next', icon: 'next', x: 886, y: 452, r: 38, plate: 'gold' });

    const phaseStars = () => {
      const ok = mark();
      s.onKey = () => { if (ok()) phaseQuiz(); };
      setCtl(nextBtn());
      (async () => {
        const ln = uxLine('clear_' + lv.id);
        for (let k = 0; k < 3; k++) {
          await uxWait(k ? 550 : 280);
          if (!ok()) return;
          uxPopSlot(root, 's' + k);
          if (got[k]) { uxSfx('star'); uxConfetti(root.querySelector('.page'), 480 + (k - 1) * 140, 155, 12); }
        }
        await ln;
        await uxWait(650);
        if (ok()) phaseQuiz();
      })();
    };

    const phaseQuiz = () => {
      const ok = mark();
      const target = words[Math.floor(Math.random() * words.length)] || words[0];
      const validIds = new Set(WORDS.filter(w => w.kind === 'core').map(w => w.id));
      const otherLearned = Object.keys(save.words || {}).filter(id => validIds.has(id) && !words.some(w => w.id === id));
      const optIds = quizOptions(target.id, words.map(w => w.id), otherLearned, save.words, makeReviewRng(idx * 31 + 7));
      const opts = uxWordList(optIds);
      root.querySelector('#uxStars').setAttribute('transform', 'translate(480 86) scale(.55)');
      body.innerHTML = `<g transform="translate(0 40)">${uxCardRow(opts, 148, 210, 236, 26)}</g>`;
      opts.forEach((_, k) => uxPopSlot(root, k));
      setCtl(uxButton({ act: 'done', ui: 'quiz_skip', icon: 'next', x: 886, y: 452, r: 34 }));
      let tried = false, locked = false;
      uxLine('quiz_' + target.id);
      root.querySelectorAll('[data-word]').forEach(card => {
        const pick = () => {
          if (!ok() || locked) return;
          const id = card.getAttribute('data-word');
          if (id === target.id) {
            locked = true;
            noteQuizAnswer(save.words, target.id, !tried, reviewContext(save));
            saveWrite();
            uxSfx('star');
            uxConfetti(root.querySelector('.page'), 480, 260, 24);
            uxLine('quiz_right_' + (1 + Math.floor(Math.random() * 3))).then(() => {
              if (!ok()) return;
              body.innerHTML = '';
              setCtl(uxButton({ act: 'done', ui: 'next', icon: 'next', x: 585, y: 315, r: 52, plate: 'gold', cls: 'ux-pulse' }) + uxButton({ act: 'replay', ui: 'replay', icon: 'replay', x: 375, y: 315, r: 42 }));
            });
          } else {
            tried = true;
            uxSfx('wrong');
            uxNudge(card);
            uxLine('quiz_wrong_' + (1 + Math.floor(Math.random() * 3)));
          }
        };
        card.addEventListener('click', pick);
        card.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
    };

    phaseStars();
  }

  /* ---------- grand finale keepsake album: falling leaves/petals, dressed-up hero pups & 3 visual achievement badges ---------- */
  function showFinale(done) {
    const s = uxScreen('finale');
    const finish = () => uxEnd(s, done);
    s.onKey = finish;
    let totalStars = 0;
    for (const lv of LEVELS) {
      const r = save.rooms && save.rooms[lv.id];
      if (r && Array.isArray(r.stars)) totalStars += r.stars.filter(Boolean).length;
    }
    const coreIds = new Set(WORDS.filter(w => w.kind === 'core').map(w => w.id));
    const stickerCount = (Array.isArray(save.stickers) ? save.stickers : []).filter(id => coreIds.has(id)).length;
    const wordCount = Object.entries(save.words || {}).filter(([id, w]) => coreIds.has(id) && w && ((w.heard || 0) > 0 || w.seen)).length;
    const badge = (cx, cy, iconHtml, num) => `<g transform="translate(${cx} ${cy})">
      <rect x="-78" y="-26" width="156" height="52" rx="26" fill="#13261b" opacity=".88" stroke="#ffd27a" stroke-width="2.5"/>
      <g transform="translate(-44 0)">${iconHtml}</g>
      <text class="latin" x="16" y="8" text-anchor="middle" font-size="25" fill="#fff5cf">${num}</text></g>`;
    const petals = Array.from({ length: 18 }, (_, i) => {
      const px = 45 + ((i * 53) % 870), delay = -(i * .37).toFixed(2), col = ['#ffd97d', '#ffc2d9', '#b8eb8a', '#ffe699'][i % 4];
      return `<g transform="translate(${px} 0)"><ellipse class="fin-petal" rx="${6 + (i % 3) * 2}" ry="${3.5 + (i % 2) * 1.5}" fill="${col}" style="animation-delay:${delay}s"/></g>`;
    }).join('');
    const root = uxPaint(`<g class="page">
      <image href="${SRC('bg_woods')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
      <rect width="960" height="520" fill="#112219" opacity=".36"/>
      <g pointer-events="none">${petals}</g>
      <rect x="210" y="38" width="540" height="316" rx="34" fill="#fffaf0" stroke="#ffd27a" stroke-width="5" filter="url(#softShadow)"/>
      <rect x="224" y="52" width="512" height="288" rx="24" fill="#2c593e" opacity=".12" stroke="#d9c69e" stroke-width="2"/>
      <circle cx="380" cy="196" r="95" fill="url(#rose)"/><circle cx="575" cy="198" r="95" fill="url(#warm)"/>
      <g id="finSkye" transform="translate(380 322) scale(1.6)"></g>
      <g id="finLab" transform="translate(575 322) scale(1.5)"></g>
      ${badge(284, 396, uxPic('fx_star', -18, -18, 36, 36, `<path d="${UX_STAR_D}" transform="scale(18)" fill="#ffd27a"/>`), `${totalStars}/${LEVELS.length * 3}`)}
      ${badge(480, 396, uxIcon('sticker', 20, '#ffd27a'), String(stickerCount))}
      ${badge(676, 396, uxIcon('book', 20, '#c8f0d4'), String(wordCount))}
      ${uxButton({ act: 'wardrobe', ui: 'wardrobe', icon: 'wardrobe', x: 356, y: 468, r: 34 })}
      ${uxButton({ act: 'stickers', ui: 'stickers', icon: 'sticker', x: 452, y: 468, r: 34 })}
      ${uxButton({ act: 'done', ui: 'back', icon: 'home', x: 584, y: 464, r: 42, plate: 'gold', cls: 'ux-pulse' })}
    </g>`);
    [['skye', '#finSkye'], ['labrador', '#finLab']].forEach(([who, sel]) => {
      const box = root.querySelector(sel);
      if (!box || typeof renderPupNode !== 'function') return;
      const o = (save.outfit && save.outfit[who]) || { dress: 0, hat: null };
      renderPupNode(box, who, 'cheer', o);
    });
    uxBind(root, {
      done: finish,
      wardrobe: () => { uxEnd(s, null); if (typeof showWardrobe === 'function') showWardrobe(false); else finish(); },
      stickers: () => { uxEnd(s, null); if (typeof showStickers === 'function') showStickers(); else finish(); },
    });
    uxSfx('unlock');
    uxConfetti(root.querySelector('.page'), 480, 180, 36);
    uxLine('cheer_1');
  }

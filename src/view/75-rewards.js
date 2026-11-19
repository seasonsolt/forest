  /* Rewards: 26-Letter Alphabet Book + Mini-Game Launchers, Sticker Treehouse Board, Meet & 5-Hat Wardrobe. */
  const WARDROBE_UNLOCKS = { d1: 2, d2: 5, bow: 3, wreath: 8, butterfly: 10, detective: 12, crown: 16 };

  function totalStarsCount() {
    let n = 0;
    for (const lv of LEVELS) {
      const r = save.rooms && save.rooms[lv.id];
      if (r && Array.isArray(r.stars)) n += r.stars.filter(Boolean).length;
    }
    return n;
  }

  /* ---------- 26-Letter Alphabet Book + Interactive Playgrounds ---------- */
  function showWords() {
    const core = WORDS.filter(w => w.kind === 'core');
    const pages = Math.max(1, Math.ceil(core.length / 9));
    let pageIdx = 0;
    const s = uxScreen('words');
    const render = () => {
      if (!uxAlive(s)) return;
      const slice = core.slice(pageIdx * 9, pageIdx * 9 + 9);
      const tracedCount = Object.keys(save.traced || {}).filter(k => save.traced[k]).length;
      const cards = slice.map((w, i) => {
        const col = i % 3, row = (i / 3) | 0;
        const x = 104 + col * 256, y = 94 + row * 122;
        const learned = !!(save.words[w.id] && (save.words[w.id].heard > 0 || save.words[w.id].seen));
        const traced = !!(save.traced && save.traced[w.id]);
        return `<g class="ux-btn" data-word="${w.id}" role="button" tabindex="0" aria-label="${w.en}" transform="translate(${x} ${y})">
          <g class="btn-vis" filter="url(#softShadow)">
            <rect width="238" height="110" rx="20" fill="${learned ? '#fffaf0' : '#1b3124'}" stroke="${traced ? '#f287b7' : (learned ? '#ffd27a' : '#4a6b56')}" stroke-width="3"/>
            <image href="${SRC(w.icon || 'word_' + w.id)}" x="12" y="15" width="78" height="78" preserveAspectRatio="xMidYMid meet" ${learned ? '' : 'filter="url(#silhouette)" opacity=".5"'}/>
            <text class="latin" x="148" y="53" text-anchor="middle" font-size="30" fill="${learned ? '#b8326a' : '#73917e'}">${learned ? (w.letter ? w.letter + w.lower : w.en) : '???'}</text>
            <text class="latin" x="148" y="83" text-anchor="middle" font-size="18" fill="${learned ? '#36260b' : '#73917e'}">${learned ? (w.wordEn || '') : ''}</text>
            <g class="ux-btn" data-trace="${w.id}" role="button" tabindex="0" aria-label="描红 ${w.letter}" transform="translate(212 24)">
              <circle r="17" fill="${traced ? '#ffd27a' : '#ffe5f1'}" stroke="${traced ? '#e89d2f' : '#f287b7'}" stroke-width="2"/>
              <text x="0" y="6" text-anchor="middle" font-size="15" fill="#7a2c4f">${traced ? '★' : '✎'}</text>
            </g>
          </g>
        </g>`;
      }).join('');
      const dotX0 = 480 - ((pages - 1) * 40) / 2;
      const pageDots = Array.from({ length: pages }, (_, p) => `<circle class="ux-btn" data-act="pg${p}" cx="${dotX0 + p * 40}" cy="482" r="14" fill="${p === pageIdx ? '#ffd27a' : '#486b54'}" stroke="#fff7e6" stroke-width="2"/>`).join('');
      const root = uxPaint(`<g class="page">
        <image href="${SRC('bg_woods')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
        <rect width="960" height="520" fill="#112219" opacity=".68"/>
        ${uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 })}
        <g filter="url(#softShadow)">
          <rect x="164" y="25" width="320" height="46" rx="23" fill="#13261b" opacity=".88" stroke="#ffd27a" stroke-width="2.5"/>
          <text x="324" y="55" text-anchor="middle" font-size="22" fill="#fff7df">26 字母图鉴（星光描红 ${tracedCount}/26）</text>
        </g>
        ${uxButton({ act: 'abcSong', ui: 'abc_song', icon: 'note', x: 644, y: 48, r: 32, plate: 'gold' })}
        ${uxButton({ act: 'traceMode', ui: 'trace', icon: 'trace', x: 736, y: 48, r: 32 })}
        ${uxButton({ act: 'caseMatch', ui: 'case_match', icon: 'hearts', x: 828, y: 48, r: 32 })}
        ${pageDots}
        ${uxButton({ act: 'pageNext', ui: 'next', icon: pageIdx < pages - 1 ? 'next' : 'back', x: 902, y: 268, r: 34, plate: 'gold' })}
        ${cards}
      </g>`);
      const back = () => uxEnd(s, () => showTitle());
      s.onKey = back;
      const handlers = {
        back,
        pageNext: () => { pageIdx = (pageIdx + 1) % pages; render(); },
        abcSong: () => uxEnd(s, () => { if (typeof showAbcPiano === 'function') showAbcPiano(() => showWords()); else showTitle(); }),
        traceMode: () => uxEnd(s, () => { if (typeof showTrace === 'function') showTrace((slice[0] && slice[0].id) || 'a', () => showWords()); else showTitle(); }),
        caseMatch: () => uxEnd(s, () => { if (typeof showCaseMatch === 'function') showCaseMatch(() => showWords()); else showTitle(); }),
        word: card => { uxNudge(card); uxWordVoice(card.getAttribute('data-word')); uxConfetti(root.querySelector('.page'), 480, 250, 8); },
      };
      for (let p = 0; p < pages; p++) handlers['pg' + p] = () => { pageIdx = p; render(); };
      uxBind(root, handlers);
      root.querySelectorAll('[data-trace]').forEach(tBtn => {
        const lid = tBtn.getAttribute('data-trace');
        const goTrace = e => {
          e.stopPropagation();
          uxEnd(s, () => { if (typeof showTrace === 'function') showTrace(lid, () => showWords()); else showWords(); });
        };
        tBtn.addEventListener('click', goTrace);
        tBtn.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTrace(e); } });
      });
    };
    render();
  }

  /* ---------- Sticker Treehouse Board (all 26 A-Z stickers, paginated 10-per-page tray) ---------- */
  function showStickers() {
    const core = WORDS.filter(w => w.kind === 'core');
    const coreIds = new Set(core.map(w => w.id));
    const unlocked = new Set((save.stickers || []).filter(id => coreIds.has(id)));
    for (const lv of LEVELS) {
      const r = save.rooms && save.rooms[lv.id];
      if (!r || !Array.isArray(r.stars)) continue;
      if (r.cleared || r.stars.some(Boolean)) lv.words.forEach(wid => { if (coreIds.has(wid)) unlocked.add(wid); });
    }
    save.stickers = [...unlocked];
    if (Array.isArray(save.board)) save.board = save.board.filter(b => coreIds.has(b.id));
    const s = uxScreen('stickers');
    let selected = null;
    let trayPage = 0;
    const render = () => {
      if (!uxAlive(s)) return;
      const allTray = core.filter(w => unlocked.has(w.id));
      const perPage = 10;
      const trayPages = Math.max(1, Math.ceil(allTray.length / perPage));
      trayPage = trayPage % trayPages;
      const tray = allTray.slice(trayPage * perPage, trayPage * perPage + perPage);
      const placed = (save.board || []).map((b, i) => {
        const tilt = ((i % 5) - 2) * 5;
        const w = core.find(x => x.id === b.id);
        const on = selected === b.id;
        return `<g class="ux-btn" data-placed="${b.id}" role="button" tabindex="0" transform="translate(${b.x} ${b.y}) rotate(${tilt})">
          <image href="${SRC('word_' + b.id)}" x="-42" y="-42" width="84" height="84" preserveAspectRatio="xMidYMid meet" filter="url(#softShadow)"/>
          <rect x="-22" y="28" width="44" height="19" rx="9" fill="${on ? '#ffd27a' : '#ffe5f1'}" stroke="#f287b7" stroke-width="1.6"/>
          <text class="latin" x="0" y="42" text-anchor="middle" font-size="13" fill="#4e1f3a">${w ? w.letter + w.lower : b.id}</text>
        </g>`;
      }).join('');
      const trayHtml = tray.map((w, i) => {
        const x = 128 + (i % 5) * 145, y = i < 5 ? 414 : 478;
        const on = selected === w.id;
        return `<g class="ux-btn" data-st="${w.id}" role="button" tabindex="0" transform="translate(${x} ${y})">
          <circle r="30" fill="${on ? '#ffd27a' : '#fffaf0'}" stroke="${on ? '#e67e22' : '#9ac090'}" stroke-width="3"/>
          <image href="${SRC('word_' + w.id)}" x="-22" y="-22" width="44" height="44" preserveAspectRatio="xMidYMid meet"/>
        </g>`;
      }).join('');
      const nextBtn = trayPages > 1 ? uxButton({ act: 'trayNext', ui: 'next', icon: 'next', x: 842, y: 446, r: 32, plate: 'gold' }) : '';
      const root = uxPaint(`<g class="page">
        <image href="${SRC('bg_meadow')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
        <rect width="960" height="520" fill="#112219" opacity=".45"/>
        <rect id="stkBoard" x="115" y="48" width="730" height="316" rx="28" fill="#fffaf0" opacity=".88" stroke="#d6a44e" stroke-width="5" filter="url(#softShadow)"/>
        ${placed}
        <rect x="64" y="378" width="832" height="132" rx="24" fill="#14291d" opacity=".85" stroke="#8cb67d" stroke-width="2"/>
        ${trayHtml}${nextBtn}
        ${uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 })}
      </g>`);
      const back = () => { saveWrite(); uxEnd(s, () => showTitle()); };
      s.onKey = back;
      uxBind(root, { back, trayNext: () => { trayPage = (trayPage + 1) % trayPages; render(); } });
      const board = root.querySelector('#stkBoard');
      const placeAt = (wid, bx, by) => {
        if (!save.board) save.board = [];
        save.board = save.board.filter(item => item.id !== wid).concat([{ id: wid, x: Math.max(165, Math.min(795, bx)), y: Math.max(95, Math.min(315, by)) }]);
        saveSoon(); uxWordVoice(wid); uxSfx('star');
        render();
      };
      root.querySelectorAll('[data-st]').forEach((btn, idx) => {
        const wid = btn.getAttribute('data-st');
        const choose = () => {
          selected = wid;
          uxWordVoice(wid);
          placeAt(wid, 220 + (idx % 6) * 104, idx < 6 ? 155 : 265);
        };
        btn.addEventListener('click', choose);
        btn.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(); } });
      });
      root.querySelectorAll('[data-placed]').forEach(pEl => {
        const wid = pEl.getAttribute('data-placed');
        const pickPlaced = () => {
          selected = wid;
          uxWordVoice(wid);
          uxSfx('tap');
          render();
        };
        pEl.addEventListener('click', pickPlaced);
        pEl.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickPlaced(); } });
      });
      if (board) {
        board.addEventListener('click', /** @param {MouseEvent} e */ e => {
          if (!selected) return;
          const svg = /** @type {SVGSVGElement} */ (/** @type {unknown} */ ($('stage')));
          const pt = svg.createSVGPoint();
          pt.x = e.clientX; pt.y = e.clientY;
          const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
          placeAt(selected, Math.round(loc.x), Math.round(loc.y));
        });
      }
    };
    render();
  }

  /* ---------- Meet Skye & Sheriff Labrador ---------- */
  function showMeet() {
    const s = uxScreen('meet');
    const root = uxPaint(`<g class="page">
      <image href="${SRC('bg_woods')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
      <rect width="960" height="520" fill="#112219" opacity=".5"/>
      <g class="ux-btn" data-hero="skye" role="button" tabindex="0" transform="translate(310 340) scale(1.35)">
        <circle cx="0" cy="-70" r="90" fill="url(#rose)"/>
        <g id="meetSkye"></g>
      </g>
      <g class="ux-btn" data-hero="labrador" role="button" tabindex="0" transform="translate(650 340) scale(1.22)">
        <circle cx="0" cy="-80" r="95" fill="url(#cool)"/>
        <g id="meetLab"></g>
      </g>
      ${uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 })}
      ${uxButton({ act: 'wardrobe', ui: 'wardrobe', icon: 'wardrobe', x: 480, y: 446, r: 42, plate: 'gold', cls: 'ux-pulse' })}
    </g>`);
    if (typeof renderPupNode === 'function') {
      renderPupNode(root.querySelector('#meetSkye'), 'skye', 'idle', save.outfit.skye);
      renderPupNode(root.querySelector('#meetLab'), 'labrador', 'idle', save.outfit.labrador);
    }
    const back = () => uxEnd(s, () => showTitle());
    s.onKey = back;
    uxBind(root, { back, wardrobe: () => uxEnd(s, () => showWardrobe(true)) });
    root.querySelectorAll('[data-hero]').forEach(g => {
      g.addEventListener('click', () => {
        const who = g.getAttribute('data-hero');
        uxNudge(g); uxLine('me_' + who, { interrupt: true });
      });
    });
    uxLine('me_labrador');
  }

  /* ---------- Pup Gear Locker / Wardrobe (3 Outfits + 5 Hats including Girl Bow & Butterfly Headband) ---------- */
  function showWardrobe(fromMeet) {
    const s = uxScreen('wardrobe');
    const stars = totalStarsCount();
    const tracedCount = Object.keys(save.traced || {}).filter(k => save.traced[k]).length;
    const hatRows = [[null, 'bow', 'wreath'], ['butterfly', 'detective', 'crown']];
    const hatHint = { bow: '★3/✎3', wreath: '★8', butterfly: 'Aa/★10', detective: '★12', crown: '★16' };
    const isHatOpen = h => {
      if (!h) return true;
      if (h === 'bow') return stars >= WARDROBE_UNLOCKS.bow || tracedCount >= 3;
      if (h === 'butterfly') return stars >= WARDROBE_UNLOCKS.butterfly || (save.caseMatches || 0) >= 1;
      return stars >= WARDROBE_UNLOCKS[h];
    };
    loadArt(['hat_bow', 'hat_wreath', 'hat_butterfly', 'hat_detective', 'hat_crown'], 1200);

    const render = () => {
      if (!uxAlive(s)) return;
      const oS = save.outfit.skye, oL = save.outfit.labrador;
      const dressBtns = (who, cx) => [0, 1, 2].map((d, k) => {
        const need = d === 0 ? 0 : (d === 1 ? WARDROBE_UNLOCKS.d1 : WARDROBE_UNLOCKS.d2);
        const open = stars >= need, active = save.outfit[who].dress === d;
        const cols = who === 'skye' ? ['#ff7cb8', '#5ecbff', '#a48bff'] : ['#2e4c85', '#34945e', '#c94b5b'];
        return `<g class="ux-btn" data-who="${who}" data-kind="dress" data-val="${d}" data-state="${open ? (active ? 'on' : 'open') : 'lock'}" role="button" tabindex="${open ? 0 : -1}" transform="translate(${cx + (k - 1) * 78} 314)">
          <g class="btn-vis" filter="url(#softShadow)">
            <circle r="31" fill="#fffaf0" stroke="${active ? '#ffd27a' : '#8cb67d'}" stroke-width="${active ? 5 : 2.5}"/>
            <circle r="20" fill="${cols[d]}" opacity="${open ? 1 : .28}"/>
          </g>
        </g>`;
      }).join('');
      const hatBtns = (who, cx) => hatRows.map((row, rIdx) => row.map((h, k) => {
        const open = isHatOpen(h), active = save.outfit[who].hat === h;
        const x = cx + (k - 1) * 78, y = 388 + rIdx * 74;
        const inner = h && SIZES['hat_' + h]
          ? `<image href="${SRC('hat_' + h)}" x="-22" y="-22" width="44" height="44" preserveAspectRatio="xMidYMid meet" opacity="${open ? 1 : .28}"/>`
          : `<text class="latin" y="8" text-anchor="middle" font-size="24" fill="#6b7f70">✕</text>`;
        const lockTag = h && !open ? `<text y="24" text-anchor="middle" font-size="11" fill="#5e7a67">${hatHint[h] || ''}</text>` : '';
        return `<g class="ux-btn" data-who="${who}" data-kind="hat" data-val="${h || ''}" data-state="${open ? (active ? 'on' : 'open') : 'lock'}" role="button" tabindex="${open ? 0 : -1}" transform="translate(${x} ${y})">
          <g class="btn-vis" filter="url(#softShadow)">
            <circle r="31" fill="#fffaf0" stroke="${active ? '#ffd27a' : '#8cb67d'}" stroke-width="${active ? 5 : 2.5}"/>${inner}${lockTag}
          </g>
        </g>`;
      }).join('')).join('');

      const root = uxPaint(`<g class="page">
        <image href="${SRC('bg_woods')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
        <rect width="960" height="520" fill="#112219" opacity=".6"/>
        <rect x="115" y="44" width="320" height="226" rx="28" fill="#fbe8f1" stroke="#ffd27a" stroke-width="4" filter="url(#softShadow)"/>
        <rect x="525" y="44" width="320" height="226" rx="28" fill="#e6efe4" stroke="#ffd27a" stroke-width="4" filter="url(#softShadow)"/>
        <g id="wdSkye" transform="translate(275 248) scale(1.38)"></g>
        <g id="wdLab" transform="translate(685 254) scale(1.24)"></g>
        ${dressBtns('skye', 275)}${hatBtns('skye', 275)}
        ${dressBtns('labrador', 685)}${hatBtns('labrador', 685)}
        ${uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 })}
      </g>`);

      if (typeof renderPupNode === 'function') {
        renderPupNode(root.querySelector('#wdSkye'), 'skye', 'cheer', oS);
        renderPupNode(root.querySelector('#wdLab'), 'labrador', 'cheer', oL);
      }

      const back = () => { saveWrite(); uxEnd(s, () => (fromMeet ? showMeet() : showTitle())); };
      s.onKey = back;
      uxBind(root, { back });
      root.querySelectorAll('[data-who]').forEach(btn => {
        if (btn.getAttribute('data-state') === 'lock') return;
        const pick = () => {
          const who = btn.getAttribute('data-who'), kind = btn.getAttribute('data-kind'), val = btn.getAttribute('data-val');
          if (kind === 'dress') save.outfit[who].dress = Number(val);
          else save.outfit[who].hat = val || null;
          saveWrite(); uxSfx('star'); uxLine('cheer_' + (1 + Math.floor(Math.random() * 2)));
          render();
        };
        btn.addEventListener('click', pick);
        btn.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
    };
    render();
  }

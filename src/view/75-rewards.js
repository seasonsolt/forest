  /* Rewards: Wordbook + Ear Listening Quiz (24 words across 2 pages), Sticker Treehouse Board, Meet & Pup Gear Locker (Wardrobe). */
  const WARDROBE_UNLOCKS = { d1: 2, d2: 5, wreath: 8, detective: 12, crown: 16 };

  function totalStarsCount() {
    let n = 0;
    for (const lv of LEVELS) {
      const r = save.rooms && save.rooms[lv.id];
      if (r && Array.isArray(r.stars)) n += r.stars.filter(Boolean).length;
    }
    return n;
  }

  /* ---------- Wordbook (24 core words in 2 clean pages of 12, cards >= 170x110 -> > 64 CSS px) ---------- */
  function showWords() {
    const core = WORDS.filter(w => w.kind === 'core');
    let pageIdx = 0;
    const s = uxScreen('words');
    const render = () => {
      if (!uxAlive(s)) return;
      const slice = core.slice(pageIdx * 12, pageIdx * 12 + 12);
      const cards = slice.map((w, i) => {
        const col = i % 4, row = (i / 4) | 0;
        const x = 94 + col * 198, y = 96 + row * 124;
        const learned = !!(save.words[w.id] && (save.words[w.id].heard > 0 || save.words[w.id].seen));
        return `<g class="ux-btn" data-word="${w.id}" role="button" tabindex="0" aria-label="${w.en}" transform="translate(${x} ${y})">
          <g class="btn-vis" filter="url(#softShadow)">
            <rect width="182" height="112" rx="18" fill="${learned ? '#fffaf0' : '#1b3124'}" stroke="${learned ? '#ffd27a' : '#4a6b56'}" stroke-width="3"/>
            <image href="${SRC(w.icon || 'word_' + w.id)}" x="14" y="10" width="76" height="76" preserveAspectRatio="xMidYMid meet" ${learned ? '' : 'filter="url(#silhouette)" opacity=".5"'}/>
            <text class="latin" x="132" y="64" text-anchor="middle" font-size="24" fill="${learned ? '#36260b' : '#73917e'}">${learned ? w.en : '???'}</text>
          </g>
        </g>`;
      }).join('');
      const pageDots = [0, 1].map(p => `<circle class="ux-btn" data-act="pg${p}" cx="${460 + p * 40}" cy="482" r="14" fill="${p === pageIdx ? '#ffd27a' : '#486b54'}" stroke="#fff7e6" stroke-width="2"/>`).join('');
      const root = uxPaint(`<g class="page">
        <image href="${SRC('bg_woods')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
        <rect width="960" height="520" fill="#112219" opacity=".68"/>
        ${uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 })}
        ${pageDots}
        ${uxButton({ act: 'pageNext', ui: 'next', icon: pageIdx === 0 ? 'next' : 'back', x: 902, y: 268, r: 34, plate: 'gold' })}
        ${cards}
      </g>`);
      const back = () => uxEnd(s, () => showTitle());
      s.onKey = back;
      uxBind(root, {
        back,
        pg0: () => { pageIdx = 0; render(); },
        pg1: () => { pageIdx = 1; render(); },
        pageNext: () => { pageIdx = 1 - pageIdx; render(); },
        word: card => { uxNudge(card); uxWordVoice(card.getAttribute('data-word')); },
      });
    };
    render();
  }

  /* ---------- Sticker Treehouse Board (earned stickers placed with pointer or keyboard, speaks word) ---------- */
  function showStickers() {
    const core = WORDS.filter(w => w.kind === 'core');
    const unlocked = new Set(save.stickers || []);
    for (const lv of LEVELS) {
      const r = save.rooms && save.rooms[lv.id];
      if (!r || !Array.isArray(r.stars)) continue;
      lv.words.forEach((wid, k) => { if (r.stars[k]) unlocked.add(wid); });
    }
    save.stickers = [...unlocked];
    const s = uxScreen('stickers');
    let selected = null;
    const render = () => {
      if (!uxAlive(s)) return;
      const tray = core.filter(w => unlocked.has(w.id)).slice(0, 12);
      const placed = (save.board || []).map((b, i) => {
        const tilt = ((i % 5) - 2) * 5;
        return `<g class="ux-btn" data-placed="${i}" transform="translate(${b.x} ${b.y}) rotate(${tilt})">
          <image href="${SRC('word_' + b.id)}" x="-42" y="-42" width="84" height="84" preserveAspectRatio="xMidYMid meet" filter="url(#softShadow)"/>
        </g>`;
      }).join('');
      const trayHtml = tray.map((w, i) => {
        const x = 110 + (i % 6) * 130, y = i < 6 ? 414 : 478;
        const on = selected === w.id;
        return `<g class="ux-btn" data-st="${w.id}" role="button" tabindex="0" transform="translate(${x} ${y})">
          <circle r="32" fill="${on ? '#ffd27a' : '#fffaf0'}" stroke="${on ? '#e67e22' : '#9ac090'}" stroke-width="3"/>
          <image href="${SRC('word_' + w.id)}" x="-24" y="-24" width="48" height="48" preserveAspectRatio="xMidYMid meet"/>
        </g>`;
      }).join('');
      const root = uxPaint(`<g class="page">
        <image href="${SRC('bg_meadow')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
        <rect width="960" height="520" fill="#112219" opacity=".45"/>
        <rect id="stkBoard" x="115" y="48" width="730" height="316" rx="28" fill="#fffaf0" opacity=".88" stroke="#d6a44e" stroke-width="5" filter="url(#softShadow)"/>
        ${placed}
        <rect x="64" y="378" width="832" height="132" rx="24" fill="#14291d" opacity=".85" stroke="#8cb67d" stroke-width="2"/>
        ${trayHtml}
        ${uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 })}
      </g>`);
      const back = () => { saveWrite(); uxEnd(s, () => showTitle()); };
      s.onKey = back;
      uxBind(root, { back });
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

  /* ---------- Pup Gear Locker / Wardrobe ---------- */
  function showWardrobe(fromMeet) {
    const s = uxScreen('wardrobe');
    const stars = totalStarsCount();
    const hats = ['wreath', 'detective', 'crown'];
    const render = () => {
      if (!uxAlive(s)) return;
      const oS = save.outfit.skye, oL = save.outfit.labrador;
      const dressBtns = (who, cx) => [0, 1, 2].map((d, k) => {
        const need = d === 0 ? 0 : (d === 1 ? WARDROBE_UNLOCKS.d1 : WARDROBE_UNLOCKS.d2);
        const open = stars >= need, active = save.outfit[who].dress === d;
        const cols = who === 'skye' ? ['#ff7cb8', '#5ecbff', '#a48bff'] : ['#2e4c85', '#34945e', '#c94b5b'];
        return `<g class="ux-btn" data-who="${who}" data-kind="dress" data-val="${d}" data-state="${open ? (active ? 'on' : 'open') : 'lock'}" role="button" tabindex="${open ? 0 : -1}" transform="translate(${cx + (k - 1) * 76} 376)">
          <g class="btn-vis" filter="url(#softShadow)">
            <circle r="32" fill="#fffaf0" stroke="${active ? '#ffd27a' : '#8cb67d'}" stroke-width="${active ? 5 : 2.5}"/>
            <circle r="21" fill="${cols[d]}" opacity="${open ? 1 : .28}"/>
          </g>
        </g>`;
      }).join('');
      const hatBtns = (who, cx) => [null, ...hats].map((h, k) => {
        const need = h ? WARDROBE_UNLOCKS[h] : 0, open = stars >= need, active = save.outfit[who].hat === h;
        const x = cx + (k - 1.5) * 68;
        const inner = h && SIZES['hat_' + h]
          ? `<image href="${SRC('hat_' + h)}" x="-22" y="-22" width="44" height="44" preserveAspectRatio="xMidYMid meet" opacity="${open ? 1 : .28}"/>`
          : `<text class="latin" y="8" text-anchor="middle" font-size="24" fill="#6b7f70">✕</text>`;
        return `<g class="ux-btn" data-who="${who}" data-kind="hat" data-val="${h || ''}" data-state="${open ? (active ? 'on' : 'open') : 'lock'}" role="button" tabindex="${open ? 0 : -1}" transform="translate(${x} 454)">
          <g class="btn-vis" filter="url(#softShadow)">
            <circle r="32" fill="#fffaf0" stroke="${active ? '#ffd27a' : '#8cb67d'}" stroke-width="${active ? 5 : 2.5}"/>${inner}
          </g>
        </g>`;
      }).join('');

      const root = uxPaint(`<g class="page">
        <image href="${SRC('bg_woods')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
        <rect width="960" height="520" fill="#112219" opacity=".6"/>
        <rect x="115" y="70" width="320" height="252" rx="28" fill="#fbe8f1" stroke="#ffd27a" stroke-width="4" filter="url(#softShadow)"/>
        <rect x="525" y="70" width="320" height="252" rx="28" fill="#e6efe4" stroke="#ffd27a" stroke-width="4" filter="url(#softShadow)"/>
        <g id="wdSkye" transform="translate(275 294) scale(1.45)"></g>
        <g id="wdLab" transform="translate(685 300) scale(1.32)"></g>
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

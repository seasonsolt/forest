  /* Title screen, Room selector map, in-game HUD (orb count, worn hat badge, 1/2 -> 2/2 screen dots), and Parent Settings modal. */
  const uxState = { modal: false };

  function syncHud() {
    const hud = $('hud');
    if (!hud) return;
    if (game.state !== 'play' || storyIsOpen()) { hud.textContent = ''; return; }
    const oS = (save.outfit && save.outfit.skye) || { hat: null };
    const oL = (save.outfit && save.outfit.labrador) || { hat: null };
    const hat = game.screen === 0 ? (oL.hat || oS.hat) : (oS.hat || oL.hat);
    const av = game.screen === 0 ? 'portrait_labrador' : 'portrait_skye';
    const hatHtml = hat && SIZES['hat_' + hat] ? `<image id="uxAvHat" href="${SRC('hat_' + hat)}" x="27" y="4" width="36" height="24" preserveAspectRatio="xMidYMid meet"/>` : '';
    const dots = [0, 1].map(k => `<circle cx="${38 + k * 14}" cy="84" r="${k === game.screen ? 5 : 3.5}" fill="${k === game.screen ? '#ffd27a' : '#80a875'}" stroke="#fff7e6" stroke-width="1.2"/>`).join('');
    const countText = game.screen === 0 ? `${game.orbs.got}/${game.orbs.total}` : `${Math.min(3, (game.workshop ? game.workshop.roundIdx : 0) + 1)}/3`;
    const counterIcon = game.screen === 0 ? 'prop_orb' : 'prop_stone';

    hud.innerHTML = `<g class="hud-bar">
      <g filter="url(#softShadow)">
        <circle cx="45" cy="45" r="30" fill="#173021" stroke="#ffd27a" stroke-width="3"/>
        <image href="${SRC(av)}" x="19" y="19" width="52" height="52" preserveAspectRatio="xMidYMid slice"/>
        ${hatHtml}
        <g id="uxScreenDots">${dots}</g>
        <rect x="86" y="25" width="98" height="40" rx="20" fill="#173021" opacity=".88" stroke="#8cb67d" stroke-width="2.2"/>
        <image href="${SRC(counterIcon)}" x="94" y="29" width="32" height="32" preserveAspectRatio="xMidYMid meet"/>
        <text class="latin" x="150" y="52" text-anchor="middle" font-size="22" fill="#fff5cf">${countText}</text>
      </g>
      ${uxButton({ act: 'replay', ui: 'replay', icon: 'replay', x: 706, y: 45, r: 32 })}
      ${uxButton({ act: 'home', ui: 'back', icon: 'home', x: 778, y: 45, r: 32 })}
      ${uxButton({ act: 'hint', ui: 'hint', icon: 'sticker', x: 850, y: 45, r: 32, plate: 'gold' })}
      ${uxButton({ act: 'fs', ui: 'fullscreen', icon: 'rooms', x: 918, y: 45, r: 32 })}
    </g>`;

    uxBind(hud, {
      replay: () => onHudReplay(),
      home: () => showTitle(),
      hint: () => triggerHint(),
      fs: () => toggleFullscreen(),
    });
  }

  function showTitle() {
    game.state = 'title';
    syncHud();
    const s = uxScreen('title');
    const playUi = unlockedRooms() > 1 ? 'continue' : 'play';
    const root = uxPaint(`<g class="page">
      <image href="${SRC('key')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
      <rect width="960" height="520" fill="url(#bottomFade)" opacity=".45" pointer-events="none"/>
      <g filter="url(#softShadow)">
        <rect x="235" y="18" width="490" height="64" rx="32" fill="#13261b" opacity=".82" stroke="#ffd27a" stroke-width="3"/>
        <text x="480" y="61" text-anchor="middle" font-size="36" fill="#fff7df" letter-spacing="2">天天和警长的森林探案</text>
      </g>
      ${uxButton({ act: 'play', ui: playUi, icon: 'play', x: 480, y: 274, r: 54, plate: 'gold', cls: 'ux-pulse' })}
      ${uxButton({ act: 'rooms', ui: 'rooms', icon: 'rooms', x: 356, y: 406, r: 38 })}
      ${uxButton({ act: 'words', ui: 'words', icon: 'book', x: 480, y: 406, r: 38 })}
      ${uxButton({ act: 'stickers', ui: 'stickers', icon: 'sticker', x: 604, y: 406, r: 38 })}
      ${uxButton({ act: 'meet', ui: 'meet', pic: 'ui_meet', x: 66, y: 452, r: 38, plate: 'gold' })}
      ${uxButton({ act: 'gear', ui: 'settings', icon: 'gear', x: 902, y: 458, r: 34 })}
    </g>`);

    const launch = () => { unlockAudio(); uxEnd(s, () => onStartJourney()); };
    s.onKey = launch;
    uxBind(root, {
      play: launch,
      rooms: () => { unlockAudio(); uxEnd(s, () => showRooms()); },
      words: () => { unlockAudio(); uxEnd(s, () => showWords()); },
      stickers: () => { unlockAudio(); uxEnd(s, () => showStickers()); },
      meet: () => { unlockAudio(); uxEnd(s, () => showMeet()); },
    });

    // Parent gate: hold gear for 1.6s (or click in DEV mode)
    const gear = root.querySelector('[data-act="gear"]');
    if (gear) {
      let timer = 0;
      const down = () => {
        unlockAudio();
        gear.classList.add('is-hold');
        clearTimeout(timer);
        timer = setTimeout(() => { gear.classList.remove('is-hold'); openParentModal(); }, DEV ? 250 : 1500);
      };
      const up = () => { clearTimeout(timer); gear.classList.remove('is-hold'); };
      gear.addEventListener('pointerdown', down);
      gear.addEventListener('pointerup', up);
      gear.addEventListener('pointerleave', up);
      gear.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' && DEV) openParentModal(); });
    }
  }

  function showRooms() {
    const s = uxScreen('rooms');
    const unlocked = unlockedRooms();
    const cards = LEVELS.map((lv, i) => {
      const col = i % 4, row = (i / 4) | 0;
      const x = 68 + col * 212, y = 92 + row * 182;
      const open = i < unlocked;
      const rSave = save.rooms && save.rooms[lv.id];
      const stars = (rSave && rSave.stars) || [false, false, false];
      const starRow = stars.map((g, k) => `<path d="${UX_STAR_D}" transform="translate(${62 + k * 34} 138) scale(14)" fill="${g ? '#ffd27a' : '#264431'}" stroke="#fff5cf" stroke-width=".08"/>`).join('');
      return `<g class="ux-btn" data-act="${open ? 'pick' : ''}" data-room="${i}" data-ui="${open ? 'room_' + lv.id : ''}" data-state="${open ? 'open' : 'lock'}" role="button" tabindex="${open ? 0 : -1}" transform="translate(${x} ${y})">
        <g class="btn-vis" filter="url(#softShadow)">
          <rect width="192" height="158" rx="22" fill="${open ? '#fffaf0' : '#1b3124'}" stroke="${open ? '#ffd27a' : '#4a6b56'}" stroke-width="3.5"/>
          <image href="${SRC(lv.bg)}" x="10" y="10" width="172" height="104" preserveAspectRatio="xMidYMid slice" opacity="${open ? 1 : .28}"/>
          <text class="latin" x="26" y="146" text-anchor="middle" font-size="22" fill="${open ? '#2b4a36' : '#73917e'}">${i + 1}</text>
          ${starRow}
        </g>
      </g>`;
    }).join('');
    const root = uxPaint(`<g class="page">
      <image href="${SRC('bg_woods')}" width="960" height="520" preserveAspectRatio="xMidYMid slice"/>
      <rect width="960" height="520" fill="#112219" opacity=".62"/>
      ${uxButton({ act: 'back', ui: 'back', icon: 'back', x: 56, y: 48, r: 34 })}
      ${cards}
    </g>`);
    const back = () => uxEnd(s, () => showTitle());
    s.onKey = back;
    uxBind(root, { back });
    root.querySelectorAll('[data-room]').forEach(card => {
      const idx = Number(card.getAttribute('data-room'));
      if (idx >= unlocked) return;
      const go = () => uxEnd(s, () => openRoom(idx));
      card.addEventListener('click', go);
      card.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  function openParentModal() {
    const modal = $('modal');
    if (!modal || uxState.modal) return;
    uxState.modal = true;
    const core = WORDS.filter(w => w.kind === 'core');
    const heard = core.filter(w => (save.words[w.id] && save.words[w.id].heard > 0)).length;
    const quizOk = core.reduce((n, w) => n + ((save.words[w.id] && save.words[w.id].quiz) || 0), 0);
    const quizWrong = core.reduce((n, w) => n + ((save.words[w.id] && save.words[w.id].wrong) || 0), 0);
    const acc = quizOk + quizWrong > 0 ? Math.round((quizOk * 100) / (quizOk + quizWrong)) + '%' : '100%';
    const mins = Math.max(1, Math.round((save.totalPlaySeconds || 0) / 60));

    modal.innerHTML = `<rect width="960" height="520" fill="#0d1b13" opacity=".78"/>
      <g transform="translate(220 75)" filter="url(#softShadow)">
        <rect width="520" height="370" rx="28" fill="#fffaf0" stroke="#ffd27a" stroke-width="4"/>
        <text x="260" y="48" text-anchor="middle" font-size="28" fill="#1c3526">家长设置与学习统计</text>
        <text x="48" y="96" font-size="20" fill="#2d4c39">已听掌握核心词：${heard} / ${core.length} · 测试首答率：${acc} · 累计探索：${mins} 分钟</text>
        <g class="ux-btn" data-m="subs" transform="translate(48 130)"><rect width="424" height="52" rx="14" fill="#edf5ea" stroke="#9ac090" stroke-width="2"/><text x="24" y="33" font-size="20" fill="#1c3526">中英字幕显示：${setting('subtitles') ? '开启' : '关闭'}</text></g>
        <g class="ux-btn" data-m="eng" transform="translate(48 196)"><rect width="424" height="52" rx="14" fill="#edf5ea" stroke="#9ac090" stroke-width="2"/><text x="24" y="33" font-size="20" fill="#1c3526">英文教学模式：${setting('english') === 'words+phrases' ? '核心词 + 短句' : '仅核心词'}</text></g>
        <g class="ux-btn" data-m="snd" transform="translate(48 262)"><rect width="202" height="52" rx="14" fill="#edf5ea" stroke="#9ac090" stroke-width="2"/><text x="24" y="33" font-size="20" fill="#1c3526">声音：${setting('sound') ? '开启' : '静音'}</text></g>
        <g class="ux-btn" data-m="close" transform="translate(270 262)"><rect width="202" height="52" rx="14" fill="url(#goldGrad)" stroke="#d6a44e" stroke-width="2"/><text x="101" y="33" text-anchor="middle" font-size="22" fill="#4a2605">关闭返回</text></g>
      </g>`;

    const close = () => { uxState.modal = false; modal.textContent = ''; };
    modal.querySelectorAll('[data-m]').forEach(elBtn => {
      elBtn.addEventListener('click', () => {
        const m = elBtn.getAttribute('data-m');
        if (m === 'subs') { setSetting('subtitles', !setting('subtitles')); uxState.modal = false; openParentModal(); }
        else if (m === 'eng') { setSetting('english', setting('english') === 'words+phrases' ? 'words' : 'words+phrases'); uxState.modal = false; openParentModal(); }
        else if (m === 'snd') { setSetting('sound', !setting('sound')); uxState.modal = false; openParentModal(); }
        else close();
      });
    });
  }

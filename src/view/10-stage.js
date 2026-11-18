  /* Woodland stage rendering: backdrop parallax, ambient wildlife, Scene A clue hotspots, and Scene B Phonics Sound Workshop. */
  let sceneDrawn = { idx: -1, screen: -1, round: -1, step: '', workshopReady: false };

  function drawStageStatic(lv) {
    $('bg').setAttribute('href', SRC(lv.bg));
    const glows = $('glows');
    glows.textContent = '';
    (lv.glows || []).forEach(([x, y, r, fill], i) => {
      el('circle', { class: 'flicker', cx: x, cy: y, r, fill: `url(#${fill})`, style: `animation-delay:-${i * .8}s` }, glows);
    });
    drawAmbient(lv.ambient);
  }

  function drawAmbient(kind) {
    const box = $('ambient');
    box.textContent = '';
    if (kind === 'butterflies') {
      for (let i = 0; i < 4; i++) {
        const g = el('g', { class: 'bobSlow', 'data-bf': i, style: `animation-delay:-${i * .7}s` }, box);
        el('ellipse', { cx: -5, cy: 0, rx: 6, ry: 4, fill: i % 2 ? '#ffe599' : '#ffc2d9', opacity: '.85' }, g);
        el('ellipse', { cx: 5, cy: 0, rx: 6, ry: 4, fill: i % 2 ? '#ffe599' : '#ffc2d9', opacity: '.85' }, g);
      }
    } else if (kind === 'fireflies') {
      for (let i = 0; i < 8; i++) {
        el('circle', {
          class: 'flicker', cx: 100 + ((i * 109) % 760), cy: 110 + ((i * 73) % 240), r: 3.5 + (i % 2) * 1.5,
          fill: '#ffe680', style: `animation-delay:-${i * .5}s`,
        }, box);
      }
    } else if (kind === 'ripples') {
      for (let i = 0; i < 4; i++) {
        el('ellipse', {
          class: 'flicker', cx: 210 + i * 175, cy: 360 + (i % 2) * 32, rx: 34, ry: 8,
          fill: 'none', stroke: '#e8fbff', 'stroke-width': 1.8, opacity: '.5', style: `animation-delay:-${i * .9}s`,
        }, box);
      }
    } else {
      for (let i = 0; i < 5; i++) {
        el('ellipse', {
          class: 'bobSlow', cx: 120 + i * 175, cy: 120 + (i % 3) * 55, rx: 6, ry: 3.2,
          fill: i % 2 ? '#f4b459' : '#9ed468', opacity: '.72', transform: `rotate(${25 - i * 12} ${120 + i * 175} ${120 + (i % 3) * 55})`,
          style: `animation-delay:-${i * .6}s`,
        }, box);
      }
    }
  }

  function updateAmbientMotion(now, panX) {
    const bg = $('bg');
    if (bg) bg.setAttribute('x', (-10 + panX * 6).toFixed(1));
    $('glows').setAttribute('transform', `translate(${(panX * 9).toFixed(1)} 0)`);
    $('ambient').querySelectorAll('[data-bf]').forEach((b, i) => {
      const bx = 220 + i * 175 + Math.sin(now * .9 + i * 1.6) * 45;
      const by = 180 + (i % 2) * 65 + Math.cos(now * 1.3 + i * 2.1) * 22;
      b.setAttribute('transform', `translate(${bx.toFixed(1)} ${by.toFixed(1)})`);
    });
  }

  function drawSceneA(g) {
    $('workshop').textContent = '';
    const box = $('hotspots');
    box.textContent = '';
    for (const h of g.hotspots) {
      const grp = el('g', {
        class: 'hotspot', 'data-hot': h.id, role: 'button', tabindex: '0',
        'aria-label': h.kind === 'word' && h.word ? h.word : (h.kind === 'memory' ? '明信片' : '金星果'),
        transform: `translate(${h.x} ${h.y})`,
      }, box);
      // Generous invisible hit circle >= 92 stage units (~90 CSS px at 1024x768)
      el('circle', { r: Math.max(h.r, 46), fill: 'transparent' }, grp);
      el('ellipse', { cx: 0, cy: 36, rx: 38, ry: 9, fill: '#0b1811', opacity: '.28' }, grp);
      if (!h.opened) {
        const ringCol = h.kind === 'memory' ? '#ff9ec4' : '#ffe48f';
        el('circle', { class: 'flicker', r: h.r - 4, fill: 'none', stroke: ringCol, 'stroke-width': 2.6, opacity: '.55' }, grp);
      }
      const [pw, ph] = SIZES[h.prop] || [140, 140];
      const scale = 86 / Math.max(pw, ph);
      const dw = pw * scale, dh = ph * scale;
      img(h.prop, -dw / 2, -dh / 2 - 4, dw, dh, grp, { opacity: h.opened ? '.52' : '1' });

      if (h.opened) {
        const reward = h.kind === 'word' ? 'prop_orb' : h.kind === 'memory' ? 'prop_postcard' : 'fx_star';
        img(reward, -18, -54, 36, 36, grp);
      } else {
        el('circle', { cx: 0, cy: -36, r: 5, fill: '#fff5ba', opacity: '.85', class: 'flicker' }, grp);
      }
      grp.addEventListener('click', () => onHotspotClick(h.id));
      grp.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHotspotClick(h.id); } });
    }

    if (g.workshopReady) {
      const wb = el('g', { class: 'ux-btn ux-pulse', 'data-act': 'enter-workshop', role: 'button', tabindex: '0', 'aria-label': '进入拼读工坊', transform: 'translate(840 430)' }, box);
      el('circle', { r: 62, fill: 'url(#warm)' }, wb);
      const vis = el('g', { class: 'btn-vis' }, wb);
      el('circle', { r: 44, fill: 'url(#goldGrad)', stroke: '#fff7de', 'stroke-width': 4, filter: 'url(#softShadow)' }, vis);
      img('prop_bench', -30, -28, 60, 56, vis);
      wb.addEventListener('click', () => onEnterWorkshop());
      wb.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEnterWorkshop(); } });
    }
  }

  function drawSceneB(g) {
    $('hotspots').textContent = '';
    const box = $('workshop');
    box.textContent = '';
    const w = g.workshop, round = g.currentRound();
    if (!w || !round) return;

    // Workbench surface
    const [bw, bh] = SIZES.prop_bench || [220, 150];
    const bScale = 360 / bw;
    img('prop_bench', 480 - (bw * bScale) / 2, 250, bw * bScale, bh * bScale, box);

    // Rescued animal / target illustration centerpiece neatly below the Phonics Plaque
    const animalOuter = el('g', { transform: 'translate(480 202)' }, box);
    const animalG = el('g', { id: 'wsAnimal' }, animalOuter);
    el('circle', { r: 78, fill: 'url(#sun)', class: 'flicker' }, animalG);
    el('ellipse', { cx: 0, cy: 56, rx: 52, ry: 11, fill: '#0b1811', opacity: '.28' }, animalG);
    const wIcon = 'word_' + round.word;
    const [ww, wh] = SIZES[wIcon] || [200, 200];
    const ws = 118 / Math.max(ww, wh);
    img(wIcon, -(ww * ws) / 2, -(wh * ws) / 2 - 2, ww * ws, wh * ws, animalG);

    // Sound-Bridge Phonics Plaque: [ _ ] + [ rime ] or [ _ ] + [ _ ]
    const plaque = el('g', { transform: 'translate(480 84)', filter: 'url(#softShadow)' }, box);
    el('rect', { x: -165, y: -34, width: 330, height: 68, rx: 22, fill: '#fff8e7', stroke: '#d6a44e', 'stroke-width': 4 }, plaque);

    const drawSlot = (cx, text, filled, active) => {
      el('rect', {
        x: cx - 64, y: -24, width: 128, height: 48, rx: 15,
        fill: filled ? '#ffd97d' : (active ? '#fff0c4' : '#e6edd8'),
        stroke: active ? '#e67e22' : '#9db58d', 'stroke-width': active ? 3.5 : 2,
      }, plaque);
      const t = el('text', {
        class: 'latin', x: cx, y: 10, 'text-anchor': 'middle', 'font-size': 32,
        fill: filled ? '#5a2e08' : '#73856b',
      }, plaque);
      t.textContent = text || '?';
    };
    drawSlot(-74, w.pickedOnset || (w.step === 'onset' ? '?' : round.onset), !!w.pickedOnset, w.step === 'onset');
    const plus = el('text', { class: 'latin', x: 0, y: 9, 'text-anchor': 'middle', 'font-size': 28, fill: '#8e6b3e' }, plaque);
    plus.textContent = '+';
    const rimeText = w.mode === 'onset' ? round.rime : (w.pickedRime || '?');
    drawSlot(74, rimeText, w.mode === 'onset' || !!w.pickedRime, w.step === 'rime');

    // Progress dots across the 3 words in the round
    for (let i = 0; i < w.rounds.length; i++) {
      el('circle', {
        cx: 452 + i * 28, cy: 28, r: w.solved[i] ? 8 : (i === w.roundIdx ? 9 : 6),
        fill: w.solved[i] ? '#ffd27a' : (i === w.roundIdx ? '#fff8d6' : '#587863'),
        stroke: '#fff7e6', 'stroke-width': 2,
      }, box);
    }

    // 3 large wooden Phonics Sound Stones along bottom row (>= 100px hit area)
    const choices = g.currentChoices();
    const xs = [265, 480, 695];
    choices.forEach((chunk, idx) => {
      const cx = xs[idx], cy = 428;
      const expected = w.step === 'rime' ? round.rime : round.onset;
      const glowAssist = w.assistGlow && chunk === expected;
      const btn = el('g', {
        class: 'stone-btn' + (glowAssist ? ' ux-pulse' : ''), 'data-stone': chunk,
        role: 'button', tabindex: '0', 'aria-label': chunk, transform: `translate(${cx} ${cy})`,
      }, box);
      el('rect', { x: -72, y: -56, width: 144, height: 112, rx: 28, fill: 'transparent' }, btn);
      if (glowAssist) {
        el('rect', { class: 'flicker', x: -70, y: -52, width: 140, height: 104, rx: 26, fill: 'none', stroke: '#ffd27a', 'stroke-width': 5 }, btn);
      }
      const vis = el('g', { class: 'stone-vis', filter: 'url(#softShadow)' }, btn);
      img('prop_stone', -68, -48, 136, 96, vis);
      const lbl = el('text', {
        class: 'latin', x: 0, y: 12, 'text-anchor': 'middle', 'font-size': 42, fill: '#4e2706',
        stroke: '#fff6de', 'stroke-width': 3, 'paint-order': 'stroke',
      }, vis);
      lbl.textContent = chunk;

      btn.addEventListener('pointerenter', () => onStoneHover(chunk));
      btn.addEventListener('focus', () => onStoneHover(chunk));
      btn.addEventListener('click', () => onStoneClick(chunk, btn));
      btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStoneClick(chunk, btn); } });
    });
  }

  function renderStage(g, force) {
    const lv = g.level();
    const w = g.workshop;
    const needStatic = force || sceneDrawn.idx !== g.index;
    const needScene = needStatic || sceneDrawn.screen !== g.screen || sceneDrawn.workshopReady !== g.workshopReady
      || (g.screen === 1 && w && (sceneDrawn.round !== w.roundIdx || sceneDrawn.step !== w.step || sceneDrawn.assist !== w.assistGlow || sceneDrawn.pickedOnset !== w.pickedOnset));
    if (needStatic) drawStageStatic(lv);
    if (needScene) {
      if (g.screen === 0) drawSceneA(g);
      else drawSceneB(g);
      sceneDrawn = {
        idx: g.index, screen: g.screen, round: w ? w.roundIdx : -1, step: w ? w.step : '',
        workshopReady: g.workshopReady, assist: !!(w && w.assistGlow), pickedOnset: w ? w.pickedOnset : '',
      };
      if (typeof syncHud === 'function') syncHud();
    }
  }

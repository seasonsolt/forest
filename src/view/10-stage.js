  /* Woodland stage rendering: backdrop parallax, ambient wildlife, Scene A letter hotspots, and Scene B 26-Letter Workshop. */
  let sceneDrawn = { idx: -1, screen: -1, opened: -1, round: -1, step: '', workshopReady: false, assist: false, pickedLetter: '' };

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
        'aria-label': h.kind === 'word' && h.word ? h.word.toUpperCase() : (h.kind === 'memory' ? '明信片' : '金星果'),
        transform: `translate(${h.x} ${h.y})`,
      }, box);
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
        if (h.kind === 'word' && h.word) {
          el('rect', { x: -19, y: -62, width: 38, height: 38, rx: 11, fill: '#ffe8f3', stroke: '#f58ab8', 'stroke-width': 3 }, grp);
          const lt = el('text', { class: 'latin', x: 0, y: -36, 'text-anchor': 'middle', 'font-size': 22, fill: '#b8326a' }, grp);
          lt.textContent = String(h.word).toUpperCase();
        } else {
          const reward = h.kind === 'memory' ? 'prop_postcard' : 'fx_star';
          img(reward, -18, -54, 36, 36, grp);
        }
      } else {
        el('circle', { cx: 0, cy: -36, r: 5, fill: '#fff5ba', opacity: '.85', class: 'flicker' }, grp);
      }
      grp.addEventListener('click', () => onHotspotClick(h.id));
      grp.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHotspotClick(h.id); } });
    }

    if (g.workshopReady) {
      const wb = el('g', { class: 'ux-btn ux-pulse', 'data-act': 'enter-workshop', role: 'button', tabindex: '0', 'aria-label': '进入字母工坊', transform: 'translate(840 430)' }, box);
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
    img('prop_bench', 480 - (bw * bScale) / 2, 264, bw * bScale, bh * bScale, box);

    // Mystery Crystal Star + subtle mascot silhouette before reveal ("点触字母变萌物")
    const animalOuter = el('g', { transform: 'translate(480 212)' }, box);
    const animalG = el('g', { id: 'wsAnimal' }, animalOuter);
    el('circle', { r: 84, fill: 'url(#sun)', class: 'flicker' }, animalG);
    el('ellipse', { cx: 0, cy: 60, rx: 56, ry: 12, fill: '#0b1811', opacity: '.28' }, animalG);
    const wIcon = 'word_' + round.word;
    const [ww, wh] = SIZES[wIcon] || [200, 200];
    const ws = 132 / Math.max(ww, wh);
    img(wIcon, -(ww * ws) / 2, -(wh * ws) / 2 - 2, ww * ws, wh * ws, animalG, { filter: 'url(#silhouette)', opacity: '.26' });
    const [gw, gh] = SIZES.prop_letter_gem || [180, 178];
    const gs = 112 / Math.max(gw, gh);
    img('prop_letter_gem', -(gw * gs) / 2, -(gh * gs) / 2 - 4, gw * gs, gh * gs, animalG, { class: 'ux-anim-pulse' });

    // Top Interactive Audio Listening Plaque (clickable to replay the spoken prompt)
    const wObj = WORDS.find(x => x.id === round.word);
    const plaque = el('g', {
      class: 'ux-btn', 'data-act': 'replay-prompt', role: 'button', tabindex: '0',
      'aria-label': '再听一遍字母', transform: 'translate(480 86)',
    }, box);
    const pVis = el('g', { class: 'btn-vis', filter: 'url(#softShadow)' }, plaque);
    el('rect', { id: 'wsPlaqueBg', x: -168, y: -34, width: 336, height: 68, rx: 24, fill: w.pickedLetter ? '#fff0c8' : '#fffaf0', stroke: w.pickedLetter ? '#f287b7' : '#f0b857', 'stroke-width': 4 }, pVis);
    // Warm speaker emblem on left side
    el('circle', { cx: -118, cy: 0, r: 21, fill: '#ffd984', stroke: '#e89d2f', 'stroke-width': 2 }, pVis);
    el('path', { d: 'M-126 -5H-120L-113 -11V11L-120 5H-126Z', fill: '#5a2e08' }, pVis);
    el('path', { d: 'M-109 -6A9 9 0 0 1 -109 6M-104 -10A15 15 0 0 1 -104 10', fill: 'none', stroke: '#5a2e08', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, pVis);
    const pTxt = el('text', {
      id: 'wsPlaqueTxt', class: 'latin', x: 24, y: 11, 'text-anchor': 'middle', 'font-size': w.pickedLetter ? 28 : 34,
      fill: w.pickedLetter ? '#b8326a' : '#7a5418',
    }, pVis);
    pTxt.textContent = w.pickedLetter ? `${round.letter}${round.lower} · ${wObj ? wObj.wordEn : round.word}` : '?';
    plaque.addEventListener('click', () => onWorkshopPromptReplay());
    plaque.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onWorkshopPromptReplay(); } });

    // Dynamic centered progress dots across 3 or 4 rounds
    const dotX0 = 480 - ((w.rounds.length - 1) * 28) / 2;
    for (let i = 0; i < w.rounds.length; i++) {
      el('circle', {
        cx: dotX0 + i * 28, cy: 28, r: w.solved[i] ? 8 : (i === w.roundIdx ? 9 : 6),
        fill: w.solved[i] ? '#ffd27a' : (i === w.roundIdx ? '#fff8d6' : '#587863'),
        stroke: '#fff7e6', 'stroke-width': 2,
      }, box);
    }

    // 3 giant candy-pastel Letter Blocks along bottom row (>= 114 stage units)
    const palette = [
      ['#ffe5f1', '#f287b7'],
      ['#e4f4ff', '#6dbbe8'],
      ['#fff3cc', '#efb646'],
    ];
    const choices = g.currentChoices();
    const xs = [250, 480, 710];
    choices.forEach((cid, idx) => {
      const cx = xs[idx], cy = 428;
      const glowAssist = w.assistGlow && cid === round.word;
      const [bgCol, rimCol] = palette[idx % palette.length];
      const btn = el('g', {
        class: 'stone-btn' + (glowAssist ? ' ux-pulse' : ''), 'data-stone': cid,
        role: 'button', tabindex: '0', 'aria-label': String(cid).toUpperCase(), transform: `translate(${cx} ${cy})`,
      }, box);
      el('rect', { x: -80, y: -57, width: 160, height: 114, rx: 28, fill: 'transparent' }, btn);
      if (glowAssist) {
        el('rect', { class: 'flicker', x: -80, y: -57, width: 160, height: 114, rx: 28, fill: 'none', stroke: '#ffd27a', 'stroke-width': 5 }, btn);
      }
      const vis = el('g', { class: 'stone-vis', filter: 'url(#softShadow)' }, btn);
      el('rect', { x: -74, y: -50, width: 148, height: 100, rx: 24, fill: bgCol, stroke: rimCol, 'stroke-width': 4.5 }, vis);
      el('rect', { x: -66, y: -42, width: 132, height: 84, rx: 18, fill: '#ffffff', opacity: '.55' }, vis);
      const up = el('text', { class: 'latin', x: -16, y: 17, 'text-anchor': 'middle', 'font-size': 50, fill: '#4e1f3a' }, vis);
      up.textContent = String(cid).toUpperCase();
      const lo = el('text', { class: 'latin', x: 24, y: 17, 'text-anchor': 'middle', 'font-size': 36, fill: '#8a4a6e' }, vis);
      lo.textContent = String(cid).toLowerCase();

      btn.addEventListener('pointerenter', () => onStoneHover(cid));
      btn.addEventListener('focus', () => onStoneHover(cid));
      btn.addEventListener('click', () => onStoneClick(cid, btn));
      btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStoneClick(cid, btn); } });
    });
  }

  function revealWorkshopMascot(wordId) {
    const animalG = $('wsAnimal');
    if (animalG) {
      animalG.textContent = '';
      el('circle', { r: 96, fill: 'url(#warm)', class: 'flicker' }, animalG);
      el('ellipse', { cx: 0, cy: 62, rx: 58, ry: 12, fill: '#0b1811', opacity: '.28' }, animalG);
      const wIcon = 'word_' + wordId;
      const [ww, wh] = SIZES[wIcon] || [200, 200];
      const ws = 154 / Math.max(ww, wh);
      const popG = el('g', { class: 'ux-pop on' }, animalG);
      img(wIcon, -(ww * ws) / 2, -(wh * ws) / 2 - 4, ww * ws, wh * ws, popG, { class: 'ux-anim-pulse' });
    }
    const wObj = WORDS.find(x => x.id === wordId);
    const bg = $('wsPlaqueBg'), txt = $('wsPlaqueTxt');
    if (bg) { bg.setAttribute('fill', '#fff0c8'); bg.setAttribute('stroke', '#f287b7'); }
    if (txt && wObj) {
      txt.setAttribute('fill', '#b8326a');
      txt.setAttribute('font-size', '28');
      txt.textContent = `${wObj.letter}${wObj.lower} · ${wObj.wordEn}`;
    }
  }

  function renderStage(g, force) {
    const lv = g.level();
    const w = g.workshop;
    const opened = g.hotspots.filter(h => h.opened).length;
    const needStatic = force || sceneDrawn.idx !== g.index;
    const needScene = needStatic || sceneDrawn.screen !== g.screen || sceneDrawn.opened !== opened || sceneDrawn.workshopReady !== g.workshopReady
      || (g.screen === 1 && w && (sceneDrawn.round !== w.roundIdx || sceneDrawn.step !== w.step || sceneDrawn.assist !== w.assistGlow || sceneDrawn.pickedLetter !== w.pickedLetter));
    if (needStatic) drawStageStatic(lv);
    if (needScene) {
      if (g.screen === 0) drawSceneA(g);
      else drawSceneB(g);
      sceneDrawn = {
        idx: g.index, screen: g.screen, opened, round: w ? w.roundIdx : -1, step: w ? w.step : '',
        workshopReady: g.workshopReady, assist: !!(w && w.assistGlow), pickedLetter: w ? w.pickedLetter : '',
      };
      if (typeof syncHud === 'function') syncHud();
    }
  }

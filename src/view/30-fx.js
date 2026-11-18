  /* Particle bursts, confetti, flying orb arcs, and 12s idle magnifying-glass sparkle guide. */
  const fxList = [];

  function uxConfetti(parent, x, y, count) {
    const host = parent || $('fx');
    const cols = ['#ffd27a', '#ff8cb8', '#9be88d', '#8cd6ff', '#ffffff'];
    for (let i = 0; i < (count || 16); i++) {
      const a = (Math.PI * 2 * i) / (count || 16) + Math.random() * .4;
      const sp = 55 + Math.random() * 95;
      const node = el('circle', { cx: x, cy: y, r: 3.2 + Math.random() * 2.5, fill: cols[i % cols.length] }, host);
      fxList.push({ node, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 45, g: 210, t: 0, dur: .75 + Math.random() * .35, kind: 'pop' });
    }
  }

  function spawnOrbArc(fromX, fromY, toX, toY) {
    const box = $('fx');
    const node = img('prop_orb', -20, -20, 40, 40, box);
    fxList.push({ node, x: fromX, y: fromY, sx: fromX, sy: fromY, tx: toX, ty: toY, t: 0, dur: .65, kind: 'arc' });
  }

  function renderIdleGuide(g, now) {
    let guide = $('guideRing');
    if (!g.hintTarget || g.state !== 'play') {
      if (guide) guide.remove();
      return;
    }
    if (!guide) guide = el('g', { id: 'guideRing', 'pointer-events': 'none' }, $('fx'));
    let gx = 480, gy = 300;
    if (g.hintTarget.screen === 0) {
      if (g.hintTarget.kind === 'workshop') { gx = 840; gy = 430; }
      else {
        const h = g.hotspots.find(x => x.id === g.hintTarget.id);
        if (h) { gx = h.x; gy = h.y; }
      }
    } else if (g.hintTarget.screen === 1) {
      const choices = g.currentChoices();
      const idx = choices.indexOf(g.hintTarget.val);
      gx = [265, 480, 695][idx >= 0 ? idx : 1];
      gy = 428;
    }
    const r = 52 + Math.sin(now * 5) * 6;
    guide.innerHTML = `<circle cx="${gx}" cy="${gy}" r="${r.toFixed(1)}" fill="none" stroke="#ffd27a" stroke-width="5" stroke-dasharray="10 6" opacity=".92"/>
      <circle cx="${gx}" cy="${gy}" r="${(r - 12).toFixed(1)}" fill="#ffe89c" opacity=".16"/>`;
  }

  function fxTick(dt, now, g) {
    for (let i = fxList.length - 1; i >= 0; i--) {
      const f = fxList[i];
      f.t += dt;
      const p = Math.min(1, f.t / f.dur);
      if (f.kind === 'arc') {
        const u = 1 - Math.pow(1 - p, 2);
        const cx = f.sx + (f.tx - f.sx) * u;
        const cy = f.sy + (f.ty - f.sy) * u - Math.sin(u * Math.PI) * 90;
        const sc = 1 - u * .45;
        f.node.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${sc.toFixed(2)})`);
        f.node.setAttribute('opacity', String(1 - u * .2));
      } else {
        f.vy += f.g * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.node.setAttribute('cx', f.x.toFixed(1));
        f.node.setAttribute('cy', f.y.toFixed(1));
        f.node.setAttribute('opacity', (1 - p).toFixed(2));
      }
      if (f.t >= f.dur) {
        f.node.remove();
        fxList.splice(i, 1);
      }
    }
    if (g) renderIdleGuide(g, now);
  }

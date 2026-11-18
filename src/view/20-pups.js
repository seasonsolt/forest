  /* Hero pup rendering (Skye hovering + Sheriff Labrador standing/searching), grounded shadows, outfit & hat overlays, and pointer-tap cheers. */
  const pupState = { built: false, skyePose: '', labPose: '', skyeDress: -1, labDress: -1, skyeHat: null, labHat: null, panX: 0 };

  function placeHat(parent, who, pose, hat) {
    if (!hat) return;
    const hName = 'hat_' + hat;
    if (!SIZES[hName]) return;
    const [hw, hh] = SIZES[hName];
    const scale = who === 'skye' ? .42 : .45;
    const w = hw * scale, h = hh * scale;
    const dx = who === 'skye'
      ? (pose === 'fly' ? 14 : (pose === 'idle' ? 10 : 2))
      : (pose === 'cheer' ? 12 : (pose === 'search' ? 38 : 34));
    const dy = who === 'skye'
      ? (pose === 'cheer' ? -114 : -106)
      : (pose === 'cheer' ? -130 : (pose === 'search' ? -98 : -118));
    img(hName, dx - w / 2, dy - h / 2, w, h, parent);
  }

  function buildActors() {
    const box = $('actors');
    const sh = $('shadows');
    box.textContent = '';
    sh.textContent = '';
    el('ellipse', { id: 'shLab', cx: 120, cy: 430, rx: 46, ry: 11, fill: '#0b1811', opacity: '.32' }, sh);
    el('ellipse', { id: 'shSkye', cx: 165, cy: 410, rx: 32, ry: 8, fill: '#0b1811', opacity: '.22' }, sh);

    const labG = el('g', { id: 'actLab', class: 'hotspot', role: 'button', tabindex: '0', 'aria-label': '拉布拉多警长' }, box);
    const skyeG = el('g', { id: 'actSkye', class: 'hotspot', role: 'button', tabindex: '0', 'aria-label': '天天' }, box);
    labG.addEventListener('click', () => onPupTap('labrador'));
    skyeG.addEventListener('click', () => onPupTap('skye'));
    pupState.built = true;
    pupState.skyePose = '';
    pupState.labPose = '';
  }

  function dressReady(who, k) {
    return (k === 1 || k === 2) && !!SIZES[`${who}_idle`] && (who === 'skye' ? !!SIZES.skye_fly : !!SIZES.labrador_walk);
  }

  function spriteFile(who, pose, dress) {
    return (dress === 1 || dress === 2) && dressReady(who, dress) ? `${who}_${pose}_d${dress}` : `${who}_${pose}`;
  }

  function renderPupNode(node, who, pose, outfit) {
    node.textContent = '';
    const baseKey = `${who}_${pose}`;
    const [pw, ph] = SIZES[baseKey] || (who === 'skye' ? [190, 190] : [220, 240]);
    const scale = 0.52;
    const dw = pw * scale, dh = ph * scale;
    img(spriteFile(who, pose, outfit.dress), -dw / 2, -dh, dw, dh, node);
    placeHat(node, who, pose, outfit.hat);
  }

  function renderPups(g, now) {
    if (!pupState.built) buildActors();
    const oS = (save.outfit && save.outfit.skye) || { dress: 0, hat: null };
    const oL = (save.outfit && save.outfit.labrador) || { dress: 0, hat: null };
    const skyePose = g.skye.cheer > 0.05 ? 'cheer' : (g.screen === 0 ? 'fly' : 'idle');
    const labPose = g.labrador.cheer > 0.05 ? 'cheer' : (g.screen === 0 ? 'search' : 'idle');

    const skyeG = $('actSkye'), labG = $('actLab');
    if (pupState.skyePose !== skyePose || pupState.skyeDress !== oS.dress || pupState.skyeHat !== oS.hat) {
      renderPupNode(skyeG, 'skye', skyePose, oS);
      pupState.skyePose = skyePose; pupState.skyeDress = oS.dress; pupState.skyeHat = oS.hat;
    }
    if (pupState.labPose !== labPose || pupState.labDress !== oL.dress || pupState.labHat !== oL.hat) {
      renderPupNode(labG, 'labrador', labPose, oL);
      pupState.labPose = labPose; pupState.labDress = oL.dress; pupState.labHat = oL.hat;
    }

    const hoverBob = Math.sin(now * 3.1) * 5;
    const sqY = g.skye.cheer > 0 ? 1 + Math.sin(g.skye.cheer * 14) * 0.06 : 1;
    const sx = g.skye.x, sy = g.skye.y + hoverBob;
    skyeG.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)}) scale(${g.skye.facing} ${sqY.toFixed(3)})`);
    const lx = g.labrador.x, ly = g.labrador.y + 28;
    const lsq = g.labrador.cheer > 0 ? 1 + Math.sin(g.labrador.cheer * 12) * 0.05 : 1;
    labG.setAttribute('transform', `translate(${lx.toFixed(1)} ${ly.toFixed(1)}) scale(${g.labrador.facing} ${lsq.toFixed(3)})`);

    // Grounded shadows scale dynamically with hover height
    const shSkye = $('shSkye'), shLab = $('shLab');
    const groundY = 428;
    const dist = Math.max(0, groundY - sy);
    const sScale = Math.max(0.42, 1 - dist / 480);
    if (shSkye) {
      shSkye.setAttribute('cx', sx.toFixed(1));
      shSkye.setAttribute('cy', String(groundY));
      shSkye.setAttribute('rx', (36 * sScale).toFixed(1));
      shSkye.setAttribute('ry', (9 * sScale).toFixed(1));
    }
    if (shLab) {
      shLab.setAttribute('cx', lx.toFixed(1));
      shLab.setAttribute('cy', ly.toFixed(1));
    }
  }

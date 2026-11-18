  /* Which pictures load when, and whether the offline worker may run. Plain global script: no DOM access. */
  const ART_POSES = {
    skye: ['idle', 'fly', 'cheer'],
    labrador: ['idle', 'walk', 'search', 'cheer'],
  };
  /*TITLE_ART*/const ART_TITLE = [
    "key.webp", "bg_woods.webp", "ui_meet.webp",
    "fx_star.webp", "fx_heart.webp",
    "prop_stump.webp", "prop_bush.webp", "prop_mushroom.webp", "prop_lily.webp", "prop_rock.webp", "prop_nest.webp",
    "prop_orb.webp", "prop_postcard.webp", "prop_stone.webp", "prop_bench.webp",
    "skye_idle.webp", "skye_fly.webp", "skye_cheer.webp", "portrait_skye.webp",
    "labrador_idle.webp", "labrador_walk.webp", "labrador_search.webp", "labrador_cheer.webp", "portrait_labrador.webp"
  ];/*END_TITLE_ART*/

  function roomArt(level, lines, opts) {
    const o = opts || {}, L = (lines && lines.lines) || {}, out = [];
    const add = name => { if (name && !out.includes(name)) out.push(name); };
    const lineArt = key => { const d = L[key]; if (d && d.art) add(d.art); };
    add(level.bg);
    for (const h of level.sceneA || []) add(h.prop);
    ['prop_orb', 'prop_postcard', 'prop_stone', 'prop_bench', 'fx_star', 'fx_heart'].forEach(add);
    (level.words || []).concat(o.extraWords || []).forEach(w => add(`word_${w}`));
    lineArt(`ch_${level.id}`); lineArt(`clear_${level.id}`);
    if (level.memoryId) lineArt(`mem_${level.memoryId}`);
    if (o.last) { lineArt('win'); lineArt('end'); }
    return out.concat(outfitArt(o.wear)).filter((n, i, a) => a.indexOf(n) === i);
  }

  function outfitArt(wear) {
    const out = [];
    for (const who of ['skye', 'labrador']) {
      const w = wear && wear[who];
      if (!w) continue;
      if (w.dress === 1 || w.dress === 2) {
        for (const f of ART_POSES[who]) out.push(`${who}_${f}_d${w.dress}`);
      }
      if (typeof w.hat === 'string' && w.hat) out.push(`hat_${w.hat}`);
    }
    return out;
  }

  function assetPlan(levels, lines, opts) {
    const o = opts || {}, L = (lines && lines.lines) || {};
    const arts = keys => keys.map(k => L[k] && L[k].art).filter(Boolean).filter((n, i, a) => a.indexOf(n) === i);
    return {
      title: ART_TITLE.map(f => f.replace(/\.webp$/, '')).concat(outfitArt(o.wear)).filter((n, i, a) => a.indexOf(n) === i),
      prologue: arts(['p1', 'p2', 'p3']),
      ending: arts(['win', 'end']),
      rooms: levels.map((lv, i) => roomArt(lv, lines, { wear: o.wear, last: i === levels.length - 1 })),
    };
  }

  function offlineWorkerAllowed(search, protocol, hasApi) {
    return !!hasApi && /^https?:$/.test(String(protocol)) && !/[?&]dev=1\b/.test(String(search || ''));
  }

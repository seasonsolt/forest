  /* 26-Letter ABC Song melody table (C-major Twinkle) & toddler-friendly stroke paths + checkpoints for Starlight Tracing. Plain global script, no DOM access. */
  const ABC_SONG_NOTES = [
    { id: 'a', row: 0, midi: 60, beats: 1 },
    { id: 'b', row: 0, midi: 60, beats: 1 },
    { id: 'c', row: 0, midi: 67, beats: 1 },
    { id: 'd', row: 0, midi: 67, beats: 1 },
    { id: 'e', row: 0, midi: 69, beats: 1 },
    { id: 'f', row: 0, midi: 69, beats: 1 },
    { id: 'g', row: 0, midi: 67, beats: 2 },

    { id: 'h', row: 1, midi: 65, beats: 1 },
    { id: 'i', row: 1, midi: 65, beats: 1 },
    { id: 'j', row: 1, midi: 64, beats: 1 },
    { id: 'k', row: 1, midi: 64, beats: 1 },
    { id: 'l', row: 1, midi: 62, beats: 0.5 },
    { id: 'm', row: 1, midi: 62, beats: 0.5 },
    { id: 'n', row: 1, midi: 62, beats: 0.5 },
    { id: 'o', row: 1, midi: 62, beats: 0.5 },
    { id: 'p', row: 1, midi: 60, beats: 2 },

    { id: 'q', row: 2, midi: 67, beats: 1 },
    { id: 'r', row: 2, midi: 67, beats: 1 },
    { id: 's', row: 2, midi: 65, beats: 2 },
    { id: 't', row: 2, midi: 64, beats: 1 },
    { id: 'u', row: 2, midi: 64, beats: 1 },
    { id: 'v', row: 2, midi: 62, beats: 2 },

    { id: 'w', row: 3, midi: 67, beats: 1.5 },
    { id: 'x', row: 3, midi: 65, beats: 1.5 },
    { id: 'y', row: 3, midi: 64, beats: 1.5 },
    { id: 'z', row: 3, midi: 60, beats: 2.5 },
  ];

  /** @type {Record<string, number[][][]>} */
  const LETTER_STROKES = {
    a: [[[50, 12], [20, 88]], [[50, 12], [80, 88]], [[31, 60], [69, 60]]],
    b: [[[26, 12], [26, 88]], [[26, 12], [62, 12], [75, 21], [75, 38], [62, 48], [26, 48]], [[26, 48], [66, 48], [79, 59], [79, 77], [65, 88], [26, 88]]],
    c: [[[78, 24], [62, 12], [38, 14], [22, 30], [20, 50], [24, 72], [40, 86], [64, 88], [78, 76]]],
    d: [[[26, 12], [26, 88]], [[26, 12], [58, 12], [76, 26], [80, 50], [76, 74], [58, 88], [26, 88]]],
    e: [[[28, 12], [28, 88]], [[28, 12], [76, 12]], [[28, 50], [68, 50]], [[28, 88], [76, 88]]],
    f: [[[30, 12], [30, 88]], [[30, 12], [76, 12]], [[30, 50], [68, 50]]],
    g: [[[78, 24], [62, 12], [38, 14], [22, 30], [20, 50], [24, 72], [40, 86], [64, 88], [78, 74], [78, 54], [54, 54]]],
    h: [[[26, 12], [26, 88]], [[74, 12], [74, 88]], [[26, 50], [74, 50]]],
    i: [[[50, 12], [50, 88]], [[30, 12], [70, 12]], [[30, 88], [70, 88]]],
    j: [[[64, 12], [64, 66], [56, 83], [40, 88], [25, 80], [22, 68]], [[38, 12], [78, 12]]],
    k: [[[26, 12], [26, 88]], [[76, 12], [26, 52]], [[38, 43], [78, 88]]],
    l: [[[28, 12], [28, 88], [76, 88]]],
    m: [[[20, 12], [20, 88]], [[20, 12], [50, 62], [80, 12]], [[80, 12], [80, 88]]],
    n: [[[24, 12], [24, 88]], [[24, 12], [76, 88]], [[76, 12], [76, 88]]],
    o: [[[50, 12], [28, 19], [18, 40], [18, 60], [28, 81], [50, 88], [72, 81], [82, 60], [82, 40], [72, 19], [50, 12]]],
    p: [[[28, 12], [28, 88]], [[28, 12], [64, 12], [78, 22], [78, 42], [64, 52], [28, 52]]],
    q: [[[50, 12], [28, 19], [18, 40], [18, 60], [28, 81], [50, 88], [72, 81], [82, 60], [82, 40], [72, 19], [50, 12]], [[58, 68], [84, 90]]],
    r: [[[26, 12], [26, 88]], [[26, 12], [62, 12], [76, 22], [76, 42], [62, 52], [26, 52]], [[48, 52], [78, 88]]],
    s: [[[74, 22], [58, 12], [36, 14], [24, 26], [28, 42], [50, 50], [72, 58], [76, 74], [62, 87], [38, 88], [24, 78]]],
    t: [[[20, 12], [80, 12]], [[50, 12], [50, 88]]],
    u: [[[24, 12], [24, 62], [34, 82], [50, 88], [66, 82], [76, 62], [76, 12]]],
    v: [[[22, 12], [50, 88], [78, 12]]],
    w: [[[14, 12], [32, 88], [50, 36], [68, 88], [86, 12]]],
    x: [[[22, 12], [78, 88]], [[78, 12], [22, 88]]],
    y: [[[22, 12], [50, 48]], [[78, 12], [50, 48]], [[50, 48], [50, 88]]],
    z: [[[22, 12], [78, 12], [22, 88], [78, 88]]],
  };

  function traceSampleStroke(pts, step = 10) {
    if (!Array.isArray(pts) || !pts.length) return [];
    const out = [[pts[0][0], pts[0][1]]];
    const spacing = Math.max(1, step || 10);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const dist = Math.hypot(x1 - x0, y1 - y0);
      if (dist < 1e-6) continue;
      const n = Math.max(1, Math.ceil(dist / spacing));
      for (let k = 1; k <= n; k++) {
        const u = k / n;
        const px = x0 + (x1 - x0) * u;
        const py = y0 + (y1 - y0) * u;
        const prev = out[out.length - 1];
        if (k < n && Math.hypot(px - prev[0], py - prev[1]) < spacing * 0.45) continue;
        if (k === n && Math.hypot(x1 - prev[0], y1 - prev[1]) < 1e-6) continue;
        out.push([Number(px.toFixed(2)), Number(py.toFixed(2))]);
      }
    }
    const end = pts[pts.length - 1];
    const last = out[out.length - 1];
    if (Math.hypot(end[0] - last[0], end[1] - last[1]) > 0.5) out.push([end[0], end[1]]);
    return out;
  }

  function traceAdvance(checkpoints, progressIdx, x, y, radius) {
    if (!Array.isArray(checkpoints) || !checkpoints.length) return progressIdx || 0;
    const p = Math.max(0, Math.min(checkpoints.length, progressIdx | 0));
    if (p >= checkpoints.length) return checkpoints.length;
    const r = radius > 0 ? radius : 16;
    const lim = Math.min(checkpoints.length - 1, p + 3);
    for (let j = p; j <= lim; j++) {
      const [cx, cy] = checkpoints[j];
      if (Math.hypot(x - cx, y - cy) <= r) return j + 1;
    }
    return p;
  }

  function traceProjectStroke(pts, boxX, boxY, boxSize) {
    const s = boxSize / 100;
    return (pts || []).map(([nx, ny]) => [boxX + nx * s, boxY + ny * s]);
  }

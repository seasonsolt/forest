  /* Procedural WebAudio woodland score & tactile phonics Foley, plus music ducking and portrait suspension. */
  const AC = window.AudioContext || window.webkitAudioContext;
  let audio = null, muted = !setting('sound'), voiceOn = false, bus = null, noiseBuf = null, curLevel = 0;

  const soundWanted = () => !muted && !(typeof isPortraitView === 'function' && isPortraitView());
  const musicLevel = () => soundWanted() ? (voiceOn ? .035 : .14) : 0;

  function makeAudio() {
    if (audio || !AC) return;
    try {
      audio = new AC();
      const comp = audio.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3;
      const music = audio.createGain();
      music.gain.value = musicLevel();
      const sfx = audio.createGain(); sfx.gain.value = soundWanted() ? .9 : 0;
      const vGain = audio.createGain(); vGain.gain.value = 1;
      music.connect(comp); sfx.connect(comp); vGain.connect(comp); comp.connect(audio.destination);
      bus = { comp, music, sfx, voice: vGain };

      const sr = audio.sampleRate, nb = audio.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      noiseBuf = nb;
    } catch (e) { audio = null; }
  }

  function refreshAudioGains() {
    if (!audio || !bus) return;
    const t = audio.currentTime;
    bus.music.gain.setTargetAtTime(musicLevel(), t, .15);
    bus.sfx.gain.setTargetAtTime(soundWanted() ? .9 : 0, t, .08);
  }

  function unlockAudio() {
    makeAudio();
    if (audio && audio.state === 'suspended') audio.resume().catch(() => {});
    refreshAudioGains();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && typeof voice !== 'undefined') voice.suspend();
    refreshAudioGains();
  });

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function envNote(t, f, dur, vol, type, dest, glideF) {
    if (!audio || !bus || !soundWanted()) return;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(f, t);
    if (glideF) o.frequency.exponentialRampToValueAtTime(glideF, t + dur * .75);
    g.gain.setValueAtTime(.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(.025, dur * .2));
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(dest || bus.sfx);
    o.start(t); o.stop(t + dur + .03);
  }

  function rustleBurst(t, dur, freq, q, vol) {
    if (!audio || !noiseBuf || !bus || !soundWanted()) return;
    const s = audio.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const bp = audio.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    const g = audio.createGain();
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(vol, t + .03);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(bp); bp.connect(g); g.connect(bus.sfx);
    s.start(t); s.stop(t + dur + .04);
  }

  function uxSfx(kind) {
    unlockAudio();
    if (!audio || !soundWanted()) return;
    const t = audio.currentTime;
    if (kind === 'tap') {
      envNote(t, midi(76), .09, .14, 'sine');
    } else if (kind === 'rustle') {
      rustleBurst(t, .22, 1800, 1.4, .16);
      envNote(t + .04, midi(79), .12, .12, 'triangle', null, midi(84));
    } else if (kind === 'splash') {
      rustleBurst(t, .25, 950, 1.1, .18);
      envNote(t, midi(64), .16, .16, 'sine', null, midi(76));
    } else if (kind === 'clue' || kind === 'orb') {
      [72, 76, 79, 84].forEach((m, i) => envNote(t + i * .06, midi(m), .26, .14, 'triangle'));
    } else if (kind === 'stone_ok') {
      envNote(t, midi(72), .16, .18, 'triangle');
      envNote(t + .07, midi(79), .22, .16, 'sine');
    } else if (kind === 'blend') {
      [67, 72, 76, 79, 84, 88].forEach((m, i) => envNote(t + i * .055, midi(m), .32, .15, 'triangle'));
    } else if (kind === 'wrong') {
      envNote(t, midi(62), .14, .12, 'triangle', null, midi(58));
    } else if (kind === 'star' || kind === 'unlock') {
      [72, 76, 79, 84, 88].forEach((m, i) => envNote(t + i * .06, midi(m), .36, .16, 'sine'));
    } else if (kind === 'cheer') {
      [74, 78, 81, 86].forEach((m, i) => envNote(t + i * .05, midi(m), .28, .15, 'triangle'));
    } else if (kind === 'page') {
      rustleBurst(t, .14, 1400, 1.2, .08);
      envNote(t, midi(72), .11, .09, 'sine');
    }
  }

  /* 8 bright, gentle acoustic woodland scores (marimba + warm pluck bass + soft flute motif) */
  const THEMES = [
    { key: 60, tempo: .42, arp: [0, 4, 7, 12, 7, 4], bass: [0, 7, 5, 7], mel: [12, 16, 19, 16, 14, 12, 9, 12] },
    { key: 62, tempo: .46, arp: [0, 4, 7, 11, 7, 4], bass: [0, 7, 2, 7], mel: [16, 14, 12, 14, 19, 16, 14, 12] },
    { key: 65, tempo: .40, arp: [0, 4, 7, 12, 9, 7], bass: [0, 5, 7, 5], mel: [12, 14, 16, 19, 21, 19, 16, 14] },
    { key: 67, tempo: .44, arp: [0, 4, 7, 14, 12, 7], bass: [0, 7, 9, 5], mel: [19, 16, 14, 12, 14, 16, 12, 9] },
    { key: 64, tempo: .48, arp: [0, 3, 7, 12, 7, 3], bass: [0, 5, 3, 7], mel: [12, 15, 19, 17, 15, 12, 10, 12] },
    { key: 69, tempo: .45, arp: [0, 4, 7, 12, 11, 7], bass: [0, 7, 5, 4], mel: [16, 19, 21, 19, 16, 14, 12, 16] },
    { key: 60, tempo: .43, arp: [0, 7, 12, 16, 12, 7], bass: [0, 5, 9, 7], mel: [14, 16, 19, 24, 21, 19, 16, 14] },
    { key: 65, tempo: .39, arp: [0, 4, 7, 12, 16, 12], bass: [0, 7, 5, 7], mel: [12, 16, 19, 24, 19, 16, 14, 12] },
  ];

  let nextBeat = 0, stepN = 0;
  function audioTick() {
    if (!audio || !bus || !soundWanted()) return;
    if (audio.state !== 'running') return;
    const now = audio.currentTime;
    if (nextBeat < now - .5) nextBeat = now + .05;
    const th = THEMES[curLevel % THEMES.length];
    while (nextBeat < now + .22) {
      const m = th.key + th.arp[stepN % th.arp.length];
      envNote(nextBeat, midi(m), th.tempo * 1.4, .055, 'triangle', bus.music);
      if (stepN % 3 === 0) {
        const b = th.key - 12 + th.bass[(stepN / 3) % th.bass.length | 0];
        envNote(nextBeat, midi(b), th.tempo * 2.4, .06, 'sine', bus.music);
      }
      if (stepN % 2 === 0) {
        const fm = th.key + 12 + th.mel[((stepN / 2) | 0) % th.mel.length];
        envNote(nextBeat, midi(fm), th.tempo * 1.8, .035, 'sine', bus.music);
      }
      stepN++;
      nextBeat += th.tempo;
    }
  }

  function audioOnEvents(events, g) {
    for (const e of events || []) {
      if (e.type === 'load') { curLevel = e.index || 0; stepN = 0; }
      else if (e.type === 'clue') uxSfx(game.level().bg === 'bg_pond' ? 'splash' : 'clue');
      else if (e.type === 'memory' || e.type === 'acorn') uxSfx('star');
      else if (e.type === 'stone_ok') uxSfx('stone_ok');
      else if (e.type === 'word_blended') uxSfx('blend');
      else if (e.type === 'stone_try') uxSfx('wrong');
      else if (e.type === 'cheer') uxSfx('cheer');
    }
  }

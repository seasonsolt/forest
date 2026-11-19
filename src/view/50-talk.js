  /* Spoken bilingual guidance, subtitle bubbles (only when setting('subtitles') is on), and word exposure logging. */
  const TK = (() => {
    const isDev = () => { try { return /[?&]dev=1(&|$)/.test(location.search); } catch (e) { return false; } };
    const subtitlesOn = () => { try { return !!setting('subtitles'); } catch (e) { return false; } };
    const hasLine = key => !!(typeof LINES === 'object' && LINES && LINES.lines && LINES.lines[key]);
    let curSub = null, introDone = -1;

    function countWordHeard(id) {
      try { if (typeof noteWordHeard === 'function') noteWordHeard(id); } catch (e) {}
    }
    function wordStats() {
      const out = {};
      for (const id of Object.keys(heardLog)) out[id] = Object.assign({}, heardLog[id]);
      return out;
    }

    function hideBubble() {
      const t = $('talk');
      if (t) t.textContent = '';
    }

    function renderBubble(sub) {
      const t = $('talk');
      if (!t) return;
      t.textContent = '';
      if (!sub || !subtitlesOn() || !sub.segments || !sub.segments.length) return;
      const text = sub.segments.map(s => s.text).join(' ');
      const lines = wrap(text, 22).slice(0, 3);
      const w = Math.min(720, Math.max(220, Math.max(...lines.map(l => l.length)) * 20 + 44));
      const h = lines.length * 26 + 22;
      const g = el('g', { transform: `translate(${480 - w / 2} 446)` }, t);
      el('rect', { width: w, height: h, rx: 16, fill: '#112219', opacity: '.88', stroke: sub.who === 'labrador' ? '#7bb6ff' : '#ff9cc4', 'stroke-width': 2.5 }, g);
      lines.forEach((ln, i) => {
        const tx = el('text', { x: w / 2, y: 27 + i * 26, 'text-anchor': 'middle', 'font-size': 18, fill: '#fff8ea' }, g);
        tx.textContent = ln;
      });
    }

    if (typeof voice !== 'undefined' && typeof voice.onSubtitle === 'function') {
      voice.onSubtitle(sub => { curSub = sub; renderBubble(sub); });
    }

    function refreshSubtitles() { renderBubble(curSub); }

    function say(key, opts) {
      if (!hasLine(key)) return Promise.resolve(false);
      return voice.line(key, opts);
    }

    function talkOnEvents(events, g) {
      g = g || game;
      for (const e of events || []) {
        if (e.type === 'load') {
          introDone = -1;
          hideBubble();
          if (isDev()) window.__wordStats = wordStats;
        } else if (e.type === 'clue' && e.word) {
          voice.word(e.word);
          say('spot_' + e.word, { tag: 'spot', maxWait: 4500 });
        } else if (e.type === 'memory') {
          if (typeof openMemoryOverlay === 'function') openMemoryOverlay(e.memoryId);
        } else if (e.type === 'acorn') {
          say('clue_' + (1 + (e.got % 4)), { tag: 'clue', maxWait: 3000 });
        } else if (e.type === 'workshop_ready') {
          say('screen2_letter', { tag: 'ws', maxWait: 5000 });
        } else if (e.type === 'screen2') {
          if (!save.flags.tutorial) {
            save.flags.tutorial = true; saveSoon();
            say('tutor_phonics', { tag: 'tutor', maxWait: 5000 });
          } else {
            say('screen2_letter', { tag: 'ws', maxWait: 5000 });
          }
          const r0 = g.currentRound();
          if (r0) say('quiz_' + r0.word, { tag: 'prompt', maxWait: 5000 });
        } else if (e.type === 'word_blended') {
          voice.word(e.word);
          say('blend_' + e.word, { tag: 'blend', maxWait: 5000 });
        } else if (e.type === 'stone_assist') {
          say('stone_assist', { interrupt: true, tag: 'assist', maxWait: 4000 });
        } else if (e.type === 'stone_try') {
          say('stone_try_' + (1 + ((e.misses || 1) % 3)), { interrupt: true, tag: 'try', maxWait: 2500 });
        } else if (e.type === 'cheer') {
          say('cheer_' + (1 + Math.floor(Math.random() * 4)), { interrupt: true, tag: 'cheer', maxWait: 2000 });
        } else if (e.type === 'hint_auto') {
          say('idle_' + (1 + Math.floor(Math.random() * 4)), { tag: 'hint', maxWait: 3500 });
        }
      }
      if (g.state === 'play' && introDone !== g.index && !storyIsOpen()) {
        introDone = g.index;
        say('case_' + g.level().id, { tag: 'case', maxWait: 5000 });
        if (g.index === 0 && !save.flags.tapTip) {
          save.flags.tapTip = true; saveSoon();
          say('tutor_tap', { tag: 'tutor', maxWait: 5000 });
        }
      }
    }

    return { countWordHeard, talkOnEvents, refreshSubtitles, wordStats, say, hasLine };
  })();

  const countWordHeard = TK.countWordHeard;
  const talkOnEvents = TK.talkOnEvents;
  const wordStats = TK.wordStats;

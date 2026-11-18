  /* When the room is live and nothing covers it. Plain global script, no DOM access. */
  function canPlay() { return playFlow.phase === 'play' && game.state === 'play' && !storyIsOpen() && !uxState.modal && !isPortraitView(); }

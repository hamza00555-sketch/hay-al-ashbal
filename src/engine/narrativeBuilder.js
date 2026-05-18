function beat(type, payload = {}, durationMs = 0) {
  return { type, payload, durationMs };
}

export function buildNarrative({
  card,
  actorId,
  actorName,
  targetId,
  targetName,
  targetCardBefore,
  nextGs,
  prevGs,
  isAI,
}) {
  const beats = [];

  if (isAI) {
    beats.push(beat('AI_THINKING', { name: actorName, actorId }, 1600));
  }

  beats.push(beat('CARD_ANTICIPATE', { card, actorName, actorId }, 2000));

  const newlyEliminated = nextGs.players.filter(p => {
    const prev = prevGs.players.find(x => x.id === p.id);
    return p.isEliminated && prev && !prev.isEliminated;
  });

  switch (card.id) {
    case 1: { // GUESS
      const hit = newlyEliminated.some(p => p.id === targetId);
      if (hit) beats.push(beat('HIT_PAUSE', {}, 75));
      beats.push(beat('CARD_IMPACT', { card, actorName, actorId, targetName, targetId, hit, isAI }, 0));
      newlyEliminated.forEach(p => {
        beats.push(beat('HIT_PAUSE', {}, 75));
        beats.push(beat('ELIMINATION', { playerName: p.name, playerId: p.id }, 0));
      });
      break;
    }
    case 2: { // PEEK
      beats.push(beat('CARD_IMPACT', { card, actorName, actorId, targetName, targetId, isAI }, 0));
      break;
    }
    case 3: { // COMPARE
      const actorAfter = nextGs.players.find(p => p.id === actorId);
      const actorCard  = actorAfter?.hand[0];
      beats.push(beat('COMPARE_REVEAL', {
        actorName, actorId, actorCard,
        targetName, targetId, targetCard: targetCardBefore,
        eliminatedName: newlyEliminated[0]?.name ?? null,
      }, 0));
      newlyEliminated.forEach(p => {
        beats.push(beat('HIT_PAUSE', {}, 75));
        beats.push(beat('ELIMINATION', { playerName: p.name, playerId: p.id }, 0));
      });
      break;
    }
    case 4: { // PROTECT
      beats.push(beat('PROTECTION_FLASH', { actorName, actorId }, 0));
      break;
    }
    case 5: { // FORCE_DISCARD
      const wasEliminated = newlyEliminated.some(p => p.id === targetId);
      beats.push(beat('FORCE_RESULT', {
        actorName, actorId, targetName, targetId,
        discardedCard: targetCardBefore,
        wasEliminated,
      }, 0));
      newlyEliminated.forEach(p => {
        beats.push(beat('HIT_PAUSE', {}, 75));
        beats.push(beat('ELIMINATION', { playerName: p.name, playerId: p.id }, 0));
      });
      break;
    }
    case 6: { // SWAP
      beats.push(beat('SWAP_VISUAL', { actorName, actorId, targetName, targetId }, 0));
      break;
    }
    case 7: { // BUSTAN — forced discard
      beats.push(beat('CARD_IMPACT', { card, actorName, actorId, isAI }, 0));
      break;
    }
    case 8: { // STAR — auto-eliminated
      beats.push(beat('HIT_PAUSE', {}, 75));
      beats.push(beat('ELIMINATION', { playerName: actorName, playerId: actorId }, 0));
      break;
    }
  }

  return beats;
}

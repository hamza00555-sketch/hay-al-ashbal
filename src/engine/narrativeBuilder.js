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
    beats.push(beat('AI_THINKING', { name: actorName }, 900));
  }

  beats.push(beat('CARD_ANTICIPATE', { card, actorName }, 500));

  // Find any newly eliminated players
  const newlyEliminated = nextGs.players.filter(p => {
    const prev = prevGs.players.find(x => x.id === p.id);
    return p.isEliminated && prev && !prev.isEliminated;
  });

  switch (card.id) {
    case 1: { // GUESS
      const hit = newlyEliminated.some(p => p.id === targetId);
      beats.push(beat('CARD_IMPACT', {
        card, actorName, targetName, hit, isAI,
      }, isAI ? 1200 : 0));
      newlyEliminated.forEach(p =>
        beats.push(beat('ELIMINATION', { playerName: p.name }, 1500))
      );
      break;
    }
    case 2: { // PEEK — human path handled by PEEK_REVEAL screen
      if (isAI) {
        beats.push(beat('CARD_IMPACT', { card, actorName, targetName }, 1000));
      }
      break;
    }
    case 3: { // COMPARE
      const actorAfter  = nextGs.players.find(p => p.id === actorId);
      const actorCard   = actorAfter?.hand[0];   // card they kept (what was compared)
      beats.push(beat('COMPARE_REVEAL', {
        actorName,
        actorCard,
        targetName,
        targetCard: targetCardBefore,
        eliminatedName: newlyEliminated[0]?.name ?? null,
      }, 0));
      newlyEliminated.forEach(p =>
        beats.push(beat('ELIMINATION', { playerName: p.name }, 1500))
      );
      break;
    }
    case 4: { // PROTECT
      beats.push(beat('PROTECTION_FLASH', { actorName }, 800));
      break;
    }
    case 5: { // FORCE_DISCARD
      const wasEliminated = newlyEliminated.some(p => p.id === targetId);
      beats.push(beat('FORCE_RESULT', {
        actorName,
        targetName,
        discardedCard: targetCardBefore,
        wasEliminated,
      }, 0));
      newlyEliminated.forEach(p =>
        beats.push(beat('ELIMINATION', { playerName: p.name }, 1500))
      );
      break;
    }
    case 6: { // SWAP
      beats.push(beat('SWAP_VISUAL', { actorName, targetName }, 900));
      break;
    }
    case 7: { // BUSTAN
      beats.push(beat('CARD_IMPACT', { card, actorName }, 400));
      break;
    }
    case 8: { // STAR — auto-eliminated when forced to discard
      beats.push(beat('ELIMINATION', { playerName: actorName }, 1500));
      break;
    }
  }

  return beats;
}

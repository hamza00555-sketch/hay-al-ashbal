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
    beats.push(beat('AI_THINKING', { name: actorName, actorId }, 1300));
  } else {
    beats.push(beat('CARD_DRAWN', {}, 900));  // brief "سحبت كرتك" before human plays
  }

  // AI anticipate slowed so the player can read the card + ability before it resolves
  beats.push(beat('CARD_ANTICIPATE', { card, actorName, actorId }, isAI ? 2400 : 2000));

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
      // Only reveal card faces if the human player is directly involved in the compare.
      // When both sides are AI the human is a spectator and shouldn't see hidden hands.
      const targetIsAI = prevGs.players.find(p => p.id === targetId)?.isAI ?? true;
      const humanInvolved = !isAI || !targetIsAI;
      beats.push(beat('COMPARE_REVEAL', {
        actorName, actorId, actorCard: humanInvolved ? actorCard : null,
        targetName, targetId, targetCard: humanInvolved ? targetCardBefore : null,
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

// Short Arabic summary of an action — used by the opponent to see what happened
export function buildActionText({ card, actorName, targetName, nextGs, prevGs }) {
  const newlyEliminated = nextGs.players.filter(p => {
    const was = prevGs?.players?.find(x => x.id === p.id);
    return p.isEliminated && was && !was.isEliminated;
  });
  const elim = newlyEliminated[0]?.name;
  switch (card.id) {
    case 1: return elim
      ? `🎯 ${actorName} خمّن صح — ${elim} خرج!`
      : `❌ ${actorName} خمّن وأخطأ`;
    case 2: return `👀 ${actorName} رأى كرت ${targetName ?? 'خصمه'}`;
    case 3: return elim
      ? `⚔️ ${actorName} قارن مع ${targetName} — ${elim} خرج!`
      : `⚔️ ${actorName} قارن مع ${targetName} — تعادل`;
    case 4: return `🛡️ ${actorName} حمى نفسه`;
    case 5: return elim
      ? `💥 ${actorName} أجبر ${targetName} — ${elim} خرج!`
      : `🔄 ${actorName} أجبر ${targetName} على تغيير كرته`;
    case 6: return `🔀 ${actorName} بادل كرته مع ${targetName ?? 'خصمه'}`;
    case 7: return `🌿 ${actorName} رمى البستان`;
    case 8: return `⭐ ${actorName} لفّ النجمة — خرج!`;
    default: return `${actorName} لعب بطاقة`;
  }
}

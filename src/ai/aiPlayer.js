import { UNIQUE_CARDS, buildDeck } from '../constants/cards';
import { mustPlayBustan, resolveCard } from '../engine/gameEngine';

function getValidTargets(state, excludeSelf = true) {
  return state.players.filter(p => {
    if (p.isEliminated) return false;
    if (p.isProtected) return false;
    if (excludeSelf && p.id === state.players[state.currentPlayerIndex].id) return false;
    return true;
  });
}

function pickTarget(state) {
  const targets = getValidTargets(state);
  return targets.length > 0 ? targets[0].id : null;
}

// Count which card IDs are still possible (not yet discarded, not in AI's hand)
function getRemainingPossible(state) {
  const ai = state.players[state.currentPlayerIndex];
  const knownIds = [ai.hand[0]?.id, state.drawnCard?.id].filter(Boolean);

  const discarded = [];
  state.players.forEach(p => p.discardPile.forEach(c => discarded.push(c.id)));

  const full = buildDeck();
  const toRemove = [...discarded, ...knownIds];
  const remaining = [];

  for (const card of full) {
    const idx = toRemove.indexOf(card.id);
    if (idx !== -1) {
      toRemove.splice(idx, 1);
    } else {
      remaining.push(card);
    }
  }
  return remaining;
}

// Easy: random-ish, pick most common remaining card
function bestGuessEasy(state) {
  const ai = state.players[state.currentPlayerIndex];
  const knownIds = new Set([ai.hand[0]?.id, state.drawnCard?.id]);
  const remaining = UNIQUE_CARDS.filter(c => c.id !== 1).sort((a, b) => b.power - a.power);
  return remaining.find(c => !knownIds.has(c.id))?.id ?? 2;
}

// Medium/Hard: use remaining deck to find most likely card
function bestGuessSmart(state) {
  const remaining = getRemainingPossible(state).filter(c => c.id !== 1);
  const counts = {};
  remaining.forEach(c => { counts[c.id] = (counts[c.id] ?? 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? parseInt(sorted[0][0]) : 2;
}

// Hard: pick target with lowest estimated hand power (highest discard sum → likely cleared high cards)
function pickTargetHard(state, forCompare = false) {
  const targets = getValidTargets(state);
  if (targets.length === 0) return null;
  if (!forCompare) return targets[0].id;

  // For COMPARE: target player with lowest estimated remaining power
  return targets.reduce((bestId, p) => {
    const pScore = p.discardPile.reduce((s, c) => s + c.power, 0);
    const bScore = bestId != null
      ? state.players.find(x => x.id === bestId)?.discardPile.reduce((s, c) => s + c.power, 0) ?? 0
      : -1;
    return pScore < bScore ? p.id : bestId;
  }, null) ?? targets[0].id;
}

function chooseCard(hand, drawn) {
  const forcePlayBustan = mustPlayBustan(hand, drawn);
  if (forcePlayBustan) {
    return hand.id === 7
      ? { cardToPlay: hand, cardSource: 'hand' }
      : { cardToPlay: drawn, cardSource: 'drawn' };
  }
  if (drawn.id === 8) return { cardToPlay: hand,  cardSource: 'hand'  };
  if (hand.id === 8)  return { cardToPlay: drawn, cardSource: 'drawn' };
  if (hand.power < drawn.power) return { cardToPlay: hand, cardSource: 'hand' };
  return { cardToPlay: drawn, cardSource: 'drawn' };
}

function chooseCardHard(hand, drawn) {
  const forcePlayBustan = mustPlayBustan(hand, drawn);
  if (forcePlayBustan) {
    return hand.id === 7
      ? { cardToPlay: hand, cardSource: 'hand' }
      : { cardToPlay: drawn, cardSource: 'drawn' };
  }
  if (drawn.id === 8) return { cardToPlay: hand,  cardSource: 'hand'  };
  if (hand.id === 8)  return { cardToPlay: drawn, cardSource: 'drawn' };

  // Prefer to play action cards (1,2,3,5,6) — keep high-value cards
  const actionIds = new Set([1, 2, 3, 5, 6]);
  if (actionIds.has(drawn.id) && !actionIds.has(hand.id)) return { cardToPlay: drawn, cardSource: 'drawn' };
  if (actionIds.has(hand.id) && !actionIds.has(drawn.id)) return { cardToPlay: hand,  cardSource: 'hand'  };
  if (hand.power < drawn.power) return { cardToPlay: hand, cardSource: 'hand' };
  return { cardToPlay: drawn, cardSource: 'drawn' };
}

export function computeAIMove(state) {
  const ai = state.players[state.currentPlayerIndex];
  const difficulty = ai.difficulty ?? 'easy';

  const hand  = ai.hand[0];
  const drawn = state.drawnCard;

  let cardToPlay, cardSource;
  if (difficulty === 'hard') {
    ({ cardToPlay, cardSource } = chooseCardHard(hand, drawn));
  } else {
    ({ cardToPlay, cardSource } = chooseCard(hand, drawn));
  }

  let targetId;
  if (difficulty === 'hard' && cardToPlay.id === 3) {
    targetId = pickTargetHard(state, true);
  } else {
    targetId = pickTarget(state);
  }

  const guessId = cardToPlay.id === 1
    ? (difficulty === 'easy' ? bestGuessEasy(state) : bestGuessSmart(state))
    : null;

  const targetCardBefore = targetId != null
    ? state.players.find(p => p.id === targetId)?.hand[0] ?? null
    : null;

  const nextState = resolveCard(state, cardToPlay, cardSource, targetId, guessId);
  return { state: nextState, playedCard: cardToPlay, targetId, guessId, targetCardBefore };
}

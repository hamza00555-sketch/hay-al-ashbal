import { CARDS } from '../constants/cards';
import { getActivePlayers, mustPlayBustan, resolveCard } from '../engine/gameEngine';

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

function bestGuess(state) {
  const ai = state.players[state.currentPlayerIndex];
  const knownIds = new Set([ai.hand[0]?.id, state.drawnCard?.id]);
  const remaining = CARDS
    .filter(c => c.id !== 1)
    .sort((a, b) => b.count - a.count);
  return remaining.find(c => !knownIds.has(c.id))?.id ?? 2;
}

export function computeAIMove(state) {
  const ai = state.players[state.currentPlayerIndex];
  const hand = ai.hand[0];
  const drawn = state.drawnCard;

  let cardToPlay = drawn;
  let cardSource = 'drawn';

  const forcePlayBustan = mustPlayBustan(hand, drawn);
  if (forcePlayBustan) {
    if (hand.id === 7) { cardToPlay = hand; cardSource = 'hand'; }
    else { cardToPlay = drawn; cardSource = 'drawn'; }
  } else {
    if (drawn.id === 8) {
      cardToPlay = hand; cardSource = 'hand';
    } else if (hand.id === 8) {
      cardToPlay = drawn; cardSource = 'drawn';
    } else if (hand.power < drawn.power) {
      cardToPlay = hand; cardSource = 'hand';
    } else {
      cardToPlay = drawn; cardSource = 'drawn';
    }
  }

  const targetId = pickTarget(state);
  const guessId = cardToPlay.id === 1 ? bestGuess(state) : null;

  return resolveCard(state, cardToPlay, cardSource, targetId, guessId);
}

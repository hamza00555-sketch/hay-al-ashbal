import { buildDeck } from '../constants/cards';

export function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialState(players) {
  const deck = shuffle(buildDeck());
  const hiddenCard = deck.pop();

  const playerStates = players.map((p, index) => ({
    id: index,
    name: p.name,
    isAI: p.isAI || false,
    hand: [deck.pop()],
    isEliminated: false,
    isProtected: false,
    discardPile: [],
  }));

  return {
    deck,
    hiddenCard,
    players: playerStates,
    currentPlayerIndex: 0,
    phase: 'HAND_COVER',
    drawnCard: null,
    gameLog: [],
    winner: null,
    peekCard: null,
    peekTargetName: null,
  };
}

export function getCurrentPlayer(state) {
  return state.players[state.currentPlayerIndex];
}

export function getActivePlayers(state) {
  return state.players.filter(p => !p.isEliminated);
}

export function mustPlayBustan(handCard, drawnCard) {
  const ids = [handCard.id, drawnCard.id];
  return ids.includes(7) && (ids.includes(5) || ids.includes(6));
}

export function getLegalPlays(handCard, drawnCard) {
  if (mustPlayBustan(handCard, drawnCard)) {
    return handCard.id === 7 ? ['hand'] : ['drawn'];
  }
  return ['hand', 'drawn'];
}

function eliminatePlayer(state, playerId, reason) {
  const player = state.players.find(p => p.id === playerId);
  return {
    ...state,
    players: state.players.map(p =>
      p.id === playerId ? { ...p, isEliminated: true } : p
    ),
    gameLog: [
      ...state.gameLog,
      { id: Date.now() + Math.random(), type: 'eliminated', playerName: player?.name, reason },
    ],
  };
}

function addLog(state, entry) {
  return {
    ...state,
    gameLog: [...state.gameLog, { id: Date.now() + Math.random(), ...entry }],
  };
}

export function checkWin(state) {
  const active = getActivePlayers(state);
  if (active.length <= 1) {
    return { ...state, phase: 'GAME_OVER', winner: active[0] ?? null };
  }
  if (state.deck.length === 0) {
    const winner = active.reduce((best, p) =>
      p.hand[0].power > best.hand[0].power ? p : best
    );
    return { ...state, phase: 'GAME_OVER', winner };
  }
  return null;
}

export function advanceTurn(state) {
  const winState = checkWin(state);
  if (winState) return winState;

  let cleared = {
    ...state,
    players: state.players.map((p, i) =>
      i === state.currentPlayerIndex ? { ...p, isProtected: false } : p
    ),
    drawnCard: null,
    peekCard: null,
    peekTargetName: null,
  };

  let nextIndex = (cleared.currentPlayerIndex + 1) % cleared.players.length;
  let safety = 0;
  while (cleared.players[nextIndex].isEliminated && safety < cleared.players.length) {
    nextIndex = (nextIndex + 1) % cleared.players.length;
    safety++;
  }

  const next = { ...cleared, currentPlayerIndex: nextIndex };
  const nextPlayer = next.players[nextIndex];

  return {
    ...next,
    phase: nextPlayer.isAI ? 'AI_TURN' : 'HAND_COVER',
  };
}

export function doDrawCard(state) {
  if (state.deck.length === 0) return checkWin(state) || state;
  const [drawnCard, ...rest] = state.deck;
  return { ...state, deck: rest, drawnCard, phase: 'PLAY' };
}

export function resolveCard(state, playedCard, cardSource, targetPlayerId, guessedCardId) {
  const currentPlayer = getCurrentPlayer(state);

  let newState = {
    ...state,
    players: state.players.map((p, i) => {
      if (i !== state.currentPlayerIndex) return p;
      const kept = cardSource === 'hand' ? state.drawnCard : p.hand[0];
      return {
        ...p,
        hand: [kept],
        discardPile: [...p.discardPile, playedCard],
      };
    }),
    drawnCard: null,
  };

  switch (playedCard.id) {
    case 1: {
      const target = newState.players.find(p => p.id === targetPlayerId);
      if (target && !target.isProtected && target.hand[0]?.id === guessedCardId) {
        newState = eliminatePlayer(newState, targetPlayerId,
          `تخمين ${currentPlayer.name} كان صحيح 🎯`);
      } else {
        newState = addLog(newState, {
          type: 'miss',
          text: `${currentPlayer.name} خمّن غلط`,
        });
      }
      break;
    }
    case 2: {
      const target = newState.players.find(p => p.id === targetPlayerId);
      const peekCard = target?.hand[0];
      newState = {
        ...newState,
        phase: 'PEEK_REVEAL',
        peekCard,
        peekTargetName: target?.name,
      };
      return newState;
    }
    case 3: {
      const target = newState.players.find(p => p.id === targetPlayerId);
      if (target && !target.isProtected) {
        const myPower = newState.players[state.currentPlayerIndex].hand[0].power;
        const theirPower = target.hand[0].power;
        if (myPower < theirPower) {
          newState = eliminatePlayer(newState, currentPlayer.id, 'كرته أقل في المقارنة');
        } else if (theirPower < myPower) {
          newState = eliminatePlayer(newState, targetPlayerId, 'كرته أقل في المقارنة');
        } else {
          newState = addLog(newState, { type: 'tie', text: 'تعادل — لا أحد يخرج' });
        }
      }
      break;
    }
    case 4: {
      newState = {
        ...newState,
        players: newState.players.map((p, i) =>
          i === state.currentPlayerIndex ? { ...p, isProtected: true } : p
        ),
      };
      newState = addLog(newState, { type: 'protect', text: `${currentPlayer.name} محمي الآن 🛡️` });
      break;
    }
    case 5: {
      const target = newState.players.find(p => p.id === targetPlayerId);
      if (target && !target.isProtected) {
        const discarded = target.hand[0];
        if (discarded.id === 8) {
          newState = eliminatePlayer(newState, targetPlayerId, 'رمى نجمة الحي 💀');
          newState = {
            ...newState,
            players: newState.players.map(p =>
              p.id === targetPlayerId
                ? { ...p, discardPile: [...p.discardPile, discarded] }
                : p
            ),
          };
        } else if (newState.deck.length > 0) {
          const [newCard, ...rest] = newState.deck;
          newState = {
            ...newState,
            deck: rest,
            players: newState.players.map(p =>
              p.id === targetPlayerId
                ? { ...p, hand: [newCard], discardPile: [...p.discardPile, discarded] }
                : p
            ),
          };
        }
        newState = addLog(newState, {
          type: 'force',
          text: `${currentPlayer.name} أجبر ${target.name} يبدل كرته ⚡`,
        });
      }
      break;
    }
    case 6: {
      const target = newState.players.find(p => p.id === targetPlayerId);
      if (target && !target.isProtected) {
        const myCard = newState.players[state.currentPlayerIndex].hand[0];
        const theirCard = target.hand[0];
        newState = {
          ...newState,
          players: newState.players.map(p => {
            if (p.id === currentPlayer.id) return { ...p, hand: [theirCard] };
            if (p.id === targetPlayerId) return { ...p, hand: [myCard] };
            return p;
          }),
        };
        newState = addLog(newState, {
          type: 'swap',
          text: `${currentPlayer.name} بدّل كرته مع ${target.name} 🔄`,
        });
      }
      break;
    }
    case 7: {
      newState = addLog(newState, {
        type: 'bustan',
        text: `${currentPlayer.name} رمى صاحب البستان 🌿`,
      });
      break;
    }
    case 8: {
      newState = eliminatePlayer(newState, currentPlayer.id, 'رمى نجمة الحي بنفسه 💀');
      break;
    }
  }

  const winCheck = checkWin(newState);
  if (winCheck) return winCheck;

  return advanceTurn(newState);
}

import { getCharacter } from '../constants/characters';

function pickRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Returns the text line for a character event
export function getVoiceLine(characterId, event, cardId = null) {
  const char = getCharacter(characterId);
  if (!char) return null;
  const key = cardId != null ? `playCard${cardId}` : event;
  return pickRandom(char.lines[key] ?? char.lines[event] ?? []);
}

// Plays audio file if it exists (silent fail) + returns text line
export function playVoice(characterId, event, cardId = null) {
  // Audio path convention: /characters/{id}/voice/{event}.mp3
  // e.g. /characters/fahad/voice/play_card_1.mp3
  const audioKey = cardId != null ? `play_card_${cardId}` : event;
  const audio = new Audio(`/characters/${characterId}/voice/${audioKey}.mp3`);
  audio.volume = 0.72;
  audio.play().catch(() => {}); // silent fail — file may not exist yet

  return getVoiceLine(characterId, event, cardId);
}

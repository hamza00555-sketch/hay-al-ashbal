import { useState } from 'react';
import MenuPage            from './pages/MenuPage';
import LobbyPage           from './pages/LobbyPage';
import CharacterSelectPage from './pages/CharacterSelectPage';
import GamePage            from './pages/GamePage';
import ResultPage          from './pages/ResultPage';
import RoundOverScreen     from './pages/RoundOverScreen';
import { assignCharacters } from './constants/characters';

export default function App() {
  const [screen,       setScreen]       = useState('menu');
  const [gameConfig,   setGameConfig]   = useState(null);
  const [pendingConfig, setPendingConfig] = useState(null); // config waiting for character select
  const [tokens,       setTokens]       = useState({});
  const [tokensToWin,  setTokensToWin]  = useState(3);
  const [roundResult,  setRoundResult]  = useState(null);
  const [finalResult,  setFinalResult]  = useState(null);
  const [roundKey,     setRoundKey]     = useState(0);
  const [roundNumber,  setRoundNumber]  = useState(1);

  function handleLobbyReady(config) {
    setPendingConfig(config);
    setScreen('character_select');
  }

  function handleCharacterSelect(characterId) {
    const playersWithChars = assignCharacters(pendingConfig.players, characterId);
    const finalConfig = { ...pendingConfig, players: playersWithChars };
    setGameConfig(finalConfig);
    setTokensToWin(finalConfig.tokensToWin ?? 3);
    setTokens({});
    setRoundNumber(1);
    setRoundKey(k => k + 1);
    setPendingConfig(null);
    setScreen('game');
  }

  function handleGameOver(result) {
    const twn = tokensToWin;
    const newTokens = { ...tokens };
    if (result.winner) {
      newTokens[result.winner.id] = (newTokens[result.winner.id] ?? 0) + 1;
    }
    setTokens(newTokens);

    const matchWon = result.winner && (newTokens[result.winner.id] ?? 0) >= twn;
    if (matchWon) {
      setFinalResult({ ...result, tokens: newTokens, tokensToWin: twn });
      setScreen('result');
    } else {
      setRoundResult({ ...result, tokens: newTokens, tokensToWin: twn });
      setScreen('round_over');
    }
  }

  function handleNextRound() {
    setRoundNumber(n => n + 1);
    setRoundKey(k => k + 1);
    setScreen('game');
  }

  return (
    <div dir="rtl">
      {screen === 'menu' && (
        <MenuPage onStart={() => setScreen('lobby')} />
      )}
      {screen === 'lobby' && (
        <LobbyPage
          onBack={() => setScreen('menu')}
          onStartGame={handleLobbyReady}
        />
      )}
      {screen === 'character_select' && (
        <CharacterSelectPage
          onBack={() => setScreen('lobby')}
          onConfirm={handleCharacterSelect}
        />
      )}
      {screen === 'game' && (
        <GamePage
          key={roundKey}
          config={gameConfig}
          roundNumber={roundNumber}
          tokensToWin={tokensToWin}
          tokens={tokens}
          onGameOver={handleGameOver}
        />
      )}
      {screen === 'round_over' && (
        <RoundOverScreen
          result={roundResult}
          config={gameConfig}
          tokens={roundResult?.tokens ?? {}}
          tokensToWin={roundResult?.tokensToWin ?? 3}
          onNextRound={handleNextRound}
          onMenu={() => setScreen('menu')}
        />
      )}
      {screen === 'result' && (
        <ResultPage
          result={finalResult}
          tokens={finalResult?.tokens ?? {}}
          tokensToWin={finalResult?.tokensToWin ?? 3}
          onNewMatch={() => setScreen('lobby')}
          onMenu={() => setScreen('menu')}
        />
      )}
    </div>
  );
}

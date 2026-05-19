import { useState, useEffect } from 'react';
import MenuPage        from './pages/MenuPage';
import LobbyPage       from './pages/LobbyPage';
import GamePage        from './pages/GamePage';
import ResultPage      from './pages/ResultPage';
import RoundOverScreen from './pages/RoundOverScreen';
import SettingsPage    from './pages/SettingsPage';
import { startMenuMusic, stopMenuMusic, stopMusic } from './utils/sounds';

export default function App() {
  const [screen,       setScreen]       = useState('menu');
  const [gameConfig,   setGameConfig]   = useState(null);
  const [tokens,       setTokens]       = useState({});
  const [tokensToWin,  setTokensToWin]  = useState(3);
  const [roundResult,  setRoundResult]  = useState(null);
  const [finalResult,  setFinalResult]  = useState(null);
  const [roundKey,     setRoundKey]     = useState(0);
  const [roundNumber,  setRoundNumber]  = useState(1);

  useEffect(() => {
    if (screen === 'game') {
      stopMenuMusic();
    } else {
      stopMusic();
      startMenuMusic();
    }
  }, [screen]);

  function handleLobbyReady(config) {
    setGameConfig(config);
    setTokensToWin(config.tokensToWin ?? 3);
    setTokens({});
    setRoundNumber(1);
    setRoundKey(k => k + 1);
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
        <MenuPage
          onStart={() => setScreen('lobby')}
          onSettings={() => setScreen('settings')}
        />
      )}
      {screen === 'settings' && (
        <SettingsPage onBack={() => setScreen('menu')} />
      )}
      {screen === 'lobby' && (
        <LobbyPage
          onBack={() => setScreen('menu')}
          onStartGame={handleLobbyReady}
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

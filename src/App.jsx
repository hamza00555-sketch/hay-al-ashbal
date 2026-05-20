import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase';
import MenuPage        from './pages/MenuPage';
import LobbyPage       from './pages/LobbyPage';
import GamePage        from './pages/GamePage';
import ResultPage      from './pages/ResultPage';
import RoundOverScreen from './pages/RoundOverScreen';
import SettingsPage    from './pages/SettingsPage';
import TutorialPage    from './pages/TutorialPage';
import LoginPage       from './pages/LoginPage';
import OnlineLobbyPage from './pages/OnlineLobbyPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import { isTutorialDone } from './tutorial/tutorialStorage';
import { startMenuMusic, stopMenuMusic, stopMusic } from './utils/sounds';
import { createInitialState } from './engine/gameEngine';
import { listenRoom, sanitizeGs, writeRoundStart } from './services/gameRoom';

export default function App() {
  const [screen,       setScreen]       = useState('menu');
  const [gameConfig,   setGameConfig]   = useState(null);
  const [tokens,       setTokens]       = useState({});
  const [tokensToWin,  setTokensToWin]  = useState(3);
  const [roundResult,  setRoundResult]  = useState(null);
  const [finalResult,  setFinalResult]  = useState(null);
  const [roundKey,     setRoundKey]     = useState(0);
  const [roundNumber,  setRoundNumber]  = useState(1);

  // Auth
  const [user,         setUser]         = useState(null);
  const [authReady,    setAuthReady]    = useState(false);

  // Online mode
  const [roomInfo,     setRoomInfo]     = useState(null); // { code, isHost, myUid, ... }
  const [onlineGame,   setOnlineGame]   = useState(null); // { initialGs, myPlayerIdx, uidToIdx, roomCode, isHost, config }

  const audioUnlocked = useRef(false);

  // Firebase auth listener
  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  // Start menu music the moment the user first taps anywhere
  useEffect(() => {
    const unlock = () => {
      if (audioUnlocked.current) return;
      audioUnlocked.current = true;
      startMenuMusic();
    };
    document.addEventListener('click',      unlock, { capture: true, passive: true });
    document.addEventListener('touchstart', unlock, { capture: true, passive: true });
    return () => {
      document.removeEventListener('click',      unlock, { capture: true });
      document.removeEventListener('touchstart', unlock, { capture: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!audioUnlocked.current) return;
    if (screen === 'game') {
      stopMenuMusic();
    } else {
      stopMusic();
      startMenuMusic();
    }
  }, [screen]);

  // ── Local game handlers ──────────────────────────────────────
  function handleLobbyReady(config) {
    setGameConfig(config);
    setTokensToWin(config.tokensToWin ?? 3);
    setTokens({});
    setRoundNumber(1);
    setRoundKey(k => k + 1);
    setOnlineGame(null);
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

  function handleNextRound(newInitialGs = null) {
    if (newInitialGs && onlineGame) {
      setOnlineGame(prev => ({ ...prev, initialGs: newInitialGs }));
    }
    setRoundNumber(n => n + 1);
    setRoundKey(k => k + 1);
    setScreen('game');
  }

  // ── Online game handlers ─────────────────────────────────────
  function handleOnlineGameStart(info) {
    // info: { initialGs, myPlayerIdx, uidToIdx, roomCode, isHost, config }
    setOnlineGame(info);
    setGameConfig({ players: info.initialGs.players });
    setTokensToWin(info.config?.tokensToWin ?? 3);
    setTokens({});
    setRoundNumber(1);
    setRoundKey(k => k + 1);
    setScreen('game');
  }

  // Host: create fresh state for round 2+, write to Firebase, start locally.
  async function handleOnlineNextRound() {
    const newGs = createInitialState(gameConfig.players);
    await writeRoundStart(onlineGame.roomCode, newGs);
    handleNextRound(newGs);
  }

  // Guest: listen during round_over screen — auto-start when host writes nextRound.
  useEffect(() => {
    if (screen !== 'round_over' || !onlineGame || onlineGame.isHost) return;
    const unsub = listenRoom(onlineGame.roomCode, room => {
      if (!room?.nextRound) return;
      const newGs = sanitizeGs(room.nextRound);
      handleNextRound(newGs);
    });
    return () => unsub();
  }, [screen, onlineGame?.roomCode, onlineGame?.isHost]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authReady) return null; // brief auth check before rendering

  return (
    <div dir="rtl">
      {screen === 'login' && (
        <LoginPage
          onLoggedIn={u => { setUser(u); setScreen('online_lobby'); }}
          onSkip={() => setScreen('menu')}
        />
      )}
      {screen === 'online_lobby' && (
        <OnlineLobbyPage
          user={user}
          onRoomReady={info => { setRoomInfo(info); setScreen('waiting_room'); }}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'waiting_room' && (
        <WaitingRoomPage
          user={user}
          roomInfo={roomInfo}
          onGameStart={handleOnlineGameStart}
          onLeave={() => setScreen('menu')}
        />
      )}
      {screen === 'tutorial' && (
        <TutorialPage
          onComplete={() => setScreen('lobby')}
          onSkip={() => setScreen('menu')}
          onRetry={() => { setScreen('menu'); setTimeout(() => setScreen('tutorial'), 50); }}
        />
      )}
      {screen === 'menu' && (
        <MenuPage
          onStart={() => setScreen('lobby')}
          onSettings={() => setScreen('settings')}
          onTutorial={() => setScreen('tutorial')}
          onOnline={() => {
            if (user) setScreen('online_lobby');
            else      setScreen('login');
          }}
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
          onQuit={() => setScreen('menu')}
          // Online props (null/defaults for local play)
          isOnline={!!onlineGame}
          isHost={onlineGame?.isHost ?? false}
          myPlayerIdx={onlineGame?.myPlayerIdx ?? 0}
          roomCode={onlineGame?.roomCode ?? null}
          initialGs={onlineGame?.initialGs ?? null}
        />
      )}
      {screen === 'round_over' && (
        <RoundOverScreen
          result={roundResult}
          config={gameConfig}
          tokens={roundResult?.tokens ?? {}}
          tokensToWin={roundResult?.tokensToWin ?? 3}
          onNextRound={onlineGame?.isHost ? handleOnlineNextRound : (onlineGame ? null : handleNextRound)}
          isOnlineGuest={!!onlineGame && !onlineGame.isHost}
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

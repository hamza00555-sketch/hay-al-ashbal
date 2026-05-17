import { useState } from 'react';
import MenuPage from './pages/MenuPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [gameConfig, setGameConfig] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  return (
    <div dir="rtl">
      {screen === 'menu' && (
        <MenuPage onStart={() => setScreen('lobby')} />
      )}
      {screen === 'lobby' && (
        <LobbyPage
          onBack={() => setScreen('menu')}
          onStartGame={config => { setGameConfig(config); setScreen('game'); }}
        />
      )}
      {screen === 'game' && (
        <GamePage
          key={JSON.stringify(gameConfig)}
          config={gameConfig}
          onGameOver={result => { setGameResult(result); setScreen('result'); }}
        />
      )}
      {screen === 'result' && (
        <ResultPage
          result={gameResult}
          onPlayAgain={() => setScreen('game')}
          onMenu={() => setScreen('menu')}
        />
      )}
    </div>
  );
}

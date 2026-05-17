import { useState } from 'react';
import MenuPage from './pages/MenuPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import GamePage from './pages/GamePage.jsx';
import ResultPage from './pages/ResultPage.jsx';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [gameConfig, setGameConfig] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  if (screen === 'menu') {
    return <MenuPage onStart={() => setScreen('setup')} />;
  }

  if (screen === 'setup') {
    return (
      <SetupPage
        onBack={() => setScreen('menu')}
        onStartGame={config => {
          setGameConfig(config);
          setScreen('game');
        }}
      />
    );
  }

  if (screen === 'game' && gameConfig) {
    return (
      <GamePage
        config={gameConfig}
        onGameOver={result => {
          setGameResult(result);
          setScreen('result');
        }}
      />
    );
  }

  if (screen === 'result' && gameResult) {
    return (
      <ResultPage
        result={gameResult}
        onPlayAgain={() => setScreen('setup')}
        onMenu={() => setScreen('menu')}
      />
    );
  }

  return null;
}

import { useState } from 'react';
import { loadProfile, getAIProfile } from '../utils/playerProfile';
import { SFX } from '../utils/sounds';
import styles from './LobbyPage.module.css';

const MODES = [
  { id: 'passplay', label: 'Pass & Play', desc: 'لاعبين على نفس الجوال', icon: '📱' },
  { id: 'vsai', label: 'ضد AI', desc: 'ألعب وحدك ضد الذكاء الاصطناعي', icon: '🤖' },
];

const AI_NAMES = ['خالد', 'سارة', 'علي'];

const DIFFICULTIES = [
  { id: 'easy',   label: 'سهل',   desc: 'للمبتدئين' },
  { id: 'medium', label: 'متوسط', desc: 'يحسب الكروت' },
  { id: 'hard',   label: 'صعب',   desc: 'استراتيجي' },
];

export default function LobbyPage({ onBack, onStartGame }) {
  const [mode, setMode] = useState('passplay');
  const [aiCount, setAiCount] = useState(2);
  const [difficulty, setDifficulty] = useState('medium');
  const [tokensToWin, setTokensToWin] = useState(3);
  const [players, setPlayers] = useState([
    { name: 'اللاعب 1' },
    { name: 'اللاعب 2' },
  ]);

  const minPlayers = mode === 'vsai' ? 1 : 2;
  const maxPlayers = mode === 'vsai' ? 1 : 6;

  function setPlayerName(index, name) {
    setPlayers(prev => prev.map((p, i) => i === index ? { ...p, name } : p));
  }

  function addPlayer() {
    if (players.length < maxPlayers) {
      setPlayers(prev => [...prev, { name: `اللاعب ${prev.length + 1}` }]);
    }
  }

  function removePlayer(index) {
    if (players.length > minPlayers) {
      setPlayers(prev => prev.filter((_, i) => i !== index));
    }
  }

  function handleModeChange(newMode) {
    setMode(newMode);
    if (newMode === 'vsai') {
      setPlayers([{ name: 'اللاعب 1' }]);
    } else {
      setPlayers([{ name: 'اللاعب 1' }, { name: 'اللاعب 2' }]);
    }
  }

  function startGame() {
    const humanProfile = loadProfile();
    let finalPlayers;
    if (mode === 'vsai') {
      const aiPlayers = AI_NAMES.slice(0, aiCount).map((name, i) => ({
        name,
        isAI: true,
        difficulty,
        profile: getAIProfile(i),
      }));
      finalPlayers = [
        { name: players[0].name.trim() || 'اللاعب', isAI: false, profile: humanProfile },
        ...aiPlayers,
      ];
    } else {
      finalPlayers = players.map((p, i) => ({
        name: p.name.trim() || 'لاعب',
        isAI: false,
        profile: i === 0 ? humanProfile : getAIProfile(i - 1),
      }));
    }
    onStartGame({ mode, players: finalPlayers, tokensToWin });
  }

  const canStart = mode === 'vsai' || players.length >= 2;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => { SFX.buttonClick(); onBack(); }}>‹ رجوع</button>
        <h2 className={styles.title}>إعداد اللعبة</h2>
      </div>

      <div className={styles.section}>
        <p className={styles.label}>وضع اللعب</p>
        <div className={styles.modes}>
          {MODES.map(m => (
            <button
              key={m.id}
              className={`${styles.modeBtn} ${mode === m.id ? styles.active : ''}`}
              onClick={() => { SFX.cardSelect(); handleModeChange(m.id); }}
            >
              <span className={styles.modeIcon}>{m.icon}</span>
              <span className={styles.modeLabel}>{m.label}</span>
              <span className={styles.modeDesc}>{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === 'passplay' && (
        <div className={styles.section}>
          <p className={styles.label}>اللاعبون ({players.length})</p>
          <div className={styles.playerList}>
            {players.map((p, i) => (
              <div key={i} className={styles.playerRow}>
                <input
                  className={styles.input}
                  value={p.name}
                  onChange={e => setPlayerName(i, e.target.value)}
                  maxLength={16}
                  dir="rtl"
                />
                {players.length > minPlayers && (
                  <button className={styles.removeBtn} onClick={() => { SFX.buttonClick(); removePlayer(i); }}>✕</button>
                )}
              </div>
            ))}
            {players.length < maxPlayers && (
              <button className={styles.addBtn} onClick={() => { SFX.cardSelect(); addPlayer(); }}>
                + أضف لاعب
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'vsai' && (
        <>
          <div className={styles.section}>
            <p className={styles.label}>اسمك</p>
            <div className={styles.playerRow}>
              <input
                className={styles.input}
                value={players[0].name}
                onChange={e => setPlayerName(0, e.target.value)}
                maxLength={16}
                dir="rtl"
              />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.label}>عدد الخصوم</p>
            <div className={styles.countRow}>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  className={`${styles.countBtn} ${aiCount === n ? styles.countActive : ''}`}
                  onClick={() => { SFX.cardSelect(); setAiCount(n); }}
                >
                  <span className={styles.countNum}>{n}</span>
                  <span className={styles.countSub}>
                    {n === 1 ? AI_NAMES[0] : n === 2 ? `${AI_NAMES[0]}، ${AI_NAMES[1]}` : AI_NAMES.join('، ')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles.label}>مستوى الصعوبة</p>
            <div className={styles.countRow}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  className={`${styles.countBtn} ${difficulty === d.id ? styles.countActive : ''}`}
                  onClick={() => { SFX.cardSelect(); setDifficulty(d.id); }}
                >
                  <span className={styles.diffLabel}>{d.label}</span>
                  <span className={styles.countSub}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className={styles.section}>
        <p className={styles.label}>الأوسمة للفوز</p>
        <div className={styles.countRow}>
          {[1, 3, 5].map(n => (
            <button
              key={n}
              className={`${styles.countBtn} ${tokensToWin === n ? styles.countActive : ''}`}
              onClick={() => { SFX.cardSelect(); setTokensToWin(n); }}
            >
              <span className={styles.countNum}>{n}</span>
              <span className={styles.countSub}>
                {n === 1 ? 'جولة واحدة' : n === 3 ? 'ثلاث جولات' : 'خمس جولات'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <button
          className={styles.startBtn}
          onClick={() => { SFX.confirmOk(); startGame(); }}
          disabled={!canStart}
        >
          ابدأ الجولة
        </button>
      </div>
    </div>
  );
}

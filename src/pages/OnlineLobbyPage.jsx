import { useState } from 'react';
import { createRoom, joinRoom } from '../services/gameRoom';
import { loadProfile } from '../utils/playerProfile';
import { SFX } from '../utils/sounds';
import styles from './OnlineLobbyPage.module.css';

export default function OnlineLobbyPage({ user, onRoomReady, onBack }) {
  const [tab,      setTab]      = useState('create'); // 'create' | 'join'
  const [name,     setName]     = useState(user?.displayName?.split(' ')[0] || 'لاعب');
  const [joinCode, setJoinCode] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');

  const profile = loadProfile();

  async function handleCreate() {
    if (!name.trim()) { setErr('اكتب اسمك'); return; }
    setErr(''); setLoading(true);
    try {
      SFX.confirmOk();
      const playerConfig = { name: name.trim(), profile };
      const code = await createRoom(user.uid, playerConfig, 3);
      onRoomReady({ code, isHost: true, myUid: user.uid, playerConfig });
    } catch (e) {
      setErr(e.message || 'خطأ في إنشاء الغرفة');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!name.trim()) { setErr('اكتب اسمك'); return; }
    if (code.length !== 4) { setErr('الكود 4 أحرف'); return; }
    setErr(''); setLoading(true);
    try {
      SFX.confirmOk();
      const playerConfig = { name: name.trim(), profile };
      await joinRoom(code, user.uid, playerConfig);
      onRoomReady({ code, isHost: false, myUid: user.uid, playerConfig });
    } catch (e) {
      setErr(e.message || 'خطأ في الانضمام');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page} dir="rtl">
      <div className={styles.header}>
        <button className={styles.back} onClick={() => { SFX.buttonClick(); onBack(); }}>‹ رجوع</button>
        <h2 className={styles.title}>اللعب أونلاين 🌐</h2>
      </div>

      <div className={styles.nameRow}>
        <label className={styles.label}>اسمك في اللعبة</label>
        <input
          className={styles.input}
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={16}
          dir="rtl"
          placeholder="اكتب اسمك"
        />
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'create' ? styles.tabActive : ''}`}
          onClick={() => { SFX.cardSelect(); setTab('create'); setErr(''); }}
        >إنشاء غرفة</button>
        <button
          className={`${styles.tab} ${tab === 'join' ? styles.tabActive : ''}`}
          onClick={() => { SFX.cardSelect(); setTab('join'); setErr(''); }}
        >انضمام بكود</button>
      </div>

      {tab === 'create' && (
        <div className={styles.section}>
          <p className={styles.hint}>ستحصل على كود تشاركه مع أصحابك 🔗</p>
          <button
            className={styles.actionBtn}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? '...' : 'إنشاء الغرفة ▶'}
          </button>
        </div>
      )}

      {tab === 'join' && (
        <div className={styles.section}>
          <label className={styles.label}>كود الغرفة</label>
          <input
            className={`${styles.input} ${styles.codeInput}`}
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={4}
            dir="ltr"
            placeholder="ABCD"
          />
          <button
            className={styles.actionBtn}
            onClick={handleJoin}
            disabled={loading || joinCode.length !== 4}
          >
            {loading ? '...' : 'انضمام ▶'}
          </button>
        </div>
      )}

      {err && <p className={styles.err}>{err}</p>}
    </div>
  );
}

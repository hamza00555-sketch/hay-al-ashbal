import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { saveUserProfile } from '../services/gameRoom';
import { loadProfile } from '../utils/playerProfile';
import { SFX } from '../utils/sounds';
import styles from './LoginPage.module.css';

export default function LoginPage({ onLoggedIn, onSkip }) {
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  async function handleGoogle() {
    setErr('');
    setLoading(true);
    try {
      SFX.buttonClick();
      const result = await signInWithPopup(auth, googleProvider);
      const user   = result.user;
      // Save / update profile in RTDB
      const localProfile = loadProfile();
      const name = user.displayName?.split(' ')[0] || 'لاعب';
      await saveUserProfile(user.uid, name, localProfile);
      onLoggedIn(user);
    } catch (e) {
      console.error(e);
      setErr('تعذّر تسجيل الدخول، حاول مجدداً');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page} dir="rtl">
      <div className={styles.card}>
        <div className={styles.logo}>🦁</div>
        <h1 className={styles.title}>حي الأشبال</h1>
        <p className={styles.sub}>سجّل دخولك للعب مع الأصحاب</p>

        <button
          className={styles.googleBtn}
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            <>
              <span className={styles.googleIcon}>G</span>
              <span>الدخول بـ Google</span>
            </>
          )}
        </button>

        {err && <p className={styles.err}>{err}</p>}

        <button className={styles.skipBtn} onClick={onSkip}>
          العب بدون حساب (محلي فقط)
        </button>
      </div>
    </div>
  );
}

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const app = initializeApp({
  apiKey:     import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL,
  projectId:  import.meta.env.VITE_FB_PROJECT_ID,
  appId:      import.meta.env.VITE_FB_APP_ID,
});

export const auth = getAuth(app);
export const db   = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

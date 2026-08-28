import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyDevKeyForPreviewOnly_ReplaceInEnv',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'peer-project-hub.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'peer-project-hub',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'peer-project-hub.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
};

let app;
let auth;

try {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (err) {
  console.warn('Firebase client initialization note:', err.message);
  auth = null;
}

export { auth };
export default app;

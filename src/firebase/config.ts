import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración del proyecto Firebase algebra-54480
// Los valores de configuración web de Firebase son identificadores públicos de cliente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA0B6SxlZaHbvvUy4lf3stoZo5y7YE848A',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'algebra-54480.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'algebra-54480',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'algebra-54480.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1089548211966',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1089548211966:web:8f95b0219ab4c0814a37af',
};

// Verifica si la configuración de Firebase está provista
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('tu_api_key_aqui')
);

// Inicialización singleton segura de Firebase App
function initFirebaseApp() {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }
  try {
    return initializeApp(firebaseConfig);
  } catch (error) {
    console.warn('Advertencia al inicializar Firebase App principal:', error);
    return initializeApp({
      apiKey: 'AIzaSyA0B6SxlZaHbvvUy4lf3stoZo5y7YE848A',
      projectId: 'algebra-54480',
      appId: '1:1089548211966:web:8f95b0219ab4c0814a37af'
    }, 'fallback');
  }
}

export const app = initFirebaseApp();

// Servicios principales de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);

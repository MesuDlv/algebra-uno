import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';

export interface PlayerProfile {
  name: string;
  avatar: string;
}

const PROFILE_STORAGE_KEY = 'algebra_uno_player_profile';

const DEFAULT_NAMES = [
  'Gauss',
  'Euler',
  'Noether',
  'Pitágoras',
  'Hypatia',
  'Newton',
  'Leibniz',
  'Ramanujan',
  'Descartes',
  'Fermat',
];

export const AVAILABLE_AVATARS = ['📐', '🎴', '🧠', '⚡', '🚀', '🦉', '⭐', '🔥'];

/**
 * Obtiene el perfil del jugador guardado en localStorage o genera uno aleatorio.
 */
export function getPlayerProfile(): PlayerProfile {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name && parsed.avatar) {
          return parsed;
        }
      }
    }
  } catch {
    // Si falla el acceso a localStorage, usa valores por defecto
  }

  const randomName = DEFAULT_NAMES[Math.floor(Math.random() * DEFAULT_NAMES.length)];
  const randomAvatar = AVAILABLE_AVATARS[Math.floor(Math.random() * AVAILABLE_AVATARS.length)];
  const defaultProfile = { name: randomName, avatar: randomAvatar };

  savePlayerProfile(defaultProfile.name, defaultProfile.avatar);
  return defaultProfile;
}

/**
 * Guarda el perfil del jugador (nombre y avatar) en localStorage.
 */
export function savePlayerProfile(name: string, avatar: string): PlayerProfile {
  const profile: PlayerProfile = {
    name: name.trim() || 'Jugador',
    avatar: avatar || '📐',
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    }
  } catch {
    // Error silencioso en entornos restringidos de localStorage
  }
  return profile;
}

/**
 * Asegura que el usuario tenga una sesión anónima activa en Firebase.
 */
export async function ensureAnonymousAuth(): Promise<User | null> {
  if (!isFirebaseConfigured) {
    console.warn('Firebase no está configurado aún. Se continuará en modo local.');
    return null;
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.warn('Aviso al iniciar sesión anónima en Firebase (se continuará en modo local o reintentando):', error);
    return null;
  }
}

/**
 * Suscriptor a cambios en el estado de autenticación.
 */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

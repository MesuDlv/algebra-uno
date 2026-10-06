import { describe, it, expect, beforeEach } from 'vitest';
import { generateRoomCode } from '../roomService';
import { getPlayerProfile, savePlayerProfile, AVAILABLE_AVATARS } from '../auth';
import { isPlayerTimedOut, TIMEOUT_THRESHOLD_MS } from '../presenceService';

const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, val: string) => storageMap.set(key, val),
  clear: () => storageMap.clear(),
  removeItem: (key: string) => storageMap.delete(key),
};
globalThis.localStorage = localStorageMock as unknown as Storage;

describe('Servicios de Firebase y Gestión de Salas', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Generador de Códigos de Sala (generateRoomCode)', () => {
    it('genera un código de exactamente 5 caracteres alfanuméricos en mayúsculas', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(5);
      expect(code).toMatch(/^[A-Z0-9]{5}$/);
    });

    it('no incluye caracteres visualmente ambiguos (0, O, 1, I)', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateRoomCode();
        expect(code).not.toMatch(/[01OI]/);
      }
    });

    it('genera códigos distintos en llamadas sucesivas', () => {
      const codes = new Set();
      for (let i = 0; i < 20; i++) {
        codes.add(generateRoomCode());
      }
      expect(codes.size).toBeGreaterThan(15);
    });
  });

  describe('Perfil del Jugador y Almacenamiento Local (auth.ts)', () => {
    it('obtiene un perfil por defecto con nombre y avatar válido si no había ninguno guardado', () => {
      const profile = getPlayerProfile();
      expect(profile.name.length).toBeGreaterThan(0);
      expect(AVAILABLE_AVATARS).toContain(profile.avatar);
    });

    it('permite guardar y recuperar el nombre y avatar personalizados', () => {
      savePlayerProfile('Arquímedes', '🦉');
      const retrieved = getPlayerProfile();

      expect(retrieved.name).toBe('Arquímedes');
      expect(retrieved.avatar).toBe('🦉');
    });

    it('asigna "Jugador" si se ingresa un nombre vacío o con puros espacios', () => {
      savePlayerProfile('   ', '⚡');
      const retrieved = getPlayerProfile();

      expect(retrieved.name).toBe('Jugador');
      expect(retrieved.avatar).toBe('⚡');
    });
  });

  describe('Servicio de Presencia e Inactividad (presenceService.ts)', () => {
    it('detecta correctamente si un jugador está activo dentro del umbral de 60 segundos', () => {
      const recentTimestamp = Date.now() - 10000; // Hace 10 segundos
      expect(isPlayerTimedOut(recentTimestamp)).toBe(false);
    });

    it('detecta correctamente si un jugador superó el tiempo límite de inactividad (> 60 segundos)', () => {
      const oldTimestamp = Date.now() - (TIMEOUT_THRESHOLD_MS + 5000); // Hace 65 segundos
      expect(isPlayerTimedOut(oldTimestamp)).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import { getAvatarObjectPosition, resolveAvatarUrl } from '../AvatarDisplay';
import { LEGENDARY_TRACK } from '../../../context/MusicContext';

describe('Calibración de Avatares y Música Legendaria', () => {
  describe('getAvatarObjectPosition', () => {
    it('ubica el rostro de sixsevenaldo en el tercio superior para que no se corte su cara', () => {
      const posId = getAvatarObjectPosition('avatar_sixsevenaldo');
      const posAsset = getAvatarObjectPosition('sixsevenaldo.jpg');
      expect(posId).toBe('center 10%');
      expect(posAsset).toBe('center 10%');
    });

    it('ubica ambos rostros de Jesús al cuadrado en la parte superior', () => {
      const posId = getAvatarObjectPosition('avatar_jesus_al_cuadrado');
      const posAsset = getAvatarObjectPosition('jesus_al_cuadrado.jpg');
      expect(posId).toBe('center 15%');
      expect(posAsset).toBe('center 15%');
    });

    it('ubica el rostro de Niño Betún centrado óptimamente', () => {
      const posId = getAvatarObjectPosition('avatar_nino_betun');
      expect(posId).toBe('center 25%');
    });

    it('ubica el rostro y saludo de Patria Milagro centrado', () => {
      const posId = getAvatarObjectPosition('avatar_patria_milagro');
      expect(posId).toBe('center 32%');
    });

    it('retorna center center para avatares genéricos o no definidos', () => {
      expect(getAvatarObjectPosition(undefined)).toBe('center center');
      expect(getAvatarObjectPosition('👤')).toBe('center center');
    });
  });

  describe('resolveAvatarUrl', () => {
    it('resuelve URLs de avatares especiales correctamente', () => {
      expect(resolveAvatarUrl('avatar_sixsevenaldo')).toBeTruthy();
      expect(resolveAvatarUrl('avatar_jesus_al_cuadrado')).toBeTruthy();
      expect(resolveAvatarUrl('avatar_patria_milagro')).toBeTruthy();
      expect(resolveAvatarUrl('avatar_nino_betun')).toBeTruthy();
    });

    it('retorna null para emojis o símbolos simples', () => {
      expect(resolveAvatarUrl('🔥')).toBeNull();
      expect(resolveAvatarUrl('🧠')).toBeNull();
    });
  });

  describe('Pista Legendaria de YouTube', () => {
    it('cuenta con el ID y enlace exacto proporcionado por el usuario', () => {
      expect(LEGENDARY_TRACK.id).toBe('ga4_APeE4Yg');
      expect(LEGENDARY_TRACK.youtubeUrl).toContain('ga4_APeE4Yg');
      expect(LEGENDARY_TRACK.title).toBe('Bailando');
      expect(LEGENDARY_TRACK.artist).toContain('Enrique Iglesias');
      expect(LEGENDARY_TRACK.tag).toBe('Legendaria');
    });
  });
});

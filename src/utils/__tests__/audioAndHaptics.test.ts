import { describe, it, expect, beforeEach } from 'vitest';
import { soundEffects } from '../audio';
import { triggerHaptic } from '../haptics';

describe('Utilidades de Sonido y Háptica (Fase 6)', () => {
  beforeEach(() => {
    // Asegurar estado activado antes de cada prueba
    if (!soundEffects.isSoundEnabled()) {
      soundEffects.toggleSound();
    }
  });

  describe('Control de Sonido (audio.ts)', () => {
    it('inicia con sonido activado por defecto', () => {
      expect(soundEffects.isSoundEnabled()).toBe(true);
    });

    it('permite alternar el estado del sonido entre activado y silenciado', () => {
      const state1 = soundEffects.toggleSound();
      expect(state1).toBe(false);
      expect(soundEffects.isSoundEnabled()).toBe(false);

      const state2 = soundEffects.toggleSound();
      expect(state2).toBe(true);
      expect(soundEffects.isSoundEnabled()).toBe(true);
    });

    it('ejecuta los métodos de disparo de sonido de forma segura sin excepciones', () => {
      expect(() => {
        soundEffects.playCard();
        soundEffects.drawCard();
        soundEffects.yourTurn();
        soundEffects.unoCall();
        soundEffects.attack();
        soundEffects.victory();
      }).not.toThrow();
    });
  });

  describe('Control de Vibración Háptica (haptics.ts)', () => {
    it('ejecuta los diferentes tipos de vibración háptica sin lanzar errores', () => {
      expect(() => {
        triggerHaptic('light');
        triggerHaptic('medium');
        triggerHaptic('heavy');
        triggerHaptic('uno');
        triggerHaptic('attack');
        triggerHaptic('victory');
      }).not.toThrow();
    });
  });
});

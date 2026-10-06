/**
 * Utilidad de vibración háptica para dispositivos móviles (navigator.vibrate).
 * Proporciona respuesta física instantánea al interactuar con las cartas.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'uno' | 'attack' | 'victory';

export function triggerHaptic(type: HapticType = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'heavy':
        navigator.vibrate([50, 40, 50]);
        break;
      case 'uno':
        navigator.vibrate([40, 60, 40, 60, 100]);
        break;
      case 'attack':
        navigator.vibrate([70, 50, 90]);
        break;
      case 'victory':
        navigator.vibrate([80, 50, 80, 50, 160]);
        break;
    }
  } catch {
    // Los navegadores restringen vibraciones no iniciadas por gestos del usuario
  }
}

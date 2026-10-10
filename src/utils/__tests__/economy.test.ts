import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRewardsTable,
  calculateRankReward,
  calculateMatchRankings,
  recordMatchReward,
  getPlayerEconomy,
  savePlayerEconomy,
  purchaseShopItem,
  redeemPromoCode,
  togglePlaylistTrack,
  setPlaylist,
  SHOP_CATALOG,
  formatCoins,
  isMobileDevice,
  getEffectiveTrackValue,
} from '../economy';

// Mock in-memory localStorage for node test runner
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Sistema de Economía y Monedas (economy.ts)', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  describe('Escalado de Recompensas', () => {
    it('otorga más monedas por victoria en partidas de 6 jugadores que en partidas de 2 jugadores', () => {
      const reward2 = calculateRankReward(1, 2);
      const reward6 = calculateRankReward(1, 6);

      expect(reward6).toBeGreaterThan(reward2);
      expect(reward2).toBe(100);
      expect(reward6).toBe(450);
    });

    it('la recompensa disminuye gradualmente según el puesto obtenido', () => {
      const table6 = getRewardsTable(6);
      expect(table6[1]).toBeGreaterThan(table6[2]);
      expect(table6[2]).toBeGreaterThan(table6[3]);
      expect(table6[3]).toBeGreaterThan(table6[4]);
      expect(table6[4]).toBeGreaterThan(table6[5]);
      expect(table6[5]).toBeGreaterThan(table6[6]);
    });

    it('calcula rankings y podio de jugadores por menor cantidad de cartas restantes', () => {
      const mockPlayers = [
        { uid: 'p1', name: 'Jugador 1', avatar: '😎', hand: [{}, {}, {}] }, // 3 cartas
        { uid: 'p2', name: 'Ganador', avatar: '🏆', hand: [] }, // 0 cartas (ganador)
        { uid: 'p3', name: 'Jugador 3', avatar: '🤖', hand: [{}, {}] }, // 2 cartas
      ];

      const ranked = calculateMatchRankings(mockPlayers, 'p2');
      expect(ranked[0].uid).toBe('p2');
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].cardsCount).toBe(0);

      // p3 tenía 2 cartas -> Puesto 2
      expect(ranked[1].uid).toBe('p3');
      expect(ranked[1].rank).toBe(2);

      // p1 tenía 3 cartas -> Puesto 3
      expect(ranked[2].uid).toBe('p1');
      expect(ranked[2].rank).toBe(3);
    });
  });

  describe('Persistencia y Gestión de Balance en localStorage', () => {
    it('guarda y recupera el balance de monedas y victorias', () => {
      const initial = getPlayerEconomy();
      expect(initial.coins).toBe(0);
      expect(initial.victories).toBe(0);

      const record1 = recordMatchReward(1, 4);
      expect(record1.coinsEarned).toBe(260);
      expect(record1.isVictory).toBe(true);

      const saved = getPlayerEconomy();
      expect(saved.coins).toBe(260);
      expect(saved.victories).toBe(1);
      expect(saved.gamesPlayed).toBe(1);
    });
  });

  describe('Tienda y Compra de Recompensas', () => {
    it('incluye los avatares especiales en el catálogo con sus rarezas y rutas', () => {
      const avatarItems = SHOP_CATALOG.filter((i) => i.type === 'avatar');
      expect(avatarItems).toHaveLength(4);

      const patriaItem = SHOP_CATALOG.find((i) => i.id === 'avatar_patria_milagro');
      expect(patriaItem).toBeDefined();
      expect(patriaItem?.value).toContain('patria_milagro');
      expect(patriaItem?.price).toBe(2500);
      expect(patriaItem?.rarity).toBe('legendario');

      const sixsevenaldoItem = SHOP_CATALOG.find((i) => i.id === 'avatar_sixsevenaldo');
      expect(sixsevenaldoItem).toBeDefined();
      expect(sixsevenaldoItem?.name).toBe('sixsevenaldo');
      expect(sixsevenaldoItem?.rarity).toBe('épico');
      expect(sixsevenaldoItem?.price).toBe(1500);

      const jesusItem = SHOP_CATALOG.find((i) => i.id === 'avatar_jesus_al_cuadrado');
      expect(jesusItem).toBeDefined();
      expect(jesusItem?.name).toBe('Jesús al cuadrado');
      expect(jesusItem?.rarity).toBe('épico');
      expect(jesusItem?.price).toBe(1500);

      const ninoBetunItem = SHOP_CATALOG.find((i) => i.id === 'avatar_nino_betun');
      expect(ninoBetunItem).toBeDefined();
      expect(ninoBetunItem?.name).toBe('Niño Betún');
      expect(ninoBetunItem?.rarity).toBe('legendario');
      expect(ninoBetunItem?.codeOnly).toBe(true);
      expect(ninoBetunItem?.hidden).toBe(true);

      // Los avatares públicos de la tienda solo muestran los 3 avatares visibles
      const visibleAvatars = SHOP_CATALOG.filter((i) => i.type === 'avatar' && !i.hidden);
      expect(visibleAvatars).toHaveLength(3);

      // Incluye las pistas de música configuradas
      const musicItems = SHOP_CATALOG.filter((i) => i.type === 'music');
      expect(musicItems).toHaveLength(3);

      const musicaFisica = SHOP_CATALOG.find((i) => i.id === 'music_fisica_quimica');
      expect(musicaFisica?.price).toBe(3500); // Más cara que patria milagro (2500)
      expect(musicaFisica?.rarity).toBe('legendario');

      const musicaAura = SHOP_CATALOG.find((i) => i.id === 'music_aura');
      expect(musicaAura?.price).toBe(2000); // Más cara que avatares épicos (1500)
      expect(musicaAura?.rarity).toBe('épico');
    });

    it('rechaza la compra si las monedas son insuficientes', () => {
      savePlayerEconomy({
        coins: 100,
        victories: 0,
        gamesPlayed: 0,
        unlockedAvatars: [],
        unlockedMusic: [],
        equippedMusic: null,
        equippedPlaylist: [],
        redeemedCodes: [],
      });

      const res = purchaseShopItem('avatar_patria_milagro');
      expect(res.success).toBe(false);
      expect(res.message).toContain('insuficientes');
    });

    it('permite comprar avatares épicos si tiene saldo suficiente y descuenta el precio', () => {
      savePlayerEconomy({
        coins: 3000,
        victories: 2,
        gamesPlayed: 5,
        unlockedAvatars: [],
        unlockedMusic: [],
        equippedMusic: null,
        equippedPlaylist: [],
        redeemedCodes: [],
      });

      const res = purchaseShopItem('avatar_sixsevenaldo');
      expect(res.success).toBe(true);

      const updated = getPlayerEconomy();
      expect(updated.coins).toBe(1500); // 3000 - 1500
      expect(updated.unlockedAvatars).toContain('avatar_sixsevenaldo');
    });

    it('no permite comprar con monedas un avatar exclusivo de código (Niño Betún)', () => {
      savePlayerEconomy({
        coins: 50000,
        victories: 10,
        gamesPlayed: 10,
        unlockedAvatars: [],
        unlockedMusic: [],
        equippedMusic: null,
        equippedPlaylist: [],
        redeemedCodes: [],
      });

      const res = purchaseShopItem('avatar_nino_betun');
      expect(res.success).toBe(false);
      expect(res.message).toContain('código secreto');
    });

    it('permite comprar música y la agrega automáticamente al bucle de lobby', () => {
      savePlayerEconomy({
        coins: 5000,
        victories: 5,
        gamesPlayed: 10,
        unlockedAvatars: [],
        unlockedMusic: [],
        equippedMusic: null,
        equippedPlaylist: [],
        redeemedCodes: [],
      });

      const res = purchaseShopItem('music_fisica_quimica');
      expect(res.success).toBe(true);

      const updated = getPlayerEconomy();
      expect(updated.coins).toBe(1500); // 5000 - 3500
      expect(updated.unlockedMusic).toContain('music_fisica_quimica');
      expect(updated.equippedMusic).toBe('music_fisica_quimica');
      expect(updated.equippedPlaylist).toContain('music_fisica_quimica');
    });

    it('gestiona la alternancia de pistas en el bucle continuo (1, 2 o más pistas)', () => {
      savePlayerEconomy({
        coins: 10000,
        victories: 5,
        gamesPlayed: 10,
        unlockedAvatars: [],
        unlockedMusic: ['music_fisica_quimica', 'music_aura'],
        equippedMusic: 'music_fisica_quimica',
        equippedPlaylist: ['music_fisica_quimica'],
        redeemedCodes: [],
      });

      // Añadir la segunda canción al bucle
      const eco2 = togglePlaylistTrack('music_aura');
      expect(eco2.equippedPlaylist).toEqual(['music_fisica_quimica', 'music_aura']);

      // Quitar la primera canción del bucle
      const eco1 = togglePlaylistTrack('music_fisica_quimica');
      expect(eco1.equippedPlaylist).toEqual(['music_aura']);
      expect(eco1.equippedMusic).toBe('music_aura');

      // Establecer lista vacía
      const eco0 = setPlaylist([]);
      expect(eco0.equippedPlaylist).toEqual([]);
      expect(eco0.equippedMusic).toBeNull();
    });
  });

  describe('Código Promocional Tester y Niño Betún', () => {
    it('canjea el código BIENVENIDOALAPATRIAMILAGRO y otorga 100,000,000 de monedas', () => {
      const res = redeemPromoCode('BIENVENIDOALAPATRIAMILAGRO');
      expect(res.success).toBe(true);
      expect(res.coinsAdded).toBe(100_000_000);

      const updated = getPlayerEconomy();
      expect(updated.coins).toBe(100_000_000);
      expect(updated.redeemedCodes).toContain('BIENVENIDOALAPATRIAMILAGRO');
    });

    it('ignora mayúsculas/minúsculas y espacios en el código', () => {
      const res = redeemPromoCode('  bienvenidoalapatriamilagro  ');
      expect(res.success).toBe(true);
      expect(res.coinsAdded).toBe(100_000_000);
    });

    it('canjea el código niñobetun y desbloquea el avatar de Niño Betún', () => {
      const res = redeemPromoCode('niñobetun');
      expect(res.success).toBe(true);
      expect(res.avatarUnlocked).toBe('avatar_nino_betun');

      const updated = getPlayerEconomy();
      expect(updated.unlockedAvatars).toContain('avatar_nino_betun');
      expect(updated.redeemedCodes).toContain('NIÑOBETUN');
    });

    it('soporta variantes como NIÑOBETUN y ninobetun sin tilde', () => {
      const res = redeemPromoCode('  ninobetun  ');
      expect(res.success).toBe(true);
      expect(res.avatarUnlocked).toBe('avatar_nino_betun');
    });

    it('no permite canjear dos veces el avatar de Niño Betún', () => {
      redeemPromoCode('niñobetun');
      const resRepeat = redeemPromoCode('niñobetun');
      expect(resRepeat.success).toBe(false);
      expect(resRepeat.message).toContain('anteriormente');
    });

    it('canjea el código patria milagro y desbloquea el himno de la Patria Milagro', () => {
      const res = redeemPromoCode('patria milagro');
      expect(res.success).toBe(true);
      expect(res.avatarUnlocked).toBe('music_patria_milagro');

      const updated = getPlayerEconomy();
      expect(updated.unlockedMusic).toContain('music_patria_milagro');
      expect(updated.equippedMusic).toBe('music_patria_milagro');
      expect(updated.redeemedCodes).toContain('PATRIAMILAGRO');
    });

    it('soporta la variante patriamilagro sin espacios', () => {
      // Limpiar estado
      savePlayerEconomy({
        coins: 0,
        victories: 0,
        gamesPlayed: 0,
        unlockedAvatars: [],
        unlockedMusic: [],
        equippedMusic: null,
        equippedPlaylist: [],
        redeemedCodes: [],
      });
      const res = redeemPromoCode('patriamilagro');
      expect(res.success).toBe(true);
      expect(res.avatarUnlocked).toBe('music_patria_milagro');
    });

    it('rechaza códigos inválidos', () => {
      const res = redeemPromoCode('CODIGO_FALSO');
      expect(res.success).toBe(false);
    });
  });

  describe('Formateo de Monedas', () => {
    it('formatea 100M, 1.5K y números pequeños adecuadamente', () => {
      expect(formatCoins(100_000_000)).toBe('100.0M');
      expect(formatCoins(25_000)).toBe('25.0K');
      expect(formatCoins(450)).toBe('450');
    });
  });

  describe('Compatibilidad Móvil de Reproducción Musical', () => {
    const musicaFisica = SHOP_CATALOG.find((i) => i.id === 'music_fisica_quimica')!;
    const musicaAura = SHOP_CATALOG.find((i) => i.id === 'music_aura')!;

    it('Bailando cuenta con mobileValue compatible sin restricciones de embebido móvil', () => {
      expect(musicaFisica.value).toBe('ga4_APeE4Yg');
      expect(musicaFisica.mobileValue).toBe('EZ4cDmM4AwM');
    });

    it('retorna value en entorno desktop', () => {
      // En entorno node/desktop sin userAgent móvil
      expect(getEffectiveTrackValue(musicaFisica, false)).toBe('ga4_APeE4Yg');
      expect(getEffectiveTrackValue(musicaAura, false)).toBe('-xUkPo2q3zc');
    });

    it('retorna mobileValue cuando forceFallback es true o en móvil', () => {
      expect(getEffectiveTrackValue(musicaFisica, true)).toBe('EZ4cDmM4AwM');
      // Las canciones sin mobileValue mantienen su value original
      expect(getEffectiveTrackValue(musicaAura, true)).toBe('-xUkPo2q3zc');
    });

    it('detecta correctamente navegadores móviles vía UserAgent', () => {
      const originalNavigator = globalThis.navigator;
      try {
        // Simular iPhone
        Object.defineProperty(globalThis, 'navigator', {
          value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', maxTouchPoints: 5 },
          configurable: true,
        });
        expect(isMobileDevice()).toBe(true);
        expect(getEffectiveTrackValue(musicaFisica)).toBe('EZ4cDmM4AwM');

        // Simular Android
        Object.defineProperty(globalThis, 'navigator', {
          value: { userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)', maxTouchPoints: 5 },
          configurable: true,
        });
        expect(isMobileDevice()).toBe(true);
        expect(getEffectiveTrackValue(musicaFisica)).toBe('EZ4cDmM4AwM');

        // Simular Desktop Windows
        Object.defineProperty(globalThis, 'navigator', {
          value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', maxTouchPoints: 0 },
          configurable: true,
        });
        expect(isMobileDevice()).toBe(false);
        expect(getEffectiveTrackValue(musicaFisica)).toBe('ga4_APeE4Yg');
      } finally {
        Object.defineProperty(globalThis, 'navigator', {
          value: originalNavigator,
          configurable: true,
        });
      }
    });
  });
});

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
  SHOP_CATALOG,
  formatCoins,
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
    it('incluye únicamente el avatar especial "Patria Milagro" en el catálogo con ruta de imagen', () => {
      expect(SHOP_CATALOG).toHaveLength(1);
      const patriaItem = SHOP_CATALOG.find((i) => i.id === 'avatar_patria_milagro');
      expect(patriaItem).toBeDefined();
      expect(patriaItem?.value).toContain('patria_milagro');
      expect(patriaItem?.price).toBe(2500);
      expect(patriaItem?.rarity).toBe('legendario');
    });

    it('rechaza la compra si las monedas son insuficientes', () => {
      savePlayerEconomy({
        coins: 100,
        victories: 0,
        gamesPlayed: 0,
        unlockedAvatars: [],
        redeemedCodes: [],
      });

      const res = purchaseShopItem('avatar_patria_milagro');
      expect(res.success).toBe(false);
      expect(res.message).toContain('insuficientes');
    });

    it('permite comprar el avatar si tiene saldo suficiente y descuenta el precio', () => {
      savePlayerEconomy({
        coins: 3000,
        victories: 2,
        gamesPlayed: 5,
        unlockedAvatars: [],
        redeemedCodes: [],
      });

      const res = purchaseShopItem('avatar_patria_milagro');
      expect(res.success).toBe(true);

      const updated = getPlayerEconomy();
      expect(updated.coins).toBe(500); // 3000 - 2500
      expect(updated.unlockedAvatars).toContain('avatar_patria_milagro');
    });
  });

  describe('Código Promocional Tester', () => {
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
});

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
  KNOWN_TRACK_DURATIONS,
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
      expect(avatarItems).toHaveLength(8);

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

      // Nuevos avatares épicos con previsualización oculta
      const elTigreItem = SHOP_CATALOG.find((i) => i.id === 'avatar_el_tigre');
      expect(elTigreItem).toBeDefined();
      expect(elTigreItem?.name).toBe('El tigre');
      expect(elTigreItem?.rarity).toBe('épico');
      expect(elTigreItem?.price).toBe(1500);
      expect(elTigreItem?.hidePreview).toBe(true);

      const proyectadaItem = SHOP_CATALOG.find((i) => i.id === 'avatar_proyectada_de_cuerpo');
      expect(proyectadaItem).toBeDefined();
      expect(proyectadaItem?.name).toBe('Proyectada de cuerpo');
      expect(proyectadaItem?.rarity).toBe('épico');
      expect(proyectadaItem?.price).toBe(1500);
      expect(proyectadaItem?.hidePreview).toBeFalsy();

      const uribeItem = SHOP_CATALOG.find((i) => i.id === 'avatar_uribe');
      expect(uribeItem).toBeDefined();
      expect(uribeItem?.name).toBe('El mejor presidente de colombia');
      expect(uribeItem?.rarity).toBe('épico');
      expect(uribeItem?.price).toBe(1500);
      expect(uribeItem?.hidePreview).toBe(true);

      const winnieItem = SHOP_CATALOG.find((i) => i.id === 'avatar_winnie_pooh');
      expect(winnieItem).toBeDefined();
      expect(winnieItem?.name).toBe('winnie pooh');
      expect(winnieItem?.rarity).toBe('épico');
      expect(winnieItem?.price).toBe(1500);
      expect(winnieItem?.hidePreview).toBe(true);

      const ninoBetunItem = SHOP_CATALOG.find((i) => i.id === 'avatar_nino_betun');
      expect(ninoBetunItem).toBeDefined();
      expect(ninoBetunItem?.name).toBe('Niño Betún');
      expect(ninoBetunItem?.rarity).toBe('legendario');
      expect(ninoBetunItem?.codeOnly).toBe(true);
      expect(ninoBetunItem?.hidden).toBe(true);

      // Los avatares públicos de la tienda muestran los 7 avatares no ocultos
      const visibleAvatars = SHOP_CATALOG.filter((i) => i.type === 'avatar' && !i.hidden);
      expect(visibleAvatars).toHaveLength(7);

      // Incluye las pistas de música configuradas (públicas y secretas)
      const musicItems = SHOP_CATALOG.filter((i) => i.type === 'music');
      expect(musicItems).toHaveLength(14);

      const musicaFisica = SHOP_CATALOG.find((i) => i.id === 'music_fisica_quimica');
      expect(musicaFisica?.price).toBe(3500);
      expect(musicaFisica?.rarity).toBe('legendario');

      const musicaAura = SHOP_CATALOG.find((i) => i.id === 'music_aura');
      expect(musicaAura?.price).toBe(2000);
      expect(musicaAura?.rarity).toBe('épico');

      const musicaReyPop = SHOP_CATALOG.find((i) => i.id === 'music_rey_del_pop');
      expect(musicaReyPop?.price).toBe(3500);
      expect(musicaReyPop?.rarity).toBe('legendario');
      expect(musicaReyPop?.value).toBe('CPK_IdHe1Yg');

      const musicaTutoriales = SHOP_CATALOG.find((i) => i.id === 'music_tutoriales');
      expect(musicaTutoriales?.price).toBe(2000);
      expect(musicaTutoriales?.rarity).toBe('épico');
      expect(musicaTutoriales?.value).toBe('TW9d8vYrVFQ');

      const musicaMichael = SHOP_CATALOG.find((i) => i.id === 'music_michael_jackson');
      expect(musicaMichael?.price).toBe(2000);
      expect(musicaMichael?.rarity).toBe('épico');
      expect(musicaMichael?.value).toBe('jAbWrr7njy8');

      const musicaMotivacion = SHOP_CATALOG.find((i) => i.id === 'music_motivacion_nueva_generacion');
      expect(musicaMotivacion?.price).toBe(3500);
      expect(musicaMotivacion?.rarity).toBe('legendario');
      expect(musicaMotivacion?.value).toBe('qQ1CPE_pkJg');

      const musicaPoliticos = SHOP_CATALOG.find((i) => i.id === 'music_politicos');
      expect(musicaPoliticos?.price).toBe(3500);
      expect(musicaPoliticos?.rarity).toBe('legendario');
      expect(musicaPoliticos?.value).toBe('hcJ5WwGY3JI');
      expect(musicaPoliticos?.duration).toBe(15);
      expect(KNOWN_TRACK_DURATIONS['music_politicos']).toBe(15);

      const musicaLamento = SHOP_CATALOG.find((i) => i.id === 'music_lamento');
      expect(musicaLamento?.price).toBe(2000);
      expect(musicaLamento?.rarity).toBe('épico');
      expect(musicaLamento?.value).toBe('lYC5wlY8d6A');

      const musicaAbelardo = SHOP_CATALOG.find((i) => i.id === 'music_fans_abelardo');
      expect(musicaAbelardo?.price).toBe(2000);
      expect(musicaAbelardo?.rarity).toBe('épico');
      expect(musicaAbelardo?.value).toBe('5_dtgsbQlYg');
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

    it('canjea el código Homero y desbloquea La canción que hizo temblar el arte moderno', () => {
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
      const res = redeemPromoCode('Homero');
      expect(res.success).toBe(true);
      expect(res.avatarUnlocked).toBe('music_arte_moderno_homero');

      const updated = getPlayerEconomy();
      expect(updated.unlockedMusic).toContain('music_arte_moderno_homero');
      expect(updated.redeemedCodes).toContain('HOMERO');

      // No permite canje duplicado
      const resRepeat = redeemPromoCode('homero');
      expect(resRepeat.success).toBe(false);
    });

    it('canjea el código paga?na (o pagana) y desbloquea Fiesta que nadie paga', () => {
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
      const res = redeemPromoCode('paga?na');
      expect(res.success).toBe(true);
      expect(res.avatarUnlocked).toBe('music_fiesta_nadie_paga');

      const updated = getPlayerEconomy();
      expect(updated.unlockedMusic).toContain('music_fiesta_nadie_paga');
      expect(updated.redeemedCodes).toContain('PAGA?NA');
    });

    it('canjea el código naguaro y desbloquea No hay barro', () => {
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
      const res = redeemPromoCode('naguaro');
      expect(res.success).toBe(true);
      expect(res.avatarUnlocked).toBe('music_no_hay_barro');

      const updated = getPlayerEconomy();
      expect(updated.unlockedMusic).toContain('music_no_hay_barro');
      expect(updated.redeemedCodes).toContain('NAGUARO');
    });

    it('canjea el código kevingordo y desbloquea Si feid fuera bueno', () => {
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
      const res = redeemPromoCode('kevingordo');
      expect(res.success).toBe(true);
      expect(res.avatarUnlocked).toBe('music_si_feid_fuera_bueno');

      const updated = getPlayerEconomy();
      expect(updated.unlockedMusic).toContain('music_si_feid_fuera_bueno');
      expect(updated.redeemedCodes).toContain('KEVINGORDO');
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

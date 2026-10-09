/**
 * Sistema de economía, monedas y tienda para ALGEBRA UNO.
 * Gestiona el balance de monedas, historial de victorias,
 * desbloqueo y compra de recompensas (avatares exclusivos),
 * y canje de códigos promocionales con persistencia local garantizada.
 */

export interface ShopItem {
  id: string;
  name: string;
  type: 'avatar';
  value: string; // Ruta de imagen o emoji
  price: number;
  description: string;
  rarity: 'común' | 'raro' | 'épico' | 'legendario';
}

export interface PlayerEconomy {
  coins: number;
  victories: number;
  gamesPlayed: number;
  unlockedAvatars: string[]; // IDs de ítems desbloqueados
  redeemedCodes: string[];
}

const ECONOMY_STORAGE_KEY = 'algebra_uno_player_economy';

export const SHOP_CATALOG: ShopItem[] = [
  {
    id: 'avatar_patria_milagro',
    name: 'Patria Milagro',
    type: 'avatar',
    value: '/avatars/patria_milagro.jpg',
    price: 2500,
    description: 'Avatar legendario del Patriota. Demuestra tu devoción y disciplina algebraica en la mesa.',
    rarity: 'legendario',
  },
  {
    id: 'avatar_corona_oro',
    name: 'Rey del Álgebra',
    type: 'avatar',
    value: '👑',
    price: 1200,
    description: 'Corona dorada reservada para los maestros del cálculo rápido.',
    rarity: 'épico',
  },
  {
    id: 'avatar_dragon_fuego',
    name: 'Dragón Incandescente',
    type: 'avatar',
    value: '🐉',
    price: 800,
    description: 'Espíritu feroz para intimidar a tus oponentes en partidas reñidas.',
    rarity: 'raro',
  },
  {
    id: 'avatar_galaxia',
    name: 'Viajero Cósmico',
    type: 'avatar',
    value: '🌌',
    price: 500,
    description: 'Mente infinita como el cosmos algebraico.',
    rarity: 'común',
  },
];

const DEFAULT_ECONOMY: PlayerEconomy = {
  coins: 0,
  victories: 0,
  gamesPlayed: 0,
  unlockedAvatars: [],
  redeemedCodes: [],
};

/**
 * Obtiene el estado económico del jugador desde localStorage.
 */
export function getPlayerEconomy(): PlayerEconomy {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(ECONOMY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          coins: typeof parsed.coins === 'number' ? parsed.coins : 0,
          victories: typeof parsed.victories === 'number' ? parsed.victories : 0,
          gamesPlayed: typeof parsed.gamesPlayed === 'number' ? parsed.gamesPlayed : 0,
          unlockedAvatars: Array.isArray(parsed.unlockedAvatars) ? parsed.unlockedAvatars : [],
          redeemedCodes: Array.isArray(parsed.redeemedCodes) ? parsed.redeemedCodes : [],
        };
      }
    }
  } catch {
    // Fallback silencioso
  }
  return { ...DEFAULT_ECONOMY };
}

/**
 * Guarda el estado económico en localStorage.
 */
export function savePlayerEconomy(economy: PlayerEconomy): PlayerEconomy {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ECONOMY_STORAGE_KEY, JSON.stringify(economy));
    }
  } catch {
    // Fallback en entornos restringidos
  }
  return economy;
}

/**
 * Añade monedas al balance del jugador.
 */
export function addCoins(amount: number): number {
  const current = getPlayerEconomy();
  const nextCoins = Math.max(0, current.coins + amount);
  savePlayerEconomy({ ...current, coins: nextCoins });
  return nextCoins;
}

/**
 * Tabla de recompensas en monedas por puesto según la cantidad de jugadores en la partida.
 * Partidas con más jugadores (hasta 6) tienen un pozo y recompensas mucho más altas.
 */
export function getRewardsTable(totalPlayers: number): Record<number, number> {
  const clampedPlayers = Math.max(2, Math.min(6, totalPlayers));
  switch (clampedPlayers) {
    case 2:
      return { 1: 100, 2: 30 };
    case 3:
      return { 1: 180, 2: 80, 3: 30 };
    case 4:
      return { 1: 260, 2: 130, 3: 60, 4: 25 };
    case 5:
      return { 1: 350, 2: 180, 3: 90, 4: 40, 5: 15 };
    case 6:
    default:
      return { 1: 450, 2: 240, 3: 120, 4: 60, 5: 30, 6: 15 };
  }
}

/**
 * Calcula la recompensa para un jugador dado su puesto y total de jugadores.
 */
export function calculateRankReward(rank: number, totalPlayers: number): number {
  const table = getRewardsTable(totalPlayers);
  return table[rank] || 10;
}

export interface MatchPlayerResult {
  uid: string;
  name: string;
  avatar: string;
  cardsCount: number;
  rank: number;
  coinsEarned: number;
}

/**
 * Ordena y clasifica a todos los jugadores de la partida según el ganador y cartas restantes.
 */
export function calculateMatchRankings(
  players: Array<{ uid: string; name: string; avatar: string; hand: unknown[] }>,
  winnerUid: string | null
): MatchPlayerResult[] {
  const total = players.length;
  // El ganador siempre es top 1 (0 cartas o winnerUid)
  const winner = players.find((p) => p.uid === winnerUid) || players[0];
  const others = players.filter((p) => p.uid !== winner.uid);

  // Ordenar los restantes por menor cantidad de cartas en mano
  others.sort((a, b) => a.hand.length - b.hand.length);

  const rankedList = [winner, ...others];

  return rankedList.map((p, idx) => {
    const rank = idx + 1;
    const coinsEarned = calculateRankReward(rank, total);
    return {
      uid: p.uid,
      name: p.name,
      avatar: p.avatar,
      cardsCount: p.uid === winner.uid ? 0 : p.hand.length,
      rank,
      coinsEarned,
    };
  });
}

/**
 * Registra el fin de partida para el jugador local y suma sus monedas.
 */
export function recordMatchReward(
  rank: number,
  totalPlayers: number
): { coinsEarned: number; newTotalCoins: number; isVictory: boolean } {
  const coinsEarned = calculateRankReward(rank, totalPlayers);
  const current = getPlayerEconomy();
  const isVictory = rank === 1;

  const updated: PlayerEconomy = {
    ...current,
    coins: current.coins + coinsEarned,
    victories: isVictory ? current.victories + 1 : current.victories,
    gamesPlayed: current.gamesPlayed + 1,
  };

  savePlayerEconomy(updated);
  return {
    coinsEarned,
    newTotalCoins: updated.coins,
    isVictory,
  };
}

/**
 * Compra un ítem de la tienda con monedas.
 */
export function purchaseShopItem(itemId: string): { success: boolean; message: string; updatedItem?: ShopItem } {
  const item = SHOP_CATALOG.find((i) => i.id === itemId);
  if (!item) {
    return { success: false, message: 'El ítem no existe en el catálogo.' };
  }

  const economy = getPlayerEconomy();
  if (economy.unlockedAvatars.includes(item.id)) {
    return { success: false, message: 'Ya has adquirido este ítem.' };
  }

  if (economy.coins < item.price) {
    return {
      success: false,
      message: `Monedas insuficientes. Necesitas ${item.price.toLocaleString()} 🪙 y tienes ${economy.coins.toLocaleString()} 🪙.`,
    };
  }

  const updated: PlayerEconomy = {
    ...economy,
    coins: economy.coins - item.price,
    unlockedAvatars: [...economy.unlockedAvatars, item.id],
  };

  savePlayerEconomy(updated);
  return {
    success: true,
    message: `¡Has adquirido ${item.name}! Ya puedes usarlo de avatar.`,
    updatedItem: item,
  };
}

/**
 * Canjea un código promocional.
 * Código solicitado: 'BIENVENIDOALAPATRIAMILAGRO' otorga 100,000,000 monedas (100M).
 */
export function redeemPromoCode(code: string): { success: boolean; message: string; coinsAdded?: number } {
  const normalized = code.trim().toUpperCase();

  if (normalized === 'BIENVENIDOALAPATRIAMILAGRO') {
    const reward = 100_000_000;
    const economy = getPlayerEconomy();

    const updated: PlayerEconomy = {
      ...economy,
      coins: economy.coins + reward,
      redeemedCodes: Array.from(new Set([...economy.redeemedCodes, normalized])),
    };

    savePlayerEconomy(updated);
    return {
      success: true,
      message: '🎉 ¡CÓDIGO LEGENDARIO CANJEADO! Has recibido 100,000,000 de monedas.',
      coinsAdded: reward,
    };
  }

  return {
    success: false,
    message: 'El código promocional no es válido o ha expirado.',
  };
}

/**
 * Formatea cantidades de monedas de manera legible (ej. 100M, 1.5K, etc.)
 */
export function formatCoins(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 10_000) {
    return `${(amount / 1_000).toFixed(1)}K`;
  }
  return amount.toLocaleString();
}

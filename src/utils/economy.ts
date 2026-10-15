/**
 * Sistema de economía, monedas y tienda para ALGEBRA UNO.
 * Gestiona el balance de monedas, historial de victorias,
 * desbloqueo y compra de recompensas (avatares exclusivos),
 * y canje de códigos promocionales con persistencia local garantizada.
 */

export interface ShopItem {
  id: string;
  name: string;
  type: 'avatar' | 'music';
  value: string; // Ruta de imagen, emoji o ID de YouTube principal
  mobileValue?: string; // ID de YouTube alternativo compatible con reproducción móvil en caso de restricciones de embebido
  price: number;
  description: string;
  rarity: 'común' | 'raro' | 'épico' | 'legendario';
  codeOnly?: boolean;
  hidden?: boolean; // Si es true, no aparece listado públicamente en el catálogo de la tienda
  hidePreview?: boolean; // Si es true, oculta la foto con modo misterio hasta que se compre
  realTitle?: string; // Título real para pistas musicales (solo revelado al desbloquear)
  artist?: string; // Artista musical
  youtubeUrl?: string;
  duration?: number; // Duración estimada en segundos para sincronización precisa de bucle
}

export interface PlayerEconomy {
  coins: number;
  victories: number;
  gamesPlayed: number;
  unlockedAvatars: string[]; // IDs de avatares desbloqueados
  unlockedMusic: string[]; // IDs de canciones desbloqueadas
  equippedMusic: string | null; // ID de la canción en reproducción actual
  equippedPlaylist: string[]; // Lista de IDs de canciones en el bucle activo
  redeemedCodes: string[];
}

import patriaMilagroAsset from '../assets/avatars/patria_milagro.jpg';
import ninoBetunAsset from '../assets/avatars/nino_betun.jpg';
import sixsevenaldoAsset from '../assets/avatars/sixsevenaldo.jpg';
import jesusAlCuadradoAsset from '../assets/avatars/jesus_al_cuadrado.jpg';
import elTigreAsset from '../assets/avatars/El_tigre.jpg';
import proyectadaDeCuerpoAsset from '../assets/avatars/Proyectada_de_cuerpo.jpg';
import uribeAsset from '../assets/avatars/Uribe.jpg';
import winniePoohAsset from '../assets/avatars/winnie_pooh.jpg';

const ECONOMY_STORAGE_KEY = 'algebra_uno_player_economy';

export const SHOP_CATALOG: ShopItem[] = [
  // --- AVATARES EXCLUSIVOS ---
  {
    id: 'avatar_patria_milagro',
    name: 'Patria Milagro',
    type: 'avatar',
    value: patriaMilagroAsset,
    price: 2500,
    description: 'Avatar legendario del Patriota. Demuestra tu devoción y disciplina algebraica en la mesa.',
    rarity: 'legendario',
  },
  {
    id: 'avatar_sixsevenaldo',
    name: 'sixsevenaldo',
    type: 'avatar',
    value: sixsevenaldoAsset,
    price: 1500,
    description: 'Avatar épico de sixsevenaldo. Los números sagrados del álgebra en tus manos.',
    rarity: 'épico',
  },
  {
    id: 'avatar_jesus_al_cuadrado',
    name: 'Jesús al cuadrado',
    type: 'avatar',
    value: jesusAlCuadradoAsset,
    price: 1500,
    description: 'Avatar épico de Jesús al cuadrado. El poder de la risa y las matemáticas al cuadrado.',
    rarity: 'épico',
  },
  {
    id: 'avatar_el_tigre',
    name: 'El tigre',
    type: 'avatar',
    value: elTigreAsset,
    price: 1500,
    description: 'Avatar épico de El tigre.',
    rarity: 'épico',
    hidePreview: true,
  },
  {
    id: 'avatar_proyectada_de_cuerpo',
    name: 'Proyectada de cuerpo',
    type: 'avatar',
    value: proyectadaDeCuerpoAsset,
    price: 1500,
    description: 'Avatar épico de Proyectada de cuerpo.',
    rarity: 'épico',
  },
  {
    id: 'avatar_uribe',
    name: 'El mejor presidente de colombia',
    type: 'avatar',
    value: uribeAsset,
    price: 1500,
    description: 'Avatar épico de El mejor presidente de colombia.',
    rarity: 'épico',
    hidePreview: true,
  },
  {
    id: 'avatar_winnie_pooh',
    name: 'winnie pooh',
    type: 'avatar',
    value: winniePoohAsset,
    price: 1500,
    description: 'Avatar épico de winnie pooh.',
    rarity: 'épico',
    hidePreview: true,
  },
  {
    id: 'avatar_nino_betun',
    name: 'Niño Betún',
    type: 'avatar',
    value: ninoBetunAsset,
    price: 0,
    description: 'Avatar legendario secreto de Niño Betún.',
    rarity: 'legendario',
    codeOnly: true,
    hidden: true,
  },

  // --- PISTAS DE MÚSICA EXCLUSIVAS (Sin descripciones, solo títulos limpios) ---
  {
    id: 'music_fisica_quimica',
    name: 'Canción de estudiantes de Física o Química',
    type: 'music',
    value: 'ga4_APeE4Yg', // En PC reproduce el video original de estudio con letra
    mobileValue: 'EZ4cDmM4AwM', // En móviles reproduce la presentación de los Premios Billboard cantada por Enrique Iglesias, Descemer y Gente de Zona
    price: 3500,
    description: '',
    rarity: 'legendario',
    realTitle: 'Bailando',
    artist: 'Enrique Iglesias ft. Descemer Bueno, Gente De Zona',
    youtubeUrl: 'https://youtu.be/ga4_APeE4Yg?si=CX6cc6DYx5yKCwGe',
  },
  {
    id: 'music_aura',
    name: 'Canción con Aura',
    type: 'music',
    value: '-xUkPo2q3zc',
    price: 2000,
    description: '',
    rarity: 'épico',
    realTitle: 'AURA',
    artist: 'Ogryzek',
    youtubeUrl: 'https://youtu.be/-xUkPo2q3zc?si=2Jn-mqbUlN1BSYew',
  },
  {
    id: 'music_rey_del_pop',
    name: 'La mejor canción del rey del pop',
    type: 'music',
    value: 'CPK_IdHe1Yg', // Video Oficial de Bad Bunny - Si Veo a Tu Mamá
    mobileValue: 'U03nHWOSr94', // Visualizer oficial compatible sin bloqueos
    price: 3500,
    description: '',
    rarity: 'legendario',
    realTitle: 'Si Veo a Tu Mamá',
    artist: 'Bad Bunny',
    youtubeUrl: 'https://youtu.be/CPK_IdHe1Yg',
  },
  {
    id: 'music_tutoriales',
    name: 'Musica perfecta para tutoriales',
    type: 'music',
    value: 'TW9d8vYrVFQ',
    price: 2000,
    description: '',
    rarity: 'épico',
    realTitle: 'Sky High',
    artist: 'Elektronomia',
    youtubeUrl: 'https://youtu.be/TW9d8vYrVFQ?si=2AUwduRjE5536SaO',
  },
  {
    id: 'music_michael_jackson',
    name: 'La mejor canción de michael jackson',
    type: 'music',
    value: 'jAbWrr7njy8',
    price: 2000,
    description: '',
    rarity: 'épico',
    realTitle: 'Mal Coñaso (Michael Jackson venezolano)',
    artist: 'Manny Blue',
    youtubeUrl: 'https://youtu.be/jAbWrr7njy8?si=bUgfwRWmsK3GUlVs',
  },
  {
    id: 'music_motivacion_nueva_generacion',
    name: 'Canción de motivación para la nueva generación',
    type: 'music',
    value: 'qQ1CPE_pkJg',
    price: 3500,
    description: '',
    rarity: 'legendario',
    realTitle: 'El Rap de los Criminales (Historias #6)',
    artist: 'WinnerMax',
    youtubeUrl: 'https://youtu.be/qQ1CPE_pkJg?si=HVsBSBNF4QfkOEWf',
  },
  {
    id: 'music_politicos',
    name: 'canción para politicos',
    type: 'music',
    value: 'hcJ5WwGY3JI',
    price: 3500,
    description: '',
    rarity: 'legendario',
    realTitle: 'Amigo Ven Vamos a Israel',
    artist: 'ElPipiKiwi',
    youtubeUrl: 'https://youtube.com/shorts/hcJ5WwGY3JI?si=C8bGbwLDAEeD2THt',
    duration: 15, // YouTube Short de exactamente 15 segundos
  },
  {
    id: 'music_lamento',
    name: 'cancion que me da mucho lamento oirla',
    type: 'music',
    value: 'lYC5wlY8d6A',
    price: 2000,
    description: '',
    rarity: 'épico',
    realTitle: 'Lamento Boliviano',
    artist: 'Los Enanitos Verdes',
    youtubeUrl: 'https://youtu.be/lYC5wlY8d6A?si=xucAe8puWVLcou76',
  },
  {
    id: 'music_fans_abelardo',
    name: 'Canción que le dedicaria a los fans de abelardo',
    type: 'music',
    value: '5_dtgsbQlYg',
    price: 2000,
    description: '',
    rarity: 'épico',
    realTitle: 'Por Qué No Se Van',
    artist: 'Los Prisioneros',
    youtubeUrl: 'https://youtu.be/5_dtgsbQlYg?si=n-HqcIVhCPSUsBdy',
  },
  // Canciones secretas por código
  {
    id: 'music_patria_milagro',
    name: 'Himno del Tigre Patriota',
    type: 'music',
    value: 'STOfx5VI0Dk',
    price: 0,
    description: '',
    rarity: 'legendario',
    realTitle: 'El Tigre de la Patria',
    artist: 'Nicolás Tovar • Abelardo De La Espriella',
    youtubeUrl: 'https://youtu.be/STOfx5VI0Dk?si=Uv5yEBpL0PtJXwQY',
    codeOnly: true,
    hidden: true,
  },
  {
    id: 'music_arte_moderno_homero',
    name: 'La canción que hizo temblar el arte moderno',
    type: 'music',
    value: 'BA8xmHKZOsE', // La Marcha de Homero Simpson (activa y reproducible)
    mobileValue: 'jfJRUsdbqY4', // La Marcha de Homero Video Original
    price: 0,
    description: '',
    rarity: 'legendario',
    realTitle: 'La Marcha de Homero Simpson',
    artist: 'Los Simpson (DJ Carlos)',
    youtubeUrl: 'https://youtu.be/BA8xmHKZOsE',
    codeOnly: true,
    hidden: true,
  },
  {
    id: 'music_fiesta_nadie_paga',
    name: 'Fiesta que nadie paga',
    type: 'music',
    value: 'zZPvME8H2Oo',
    price: 0,
    description: '',
    rarity: 'legendario',
    realTitle: 'Fiesta Pagana',
    artist: 'Mägo de Oz',
    youtubeUrl: 'https://youtu.be/zZPvME8H2Oo?si=a8_xDGTPu6r9Tw-R',
    codeOnly: true,
    hidden: true,
  },
  {
    id: 'music_no_hay_barro',
    name: 'No hay barro',
    type: 'music',
    value: '0ZJRLkILb68',
    price: 0,
    description: '',
    rarity: 'legendario',
    realTitle: 'A Little Piece of Heaven',
    artist: 'Avenged Sevenfold',
    youtubeUrl: 'https://youtu.be/0ZJRLkILb68?si=rX2JPevRUlBy-uc_',
    codeOnly: true,
    hidden: true,
  },
  {
    id: 'music_si_feid_fuera_bueno',
    name: 'Si feid fuera bueno',
    type: 'music',
    value: 'pnHXFCfW_Lc',
    price: 0,
    description: '',
    rarity: 'legendario',
    realTitle: 'Me Pongo Los Jeans De Mi Mamá',
    artist: 'sa!koro',
    youtubeUrl: 'https://youtu.be/pnHXFCfW_Lc?si=X_KLuVB2A_sWaLBs',
    codeOnly: true,
    hidden: true,
  },
];

/**
 * Duraciones esperadas en segundos de pistas del catálogo.
 * Permite que canciones y YouTube Shorts (como cancion para politicos de 15s)
 * avancen de forma precisa y puntual sin depender exclusivamente de eventos externos.
 */
export const KNOWN_TRACK_DURATIONS: Record<string, number> = {
  music_politicos: 15,
  music_michael_jackson: 75,
  music_aura: 90,
  music_motivacion_nueva_generacion: 130,
  music_si_feid_fuera_bueno: 145,
  music_rey_del_pop: 171,
  music_arte_moderno_homero: 180,
  music_fans_abelardo: 215,
  music_patria_milagro: 230,
  music_lamento: 235,
  music_tutoriales: 238,
  music_fisica_quimica: 243,
  music_fiesta_nadie_paga: 290,
  music_no_hay_barro: 480,
};

const DEFAULT_ECONOMY: PlayerEconomy = {
  coins: 0,
  victories: 0,
  gamesPlayed: 0,
  unlockedAvatars: [],
  unlockedMusic: [],
  equippedMusic: null,
  equippedPlaylist: [],
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
          unlockedMusic: Array.isArray(parsed.unlockedMusic) ? parsed.unlockedMusic : [],
          equippedMusic: typeof parsed.equippedMusic === 'string' ? parsed.equippedMusic : null,
          equippedPlaylist: Array.isArray(parsed.equippedPlaylist)
            ? parsed.equippedPlaylist
            : typeof parsed.equippedMusic === 'string' && parsed.equippedMusic
            ? [parsed.equippedMusic]
            : [],
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

  if (item.codeOnly) {
    return {
      success: false,
      message: 'Este ítem exclusivo solo se puede desbloquear canjeando su código secreto.',
    };
  }

  const economy = getPlayerEconomy();
  const isMusic = item.type === 'music';
  const isOwned = isMusic
    ? economy.unlockedMusic.includes(item.id)
    : economy.unlockedAvatars.includes(item.id);

  if (isOwned) {
    return { success: false, message: 'Ya has adquirido este ítem.' };
  }

  if (economy.coins < item.price) {
    return {
      success: false,
      message: `Monedas insuficientes. Necesitas ${item.price.toLocaleString()} 🪙 y tienes ${economy.coins.toLocaleString()} 🪙.`,
    };
  }

  const currentPlaylist = Array.isArray(economy.equippedPlaylist) ? economy.equippedPlaylist : [];
  const nextPlaylist = isMusic
    ? currentPlaylist.length === 0
      ? [item.id]
      : currentPlaylist
    : currentPlaylist;
  const nextEquipped = isMusic && !economy.equippedMusic ? item.id : economy.equippedMusic;

  const updated: PlayerEconomy = {
    ...economy,
    coins: economy.coins - item.price,
    unlockedAvatars: isMusic
      ? economy.unlockedAvatars
      : [...economy.unlockedAvatars, item.id],
    unlockedMusic: isMusic
      ? [...economy.unlockedMusic, item.id]
      : economy.unlockedMusic,
    equippedMusic: nextEquipped,
    equippedPlaylist: nextPlaylist,
  };

  savePlayerEconomy(updated);
  return {
    success: true,
    message: isMusic
      ? `¡Has adquirido "${item.name}"! Ahora puedes añadirla al bucle de música del lobby.`
      : `¡Has adquirido ${item.name}! Ya puedes usarlo de avatar.`,
    updatedItem: item,
  };
}

/**
 * Equipa una única pista de música (reemplaza la lista actual) o silencia si es null.
 */
export function equipMusic(trackId: string | null): PlayerEconomy {
  const economy = getPlayerEconomy();
  if (trackId !== null && !economy.unlockedMusic.includes(trackId)) {
    return economy;
  }
  const updated: PlayerEconomy = {
    ...economy,
    equippedMusic: trackId,
    equippedPlaylist: trackId ? [trackId] : [],
  };
  savePlayerEconomy(updated);
  return updated;
}

/**
 * Alterna una canción dentro o fuera de la lista de reproducción en bucle.
 * Si hay 2 seleccionadas, al terminar una empieza la otra y viceversa.
 */
export function togglePlaylistTrack(trackId: string): PlayerEconomy {
  const economy = getPlayerEconomy();
  if (!economy.unlockedMusic.includes(trackId)) {
    return economy;
  }
  const currentList = Array.isArray(economy.equippedPlaylist) ? economy.equippedPlaylist : [];
  const exists = currentList.includes(trackId);
  const nextList = exists
    ? currentList.filter((id) => id !== trackId)
    : [...currentList, trackId];

  let nextEquipped = economy.equippedMusic;
  if (exists) {
    if (nextEquipped === trackId) {
      nextEquipped = nextList[0] || null;
    }
  } else {
    if (!nextEquipped) {
      nextEquipped = trackId;
    }
  }

  const updated: PlayerEconomy = {
    ...economy,
    equippedPlaylist: nextList,
    equippedMusic: nextEquipped,
  };
  savePlayerEconomy(updated);
  return updated;
}

/**
 * Establece la lista de reproducción activa en bucle.
 */
export function setPlaylist(trackIds: string[]): PlayerEconomy {
  const economy = getPlayerEconomy();
  const validTracks = trackIds.filter((id) => economy.unlockedMusic.includes(id));
  const nextEquipped = validTracks.includes(economy.equippedMusic || '')
    ? economy.equippedMusic
    : validTracks[0] || null;

  const updated: PlayerEconomy = {
    ...economy,
    equippedPlaylist: validTracks,
    equippedMusic: nextEquipped,
  };
  savePlayerEconomy(updated);
  return updated;
}

/**
 * Canjea un código promocional.
 * - 'BIENVENIDOALAPATRIAMILAGRO': otorga 100,000,000 monedas (100M).
 * - 'niñobetun': desbloquea el avatar exclusivo de Niño Betún.
 * - 'patria milagro' / 'patriamilagro': desbloquea la canción secreta de la Patria Milagro.
 */
export function redeemPromoCode(code: string): {
  success: boolean;
  message: string;
  coinsAdded?: number;
  avatarUnlocked?: string;
} {
  const raw = code.trim();
  const normalized = raw.toUpperCase();
  const lower = raw.toLowerCase();
  const asciiClean = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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

  // Código secreto para desbloquear el avatar exclusivo Niño Betún
  if (
    lower === 'niñobetun' ||
    lower === 'ninobetun' ||
    asciiClean === 'ninobetun' ||
    lower === 'niño betun' ||
    lower === 'nino betun' ||
    normalized === 'NIÑOBETUN' ||
    normalized === 'NINOBETUN'
  ) {
    const economy = getPlayerEconomy();

    if (economy.unlockedAvatars.includes('avatar_nino_betun')) {
      return {
        success: false,
        message: 'Ya has desbloqueado el avatar de Niño Betún anteriormente.',
      };
    }

    const updated: PlayerEconomy = {
      ...economy,
      unlockedAvatars: Array.from(new Set([...economy.unlockedAvatars, 'avatar_nino_betun'])),
      redeemedCodes: Array.from(new Set([...economy.redeemedCodes, 'NIÑOBETUN'])),
    };

    savePlayerEconomy(updated);
    return {
      success: true,
      message: '🎉 ¡CÓDIGO SECRETO CANJEADO! Has desbloqueado el avatar exclusivo de Niño Betún.',
      avatarUnlocked: 'avatar_nino_betun',
    };
  }

  // Código secreto para desbloquear la pista exclusiva Patria Milagro
  const cleanCodeNoSpaces = asciiClean.replace(/\s+/g, '');
  if (
    cleanCodeNoSpaces === 'patriamilagro' ||
    asciiClean === 'patria milagro' ||
    normalized === 'PATRIA MILAGRO' ||
    normalized === 'PATRIAMILAGRO'
  ) {
    const economy = getPlayerEconomy();

    if (economy.unlockedMusic.includes('music_patria_milagro')) {
      return {
        success: false,
        message: 'Ya has desbloqueado la canción de la Patria Milagro anteriormente.',
      };
    }

    const currentList = Array.isArray(economy.equippedPlaylist) ? economy.equippedPlaylist : [];
    const nextList = currentList.includes('music_patria_milagro')
      ? currentList
      : [...currentList, 'music_patria_milagro'];

    const updated: PlayerEconomy = {
      ...economy,
      unlockedMusic: Array.from(new Set([...economy.unlockedMusic, 'music_patria_milagro'])),
      equippedMusic: economy.equippedMusic || 'music_patria_milagro',
      equippedPlaylist: nextList,
      redeemedCodes: Array.from(new Set([...economy.redeemedCodes, 'PATRIAMILAGRO'])),
    };

    savePlayerEconomy(updated);
    return {
      success: true,
      message: '🎉 ¡CÓDIGO SECRETO CANJEADO! Has desbloqueado el himno exclusivo de la Patria Milagro ("El Tigre de la Patria").',
      avatarUnlocked: 'music_patria_milagro',
    };
  }

  // Código secreto: Homero -> "La canción que hizo temblar el arte moderno"
  if (
    cleanCodeNoSpaces === 'homero' ||
    normalized === 'HOMERO'
  ) {
    const trackId = 'music_arte_moderno_homero';
    const economy = getPlayerEconomy();

    if (economy.unlockedMusic.includes(trackId)) {
      return {
        success: false,
        message: 'Ya has desbloqueado la canción de Homero anteriormente.',
      };
    }

    const currentList = Array.isArray(economy.equippedPlaylist) ? economy.equippedPlaylist : [];
    const nextList = currentList.includes(trackId) ? currentList : [...currentList, trackId];

    const updated: PlayerEconomy = {
      ...economy,
      unlockedMusic: Array.from(new Set([...economy.unlockedMusic, trackId])),
      equippedMusic: economy.equippedMusic || trackId,
      equippedPlaylist: nextList,
      redeemedCodes: Array.from(new Set([...economy.redeemedCodes, 'HOMERO'])),
    };

    savePlayerEconomy(updated);
    return {
      success: true,
      message: '🎉 ¡CÓDIGO SECRETO CANJEADO! Has desbloqueado "La canción que hizo temblar el arte moderno" ("La Canción de Homero").',
      avatarUnlocked: trackId,
    };
  }

  // Código secreto: paga?na -> "Fiesta que nadie paga"
  if (
    lower === 'paga?na' ||
    cleanCodeNoSpaces === 'paga?na' ||
    lower === 'pagana' ||
    cleanCodeNoSpaces === 'pagana' ||
    normalized === 'PAGA?NA' ||
    normalized === 'PAGANA'
  ) {
    const trackId = 'music_fiesta_nadie_paga';
    const economy = getPlayerEconomy();

    if (economy.unlockedMusic.includes(trackId)) {
      return {
        success: false,
        message: 'Ya has desbloqueado la canción "Fiesta que nadie paga" anteriormente.',
      };
    }

    const currentList = Array.isArray(economy.equippedPlaylist) ? economy.equippedPlaylist : [];
    const nextList = currentList.includes(trackId) ? currentList : [...currentList, trackId];

    const updated: PlayerEconomy = {
      ...economy,
      unlockedMusic: Array.from(new Set([...economy.unlockedMusic, trackId])),
      equippedMusic: economy.equippedMusic || trackId,
      equippedPlaylist: nextList,
      redeemedCodes: Array.from(new Set([...economy.redeemedCodes, 'PAGA?NA'])),
    };

    savePlayerEconomy(updated);
    return {
      success: true,
      message: '🎉 ¡CÓDIGO SECRETO CANJEADO! Has desbloqueado "Fiesta que nadie paga" ("Fiesta Pagana" - Mägo de Oz).',
      avatarUnlocked: trackId,
    };
  }

  // Código secreto: naguaro -> "No hay barro"
  if (
    cleanCodeNoSpaces === 'naguaro' ||
    normalized === 'NAGUARO' ||
    cleanCodeNoSpaces === 'nohaybarro'
  ) {
    const trackId = 'music_no_hay_barro';
    const economy = getPlayerEconomy();

    if (economy.unlockedMusic.includes(trackId)) {
      return {
        success: false,
        message: 'Ya has desbloqueado la canción "No hay barro" anteriormente.',
      };
    }

    const currentList = Array.isArray(economy.equippedPlaylist) ? economy.equippedPlaylist : [];
    const nextList = currentList.includes(trackId) ? currentList : [...currentList, trackId];

    const updated: PlayerEconomy = {
      ...economy,
      unlockedMusic: Array.from(new Set([...economy.unlockedMusic, trackId])),
      equippedMusic: economy.equippedMusic || trackId,
      equippedPlaylist: nextList,
      redeemedCodes: Array.from(new Set([...economy.redeemedCodes, 'NAGUARO'])),
    };

    savePlayerEconomy(updated);
    return {
      success: true,
      message: '🎉 ¡CÓDIGO SECRETO CANJEADO! Has desbloqueado "No hay barro" ("A Little Piece of Heaven" - Avenged Sevenfold).',
      avatarUnlocked: trackId,
    };
  }

  // Código secreto: kevingordo -> "Si feid fuera bueno"
  if (
    cleanCodeNoSpaces === 'kevingordo' ||
    normalized === 'KEVINGORDO' ||
    cleanCodeNoSpaces === 'sifeidfuerabueno'
  ) {
    const trackId = 'music_si_feid_fuera_bueno';
    const economy = getPlayerEconomy();

    if (economy.unlockedMusic.includes(trackId)) {
      return {
        success: false,
        message: 'Ya has desbloqueado la canción "Si feid fuera bueno" anteriormente.',
      };
    }

    const currentList = Array.isArray(economy.equippedPlaylist) ? economy.equippedPlaylist : [];
    const nextList = currentList.includes(trackId) ? currentList : [...currentList, trackId];

    const updated: PlayerEconomy = {
      ...economy,
      unlockedMusic: Array.from(new Set([...economy.unlockedMusic, trackId])),
      equippedMusic: economy.equippedMusic || trackId,
      equippedPlaylist: nextList,
      redeemedCodes: Array.from(new Set([...economy.redeemedCodes, 'KEVINGORDO'])),
    };

    savePlayerEconomy(updated);
    return {
      success: true,
      message: '🎉 ¡CÓDIGO SECRETO CANJEADO! Has desbloqueado "Si feid fuera bueno" ("Me Pongo Los Jeans De Mi Mamá" - sa!koro).',
      avatarUnlocked: trackId,
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

/**
 * Detecta si el entorno actual es un navegador móvil (iOS / Android / tablets).
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  const isIPadOS = (navigator.maxTouchPoints || 0) > 1 && /Macintosh/i.test(ua);
  return mobileRegex.test(ua) || isIPadOS;
}

/**
 * Obtiene el ID efectivo de YouTube para reproducir una pista, tomando en cuenta
 * si el dispositivo es móvil o si se requiere el ID de fallback libre de bloqueos de embebido.
 */
export function getEffectiveTrackValue(track: ShopItem, forceFallback = false): string {
  if (track.mobileValue && (forceFallback || isMobileDevice())) {
    return track.mobileValue;
  }
  return track.value;
}

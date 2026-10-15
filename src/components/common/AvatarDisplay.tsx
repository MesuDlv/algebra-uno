import React from 'react';
import patriaMilagroAsset from '../../assets/avatars/patria_milagro.jpg';
import ninoBetunAsset from '../../assets/avatars/nino_betun.jpg';
import sixsevenaldoAsset from '../../assets/avatars/sixsevenaldo.jpg';
import jesusAlCuadradoAsset from '../../assets/avatars/jesus_al_cuadrado.jpg';
import elTigreAsset from '../../assets/avatars/El_tigre.jpg';
import proyectadaDeCuerpoAsset from '../../assets/avatars/Proyectada_de_cuerpo.jpg';
import uribeAsset from '../../assets/avatars/Uribe.jpg';
import winniePoohAsset from '../../assets/avatars/winnie_pooh.jpg';

export {
  patriaMilagroAsset,
  ninoBetunAsset,
  sixsevenaldoAsset,
  jesusAlCuadradoAsset,
  elTigreAsset,
  proyectadaDeCuerpoAsset,
  uribeAsset,
  winniePoohAsset,
};

interface AvatarDisplayProps {
  avatar?: string;
  className?: string;
  fallbackClassName?: string;
  style?: React.CSSProperties;
}

/**
 * Retorna la posición de encuadre óptima (object-position) para cada avatar,
 * asegurando que el rostro quede perfectamente visible y centrado sin recortes molestos.
 */
export function getAvatarObjectPosition(avatar?: string): string {
  if (!avatar) return 'center center';

  // sixsevenaldo: cara y gafas en la parte superior (10%)
  if (avatar === 'avatar_sixsevenaldo' || avatar.includes('sixsevenaldo')) {
    return 'center 10%';
  }

  // Jesús al cuadrado: ambos rostros y risas en la parte superior (15%)
  if (
    avatar === 'avatar_jesus_al_cuadrado' ||
    avatar.includes('jesus_al_cuadrado') ||
    avatar.includes('jesusalcuadrado')
  ) {
    return 'center 15%';
  }

  // Niño Betún: rostro y mano ajustando gafas centrado en 25%
  if (
    avatar === 'avatar_nino_betun' ||
    avatar.includes('nino_betun') ||
    avatar.includes('niñobetun') ||
    avatar.includes('ninobetun')
  ) {
    return 'center 25%';
  }

  // Patria Milagro: saludo patriota centrado en 32%
  if (avatar === 'avatar_patria_milagro' || avatar.includes('patria_milagro')) {
    return 'center 32%';
  }

  // Uribe: rostro centrado
  if (avatar === 'avatar_uribe' || avatar.toLowerCase().includes('uribe')) {
    return 'center 20%';
  }

  // El tigre: rostro centrado
  if (avatar === 'avatar_el_tigre' || avatar.toLowerCase().includes('el_tigre') || avatar.toLowerCase().includes('el tigre')) {
    return 'center 20%';
  }

  // Proyectada de cuerpo: centrado
  if (avatar === 'avatar_proyectada_de_cuerpo' || avatar.toLowerCase().includes('proyectada')) {
    return 'center center';
  }

  // Winnie Pooh: rostro centrado
  if (avatar === 'avatar_winnie_pooh' || avatar.toLowerCase().includes('winnie')) {
    return 'center 25%';
  }

  return 'center center';
}

export function resolveAvatarUrl(avatar?: string): string | null {
  if (!avatar) return null;
  // Patria Milagro
  if (avatar === 'avatar_patria_milagro' || avatar.includes('patria_milagro')) {
    return patriaMilagroAsset;
  }
  // Niño Betún
  if (
    avatar === 'avatar_nino_betun' ||
    avatar.includes('nino_betun') ||
    avatar.includes('niñobetun') ||
    avatar.includes('ninobetun')
  ) {
    return ninoBetunAsset;
  }
  // sixsevenaldo
  if (avatar === 'avatar_sixsevenaldo' || avatar.includes('sixsevenaldo')) {
    return sixsevenaldoAsset;
  }
  // Jesús al cuadrado
  if (
    avatar === 'avatar_jesus_al_cuadrado' ||
    avatar.includes('jesus_al_cuadrado') ||
    avatar.includes('jesusalcuadrado')
  ) {
    return jesusAlCuadradoAsset;
  }
  // El tigre
  if (
    avatar === 'avatar_el_tigre' ||
    avatar.includes('El_tigre') ||
    avatar.includes('el_tigre') ||
    avatar.toLowerCase().includes('el tigre')
  ) {
    return elTigreAsset;
  }
  // Proyectada de cuerpo
  if (
    avatar === 'avatar_proyectada_de_cuerpo' ||
    avatar.includes('Proyectada_de_cuerpo') ||
    avatar.includes('proyectada_de_cuerpo') ||
    avatar.toLowerCase().includes('proyectada')
  ) {
    return proyectadaDeCuerpoAsset;
  }
  // Uribe
  if (
    avatar === 'avatar_uribe' ||
    avatar.includes('Uribe') ||
    avatar.toLowerCase().includes('uribe')
  ) {
    return uribeAsset;
  }
  // Winnie Pooh
  if (
    avatar === 'avatar_winnie_pooh' ||
    avatar.includes('winnie_pooh') ||
    avatar.toLowerCase().includes('winnie')
  ) {
    return winniePoohAsset;
  }
  // URLs completas o base64
  if (
    avatar.startsWith('http://') ||
    avatar.startsWith('https://') ||
    avatar.startsWith('data:image/') ||
    avatar.startsWith('blob:')
  ) {
    return avatar;
  }
  // Rutas relativas o absolutas en public
  if (avatar.startsWith('/') || avatar.includes('.')) {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const cleanSrc = avatar.startsWith('/') ? avatar.slice(1) : avatar;
    return `${cleanBase}${cleanSrc}`;
  }
  return null;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar = '👤',
  className = 'w-full h-full rounded-full object-cover',
  fallbackClassName = 'text-base select-none leading-none',
  style,
}) => {
  const resolvedUrl = resolveAvatarUrl(avatar);
  const objectPosition = getAvatarObjectPosition(avatar);

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt="Avatar"
        className={className}
        style={{
          objectPosition,
          ...style,
        }}
        loading="eager"
        decoding="async"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (resolvedUrl && target.src !== resolvedUrl) {
            target.src = resolvedUrl;
          }
        }}
      />
    );
  }

  return <span className={fallbackClassName}>{avatar || '👤'}</span>;
};

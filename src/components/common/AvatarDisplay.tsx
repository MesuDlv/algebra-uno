import React from 'react';
import patriaMilagroAsset from '../../assets/avatars/patria_milagro.jpg';
import ninoBetunAsset from '../../assets/avatars/nino_betun.jpg';
import sixsevenaldoAsset from '../../assets/avatars/sixsevenaldo.jpg';
import jesusAlCuadradoAsset from '../../assets/avatars/jesus_al_cuadrado.jpg';

export {
  patriaMilagroAsset,
  ninoBetunAsset,
  sixsevenaldoAsset,
  jesusAlCuadradoAsset,
};

interface AvatarDisplayProps {
  avatar?: string;
  className?: string;
  fallbackClassName?: string;
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
}) => {
  const resolvedUrl = resolveAvatarUrl(avatar);

  if (resolvedUrl) {
    return (
      <img
        src={resolvedUrl}
        alt="Avatar"
        className={className}
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

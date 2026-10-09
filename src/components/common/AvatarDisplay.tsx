import React from 'react';
import patriaMilagroAsset from '../../assets/avatars/patria_milagro.jpg';

export { patriaMilagroAsset };

interface AvatarDisplayProps {
  avatar?: string;
  className?: string;
  fallbackClassName?: string;
}

export function resolveAvatarUrl(avatar?: string): string | null {
  if (!avatar) return null;
  // Si es la recompensa de patria milagro (tanto si viene como /avatars/... o como ruta empaquetada)
  if (avatar.includes('patria_milagro')) {
    return patriaMilagroAsset;
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
          // Si por alguna razón falla, intentar el asset directo
          const target = e.target as HTMLImageElement;
          if (target.src !== patriaMilagroAsset) {
            target.src = patriaMilagroAsset;
          }
        }}
      />
    );
  }

  return <span className={fallbackClassName}>{avatar || '👤'}</span>;
};

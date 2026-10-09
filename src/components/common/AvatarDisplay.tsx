import React from 'react';

interface AvatarDisplayProps {
  avatar?: string;
  className?: string;
  fallbackClassName?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar = '👤',
  className = 'w-full h-full rounded-full object-cover',
  fallbackClassName = 'text-base select-none leading-none',
}) => {
  const isImage = Boolean(
    avatar &&
      (avatar.startsWith('/') ||
        avatar.startsWith('http://') ||
        avatar.startsWith('https://') ||
        avatar.startsWith('data:image/'))
  );

  if (isImage) {
    return (
      <img
        src={avatar}
        alt="Avatar"
        className={className}
        onError={(e) => {
          // Si falla la imagen, mostrar emoji por defecto
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  return <span className={fallbackClassName}>{avatar || '👤'}</span>;
};

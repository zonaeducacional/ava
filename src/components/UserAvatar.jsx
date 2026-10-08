import React from 'react';
import { getAvatarById } from '../data/avatarGallery.js';

/**
 * Componente unificado para renderizar o avatar do usuário
 * Suporta avatares pré-existentes da galeria (IDs), SVGs diretos, URLs de imagem ou iniciais
 */
export default function UserAvatar({
  user,
  avatar,
  name,
  size = 36,
  style = {},
  className = '',
  showBorder = false,
  borderColor = 'var(--border-color)',
  alt = 'Avatar do usuário'
}) {
  const currentAvatar = avatar !== undefined ? avatar : user?.avatar;
  const displayName = name || user?.name || 'Usuário';

  // Verifica se é um ID da galeria pré-existente
  const galleryItem = currentAvatar ? getAvatarById(currentAvatar) : null;

  // Se for um item da galeria pré-existente (SVG embutido)
  if (galleryItem && galleryItem.svg) {
    return (
      <div
        className={`user-avatar-wrapper ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: showBorder ? `2px solid ${borderColor}` : 'none',
          boxShadow: showBorder ? '0 2px 6px rgba(19, 47, 56, 0.12)' : 'none',
          flexShrink: 0,
          ...style
        }}
        title={`${galleryItem.name} (${displayName})`}
        dangerouslySetInnerHTML={{ __html: galleryItem.svg }}
      />
    );
  }

  // Se o avatar for uma string de SVG direta
  if (typeof currentAvatar === 'string' && currentAvatar.trim().startsWith('<svg')) {
    return (
      <div
        className={`user-avatar-wrapper ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: showBorder ? `2px solid ${borderColor}` : 'none',
          boxShadow: showBorder ? '0 2px 6px rgba(19, 47, 56, 0.12)' : 'none',
          flexShrink: 0,
          ...style
        }}
        dangerouslySetInnerHTML={{ __html: currentAvatar }}
      />
    );
  }

  // Se for uma URL de imagem externa ou data URL
  if (typeof currentAvatar === 'string' && (currentAvatar.startsWith('http') || currentAvatar.startsWith('data:image'))) {
    return (
      <img
        src={currentAvatar}
        alt={alt}
        className={`user-avatar-img ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: showBorder ? `2px solid ${borderColor}` : 'none',
          boxShadow: showBorder ? '0 2px 6px rgba(19, 47, 56, 0.12)' : 'none',
          display: 'inline-block',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  // Caso padrão: Fallback para as iniciais do nome com gradiente das cores da plataforma
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const fontSize = Math.max(Math.round(size * 0.42), 10);

  return (
    <div
      className={`user-avatar-initials ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #5bcebf 0%, #2e97b7 100%)',
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: `${fontSize}px`,
        letterSpacing: '-0.02em',
        border: showBorder ? `2px solid ${borderColor}` : 'none',
        boxShadow: showBorder ? '0 2px 6px rgba(19, 47, 56, 0.12)' : 'none',
        flexShrink: 0,
        userSelect: 'none',
        ...style
      }}
      title={displayName}
    >
      {initial}
    </div>
  );
}

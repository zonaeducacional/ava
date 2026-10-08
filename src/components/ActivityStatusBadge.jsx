import React from 'react';

/**
 * Componente visual de Badge de Status para Atividades
 * Diferencia os estados 'Pendente', 'Em curso' e 'Concluído'
 * utilizando a paleta de cores:
 * - .color1: #fdf4b0 (Pendente)
 * - .color3: #5bcebf / .color4: #32b9be (Em curso)
 * - .color2: #a4dcb9 / .color3: #5bcebf (Concluído)
 */
export default function ActivityStatusBadge({
  status = 'pending',
  onClick,
  isInteractive = false,
  className = '',
  size = 'md'
}) {
  const normalizedStatus = status === 'completed' || status === 'concluido'
    ? 'completed'
    : status === 'in_progress' || status === 'em_curso'
    ? 'in_progress'
    : 'pending';

  const config = {
    pending: {
      label: 'Pendente',
      icon: '⏳',
      bg: '#fdf4b0', // .color1
      border: '#a4dcb9', // .color2
      text: '#132f38',
      title: isInteractive ? 'Status: Pendente (Clique para avançar para Em curso)' : 'Pendente'
    },
    in_progress: {
      label: 'Em curso',
      icon: '🔄',
      bg: 'rgba(91, 206, 191, 0.3)', // .color3
      border: '#32b9be', // .color4
      text: '#132f38',
      title: isInteractive ? 'Status: Em curso (Clique para marcar como Concluído)' : 'Em curso'
    },
    completed: {
      label: 'Concluído',
      icon: '✓',
      bg: '#a4dcb9', // .color2
      border: '#5bcebf', // .color3
      text: '#132f38',
      title: isInteractive ? 'Status: Concluído (Clique para redefinir para Pendente)' : 'Concluído'
    }
  }[normalizedStatus];

  const padding = size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.65rem';
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';

  return (
    <button
      type="button"
      onClick={isInteractive ? onClick : undefined}
      disabled={!isInteractive}
      className={`activity-status-badge ${className}`}
      title={config.title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.text,
        fontSize,
        fontWeight: 700,
        padding,
        borderRadius: '9999px',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        cursor: isInteractive ? 'pointer' : 'default',
        userSelect: 'none',
        boxShadow: '0 1px 2px rgba(19, 47, 56, 0.08)',
        transition: 'all 0.15s ease',
        transform: 'none'
      }}
      onMouseEnter={(e) => {
        if (isInteractive) {
          e.currentTarget.style.transform = 'scale(1.04)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(46, 151, 183, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (isInteractive) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 1px 2px rgba(19, 47, 56, 0.08)';
        }
      }}
    >
      <span style={{ fontSize: size === 'sm' ? '0.75rem' : '0.825rem' }}>{config.icon}</span>
      <span>{config.label}</span>
    </button>
  );
}

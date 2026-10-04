import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Componente de Central de Notificações
 * Exibe alertas em tempo real sobre novas tarefas atribuídas, notas publicadas
 * e avisos importantes de cursos para Alunos e Professores.
 */
export default function NotificationCenter({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  isTeacher = false,
  isStudent = false
}) {
  const [activeTab, setActiveTab] = useState('todas'); // 'todas' | 'tarefas' | 'notas' | 'avisos'
  const [showAll, setShowAll] = useState(false);

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const unreadCount = unreadNotifications.length;

  // Filtragem por tipo
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'tarefas') return n.type === 'tarefa';
    if (activeTab === 'notas') return n.type === 'nota';
    if (activeTab === 'avisos') return n.type === 'aviso';
    return true;
  });

  const displayedNotifications = showAll
    ? filteredNotifications
    : filteredNotifications.slice(0, 4);

  const formatNotificationTime = (isoString) => {
    if (!isoString) return 'Data recente';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Pouco tempo atrás';
      if (diffHours < 24) return `Há ${diffHours}h`;
      if (diffDays === 1) return 'Ontem';
      if (diffDays < 7) return `Há ${diffDays} dias`;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'Recente';
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div className="notification-card-container">
      {/* Cabeçalho da Central */}
      <div className="notification-header">
        <div className="notification-title-group">
          <span style={{ fontSize: '1.35rem' }}>🔔</span>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
            Central de Notificações
          </h2>
          {unreadCount > 0 ? (
            <span className="notification-badge-unread">
              {unreadCount} nova{unreadCount > 1 ? 's' : ''}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--success)',
                fontWeight: 600,
                backgroundColor: 'var(--success-light)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              ✓ Em dia
            </span>
          )}
        </div>

        {unreadCount > 0 && onMarkAllAsRead && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={onMarkAllAsRead}
            style={{ fontSize: '0.775rem', padding: '0.25rem 0.65rem' }}
          >
            ✓ Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Abas de Filtros de Notificação */}
      <div className="notification-tabs">
        <button
          type="button"
          className={`notification-tab-btn ${activeTab === 'todas' ? 'active' : ''}`}
          onClick={() => setActiveTab('todas')}
        >
          Todas ({notifications.length})
        </button>
        <button
          type="button"
          className={`notification-tab-btn ${activeTab === 'tarefas' ? 'active' : ''}`}
          onClick={() => setActiveTab('tarefas')}
        >
          📝 Tarefas ({notifications.filter((n) => n.type === 'tarefa').length})
        </button>
        <button
          type="button"
          className={`notification-tab-btn ${activeTab === 'notas' ? 'active' : ''}`}
          onClick={() => setActiveTab('notas')}
        >
          ⭐ Notas ({notifications.filter((n) => n.type === 'nota').length})
        </button>
        <button
          type="button"
          className={`notification-tab-btn ${activeTab === 'avisos' ? 'active' : ''}`}
          onClick={() => setActiveTab('avisos')}
        >
          📢 Avisos ({notifications.filter((n) => n.type === 'aviso').length})
        </button>
      </div>

      {/* Lista de Alertas */}
      {displayedNotifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
          <p style={{ fontWeight: 600, margin: 0 }}>Nenhuma notificação nesta categoria</p>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isStudent
              ? 'Novas tarefas, notas publicadas e comunicados de cursos aparecerão aqui.'
              : 'Novos envios de alunos e avisos importantes aparecerão aqui.'}
          </span>
        </div>
      ) : (
        <div className="notification-list">
          {displayedNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
            >
              <div
                className="notification-icon-box"
                style={{
                  backgroundColor:
                    notif.type === 'tarefa'
                      ? 'var(--warning-light)'
                      : notif.type === 'nota'
                      ? 'var(--success-light)'
                      : 'var(--info-light)'
                }}
              >
                {notif.icon || '🔔'}
              </div>

              <div className="notification-content">
                <div className="notification-item-title">
                  {!notif.isRead && <span className="notification-unread-dot" title="Não lida" />}
                  <Link
                    to={notif.link}
                    onClick={() => handleItemClick(notif)}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {notif.title}
                  </Link>
                </div>

                <div className="notification-item-desc">{notif.description}</div>

                <div className="notification-item-meta">
                  <span className="course-code-tag" style={{ fontSize: '0.7rem' }}>
                    {notif.courseTitle}
                  </span>
                  <span>{formatNotificationTime(notif.timestamp)}</span>
                  {notif.authorName && (
                    <span>Por: <strong>{notif.authorName}</strong></span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end', flexShrink: 0 }}>
                <Link
                  to={notif.link}
                  className="btn btn-sm btn-primary"
                  onClick={() => handleItemClick(notif)}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  {notif.actionLabel || 'Acessar'} →
                </Link>

                {!notif.isRead && onMarkAsRead && (
                  <button
                    type="button"
                    onClick={() => onMarkAsRead(notif.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                    title="Marcar como lida"
                  >
                    Marcar lida
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alternador Ver Mais / Recolher */}
      {filteredNotifications.length > 4 && (
        <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setShowAll((prev) => !prev)}
            style={{ fontSize: '0.8rem' }}
          >
            {showAll
              ? '▲ Recolher Notificações'
              : `▼ Ver todas as ${filteredNotifications.length} notificações`}
          </button>
        </div>
      )}
    </div>
  );
}

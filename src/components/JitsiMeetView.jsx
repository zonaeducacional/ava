import React, { useState, useRef } from 'react';

/**
 * Componente JitsiMeetView
 * Embutimento responsivo do Jitsi Meet com controles da sala de aula virtual
 */
export default function JitsiMeetView({
  roomName = 'lms-sala-geral',
  subject = 'Aula ao Vivo',
  user = null,
  onLeave = null
}) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  // Sanitiza o nome da sala (caracteres alfanuméricos e hífens)
  const cleanRoom = roomName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase();

  const jitsiUrl = `https://meet.jit.si/${cleanRoom}#userInfo.displayName=${encodeURIComponent(
    user?.name || 'Estudante'
  )}&config.prejoinPageEnabled=false&config.startWithAudioMuted=true`;

  const handleCopyLink = () => {
    const publicUrl = `https://meet.jit.si/${cleanRoom}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Erro ao ativar tela cheia:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: '#0f172a',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Barra Superior de Controles do Meet */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          color: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.725rem',
              fontWeight: 800,
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.05em'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                animation: 'pulse 1.5s infinite'
              }}
            />
            AO VIVO
          </span>

          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
              {subject}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Sala: <code style={{ color: '#38bdf8' }}>{cleanRoom}</code> • Conectado como: <strong>{user?.name || 'Usuário'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={handleCopyLink}
            style={{
              backgroundColor: '#334155',
              borderColor: '#475569',
              color: '#f8fafc',
              fontSize: '0.775rem'
            }}
            title="Copiar link público para convidar outros participantes"
          >
            {copied ? '✓ Link Copiado!' : '📋 Copiar Link'}
          </button>

          <a
            href={`https://meet.jit.si/${cleanRoom}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline"
            style={{
              backgroundColor: '#334155',
              borderColor: '#475569',
              color: '#f8fafc',
              fontSize: '0.775rem'
            }}
            title="Abrir sala diretamente em uma nova aba do navegador"
          >
            ↗ Nova Aba
          </a>

          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={toggleFullscreen}
            style={{
              backgroundColor: '#334155',
              borderColor: '#475569',
              color: '#f8fafc',
              fontSize: '0.775rem'
            }}
            title="Alternar modo tela cheia"
          >
            {isFullscreen ? 'Exit Fullscreen' : '⛶ Tela Cheia'}
          </button>

          {onLeave && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={onLeave}
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.775rem',
                border: 'none'
              }}
            >
              ✕ Sair da Aula
            </button>
          )}
        </div>
      </div>

      {/* Frame Embutido do Jitsi Meet */}
      <div style={{ width: '100%', height: isFullscreen ? 'calc(100vh - 60px)' : '620px', position: 'relative' }}>
        <iframe
          src={jitsiUrl}
          title={`Jitsi Meet - ${subject}`}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
        />
      </div>

      {/* Rodapé Informativo */}
      <div
        style={{
          padding: '0.65rem 1.25rem',
          backgroundColor: '#0f172a',
          borderTop: '1px solid #1e293b',
          fontSize: '0.775rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <span>
          💡 <strong>Dica da Aula Virtual:</strong> Habilite o microfone e a câmera nas permissões do seu navegador. Você pode compartilhar tela, usar o chat e levantar a mão na barra de controle interna.
        </span>
        <span style={{ color: '#64748b' }}>
          Tecnologia Jitsi Meet Open Source
        </span>
      </div>
    </div>
  );
}

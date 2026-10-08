import React, { useState, useEffect } from 'react';
import ActivityStatusBadge from './ActivityStatusBadge.jsx';

/**
 * Componente: Modo de Leitura Focado (Focus Reading View)
 * Oculta navegação superior e menus laterais para imersão total
 * nos textos e mídias das aulas, com barra de ferramentas e
 * botão de "Sair do modo de foco".
 */
export default function FocusReadingView({
  data,
  onExit,
  onToggleComplete,
  onCycleStatus,
  onNavigatePrev,
  onNavigateNext
}) {
  const [fontSize, setFontSize] = useState(17); // px
  const [fontFamily, setFontFamily] = useState('serif'); // 'serif' | 'sans'
  const [themeMode, setThemeMode] = useState('cream'); // 'cream' | 'white' | 'mint' | 'ocean'
  const [contentWidth, setContentWidth] = useState('default'); // 'compact' (680px) | 'default' (780px) | 'wide' (920px)
  const [scrollProgress, setScrollProgress] = useState(0);

  // Monitora progresso da rolagem do texto
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!data) return null;

  const title = data.title || 'Conteúdo da Aula';
  const courseTitle = data.courseTitle || '';
  const sectionTitle = data.sectionTitle || '';
  const authorName = data.authorName || data.teacherName || '';
  const content = data.content || '';
  const mediaUrl = data.mediaUrl || data.imageUrl || '';
  const status = data.status || 'pending';

  // Estimativa de tempo de leitura (média de 180 palavras/min)
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 180));

  // Configurações de cores baseadas na paleta (.color1, .color2, .color3, .color4, .color5)
  const themeStyles = {
    white: {
      bg: '#ffffff',
      canvas: '#ffffff',
      border: 'var(--border-color)',
      text: '#132f38',
      name: 'Branco Limpo'
    },
    cream: {
      bg: '#fbf8df', // .color1 (#fdf4b0) em tom de leitura relaxante
      canvas: '#fdf9e5',
      border: '#e8dc8c',
      text: '#132f38',
      name: 'Creme (.color1)'
    },
    mint: {
      bg: '#eef8f2', // .color2 (#a4dcb9) em tom suave
      canvas: '#f4fbf6',
      border: '#c3e8d2',
      text: '#132f38',
      name: 'Menta (.color2)'
    },
    ocean: {
      bg: '#ebf5f8', // .color5 (#2e97b7) em tom suave
      canvas: '#f1f8fa',
      border: '#b8e0ea',
      text: '#132f38',
      name: 'Oceano (.color5)'
    }
  }[themeMode] || themeStyles.cream;

  const maxWidthMap = {
    compact: '680px',
    default: '780px',
    wide: '920px'
  };

  return (
    <div
      className="focus-reading-container"
      style={{
        backgroundColor: themeStyles.bg,
        minHeight: '100vh',
        color: themeStyles.text,
        transition: 'background-color 0.25s ease, color 0.25s ease',
        paddingBottom: '6rem'
      }}
    >
      {/* BARRA DE PROGRESSO DE ROLAGEM NO TOPO ABSOLUTO */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          zIndex: 1000
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${scrollProgress}%`,
            background: 'linear-gradient(90deg, #5bcebf, #32b9be, #2e97b7)',
            transition: 'width 0.1s linear'
          }}
        />
      </div>

      {/* BARRA DE FERRAMENTAS FIXA DO MODO DE FOCO (SUBSTITUI O NAVBAR SUPERIOR) */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          backgroundColor: themeStyles.canvas,
          borderBottom: `1px solid ${themeStyles.border}`,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(19, 47, 56, 0.06)'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0.65rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {/* Lado Esquerdo: Identificador e Título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <span
              style={{
                fontSize: '0.725rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: 'rgba(46, 151, 183, 0.15)',
                color: '#2e97b7',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                flexShrink: 0
              }}
            >
              <span>📖</span> Modo de Leitura
            </span>

            <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {courseTitle ? `${courseTitle} • ` : ''}
              </span>
              <strong style={{ fontSize: '0.9rem', color: themeStyles.text }}>
                {title}
              </strong>
            </div>
          </div>

          {/* Centro: Controles de Tipografia e Tema */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Ajuste de Tamanho da Fonte */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderRadius: 'var(--radius-full)',
                padding: '2px 6px',
                border: `1px solid ${themeStyles.border}`
              }}
            >
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(14, s - 1))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '0.15rem 0.35rem',
                  color: themeStyles.text
                }}
                title="Diminuir fonte"
              >
                A-
              </button>
              <span style={{ fontSize: '0.725rem', minWidth: '32px', textAlign: 'center', fontWeight: 600 }}>
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(26, s + 1))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '0.15rem 0.35rem',
                  color: themeStyles.text
                }}
                title="Aumentar fonte"
              >
                A+
              </button>
            </div>

            {/* Alternar Fonte: Serif / Sans */}
            <button
              type="button"
              onClick={() => setFontFamily((f) => (f === 'serif' ? 'sans' : 'serif'))}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${themeStyles.border}`,
                backgroundColor: 'rgba(0,0,0,0.03)',
                cursor: 'pointer',
                color: themeStyles.text
              }}
              title="Alternar entre fonte Serifada clássica e Sans-serif moderna"
            >
              {fontFamily === 'serif' ? '🔤 Serifada' : '🔤 Sans-serif'}
            </button>

            {/* Alternador de Cor de Fundo / Tom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {[
                { id: 'cream', color: '#fdf4b0', label: 'Creme (.color1)' },
                { id: 'mint', color: '#a4dcb9', label: 'Menta (.color2)' },
                { id: 'ocean', color: '#5bcebf', label: 'Turquesa (.color3)' },
                { id: 'white', color: '#ffffff', label: 'Branco' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemeMode(t.id)}
                  title={`Tema de fundo: ${t.label}`}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: t.color,
                    border: themeMode === t.id ? '2px solid #2e97b7' : '1px solid #cbd5e1',
                    cursor: 'pointer',
                    outline: 'none',
                    padding: 0
                  }}
                />
              ))}
            </div>

            {/* Alternador de Largura do Conteúdo */}
            <button
              type="button"
              onClick={() =>
                setContentWidth((w) => (w === 'default' ? 'wide' : w === 'wide' ? 'compact' : 'default'))
              }
              style={{
                fontSize: '0.75rem',
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                border: `1px solid ${themeStyles.border}`,
                backgroundColor: 'rgba(0,0,0,0.03)',
                cursor: 'pointer',
                color: themeStyles.text
              }}
              title="Ajustar largura da coluna de leitura (Compacto / Padrão / Amplo)"
            >
              ↔ {contentWidth === 'compact' ? 'Compacto' : contentWidth === 'wide' ? 'Amplo' : 'Padrão'}
            </button>
          </div>

          {/* Lado Direito: Badge de Status e BOTÃO PRINCIPAL DE SAIR DO MODO DE FOCO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {status && (
              <ActivityStatusBadge
                status={status}
                isInteractive={!!onCycleStatus}
                onClick={onCycleStatus}
                size="sm"
              />
            )}

            {/* BOTÃO EXIGIDO: 'Sair do modo de foco' */}
            <button
              type="button"
              onClick={onExit}
              className="btn btn-sm btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '0.35rem 0.85rem',
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                color: '#132f38',
                boxShadow: 'var(--shadow-sm)'
              }}
              title="Voltar para a interface normal do curso (ESC)"
            >
              <span style={{ fontSize: '0.95rem' }}>✕</span>
              <span>Sair do modo de foco</span>
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA CENTRAL DE LEITURA (SEM BARRAS LATERAIS, FOCO TOTAL NO TEXTO) */}
      <main
        style={{
          maxWidth: maxWidthMap[contentWidth],
          margin: '2rem auto 0 auto',
          padding: '0 1.5rem'
        }}
      >
        <article
          style={{
            backgroundColor: themeStyles.canvas,
            padding: '2.5rem 2.25rem',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${themeStyles.border}`,
            boxShadow: '0 4px 16px rgba(19, 47, 56, 0.05)',
            transition: 'background-color 0.25s ease'
          }}
        >
          {/* CABEÇALHO DO ARTIGO / AULA */}
          <div style={{ borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            {sectionTitle && (
              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: '#2e97b7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.4rem'
                }}
              >
                📁 {sectionTitle}
              </div>
            )}

            <h1
              style={{
                fontSize: `${Math.round(fontSize * 1.75)}px`,
                fontWeight: 800,
                lineHeight: 1.25,
                color: themeStyles.text,
                margin: 0,
                letterSpacing: '-0.02em',
                fontFamily:
                  fontFamily === 'serif'
                    ? 'Charter, Georgia, Cambria, "Times New Roman", Times, serif'
                    : 'var(--font-sans)'
              }}
            >
              {title}
            </h1>

            {/* Metadados pedagógicos da aula */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                fontSize: '0.825rem',
                color: 'var(--text-muted)',
                marginTop: '1rem'
              }}
            >
              {authorName && <span>✍️ Autor: <strong>{authorName}</strong></span>}
              <span>⏱️ Leitura estimada: <strong>~{readTimeMin} min</strong> ({wordCount} palavras)</span>
              <span>🎯 Status pedagógico: <strong>{status === 'completed' ? 'Concluído' : status === 'in_progress' ? 'Em curso' : 'Pendente'}</strong></span>
            </div>
          </div>

          {/* MÍDIA PRINCIPAL DE DESTAQUE (SE HOUVER IMAGEM OU LINK DE MÍDIA) */}
          {mediaUrl && (
            <div
              style={{
                marginBottom: '2rem',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: `1px solid ${themeStyles.border}`,
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <img
                src={mediaUrl}
                alt={title}
                style={{
                  width: '100%',
                  maxHeight: '440px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <div
                style={{
                  padding: '0.5rem 0.85rem',
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textAlign: 'center'
                }}
              >
                Mídia de referência da aula: {title}
              </div>
            </div>
          )}

          {/* CORPO DO TEXTO FORMATADO PARA LEITURA IMERSIVA */}
          <div
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.85,
              color: themeStyles.text,
              fontFamily:
                fontFamily === 'serif'
                  ? 'Charter, Georgia, Cambria, "Times New Roman", Times, serif'
                  : 'var(--font-sans)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {content || (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                Nenhum texto cadastrado para este conteúdo.
              </p>
            )}
          </div>

          {/* RODOVIÁRIO DE CONCLUSÃO DENTRO DO MODO DE FOCO */}
          <div
            style={{
              marginTop: '3.5rem',
              paddingTop: '2rem',
              borderTop: `1px solid ${themeStyles.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Status do Conteúdo:</span>
                <ActivityStatusBadge
                  status={status}
                  isInteractive={!!onCycleStatus}
                  onClick={onCycleStatus}
                />
              </div>

              {onToggleComplete && (
                <button
                  type="button"
                  onClick={onToggleComplete}
                  className={`btn ${status === 'completed' ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ fontWeight: 700, padding: '0.6rem 1.25rem' }}
                >
                  {status === 'completed' ? '✓ Conteúdo Concluído' : '✓ Marcar como Lido e Concluído'}
                </button>
              )}
            </div>

            {/* Navegação entre aulas e botão de saída */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                backgroundColor: 'rgba(0,0,0,0.03)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div>
                {onNavigatePrev ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={onNavigatePrev}
                  >
                    ← Aula Anterior
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Início do Módulo</span>
                )}
              </div>

              {/* Botão Secundário de Sair do Modo de Foco no rodapé */}
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={onExit}
                style={{ fontWeight: 600 }}
              >
                ✕ Sair do modo de foco
              </button>

              <div>
                {onNavigateNext ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={onNavigateNext}
                  >
                    Próxima Aula →
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fim do Módulo</span>
                )}
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

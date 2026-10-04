import React, { useState, useEffect } from 'react';
import { liveSessionService } from '../services/index.js';
import { webPushService } from '../services/webPushService.js';
import JitsiMeetView from './JitsiMeetView.jsx';

/**
 * Componente CourseLiveClassroom
 * Sala de aula ao vivo dedicada na página de detalhes do curso,
 * permitindo que professores iniciem reuniões e alunos participem via iframe do Jitsi Meet.
 */
export default function CourseLiveClassroom({
  course,
  user,
  canEdit = false,
  isEnrolled = false
}) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [showStartForm, setShowStartForm] = useState(false);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [starting, setStarting] = useState(false);

  // Nome padronizado e limpo da sala para o curso
  const cleanCode = (course?.code || 'LMS').replace(/[^a-zA-Z0-9]/g, '');
  const cleanId = (course?.id || '0000').slice(-6);
  const defaultRoomName = `lms-aula-${cleanCode}-${cleanId}`.toLowerCase();

  useEffect(() => {
    if (course?.id) {
      loadSession();
    }
  }, [course?.id]);

  const loadSession = async () => {
    setLoading(true);
    try {
      const active = await liveSessionService.getLiveSession(course.id);
      setSession(active);
      // Se o professor ou aluno já estava participando ou se iniciou agora
      if (active) {
        setTopic(active.title);
      }
    } catch (err) {
      console.error('Erro ao verificar sessão ao vivo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setStarting(true);
    try {
      const newSession = await liveSessionService.startLiveSession(course.id, {
        title: topic.trim() || `Aula ao Vivo: ${course.title}`,
        description: description.trim() || 'Sessão síncrona com o professor.',
        teacherId: user.id,
        teacherName: user.name,
        roomName: defaultRoomName
      });
      setSession(newSession);
      setShowStartForm(false);
      setIsInMeeting(true);

      // Dispara notificação Web Push via Service Worker para alertar os alunos
      webPushService.notifyLiveClassStarted({
        courseTitle: course?.title || 'Curso',
        teacherName: user?.name || 'Professor',
        courseId: course.id
      });
    } catch (err) {
      alert('Erro ao iniciar aula ao vivo: ' + err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleEndSession = async () => {
    if (!window.confirm('Tem certeza de que deseja encerrar a transmissão ao vivo desta aula para todos os alunos?')) {
      return;
    }
    if (session?.id) {
      try {
        await liveSessionService.endLiveSession(session.id);
        setSession(null);
        setIsInMeeting(false);
      } catch (err) {
        console.error('Erro ao encerrar sessão:', err);
      }
    }
  };

  const activeRoom = session?.roomName || defaultRoomName;
  const activeSubject = session?.title || `Aula ao Vivo: ${course?.title} (${course?.code})`;

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner" />
        <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
          Verificando status da sala virtual...
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* CARD DE STATUS DA TRANSMISSÃO */}
      <div
        className="card"
        style={{
          borderLeft: session
            ? '5px solid #22c55e'
            : '5px solid var(--border-color)',
          backgroundColor: session
            ? 'linear-gradient(to right, var(--bg-surface), #f0fdf4)'
            : 'var(--bg-surface)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: session ? 'var(--success-light)' : 'var(--bg-subtle)',
              color: session ? 'var(--success)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0
            }}
          >
            {session ? '📹' : '🎙️'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {session ? session.title : 'Sala de Aula Virtual (Jitsi Meet)'}
              </h3>

              {session ? (
                <span
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  TRANSMISSÃO AO VIVO
                </span>
              ) : (
                <span
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)'
                  }}
                >
                  Aguardando Início
                </span>
              )}
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {session
                ? `Iniciada por ${session.teacherName} em ${new Date(session.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. Sala: ${session.roomName}`
                : canEdit
                ? 'Inicie uma reunião ao vivo com seus alunos agora para tirar dúvidas ou ministrar aula.'
                : 'O professor ainda não iniciou a transmissão. Você pode entrar na sala de espera ou aguardar o aviso.'}
            </p>
          </div>
        </div>

        {/* Botões de Ação do Professor e do Aluno */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Se está com o iframe aberto */}
          {isInMeeting ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsInMeeting(false)}
              >
                Minimizar Janela
              </button>

              {canEdit && session && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none' }}
                  onClick={handleEndSession}
                >
                  Encerrar Aula para Todos
                </button>
              )}
            </div>
          ) : (
            /* Se o iframe não está aberto */
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* Professor: botão para abrir formulário de início */}
              {canEdit && !session && !showStartForm && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowStartForm(true)}
                >
                  <span>🔴</span> Iniciar Aula ao Vivo
                </button>
              )}

              {/* Botão de Entrar (se sessão ativa ou se professor/aluno quer entrar) */}
              {(session || !canEdit) && (
                <button
                  type="button"
                  className={`btn ${session ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setIsInMeeting(true)}
                  style={{ fontWeight: 700 }}
                >
                  <span>📹</span> {session ? 'Entrar na Aula Agora' : 'Entrar na Sala'}
                </button>
              )}

              {/* Professor encerrar se já ativa */}
              {canEdit && session && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                  onClick={handleEndSession}
                >
                  Encerrar Aula
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FORMULÁRIO DO PROFESSOR PARA INICIAR AULA COM TEMA */}
      {canEdit && showStartForm && !session && (
        <div className="card" style={{ border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              Configurar Transmissão da Aula ao Vivo
            </h3>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setShowStartForm(false)}
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleStartSession}>
            <div className="form-group">
              <label className="form-label" htmlFor="live-topic">
                Tema / Assunto da Aula ao Vivo *
              </label>
              <input
                id="live-topic"
                type="text"
                className="form-input"
                placeholder="Ex: Aula 03 - Resolução de Exercícios & Dúvidas do Projeto"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="live-desc">
                Instruções para os Alunos (opcional)
              </label>
              <input
                id="live-desc"
                type="text"
                className="form-input"
                placeholder="Ex: Tenham em mãos os códigos desenvolvidos na última aula."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowStartForm(false)}
              >
                Voltar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={starting}
              >
                {starting ? 'Iniciando...' : '🔴 Abrir Sala e Iniciar Transmissão'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ÁREA EMBUTIDA DO JITSI MEET VIA IFRAME */}
      {isInMeeting && (
        <div>
          <JitsiMeetView
            roomName={activeRoom}
            subject={activeSubject}
            user={user}
            onLeave={() => setIsInMeeting(false)}
          />
        </div>
      )}

      {/* INSTRUÇÕES E RECURSOS DA SALA VIRTUAL */}
      {!isInMeeting && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem'
          }}
        >
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🖥️</div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Compartilhamento de Tela
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Professores e alunos podem apresentar slides em PDF, janelas de código e navegadores em tempo real.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Chat e Interações Síncronas
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Tire dúvidas no bate-papo integrado, levante a mão para falar e participe das discussões com reações.
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔒</div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              Acesso Direto Sem Contas Externas
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Não é necessário instalar plugins nem cadastrar contas adicionais; a entrada é 100% pelo navegador.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { webPushService } from '../services/webPushService.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function WebPushNotificationModal({ isOpen, onClose }) {
  const { user, isStudent, isTeacher } = useAuth();
  const [permission, setPermission] = useState('default');
  const [testing, setTesting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      updatePermission();
    }
  }, [isOpen]);

  const updatePermission = () => {
    setPermission(webPushService.getPermission());
  };

  const handleEnableNotifications = async () => {
    try {
      const res = await webPushService.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        webPushService.sendNotification({
          title: '🔔 Notificações Ativadas com Sucesso!',
          body: 'Você agora receberá alertas sobre novas atividades, notas e comunicados mesmo fora desta aba.',
          url: '/'
        });
      }
    } catch (err) {
      console.error('Erro ao pedir permissão:', err);
    }
  };

  const handleTestNotification = async (type = 'grade') => {
    setTesting(true);
    setCountdown(3);
    setTestMessage('Mude de aba ou minimize o navegador agora para ver o alerta em segundo plano!');

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        setCountdown(null);
        setTesting(false);
        setTestMessage('');

        if (type === 'grade') {
          webPushService.notifyGradePublished({
            courseTitle: 'Desenvolvimento Web com React',
            assignmentTitle: 'Tarefa Prática 1: Criação de Componente',
            score: 10,
            maxScore: 10,
            courseId: 'course-1'
          });
        } else if (type === 'assignment') {
          webPushService.notifyNewAssignment({
            courseTitle: 'Desenvolvimento Web com React',
            assignmentTitle: 'Tarefa 2: Gerenciamento de Estado com Redux e Context API',
            dueDate: '15/10/2026',
            courseId: 'course-1'
          });
        } else if (type === 'live') {
          webPushService.notifyLiveClassStarted({
            courseTitle: 'Desenvolvimento Web com React',
            teacherName: 'Profª. Maria Silva',
            courseId: 'course-1'
          });
        } else {
          webPushService.sendNotification({
            title: '📢 Comunicado do Professor',
            body: 'O material da aula de revisão já está disponível no LMS.',
            url: '/courses/course-1'
          });
        }
      }
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🔔</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              Notificações do Navegador (Web Push)
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={onClose}
            style={{ padding: '0.2rem 0.6rem' }}
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Status Atual da Permissão */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              backgroundColor:
                permission === 'granted'
                  ? 'var(--success-light)'
                  : permission === 'denied'
                  ? '#fee2e2'
                  : 'var(--bg-subtle)',
              borderColor:
                permission === 'granted'
                  ? 'var(--success)'
                  : permission === 'denied'
                  ? '#ef4444'
                  : 'var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>
                {permission === 'granted' ? '🟢' : permission === 'denied' ? '🔴' : '🟡'}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {permission === 'granted'
                    ? 'Notificações Ativadas'
                    : permission === 'denied'
                    ? 'Notificações Bloqueadas no Navegador'
                    : 'Permissão Pendente'}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {permission === 'granted'
                    ? 'Seu Service Worker está ativo para exibir alertas de atividades e notas fora da aba.'
                    : permission === 'denied'
                    ? 'Para receber alertas, habilite as notificações nas configurações do seu navegador (ícone de cadeado na barra de endereços).'
                    : 'Autorize o LMS a enviar notificações pelo navegador para não perder nenhum prazo.'}
                </div>
              </div>
            </div>

            {permission !== 'granted' && permission !== 'denied' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleEnableNotifications}
                style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                Autorizar Agora
              </button>
            )}
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Utilizando o <strong>Service Worker (`/sw.js`)</strong> e a <strong>Web Push / Notifications API</strong> nativa do navegador, você é notificado imediatamente no sistema operacional (Windows, macOS, Linux, Android) mesmo se estiver com o navegador minimizado ou navegando em outros sites.
          </p>

          {/* ÁREA DE TESTE INTERATIVO */}
          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>🧪</span>
              <span>Testar Alertas do Service Worker</span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Clique em um dos botões abaixo para agendar um disparo com contagem regressiva de 3 segundos, permitindo que você minimize esta janela ou troque de aba para ver o alerta aparecer:
            </p>

            {countdown !== null && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#e0f2fe',
                  border: '1px solid #0284c7',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#0369a1'
                }}
              >
                ⏳ Disparando em {countdown} segundos... {testMessage}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={testing}
                onClick={() => handleTestNotification('grade')}
              >
                🎯 Alerta de Nota Lançada
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={testing}
                onClick={() => handleTestNotification('assignment')}
              >
                📝 Alerta de Nova Tarefa
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={testing}
                onClick={() => handleTestNotification('live')}
              >
                🔴 Alerta de Aula ao Vivo
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={testing}
                onClick={() => handleTestNotification('announcement')}
              >
                📢 Alerta de Novo Aviso
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import JitsiMeetView from '../components/JitsiMeetView.jsx';
import { courseService, enrollmentService } from '../services/index.js';

export default function Meet() {
  const { courseId: routeCourseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isStudent, isTeacher, isAdmin } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeSubject, setActiveSubject] = useState('');
  const [customRoomName, setCustomRoomName] = useState('');

  const targetCourseId = routeCourseId || searchParams.get('courseId');

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (courses.length > 0 && targetCourseId) {
      const selected = courses.find((c) => c.id === targetCourseId);
      if (selected) {
        startCourseMeeting(selected);
      }
    }
  }, [courses, targetCourseId]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      if (isStudent) {
        const myEnrs = await enrollmentService.getEnrollmentsByUser(user.id);
        const enrolledCourses = myEnrs.map((e) => e.course).filter(Boolean);
        setCourses(enrolledCourses);
      } else {
        let list = [];
        if (isAdmin) {
          list = await courseService.getAllCourses();
        } else {
          list = await courseService.getCoursesByTeacher(user.id);
        }
        setCourses(list);
      }
    } catch (err) {
      console.error('Erro ao carregar cursos para o Meet:', err);
    } finally {
      setLoading(false);
    }
  };

  const startCourseMeeting = (course) => {
    const cleanCode = (course.code || 'LMS').replace(/[^a-zA-Z0-9]/g, '');
    const cleanId = course.id.slice(-6);
    const room = `lms-aula-${cleanCode}-${cleanId}`.toLowerCase();
    setActiveRoom(room);
    setActiveSubject(`Aula ao Vivo: ${course.title} (${course.code})`);
  };

  const handleStartCustomMeeting = (e) => {
    e.preventDefault();
    if (!customRoomName.trim()) return;

    const clean = customRoomName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase();

    setActiveRoom(`lms-${clean}`);
    setActiveSubject(`Sala Virtual: ${customRoomName.trim()}`);
  };

  const handleLeaveMeeting = () => {
    setActiveRoom(null);
    setActiveSubject('');
    if (searchParams.get('courseId')) {
      setSearchParams({});
    }
  };

  return (
    <div>
      {/* Cabeçalho da Página */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>📹</span> Aulas ao Vivo & Meet
          </h1>
          <p className="page-subtitle">
            Salas virtuais de videoconferência integradas via Jitsi Meet para aulas síncronas, tutorias e grupos de estudos.
          </p>
        </div>

        {activeRoom && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLeaveMeeting}
          >
            ← Voltar para Salas
          </button>
        )}
      </div>

      {/* ÁREA DA SALA ATIVA (JITSI MEET) */}
      {activeRoom ? (
        <div>
          <JitsiMeetView
            roomName={activeRoom}
            subject={activeSubject}
            user={user}
            onLeave={handleLeaveMeeting}
          />
        </div>
      ) : (
        /* SELETOR DE SALAS / CRIAÇÃO DE REUNIÃO */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Banner de Apresentação */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, var(--bg-surface) 60%, var(--primary-light))',
              border: '1px solid var(--primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
              padding: '1.5rem 1.75rem'
            }}
          >
            <div style={{ maxWidth: '650px' }}>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '0.5rem',
                  border: '1px solid var(--primary-border)'
                }}
              >
                Videoconferência Sem Limites
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                Salas Virtuais com Jitsi Meet Embutido
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Conecte-se instantaneamente com professores e colegas. Inclui áudio em alta definição, vídeo HD,
                compartilhamento de tela para slides e código, chat integrado e gravação de aulas.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.4rem' }}>🖥️</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.2rem' }}>Compartilhe Tela</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.4rem' }}>💬</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.2rem' }}>Chat e Reações</div>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.4rem' }}>✋</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.2rem' }}>Levantar a Mão</div>
              </div>
            </div>
          </div>

          {/* Grade de Cursos Disponíveis para o Meet */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {isStudent ? 'Salas de Aula dos Meus Cursos' : 'Salas de Aula das Minhas Disciplinas'}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {courses.length} curso{courses.length === 1 ? '' : 's'} disponível{courses.length === 1 ? '' : 'is'}
              </span>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Carregando salas virtuais...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📹</div>
                <h3>Nenhum curso disponível para aula ao vivo</h3>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  {isStudent
                    ? 'Você ainda não está matriculado em nenhum curso com sala virtual ativa.'
                    : 'Crie um curso para disponibilizar a sala virtual para seus alunos.'}
                </p>
                <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  {isStudent ? 'Ver Cursos Disponíveis' : 'Gerenciar Cursos'}
                </Link>
              </div>
            ) : (
              <div className="grid-cards">
                {courses.map((course) => (
                  <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span className="course-code-tag">{course.code}</span>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          backgroundColor: 'var(--primary-light)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)'
                        }}
                      >
                        Sala Virtual Ativa
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      {course.title}
                    </h3>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', flex: 1 }}>
                      {course.description || 'Acesse a sala de videoconferência síncrona desta disciplina.'}
                    </p>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      Professor(a): <strong>{course.teacherName || 'Instrutor'}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => startCourseMeeting(course)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      >
                        <span>📹</span> Entrar na Aula
                      </button>
                      <Link
                        to={`/courses/${course.id}`}
                        className="btn btn-secondary btn-sm"
                        title="Ver conteúdo do curso"
                      >
                        Curso →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção de Reunião Instantânea / Sala Personalizada */}
          <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚀</span> Criar ou Entrar em Sala Personalizada
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Precisa de um espaço rápido para monitoria, orientação de TCC ou estudo em grupo? Digite um nome e entre imediatamente:
            </p>

            <form
              onSubmit={handleStartCustomMeeting}
              style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
            >
              <input
                type="text"
                className="form-input"
                placeholder="Ex: grupo-estudos-algoritmos ou monitoria-tarde"
                value={customRoomName}
                onChange={(e) => setCustomRoomName(e.target.value)}
                style={{ maxWidth: '380px' }}
                required
              />
              <button type="submit" className="btn btn-secondary">
                <span>📹</span> Iniciar Sala Personalizada
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

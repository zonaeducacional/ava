import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { courseService, enrollmentService } from '../services/index.js';

export default function Courses() {
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal de Criação de Curso (Professor / Admin)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Modal de Matrícula (Aluno)
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState('');

  useEffect(() => {
    loadCoursesData();
  }, [user]);

  const loadCoursesData = async () => {
    setLoading(true);
    setError('');
    try {
      const all = await courseService.getAllCourses();
      setCourses(all);

      if (isStudent) {
        const myEnrs = await enrollmentService.getEnrollmentsByUser(user.id);
        setEnrolledCourseIds(myEnrs.map((e) => e.courseId));
      }
    } catch (err) {
      setError('Erro ao carregar cursos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreateLoading(true);
    try {
      await courseService.createCourse({
        title: newTitle,
        description: newDescription,
        teacherId: user.id,
        teacherName: user.name
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      await loadCoursesData();
    } catch (err) {
      alert('Erro ao criar curso: ' + err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEnrollByCode = async (e) => {
    e.preventDefault();
    if (!enrollCode.trim()) return;
    setEnrollLoading(true);
    setEnrollSuccessMsg('');
    try {
      const { course } = await enrollmentService.enrollByCode(user.id, enrollCode);
      setEnrollSuccessMsg(`Matrícula realizada com sucesso no curso "${course.title}"!`);
      setEnrollCode('');
      await loadCoursesData();
      setTimeout(() => {
        setShowEnrollModal(false);
        setEnrollSuccessMsg('');
      }, 1500);
    } catch (err) {
      alert(err.message);
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Carregando cursos disponíveis...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Cursos</h1>
          <p className="page-subtitle">
            Explore os cursos disponíveis no LMS ou gerencie seus conteúdos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isStudent && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowEnrollModal(true)}
            >
              🔑 Matricular com Código
            </button>
          )}

          {(isTeacher || isAdmin) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Criar Novo Curso
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Indicador de Filtro Ativo */}
      {searchQuery.trim() && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <div style={{ fontSize: '0.9rem' }}>
            <span>Filtrando cursos com título contendo: </span>
            <strong>"{searchQuery}"</strong> ({courses.filter((c) => c.title.toLowerCase().includes(searchQuery.trim().toLowerCase())).length} resultado(s))
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => setSearchParams({})}
          >
            ✕ Limpar Filtro
          </button>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📖</div>
          <h3>Nenhum curso cadastrado ainda</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1rem 0' }}>
            {isTeacher || isAdmin
              ? 'Clique no botão acima para criar o primeiro curso da instituição.'
              : 'Nenhum curso foi aberto no momento.'}
          </p>
        </div>
      ) : courses.filter((c) => c.title.toLowerCase().includes(searchQuery.trim().toLowerCase())).length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Nenhum curso encontrado</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.25rem 0' }}>
            Nenhum curso possui o título correspondente a "<strong>{searchQuery}</strong>".
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setSearchParams({})}
          >
            Mostrar Todos os Cursos
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {courses
            .filter((c) => c.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))
            .map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            const isMyCourse = course.teacherId === user?.id;

            return (
              <div key={course.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="course-card-top">
                  <span className="course-code-tag" title="Código de matrícula">{course.code}</span>
                  {isStudent && isEnrolled && (
                    <span className="user-role-tag role-student" style={{ fontSize: '0.75rem' }}>
                      ✓ Matriculado
                    </span>
                  )}
                  {isTeacher && isMyCourse && (
                    <span className="user-role-tag role-teacher" style={{ fontSize: '0.75rem' }}>
                      Seu Curso
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                  <Link to={`/courses/${course.id}`} style={{ color: 'inherit' }}>
                    {course.title}
                  </Link>
                </h2>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Professor(a): <strong>{course.teacherName || 'Não especificado'}</strong>
                </p>

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, marginBottom: '1.25rem' }}>
                  {course.description || 'Sem descrição cadastrada.'}
                </p>

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <Link
                    to={`/courses/${course.id}`}
                    className={`btn ${isEnrolled || isTeacher || isAdmin ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ flex: 1 }}
                  >
                    {isEnrolled || isTeacher || isAdmin ? 'Acessar Curso' : 'Ver Detalhes'}
                  </Link>

                  {isStudent && !isEnrolled && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setEnrollCode(course.code);
                        setShowEnrollModal(true);
                      }}
                    >
                      Matricular-se
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAR NOVO CURSO */}
      {showCreateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Criar Novo Curso</h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '0.2rem 0.6rem' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCourse}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="course-title">
                    Título do Curso *
                  </label>
                  <input
                    id="course-title"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Introdução à Programação Orientada a Objetos"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="course-desc">
                    Descrição e Ementa
                  </label>
                  <textarea
                    id="course-desc"
                    className="form-textarea"
                    placeholder="Descreva os objetivos, pré-requisitos e tópicos abordados..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={4}
                  />
                  <span className="form-helper">
                    O código de matrícula único será gerado automaticamente pelo sistema.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Criando...' : 'Salvar e Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE MATRÍCULA COM CÓDIGO */}
      {showEnrollModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Matrícula em Curso</h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowEnrollModal(false)}
                style={{ padding: '0.2rem 0.6rem' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEnrollByCode}>
              <div className="modal-body">
                {enrollSuccessMsg && <div className="alert alert-success">{enrollSuccessMsg}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-enroll-code">
                    Código de Matrícula Fornecido pelo Professor *
                  </label>
                  <input
                    id="modal-enroll-code"
                    type="text"
                    className="form-input"
                    placeholder="Ex: REACT101"
                    style={{ textTransform: 'uppercase', fontSize: '1.1rem', letterSpacing: '0.05em' }}
                    value={enrollCode}
                    onChange={(e) => setEnrollCode(e.target.value)}
                    required
                  />
                  <span className="form-helper">
                    Insira o código de 6 caracteres do curso desejado.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEnrollModal(false)}
                  disabled={enrollLoading}
                >
                  Fechar
                </button>
                <button type="submit" className="btn btn-primary" disabled={enrollLoading}>
                  {enrollLoading ? 'Verificando...' : 'Confirmar Matrícula'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

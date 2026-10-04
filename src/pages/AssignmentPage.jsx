import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  assignmentService,
  courseService,
  enrollmentService
} from '../services/index.js';

export default function AssignmentPage() {
  const { courseId, assignmentId } = useParams();
  const { user, isStudent, isTeacher, isAdmin } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado do Aluno
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [studentSuccessMsg, setStudentSuccessMsg] = useState('');

  // Estado do Professor
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [gradingModalData, setGradingModalData] = useState(null); // submission sendo avaliada
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [gradingLoading, setGradingLoading] = useState(false);

  const canGrade = isTeacher || isAdmin;

  useEffect(() => {
    loadAssignmentData();
  }, [assignmentId, user]);

  const loadAssignmentData = async () => {
    setLoading(true);
    setError('');
    try {
      // Tenta buscar por assignmentId ou pelo itemId correspondente
      let assignData = await assignmentService.getAssignment(assignmentId);
      if (!assignData) {
        assignData = await assignmentService.getAssignmentByItem(assignmentId);
      }

      if (!assignData) {
        setError('Tarefa não encontrada.');
        setLoading(false);
        return;
      }

      setAssignment(assignData);

      const courseData = await courseService.getCourseById(assignData.courseId || courseId);
      setCourse(courseData);

      if (isStudent) {
        const sub = await assignmentService.getStudentSubmission(assignData.id, user.id);
        setStudentSubmission(sub);
        if (sub) {
          setSubmissionText(sub.content || '');
        }
      }

      if (canGrade) {
        const subs = await assignmentService.getSubmissionsByAssignment(assignData.id);
        setAllSubmissions(subs);
        const enrs = await enrollmentService.getEnrollmentsByCourse(assignData.courseId || courseId);
        setEnrolledStudents(enrs);
      }
    } catch (err) {
      setError('Erro ao carregar tarefa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    if (!submissionText.trim()) return;
    setSubmitting(true);
    setStudentSuccessMsg('');
    try {
      const sub = await assignmentService.submitAssignment(
        assignment.id,
        user.id,
        user.name,
        submissionText
      );
      setStudentSubmission(sub);
      setStudentSuccessMsg('Entrega realizada com sucesso!');
      setTimeout(() => setStudentSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenGradeModal = (submission) => {
    setGradingModalData(submission);
    setGradeInput(submission.score !== null ? String(submission.score) : '');
    setFeedbackInput(submission.feedback || '');
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingModalData) return;
    setGradingLoading(true);
    try {
      await assignmentService.gradeSubmission(
        gradingModalData.id,
        gradeInput,
        feedbackInput,
        user.name
      );
      setGradingModalData(null);
      await loadAssignmentData();
    } catch (err) {
      alert(err.message);
    } finally {
      setGradingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Carregando tarefa...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto' }}>
        <div className="alert alert-error">{error || 'Tarefa não encontrada.'}</div>
        <Link to={`/courses/${courseId}`} className="btn btn-secondary">
          Voltar para o Curso
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to={`/courses/${assignment.courseId || courseId}`} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ← Voltar ao curso {course?.title ? `(${course.title})` : ''}
        </Link>
      </div>

      {/* DETALHES DA TAREFA */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="course-card-top">
          <span className="item-type-badge type-assignment">Tarefa Avaliativa</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            Nota máxima: {assignment.maxScore || 10} pontos
          </span>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.5rem 0' }}>
          {assignment.title}
        </h1>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          <div>
            Data limite de entrega:{' '}
            <strong>
              {assignment.dueDate
                ? new Date(assignment.dueDate).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Sem prazo estabelecido'}
            </strong>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Instruções da Atividade
          </h2>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            {assignment.description}
          </div>
        </div>
      </div>

      {/* ÁREA DO ALUNO: ENVIO E FEEDBACK */}
      {isStudent && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
            Sua Entrega
          </h2>

          {studentSuccessMsg && <div className="alert alert-success">{studentSuccessMsg}</div>}

          {/* Feedback do Professor se já avaliado */}
          {studentSubmission && studentSubmission.score !== null && (
            <div
              style={{
                backgroundColor: 'var(--success-light)',
                border: '1px solid var(--success-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>
                  Nota Atribuída: {studentSubmission.score} / {assignment.maxScore || 10}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Corrigido por {studentSubmission.gradedBy || 'Professor'} em{' '}
                  {new Date(studentSubmission.gradedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {studentSubmission.feedback && (
                <div style={{ marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                  <strong>Comentário do Professor:</strong>
                  <p style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                    "{studentSubmission.feedback}"
                  </p>
                </div>
              )}
            </div>
          )}

          {studentSubmission && studentSubmission.score === null && (
            <div className="alert alert-info">
              Sua entrega foi enviada em{' '}
              {new Date(studentSubmission.submittedAt).toLocaleString('pt-BR')}. Aguardando correção pelo professor.
            </div>
          )}

          <form onSubmit={handleStudentSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="submission-text">
                Texto ou Resolução da Atividade *
              </label>
              <textarea
                id="submission-text"
                className="form-textarea"
                rows={8}
                placeholder="Digite aqui o texto da sua resolução, resposta ou links de repositórios/projetos..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                required
              />
              <span className="form-helper">
                {studentSubmission
                  ? 'Você pode atualizar sua entrega a qualquer momento antes do fechamento.'
                  : 'Ao clicar em enviar, sua resposta será registrada no sistema.'}
              </span>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting
                ? 'Enviando...'
                : studentSubmission
                ? 'Atualizar Entrega'
                : 'Confirmar e Enviar Entrega'}
            </button>
          </form>
        </div>
      )}

      {/* ÁREA DO PROFESSOR: TODAS AS ENTREGAS E CORREÇÃO */}
      {canGrade && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Entregas dos Alunos ({allSubmissions.length} enviadas)
            </h2>
          </div>

          {allSubmissions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📥</div>
              <h3>Nenhuma entrega recebida ainda</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Os envios dos alunos para esta tarefa aparecerão aqui para você atribuir nota e feedback.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Data de Envio</th>
                    <th>Texto da Resposta</th>
                    <th>Nota</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubmissions.map((sub) => {
                    const isGraded = sub.score !== null && sub.score !== undefined;

                    return (
                      <tr key={sub.id}>
                        <td style={{ fontWeight: 600 }}>{sub.studentName}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {new Date(sub.submittedAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={{ maxWidth: '250px' }}>
                          <div
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.875rem'
                            }}
                            title={sub.content}
                          >
                            {sub.content}
                          </div>
                        </td>
                        <td>
                          {isGraded ? (
                            <strong style={{ color: 'var(--success)' }}>
                              {sub.score} / {assignment.maxScore || 10}
                            </strong>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          )}
                        </td>
                        <td>
                          {isGraded ? (
                            <span className="user-role-tag role-student">Corrigido</span>
                          ) : (
                            <span className="user-role-tag role-teacher">Pendente</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => handleOpenGradeModal(sub)}
                          >
                            {isGraded ? 'Reavaliar' : 'Avaliar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE AVALIAÇÃO DO PROFESSOR */}
      {gradingModalData && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Avaliar Entrega de {gradingModalData.studentName}
              </h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setGradingModalData(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveGrade}>
              <div className="modal-body">
                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Texto Enviado pelo Aluno:</label>
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      fontSize: '0.9rem',
                      lineHeight: 1.6
                    }}
                  >
                    {gradingModalData.content}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="grade-value-input">
                    Nota (Escala de 0 a 10) *
                  </label>
                  <input
                    id="grade-value-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    className="form-input"
                    placeholder="Ex: 8.5"
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    required
                  />
                  <span className="form-helper">
                    Digite um valor numérico válido entre 0 e 10.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="feedback-input">
                    Comentário e Feedback para o Aluno
                  </label>
                  <textarea
                    id="feedback-input"
                    className="form-textarea"
                    rows={4}
                    placeholder="Elogie os pontos fortes e aponte sugestões de melhoria..."
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setGradingModalData(null)}
                  disabled={gradingLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={gradingLoading}>
                  {gradingLoading ? 'Salvando...' : 'Salvar Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

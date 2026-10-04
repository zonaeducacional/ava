import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import CircularProgress from '../components/CircularProgress.jsx';
import { gradeService, courseService, enrollmentService } from '../services/index.js';

export default function Grades() {
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dados do Aluno
  const [studentGrades, setStudentGrades] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState(searchParams.get('courseId') || '');
  const [categoryFilter, setCategoryFilter] = useState('todas'); // 'todas' | 'tarefas' | 'quizzes'
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'avaliadas' | 'pendentes'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGradeId, setExpandedGradeId] = useState(null);

  // Dados do Professor / Admin (Boletim da Turma)
  const [teacherCourses, setTeacherCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('courseId') || '');
  const [gradebook, setGradebook] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, [user]);

  useEffect(() => {
    if (!isStudent && selectedCourseId) {
      loadCourseGradebook(selectedCourseId);
    }
  }, [selectedCourseId]);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isStudent) {
        const grades = await gradeService.getStudentGrades(user.id);
        setStudentGrades(grades);

        const myEnrs = await enrollmentService.getEnrollmentsByUser(user.id);
        const coursesList = myEnrs.map((e) => e.course).filter(Boolean);
        setEnrolledCourses(coursesList);
      } else {
        // Professor ou Admin
        let courses = [];
        if (isAdmin) {
          courses = await courseService.getAllCourses();
        } else {
          courses = await courseService.getCoursesByTeacher(user.id);
        }
        setTeacherCourses(courses);

        const currentId = searchParams.get('courseId') || (courses[0]?.id ?? '');
        setSelectedCourseId(currentId);
        if (currentId) {
          await loadCourseGradebook(currentId);
        }
      }
    } catch (err) {
      setError('Erro ao carregar notas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCourseGradebook = async (courseId) => {
    try {
      const data = await gradeService.getCourseGradebook(courseId);
      setGradebook(data);
    } catch (err) {
      console.error('Erro ao carregar boletim:', err);
    }
  };

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setSearchParams(courseId ? { courseId } : {});
  };

  const handleExportCSV = () => {
    if (!gradebook) return;
    try {
      gradeService.exportGradebookCSV(gradebook);
    } catch (err) {
      alert('Erro ao exportar CSV: ' + err.message);
    }
  };

  // ==========================================
  // CÁLCULOS ESTATÍSTICOS PARA O ALUNO
  // ==========================================
  const relevantGrades = selectedCourseFilter
    ? studentGrades.filter((g) => g.courseId === selectedCourseFilter)
    : studentGrades;

  // 1. Média Geral (atividades que possuem nota atribuída)
  const evaluatedGrades = relevantGrades.filter((g) => g.score !== null && g.score !== undefined);
  const totalScoreSum = evaluatedGrades.reduce((sum, g) => sum + g.score, 0);
  const overallAverage = evaluatedGrades.length > 0
    ? parseFloat((totalScoreSum / evaluatedGrades.length).toFixed(1))
    : null;
  const overallAveragePercent = overallAverage !== null ? Math.round((overallAverage / 10) * 100) : 0;

  // 2. Progresso por Categoria: Tarefas
  const assignmentGrades = relevantGrades.filter((g) => g.type === 'Tarefa');
  const totalAssignments = assignmentGrades.length;
  const submittedAssignments = assignmentGrades.filter(
    (g) => g.status === 'Entregue' || g.status === 'Avaliada'
  ).length;
  const evaluatedAssignments = assignmentGrades.filter((g) => g.score !== null && g.score !== undefined);
  const assignmentAvg = evaluatedAssignments.length > 0
    ? parseFloat(
        (
          evaluatedAssignments.reduce((acc, g) => acc + g.score, 0) /
          evaluatedAssignments.length
        ).toFixed(1)
      )
    : null;
  const assignmentProgress = totalAssignments > 0
    ? Math.round((submittedAssignments / totalAssignments) * 100)
    : 0;

  // 3. Progresso por Categoria: Quizzes
  const quizGrades = relevantGrades.filter((g) => g.type === 'Quiz');
  const totalQuizzes = quizGrades.length;
  const completedQuizzes = quizGrades.filter((g) => g.status === 'Concluído').length;
  const evaluatedQuizzes = quizGrades.filter((g) => g.score !== null && g.score !== undefined);
  const quizAvg = evaluatedQuizzes.length > 0
    ? parseFloat(
        (
          evaluatedQuizzes.reduce((acc, g) => acc + g.score, 0) /
          evaluatedQuizzes.length
        ).toFixed(1)
      )
    : null;
  const quizProgress = totalQuizzes > 0
    ? Math.round((completedQuizzes / totalQuizzes) * 100)
    : 0;

  // 4. Progresso Avaliativo Total
  const totalActivities = relevantGrades.length;
  const completedActivities = submittedAssignments + completedQuizzes;
  const totalProgress = totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0;

  // Filtro da tabela de histórico
  const filteredStudentGrades = relevantGrades.filter((g) => {
    if (categoryFilter === 'tarefas' && g.type !== 'Tarefa') return false;
    if (categoryFilter === 'quizzes' && g.type !== 'Quiz') return false;
    if (statusFilter === 'avaliadas' && (g.score === null || g.score === undefined)) return false;
    if (statusFilter === 'pendentes' && g.score !== null && g.score !== undefined) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = g.activityTitle.toLowerCase().includes(term);
      const matchCourse = g.courseTitle.toLowerCase().includes(term);
      if (!matchTitle && !matchCourse) return false;
    }
    return true;
  });

  const toggleExpandGrade = (id) => {
    setExpandedGradeId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Carregando boletim de notas...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isStudent ? 'Meu Histórico & Boletim de Notas' : 'Boletim da Turma'}
          </h1>
          <p className="page-subtitle">
            {isStudent
              ? 'Visualize o detalhamento de seu desempenho, média geral consolidada e progresso por categoria de atividade.'
              : 'Visualize a matriz de notas dos estudantes e exporte os dados para planilhas.'}
          </p>
        </div>

        {!isStudent && gradebook && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExportCSV}
            title="Exportar planilha compatível com Excel (com BOM UTF-8)"
          >
            📥 Exportar CSV
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* VISÃO ALUNO */}
      {isStudent && (
        <div>
          {/* PAINEL DE MÉTRICAS E PROGRESSO POR CATEGORIA */}
          <div className="grades-summary-grid">
            {/* Card 1: Média Geral */}
            <div className="grade-metric-card highlight">
              <div className="grade-metric-header">
                <span className="grade-metric-title">
                  <span>🎯</span> Média Geral Consolidada
                </span>
                {overallAverage !== null && (
                  <span
                    className={`grade-metric-badge ${
                      overallAverage >= 6 ? 'role-student' : 'role-teacher'
                    }`}
                  >
                    {overallAverage >= 6 ? 'Aprovado (≥ 6.0)' : 'Abaixo da Média (< 6.0)'}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginTop: 'auto' }}>
                <div>
                  <div className="grade-metric-value-row">
                    <span
                      className="grade-metric-value"
                      style={{
                        color:
                          overallAverage === null
                            ? 'var(--text-muted)'
                            : overallAverage >= 6
                            ? 'var(--success)'
                            : 'var(--danger)'
                      }}
                    >
                      {overallAverage !== null ? overallAverage.toFixed(1) : '-'}
                    </span>
                    <span className="grade-metric-max">/ 10</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {evaluatedGrades.length} de {relevantGrades.length} atividades avaliadas
                  </div>
                </div>

                <CircularProgress
                  percent={overallAveragePercent}
                  size={62}
                  strokeWidth={5}
                  color={overallAverage !== null && overallAverage >= 6 ? 'var(--success)' : 'var(--warning)'}
                />
              </div>
            </div>

            {/* Card 2: Progresso em Tarefas */}
            <div className="grade-metric-card">
              <div className="grade-metric-header">
                <span className="grade-metric-title">
                  <span>📝</span> Categoria: Tarefas
                </span>
                <span className="item-type-badge type-assignment" style={{ fontSize: '0.725rem' }}>
                  {submittedAssignments}/{totalAssignments} entregues
                </span>
              </div>

              <div className="grade-metric-value-row">
                <span className="grade-metric-value" style={{ color: assignmentAvg && assignmentAvg >= 6 ? 'var(--success)' : 'var(--text-primary)' }}>
                  {assignmentAvg !== null ? assignmentAvg.toFixed(1) : '-'}
                </span>
                <span className="grade-metric-max">/ 10 (Média de Tarefas)</span>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  <span>Taxa de Entrega</span>
                  <strong>{assignmentProgress}%</strong>
                </div>
                <div className="category-progress-track">
                  <div
                    className="category-progress-bar"
                    style={{
                      width: `${assignmentProgress}%`,
                      backgroundColor: assignmentProgress === 100 ? 'var(--success)' : 'var(--primary)'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {evaluatedAssignments.length} avaliadas pelo professor
                </div>
              </div>
            </div>

            {/* Card 3: Progresso em Quizzes */}
            <div className="grade-metric-card">
              <div className="grade-metric-header">
                <span className="grade-metric-title">
                  <span>❓</span> Categoria: Quizzes
                </span>
                <span className="item-type-badge type-quiz" style={{ fontSize: '0.725rem' }}>
                  {completedQuizzes}/{totalQuizzes} concluídos
                </span>
              </div>

              <div className="grade-metric-value-row">
                <span className="grade-metric-value" style={{ color: quizAvg && quizAvg >= 6 ? 'var(--success)' : 'var(--text-primary)' }}>
                  {quizAvg !== null ? quizAvg.toFixed(1) : '-'}
                </span>
                <span className="grade-metric-max">/ 10 (Melhor Nota)</span>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  <span>Taxa de Realização</span>
                  <strong>{quizProgress}%</strong>
                </div>
                <div className="category-progress-track">
                  <div
                    className="category-progress-bar"
                    style={{
                      width: `${quizProgress}%`,
                      backgroundColor: quizProgress === 100 ? 'var(--success)' : 'var(--secondary)'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Correção imediata e automática
                </div>
              </div>
            </div>

            {/* Card 4: Conclusão Geral de Avaliações */}
            <div className="grade-metric-card">
              <div className="grade-metric-header">
                <span className="grade-metric-title">
                  <span>📈</span> Conclusão Avaliativa
                </span>
                <span className="user-role-tag role-student" style={{ fontSize: '0.725rem' }}>
                  Geral
                </span>
              </div>

              <div className="grade-metric-value-row">
                <span className="grade-metric-value" style={{ color: totalProgress === 100 ? 'var(--success)' : 'var(--text-primary)' }}>
                  {totalProgress}%
                </span>
                <span className="grade-metric-max">concluído</span>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  <span>Progresso do Semestre</span>
                  <strong>{completedActivities}/{totalActivities} itens</strong>
                </div>
                <div className="category-progress-track">
                  <div
                    className="category-progress-bar"
                    style={{
                      width: `${totalProgress}%`,
                      background: 'linear-gradient(90deg, #f97316, #22c55e)'
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {relevantGrades.filter((g) => g.status === 'Pendente').length} pendência(s) restante(s)
                </div>
              </div>
            </div>
          </div>

          {/* BARRA DE FILTROS E PESQUISA */}
          <div className="grade-filters-bar">
            {/* Filtro por Curso */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '220px' }}>
              <label htmlFor="course-filter" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Curso:
              </label>
              <select
                id="course-filter"
                className="form-select"
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="">Todos os Cursos Matriculados</option>
                {enrolledCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Categoria */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Categoria:</span>
              <button
                type="button"
                className={`btn btn-sm ${categoryFilter === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategoryFilter('todas')}
              >
                Todas
              </button>
              <button
                type="button"
                className={`btn btn-sm ${categoryFilter === 'tarefas' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategoryFilter('tarefas')}
              >
                Tarefas ({assignmentGrades.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${categoryFilter === 'quizzes' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setCategoryFilter('quizzes')}
              >
                Quizzes ({quizGrades.length})
              </button>
            </div>

            {/* Filtro por Situação da Nota */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Situação:</span>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="todos">Todas</option>
                <option value="avaliadas">Avaliadas (com nota)</option>
                <option value="pendentes">Pendentes</option>
              </select>
            </div>

            {/* Busca textual */}
            <div style={{ minWidth: '180px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Buscar atividade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* TABELA DETALHADA DO HISTÓRICO DE NOTAS */}
          {filteredStudentGrades.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h3>Nenhuma atividade encontrada com os filtros selecionados</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Altere os filtros acima para visualizar outras atividades avaliativas.
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSelectedCourseFilter('');
                  setCategoryFilter('todas');
                  setStatusFilter('todos');
                  setSearchTerm('');
                }}
                style={{ marginTop: '1rem' }}
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Atividade</th>
                    <th>Categoria</th>
                    <th>Data / Prazo</th>
                    <th style={{ textAlign: 'center' }}>Nota Obtida</th>
                    <th style={{ textAlign: 'center' }}>Aproveitamento</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudentGrades.map((g) => {
                    const hasScore = g.score !== null && g.score !== undefined;
                    const isExpanded = expandedGradeId === g.id;
                    const percentScore = hasScore ? Math.round((g.score / (g.maxScore || 10)) * 100) : 0;

                    return (
                      <React.Fragment key={g.id}>
                        <tr style={{ backgroundColor: isExpanded ? 'var(--bg-subtle)' : 'transparent' }}>
                          <td style={{ fontWeight: 600 }}>{g.courseTitle}</td>
                          <td>
                            {g.type === 'Tarefa' ? (
                              <Link
                                to={`/courses/${g.courseId}/assignment/${g.activityId}`}
                                style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <span>📝</span> {g.activityTitle}
                              </Link>
                            ) : (
                              <Link
                                to={`/courses/${g.courseId}/quiz/${g.activityId}`}
                                style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <span>❓</span> {g.activityTitle}
                              </Link>
                            )}
                          </td>
                          <td>
                            <span
                              className={`item-type-badge ${
                                g.type === 'Tarefa' ? 'type-assignment' : 'type-quiz'
                              }`}
                            >
                              {g.type}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {g.submittedAt ? (
                              <span>Entregue em: {new Date(g.submittedAt).toLocaleDateString('pt-BR')}</span>
                            ) : g.dueDate ? (
                              <span>Prazo: {new Date(g.dueDate).toLocaleDateString('pt-BR')}</span>
                            ) : (
                              <span>Sem prazo fixo</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {hasScore ? (
                              <span
                                className={`grade-score-pill ${
                                  g.score >= 6 ? 'passing' : 'failing'
                                }`}
                              >
                                {g.score.toFixed(1)} / {g.maxScore || 10}
                              </span>
                            ) : (
                              <span className="grade-score-pill pending">
                                -
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {hasScore ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '90px' }}>
                                <div className="category-progress-track" style={{ margin: 0, height: '6px' }}>
                                  <div
                                    className="category-progress-bar"
                                    style={{
                                      width: `${percentScore}%`,
                                      backgroundColor: g.score >= 6 ? 'var(--success)' : 'var(--danger)'
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, width: '32px' }}>
                                  {percentScore}%
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pendente</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`user-role-tag ${
                                g.status === 'Avaliada' || g.status === 'Concluído'
                                  ? 'role-student'
                                  : g.status === 'Entregue'
                                  ? 'role-teacher'
                                  : 'role-admin'
                              }`}
                            >
                              {g.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => toggleExpandGrade(g.id)}
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                              title="Ver histórico e observações detalhadas"
                            >
                              {isExpanded ? '▲ Fechar' : '▼ Detalhes'}
                            </button>
                          </td>
                        </tr>

                        {/* LINHA DE DETALHAMENTO EXPANSÍVEL */}
                        {isExpanded && (
                          <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                            <td colSpan={8} style={{ padding: '1rem 1.25rem' }}>
                              <div
                                style={{
                                  backgroundColor: 'var(--bg-surface)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-md)',
                                  padding: '1rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.75rem'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                    Histórico de Avaliação: {g.activityTitle} ({g.courseTitle})
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {g.gradedBy && <span>Avaliador: <strong>{g.gradedBy}</strong> • </span>}
                                    {g.gradedAt && <span>Avaliado em: {new Date(g.gradedAt).toLocaleString('pt-BR')}</span>}
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '0.5rem 0' }}>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                                      Desempenho
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem', color: hasScore ? (g.score >= 6 ? 'var(--success)' : 'var(--danger)') : 'inherit' }}>
                                      {hasScore ? `${g.score} / ${g.maxScore || 10} (${percentScore}%)` : 'Ainda não avaliado'}
                                    </div>
                                  </div>

                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                                      Tentativas / Envios
                                    </div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                                      {g.type === 'Quiz'
                                        ? `${g.attemptsCount || 0} de ${g.maxAttempts || 3} tentativas`
                                        : g.submittedAt
                                        ? 'Entregue com sucesso'
                                        : 'Aguardando envio'}
                                    </div>
                                  </div>

                                  <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                                      Critério de Aprovação
                                    </div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                                      Nota mínima para aprovação: <strong>6.0 / 10</strong>
                                    </div>
                                  </div>
                                </div>

                                {g.feedback && (
                                  <div
                                    style={{
                                      backgroundColor: 'var(--bg-subtle)',
                                      padding: '0.75rem 1rem',
                                      borderRadius: 'var(--radius-sm)',
                                      borderLeft: '4px solid var(--primary)',
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    <strong>Observações do Professor / Sistema:</strong>
                                    <p style={{ marginTop: '0.25rem', color: 'var(--text-primary)' }}>{g.feedback}</p>
                                  </div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                                  {g.type === 'Tarefa' ? (
                                    <Link
                                      to={`/courses/${g.courseId}/assignment/${g.activityId}`}
                                      className="btn btn-sm btn-primary"
                                    >
                                      {hasScore ? 'Revisar Entrega' : 'Acessar Envio'} →
                                    </Link>
                                  ) : (
                                    <Link
                                      to={`/courses/${g.courseId}/quiz/${g.activityId}`}
                                      className="btn btn-sm btn-primary"
                                    >
                                      {hasScore ? 'Revisar Quiz' : 'Iniciar Quiz'} →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VISÃO PROFESSOR OU ADMIN */}
      {!isStudent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Seletor de Curso */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label className="form-label" style={{ marginBottom: 0 }}>
              Selecione o Curso:
            </label>
            <select
              className="form-select"
              style={{ maxWidth: '350px' }}
              value={selectedCourseId}
              onChange={(e) => handleSelectCourse(e.target.value)}
            >
              {teacherCourses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Matriz Alunos x Atividades */}
          {!gradebook || gradebook.students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>Nenhum aluno matriculado neste curso ainda</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Compartilhe o código de matrícula do curso para que os alunos possam ingressar.
              </p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Estudante</th>
                    <th>E-mail</th>
                    {gradebook.activities.map((act) => (
                      <th key={act.id} title={`${act.title} (${act.type})`}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>{act.title}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {act.type} (max {act.maxScore})
                          </span>
                        </div>
                      </th>
                    ))}
                    <th style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                      Média Geral
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gradebook.students.map((student) => (
                    <tr key={student.studentId}>
                      <td style={{ fontWeight: 600 }}>{student.studentName}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {student.studentEmail}
                      </td>

                      {gradebook.activities.map((act) => {
                        const score = student.grades[act.id];
                        const isGiven = score !== null && score !== undefined;

                        return (
                          <td key={act.id} style={{ textAlign: 'center' }}>
                            {isGiven ? (
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: score >= 6 ? 'var(--success)' : 'var(--danger)'
                                }}
                              >
                                {score}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>-</span>
                            )}
                          </td>
                        );
                      })}

                      <td style={{ backgroundColor: 'var(--primary-light)', textAlign: 'center' }}>
                        {student.average !== null && student.average !== undefined ? (
                          <strong
                            style={{
                              fontSize: '1rem',
                              color: student.average >= 6 ? 'var(--success)' : 'var(--danger)'
                            }}
                          >
                            {student.average}
                          </strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

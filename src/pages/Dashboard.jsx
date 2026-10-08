import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Clock,
  Calendar,
  BookOpen,
  GraduationCap,
  FileText,
  CheckCircle2,
  AlertCircle,
  Award,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import CircularProgress from '../components/CircularProgress.jsx';
import NotificationCenter from '../components/NotificationCenter.jsx';
import ActivityStatusBadge from '../components/ActivityStatusBadge.jsx';
import CourseProgressBarChart from '../components/CourseProgressBarChart.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import { generateCourseCertificate } from '../utils/generateCertificate.js';
import {
  courseService,
  enrollmentService,
  assignmentService,
  gradeService,
  userService,
  notificationService
} from '../services/index.js';

export default function Dashboard() {
  const { user, isStudent, isTeacher, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [pendingCorrections, setPendingCorrections] = useState(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrollMsg, setEnrollMsg] = useState({ type: '', text: '' });
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isStudent) {
        // Cursos matriculados com progresso
        const myEnrollments = await enrollmentService.getEnrollmentsByUser(user.id);
        setCourses(myEnrollments);

        // Notificações do aluno (tarefas, notas publicadas, avisos)
        const notifs = await notificationService.getStudentNotifications(user.id);
        setNotifications(notifs);

        // Próximas tarefas pendentes
        const allGrades = await gradeService.getStudentGrades(user.id);
        const pendingTasks = allGrades
          .filter((g) => g.type === 'Tarefa' && g.status === 'Pendente')
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5);
        setUpcomingDeadlines(pendingTasks);
      } else if (isTeacher) {
        // Notificações do professor (entregas pendentes, quizzes, avisos)
        const notifs = await notificationService.getTeacherNotifications(user.id);
        setNotifications(notifs);

        // Cursos ministrados
        const teacherCourses = await courseService.getCoursesByTeacher(user.id);
        const coursesWithStats = await Promise.all(
          teacherCourses.map(async (c) => {
            const enrs = await enrollmentService.getEnrollmentsByCourse(c.id);
            const fullCourse = await courseService.getCourseById(c.id);
            const totalItems = fullCourse?.sections?.reduce(
              (acc, sec) => acc + (sec.items?.length || 0),
              0
            ) || 0;

            let avgProgress = 0;
            if (enrs.length > 0 && totalItems > 0) {
              const totalCompleted = enrs.reduce(
                (acc, enr) => acc + (enr.completedItemIds?.length || 0),
                0
              );
              avgProgress = Math.round((totalCompleted / (enrs.length * totalItems)) * 100);
            }

            return {
              ...c,
              totalItems,
              enrolledCount: enrs.length,
              avgProgress
            };
          })
        );
        setCourses(coursesWithStats);

        // Entregas aguardando correção
        const pendingCount = await assignmentService.getPendingCountForTeacher(user.id);
        setPendingCorrections(pendingCount);
      } else if (isAdmin) {
        // Estatísticas do sistema
        const allUsers = await userService.getAllUsers();
        const allCourses = await courseService.getAllCourses();
        setCourses(allCourses);
        setAdminStats({
          totalUsers: allUsers.length,
          students: allUsers.filter((u) => u.role === 'aluno').length,
          teachers: allUsers.filter((u) => u.role === 'professor').length,
          courses: allCourses.length
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrollMsg({ type: '', text: '' });
    setEnrolling(true);
    try {
      const result = await enrollmentService.enrollByCode(user.id, enrollCode);
      setEnrollMsg({
        type: 'success',
        text: `Matrícula realizada com sucesso em "${result.course.title}"!`
      });
      setEnrollCode('');
      loadDashboardData();
    } catch (err) {
      setEnrollMsg({ type: 'error', text: err.message });
    } finally {
      setEnrolling(false);
    }
  };

  const handleMarkAsRead = (id) => {
    if (!user) return;
    notificationService.markAsRead(user.id, id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    notificationService.markAllAsRead(user.id, unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Carregando seu painel...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/profile" title="Ver e editar meu perfil" style={{ textDecoration: 'none' }}>
            <UserAvatar user={user} size={52} showBorder borderColor="#2e97b7" />
          </Link>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>Olá, {user?.name}!</h1>
            <p className="page-subtitle" style={{ margin: '0.2rem 0 0 0' }}>
              {isStudent && 'Acompanhe seus cursos, tarefas pendentes e progresso acadêmico.'}
              {isTeacher && 'Gerencie seus cursos, novos conteúdos e avaliações de estudantes.'}
              {isAdmin && 'Visão executiva do LMS e gerenciamento de membros.'}
            </p>
          </div>
        </div>

        {isStudent && (
          <form
            onSubmit={handleEnroll}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <input
              type="text"
              className="form-input"
              style={{ width: '180px', textTransform: 'uppercase' }}
              placeholder="Código do curso"
              value={enrollCode}
              onChange={(e) => setEnrollCode(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={enrolling}>
              {enrolling ? 'Matriculando...' : 'Matricular-se'}
            </button>
          </form>
        )}

        {isTeacher && (
          <Link to="/courses" className="btn btn-primary">
            + Criar Novo Curso
          </Link>
        )}
      </div>

      {enrollMsg.text && (
        <div className={`alert alert-${enrollMsg.type}`}>
          {enrollMsg.text}
        </div>
      )}

      {/* Visão Aluno */}
      {isStudent && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Central de Notificações */}
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            isStudent={true}
          />

          {/* Card informativo de próximos prazos */}
          {upcomingDeadlines.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="var(--warning)" />
                  <span>Próximos Prazos de Tarefas & Provas</span>
                </h2>
                <Link
                  to="/calendar"
                  className="btn btn-sm btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                >
                  <Calendar size={14} />
                  <span>Abrir Calendário Completo →</span>
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {upcomingDeadlines.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <strong>{task.activityTitle}</strong>
                        <ActivityStatusBadge status="pending" size="sm" />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Curso: {task.courseTitle}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 600 }}>
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo fixo'}
                      </span>
                      <div>
                        <Link
                          to={`/courses/${task.courseId}/assignment/${task.activityId}`}
                          className="btn btn-sm btn-outline"
                          style={{ marginTop: '0.25rem' }}
                        >
                          Entregar
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cursos Matriculados */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Meus Cursos</h2>
              <Link to="/courses" className="btn btn-sm btn-secondary">
                Ver todos os cursos
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <BookOpen size={44} color="var(--primary)" />
                </div>
                <h3>Você ainda não está matriculado em nenhum curso</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.25rem 0' }}>
                  Utilize o código fornecido pelo seu professor (exemplo do curso inicial: <strong>REACT101</strong>) para se matricular.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setEnrollCode('REACT101')}
                >
                  Usar código REACT101
                </button>
              </div>
            ) : (
              <div className="grid-cards">
                {courses.map((enr) => (
                  <div key={enr.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="course-card-top" style={{ alignItems: 'center' }}>
                      <span className="course-code-tag">{enr.course?.code}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {enr.completedCount}/{enr.totalItems} concluídos
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', margin: '0.5rem 0 1rem 0' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                          <Link to={`/courses/${enr.course?.id}`} style={{ color: 'inherit' }}>
                            {enr.course?.title}
                          </Link>
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {enr.course?.description?.substring(0, 95)}...
                        </p>
                      </div>

                      {/* Indicador Visual Circular de Progresso */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <CircularProgress percent={enr.progressPercent} size={64} strokeWidth={5} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600 }}>
                          {enr.progressPercent === 100 ? 'Concluído' : 'Progresso'}
                        </span>
                      </div>
                    </div>

                    {/* Gráfico de Barras com Recharts: Atividades Entregues vs. Pendentes vs. Total */}
                    <CourseProgressBarChart
                      completed={enr.completedCount}
                      total={enr.totalItems}
                    />

                    <div style={{ marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.825rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Atividades concluídas:</span>
                        <strong>{enr.completedCount} de {enr.totalItems} ({enr.progressPercent}%)</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <Link to={`/courses/${enr.course?.id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                          {enr.progressPercent === 100 ? 'Revisar Conteúdo' : 'Continuar Estudando'}
                        </Link>
                        {enr.progressPercent === 100 && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              backgroundColor: '#2e97b7',
                              color: '#ffffff',
                              border: 'none',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              padding: '0.4rem 0.65rem'
                            }}
                            title="Baixar Certificado de Conclusão em PDF"
                            onClick={() =>
                              generateCourseCertificate({
                                studentName: user?.name || 'Estudante',
                                courseTitle: enr.course?.title || 'Curso',
                                courseCode: enr.course?.code || 'LMS',
                                teacherName: enr.course?.teacherName || 'Docente Responsável'
                              })
                            }
                          >
                            🎓 Certificado
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visão Professor */}
      {isTeacher && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Central de Notificações */}
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            isTeacher={true}
          />

          {/* Card de Alerta de Correções */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: pendingCorrections > 0 ? 'var(--warning-light)' : 'var(--success-light)',
                  color: pendingCorrections > 0 ? 'var(--warning)' : 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {pendingCorrections > 0 ? <FileText size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Entregas de Tarefas</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {pendingCorrections > 0
                    ? `Você tem ${pendingCorrections} tarefa(s) aguardando sua correção e nota.`
                    : 'Todas as tarefas enviadas pelos alunos estão avaliadas!'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <Link to="/teacher/assignments" className="btn btn-primary">
                Gerenciar Entregas & Urgências →
              </Link>
              <Link to="/grades" className="btn btn-outline">
                Acessar Boletim
              </Link>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Meus Cursos Ministrados</h2>
              <Link to="/courses" className="btn btn-sm btn-outline">
                Gerenciar Cursos
              </Link>
            </div>

            {courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <GraduationCap size={44} color="var(--primary)" />
                </div>
                <h3>Você ainda não possui cursos cadastrados</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1rem 0' }}>
                  Crie o seu primeiro curso para organizar módulos, tarefas e quizzes.
                </p>
                <Link to="/courses" className="btn btn-primary">
                  Criar Primeiro Curso
                </Link>
              </div>
            ) : (
              <div className="grid-cards">
                {courses.map((c) => (
                  <div key={c.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="course-card-top" style={{ alignItems: 'center' }}>
                      <span className="course-code-tag">Código: {c.code}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {c.enrolledCount || 0} aluno(s)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', margin: '0.5rem 0 1rem 0' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                          <Link to={`/courses/${c.id}`} style={{ color: 'inherit' }}>
                            {c.title}
                          </Link>
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {c.description ? c.description.substring(0, 95) + '...' : 'Sem descrição cadastrada.'}
                        </p>
                      </div>

                      {/* Indicador Visual Circular de Progresso Médio da Turma */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <CircularProgress percent={c.avgProgress || 0} size={64} strokeWidth={5} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600 }}>
                          Média Turma
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                      <Link to={`/courses/${c.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                        Abrir Conteúdo
                      </Link>
                      <Link to={`/grades?courseId=${c.id}`} className="btn btn-secondary btn-sm">
                        Boletim
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visão Administrador */}
      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {adminStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="card">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total de Usuários</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem' }}>{adminStats.totalUsers}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  {adminStats.students} alunos • {adminStats.teachers} professores
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cursos Cadastrados</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                  {adminStats.courses}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Ativos na plataforma
                </div>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Link to="/admin/users" className="btn btn-primary">
                  Gerenciar Perfis de Usuários
                </Link>
              </div>
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              Todos os Cursos do Sistema
            </h2>
            <div className="grid-cards">
              {courses.map((c) => (
                <div key={c.id} className="card">
                  <div className="course-card-top">
                    <span className="course-code-tag">{c.code}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Prof. {c.teacherName || 'Geral'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>{c.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {c.description}
                  </p>
                  <Link to={`/courses/${c.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                    Visualizar como Admin
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

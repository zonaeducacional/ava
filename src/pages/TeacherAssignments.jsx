import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  Download,
  Send,
  Eye,
  Edit3,
  GraduationCap,
  Users,
  Check,
  X,
  Sparkles,
  RefreshCw,
  BookOpen,
  Bell,
  ExternalLink,
  ChevronDown,
  Layers,
  Award,
  Trash2
} from 'lucide-react';
import UserAvatar from '../components/UserAvatar.jsx';
import ActivityStatusBadge from '../components/ActivityStatusBadge.jsx';
import { assignmentService } from '../services/index.js';
import { webPushService } from '../services/webPushService.js';

export default function TeacherAssignments() {
  const { user, isTeacher, isAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    courses: [],
    items: [],
    totalCourses: 0,
    totalExpectedSubmissions: 0,
    totalSubmissions: 0,
    pendingGradeCount: 0,
    urgentTeacherCount: 0,
    gradedCount: 0,
    notSubmittedCount: 0,
    urgentStudentCount: 0,
    totalUrgentCount: 0,
    overallDeliveryRate: 0
  });

  const [searchParams] = useSearchParams();

  // Filtros inicializados com parâmetros da URL se existirem
  const [selectedCourseId, setSelectedCourseId] = useState(searchParams.get('courseId') || 'all');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(searchParams.get('assignmentId') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all'); // 'all' | 'urgent' | 'pending_grade' | 'not_submitted' | 'graded'
  const [urgencyOnly, setUrgencyOnly] = useState(searchParams.get('urgent') === 'true');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modal de Avaliação / Correção Rápida
  const [gradingModalItem, setGradingModalItem] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Modal de Visualização de Submissão
  const [previewModalItem, setPreviewModalItem] = useState(null);

  // Estado de Ações Rápidas (Lembretes)
  const [remindingStudentId, setRemindingStudentId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    loadOverviewData();
  }, [user]);

  const loadOverviewData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const overview = await assignmentService.getTeacherSubmissionsOverview(
        user.id,
        isAdmin
      );
      setData(overview);
    } catch (err) {
      console.error('Erro ao carregar dados do painel de professores:', err);
      setError('Falha ao carregar painel de entregas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Lista de tarefas disponíveis para filtro de acordo com o curso selecionado
  const availableAssignments = useMemo(() => {
    const assignmentsMap = new Map();
    data.items.forEach((item) => {
      if (selectedCourseId === 'all' || item.courseId === selectedCourseId) {
        if (!assignmentsMap.has(item.assignmentId)) {
          assignmentsMap.set(item.assignmentId, {
            id: item.assignmentId,
            title: item.assignmentTitle,
            courseTitle: item.courseTitle,
            dueDate: item.assignmentDueDate
          });
        }
      }
    });
    return Array.from(assignmentsMap.values());
  }, [data.items, selectedCourseId]);

  // Itens filtrados
  const filteredItems = useMemo(() => {
    return data.items.filter((item) => {
      // 1. Filtro por Curso
      if (selectedCourseId !== 'all' && item.courseId !== selectedCourseId) {
        return false;
      }

      // 2. Filtro por Tarefa
      if (selectedAssignmentId !== 'all' && item.assignmentId !== selectedAssignmentId) {
        return false;
      }

      // 3. Filtro Urgência Estrito
      if (urgencyOnly && !item.isUrgent) {
        return false;
      }

      // 4. Filtro por Status
      if (statusFilter === 'urgent' && !item.isUrgent) {
        return false;
      }
      if (statusFilter === 'pending_grade' && item.status !== 'pending_grade') {
        return false;
      }
      if (statusFilter === 'not_submitted' && item.status !== 'not_submitted') {
        return false;
      }
      if (statusFilter === 'graded' && item.status !== 'graded') {
        return false;
      }

      // 5. Busca Textual
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesStudent =
          item.studentName.toLowerCase().includes(query) ||
          item.studentEmail.toLowerCase().includes(query);
        const matchesAssignment = item.assignmentTitle.toLowerCase().includes(query);
        const matchesCourse = item.courseTitle.toLowerCase().includes(query);
        if (!matchesStudent && !matchesAssignment && !matchesCourse) {
          return false;
        }
      }

      return true;
    });
  }, [data.items, selectedCourseId, selectedAssignmentId, statusFilter, urgencyOnly, searchTerm]);

  // Lista de itens urgentes para o Radar de Prioridades
  const urgentPriorities = useMemo(() => {
    return data.items.filter((item) => item.isUrgent);
  }, [data.items]);

  // Grupos por tarefa para a visão em Cards
  const groupedByAssignment = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      if (!groups[item.assignmentId]) {
        groups[item.assignmentId] = {
          assignmentId: item.assignmentId,
          assignmentTitle: item.assignmentTitle,
          assignmentDescription: item.assignmentDescription,
          assignmentDueDate: item.assignmentDueDate,
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          courseCode: item.courseCode,
          items: []
        };
      }
      groups[item.assignmentId].items.push(item);
    });
    return Object.values(groups);
  }, [filteredItems]);

  // Abrir Modal de Avaliação
  const handleOpenGrading = (item) => {
    setGradingModalItem(item);
    setGradeScore(item.score !== null && item.score !== undefined ? String(item.score) : '');
    setGradeFeedback(item.feedback || '');
  };

  // Salvar Avaliação Rápida
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingModalItem) return;

    const numScore = parseFloat(gradeScore);
    if (isNaN(numScore) || numScore < 0 || numScore > (gradingModalItem.maxScore || 10)) {
      alert(`A nota deve estar entre 0 e ${gradingModalItem.maxScore || 10}.`);
      return;
    }

    setIsSavingGrade(true);
    try {
      let submissionId = gradingModalItem.submissionId;

      // Se por ventura ainda não existia submissão formal (ex: professor dando nota direta)
      if (!submissionId) {
        const newSub = await assignmentService.submitAssignment(
          gradingModalItem.assignmentId,
          gradingModalItem.studentId,
          gradingModalItem.studentName,
          '[Avaliação Direta do Professor]'
        );
        submissionId = newSub.id;
      }

      await assignmentService.gradeSubmission(
        submissionId,
        numScore,
        gradeFeedback,
        user.name
      );

      // Notificação via Web Push se ativado
      try {
        if (webPushService.getPermission() === 'granted') {
          webPushService.sendNotification({
            title: `Nota Lançada: ${gradingModalItem.assignmentTitle}`,
            body: `Nota ${numScore} atribuída para ${gradingModalItem.studentName}.`,
            url: `/grades?courseId=${gradingModalItem.courseId}`
          });
        }
      } catch (e) {
        // Ignora falhas de push
      }

      showToast(`Nota lançada com sucesso para ${gradingModalItem.studentName}!`);
      setGradingModalItem(null);
      await loadOverviewData();
    } catch (err) {
      alert('Erro ao salvar nota: ' + err.message);
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Excluir / Resetar Entrega do Aluno (Admin / Professor)
  const handleDeleteSubmission = async (submissionId, studentName) => {
    if (!submissionId) return;
    if (
      !window.confirm(
        `ATENÇÃO: Deseja realmente excluir a entrega do aluno "${studentName}"?\n\nO status voltará para não entregue e o aluno poderá enviar uma nova resposta.`
      )
    ) {
      return;
    }
    try {
      await assignmentService.deleteSubmission(submissionId);
      showToast(`Entrega de "${studentName}" excluída com sucesso!`);
      await loadOverviewData();
    } catch (err) {
      alert('Erro ao excluir entrega: ' + err.message);
    }
  };

  // Enviar Lembrete ao Aluno
  const handleSendReminder = async (item) => {
    setRemindingStudentId(item.id);
    try {
      await assignmentService.sendStudentReminder(
        item.studentId,
        item.assignmentId,
        item.courseId,
        user.name
      );

      // Dispara push notification para o aluno no navegador
      try {
        if (webPushService.getPermission() === 'granted') {
          webPushService.sendNotification({
            title: `Lembrete de Tarefa: ${item.assignmentTitle}`,
            body: `Você possui prazo limite para entrega na turma ${item.courseTitle}.`,
            url: `/courses/${item.courseId}/assignment/${item.assignmentId}`
          });
        }
      } catch (e) {
        // Ignora
      }

      showToast(`Lembrete oficial enviado para ${item.studentName}!`);
    } catch (err) {
      alert('Erro ao enviar lembrete: ' + err.message);
    } finally {
      setRemindingStudentId(null);
    }
  };

  // Exportar Relatório CSV
  const handleExportCSV = () => {
    let name = 'todas_turmas';
    if (selectedCourseId !== 'all') {
      const c = data.courses.find((cs) => cs.course.id === selectedCourseId);
      if (c) name = c.course.code || c.course.title;
    }
    assignmentService.exportSubmissionsCSV(filteredItems, name);
    showToast('Planilha CSV gerada e baixada com sucesso!');
  };

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setSelectedCourseId('all');
    setSelectedAssignmentId('all');
    setStatusFilter('all');
    setUrgencyOnly(false);
    setSearchTerm('');
  };

  const hasActiveFilters =
    selectedCourseId !== 'all' ||
    selectedAssignmentId !== 'all' ||
    statusFilter !== 'all' ||
    urgencyOnly ||
    searchTerm.trim() !== '';

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toastMessage.type === 'success' ? '#259e82' : '#dc2626',
            color: '#ffffff',
            padding: '0.85rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.9rem',
            fontWeight: 600,
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <Check size={18} />
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* CABEÇALHO DO PAINEL */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(46, 151, 183, 0.12) 0%, rgba(50, 185, 190, 0.08) 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem',
          border: '1px solid rgba(46, 151, 183, 0.22)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                backgroundColor: 'var(--primary)',
                color: '#fff',
                fontSize: '0.725rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-xs)',
                letterSpacing: '0.04em'
              }}
            >
              Docência & Gestão Acadêmica
            </span>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {isAdmin ? 'Visão Global de Administrador' : `Professor(a): ${user?.name}`}
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Status de Entrega de Tarefas das Turmas
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Acompanhe entregas, pendências urgentes e avaliações de todas as suas turmas em um painel unificado.
          </p>
        </div>

        {/* Botões de Ação do Topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadOverviewData}
            disabled={loading}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
            title="Recarregar dados"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Atualizar</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
            title="Baixar planilha formatada com notas e entregas"
          >
            <Download size={15} />
            <span>Exportar Relatório (CSV)</span>
          </button>
          <Link
            to="/grades"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem' }}
          >
            <Award size={15} />
            <span>Ver Boletim Geral</span>
          </Link>
        </div>
      </div>

      {/* KPI METRICS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* CARD 1: TAXA DE ENTREGA */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '4px solid var(--primary)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Taxa Geral de Entregas
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(46, 151, 183, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {data.overallDeliveryRate}%
            </span>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              ({data.totalSubmissions}/{data.totalExpectedSubmissions} esperadas)
            </span>
          </div>
          {/* Barra de progresso */}
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'var(--border-color-subtle)',
              borderRadius: '999px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${data.overallDeliveryRate}%`,
                height: '100%',
                backgroundColor: 'var(--primary)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        {/* CARD 2: AGUARDANDO CORREÇÃO */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            position: 'relative',
            cursor: 'pointer',
            borderTop: '4px solid #b38200'
          }}
          onClick={() => {
            setStatusFilter(statusFilter === 'pending_grade' ? 'all' : 'pending_grade');
            setUrgencyOnly(false);
          }}
          title="Clique para filtrar apenas tarefas aguardando sua correção"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Aguardando Correção
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--warning-light)',
                color: '#b38200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Clock size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {data.pendingGradeCount}
            </span>
            <span style={{ fontSize: '0.825rem', color: '#b38200', fontWeight: 600 }}>
              {data.urgentTeacherCount > 0 ? `(${data.urgentTeacherCount} prioritárias)` : 'em dia'}
            </span>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Tarefas enviadas pelos alunos aguardando nota docente
          </div>
        </div>

        {/* CARD 3: PENDÊNCIAS URGENTES (RADAR) */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            position: 'relative',
            cursor: 'pointer',
            backgroundColor: data.totalUrgentCount > 0 ? '#fff8f6' : 'var(--bg-surface)',
            borderTop: '4px solid #dc2626',
            boxShadow: data.totalUrgentCount > 0 ? '0 4px 18px rgba(220, 38, 38, 0.12)' : 'var(--shadow-sm)'
          }}
          onClick={() => {
            setUrgencyOnly(!urgencyOnly);
            if (!urgencyOnly) setStatusFilter('all');
          }}
          title="Clique para filtrar apenas as pendências urgentes"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.825rem', color: '#dc2626', fontWeight: 700 }}>
                Pendências Urgentes
              </span>
              {data.totalUrgentCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#fff',
                    fontSize: '0.675rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    fontWeight: 800
                  }}
                >
                  CRÍTICO
                </span>
              )}
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(220, 38, 38, 0.12)',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#dc2626' }}>
              {data.totalUrgentCount}
            </span>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              ({data.urgentTeacherCount} notas + {data.urgentStudentCount} alunos)
            </span>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            {urgencyOnly ? '✓ Filtro ativo (apenas urgências)' : 'Exigem ação imediata (prazo estourando ou atraso)'}
          </div>
        </div>

        {/* CARD 4: NÃO ENTREGUES / PENDÊNCIAS DE ALUNOS */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            position: 'relative',
            cursor: 'pointer',
            borderTop: '4px solid var(--secondary)'
          }}
          onClick={() => {
            setStatusFilter(statusFilter === 'not_submitted' ? 'all' : 'not_submitted');
            setUrgencyOnly(false);
          }}
          title="Clique para filtrar apenas alunos sem entrega"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Não Entregues (Alunos)
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--secondary-light)',
                color: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {data.notSubmittedCount}
            </span>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              ({Math.round((data.notSubmittedCount / (data.totalExpectedSubmissions || 1)) * 100)}% da turma)
            </span>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Alunos matriculados que ainda não enviaram a atividade
          </div>
        </div>

        {/* CARD 5: AVALIADAS / CONCLUÍDAS */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            position: 'relative',
            cursor: 'pointer',
            borderTop: '4px solid #259e82'
          }}
          onClick={() => {
            setStatusFilter(statusFilter === 'graded' ? 'all' : 'graded');
            setUrgencyOnly(false);
          }}
          title="Clique para filtrar apenas tarefas corrigidas"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Tarefas Avaliadas
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--success-light)',
                color: '#259e82',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {data.gradedCount}
            </span>
            <span style={{ fontSize: '0.825rem', color: '#259e82', fontWeight: 600 }}>
              com nota atribuída
            </span>
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Entregas corrigidas e com feedback pedagógico registrado
          </div>
        </div>
      </div>

      {/* RADAR DE PENDÊNCIAS URGENTES (SEÇÃO EXPANSÍVEL DE ATENÇÃO IMEDIATA) */}
      {urgentPriorities.length > 0 && (
        <div
          className="card"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.03)',
            border: '1.5px solid rgba(220, 38, 38, 0.28)',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#dc2626' }}>
                  🚨 Radar de Pendências Críticas ({urgentPriorities.length})
                </h3>
                <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Situações prioritárias que exigem ação direta do docente: correções aguardando há mais de 48h ou alunos sem envio com prazo vencido/a vencer.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{
                borderColor: '#dc2626',
                color: '#dc2626',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
              onClick={() => {
                setUrgencyOnly(!urgencyOnly);
                if (!urgencyOnly) setStatusFilter('all');
              }}
            >
              {urgencyOnly ? 'Mostrar Todas as Entregas' : 'Filtrar Apenas Estas Urgências →'}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '0.75rem'
            }}
          >
            {urgentPriorities.slice(0, 4).map((urgent) => (
              <div
                key={urgent.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      color: urgent.status === 'pending_grade' ? '#b38200' : '#dc2626',
                      backgroundColor: urgent.status === 'pending_grade' ? 'var(--warning-light)' : 'rgba(220, 38, 38, 0.08)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-xs)'
                    }}
                  >
                    {urgent.status === 'pending_grade' ? '⏳ Correção Pendente' : '⚠️ Aluno em Atraso'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {urgent.courseCode}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {urgent.studentName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>
                  {urgent.assignmentTitle}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                  Motivo: {urgent.urgencyReason}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  {urgent.status === 'pending_grade' ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', flex: 1 }}
                      onClick={() => handleOpenGrading(urgent)}
                    >
                      Avaliar Agora
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', flex: 1 }}
                      onClick={() => handleSendReminder(urgent)}
                      disabled={remindingStudentId === urgent.id}
                    >
                      <Bell size={12} style={{ marginRight: '0.25rem' }} />
                      {remindingStudentId === urgent.id ? 'Enviando...' : 'Cobrar Aluno'}
                    </button>
                  )}
                  <Link
                    to={`/courses/${urgent.courseId}/assignment/${urgent.assignmentId}`}
                    className="btn btn-sm btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.55rem' }}
                    title="Abrir página da tarefa"
                  >
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS & PESQUISA */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Filtros de Turmas e Atividades
            </h3>
            {hasActiveFilters && (
              <span
                style={{
                  fontSize: '0.725rem',
                  backgroundColor: 'rgba(46, 151, 183, 0.12)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                Filtros ativos
              </span>
            )}
          </div>

          {/* Toggle de Visualização (Tabela vs Cards) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Visualização:</span>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.775rem', padding: '0.3rem 0.65rem' }}
              onClick={() => setViewMode('table')}
            >
              Tabela Geral
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.775rem', padding: '0.3rem 0.65rem' }}
              onClick={() => setViewMode('cards')}
            >
              Agrupado por Tarefa
            </button>
          </div>
        </div>

        {/* Linha de Controles de Filtro */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}
        >
          {/* 1. SELETOR DE CURSO / TURMA */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Turma / Curso:
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedAssignmentId('all'); // Reseta tarefa ao mudar curso
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">Todas as Turmas ({data.courses.length})</option>
              {data.courses.map((cs) => (
                <option key={cs.course.id} value={cs.course.id}>
                  {cs.course.code ? `[${cs.course.code}] ` : ''}
                  {cs.course.title} ({cs.submissionsCount}/{cs.expectedSubmissions})
                </option>
              ))}
            </select>
          </div>

          {/* 2. SELETOR DE TAREFA */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Tarefa Específica:
            </label>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">Todas as Tarefas ({availableAssignments.length})</option>
              {availableAssignments.map((assign) => (
                <option key={assign.id} value={assign.id}>
                  {assign.title}
                </option>
              ))}
            </select>
          </div>

          {/* 3. FILTRO DE STATUS DA ENTREGA */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Status da Entrega:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                if (e.target.value !== 'urgent') setUrgencyOnly(false);
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">Todos os Status</option>
              <option value="urgent">🚨 Apenas Urgências Prioritárias ({data.totalUrgentCount})</option>
              <option value="pending_grade">⏳ Aguardando Correção ({data.pendingGradeCount})</option>
              <option value="not_submitted">⚠️ Não Entregues pelos Alunos ({data.notSubmittedCount})</option>
              <option value="graded">✅ Já Avaliadas com Nota ({data.gradedCount})</option>
            </select>
          </div>

          {/* 4. BUSCA TEXTUAL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Buscar por Aluno ou Atividade:
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome do aluno, e-mail ou tarefa..."
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2.1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  fontSize: '0.85rem'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Pills & Botão Limpar Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Atalhos:</span>
            <button
              type="button"
              className={`btn btn-sm ${urgencyOnly ? 'btn-primary' : 'btn-outline'}`}
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.55rem',
                borderColor: '#dc2626',
                color: urgencyOnly ? '#fff' : '#dc2626',
                backgroundColor: urgencyOnly ? '#dc2626' : 'transparent'
              }}
              onClick={() => setUrgencyOnly(!urgencyOnly)}
            >
              🚨 Pendências Urgentes ({data.totalUrgentCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'pending_grade' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
              onClick={() => {
                setStatusFilter(statusFilter === 'pending_grade' ? 'all' : 'pending_grade');
                setUrgencyOnly(false);
              }}
            >
              ⏳ Aguardando Nota ({data.pendingGradeCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${statusFilter === 'not_submitted' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
              onClick={() => {
                setStatusFilter(statusFilter === 'not_submitted' ? 'all' : 'not_submitted');
                setUrgencyOnly(false);
              }}
            >
              ⚠️ Alunos Sem Envio ({data.notSubmittedCount})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Mostrando <strong>{filteredItems.length}</strong> de <strong>{data.items.length}</strong> registros
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-sm btn-outline"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL: VISÃO EM TABELA OU VISÃO EM CARDS */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spin" style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
            <RefreshCw size={28} color="var(--primary)" />
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Carregando dados das turmas...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <FileText size={48} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Nenhuma entrega encontrada com os filtros selecionados
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.25rem auto' }}>
            Tente selecionar outra turma, limpar a pesquisa por nome ou redefinir os filtros de status.
          </p>
          {hasActiveFilters && (
            <button type="button" onClick={handleClearFilters} className="btn btn-primary">
              Limpar Todos os Filtros
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* VISÃO 1: TABELA COMPLETA DE ENTREGAS */
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Aluno</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Turma / Curso</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tarefa</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Prazo Final</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status da Entrega</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Envio</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Nota / Avaliação</th>
                  <th style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const isCriticalUrgent = item.isUrgent;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-color-subtle)',
                        backgroundColor: isCriticalUrgent
                          ? 'rgba(220, 38, 38, 0.035)'
                          : idx % 2 === 0
                          ? 'transparent'
                          : 'rgba(46, 151, 183, 0.015)',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {/* 1. ALUNO */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <UserAvatar
                            name={item.studentName}
                            avatarKey={item.studentAvatar}
                            size={34}
                            borderRadius="50%"
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                              {item.studentName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {item.studentEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. CURSO */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(46, 151, 183, 0.1)',
                              color: 'var(--primary)',
                              padding: '0.1rem 0.4rem',
                              borderRadius: 'var(--radius-xs)',
                              display: 'inline-block',
                              marginBottom: '0.2rem'
                            }}
                          >
                            {item.courseCode}
                          </span>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.courseTitle}
                          </div>
                        </div>
                      </td>

                      {/* 3. TAREFA */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>
                          <Link
                            to={`/courses/${item.courseId}/assignment/${item.assignmentId}`}
                            style={{
                              fontWeight: 600,
                              color: 'var(--primary)',
                              textDecoration: 'none',
                              fontSize: '0.85rem'
                            }}
                            title="Ver página da tarefa"
                          >
                            {item.assignmentTitle}
                          </Link>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            Max: {item.maxScore} pontos
                          </div>
                        </div>
                      </td>

                      {/* 4. PRAZO */}
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                          {item.assignmentDueDate ? new Date(item.assignmentDueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                        </div>
                        {item.assignmentDueDate && (
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                            {new Date(item.assignmentDueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      {/* 5. STATUS DA ENTREGA */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div>
                          {item.status === 'graded' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                backgroundColor: 'var(--success-light)',
                                color: '#259e82',
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Avaliada</span>
                            </span>
                          )}

                          {item.status === 'pending_grade' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                backgroundColor: isCriticalUrgent ? 'rgba(220, 38, 38, 0.12)' : 'var(--warning-light)',
                                color: isCriticalUrgent ? '#dc2626' : '#b38200',
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              {isCriticalUrgent ? <AlertTriangle size={13} /> : <Clock size={13} />}
                              <span>{isCriticalUrgent ? 'Correção Crítica' : 'Aguardando Nota'}</span>
                            </span>
                          )}

                          {item.status === 'not_submitted' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                backgroundColor: isCriticalUrgent ? 'rgba(220, 38, 38, 0.12)' : 'var(--bg-subtle)',
                                color: isCriticalUrgent ? '#dc2626' : 'var(--text-muted)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: 'var(--radius-full)',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              {isCriticalUrgent ? <AlertTriangle size={13} /> : <X size={13} />}
                              <span>{isCriticalUrgent ? 'Atraso Crítico' : 'Não Entregue'}</span>
                            </span>
                          )}

                          {item.isUrgent && item.urgencyReason && (
                            <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600, marginTop: '0.2rem', maxWidth: '170px' }}>
                              ⚠️ {item.urgencyReason}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. DATA DO ENVIO */}
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {item.submittedAt ? (
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              {new Date(item.submittedAt).toLocaleDateString('pt-BR')}
                            </div>
                            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                              {new Date(item.submittedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* 7. NOTA / AVALIAÇÃO */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {item.status === 'graded' ? (
                          <div>
                            <span
                              style={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: item.score >= 6 ? '#259e82' : '#dc2626'
                              }}
                            >
                              {item.score}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              /{item.maxScore}
                            </span>
                            {item.feedback && (
                              <div
                                style={{
                                  fontSize: '0.725rem',
                                  color: 'var(--text-secondary)',
                                  maxWidth: '180px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  marginTop: '0.15rem'
                                }}
                                title={item.feedback}
                              >
                                "{item.feedback}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sem nota</span>
                        )}
                      </td>

                      {/* 8. AÇÕES RÁPIDAS */}
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {item.hasSubmission && (
                            <button
                              type="button"
                              onClick={() => setPreviewModalItem(item)}
                              className="btn btn-sm btn-outline"
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
                              title="Visualizar texto / resposta enviada pelo aluno"
                            >
                              <Eye size={13} />
                            </button>
                          )}

                          {/* Botão Avaliar / Lançar Nota */}
                          <button
                            type="button"
                            onClick={() => handleOpenGrading(item)}
                            className={`btn btn-sm ${item.status === 'pending_grade' ? 'btn-primary' : 'btn-outline'}`}
                            style={{
                              padding: '0.35rem 0.65rem',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                            title={item.status === 'graded' ? 'Editar nota e feedback' : 'Atribuir nota e feedback'}
                          >
                            <Edit3 size={13} />
                            <span>{item.status === 'graded' ? 'Reavaliar' : 'Avaliar'}</span>
                          </button>

                          {/* Botão Excluir / Resetar Entrega */}
                          {item.hasSubmission && item.submissionId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSubmission(item.submissionId, item.studentName)}
                              className="btn btn-sm btn-outline"
                              style={{
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.75rem',
                                color: '#dc2626',
                                borderColor: '#fca5a5'
                              }}
                              title="Excluir / Resetar entrega do aluno (Admin)"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}

                          {/* Botão Enviar Lembrete (para não entregues) */}
                          {item.status === 'not_submitted' && (
                            <button
                              type="button"
                              onClick={() => handleSendReminder(item)}
                              disabled={remindingStudentId === item.id}
                              className="btn btn-sm btn-outline"
                              style={{
                                padding: '0.35rem 0.55rem',
                                fontSize: '0.75rem',
                                color: 'var(--secondary)',
                                borderColor: 'var(--secondary)'
                              }}
                              title="Enviar lembrete de pendência para o aluno"
                            >
                              <Bell size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISÃO 2: CARDS AGRUPADOS POR TAREFA */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {groupedByAssignment.map((group) => {
            const groupSubmissions = group.items.filter((i) => i.hasSubmission).length;
            const groupExpected = group.items.length;
            const groupGraded = group.items.filter((i) => i.status === 'graded').length;
            const groupPending = group.items.filter((i) => i.status === 'pending_grade').length;
            const groupUrgent = group.items.filter((i) => i.isUrgent).length;
            const groupRate = groupExpected > 0 ? Math.round((groupSubmissions / groupExpected) * 100) : 0;

            return (
              <div
                key={group.assignmentId}
                className="card"
                style={{
                  padding: '1.5rem',
                  borderTop: `4px solid ${groupUrgent > 0 ? '#dc2626' : 'var(--primary)'}`
                }}
              >
                {/* Header do Card da Tarefa */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(46, 151, 183, 0.1)',
                          color: 'var(--primary)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-xs)'
                        }}
                      >
                        {group.courseCode} — {group.courseTitle}
                      </span>
                      {groupUrgent > 0 && (
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            backgroundColor: 'rgba(220, 38, 38, 0.12)',
                            color: '#dc2626',
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-xs)'
                          }}
                        >
                          🚨 {groupUrgent} pendência(s) urgente(s)
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {group.assignmentTitle}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                      <span>
                        Prazo: <strong>{group.assignmentDueDate ? new Date(group.assignmentDueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Entregas: <strong>{groupSubmissions}/{groupExpected}</strong> ({groupRate}%)
                      </span>
                      <span>•</span>
                      <span>
                        Aguardando nota: <strong style={{ color: '#b38200' }}>{groupPending}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Avaliadas: <strong style={{ color: '#259e82' }}>{groupGraded}</strong>
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/courses/${group.courseId}/assignment/${group.assignmentId}`}
                    className="btn btn-sm btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                  >
                    <span>Abrir Tarefa Completa</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>

                {/* Barra de Progresso de Entregas da Tarefa */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.775rem', marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                    <span>Adesão da Turma</span>
                    <span><strong>{groupRate}%</strong> das entregas realizadas</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${groupRate}%`,
                        height: '100%',
                        backgroundColor: groupRate >= 70 ? '#259e82' : groupRate >= 40 ? 'var(--secondary)' : '#b38200',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Lista de Alunos da Tarefa */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '0.75rem'
                  }}
                >
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: `1px solid ${item.isUrgent ? 'rgba(220, 38, 38, 0.35)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.65rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <UserAvatar
                            name={item.studentName}
                            avatarKey={item.studentAvatar}
                            size={30}
                            borderRadius="50%"
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
                              {item.studentName}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {item.studentEmail}
                            </div>
                          </div>
                        </div>

                        {item.status === 'graded' && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: '#259e82',
                              backgroundColor: 'var(--success-light)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-xs)'
                            }}
                          >
                            {item.score}/{item.maxScore}
                          </span>
                        )}
                        {item.status === 'pending_grade' && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: '#b38200',
                              backgroundColor: 'var(--warning-light)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-xs)'
                            }}
                          >
                            Pendente Nota
                          </span>
                        )}
                        {item.status === 'not_submitted' && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: item.isUrgent ? '#dc2626' : 'var(--text-muted)',
                              backgroundColor: item.isUrgent ? 'rgba(220, 38, 38, 0.1)' : 'var(--bg-subtle)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: 'var(--radius-xs)'
                            }}
                          >
                            {item.isUrgent ? 'Atrasado' : 'Não enviou'}
                          </span>
                        )}
                      </div>

                      {item.isUrgent && item.urgencyReason && (
                        <div style={{ fontSize: '0.725rem', color: '#dc2626', fontWeight: 600 }}>
                          ⚠️ {item.urgencyReason}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                        {item.hasSubmission ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewModalItem(item)}
                              className="btn btn-sm btn-outline"
                              style={{ flex: 1, fontSize: '0.75rem', padding: '0.3rem' }}
                            >
                              Ver Texto
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenGrading(item)}
                              className={`btn btn-sm ${item.status === 'pending_grade' ? 'btn-primary' : 'btn-outline'}`}
                              style={{ flex: 1, fontSize: '0.75rem', padding: '0.3rem' }}
                            >
                              {item.status === 'graded' ? 'Reavaliar' : 'Avaliar'}
                            </button>
                            {item.submissionId && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSubmission(item.submissionId, item.studentName)}
                                className="btn btn-sm btn-outline"
                                style={{ padding: '0.3rem 0.45rem', fontSize: '0.75rem', color: '#dc2626', borderColor: '#fca5a5' }}
                                title="Excluir / Resetar entrega (Admin)"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendReminder(item)}
                            disabled={remindingStudentId === item.id}
                            className="btn btn-sm btn-outline"
                            style={{ width: '100%', fontSize: '0.75rem', padding: '0.3rem' }}
                          >
                            <Bell size={12} style={{ marginRight: '0.25rem' }} />
                            {remindingStudentId === item.id ? 'Enviando...' : 'Cobrar Aluno'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: AVALIAÇÃO E NOTA RÁPIDA */}
      {gradingModalItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setGradingModalItem(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(46, 151, 183, 0.1)',
                    color: 'var(--primary)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-xs)',
                    textTransform: 'uppercase'
                  }}
                >
                  Avaliação Pedagógica
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.25rem 0 0 0' }}>
                  Lançar Nota de Tarefa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGradingModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Informações da Tarefa e do Aluno */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <UserAvatar
                  name={gradingModalItem.studentName}
                  avatarKey={gradingModalItem.studentAvatar}
                  size={26}
                  borderRadius="50%"
                />
                <strong>{gradingModalItem.studentName}</strong>
                <span style={{ color: 'var(--text-muted)' }}>({gradingModalItem.studentEmail})</span>
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                <strong>Tarefa:</strong> {gradingModalItem.assignmentTitle}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                <strong>Turma:</strong> {gradingModalItem.courseTitle} ({gradingModalItem.courseCode})
              </div>
            </div>

            {/* Prévia da Entrega do Aluno */}
            {gradingModalItem.content && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Texto / Conteúdo enviado pelo aluno:
                </label>
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    fontSize: '0.825rem',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-primary)'
                  }}
                >
                  {gradingModalItem.content}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveGrade}>
              {/* Campo de Nota */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Nota do Aluno (0 a {gradingModalItem.maxScore || 10}):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={gradingModalItem.maxScore || 10}
                    required
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    placeholder="Ex: 8.5"
                    style={{
                      width: '120px',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '1.1rem',
                      fontWeight: 700
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    de {gradingModalItem.maxScore || 10} pontos possíveis
                  </span>
                </div>
              </div>

              {/* Campo de Feedback Pedagógico */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  Comentário / Feedback Pedagógico para o Estudante:
                </label>
                <textarea
                  rows={4}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Orientações, pontos positivos da entrega e recomendações de melhoria..."
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Botões do Modal */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setGradingModalItem(null)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingGrade}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <Check size={16} />
                  <span>{isSavingGrade ? 'Salvando...' : 'Salvar Avaliação'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VISUALIZAÇÃO COMPLETA DA SUBMISSÃO */}
      {previewModalItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setPreviewModalItem(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
              animation: 'fadeIn 0.2s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(46, 151, 183, 0.1)',
                    color: 'var(--primary)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-xs)'
                  }}
                >
                  Envio do Estudante
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.25rem 0 0 0' }}>
                  {previewModalItem.assignmentTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem'
              }}
            >
              <UserAvatar
                name={previewModalItem.studentName}
                avatarKey={previewModalItem.studentAvatar}
                size={38}
                borderRadius="50%"
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{previewModalItem.studentName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {previewModalItem.studentEmail} • Enviado em:{' '}
                  {previewModalItem.submittedAt ? new Date(previewModalItem.submittedAt).toLocaleString('pt-BR') : 'Sem data'}
                </div>
              </div>

              {previewModalItem.score !== null && previewModalItem.score !== undefined && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#259e82' }}>
                    Nota: {previewModalItem.score}/{previewModalItem.maxScore}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Conteúdo da Entrega:
              </div>
              <div
                style={{
                  backgroundColor: '#1e293b',
                  color: '#f8fafc',
                  padding: '1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}
              >
                {previewModalItem.content || 'Nenhum texto submetido.'}
              </div>
            </div>

            {previewModalItem.feedback && (
              <div
                style={{
                  backgroundColor: 'var(--bg-surface-hover)',
                  borderLeft: '4px solid #259e82',
                  padding: '0.85rem 1rem',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#259e82', marginBottom: '0.2rem' }}>
                  Feedback já atribuído:
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  "{previewModalItem.feedback}"
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="btn btn-outline"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewModalItem(null);
                  handleOpenGrading(previewModalItem);
                }}
                className="btn btn-primary"
              >
                {previewModalItem.status === 'graded' ? 'Editar Nota' : 'Avaliar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

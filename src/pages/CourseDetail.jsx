import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFocusMode } from '../context/FocusModeContext.jsx';
import CourseLiveClassroom from '../components/CourseLiveClassroom.jsx';
import CourseTextDiscussions from '../components/CourseTextDiscussions.jsx';
import CourseExternalActivities from '../components/CourseExternalActivities.jsx';
import ActivityStatusBadge from '../components/ActivityStatusBadge.jsx';
import CourseDoubtForum from '../components/CourseDoubtForum.jsx';
import { generateCourseCertificate } from '../utils/generateCertificate.js';
import { webPushService } from '../services/webPushService.js';
import {
  courseService,
  enrollmentService,
  announcementService,
  assignmentService,
  quizService,
  liveSessionService,
  forumService
} from '../services/index.js';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  const { enterFocusMode } = useFocusMode();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLiveSession, setActiveLiveSession] = useState(null);

  // Fórum de Dúvidas
  const [forumPendingCount, setForumPendingCount] = useState(0);
  const [forumSectionFilter, setForumSectionFilter] = useState('all');

  // Matrícula e progresso do aluno
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedItems, setCompletedItems] = useState([]);
  const [inProgressItems, setInProgressItems] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);

  // Avisos
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'announcements'
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnContent, setNewAnnContent] = useState('');
  const [submittingAnn, setSubmittingAnn] = useState(false);

  // Modais de Edição de Curso (Admin / Professor)
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseTeacherName, setEditCourseTeacherName] = useState('');
  const [editCourseDescription, setEditCourseDescription] = useState('');
  const [savingCourse, setSavingCourse] = useState(false);

  // Modais de Professor / Admin
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');

  // Edição de Seção
  const [editingSection, setEditingSection] = useState(null);
  const [editSectionTitle, setEditSectionTitle] = useState('');

  // Adição e Edição de Item
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [itemType, setItemType] = useState('page'); // 'page' | 'link' | 'assignment' | 'quiz'
  const [itemTitle, setItemTitle] = useState('');
  const [itemContent, setItemContent] = useState('');
  const [itemDueDate, setItemDueDate] = useState('');
  const [itemMaxScore, setItemMaxScore] = useState(10);
  const [itemMaxAttempts, setItemMaxAttempts] = useState(3);
  const [submittingItem, setSubmittingItem] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [editItemTitle, setEditItemTitle] = useState('');
  const [editItemContent, setEditItemContent] = useState('');

  // Edição de Aviso
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnContent, setEditAnnContent] = useState('');

  // Modal para leitura de página de texto
  const [activePageItem, setActivePageItem] = useState(null);

  // Copiar código
  const [copiedCode, setCopiedCode] = useState(false);

  const canEdit = isAdmin || (isTeacher && course?.teacherId === user?.id);

  const handleDownloadCertificate = () => {
    if (!course || !user) return;
    generateCourseCertificate({
      studentName: user.name,
      courseTitle: course.title,
      courseCode: course.code,
      teacherName: course.teacherName || 'Docente Responsável',
      completionDate: new Date(),
      workloadHours: 40
    });
  };

  useEffect(() => {
    loadCourseDetails();
  }, [courseId, user]);

  const loadCourseDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await courseService.getCourseById(courseId);
      if (!data) {
        setError('Curso não encontrado.');
        setLoading(false);
        return;
      }
      setCourse(data);

      // Carregar avisos
      const anns = await announcementService.getAnnouncementsByCourse(courseId);
      setAnnouncements(anns);

      // Carregar sessão ao vivo ativa
      const live = await liveSessionService.getLiveSession(courseId);
      setActiveLiveSession(live);

      // Carregar dúvidas do fórum para contagem
      try {
        const forumTopics = await forumService.getTopicsByCourse(courseId);
        const pend = forumTopics.filter((t) => t.status === 'pending').length;
        setForumPendingCount(pend);
      } catch (fErr) {
        console.warn('Erro ao carregar contagem do fórum:', fErr);
      }

      // Carregar status do aluno
      if (isStudent) {
        const enrolled = await enrollmentService.isStudentEnrolled(user.id, courseId);
        setIsEnrolled(enrolled);
        if (enrolled) {
          const prog = await enrollmentService.getCourseProgress(user.id, courseId);
          setProgressPercent(prog.progressPercent);
          const userEnrs = await enrollmentService.getEnrollmentsByUser(user.id);
          const thisEnr = userEnrs.find((e) => e.courseId === courseId);
          setCompletedItems(thisEnr?.completedItemIds || []);
          setInProgressItems(thisEnr?.inProgressItemIds || []);
        }
      }
    } catch (err) {
      setError('Erro ao carregar curso: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCompleted = async (itemId) => {
    if (!isEnrolled) return;
    try {
      const isCurrentlyCompleted = completedItems.includes(itemId);
      const nextStatus = isCurrentlyCompleted ? 'pending' : 'completed';
      const result = await enrollmentService.setItemStatus(user.id, courseId, itemId, nextStatus);
      setCompletedItems(result.completedItemIds);
      setInProgressItems(result.inProgressItemIds);
      setProgressPercent(result.progressPercent);
    } catch (err) {
      console.error('Erro ao atualizar progresso:', err);
    }
  };

  const handleCycleItemStatus = async (itemId) => {
    if (!isEnrolled) return;
    try {
      const result = await enrollmentService.cycleItemStatus(user.id, courseId, itemId);
      if (result) {
        setCompletedItems(result.completedItemIds);
        setInProgressItems(result.inProgressItemIds);
        setProgressPercent(result.progressPercent);
      }
    } catch (err) {
      console.error('Erro ao alternar status do item:', err);
    }
  };

  // Abre um conteúdo específico em Modo de Leitura Focado (removendo menus e barras laterais)
  const openItemInFocusMode = (item, section) => {
    const allReadableItems = course?.sections?.flatMap((s) =>
      (s.items || [])
        .filter((it) => it.type === 'page' || it.content)
        .map((it) => ({ ...it, sectionTitle: s.title }))
    ) || [];

    const currentIndex = allReadableItems.findIndex((it) => it.id === item.id);
    const prevItem = currentIndex > 0 ? allReadableItems[currentIndex - 1] : null;
    const nextItem = currentIndex >= 0 && currentIndex < allReadableItems.length - 1 ? allReadableItems[currentIndex + 1] : null;

    const isCompleted = completedItems.includes(item.id);
    const isInProgress = inProgressItems.includes(item.id);
    const itemStatus = isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'pending';

    enterFocusMode({
      id: item.id,
      title: item.title,
      content: item.content,
      type: item.type,
      courseTitle: course?.title || 'Curso',
      sectionTitle: section?.title || item.sectionTitle || '',
      authorName: course?.teacherName || 'Docente Responsável',
      status: itemStatus,
      onToggleComplete:
        isStudent && isEnrolled
          ? async () => {
              await handleToggleCompleted(item.id);
            }
          : null,
      onCycleStatus:
        isStudent && isEnrolled
          ? async () => {
              await handleCycleItemStatus(item.id);
            }
          : null,
      onNavigatePrev: prevItem
        ? () => openItemInFocusMode(prevItem, { title: prevItem.sectionTitle })
        : null,
      onNavigateNext: nextItem
        ? () => openItemInFocusMode(nextItem, { title: nextItem.sectionTitle })
        : null
    });
  };

  // Inicia o Modo de Leitura no primeiro conteúdo disponível do curso
  const handleStartCourseFocusMode = () => {
    for (const sec of course?.sections || []) {
      for (const it of sec.items || []) {
        if (it.type === 'page' || it.content) {
          openItemInFocusMode(it, sec);
          return;
        }
      }
    }
    alert('Nenhum conteúdo de leitura cadastrado no curso no momento.');
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;
    try {
      await courseService.addSection(courseId, sectionTitle);
      setSectionTitle('');
      setShowAddSectionModal(false);
      await loadCourseDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Tem certeza que deseja remover esta seção e todos os seus itens?')) return;
    try {
      await courseService.deleteSection(sectionId);
      await loadCourseDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;
    setSubmittingItem(true);
    try {
      await courseService.addItem({
        courseId,
        sectionId: targetSectionId,
        title: itemTitle,
        type: itemType,
        content: itemContent,
        assignmentData: {
          description: itemContent,
          dueDate: itemDueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
          maxScore: itemMaxScore
        },
        quizData: {
          description: itemContent,
          dueDate: itemDueDate || new Date(Date.now() + 14 * 86400000).toISOString(),
          maxAttempts: itemMaxAttempts
        }
      });

      setShowAddItemModal(false);
      const addedTitle = itemTitle;
      const addedType = itemType;
      setItemTitle('');
      setItemContent('');
      setItemDueDate('');
      await loadCourseDetails();

      // Dispara alerta Web Push do Service Worker
      if (addedType === 'assignment') {
        webPushService.notifyNewAssignment({
          courseTitle: course?.title || 'Curso',
          assignmentTitle: addedTitle,
          courseId
        });
      } else {
        webPushService.sendNotification({
          title: `📚 Novo Conteúdo: ${course?.title || 'Curso'}`,
          body: `Nova aula/recurso adicionado: "${addedTitle}".`,
          url: `/courses/${courseId}`,
          tag: 'new-content'
        });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Deseja realmente excluir este item?')) return;
    try {
      await courseService.deleteItem(itemId);
      await loadCourseDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnTitle.trim() || !newAnnContent.trim()) return;
    setSubmittingAnn(true);
    try {
      await announcementService.createAnnouncement({
        courseId,
        title: newAnnTitle,
        content: newAnnContent,
        authorName: user.name,
        authorRole: user.role
      });
      const savedTitle = newAnnTitle;
      setNewAnnTitle('');
      setNewAnnContent('');
      const updated = await announcementService.getAnnouncementsByCourse(courseId);
      setAnnouncements(updated);

      // Dispara alerta Web Push via Service Worker
      webPushService.sendNotification({
        title: `📢 Novo Comunicado: ${course?.title || 'Curso'}`,
        body: `${user.name} publicou: "${savedTitle}". Clique para ler.`,
        url: `/courses/${courseId}`,
        tag: 'course-announcement'
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (annId) => {
    if (!window.confirm('Remover aviso?')) return;
    try {
      await announcementService.deleteAnnouncement(annId);
      const updated = await announcementService.getAnnouncementsByCourse(courseId);
      setAnnouncements(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Handlers de Edição e Exclusão para Administrador / Docente ---
  const handleOpenEditCourse = () => {
    if (!course) return;
    setEditCourseTitle(course.title || '');
    setEditCourseCode(course.code || '');
    setEditCourseTeacherName(course.teacherName || '');
    setEditCourseDescription(course.description || '');
    setShowEditCourseModal(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!editCourseTitle.trim()) {
      alert('O título do curso é obrigatório.');
      return;
    }
    setSavingCourse(true);
    try {
      await courseService.updateCourse(courseId, {
        title: editCourseTitle.trim(),
        code: editCourseCode.trim().toUpperCase(),
        teacherName: editCourseTeacherName.trim(),
        description: editCourseDescription.trim()
      });
      setShowEditCourseModal(false);
      await loadCourseDetails();
    } catch (err) {
      alert('Erro ao atualizar curso: ' + err.message);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourseFromDetail = async () => {
    if (
      !window.confirm(
        `ATENÇÃO: Deseja realmente excluir este curso ("${course?.title}")?\n\nTodas as seções, aulas, tarefas, quizzes e matrículas associadas serão permanentemente removidas.`
      )
    ) {
      return;
    }
    try {
      await courseService.deleteCourse(courseId);
      navigate('/courses');
    } catch (err) {
      alert('Erro ao excluir curso: ' + err.message);
    }
  };

  const handleOpenEditSection = (section) => {
    setEditingSection(section);
    setEditSectionTitle(section.title || '');
  };

  const handleSaveEditSection = async (e) => {
    e.preventDefault();
    if (!editSectionTitle.trim()) {
      alert('O título da seção é obrigatório.');
      return;
    }
    try {
      await courseService.updateSection(editingSection.id, editSectionTitle.trim());
      setEditingSection(null);
      await loadCourseDetails();
    } catch (err) {
      alert('Erro ao atualizar seção: ' + err.message);
    }
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setEditItemTitle(item.title || '');
    setEditItemContent(item.content || '');
  };

  const handleSaveEditItem = async (e) => {
    e.preventDefault();
    if (!editItemTitle.trim()) {
      alert('O título do item é obrigatório.');
      return;
    }
    try {
      await courseService.updateItem(editingItem.id, {
        title: editItemTitle.trim(),
        content: editItemContent.trim()
      });
      setEditingItem(null);
      await loadCourseDetails();
    } catch (err) {
      alert('Erro ao atualizar item: ' + err.message);
    }
  };

  const handleOpenEditAnnouncement = (ann) => {
    setEditingAnnouncement(ann);
    setEditAnnTitle(ann.title || '');
    setEditAnnContent(ann.content || '');
  };

  const handleSaveEditAnnouncement = async (e) => {
    e.preventDefault();
    if (!editAnnTitle.trim() || !editAnnContent.trim()) {
      alert('Título e conteúdo são obrigatórios.');
      return;
    }
    try {
      await announcementService.updateAnnouncement(editingAnnouncement.id, {
        title: editAnnTitle.trim(),
        content: editAnnContent.trim()
      });
      setEditingAnnouncement(null);
      const updated = await announcementService.getAnnouncementsByCourse(courseId);
      setAnnouncements(updated);
    } catch (err) {
      alert('Erro ao atualizar aviso: ' + err.message);
    }
  };

  const handleCopyCode = () => {
    if (course?.code) {
      navigator.clipboard.writeText(course.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Carregando conteúdo do curso...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ maxWidth: '600px', margin: '3rem auto' }}>
        <div className="alert alert-error">{error || 'Curso não encontrado'}</div>
        <Link to="/courses" className="btn btn-secondary">
          Voltar para Cursos
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* CABEÇALHO DO CURSO */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Link to="/courses" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ← Cursos
              </Link>
              <span className="course-code-tag">Código: {course.code}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                title="Copiar código de matrícula"
              >
                {copiedCode ? '✓ Copiado!' : 'Copiar'}
              </button>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {course.title}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px' }}>
              {course.description}
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Ministrado por: <strong>{course.teacherName || 'Professor'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'meet' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('meet')}
                title="Acessar sala de aula virtual com Jitsi Meet"
              >
                📹 {canEdit ? 'Iniciar Aula ao Vivo' : 'Entrar no Meet'}
              </button>

              {canEdit && (
                <>
                  <Link to={`/teacher/assignments?courseId=${course.id}`} className="btn btn-outline btn-sm" title="Acompanhar entregas e pendências desta turma">
                    📝 Entregas de Tarefas
                  </Link>
                  <Link to={`/grades?courseId=${course.id}`} className="btn btn-secondary btn-sm">
                    📊 Boletim da Turma
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddSectionModal(true)}
                  >
                    + Nova Seção
                  </button>
                </>
              )}
            </div>

            {isStudent && isEnrolled && (
              <div style={{ width: '230px', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div className="progress-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Seu Progresso:</span>
                    <strong style={{ color: progressPercent >= 100 ? 'var(--success)' : 'inherit' }}>
                      {progressPercent}% {progressPercent >= 100 ? '✓' : ''}
                    </strong>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: progressPercent >= 100 ? 'var(--success)' : 'var(--primary)'
                      }}
                    />
                  </div>
                </div>

                {progressPercent >= 100 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={handleDownloadCertificate}
                    style={{
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.775rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.6rem'
                    }}
                    title="Baixar Certificado de Conclusão em formato PDF"
                  >
                    🎓 Baixar Certificado (PDF)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Abas: Conteúdo do Curso / Mural de Avisos */}
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            borderTop: '1px solid var(--border-color)',
            marginTop: '1.5rem',
            paddingTop: '0.75rem'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 0.25rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              color: activeTab === 'content' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'content' ? '2px solid var(--primary)' : '2px solid transparent'
            }}
          >
            Conteúdo & Aulas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 0.25rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              color: activeTab === 'announcements' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'announcements' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>Mural de Avisos</span>
            {announcements.length > 0 && (
              <span
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem'
                }}
              >
                {announcements.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setForumSectionFilter('all');
              setActiveTab('forum');
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 0.25rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              color: activeTab === 'forum' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'forum' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>💬 Fórum de Dúvidas</span>
            {forumPendingCount > 0 ? (
              <span
                style={{
                  background: '#fdf4b0',
                  color: '#685900',
                  border: '1px solid #d4c860',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
                title={`${forumPendingCount} dúvidas aguardando resposta`}
              >
                {forumPendingCount} pendente{forumPendingCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span
                style={{
                  background: '#a4dcb9',
                  color: '#134e48',
                  padding: '0.1rem 0.45rem',
                  borderRadius: '12px',
                  fontSize: '0.725rem',
                  fontWeight: 700
                }}
              >
                Ativo
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('texts')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 0.25rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              color: activeTab === 'texts' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'texts' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>📖 Textos & Debates (Chat)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('external')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 0.25rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              color: activeTab === 'external' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'external' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>🔗 Atividades Externas</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('meet')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.5rem 0.25rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              color: activeTab === 'meet' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'meet' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>📹 Aula ao Vivo (Meet)</span>
            <span
              style={{
                background: '#dc2626',
                color: '#ffffff',
                padding: '0.1rem 0.45rem',
                borderRadius: '12px',
                fontSize: '0.675rem',
                fontWeight: 800,
                letterSpacing: '0.04em'
              }}
            >
              AO VIVO
            </span>
          </button>

          {/* Botão de Atalho para o Modo de Leitura do Curso */}
          <button
            type="button"
            onClick={handleStartCourseFocusMode}
            className="btn btn-sm btn-secondary"
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.825rem',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)'
            }}
            title="Entrar no Modo de Leitura (foco total sem menus nem barras)"
          >
            <span>📖</span>
            <span>Modo de Leitura</span>
          </button>
        </div>
      </div>

      {/* BANNER DE PARABÉNS & DOWNLOAD DE CERTIFICADO (100% CONCLUÍDO) */}
      {isStudent && isEnrolled && progressPercent >= 100 && (
        <div
          className="card"
          style={{
            backgroundColor: '#fdf4b0',
            border: '2px solid #5bcebf',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1.25rem 1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#a4dcb9',
                color: '#132f38',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                flexShrink: 0
              }}
            >
              🎓
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#132f38', fontSize: '1.05rem' }}>
                Parabéns, {user?.name}! Você concluiu 100% deste curso!
              </div>
              <div style={{ fontSize: '0.875rem', color: '#27515c', marginTop: '0.2rem' }}>
                Todas as aulas, atividades e avaliações foram finalizadas. Seu <strong>Certificado Oficial de Conclusão</strong> está disponível para download imediato em PDF.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={handleDownloadCertificate}
            style={{
              backgroundColor: '#2e97b7',
              color: '#ffffff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.95rem',
              padding: '0.65rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 6px -1px rgba(46, 151, 183, 0.35)'
            }}
          >
            <span>📜</span> Baixar Certificado (PDF)
          </button>
        </div>
      )}

      {/* ALERTA DE TRANSMISSÃO AO VIVO ATIVA NO CURSO */}
      {activeLiveSession && activeTab !== 'meet' && (
        <div
          className="card"
          style={{
            backgroundColor: 'var(--success-light)',
            border: '2px solid var(--success)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '1rem 1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.25)',
                display: 'inline-block'
              }}
            />
            <div>
              <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem' }}>
                AULA AO VIVO TRANSMITINDO AGORA
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                <strong>{activeLiveSession.title}</strong> • Iniciada por {activeLiveSession.teacherName}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveTab('meet')}
            style={{ fontWeight: 700 }}
          >
            <span>📹</span> Entrar na Aula ao Vivo →
          </button>
        </div>
      )}

      {/* ABA 1: CONTEÚDO E SEÇÕES */}
      {activeTab === 'content' && (
        <div>
          {course.sections?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>Nenhuma seção cadastrada neste curso</h3>
              {canEdit ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setShowAddSectionModal(true)}
                >
                  Adicionar Primeira Seção
                </button>
              ) : (
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  O professor ainda não publicou seções de conteúdo.
                </p>
              )}
            </div>
          ) : (
            course.sections.map((section) => (
              <div key={section.id} className="course-section">
                <div className="section-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{section.title}</h2>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        setForumSectionFilter(section.id);
                        setActiveTab('forum');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.6rem',
                        backgroundColor: 'rgba(91, 206, 191, 0.15)',
                        color: '#132f38',
                        border: '1px solid #5bcebf',
                        borderRadius: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Abrir o Fórum de Dúvidas filtrado para esta seção"
                    >
                      <span>💬 Dúvidas deste módulo</span>
                    </button>
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setTargetSectionId(section.id);
                          setShowAddItemModal(true);
                        }}
                      >
                        + Adicionar Item
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleDeleteSection(section.id)}
                        title="Remover seção"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                {section.items?.length === 0 ? (
                  <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Nenhum item nesta seção. {canEdit && 'Clique em "+ Adicionar Item" para inserir conteúdo.'}
                  </div>
                ) : (
                  <ul className="section-items-list">
                    {section.items.map((item) => {
                      const isCompleted = completedItems.includes(item.id);
                      const isInProgress = inProgressItems.includes(item.id);
                      const itemStatus = isCompleted ? 'completed' : isInProgress ? 'in_progress' : 'pending';

                      return (
                        <li key={item.id} className="section-item">
                          <div className="item-left">
                            {/* Checkbox de conclusão para o aluno */}
                            {isStudent && isEnrolled && (
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => handleToggleCompleted(item.id)}
                                title={isCompleted ? 'Desmarcar como concluído' : 'Marcar como concluído'}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--success)' }}
                              />
                            )}

                            {/* Badge do tipo de item */}
                            <span className={`item-type-badge type-${item.type}`}>
                              {item.type === 'page' && 'Página'}
                              {item.type === 'link' && 'Link'}
                              {item.type === 'assignment' && 'Tarefa'}
                              {item.type === 'quiz' && 'Quiz'}
                            </span>

                            {/* Título e link para a ação do item */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {item.type === 'page' && (
                                <button
                                  type="button"
                                  onClick={() => setActivePageItem(item)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    color: 'inherit',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                >
                                  {item.title}
                                </button>
                              )}

                              {item.type === 'link' && (
                                <a
                                  href={item.content}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                >
                                  <span>{item.title}</span>
                                  <span style={{ fontSize: '0.75rem' }}>↗</span>
                                </a>
                              )}

                              {item.type === 'assignment' && (
                                <Link
                                  to={`/courses/${courseId}/assignment/${item.assignmentId || item.id}`}
                                  style={{ fontWeight: 600 }}
                                >
                                  {item.title}
                                </Link>
                              )}

                              {item.type === 'quiz' && (
                                <Link
                                  to={`/courses/${courseId}/quiz/${item.quizId || item.id}`}
                                  style={{ fontWeight: 600 }}
                                >
                                  {item.title}
                                </Link>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {/* Badge visual de status pedagógico */}
                            <ActivityStatusBadge
                              status={itemStatus}
                              isInteractive={isStudent && isEnrolled}
                              onClick={() => handleCycleItemStatus(item.id)}
                            />

                            {/* Ações diretas dependendo do tipo */}
                            {item.type === 'page' && (
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline"
                                  onClick={() => openItemInFocusMode(item, section)}
                                  title="Abrir no Modo de Leitura focado (sem barra lateral nem menu superior)"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontWeight: 600
                                  }}
                                >
                                  <span>📖</span>
                                  <span>Modo de Leitura</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => setActivePageItem(item)}
                                >
                                  Ver Rápido
                                </button>
                              </div>
                            )}

                            {item.type === 'assignment' && (
                              <Link
                                to={`/courses/${courseId}/assignment/${item.assignmentId || item.id}`}
                                className="btn btn-sm btn-outline"
                              >
                                {canEdit ? 'Ver Entregas' : 'Acessar Tarefa'}
                              </Link>
                            )}

                            {item.type === 'quiz' && (
                              <Link
                                to={`/courses/${courseId}/quiz/${item.quizId || item.id}`}
                                className="btn btn-sm btn-outline"
                              >
                                {canEdit ? 'Gerenciar Quiz' : 'Fazer Quiz'}
                              </Link>
                            )}

                            {canEdit && (
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleDeleteItem(item.id)}
                                title="Excluir item"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ABA 2: MURAL DE AVISOS */}
      {activeTab === 'announcements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Formulário de criação de aviso para professores */}
          {canEdit && (
            <div className="card">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1rem' }}>
                📢 Publicar Novo Comunicado no Mural
              </h2>
              <form onSubmit={handleCreateAnnouncement}>
                <div className="form-group">
                  <label className="form-label" htmlFor="ann-title">
                    Título do Aviso *
                  </label>
                  <input
                    id="ann-title"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Informações sobre a avaliação intermediária"
                    value={newAnnTitle}
                    onChange={(e) => setNewAnnTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ann-content">
                    Mensagem aos Alunos *
                  </label>
                  <textarea
                    id="ann-content"
                    className="form-textarea"
                    placeholder="Escreva seu comunicado aqui..."
                    value={newAnnContent}
                    onChange={(e) => setNewAnnContent(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={submittingAnn}>
                  {submittingAnn ? 'Publicando...' : 'Publicar Aviso'}
                </button>
              </form>
            </div>
          )}

          {/* Lista de Avisos */}
          {announcements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📢</div>
              <h3>Nenhum aviso publicado no mural</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                O mural está limpo por enquanto. Avisos importantes dos professores aparecerão aqui.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.map((ann) => (
                <div key={ann.id} className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{ann.title}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Postado por <strong>{ann.authorName}</strong> em{' '}
                        {new Date(ann.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        title="Remover aviso"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', marginTop: '0.75rem', lineHeight: 1.6 }}>
                    {ann.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: FÓRUM DE DÚVIDAS DO CURSO */}
      {activeTab === 'forum' && (
        <CourseDoubtForum
          course={course}
          user={user}
          canManage={canEdit}
          initialSectionId={forumSectionFilter}
        />
      )}

      {/* ABA 4: LEITURAS, TEXTOS & DISCUSSÕES (CHAT ESTILO GOOGLE CLASSROOM) */}
      {activeTab === 'texts' && (
        <CourseTextDiscussions
          course={course}
          user={user}
          canManage={canEdit}
        />
      )}

      {/* ABA 4: ATIVIDADES & LINKS EXTERNOS COM IMAGEM */}
      {activeTab === 'external' && (
        <CourseExternalActivities
          course={course}
          user={user}
          canManage={canEdit}
        />
      )}

      {/* ABA 5: SALA DE AULA AO VIVO (JITSI MEET) */}
      {activeTab === 'meet' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <CourseLiveClassroom
            course={course}
            user={user}
            canEdit={canEdit}
            isEnrolled={isEnrolled}
          />
        </div>
      )}

      {/* MODAL DE LEITURA DE PÁGINA DE TEXTO */}
      {activePageItem && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{activePageItem.title}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    const pageItem = activePageItem;
                    setActivePageItem(null);
                    openItemInFocusMode(pageItem);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontWeight: 700
                  }}
                  title="Entrar no Modo de Leitura (remove o menu superior e a barra lateral)"
                >
                  <span>📖</span> Modo de Leitura
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setActivePageItem(null)}
                  style={{ padding: '0.2rem 0.6rem' }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="modal-body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '1rem' }}>
              {activePageItem.content}
            </div>
            <div className="modal-footer">
              {isStudent && isEnrolled && (
                <button
                  type="button"
                  className={`btn ${completedItems.includes(activePageItem.id) ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => {
                    handleToggleCompleted(activePageItem.id);
                    setActivePageItem(null);
                  }}
                >
                  {completedItems.includes(activePageItem.id) ? '✓ Concluído' : 'Marcar como Lido e Concluído'}
                </button>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActivePageItem(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR SEÇÃO */}
      {showAddSectionModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nova Seção do Curso</h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowAddSectionModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSection}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="sec-title">
                    Título da Seção *
                  </label>
                  <input
                    id="sec-title"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Módulo 2 - Gerenciamento de Formulários e Validações"
                    value={sectionTitle}
                    onChange={(e) => setSectionTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddSectionModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Adicionar Seção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR ITEM NA SEÇÃO */}
      {showAddItemModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Adicionar Item à Seção</h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowAddItemModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="item-type-select">
                    Tipo do Item *
                  </label>
                  <select
                    id="item-type-select"
                    className="form-select"
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value)}
                  >
                    <option value="page">📄 Página de Texto (material de leitura)</option>
                    <option value="link">🔗 Link Externo (artigo, vídeo, documentação)</option>
                    <option value="assignment">📝 Tarefa (envio de texto e avaliação)</option>
                    <option value="quiz">❓ Quiz (questões de múltipla escolha com correção automática)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="item-title-input">
                    Título do Item *
                  </label>
                  <input
                    id="item-title-input"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Atividade Prática 2"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    required
                  />
                </div>

                {itemType === 'page' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="item-content-page">
                      Conteúdo da Página *
                    </label>
                    <textarea
                      id="item-content-page"
                      className="form-textarea"
                      rows={6}
                      placeholder="Escreva as instruções, explicações e referências teóricas aqui..."
                      value={itemContent}
                      onChange={(e) => setItemContent(e.target.value)}
                      required
                    />
                  </div>
                )}

                {itemType === 'link' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="item-content-link">
                      URL do Link Externo *
                    </label>
                    <input
                      id="item-content-link"
                      type="url"
                      className="form-input"
                      placeholder="https://exemplo.com/material"
                      value={itemContent}
                      onChange={(e) => setItemContent(e.target.value)}
                      required
                    />
                  </div>
                )}

                {itemType === 'assignment' && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="item-assign-desc">
                        Enunciado e Orientações da Tarefa *
                      </label>
                      <textarea
                        id="item-assign-desc"
                        className="form-textarea"
                        rows={4}
                        placeholder="Orientações detalhadas do que o aluno deve entregar..."
                        value={itemContent}
                        onChange={(e) => setItemContent(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="item-due-date">
                          Prazo de Entrega
                        </label>
                        <input
                          id="item-due-date"
                          type="datetime-local"
                          className="form-input"
                          value={itemDueDate}
                          onChange={(e) => setItemDueDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="item-max-score">
                          Nota Máxima
                        </label>
                        <input
                          id="item-max-score"
                          type="number"
                          className="form-input"
                          min={1}
                          max={100}
                          value={itemMaxScore}
                          onChange={(e) => setItemMaxScore(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {itemType === 'quiz' && (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor="item-quiz-desc">
                        Instruções do Quiz
                      </label>
                      <textarea
                        id="item-quiz-desc"
                        className="form-textarea"
                        rows={3}
                        placeholder="Orientações aos estudantes antes de iniciar as tentativas..."
                        value={itemContent}
                        onChange={(e) => setItemContent(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="item-quiz-due-date">
                          Prazo / Data Limite da Prova
                        </label>
                        <input
                          id="item-quiz-due-date"
                          type="datetime-local"
                          className="form-input"
                          value={itemDueDate}
                          onChange={(e) => setItemDueDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="item-max-attempts">
                          Limite de Tentativas
                        </label>
                        <input
                          id="item-max-attempts"
                          type="number"
                          className="form-input"
                          min={1}
                          max={10}
                          value={itemMaxAttempts}
                          onChange={(e) => setItemMaxAttempts(e.target.value)}
                        />
                      </div>
                    </div>
                    <span className="form-helper">
                      Após criar o quiz ou prova, você poderá adicionar questões na tela de gerenciamento.
                    </span>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddItemModal(false)}
                  disabled={submittingItem}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingItem}>
                  {submittingItem ? 'Salvando...' : 'Criar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

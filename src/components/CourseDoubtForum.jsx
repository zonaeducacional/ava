import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
  Clock,
  Pin,
  Send,
  ArrowLeft,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ThumbsUp,
  Trash2,
  Edit2,
  Tag,
  BookOpen,
  HelpCircle,
  Eye,
  AlertCircle
} from 'lucide-react';
import { forumService } from '../services/index.js';
import UserAvatar from './UserAvatar.jsx';

export default function CourseDoubtForum({
  course,
  user,
  canManage = false, // Professor do curso ou Admin
  initialSectionId = null
}) {
  const isAdmin = user?.role === 'admin';
  const hasAdminRights = canManage || isAdmin;

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [selectedSection, setSelectedSection] = useState(initialSectionId || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'pending' | 'answered'
  const [searchQuery, setSearchQuery] = useState('');

  // Tópico selecionado para ver a discussão completa
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [activeTopic, setActiveTopic] = useState(null);
  const [loadingTopic, setLoadingTopic] = useState(false);

  // Modal / Formulário de Nova Pergunta
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSectionId, setNewSectionId] = useState(initialSectionId || '');
  const [selectedTags, setSelectedTags] = useState(['Dúvida Geral']);
  const [submittingTopic, setSubmittingTopic] = useState(false);

  // Modal de Edição de Dúvida / Tópico (Admin / Autor)
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicContent, setEditTopicContent] = useState('');
  const [editTopicSectionId, setEditTopicSectionId] = useState('');
  const [editTopicTags, setEditTopicTags] = useState([]);
  const [savingTopicEdit, setSavingTopicEdit] = useState(false);

  // Edição inline de Resposta
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [savingReplyEdit, setSavingReplyEdit] = useState(false);

  // Campo de Resposta no Tópico Aberto
  const [replyContent, setReplyContent] = useState('');
  const [markAnsweredOnReply, setMarkAnsweredOnReply] = useState(canManage);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState('');

  // Sugestões de tags rápidas
  const availableTags = [
    'Dúvida Geral',
    'Conceito / Teoria',
    'Exercício / Código',
    'Tarefa Prática',
    'Prova / Quiz',
    'Erro / Bug',
    'Instalação / Configuração'
  ];

  // Se o prop initialSectionId mudar externamente, atualiza o filtro
  useEffect(() => {
    if (initialSectionId) {
      setSelectedSection(initialSectionId);
    }
  }, [initialSectionId]);

  // Carrega lista de tópicos
  useEffect(() => {
    if (course?.id) {
      loadTopics();
    }
  }, [course?.id, selectedSection, selectedStatus, searchQuery]);

  // Carrega detalhes do tópico quando selecionado
  useEffect(() => {
    if (selectedTopicId) {
      loadActiveTopic(selectedTopicId, true);
    } else {
      setActiveTopic(null);
    }
  }, [selectedTopicId]);

  const loadTopics = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await forumService.getTopicsByCourse(course.id, {
        sectionId: selectedSection,
        status: selectedStatus,
        search: searchQuery
      });
      setTopics(data);
    } catch (err) {
      console.error('Erro ao carregar tópicos do fórum:', err);
      setError('Não foi possível carregar as dúvidas do fórum: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveTopic = async (topicId, incrementView = false) => {
    setLoadingTopic(true);
    try {
      const topicData = await forumService.getTopicById(topicId, incrementView);
      setActiveTopic(topicData);
      setMarkAnsweredOnReply(canManage);
    } catch (err) {
      console.error('Erro ao carregar tópico:', err);
    } finally {
      setLoadingTopic(false);
    }
  };

  // Contadores globais do curso
  const stats = useMemo(() => {
    const total = topics.length;
    const pending = topics.filter((t) => t.status === 'pending').length;
    const answered = topics.filter((t) => t.status === 'answered').length;
    return { total, pending, answered };
  }, [topics]);

  // Submissão de Nova Pergunta pelo Aluno ou Professor
  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmittingTopic(true);
    try {
      // Localiza o título da seção se fornecida
      let secTitle = 'Geral do Curso';
      if (newSectionId && course?.sections) {
        const found = course.sections.find((s) => s.id === newSectionId);
        if (found) secTitle = found.title;
      }

      const created = await forumService.createTopic({
        courseId: course.id,
        sectionId: newSectionId || null,
        sectionTitle: secTitle,
        title: newTitle,
        content: newContent,
        authorId: user?.id || 'anon',
        authorName: user?.name || 'Participante',
        authorRole: user?.role || 'aluno',
        authorAvatar: user?.avatar || null,
        tags: selectedTags
      });

      // Limpa formulário e fecha modal
      setNewTitle('');
      setNewContent('');
      setNewSectionId('');
      setSelectedTags(['Dúvida Geral']);
      setShowNewTopicModal(false);

      // Recarrega tópicos e abre direto o tópico recém-criado
      await loadTopics();
      setSelectedTopicId(created.id);
    } catch (err) {
      alert('Erro ao publicar dúvida: ' + err.message);
    } finally {
      setSubmittingTopic(false);
    }
  };

  // Submissão do Campo de Resposta
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !activeTopic) return;

    setSubmittingReply(true);
    setReplySuccessMsg('');
    try {
      const isTeacher = user?.role === 'professor' || user?.role === 'admin' || canManage;

      const { reply, newStatus } = await forumService.addReply(activeTopic.id, {
        authorId: user?.id || 'anon',
        authorName: user?.name || 'Participante',
        authorRole: user?.role || 'aluno',
        authorAvatar: user?.avatar || null,
        content: replyContent,
        isTeacherAnswer: isTeacher,
        markAsAnswered: markAnsweredOnReply
      });

      setReplyContent('');
      setReplySuccessMsg('Resposta publicada com sucesso!');
      setTimeout(() => setReplySuccessMsg(''), 4000);

      // Atualiza o estado do tópico ativo
      setActiveTopic((prev) => ({
        ...prev,
        status: newStatus,
        replies: [...(prev.replies || []), reply],
        repliesCount: (prev.replies?.length || 0) + 1
      }));

      // Atualiza também na lista de tópicos
      setTopics((prev) =>
        prev.map((t) =>
          t.id === activeTopic.id
            ? { ...t, status: newStatus, repliesCount: (t.repliesCount || 0) + 1, updatedAt: reply.createdAt }
            : t
        )
      );
    } catch (err) {
      alert('Erro ao enviar resposta: ' + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Alteração de Status manual pelo Professor ou autor
  const handleToggleStatus = async (targetStatus) => {
    if (!activeTopic) return;
    try {
      await forumService.updateTopicStatus(activeTopic.id, targetStatus);
      setActiveTopic((prev) => ({ ...prev, status: targetStatus }));
      setTopics((prev) =>
        prev.map((t) => (t.id === activeTopic.id ? { ...t, status: targetStatus } : t))
      );
    } catch (err) {
      alert('Erro ao alterar status: ' + err.message);
    }
  };

  // Fixar / Desafixar
  const handleTogglePin = async () => {
    if (!activeTopic) return;
    try {
      const updated = await forumService.togglePinTopic(activeTopic.id);
      setActiveTopic((prev) => ({ ...prev, isPinned: updated.isPinned }));
      setTopics((prev) =>
        prev.map((t) => (t.id === activeTopic.id ? { ...t, isPinned: updated.isPinned } : t))
      );
    } catch (err) {
      alert('Erro ao fixar tópico: ' + err.message);
    }
  };

  // Excluir Tópico
  const handleDeleteTopic = async () => {
    if (!activeTopic) return;
    if (!window.confirm('Tem certeza que deseja excluir esta dúvida e todas as suas respostas?')) {
      return;
    }
    try {
      await forumService.deleteTopic(activeTopic.id);
      setSelectedTopicId(null);
      setActiveTopic(null);
      await loadTopics();
    } catch (err) {
      alert('Erro ao excluir tópico: ' + err.message);
    }
  };

  // Abrir Modal de Edição de Dúvida
  const handleOpenEditTopic = () => {
    if (!activeTopic) return;
    setEditTopicTitle(activeTopic.title || '');
    setEditTopicContent(activeTopic.content || '');
    setEditTopicSectionId(activeTopic.sectionId || '');
    setEditTopicTags(activeTopic.tags || []);
    setShowEditTopicModal(true);
  };

  // Salvar Edição de Dúvida
  const handleSaveEditTopic = async (e) => {
    e.preventDefault();
    if (!activeTopic) return;
    if (!editTopicTitle.trim() || !editTopicContent.trim()) {
      alert('Título e conteúdo são obrigatórios.');
      return;
    }
    setSavingTopicEdit(true);
    try {
      let secTitle = 'Geral do Curso';
      if (editTopicSectionId && course?.sections) {
        const found = course.sections.find((s) => s.id === editTopicSectionId);
        if (found) secTitle = found.title;
      }

      await forumService.updateTopic(activeTopic.id, {
        title: editTopicTitle.trim(),
        content: editTopicContent.trim(),
        sectionId: editTopicSectionId || null,
        sectionTitle: secTitle,
        tags: editTopicTags
      });

      setShowEditTopicModal(false);
      await loadActiveTopic(activeTopic.id);
      await loadTopics();
    } catch (err) {
      alert('Erro ao atualizar dúvida: ' + err.message);
    } finally {
      setSavingTopicEdit(false);
    }
  };

  // Excluir Resposta
  const handleDeleteReply = async (replyId) => {
    if (!activeTopic) return;
    if (!window.confirm('Tem certeza que deseja excluir esta resposta?')) return;
    try {
      await forumService.deleteReply(activeTopic.id, replyId);
      await loadActiveTopic(activeTopic.id);
      await loadTopics();
    } catch (err) {
      alert('Erro ao excluir resposta: ' + err.message);
    }
  };

  // Iniciar Edição de Resposta
  const handleOpenEditReply = (reply) => {
    setEditingReplyId(reply.id);
    setEditReplyText(reply.content || '');
  };

  // Salvar Edição de Resposta
  const handleSaveEditReply = async (replyId) => {
    if (!editReplyText.trim()) {
      alert('O texto da resposta não pode estar vazio.');
      return;
    }
    setSavingReplyEdit(true);
    try {
      await forumService.updateReply(replyId, editReplyText.trim());
      setEditingReplyId(null);
      await loadActiveTopic(activeTopic.id);
    } catch (err) {
      alert('Erro ao atualizar resposta: ' + err.message);
    } finally {
      setSavingReplyEdit(false);
    }
  };

  // Curtida em resposta
  const handleUpvoteReply = async (replyId) => {
    try {
      const updated = await forumService.upvoteReply(replyId);
      setActiveTopic((prev) => ({
        ...prev,
        replies: prev.replies.map((r) => (r.id === replyId ? { ...r, upvotes: updated.upvotes } : r))
      }));
    } catch (err) {
      console.error('Erro ao curtir resposta:', err);
    }
  };

  // Toggle de seleção de tag
  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Formatação de data amigável
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="course-doubt-forum-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* CABEÇALHO DO FÓRUM COM MÉTRICAS E BOTÃO DE NOVA DÚVIDA */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(253, 244, 176, 0.25) 0%, rgba(91, 206, 191, 0.12) 100%)',
          border: '1px solid rgba(50, 185, 190, 0.25)',
          padding: '1.25rem 1.5rem'
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#2e97b7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <HelpCircle size={20} />
              </div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#132f38' }}>
                Fórum de Dúvidas & Perguntas do Curso
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.35rem 0 0 0' }}>
              Espaço interativo para alunos postarem perguntas sobre as aulas e receberem orientações dos professores.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewTopicModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
              padding: '0.55rem 1.15rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <PlusCircle size={17} />
            <span>Postar Nova Dúvida</span>
          </button>
        </div>

        {/* ESTATÍSTICAS RÁPIDAS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(19, 47, 56, 0.08)'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <MessageSquare size={20} color="#2e97b7" />
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#132f38' }}>{stats.total}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total de Dúvidas</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#fffdf0',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #fdf4b0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <Clock size={20} color="#b39b00" />
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#685900' }}>{stats.pending}</div>
              <div style={{ fontSize: '0.75rem', color: '#8f7b00' }}>Pendentes de Resposta</div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#f4fbf8',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #a4dcb9',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <CheckCircle2 size={20} color="#15803d" />
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#166534' }}>{stats.answered}</div>
              <div style={{ fontSize: '0.75rem', color: '#15803d' }}>Respondidas com Sucesso</div>
            </div>
          </div>
        </div>
      </div>

      {/* CASO UM TÓPICO ESTEJA ABERTO: EXIBE A DISCUSSÃO COMPLETA E O CAMPO DE RESPOSTA */}
      {selectedTopicId && activeTopic ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Botão de Retorno */}
          <div>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setSelectedTopicId(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 600,
                padding: '0.4rem 0.85rem'
              }}
            >
              <ArrowLeft size={16} />
              <span>Voltar para todas as dúvidas</span>
            </button>
          </div>

          {/* CARD DA PERGUNTA PRINCIPAL */}
          <div
            className="card"
            style={{
              borderLeft: activeTopic.status === 'answered' ? '5px solid #a4dcb9' : '5px solid #fdf4b0',
              boxShadow: 'var(--shadow-md)',
              position: 'relative'
            }}
          >
            {/* Linha superior: Tags, Seção e Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {activeTopic.isPinned && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      backgroundColor: '#fdf4b0',
                      color: '#685900',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}
                  >
                    <Pin size={12} />
                    <span>Fixado</span>
                  </span>
                )}

                {/* Status Badge */}
                {activeTopic.status === 'answered' ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: '#a4dcb9',
                      color: '#134e48',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 800
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Respondido</span>
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      backgroundColor: '#fdf4b0',
                      color: '#716000',
                      border: '1px solid #d4c860',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 800
                    }}
                  >
                    <Clock size={14} />
                    <span>Pendente de Resposta</span>
                  </span>
                )}

                {/* Badge da Seção Relacionada */}
                <span
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <BookOpen size={12} />
                  <span>{activeTopic.sectionTitle || 'Geral do Curso'}</span>
                </span>
              </div>

              {/* Ações do Docente/Admin e Autor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                {hasAdminRights && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleTogglePin}
                      title={activeTopic.isPinned ? 'Desafixar dúvida' : 'Fixar no topo'}
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                    >
                      <Pin size={13} />
                      <span>{activeTopic.isPinned ? 'Desafixar' : 'Fixar'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => handleToggleStatus(activeTopic.status === 'answered' ? 'pending' : 'answered')}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.55rem',
                        backgroundColor: activeTopic.status === 'answered' ? '#fdf4b0' : '#a4dcb9',
                        color: '#132f38',
                        fontWeight: 700,
                        border: 'none'
                      }}
                      title="Alternar manualmente status da dúvida"
                    >
                      {activeTopic.status === 'answered' ? 'Marcar Pendente' : 'Marcar Respondido'}
                    </button>
                  </>
                )}

                {(hasAdminRights || activeTopic.authorId === user?.id) && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={handleOpenEditTopic}
                      title="Editar dúvida (Admin / Autor)"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Edit2 size={13} />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={handleDeleteTopic}
                      title="Excluir dúvida (Admin / Autor)"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Trash2 size={13} />
                      <span>Excluir</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Título da Pergunta */}
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#132f38', margin: '0.5rem 0' }}>
              {activeTopic.title}
            </h1>

            {/* Metadados do Autor */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: '0.75rem 0 1.25rem 0',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)'
              }}
            >
              <UserAvatar
                avatar={activeTopic.authorAvatar}
                name={activeTopic.authorName}
                size={34}
                showBorder
                borderColor="#5bcebf"
              />
              <div>
                <span style={{ fontWeight: 700, color: '#132f38' }}>{activeTopic.authorName}</span>
                <span
                  style={{
                    marginLeft: '0.4rem',
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '8px',
                    backgroundColor: activeTopic.authorRole === 'professor' ? '#2e97b7' : 'var(--bg-subtle)',
                    color: activeTopic.authorRole === 'professor' ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 600
                  }}
                >
                  {activeTopic.authorRole === 'professor' ? 'Docente' : 'Estudante'}
                </span>
                <span style={{ margin: '0 0.4rem' }}>•</span>
                <span>Postado em {formatDate(activeTopic.createdAt)}</span>
              </div>
            </div>

            {/* Corpo / Conteúdo da Pergunta */}
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.65,
                fontSize: '0.975rem',
                color: '#132f38',
                marginBottom: '1rem'
              }}
            >
              {activeTopic.content}
            </div>

            {/* Tags da Pergunta */}
            {activeTopic.tags && activeTopic.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {activeTopic.tags.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(50, 185, 190, 0.12)',
                      color: '#2e97b7',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px'
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* LISTA DE RESPOSTAS / THREAD */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#132f38' }}>
                Respostas ({activeTopic.replies?.length || 0})
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {activeTopic.status === 'answered'
                  ? 'Esta dúvida já possui resposta oficial'
                  : 'Aguardando orientações'}
              </span>
            </div>

            {/* Se não houver nenhuma resposta ainda */}
            {(!activeTopic.replies || activeTopic.replies.length === 0) ? (
              <div
                className="empty-state"
                style={{
                  backgroundColor: '#ffffff',
                  padding: '2rem 1.5rem',
                  border: '1px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div className="empty-icon" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700 }}>Nenhuma resposta publicada ainda</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                  Seja o primeiro a responder e ajudar a esclarecer esta dúvida!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeTopic.replies.map((reply) => {
                  const isTeacherReply = reply.isTeacherAnswer || reply.authorRole === 'professor' || reply.authorRole === 'admin';

                  return (
                    <div
                      key={reply.id}
                      className="card"
                      style={{
                        backgroundColor: isTeacherReply ? '#f4fbf8' : '#ffffff',
                        border: isTeacherReply ? '2px solid #5bcebf' : '1px solid var(--border-color)',
                        padding: '1.25rem',
                        boxShadow: isTeacherReply ? '0 4px 14px rgba(91, 206, 191, 0.15)' : 'var(--shadow-sm)'
                      }}
                    >
                      {/* Destaque para Resposta do Professor */}
                      {isTeacherReply && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: '#2e97b7',
                            color: '#ffffff',
                            padding: '0.2rem 0.65rem',
                            borderRadius: '12px',
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            marginBottom: '0.75rem'
                          }}
                        >
                          <ShieldCheck size={13} />
                          <span>Resposta Oficial do Docente</span>
                        </div>
                      )}

                      {/* Autor da Resposta */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <UserAvatar
                            avatar={reply.authorAvatar}
                            name={reply.authorName}
                            size={34}
                            showBorder
                            borderColor={isTeacherReply ? '#2e97b7' : '#a4dcb9'}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: '#132f38', fontSize: '0.9rem' }}>
                              {reply.authorName}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {reply.authorRole === 'professor' ? 'Professor(a)' : 'Aluno(a)'} • {formatDate(reply.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Ações da Resposta: Voto Útil, Editar, Excluir */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleUpvoteReply(reply.id)}
                            className="btn btn-sm btn-secondary"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.55rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              backgroundColor: '#ffffff'
                            }}
                            title="Achei esta resposta útil"
                          >
                            <ThumbsUp size={13} color="#2e97b7" />
                            <span>Útil ({reply.upvotes || 0})</span>
                          </button>

                          {(hasAdminRights || reply.authorId === user?.id) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditReply(reply)}
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.45rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                                title="Editar resposta (Admin / Autor)"
                              >
                                <Edit2 size={12} />
                                <span>Editar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteReply(reply.id)}
                                className="btn btn-sm btn-outline"
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.45rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  color: '#dc2626',
                                  borderColor: '#fca5a5'
                                }}
                                title="Excluir resposta (Admin / Autor)"
                              >
                                <Trash2 size={12} />
                                <span>Excluir</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Texto da Resposta ou Formulário de Edição */}
                      {editingReplyId === reply.id ? (
                        <div style={{ marginTop: '0.5rem' }}>
                          <textarea
                            className="form-textarea"
                            rows={3}
                            value={editReplyText}
                            onChange={(e) => setEditReplyText(e.target.value)}
                            style={{ width: '100%', fontSize: '0.9rem', marginBottom: '0.5rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => setEditingReplyId(null)}
                              disabled={savingReplyEdit}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSaveEditReply(reply.id)}
                              disabled={savingReplyEdit}
                            >
                              {savingReplyEdit ? 'Salvando...' : 'Salvar Alteração'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.6,
                            fontSize: '0.925rem',
                            color: '#132f38'
                          }}
                        >
                          {reply.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CAMPO DE RESPOSTA OBRIGATÓRIO (INTERFACE PARA ADICIONAR RESPOSTA) */}
          <div
            className="card"
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid #32b9be',
              boxShadow: '0 6px 16px rgba(50, 185, 190, 0.12)',
              marginTop: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Send size={18} color="#2e97b7" />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#132f38' }}>
                Responder a esta Dúvida
              </h4>
            </div>

            {replySuccessMsg && (
              <div
                style={{
                  backgroundColor: '#a4dcb9',
                  color: '#134e48',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{replySuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendReply}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" htmlFor="forum-reply-input" style={{ fontSize: '0.825rem', fontWeight: 700 }}>
                  Sua Explicação ou Orientação:
                </label>
                <textarea
                  id="forum-reply-input"
                  rows={4}
                  className="form-textarea"
                  placeholder="Escreva sua resposta de forma clara e objetiva. Você pode colar trechos de código, exemplos ou links de referência..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  required
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                {/* Checkbox para Professor marcar como oficialmente respondida */}
                {canManage ? (
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      color: '#132f38'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={markAnsweredOnReply}
                      onChange={(e) => setMarkAnsweredOnReply(e.target.checked)}
                      style={{ accentColor: '#2e97b7', width: '16px', height: '16px' }}
                    />
                    <span>Marcar tópico como <strong>Respondido</strong> ao enviar</span>
                  </label>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Respostas dos professores recebem selo de verificação oficial.
                  </span>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingReply || !replyContent.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 700,
                    padding: '0.5rem 1.25rem'
                  }}
                >
                  <Send size={15} />
                  <span>{submittingReply ? 'Enviando...' : 'Publicar Resposta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* LISTAGEM DE TÓPICOS E FILTROS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* BARRA DE FILTROS E BUSCA */}
          <div
            className="card"
            style={{
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.75rem',
                alignItems: 'center'
              }}
            >
              {/* Campo de Pesquisa */}
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                    display: 'flex'
                  }}
                >
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                  placeholder="Pesquisar por dúvida, termo ou autor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filtro por Seção / Módulo do Curso */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <select
                  className="form-select"
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  style={{ fontSize: '0.85rem', width: '100%' }}
                >
                  <option value="all">Todas as Seções / Módulos</option>
                  <option value="general">Dúvidas Gerais (Sem módulo)</option>
                  {course?.sections?.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Status: Respondido vs Pendente */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{ fontSize: '0.85rem', width: '100%' }}
                >
                  <option value="all">Todos os Status</option>
                  <option value="pending">🟡 Pendentes (Aguardando resposta)</option>
                  <option value="answered">🟢 Respondidos (Orientados)</option>
                </select>
              </div>
            </div>
          </div>

          {/* LISTA DE TÓPICOS ENCONTRADOS */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              Carregando dúvidas do fórum...
            </div>
          ) : topics.length === 0 ? (
            <div
              className="empty-state"
              style={{
                backgroundColor: '#ffffff',
                padding: '3rem 1.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div className="empty-icon" style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💡</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Nenhuma dúvida encontrada</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.25rem auto', fontSize: '0.9rem' }}>
                {searchQuery || selectedSection !== 'all' || selectedStatus !== 'all'
                  ? 'Nenhum tópico corresponde aos filtros selecionados. Tente ajustar os termos de busca.'
                  : 'Ainda não há dúvidas cadastradas neste curso. Seja o primeiro a postar uma pergunta para a turma!'}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowNewTopicModal(true)}
              >
                Postar Primeira Dúvida
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {topics.map((topic) => {
                const isAnswered = topic.status === 'answered';

                return (
                  <div
                    key={topic.id}
                    className="card card-hover"
                    onClick={() => setSelectedTopicId(topic.id)}
                    style={{
                      cursor: 'pointer',
                      borderLeft: isAnswered ? '4px solid #a4dcb9' : '4px solid #fdf4b0',
                      padding: '1.15rem 1.25rem',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        marginBottom: '0.4rem'
                      }}
                    >
                      {/* Lado Esquerdo: Badges e Título */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                          {topic.isPinned && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.2rem',
                                backgroundColor: '#fdf4b0',
                                color: '#685900',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '10px',
                                fontSize: '0.7rem',
                                fontWeight: 800
                              }}
                            >
                              <Pin size={11} />
                              <span>Fixado</span>
                            </span>
                          )}

                          {/* Status Badge */}
                          {isAnswered ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                backgroundColor: '#a4dcb9',
                                color: '#134e48',
                                padding: '0.15rem 0.55rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 800
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>Respondido</span>
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                backgroundColor: '#fdf4b0',
                                color: '#716000',
                                border: '1px solid #d4c860',
                                padding: '0.15rem 0.55rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 800
                              }}
                            >
                              <Clock size={12} />
                              <span>Pendente</span>
                            </span>
                          )}

                          {/* Seção */}
                          <span
                            style={{
                              backgroundColor: 'var(--bg-subtle)',
                              color: 'var(--text-muted)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '10px',
                              fontSize: '0.725rem',
                              fontWeight: 600
                            }}
                          >
                            {topic.sectionTitle || 'Geral do Curso'}
                          </span>
                        </div>

                        <h3
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            margin: '0.2rem 0 0.4rem 0',
                            color: '#132f38',
                            lineHeight: 1.35
                          }}
                        >
                          {topic.title}
                        </h3>

                        <p
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            margin: 0,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {topic.content}
                        </p>
                      </div>

                      {/* Lado Direito: Quantidade de Respostas */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: topic.repliesCount > 0 ? 'rgba(91, 206, 191, 0.15)' : 'var(--bg-subtle)',
                          border: topic.repliesCount > 0 ? '1px solid #5bcebf' : '1px solid var(--border-color)',
                          borderRadius: '10px',
                          padding: '0.45rem 0.75rem',
                          minWidth: '65px',
                          textAlign: 'center',
                          flexShrink: 0
                        }}
                      >
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#132f38' }}>
                          {topic.repliesCount || 0}
                        </span>
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {topic.repliesCount === 1 ? 'resposta' : 'respostas'}
                        </span>
                      </div>
                    </div>

                    {/* Rodapé do Card: Autor, Data e Visualizações */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '0.75rem',
                        paddingTop: '0.6rem',
                        borderTop: '1px solid rgba(19, 47, 56, 0.06)',
                        fontSize: '0.775rem',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 600, color: '#132f38' }}>{topic.authorName}</span>
                        <span>•</span>
                        <span>{formatDate(topic.createdAt)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Eye size={13} />
                          <span>{topic.views || 1} visualizações</span>
                        </span>
                        <span
                          style={{
                            color: '#2e97b7',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                        >
                          Ver debate →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: POSTAR NOVA DÚVIDA / PERGUNTA */}
      {showNewTopicModal && (
        <div className="modal-backdrop" onClick={() => setShowNewTopicModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '92%' }}
          >
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#132f38', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} color="#2e97b7" />
                <span>Postar Nova Dúvida no Fórum</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowNewTopicModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTopic}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="topic-title">
                    Título Resumido da Dúvida *
                  </label>
                  <input
                    id="topic-title"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Como evitar re-renderizações infinitas no useEffect?"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="topic-section">
                    Módulo ou Seção do Curso
                  </label>
                  <select
                    id="topic-section"
                    className="form-select"
                    value={newSectionId}
                    onChange={(e) => setNewSectionId(e.target.value)}
                  >
                    <option value="">Geral do Curso (Dúvida não vinculada a um módulo)</option>
                    {course?.sections?.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Rápidas */}
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.35rem' }}>
                    Tags e Temas Relacionados:
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {availableTags.map((tag) => {
                      const isSel = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.55rem',
                            borderRadius: '14px',
                            border: isSel ? '1px solid #2e97b7' : '1px solid var(--border-color)',
                            backgroundColor: isSel ? '#2e97b7' : 'var(--bg-subtle)',
                            color: isSel ? '#ffffff' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="topic-content">
                    Detalhamento Completo da Pergunta *
                  </label>
                  <textarea
                    id="topic-content"
                    rows={6}
                    className="form-textarea"
                    placeholder="Descreva o que você está tentando fazer, o resultado esperado, mensagens de erro ou código que gerou a dúvida..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                    style={{ lineHeight: 1.5 }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewTopicModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingTopic || !newTitle.trim() || !newContent.trim()}
                >
                  {submittingTopic ? 'Publicando...' : 'Publicar Pergunta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE DÚVIDA / TÓPICO (ADMIN / AUTOR) */}
      {showEditTopicModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#132f38', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} color="#2e97b7" />
                <span>Editar Dúvida do Fórum (Admin / Autor)</span>
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowEditTopicModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditTopic}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-topic-title">
                    Título da Dúvida *
                  </label>
                  <input
                    id="edit-topic-title"
                    type="text"
                    className="form-input"
                    value={editTopicTitle}
                    onChange={(e) => setEditTopicTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-topic-section">
                    Módulo ou Seção do Curso
                  </label>
                  <select
                    id="edit-topic-section"
                    className="form-select"
                    value={editTopicSectionId}
                    onChange={(e) => setEditTopicSectionId(e.target.value)}
                  >
                    <option value="">Geral do Curso</option>
                    {course?.sections?.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-topic-content">
                    Conteúdo / Texto da Pergunta *
                  </label>
                  <textarea
                    id="edit-topic-content"
                    rows={6}
                    className="form-textarea"
                    value={editTopicContent}
                    onChange={(e) => setEditTopicContent(e.target.value)}
                    required
                    style={{ lineHeight: 1.5 }}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditTopicModal(false)}
                  disabled={savingTopicEdit}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingTopicEdit || !editTopicTitle.trim() || !editTopicContent.trim()}
                >
                  {savingTopicEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { courseTextService } from '../services/index.js';

/**
 * Componente CourseTextDiscussions
 * Seção de publicação de textos (digitar/colar ou upload de PDF/DOCX)
 * com visualização na íntegra e chat de comentários para Alunos, Professores e Admin.
 */
export default function CourseTextDiscussions({
  course,
  user,
  canManage = false // professor do curso ou admin
}) {
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Estados do formulário de criação (Professor/Admin)
  const [inputMode, setInputMode] = useState('type'); // 'type' (digitar/colar) | 'file' (upload pdf/docx)
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Controle de expansão de textos (quais estão abertos na íntegra)
  const [expandedTexts, setExpandedTexts] = useState({});

  // Leitor imersivo em modal de tela cheia
  const [readerText, setReaderText] = useState(null);
  const [fontSize, setFontSize] = useState(16); // px

  // Estado dos comentários por texto
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComments, setSubmittingComments] = useState({});

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (course?.id) {
      loadTexts();
    }
  }, [course?.id]);

  const loadTexts = async () => {
    setLoading(true);
    try {
      const data = await courseTextService.getTextsByCourse(course.id);
      // Carrega cada texto com seus comentários
      const fullTexts = await Promise.all(
        data.map((t) => courseTextService.getTextById(t.id))
      );
      setTexts(fullTexts.filter(Boolean));

      // Por padrão, expande o primeiro texto para visualização imediata na íntegra
      if (fullTexts.length > 0) {
        setExpandedTexts({ [fullTexts[0].id]: true });
      }
    } catch (err) {
      console.error('Erro ao carregar textos do curso:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (textId) => {
    setExpandedTexts((prev) => ({
      ...prev,
      [textId]: !prev[textId]
    }));
  };

  // Processa o arquivo anexado (PDF, DOCX, TXT)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type
    });

    if (!newTitle.trim()) {
      // Sugere o nome do arquivo sem extensão como título
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Se for arquivo de texto (.txt ou .md), faz leitura direta
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = event.target?.result;
        if (typeof textContent === 'string') {
          setNewContent(textContent);
        }
      };
      reader.readAsText(file);
    } else {
      // Para PDF e DOCX, prepara template informativo com espaço para o professor colar ou digitar
      if (!newContent.trim()) {
        setNewContent(
          `[Documento Anexado: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]\n\nCole aqui o conteúdo extraído ou resumo na íntegra do documento para leitura imediata da turma no navegador:`
        );
      }
    }
  };

  const handleCreateText = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim()) {
      setFormError('Informe um título para o texto.');
      return;
    }
    if (!newContent.trim()) {
      setFormError('Insira ou cole o conteúdo do texto na íntegra.');
      return;
    }

    setSubmitting(true);
    try {
      await courseTextService.createText(course.id, {
        title: newTitle,
        summary: newSummary,
        content: newContent,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        sourceType: selectedFile ? 'file' : 'text',
        fileName: selectedFile?.name || '',
        fileSize: selectedFile?.size || ''
      });

      // Limpa formulário
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowCreateModal(false);

      await loadTexts();
    } catch (err) {
      setFormError(err.message || 'Erro ao publicar texto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteText = async (textId) => {
    if (!window.confirm('Tem certeza de que deseja excluir este texto e todo o histórico de comentários da turma?')) {
      return;
    }
    try {
      await courseTextService.deleteText(textId);
      await loadTexts();
    } catch (err) {
      alert('Erro ao excluir texto: ' + err.message);
    }
  };

  const handleAddComment = async (textId, e) => {
    e.preventDefault();
    const commentText = commentInputs[textId]?.trim();
    if (!commentText) return;

    setSubmittingComments((prev) => ({ ...prev, [textId]: true }));
    try {
      await courseTextService.addComment(textId, {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        comment: commentText
      });

      // Limpa o input do comentário deste texto
      setCommentInputs((prev) => ({ ...prev, [textId]: '' }));

      // Recarrega o texto específico para atualizar o chat
      const updated = await courseTextService.getTextById(textId);
      setTexts((prev) => prev.map((t) => (t.id === textId ? updated : t)));
    } catch (err) {
      alert('Erro ao enviar comentário: ' + err.message);
    } finally {
      setSubmittingComments((prev) => ({ ...prev, [textId]: false }));
    }
  };

  const handleDeleteComment = async (textId, commentId) => {
    if (!window.confirm('Deseja excluir este comentário?')) return;
    try {
      await courseTextService.deleteComment(commentId);
      const updated = await courseTextService.getTextById(textId);
      setTexts((prev) => prev.map((t) => (t.id === textId ? updated : t)));
    } catch (err) {
      alert('Erro ao excluir comentário: ' + err.message);
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 2) return 'Agora mesmo';
      if (diffMin < 60) return `Há ${diffMin} min`;
      if (diffHours < 24) return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      if (diffDays === 1) return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* CABEÇALHO DA SEÇÃO DE TEXTOS & CHAT */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.5rem',
          borderLeft: '5px solid var(--primary)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem' }}>📖</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Leituras & Discussões em Grupo
            </h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--primary)',
                backgroundColor: 'var(--primary-light)',
                padding: '0.15rem 0.55rem',
                borderRadius: 'var(--radius-full)'
              }}
            >
              Estilo Google Sala de Aula
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            {canManage
              ? 'Suba documentos (PDF/DOCX) ou digite/cole textos completos para leitura da turma com chat colaborativo integrado.'
              : 'Leia os artigos e textos disponibilizados pelo professor na íntegra e participe dos debates no chat.'}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <span>+</span> Publicar Novo Texto
          </button>
        )}
      </div>

      {/* LISTA DE TEXTOS DISPONÍVEIS */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" />
          <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
            Carregando leituras e discussões...
          </p>
        </div>
      ) : texts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>Nenhum texto compartilhado ainda</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '480px' }}>
            {canManage
              ? 'Clique no botão acima para adicionar o primeiro texto, artigo ou estudo de caso da disciplina para a turma debater.'
              : 'O professor ainda não publicou textos de leitura para este curso. Fique atento às atualizações!'}
          </p>
          {canManage && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={() => setShowCreateModal(true)}
            >
              + Publicar Primeiro Texto
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {texts.map((textItem) => {
            const isExpanded = !!expandedTexts[textItem.id];
            const comments = textItem.comments || [];

            return (
              <div
                key={textItem.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                {/* CABEÇALHO DO CARD DO TEXTO */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: textItem.sourceType === 'file' ? '#e0f2fe' : 'var(--bg-subtle)',
                          color: textItem.sourceType === 'file' ? '#0369a1' : 'var(--text-secondary)',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        {textItem.sourceType === 'file' ? '📄 Documento PDF/DOCX' : '📝 Texto / Artigo'}
                      </span>

                      {textItem.fileName && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Arquivo: <strong>{textItem.fileName}</strong> ({textItem.fileSize})
                        </span>
                      )}
                    </div>

                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '0.35rem'
                      }}
                    >
                      {textItem.title}
                    </h3>

                    {textItem.summary && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        {textItem.summary}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>
                        Publicado por: <strong>{textItem.authorName}</strong> ({textItem.authorRole})
                      </span>
                      <span>•</span>
                      <span>{new Date(textItem.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* AÇÕES NO TOPO DO TEXTO */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => {
                        setReaderText(textItem);
                        setFontSize(16);
                      }}
                      title="Abrir em modo leitura imersiva com ajuste de fonte"
                      style={{ fontSize: '0.8rem' }}
                    >
                      🔍 Modo Leitura
                    </button>

                    <button
                      type="button"
                      className={`btn btn-sm ${isExpanded ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => toggleExpand(textItem.id)}
                      style={{ fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {isExpanded ? '▲ Recolher Texto' : '▼ Visualizar na Íntegra'}
                    </button>

                    {canManage && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleDeleteText(textItem.id)}
                        style={{ color: 'var(--danger)', fontSize: '0.8rem' }}
                        title="Excluir publicação"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* CORPO DO TEXTO NA ÍNTEGRA (EXPOSTO OU COM TOGGLE DE 1 CLIQUE) */}
                {isExpanded ? (
                  <div
                    style={{
                      padding: '1.5rem 1.75rem',
                      backgroundColor: 'var(--bg-app)',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem',
                          borderBottom: '1px solid var(--border-color)',
                          paddingBottom: '0.5rem'
                        }}
                      >
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                          Conteúdo Completo do Texto
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(textItem.content);
                            alert('Texto copiado para a área de transferência!');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          📋 Copiar Texto
                        </button>
                      </div>

                      <div
                        style={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.8,
                          fontSize: '0.975rem',
                          color: 'var(--text-primary)',
                          fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif'
                        }}
                      >
                        {textItem.content}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Prévia compacta quando recolhido */
                  <div
                    onClick={() => toggleExpand(textItem.id)}
                    style={{
                      padding: '1rem 1.5rem',
                      backgroundColor: 'var(--bg-app)',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    title="Clique para expandir o texto na íntegra"
                  >
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                      "{textItem.content.slice(0, 140)}..."
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                      Clique para ler na íntegra →
                    </span>
                  </div>
                )}

                {/* SEÇÃO DE CHAT / COMENTÁRIOS ESTILO GOOGLE SALA DE AULA */}
                <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}
                  >
                    <span>💬</span>
                    <span>Comentários da turma ({comments.length})</span>
                  </div>

                  {/* Lista de Comentários do Chat */}
                  {comments.length === 0 ? (
                    <div style={{ padding: '0.75rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Nenhum comentário ainda. Seja o primeiro a compartilhar suas reflexões sobre o texto!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      {comments.map((comm) => {
                        const isAuthor = comm.userId === user?.id;
                        const canDelete = isAuthor || canManage;

                        return (
                          <div
                            key={comm.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              padding: '0.65rem 0.85rem',
                              backgroundColor: 'var(--bg-app)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {/* Avatar do Autor */}
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                backgroundColor:
                                  comm.userRole === 'professor'
                                    ? 'var(--primary)'
                                    : comm.userRole === 'admin'
                                    ? '#7c3aed'
                                    : 'var(--secondary)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                flexShrink: 0
                              }}
                            >
                              {comm.userName ? comm.userName.charAt(0).toUpperCase() : 'U'}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                  {comm.userName}
                                </span>

                                <span
                                  className={`user-role-tag role-${comm.userRole || 'student'}`}
                                  style={{ fontSize: '0.675rem', padding: '0.05rem 0.4rem' }}
                                >
                                  {comm.userRole === 'professor'
                                    ? 'Professor'
                                    : comm.userRole === 'admin'
                                    ? 'Admin'
                                    : 'Aluno'}
                                </span>

                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {formatRelativeTime(comm.createdAt)}
                                </span>

                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(textItem.id, comm.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--text-muted)',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem',
                                      marginLeft: 'auto',
                                      padding: '0 0.25rem'
                                    }}
                                    title="Excluir comentário"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                                {comm.comment}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Input de Novo Comentário no Chat (Estilo Google Classroom) */}
                  <form
                    onSubmit={(e) => handleAddComment(textItem.id, e)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '0.75rem',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.75rem'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        flexShrink: 0
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <input
                      type="text"
                      className="form-input"
                      placeholder="Adicionar um comentário para a turma sobre este texto..."
                      value={commentInputs[textItem.id] || ''}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [textItem.id]: e.target.value
                        }))
                      }
                      style={{ flex: 1, borderRadius: 'var(--radius-full)', padding: '0.5rem 1rem' }}
                    />

                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={submittingComments[textItem.id] || !commentInputs[textItem.id]?.trim()}
                      style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem' }}
                    >
                      {submittingComments[textItem.id] ? 'Enviando...' : 'Enviar ➤'}
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / UPLOAD DE TEXTO (PROFESSOR & ADMIN APENAS) */}
      {showCreateModal && canManage && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                📖 Publicar Texto ou Documento para a Turma
              </h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '0.2rem 0.6rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateText}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}

                {/* Alternador de Método: Digitar/Colar vs Subir Arquivo */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                    padding: '0.25rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setInputMode('type')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      backgroundColor: inputMode === 'type' ? 'var(--bg-surface)' : 'transparent',
                      color: inputMode === 'type' ? 'var(--primary)' : 'var(--text-secondary)',
                      boxShadow: inputMode === 'type' ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    ✍️ Digitar ou Colar Texto
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      backgroundColor: inputMode === 'file' ? 'var(--bg-surface)' : 'transparent',
                      color: inputMode === 'file' ? 'var(--primary)' : 'var(--text-secondary)',
                      boxShadow: inputMode === 'file' ? 'var(--shadow-sm)' : 'none'
                    }}
                  >
                    📎 Subir Arquivo (PDF / DOCX / TXT)
                  </button>
                </div>

                {/* Seção de Upload de Arquivo quando selecionado */}
                {inputMode === 'file' && (
                  <div
                    style={{
                      border: '2px dashed var(--primary-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.5rem',
                      textAlign: 'center',
                      backgroundColor: 'var(--primary-light)',
                      marginBottom: '1.25rem'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                      Selecione o documento da sua máquina
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Formatos aceitos: PDF, Word (.docx, .doc), Texto Puro (.txt, .md)
                    </p>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="upload-doc-input"
                    />
                    <label
                      htmlFor="upload-doc-input"
                      className="btn btn-primary btn-sm"
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      Escolher Arquivo do Computador
                    </label>

                    {selectedFile && (
                      <div
                        style={{
                          marginTop: '1rem',
                          padding: '0.5rem 1rem',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <span>✓ Arquivo carregado: <strong>{selectedFile.name}</strong> ({selectedFile.size})</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="text-title">
                    Título do Texto / Artigo *
                  </label>
                  <input
                    id="text-title"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Capítulo 02 - Princípios de Clean Code e Boas Práticas"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="text-summary">
                    Resumo ou Instruções de Leitura (opcional)
                  </label>
                  <input
                    id="text-summary"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Leitura recomendada antes do debate da próxima aula síncrona."
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" htmlFor="text-content" style={{ margin: 0 }}>
                      Conteúdo Completo do Texto na Íntegra *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Aparecerá exposto para leitura direta de todos os alunos
                    </span>
                  </div>
                  <textarea
                    id="text-content"
                    className="form-input"
                    rows={12}
                    placeholder="Digite ou cole aqui o texto na íntegra (artigo, capítulo, estudo de caso, perguntas norteadoras para o chat)..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    style={{
                      fontFamily: 'inherit',
                      fontSize: '0.925rem',
                      lineHeight: 1.6
                    }}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Publicando...' : '✓ Publicar Texto para a Turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE LEITURA IMERSIVA COM AJUSTE DE FONTE */}
      {readerText && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div
            className="modal-content"
            style={{
              maxWidth: '850px',
              width: '92%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="modal-header" style={{ alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                  {readerText.title}
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Por: {readerText.authorName} ({readerText.authorRole})
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Controles de tamanho de fonte */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.1rem 0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.max(13, s - 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                    title="Diminuir fonte"
                  >
                    A-
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '35px', textAlign: 'center' }}>
                    {fontSize}px
                  </span>
                  <button
                    type="button"
                    onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                    title="Aumentar fonte"
                  >
                    A+
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setReaderText(null)}
                  style={{ padding: '0.2rem 0.6rem' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div
              className="modal-body"
              style={{
                overflowY: 'auto',
                padding: '2rem',
                backgroundColor: 'var(--bg-app)',
                flex: 1
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '2rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.85,
                  fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)'
                }}
              >
                {readerText.content}
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                💬 {readerText.comments?.length || 0} comentários na discussão da turma
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReaderText(null)}
              >
                Fechar Modo Leitura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

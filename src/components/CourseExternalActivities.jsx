import React, { useState, useEffect } from 'react';
import { externalActivityService } from '../services/index.js';
import ActivityStatusBadge from './ActivityStatusBadge.jsx';

// Imagens sugeridas para facilitar a seleção rápida pelo professor
const PRESET_IMAGES = [
  { label: 'Código & Programação', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80' },
  { label: 'Tecnologia & Telas', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80' },
  { label: 'Estudo & Livros', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80' },
  { label: 'Ciência & Laboratório', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80' },
  { label: 'Design & Criatividade', url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80' },
  { label: 'Jogos & Quiz', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80' }
];

export default function CourseExternalActivities({
  course,
  user,
  canManage = false
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityStatuses, setActivityStatuses] = useState({});

  // Campos do formulário
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('Laboratório Prático');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Estados de feedback visual
  const [copiedId, setCopiedId] = useState(null);
  const [completedActivities, setCompletedActivities] = useState({});

  useEffect(() => {
    if (course?.id) {
      loadActivities();
    }
  }, [course?.id]);

  // Carrega status de atividades (Pendente, Em curso, Concluído) do localStorage
  useEffect(() => {
    if (user?.id && course?.id) {
      try {
        const key = `status_ext_acts_${user.id}_${course.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          setActivityStatuses(JSON.parse(saved));
        } else {
          // Migração retrocompatível
          const oldKey = `completed_ext_acts_${user.id}_${course.id}`;
          const oldSaved = localStorage.getItem(oldKey);
          if (oldSaved) {
            const parsed = JSON.parse(oldSaved);
            const migrated = {};
            Object.keys(parsed).forEach((id) => {
              migrated[id] = parsed[id] ? 'completed' : 'pending';
            });
            setActivityStatuses(migrated);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar status:', err);
      }
    }
  }, [user?.id, course?.id]);

  const setActivityStatus = (actId, newStatus) => {
    const updated = {
      ...activityStatuses,
      [actId]: newStatus
    };
    setActivityStatuses(updated);
    if (user?.id && course?.id) {
      try {
        const key = `status_ext_acts_${user.id}_${course.id}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (err) {
        console.warn('Erro ao salvar status:', err);
      }
    }
  };

  const cycleActivityStatus = (actId) => {
    const current = activityStatuses[actId] || 'pending';
    const next = current === 'pending' ? 'in_progress' : current === 'in_progress' ? 'completed' : 'pending';
    setActivityStatus(actId, next);
  };

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await externalActivityService.getActivitiesByCourse(course.id);
      setActivities(data);
    } catch (err) {
      console.error('Erro ao carregar atividades externas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingActivity(null);
    setTitle('');
    setDescription('');
    setUrl('');
    setImageUrl(PRESET_IMAGES[0].url);
    setCategory('Laboratório Prático');
    setDueDate('');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (act) => {
    setEditingActivity(act);
    setTitle(act.title);
    setDescription(act.description);
    setUrl(act.url);
    setImageUrl(act.imageUrl || PRESET_IMAGES[0].url);
    setCategory(act.category || 'Laboratório Prático');
    setDueDate(act.dueDate ? act.dueDate.split('T')[0] : '');
    setFormError('');
    setShowModal(true);
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Informe o título da atividade.');
      return;
    }
    if (!url.trim()) {
      setFormError('Informe o link externo da atividade.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingActivity) {
        await externalActivityService.updateActivity(editingActivity.id, {
          title: title.trim(),
          description: description.trim(),
          url: url.trim(),
          imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
          category,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null
        });
      } else {
        await externalActivityService.createActivity(course.id, {
          title: title.trim(),
          description: description.trim(),
          url: url.trim(),
          imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
          category,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          authorId: user.id,
          authorName: user.name
        });
      }

      setShowModal(false);
      await loadActivities();
    } catch (err) {
      setFormError(err.message || 'Erro ao salvar atividade.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteActivity = async (actId) => {
    if (!window.confirm('Tem certeza de que deseja remover esta atividade externa?')) {
      return;
    }
    try {
      await externalActivityService.deleteActivity(actId);
      await loadActivities();
    } catch (err) {
      alert('Erro ao excluir atividade: ' + err.message);
    }
  };

  const handleCopyLink = (act) => {
    navigator.clipboard.writeText(act.url);
    setCopiedId(act.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleActivityCompleted = (actId) => {
    const updated = {
      ...completedActivities,
      [actId]: !completedActivities[actId]
    };
    setCompletedActivities(updated);
    if (user?.id && course?.id) {
      try {
        const key = `completed_ext_acts_${user.id}_${course.id}`;
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (err) {
        console.warn('Erro ao salvar conclusão:', err);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* CABEÇALHO DA SEÇÃO */}
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
            <span style={{ fontSize: '1.4rem' }}>🔗</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Atividades & Links Externos
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
              Laboratórios, Ferramentas & Desafios
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            {canManage
              ? 'Cadastre atividades práticas em plataformas externas (CodePen, Kahoot, PhET, Miro, etc.) com links, imagem de capa e orientações.'
              : 'Acesse simulações, desafios e laboratórios recomendados pelos professores em plataformas externas.'}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenCreateModal}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}
          >
            <span>+</span> Adicionar Atividade Externa
          </button>
        )}
      </div>

      {/* GRADE DE CARDS COM IMAGEM */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" />
          <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
            Carregando atividades externas...
          </p>
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <h3>Nenhuma atividade externa cadastrada</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '460px' }}>
            {canManage
              ? 'Clique no botão acima para adicionar a primeira atividade externa com imagem, descrição e link de acesso.'
              : 'O professor ainda não adicionou links de atividades externas para este curso.'}
          </p>
          {canManage && (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '1rem' }}
              onClick={handleOpenCreateModal}
            >
              + Adicionar Atividade
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {activities.map((act) => {
            const currentStatus = activityStatuses[act.id] || 'pending';
            const isCompleted = currentStatus === 'completed';

            return (
              <div
                key={act.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isCompleted ? '2px solid var(--accent-mint)' : '1px solid var(--border-color)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* IMAGEM DE CAPA DA ATIVIDADE VIA LINK */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '180px',
                    backgroundColor: 'var(--bg-subtle)',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={act.imageUrl || PRESET_IMAGES[0].url}
                    alt={act.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                    onError={(e) => {
                      // Fallback elegante caso a URL da imagem quebre
                      e.target.onerror = null;
                      e.target.src = PRESET_IMAGES[0].url;
                    }}
                  />

                  {/* Gradiente sutil para legibilidade */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(19, 47, 56, 0.65) 0%, transparent 60%)'
                    }}
                  />

                  {/* Badge de Categoria */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(46, 151, 183, 0.92)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(164, 220, 185, 0.5)'
                    }}
                  >
                    🏷️ {act.category || 'Atividade Externa'}
                  </span>

                  {/* Badge Visual de Status da Paleta (Pendente / Em curso / Concluído) */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <ActivityStatusBadge
                      status={currentStatus}
                      isInteractive={true}
                      onClick={() => cycleActivityStatus(act.id)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* CORPO DO CARD COM TÍTULO E DESCRIÇÃO */}
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                      lineHeight: 1.35
                    }}
                  >
                    {act.title}
                  </h3>

                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      lineHeight: 1.55,
                      marginBottom: '1rem',
                      flex: 1,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {act.description || 'Siga as orientações no link oficial da atividade para praticar o conteúdo.'}
                  </p>

                  {/* Informações adicionais (Prazo e Autor) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.775rem',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '0.75rem',
                      marginBottom: '1rem'
                    }}
                  >
                    <span>Por: <strong>{act.authorName || 'Professor'}</strong></span>
                    {act.dueDate && (
                      <span style={{ color: '#ea580c', fontWeight: 600 }}>
                        📅 Prazo: {new Date(act.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {/* STATUS E CONTROLE DE CONCLUSÃO */}
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
                      <ActivityStatusBadge
                        status={currentStatus}
                        isInteractive={true}
                        onClick={() => cycleActivityStatus(act.id)}
                        size="sm"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => cycleActivityStatus(act.id)}
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                      title="Alternar entre Pendente, Em curso e Concluído"
                    >
                      Alternar ⟳
                    </button>
                  </div>

                  {/* BOTÕES DE AÇÃO DO CARD */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Botão de Abrir Link Externo */}
                    <a
                      href={act.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (currentStatus === 'pending') {
                          setActivityStatus(act.id, 'in_progress');
                        }
                      }}
                      className="btn btn-primary"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      <span>Acessar Atividade</span>
                      <span>↗</span>
                    </a>

                    {/* Copiar Link */}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopyLink(act)}
                      title="Copiar URL externa da atividade"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                    >
                      {copiedId === act.id ? '✓ Copiado' : '📋 Link'}
                    </button>

                    {/* Ações do Professor / Admin */}
                    {canManage && (
                      <>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEditModal(act)}
                          title="Editar atividade"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleDeleteActivity(act.id)}
                          title="Excluir atividade"
                          style={{ padding: '0.35rem 0.65rem', color: 'var(--danger)', fontSize: '0.8rem' }}
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DA ATIVIDADE EXTERNA (PROFESSOR & ADMIN) */}
      {showModal && canManage && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingActivity ? '✏️ Editar Atividade Externa' : '🔗 Adicionar Atividade com Link Externo'}
              </h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setShowModal(false)}
                style={{ padding: '0.2rem 0.6rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveActivity}>
              <div className="modal-body">
                {formError && <div className="alert alert-error">{formError}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="act-title">
                    Título da Atividade *
                  </label>
                  <input
                    id="act-title"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Laboratório Interativo no CodePen ou Desafio no LeetCode"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="act-url">
                    Link da Atividade (URL Externa) *
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      id="act-url"
                      type="url"
                      className="form-input"
                      placeholder="https://exemplo.com/atividade-da-turma"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      style={{ flex: 1 }}
                      required
                    />
                    {url && (
                      <a
                        href={url.startsWith('http') ? url : `https://${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Testar Link ↗
                      </a>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                    O link abrirá com segurança em uma nova aba do navegador do estudante.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="act-image">
                    Imagem de Capa (Link da Imagem / Imagem via URL) *
                  </label>
                  <input
                    id="act-image"
                    type="url"
                    className="form-input"
                    placeholder="https://images.unsplash.com/... ou link direto da imagem"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    required
                  />

                  {/* Sugestões rápidas de imagens */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Ou selecione uma imagem temática com 1 clique:
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem' }}>
                      {PRESET_IMAGES.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setImageUrl(preset.url)}
                          style={{
                            fontSize: '0.725rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: imageUrl === preset.url ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: imageUrl === preset.url ? 'var(--primary-light)' : 'var(--bg-surface)',
                            color: imageUrl === preset.url ? 'var(--primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: imageUrl === preset.url ? 700 : 500
                          }}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview da Imagem */}
                  {imageUrl && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        height: '120px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-subtle)'
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt="Prévia da capa"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = PRESET_IMAGES[0].url;
                        }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="act-category">
                      Categoria / Tipo
                    </label>
                    <select
                      id="act-category"
                      className="form-input"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Laboratório Prático">Laboratório Prático</option>
                      <option value="Desafio & Gamificação">Desafio & Gamificação</option>
                      <option value="Simulação Interativa">Simulação Interativa</option>
                      <option value="Exercício Externo">Exercício Externo</option>
                      <option value="Leitura Interativa">Leitura Interativa</option>
                      <option value="Ferramenta Colaborativa">Ferramenta Colaborativa</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="act-due">
                      Data Limite Sugerida (opcional)
                    </label>
                    <input
                      id="act-due"
                      type="date"
                      className="form-input"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="act-desc">
                    Descrição & Instruções para os Estudantes *
                  </label>
                  <textarea
                    id="act-desc"
                    className="form-input"
                    rows={4}
                    placeholder="Descreva o que o estudante deve realizar ao acessar a atividade externa, critérios de avaliação ou objetivos de aprendizagem..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : editingActivity ? '✓ Salvar Alterações' : '✓ Publicar Atividade Externa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

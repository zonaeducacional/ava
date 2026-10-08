import React, { useState, useMemo } from 'react';
import {
  Image,
  Search,
  Check,
  Sparkles,
  User,
  X,
  RotateCcw,
  Link as LinkIcon,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { PREEXISTING_AVATARS, AVATAR_CATEGORIES, getAvatarById } from '../data/avatarGallery.js';
import UserAvatar from './UserAvatar.jsx';

/**
 * Componente: Galeria de Avatares Pré-existentes para o Perfil
 * Permite navegar, filtrar por categorias, pesquisar, pré-visualizar
 * e INSERIR o avatar pré-existente escolhido diretamente no perfil do usuário.
 */
export default function AvatarGalleryModal({
  isOpen = true,
  onClose,
  currentAvatarId,
  onSelectAvatar,
  userName = 'Usuário',
  userRole = 'aluno'
}) {
  const [selectedId, setSelectedId] = useState(currentAvatarId || 'avatar-student-1');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('gallery'); // 'gallery' | 'customUrl'
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Filtra avatares por categoria e busca
  const filteredAvatares = useMemo(() => {
    return PREEXISTING_AVATARS.filter((avatar) => {
      // Filtro de categoria
      if (activeCategory !== 'all' && avatar.category !== activeCategory) {
        return false;
      }
      // Filtro de busca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = avatar.name.toLowerCase().includes(q);
        const matchesCat = avatar.categoryLabel.toLowerCase().includes(q);
        return matchesName || matchesCat;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  // Avatar selecionado atual
  const selectedItem = useMemo(() => {
    return getAvatarById(selectedId) || PREEXISTING_AVATARS[0];
  }, [selectedId]);

  // Ação de confirmar e inserir no perfil
  const handleConfirm = () => {
    if (activeTab === 'customUrl' && customUrlInput.trim()) {
      onSelectAvatar(customUrlInput.trim());
    } else {
      onSelectAvatar(selectedId);
    }
    if (onClose) onClose();
  };

  // Redefinir para as iniciais
  const handleResetToInitials = () => {
    onSelectAvatar(null);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        zIndex: 1100,
        backgroundColor: 'rgba(19, 47, 56, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 40px -10px rgba(19, 47, 56, 0.35)'
        }}
      >
        {/* CABEÇALHO DO MODAL */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(253, 244, 176, 0.35) 0%, rgba(91, 206, 191, 0.18) 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#2e97b7',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#132f38', margin: 0 }}>
                Galeria de Avatares Pré-existentes
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Escolha uma ilustração exclusiva para compor a foto do seu perfil acadêmico.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* TABS DO MODAL: GALERIA VS URL PERSONALIZADA */}
        <div
          style={{
            display: 'flex',
            padding: '0.5rem 1.5rem 0 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            gap: '1rem',
            backgroundColor: '#ffffff'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.6rem 0.25rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: activeTab === 'gallery' ? '#2e97b7' : 'var(--text-secondary)',
              borderBottom: activeTab === 'gallery' ? '3px solid #2e97b7' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Sparkles size={15} />
            <span>Galeria Pré-existente ({PREEXISTING_AVATARS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customUrl')}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.6rem 0.25rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              color: activeTab === 'customUrl' ? '#2e97b7' : 'var(--text-secondary)',
              borderBottom: activeTab === 'customUrl' ? '3px solid #2e97b7' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <LinkIcon size={15} />
            <span>URL de Imagem Externa</span>
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL (COM SCROLL) */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {activeTab === 'gallery' ? (
            <>
              {/* FILTROS E BUSCA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Barra de Pesquisa */}
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Pesquisar por nome ou tema (ex: Coruja, Turing, Dev, Formatura...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
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

                {/* Filtro por Categorias (Chips) */}
                <div
                  style={{
                    display: 'flex',
                    gap: '0.4rem',
                    overflowX: 'auto',
                    paddingBottom: '0.25rem'
                  }}
                >
                  {AVATAR_CATEGORIES.map((cat) => {
                    const isSelected = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.3rem 0.65rem',
                          borderRadius: '16px',
                          border: isSelected ? '1px solid #2e97b7' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? '#2e97b7' : 'var(--bg-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* GRID DE AVATARES PRÉ-EXISTENTES */}
              {filteredAvatares.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhum avatar encontrado para a busca "{searchQuery}".
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                    gap: '0.85rem',
                    paddingTop: '0.25rem'
                  }}
                >
                  {filteredAvatares.map((avatar) => {
                    const isSelected = selectedId === avatar.id;

                    return (
                      <div
                        key={avatar.id}
                        onClick={() => setSelectedId(avatar.id)}
                        style={{
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-md)',
                          border: isSelected ? '2px solid #2e97b7' : '1px solid var(--border-color)',
                          backgroundColor: isSelected ? '#f4fbf8' : '#ffffff',
                          boxShadow: isSelected
                            ? '0 4px 12px rgba(46, 151, 183, 0.25)'
                            : '0 2px 5px rgba(19, 47, 56, 0.05)',
                          padding: '0.75rem 0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          position: 'relative',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Checkmark no selecionado */}
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '6px',
                              right: '6px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: '#2e97b7',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}

                        {/* Render do Avatar SVG */}
                        <div
                          style={{
                            width: '68px',
                            height: '68px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            boxShadow: '0 3px 8px rgba(19, 47, 56, 0.12)',
                            border: isSelected ? '2px solid #5bcebf' : '1px solid rgba(19, 47, 56, 0.08)',
                            marginBottom: '0.5rem'
                          }}
                          dangerouslySetInnerHTML={{ __html: avatar.svg }}
                        />

                        {/* Nome do Avatar */}
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#132f38',
                            lineHeight: 1.25,
                            marginTop: '0.1rem',
                            maxHeight: '2.5em',
                            overflow: 'hidden'
                          }}
                        >
                          {avatar.name.split('(')[0]}
                        </div>

                        {/* Categoria */}
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.2rem'
                          }}
                        >
                          {avatar.categoryLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* TAB: URL PERSONALIZADA */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="custom-avatar-url" style={{ fontWeight: 700 }}>
                  Link direto da imagem (URL externa):
                </label>
                <input
                  id="custom-avatar-url"
                  type="url"
                  className="form-input"
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Aceita imagens PNG, JPG, WebP ou URLs de serviços como Unsplash, GitHub ou Gravatar.
                </span>
              </div>

              {customUrlInput.trim() && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <img
                    src={customUrlInput.trim()}
                    alt="Pré-visualização"
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #2e97b7'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Pré-visualização da URL</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Se a imagem não carregar, verifique se a URL é pública e direta.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RODAPÉ: PRÉVIA EM TEMPO REAL & BOTÃO "INSERIR NO PERFIL" */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: '#fafbfc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Prévia do Avatar selecionado com o Usuário */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {activeTab === 'gallery' && selectedItem ? (
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid #2e97b7',
                  boxShadow: '0 2px 6px rgba(19, 47, 56, 0.15)'
                }}
                dangerouslySetInnerHTML={{ __html: selectedItem.svg }}
              />
            ) : customUrlInput.trim() ? (
              <img
                src={customUrlInput.trim()}
                alt="Avatar"
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #2e97b7'
                }}
              />
            ) : (
              <UserAvatar name={userName} size={46} showBorder borderColor="#2e97b7" />
            )}

            <div>
              <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#132f38' }}>
                {activeTab === 'gallery' && selectedItem ? selectedItem.name : userName}
              </div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                {activeTab === 'gallery' ? 'Avatar selecionado na galeria' : 'URL personalizada'}
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetToInitials}
              title="Remover ilustração e usar iniciais padrão"
              style={{ fontSize: '0.775rem' }}
            >
              <RotateCcw size={13} />
              <span>Usar Iniciais</span>
            </button>

            {onClose && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onClose}
                style={{ fontSize: '0.775rem' }}
              >
                Cancelar
              </button>
            )}

            {/* BOTÃO EXIGIDO: "INSERIR O AVATAR PREEXISTENTE NO PERFIL" */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirm}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 800,
                fontSize: '0.875rem',
                padding: '0.55rem 1.25rem',
                boxShadow: '0 4px 10px rgba(46, 151, 183, 0.35)'
              }}
            >
              <Check size={16} />
              <span>Inserir Avatar no Perfil</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

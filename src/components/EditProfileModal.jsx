import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Building,
  GraduationCap,
  Sparkles,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  BookOpen,
  Image as ImageIcon,
  Smile
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import UserAvatar from './UserAvatar.jsx';
import AvatarGalleryModal from './AvatarGalleryModal.jsx';
import { getAvatarById } from '../data/avatarGallery.js';

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateUserProfile } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [institution, setInstitution] = useState('');
  const [courseDepartment, setCourseDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [password, setPassword] = useState('');

  // Controle da Galeria de Avatares
  const [showGallery, setShowGallery] = useState(false);

  // Estados de feedback
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Carrega os dados do usuário autenticado ao abrir
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || null);
      setInstitution(user.institution || 'Universidade Tecnológica');
      setCourseDepartment(user.course || (user.role === 'professor' ? 'Departamento de Computação' : 'Engenharia de Software'));
      setPhone(user.phone || '');
      setCustomStatus(user.customStatus || 'Focado nos estudos');
      setPassword('');
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  // Recebe o avatar escolhido na galeria pré-existente
  const handleSelectAvatarFromGallery = (chosenAvatarId) => {
    setAvatar(chosenAvatarId);
    setSuccessMsg('Avatar selecionado da galeria! Clique em "Salvar Alterações" para confirmar.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updates = {
        name,
        email,
        bio,
        avatar,
        institution,
        course: courseDepartment,
        phone,
        customStatus
      };

      if (password.trim()) {
        updates.password = password.trim();
      }

      await updateUserProfile(updates);
      setSuccessMsg('Perfil e avatar atualizados com sucesso!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setErrorMsg(err.message || 'Erro ao salvar alterações do perfil.');
    } finally {
      setSaving(false);
    }
  };

  const selectedGalleryAvatar = avatar ? getAvatarById(avatar) : null;

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
        style={{
          zIndex: 1050,
          backgroundColor: 'rgba(19, 47, 56, 0.65)',
          backdropFilter: 'blur(3px)',
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
            maxWidth: '680px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(19, 47, 56, 0.35)'
          }}
        >
          {/* TOPO DO MODAL */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--border-color)',
              background: 'linear-gradient(135deg, rgba(253, 244, 176, 0.3) 0%, rgba(91, 206, 191, 0.2) 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
                <User size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#132f38', margin: 0 }}>
                  Editar Perfil de Usuário
                </h2>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Personalize sua foto/avatar com a galeria e atualize suas informações acadêmicas.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* MENSAGENS DE ALERTA */}
          {successMsg && (
            <div
              style={{
                backgroundColor: '#a4dcb9',
                color: '#134e48',
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                color: '#991b1b',
                padding: '0.65rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* FORMULÁRIO DE EDIÇÃO */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '1.25rem 1.5rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            {/* SEÇÃO PRINCIPAL DE AVATAR (DESTAQUE DA GALERIA) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                  <UserAvatar
                    avatar={avatar}
                    name={name}
                    size={76}
                    showBorder
                    borderColor="#2e97b7"
                  />
                  {selectedGalleryAvatar && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        backgroundColor: '#2e97b7',
                        color: '#ffffff',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                      }}
                      title="Avatar da Galeria Pré-existente"
                    >
                      <Sparkles size={12} />
                    </span>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#132f38' }}>
                    {selectedGalleryAvatar ? selectedGalleryAvatar.name : 'Avatar Atual'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {selectedGalleryAvatar
                      ? `Categoria: ${selectedGalleryAvatar.categoryLabel}`
                      : avatar
                      ? 'Imagem personalizada configurada'
                      : 'Utilizando iniciais com gradiente padrão'}
                  </div>
                </div>
              </div>

              {/* BOTÃO PRINCIPAL DE ACESSO À GALERIA */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowGallery(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '0.55rem 1.15rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Sparkles size={16} />
                <span>Escolher na Galeria de Avatares</span>
              </button>
            </div>

            {/* CAMPOS DE DADOS PESSOAIS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem'
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name" style={{ fontWeight: 700 }}>
                  Nome Completo *
                </label>
                <input
                  id="profile-name"
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-email" style={{ fontWeight: 700 }}>
                  E-mail Institucional *
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem'
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="profile-institution">
                  Instituição de Ensino / Campus
                </label>
                <input
                  id="profile-institution"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Universidade Federal de Tecnologia"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-course">
                  {user.role === 'professor' ? 'Departamento / Área' : 'Curso de Graduação'}
                </label>
                <input
                  id="profile-course"
                  type="text"
                  className="form-input"
                  placeholder={user.role === 'professor' ? 'Ex: Depto. de Ciência da Computação' : 'Ex: Sistemas de Informação'}
                  value={courseDepartment}
                  onChange={(e) => setCourseDepartment(e.target.value)}
                />
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem'
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="profile-status">
                  Status Acadêmico Rápido
                </label>
                <input
                  id="profile-status"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Focado no TCC, Disponível para monitoria..."
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-phone">
                  Telefone / WhatsApp (Opcional)
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  className="form-input"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* BIOGRAFIA */}
            <div className="form-group">
              <label className="form-label" htmlFor="profile-bio">
                Biografia Acadêmica / Sobre Mim
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                className="form-textarea"
                placeholder="Conte um pouco sobre seus interesses acadêmicos, áreas de estudo ou tecnologias favoritas..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{ fontSize: '0.875rem' }}
              />
            </div>

            {/* ALTERAÇÃO DE SENHA OPCIONAL */}
            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: '#fffdf5'
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="profile-password" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Lock size={14} />
                  <span>Alterar Senha de Acesso (Deixe em branco para manter a atual):</span>
                </label>
                <input
                  id="profile-password"
                  type="password"
                  className="form-input"
                  placeholder="Mínimo de 6 caracteres (opcional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* RODAPÉ DE AÇÕES */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-color)'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !name.trim() || !email.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontWeight: 800,
                  padding: '0.55rem 1.25rem'
                }}
              >
                <Save size={16} />
                <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* COMPONENTE DA GALERIA DE AVATARES PRÉ-EXISTENTES */}
      <AvatarGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        currentAvatarId={avatar}
        onSelectAvatar={handleSelectAvatarFromGallery}
        userName={name || user.name}
        userRole={user.role}
      />
    </>
  );
}

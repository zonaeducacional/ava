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
  Save,
  BookOpen,
  Calendar,
  ShieldCheck,
  MessageSquare,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import UserAvatar from '../components/UserAvatar.jsx';
import AvatarGalleryModal from '../components/AvatarGalleryModal.jsx';
import { getAvatarById } from '../data/avatarGallery.js';
import { enrollmentService, courseService, forumService } from '../services/index.js';

export default function Profile() {
  const { user, updateUserProfile, isStudent, isTeacher, isAdmin } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [institution, setInstitution] = useState('');
  const [courseDepartment, setCourseDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [customStatus, setCustomStatus] = useState('');
  const [password, setPassword] = useState('');

  // Galeria de Avatares
  const [showGallery, setShowGallery] = useState(false);

  // Estados de feedback
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Métricas do usuário
  const [userStats, setUserStats] = useState({
    coursesCount: 0,
    completedCount: 0,
    forumTopicsCount: 0
  });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || null);
      setInstitution(user.institution || 'Universidade Tecnológica');
      setCourseDepartment(
        user.course || (user.role === 'professor' ? 'Departamento de Computação' : 'Engenharia de Software')
      );
      setPhone(user.phone || '');
      setCustomStatus(user.customStatus || 'Focado nos estudos');
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      if (!user) return;
      if (isStudent) {
        const enrs = await enrollmentService.getEnrollmentsByUser(user.id);
        const totalCompleted = enrs.reduce((acc, curr) => acc + (curr.completedCount || 0), 0);
        setUserStats({
          coursesCount: enrs.length,
          completedCount: totalCompleted,
          forumTopicsCount: 2
        });
      } else if (isTeacher) {
        const courses = await courseService.getCoursesByTeacher(user.id);
        setUserStats({
          coursesCount: courses.length,
          completedCount: 0,
          forumTopicsCount: 5
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar estatísticas do perfil:', e);
    }
  };

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
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setErrorMsg(err.message || 'Erro ao salvar alterações do perfil.');
    } finally {
      setSaving(false);
    }
  };

  const selectedGalleryAvatar = avatar ? getAvatarById(avatar) : null;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* CABEÇALHO DA PÁGINA */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(253, 244, 176, 0.3) 0%, rgba(91, 206, 191, 0.2) 100%)',
          border: '1px solid rgba(50, 185, 190, 0.25)',
          padding: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <UserAvatar avatar={avatar} name={name} size={84} showBorder borderColor="#2e97b7" />
              {selectedGalleryAvatar && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    backgroundColor: '#2e97b7',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}
                  title="Avatar da Galeria Pré-existente"
                >
                  <Sparkles size={13} />
                </span>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#132f38', margin: 0 }}>
                  {name || user?.name}
                </h1>
                <span
                  style={{
                    backgroundColor: user?.role === 'professor' ? '#2e97b7' : '#a4dcb9',
                    color: user?.role === 'professor' ? '#ffffff' : '#134e48',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}
                >
                  {user?.role === 'professor' ? 'Docente / Professor' : user?.role === 'admin' ? 'Administrador' : 'Aluno Matriculado'}
                </span>
              </div>
              <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {customStatus ? `"${customStatus}"` : 'Perfil Acadêmico no LMS'} • {email}
              </p>
            </div>
          </div>

          {/* BOTÃO PARA ABRIR A GALERIA DE AVATARES */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowGallery(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 800,
              padding: '0.65rem 1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Sparkles size={17} />
            <span>Inserir Avatar da Galeria</span>
          </button>
        </div>

        {/* MÉTRICAS RÁPIDAS DO ALUNO / PROFESSOR */}
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
          <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#132f38' }}>{userStats.coursesCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cursos Ativos</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d' }}>{userStats.completedCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atividades Concluídas</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2e97b7' }}>{selectedGalleryAvatar ? selectedGalleryAvatar.name.split('(')[0] : 'Iniciais'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estilo do Avatar</div>
          </div>
        </div>
      </div>

      {/* FEEDBACKS */}
      {successMsg && (
        <div
          style={{
            backgroundColor: '#a4dcb9',
            color: '#134e48',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FORMULÁRIO DE EDIÇÃO DE PERFIL */}
      <div className="card">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', color: '#132f38' }}>
          Informações do Perfil & Configurações
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="name" style={{ fontWeight: 700 }}>
                Nome Completo *
              </label>
              <input
                id="name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email" style={{ fontWeight: 700 }}>
                E-mail Institucional *
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="institution">
                Instituição / Faculdade / Campus
              </label>
              <input
                id="institution"
                type="text"
                className="form-input"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="course">
                {isTeacher ? 'Departamento / Especialidade' : 'Curso de Graduação'}
              </label>
              <input
                id="course"
                type="text"
                className="form-input"
                value={courseDepartment}
                onChange={(e) => setCourseDepartment(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="customStatus">
                Status / Lema de Estudo
              </label>
              <input
                id="customStatus"
                type="text"
                className="form-input"
                placeholder="Ex: Estudando para a prova de React..."
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Telefone / Contato (Opcional)
              </label>
              <input
                id="phone"
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bio">
              Biografia Acadêmica / Apresentação
            </label>
            <textarea
              id="bio"
              rows={4}
              className="form-textarea"
              placeholder="Fale um pouco sobre seus objetivos acadêmicos, áreas de interesse ou projetos desenvolvidos..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fffdf5',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} />
                <span>Alterar Senha de Acesso (Deixe em branco para não alterar):</span>
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Mínimo de 6 caracteres (opcional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !name.trim() || !email.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 800,
                padding: '0.65rem 1.5rem'
              }}
            >
              <Save size={16} />
              <span>{saving ? 'Salvando...' : 'Salvar Alterações do Perfil'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* COMPONENTE DA GALERIA DE AVATARES PRÉ-EXISTENTES */}
      <AvatarGalleryModal
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        currentAvatarId={avatar}
        onSelectAvatar={handleSelectAvatarFromGallery}
        userName={name || user?.name}
        userRole={user?.role}
      />
    </div>
  );
}

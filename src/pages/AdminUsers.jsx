import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { userService } from '../services/index.js';
import UserAvatar from '../components/UserAvatar.jsx';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Shield,
  GraduationCap,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  X,
  Lock
} from 'lucide-react';

export default function AdminUsers() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'aluno' | 'professor' | 'admin'

  // Modal de Criação de Usuário
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '123456',
    role: 'aluno',
    institution: '',
    course: '',
    bio: ''
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Modal de Edição de Usuário
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'aluno',
    institution: '',
    course: '',
    bio: '',
    customStatus: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('Erro ao carregar usuários: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;

    if (targetUser.id === currentUser.id && newRole !== 'admin') {
      if (
        !window.confirm(
          'Atenção: Você está alterando o SEU próprio perfil de administrador! Se confirmar, perderá o acesso a esta página de administração. Deseja prosseguir?'
        )
      ) {
        return;
      }
    }

    setUpdatingId(targetUser.id);
    setSuccessMsg('');
    setError('');
    try {
      await userService.updateUserRole(targetUser.id, newRole);
      setSuccessMsg(`Perfil de ${targetUser.name} alterado com sucesso para "${newRole}"!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadUsers();
      if (targetUser.id === currentUser.id) {
        await refreshUser();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Abrir Modal de Edição
  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'aluno',
      institution: u.institution || '',
      course: u.course || '',
      bio: u.bio || '',
      customStatus: u.customStatus || ''
    });
  };

  // Salvar Edição do Usuário
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) {
      alert('Nome e e-mail são obrigatórios.');
      return;
    }

    if (editingUser.id === currentUser.id && editForm.role !== 'admin') {
      if (!window.confirm('Atenção: Se alterar seu próprio cargo para diferente de administrador, você perderá acesso ao painel de administração. Deseja continuar?')) {
        return;
      }
    }

    setEditLoading(true);
    setError('');
    try {
      const updates = {
        name: editForm.name.trim(),
        email: editForm.email.trim().toLowerCase(),
        role: editForm.role,
        institution: editForm.institution.trim(),
        course: editForm.course.trim(),
        bio: editForm.bio.trim(),
        customStatus: editForm.customStatus.trim()
      };
      if (editForm.password.trim()) {
        updates.password = editForm.password.trim();
      }

      await userService.updateUser(editingUser.id, updates);
      setSuccessMsg(`Usuário "${editForm.name}" atualizado com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setEditingUser(null);
      await loadUsers();
      if (editingUser.id === currentUser.id) {
        await refreshUser();
      }
    } catch (err) {
      alert('Erro ao atualizar usuário: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Excluir Usuário
  const handleDeleteUser = async (u) => {
    if (u.id === currentUser.id) {
      alert('Você não pode excluir a sua própria conta ativa de administrador!');
      return;
    }

    if (
      !window.confirm(
        `ATENÇÃO: Deseja realmente excluir o usuário "${u.name}" (${u.email})?\n\nEsta ação removerá seus dados, matrículas e acessos associados.`
      )
    ) {
      return;
    }

    try {
      await userService.deleteUser(u.id);
      setSuccessMsg(`Usuário "${u.name}" excluído com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadUsers();
    } catch (err) {
      alert('Erro ao excluir usuário: ' + err.message);
    }
  };

  // Criar Usuário
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      alert('Nome, e-mail e senha são obrigatórios.');
      return;
    }

    setCreateLoading(true);
    setError('');
    try {
      await userService.createUser({
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password.trim(),
        role: createForm.role,
        institution: createForm.institution.trim(),
        course: createForm.course.trim(),
        bio: createForm.bio.trim()
      });

      setSuccessMsg(`Novo usuário "${createForm.name}" criado com sucesso!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '123456',
        role: 'aluno',
        institution: '',
        course: '',
        bio: ''
      });
      await loadUsers();
    } catch (err) {
      alert('Erro ao criar usuário: ' + err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Estatísticas
  const stats = useMemo(() => {
    const total = users.length;
    const students = users.filter((u) => u.role === 'aluno').length;
    const teachers = users.filter((u) => u.role === 'professor').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    return { total, students, teachers, admins };
  }, [users]);

  // Lista filtrada
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.name?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesCourse = u.course?.toLowerCase().includes(q);
        const matchesInst = u.institution?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesCourse && !matchesInst) {
          return false;
        }
      }
      return true;
    });
  }, [users, roleFilter, searchQuery]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Carregando gerenciamento de usuários...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={28} color="var(--primary)" />
            Gerenciamento de Usuários (Administrador)
          </h1>
          <p className="page-subtitle">
            Edição, exclusão e controle total de perfis e credenciais de todos os membros do LMS.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
        >
          <UserPlus size={18} />
          <span>Novo Usuário</span>
        </button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* CARDS DE RESUMO DE USUÁRIOS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #2e97b7' }}>
          <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total de Usuários
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#132f38', marginTop: '0.25rem' }}>
            {stats.total}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #32b9be' }}>
          <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Alunos Cadastrados
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2e97b7', marginTop: '0.25rem' }}>
            {stats.students}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #5bcebf' }}>
          <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Professores / Docentes
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2ea88b', marginTop: '0.25rem' }}>
            {stats.teachers}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #f2994a' }}>
          <div style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Administradores
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e67e22', marginTop: '0.25rem' }}>
            {stats.admins}
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div
        className="card"
        style={{
          marginBottom: '1.25rem',
          padding: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            placeholder="Buscar por nome, e-mail, curso ou instituição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'aluno', label: 'Alunos' },
            { id: 'professor', label: 'Professores' },
            { id: 'admin', label: 'Admins' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn-sm ${roleFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRoleFilter(tab.id)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE USUÁRIOS COM EDIÇÃO E EXCLUSÃO */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Curso / Depto</th>
                <th>Perfil</th>
                <th>Data Cadastro</th>
                <th style={{ textAlign: 'center' }}>Ações de Administrador</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    Nenhum usuário corresponde aos filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isMe = u.id === currentUser?.id;

                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <UserAvatar avatar={u.avatar} name={u.name} size={36} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#132f38', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>{u.name}</span>
                              {isMe && (
                                <span
                                  style={{
                                    fontSize: '0.675rem',
                                    backgroundColor: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    fontWeight: 700,
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px'
                                  }}
                                >
                                  Você
                                </span>
                              )}
                            </div>
                            {u.customStatus && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                "{u.customStatus}"
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {u.email}
                      </td>

                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {u.course || u.institution || '-'}
                      </td>

                      <td>
                        <select
                          className="form-select"
                          style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            width: '135px',
                            backgroundColor:
                              u.role === 'admin'
                                ? '#fef3c7'
                                : u.role === 'professor'
                                ? '#e0f2fe'
                                : '#f0fdf4'
                          }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          disabled={updatingId === u.id}
                        >
                          <option value="aluno">Aluno</option>
                          <option value="professor">Professor</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>

                      <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : 'Demonstração'}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => handleOpenEdit(u)}
                            title="Editar Dados do Usuário (Admin)"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.775rem'
                            }}
                          >
                            <Edit2 size={13} />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isMe}
                            title={isMe ? 'Você não pode excluir sua própria conta' : 'Excluir Usuário (Admin)'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.775rem',
                              color: isMe ? 'var(--text-muted)' : '#dc2626',
                              borderColor: isMe ? 'var(--border-color)' : '#fca5a5',
                              cursor: isMe ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO DE NOVO USUÁRIO */}
      {showCreateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="var(--primary)" />
                Cadastrar Novo Usuário (Admin)
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
            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-name">Nome Completo *</label>
                  <input
                    id="new-user-name"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Ana Clara Ribeiro"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-email">E-mail de Acesso *</label>
                  <input
                    id="new-user-email"
                    type="email"
                    className="form-input"
                    placeholder="Ex: ana@escola.com"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-user-password">Senha de Acesso *</label>
                    <input
                      id="new-user-password"
                      type="text"
                      className="form-input"
                      placeholder="Ex: 123456"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-user-role">Perfil / Cargo *</label>
                    <select
                      id="new-user-role"
                      className="form-select"
                      value={createForm.role}
                      onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                    >
                      <option value="aluno">Aluno (Estudante)</option>
                      <option value="professor">Professor (Docente)</option>
                      <option value="admin">Administrador Geral</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="new-user-inst">Instituição / Escola</label>
                    <input
                      id="new-user-inst"
                      type="text"
                      className="form-input"
                      placeholder="Ex: Universidade Tecnológica"
                      value={createForm.institution}
                      onChange={(e) => setCreateForm({ ...createForm, institution: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="new-user-course">Curso / Departamento</label>
                    <input
                      id="new-user-course"
                      type="text"
                      className="form-input"
                      placeholder="Ex: Engenharia de Software"
                      value={createForm.course}
                      onChange={(e) => setCreateForm({ ...createForm, course: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-user-bio">Biografia / Observações</label>
                  <textarea
                    id="new-user-bio"
                    className="form-textarea"
                    rows={2}
                    placeholder="Breve descrição acadêmica do usuário..."
                    value={createForm.bio}
                    onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Cadastrando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE USUÁRIO */}
      {editingUser && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} color="var(--primary)" />
                Editar Usuário: {editingUser.name}
              </h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setEditingUser(null)}
                style={{ padding: '0.2rem 0.6rem' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-name">Nome Completo *</label>
                  <input
                    id="edit-user-name"
                    type="text"
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-email">E-mail de Acesso *</label>
                  <input
                    id="edit-user-email"
                    type="email"
                    className="form-input"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-user-password">
                      Nova Senha <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(deixe vazio para manter)</span>
                    </label>
                    <input
                      id="edit-user-password"
                      type="text"
                      className="form-input"
                      placeholder="Deixe em branco para não alterar"
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-user-role">Perfil / Cargo *</label>
                    <select
                      id="edit-user-role"
                      className="form-select"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      <option value="aluno">Aluno (Estudante)</option>
                      <option value="professor">Professor (Docente)</option>
                      <option value="admin">Administrador Geral</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-user-inst">Instituição / Escola</label>
                    <input
                      id="edit-user-inst"
                      type="text"
                      className="form-input"
                      value={editForm.institution}
                      onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-user-course">Curso / Departamento</label>
                    <input
                      id="edit-user-course"
                      type="text"
                      className="form-input"
                      value={editForm.course}
                      onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-status">Status Customizado</label>
                  <input
                    id="edit-user-status"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Focado em React e TypeScript"
                    value={editForm.customStatus}
                    onChange={(e) => setEditForm({ ...editForm, customStatus: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-user-bio">Biografia</label>
                  <textarea
                    id="edit-user-bio"
                    className="form-textarea"
                    rows={2}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingUser(null)}
                  disabled={editLoading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

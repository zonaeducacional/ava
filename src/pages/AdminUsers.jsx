import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { userService } from '../services/index.js';

export default function AdminUsers() {
  const { user: currentUser, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Gerenciamento de Usuários</h1>
          <p className="page-subtitle">
            Administre os perfis de acesso e permissões de todos os membros do LMS.
          </p>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome Completo</th>
                <th>E-mail</th>
                <th>Data de Cadastro</th>
                <th>Perfil Atual</th>
                <th>Alterar Perfil</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isMe = u.id === currentUser?.id;

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{u.name}</span>
                        {isMe && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              backgroundColor: 'var(--bg-subtle)',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              color: 'var(--text-muted)'
                            }}
                          >
                            Você
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('pt-BR')
                        : 'Demonstração'}
                    </td>
                    <td>
                      <span
                        className={`user-role-tag ${
                          u.role === 'aluno'
                            ? 'role-student'
                            : u.role === 'professor'
                            ? 'role-teacher'
                            : 'role-admin'
                        }`}
                      >
                        {u.role === 'aluno'
                          ? 'Aluno'
                          : u.role === 'professor'
                          ? 'Professor'
                          : 'Administrador'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', width: '160px' }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        disabled={updatingId === u.id}
                      >
                        <option value="aluno">Aluno</option>
                        <option value="professor">Professor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

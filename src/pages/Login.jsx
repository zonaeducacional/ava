import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LmsLogo from '../components/LmsLogo.jsx';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('aluno');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          throw new Error('Informe o seu nome completo.');
        }
        if (password.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres.');
        }
        await register({ name, email, password, role });
      } else {
        await login(email, password);
      }
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '3rem auto', padding: '0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
          <LmsLogo size={64} />
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>LMS</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
          Ambiente Virtual de Aprendizagem
        </p>
      </div>

      <div className="card">
        {/* Alternador Login / Cadastro */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '1.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              backgroundColor: !isRegister ? 'var(--bg-surface)' : 'transparent',
              color: !isRegister ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600,
              backgroundColor: isRegister ? 'var(--bg-surface)' : 'transparent',
              color: isRegister ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: isRegister ? 'var(--shadow-sm)' : 'none',
              transition: 'var(--transition)'
            }}
          >
            Cadastrar
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Ex: Maria Pereira"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="exemplo@escola.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Senha {isRegister && <span className="form-helper">(mínimo 6 dígitos)</span>}
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="role">
                Perfil de Acesso
              </label>
              <select
                id="role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="aluno">Aluno (acessa cursos, tarefas e notas)</option>
                <option value="professor">Professor (cria cursos, conteúdos e corrige)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Processando...' : isRegister ? 'Criar Minha Conta' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Carregando LMS...</p>
      </div>
    );
  }

  if (!user) {
    // Redireciona para o login salvando a rota pretendida
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verifica permissão do perfil se foi especificada
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ marginBottom: '0.75rem' }}>Acesso Restrito</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Seu perfil atual (<strong>{user.role}</strong>) não tem permissão para acessar esta área.
          </p>
          <a href="/" className="btn btn-primary">
            Voltar para o Painel Inicial
          </a>
        </div>
      </div>
    );
  }

  return children;
}

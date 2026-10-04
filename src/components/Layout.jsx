import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LmsLogo from './LmsLogo.jsx';
import WebPushNotificationModal from './WebPushNotificationModal.jsx';
import { webPushService } from '../services/webPushService.js';
import { courseService, enrollmentService } from '../services/index.js';

export default function Layout() {
  const { user, logout, isStudent, isTeacher, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Estado de pesquisa
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [userCourses, setUserCourses] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Estado das Notificações Web Push
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushStatus, setPushStatus] = useState('default');

  useEffect(() => {
    setPushStatus(webPushService.getPermission());
  }, []);

  // Sincroniza query com URL se estiver na rota /courses
  useEffect(() => {
    if (location.pathname === '/courses') {
      const q = searchParams.get('q') || '';
      setSearchQuery(q);
    }
  }, [location.pathname, searchParams]);

  // Carrega os cursos relevantes para o usuário atual
  useEffect(() => {
    let isMounted = true;
    const loadCoursesForSearch = async () => {
      if (!user) return;
      try {
        let courses = [];
        if (isStudent) {
          const enrs = await enrollmentService.getEnrollmentsByUser(user.id);
          courses = enrs.map((e) => e.course).filter(Boolean);
          // Se o aluno ainda não tem matrículas, busca o catálogo para não ficar vazio
          if (courses.length === 0) {
            courses = await courseService.getAllCourses();
          }
        } else if (isTeacher) {
          courses = await courseService.getCoursesByTeacher(user.id);
        } else {
          courses = await courseService.getAllCourses();
        }

        if (isMounted) {
          setUserCourses(courses);
        }
      } catch (err) {
        console.error('Erro ao carregar cursos para a busca:', err);
      }
    };

    loadCoursesForSearch();
    return () => {
      isMounted = false;
    };
  }, [user, location.pathname]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Cursos filtrados pelo título digitado
  const filteredCourses = searchQuery.trim()
    ? userCourses.filter((course) =>
        course.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    if (searchQuery.trim()) {
      navigate(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/courses');
    }
  };

  const handleSelectCourse = (courseId) => {
    setIsDropdownOpen(false);
    navigate(`/courses/${courseId}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsDropdownOpen(false);
    if (location.pathname === '/courses') {
      navigate('/courses');
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'aluno':
        return 'Aluno';
      case 'professor':
        return 'Professor';
      case 'admin':
        return 'Administrador';
      default:
        return role;
    }
  };

  const getRoleClass = (role) => {
    switch (role) {
      case 'aluno':
        return 'role-student';
      case 'professor':
        return 'role-teacher';
      case 'admin':
        return 'role-admin';
      default:
        return '';
    }
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="navbar-brand" title="LMS - Ambiente Virtual de Aprendizagem">
            <LmsLogo size={40} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>LMS</span>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Ambiente Virtual de Aprendizagem
              </span>
            </div>
          </NavLink>

          <nav className="navbar-links" aria-label="Navegação Principal">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Painel
            </NavLink>
            <NavLink to="/courses" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Cursos
            </NavLink>
            <NavLink to="/grades" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Notas
            </NavLink>
            <NavLink to="/meet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Meet
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Usuários
              </NavLink>
            )}
          </nav>

          {/* BARRA DE PESQUISA POR TÍTULO */}
          <div className="navbar-search" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
              <span className="search-icon-prefix" aria-hidden="true">
                🔍
              </span>
              <input
                type="text"
                className="navbar-search-input"
                placeholder="Filtrar cursos por título..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                  if (location.pathname === '/courses') {
                    navigate(`/courses?q=${encodeURIComponent(e.target.value)}`, { replace: true });
                  }
                }}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setIsDropdownOpen(true);
                  }
                }}
                aria-label="Filtrar cursos por título"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleClearSearch}
                  title="Limpar pesquisa"
                  aria-label="Limpar pesquisa"
                >
                  ✕
                </button>
              )}
            </form>

            {/* Menu suspenso de resultados instantâneos */}
            {isDropdownOpen && searchQuery.trim() && (
              <div className="search-results-dropdown" role="listbox">
                <div className="search-results-header">
                  {filteredCourses.length > 0
                    ? `${filteredCourses.length} curso(s) encontrado(s)`
                    : 'Nenhum resultado'}
                </div>

                {filteredCourses.length > 0 ? (
                  filteredCourses.map((c) => (
                    <div
                      key={c.id}
                      className="search-result-item"
                      onClick={() => handleSelectCourse(c.id)}
                      role="option"
                    >
                      <div>
                        <div className="search-result-title">{c.title}</div>
                        <div className="search-result-subtitle">
                          Código: {c.code} {c.teacherName ? `• Prof. ${c.teacherName}` : ''}
                        </div>
                      </div>
                      <span className="course-code-tag">{c.code}</span>
                    </div>
                  ))
                ) : (
                  <div className="search-results-empty">
                    Nenhum curso encontrado com o título "<strong>{searchQuery}</strong>".
                  </div>
                )}

                <div
                  className="search-results-footer"
                  onClick={handleSearchSubmit}
                >
                  Ver todos os resultados no catálogo de cursos →
                </div>
              </div>
            )}
          </div>

          <div className="navbar-user">
            {/* Botão de Notificações Web Push (Service Worker) */}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPushModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.85rem'
              }}
              title="Alertas & Notificações no Navegador (Web Push)"
            >
              <span>🔔</span>
              <span style={{ fontSize: '0.8rem' }}>Alertas</span>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: pushStatus === 'granted' ? '#22c55e' : '#eab308',
                  display: 'inline-block'
                }}
                title={pushStatus === 'granted' ? 'Notificações Ativas' : 'Clique para ativar notificações'}
              />
            </button>

            {user && (
              <div className="user-badge" title={`Logado como: ${user.name} (${user.email})`}>
                <span style={{ fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
                <span className={`user-role-tag ${getRoleClass(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.85rem' }}
              title="Sair da conta"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Modal de Configuração & Teste de Web Push */}
      <WebPushNotificationModal
        isOpen={showPushModal}
        onClose={() => {
          setShowPushModal(false);
          setPushStatus(webPushService.getPermission());
        }}
      />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFocusMode } from '../context/FocusModeContext.jsx';
import { Search, Bell, LogOut, X, User } from 'lucide-react';
import LmsLogo from './LmsLogo.jsx';
import WebPushNotificationModal from './WebPushNotificationModal.jsx';
import EditProfileModal from './EditProfileModal.jsx';
import UserAvatar from './UserAvatar.jsx';
import FocusReadingView from './FocusReadingView.jsx';
import { webPushService } from '../services/webPushService.js';
import { courseService, enrollmentService, assignmentService } from '../services/index.js';

export default function Layout() {
  const { user, logout, isStudent, isTeacher, isAdmin } = useAuth();
  const { isFocusMode, focusData, exitFocusMode } = useFocusMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Estado de contagem de pendências urgentes do professor
  const [teacherUrgentCount, setTeacherUrgentCount] = useState(0);

  // Estado de pesquisa
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [userCourses, setUserCourses] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Estado das Notificações Web Push
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushStatus, setPushStatus] = useState('default');

  // Modal de Edição de Perfil e Avatar
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

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

  // Carrega contagem de pendências urgentes para professores e admins
  useEffect(() => {
    let isMounted = true;
    const fetchUrgentCount = async () => {
      if (!user || (!isTeacher && !isAdmin)) return;
      try {
        const overview = await assignmentService.getTeacherSubmissionsOverview(user.id, isAdmin);
        if (isMounted) {
          setTeacherUrgentCount(overview.totalUrgentCount || 0);
        }
      } catch (err) {
        // silencioso
      }
    };

    fetchUrgentCount();
    return () => {
      isMounted = false;
    };
  }, [user, location.pathname, isTeacher, isAdmin]);

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

  // Se estiver no Modo de Leitura (Foco), remove o menu superior e a barra lateral
  if (isFocusMode && focusData) {
    return (
      <div className="focus-mode-wrapper" style={{ width: '100%', minHeight: '100vh' }}>
        <FocusReadingView
          data={focusData}
          onExit={exitFocusMode}
          onToggleComplete={focusData.onToggleComplete}
          onCycleStatus={focusData.onCycleStatus}
          onNavigatePrev={focusData.onNavigatePrev}
          onNavigateNext={focusData.onNavigateNext}
        />
      </div>
    );
  }

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
            <NavLink to="/calendar" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Calendário
            </NavLink>
            <NavLink to="/grades" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Notas
            </NavLink>
            <NavLink to="/meet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Meet
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Perfil
            </NavLink>
            {(isTeacher || isAdmin) && (
              <NavLink
                to="/teacher/assignments"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>Entregas das Turmas</span>
                {teacherUrgentCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      fontSize: '0.675rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '999px',
                      lineHeight: 1
                    }}
                    title={`${teacherUrgentCount} pendência(s) urgente(s)`}
                  >
                    {teacherUrgentCount}
                  </span>
                )}
              </NavLink>
            )}
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
                <Search size={15} />
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
                  <X size={13} />
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
                gap: '0.4rem',
                fontSize: '0.825rem'
              }}
              title="Alertas & Notificações no Navegador (Web Push)"
            >
              <Bell size={15} color="var(--primary)" />
              <span>Alertas</span>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: pushStatus === 'granted' ? '#259e82' : '#eab308',
                  display: 'inline-block'
                }}
                title={pushStatus === 'granted' ? 'Notificações Ativas' : 'Clique para ativar notificações'}
              />
            </button>

            {user && (
              <div
                className="user-badge"
                onClick={() => setShowEditProfileModal(true)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                title={`Meu Perfil: ${user.name} (${user.email}) - Clique para editar perfil e avatar`}
              >
                <UserAvatar user={user} size={24} showBorder borderColor="#2e97b7" />
                <span style={{ fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
                <span className={`user-role-tag ${getRoleClass(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowEditProfileModal(true)}
              style={{ fontSize: '0.825rem', gap: '0.35rem' }}
              title="Editar perfil e escolher avatar da galeria"
            >
              <User size={14} color="var(--primary)" />
              <span>Perfil</span>
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.825rem', gap: '0.35rem' }}
              title="Sair da conta"
            >
              <LogOut size={14} />
              <span>Sair</span>
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

      {/* Modal de Edição de Perfil & Galeria de Avatares */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

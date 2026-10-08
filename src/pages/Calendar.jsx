import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  Download,
  Search,
  FileText,
  CheckCircle2,
  Award,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ExternalLink,
  Target
} from 'lucide-react';
import ActivityStatusBadge from '../components/ActivityStatusBadge.jsx';
import { calendarService, courseService, enrollmentService } from '../services/index.js';
import { downloadIcsFile, createGoogleCalendarUrl } from '../utils/calendarExport.js';

export default function Calendar() {
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allEvents, setAllEvents] = useState([]);
  const [coursesList, setCoursesList] = useState([]);

  // Navegação da data (Inicia no mês atual: Outubro 2026)
  const [currentDate, setCurrentDate] = useState(() => {
    // Referência padrão: data atual do sistema (2026-10-08)
    return new Date(2026, 9, 1);
  });

  // Modo de exibição: 'month' | 'agenda'
  const [viewMode, setViewMode] = useState('month');

  // Filtros
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // 'all' | 'assignment' | 'quiz'
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'pending' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  // Modais de detalhes
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null); // { date: Date, events: [] }

  useEffect(() => {
    loadCalendarData();
  }, [user]);

  const loadCalendarData = async () => {
    setLoading(true);
    setError('');
    try {
      if (!user) return;

      let events = [];
      let courses = [];

      if (isStudent) {
        events = await calendarService.getStudentCalendarEvents(user.id);
        const myEnrs = await enrollmentService.getEnrollmentsByUser(user.id);
        courses = myEnrs.map((e) => e.course).filter(Boolean);
      } else if (isTeacher) {
        events = await calendarService.getTeacherCalendarEvents(user.id);
        courses = await courseService.getCoursesByTeacher(user.id);
      } else {
        events = await calendarService.getAllCalendarEvents();
        courses = await courseService.getAllCourses();
      }

      setAllEvents(events);
      setCoursesList(courses);
    } catch (err) {
      console.error('Erro ao carregar calendário:', err);
      setError('Não foi possível carregar os prazos do calendário: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eventos filtrados
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      // Filtro de curso
      if (selectedCourse !== 'all' && ev.courseId !== selectedCourse) {
        return false;
      }
      // Filtro de tipo (Tarefa vs Prova/Quiz)
      if (selectedType !== 'all') {
        if (selectedType === 'assignment' && ev.type !== 'assignment') return false;
        if (selectedType === 'quiz' && ev.type !== 'quiz') return false;
      }
      // Filtro de status
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'pending' && ev.status === 'completed') return false;
        if (selectedStatus === 'completed' && ev.status !== 'completed') return false;
      }
      // Busca por título / código do curso
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesCode = ev.courseCode.toLowerCase().includes(q);
        const matchesCourse = ev.courseTitle.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesCourse) return false;
      }
      return true;
    });
  }, [allEvents, selectedCourse, selectedType, selectedStatus, searchQuery]);

  // Estatísticas calculadas dos eventos filtrados
  const stats = useMemo(() => {
    const total = filteredEvents.length;
    const assignments = filteredEvents.filter((e) => e.type === 'assignment');
    const quizzes = filteredEvents.filter((e) => e.type === 'quiz');
    const completed = filteredEvents.filter((e) => e.status === 'completed');
    const pending = total - completed.length;

    return {
      total,
      assignmentsCount: assignments.length,
      quizzesCount: quizzes.length,
      completedCount: completed.length,
      pendingCount: pending,
      percentCompleted: total > 0 ? Math.round((completed.length / total) * 100) : 0
    };
  }, [filteredEvents]);

  // Navegação de mês
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date(2026, 9, 1));
  };

  // Nomes dos meses em português
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonthIdx = currentDate.getMonth();

  // Dias do calendário para o mês selecionado
  const calendarDays = useMemo(() => {
    const year = currentYear;
    const month = currentMonthIdx;

    // Primeiro dia do mês (0 = Domingo, 1 = Segunda, etc.)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Último dia do mês atual
    const lastDate = new Date(year, month + 1, 0).getDate();
    // Último dia do mês anterior
    const prevLastDate = new Date(year, month, 0).getDate();

    const days = [];

    // Dias do mês anterior
    for (let x = firstDayIndex; x > 0; x--) {
      const d = prevLastDate - x + 1;
      const dateObj = new Date(year, month - 1, d);
      days.push({
        dateNumber: d,
        dateObj,
        isCurrentMonth: false,
        isToday: false,
        key: `prev-${d}`
      });
    }

    // Dias do mês atual
    const today = new Date();
    for (let i = 1; i <= lastDate; i++) {
      const dateObj = new Date(year, month, i);
      const isToday =
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === i;

      days.push({
        dateNumber: i,
        dateObj,
        isCurrentMonth: true,
        isToday,
        key: `curr-${i}`
      });
    }

    // Dias do próximo mês para completar grade de 35 ou 42 células
    const remaining = (7 - (days.length % 7)) % 7;
    for (let j = 1; j <= remaining; j++) {
      const dateObj = new Date(year, month + 1, j);
      days.push({
        dateNumber: j,
        dateObj,
        isCurrentMonth: false,
        isToday: false,
        key: `next-${j}`
      });
    }

    return days;
  }, [currentYear, currentMonthIdx]);

  // Agrupa eventos por data string (YYYY-MM-DD)
  const eventsByDateMap = useMemo(() => {
    const map = {};
    filteredEvents.forEach((ev) => {
      if (!ev.dueDate) return;
      const d = new Date(ev.dueDate);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Formatação de data em português
  const formatDateFull = (isoString) => {
    if (!isoString) return 'Sem prazo';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysDiffLabel = (isoString) => {
    if (!isoString) return '';
    const now = new Date(2026, 9, 8); // Data de referência da sessão (08/10/2026)
    const due = new Date(isoString);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Expirou há ${Math.abs(diffDays)} dia(s)`;
    } else if (diffDays === 0) {
      return 'Vence Hoje!';
    } else if (diffDays === 1) {
      return 'Vence Amanhã';
    } else {
      return `Faltam ${diffDays} dias`;
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Carregando prazos e eventos acadêmicos dos seus cursos...</p>
      </div>
    );
  }

  return (
    <div className="calendar-page-container">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CalendarDays size={26} color="var(--primary)" />
            <span>Calendário de Prazos & Provas</span>
          </h1>
          <p className="page-subtitle">
            {isStudent
              ? 'Central de todos os prazos de entrega de tarefas e datas de provas dos cursos matriculados.'
              : isTeacher
              ? 'Visão cronológica de prazos de tarefas e avaliações agendadas para seus cursos.'
              : 'Visão executiva do cronograma de atividades e provas de todos os cursos da instituição.'}
          </p>
        </div>

        {/* AÇÕES NO TOPO: EXPORTAR E ALTERNAR VISUALIZAÇÃO */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => downloadIcsFile(filteredEvents, `lms-calendario-${user?.name?.toLowerCase().replace(/\s+/g, '-') || 'aluno'}.ics`)}
            title="Baixar arquivo .ics para sincronizar no Google Calendar, Outlook ou celular"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Download size={14} />
            <span>Exportar (.ics)</span>
          </button>

          {/* Toggle Mês / Lista */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'month' ? 'btn-primary' : ''}`}
              style={{
                border: 'none',
                boxShadow: viewMode === 'month' ? 'var(--shadow-sm)' : 'none',
                padding: '0.35rem 0.85rem',
                fontSize: '0.825rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={() => setViewMode('month')}
            >
              <CalendarDays size={14} />
              <span>Mês</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'agenda' ? 'btn-primary' : ''}`}
              style={{
                border: 'none',
                boxShadow: viewMode === 'agenda' ? 'var(--shadow-sm)' : 'none',
                padding: '0.35rem 0.85rem',
                fontSize: '0.825rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onClick={() => setViewMode('agenda')}
            >
              <FileText size={14} />
              <span>Lista de Prazos</span>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* CARDS DE RESUMO DE MÉTRICAS NO TOPO (PALETA .color1 a .color5) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}
      >
        {/* Card 1: Total */}
        <div
          className="card"
          style={{
            borderLeft: '4px solid var(--color-5)', // #2e97b7
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.15rem 1.25rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(46, 151, 183, 0.12)',
              color: '#2e97b7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CalendarIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Total de Atividades
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Nos cursos matriculados
            </div>
          </div>
        </div>

        {/* Card 2: Tarefas */}
        <div
          className="card"
          style={{
            borderLeft: '4px solid #32b9be', // .color4
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.15rem 1.25rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(50, 185, 190, 0.12)',
              color: '#32b9be',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Tarefas Agendadas
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#32b9be', lineHeight: 1.1 }}>
              {stats.assignmentsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Entregas com prazo
            </div>
          </div>
        </div>

        {/* Card 3: Provas & Quizzes */}
        <div
          className="card"
          style={{
            borderLeft: '4px solid #5bcebf', // .color3
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.15rem 1.25rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(91, 206, 191, 0.18)',
              color: '#1a756a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Target size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Provas & Quizzes
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#132f38', lineHeight: 1.1 }}>
              {stats.quizzesCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Avaliações oficiais
            </div>
          </div>
        </div>

        {/* Card 4: Concluídas / Pendentes */}
        <div
          className="card"
          style={{
            borderLeft: '4px solid #a4dcb9', // .color2
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.15rem 1.25rem'
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(164, 220, 185, 0.3)',
              color: '#2ea88b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Entregues / Feitas
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2ea88b', lineHeight: 1.1 }}>
              {stats.completedCount} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {stats.total}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {stats.pendingCount} pendente(s) ({stats.percentCompleted}%)
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS E PESQUISA */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          {/* Filtro por Curso */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label htmlFor="filter-course" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Curso:
            </label>
            <select
              id="filter-course"
              className="form-select"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem', minWidth: '160px' }}
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="all">Todos os Cursos ({coursesList.length})</option>
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title.substring(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label htmlFor="filter-type" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Tipo:
            </label>
            <select
              id="filter-type"
              className="form-select"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem' }}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">Todas as Atividades</option>
              <option value="assignment">📝 Apenas Tarefas</option>
              <option value="quiz">🎯 Apenas Provas & Quizzes</option>
            </select>
          </div>

          {/* Filtro por Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label htmlFor="filter-status" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Status:
            </label>
            <select
              id="filter-status"
              className="form-select"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.825rem' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="pending">⏳ Apenas Pendentes</option>
              <option value="completed">✓ Apenas Concluídos / Entregues</option>
            </select>
          </div>
        </div>

        {/* Campo de Busca Rápida */}
        <div style={{ minWidth: '220px' }}>
          <input
            type="text"
            className="form-input"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.825rem' }}
            placeholder="🔍 Buscar por nome da atividade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* VISÃO 1: MÊS (GRADE INTERATIVA) */}
      {viewMode === 'month' && (
        <div className="calendar-card">
          {/* BARRA DE CONTROLE DO MÊS */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handlePrevMonth}
                title="Mês anterior"
                style={{ padding: '0.3rem 0.65rem', fontWeight: 700 }}
              >
                ◀ Anterior
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleNextMonth}
                title="Próximo mês"
                style={{ padding: '0.3rem 0.65rem', fontWeight: 700 }}
              >
                Próximo ▶
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleJumpToToday}
                title="Ir para o mês atual"
                style={{ fontSize: '0.775rem' }}
              >
                Mês Atual (Outubro)
              </button>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {monthNames[currentMonthIdx]} de {currentYear}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: '#2e97b7' }} />
                Tarefas (.color5)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: '#5bcebf' }} />
                Provas (.color3)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '2px', backgroundColor: '#a4dcb9' }} />
                Entregues (.color2)
              </span>
            </div>
          </div>

          {/* CABEÇALHO DOS DIAS DA SEMANA */}
          <div className="calendar-grid-header">
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dayName, idx) => (
              <div key={dayName} className="calendar-day-header-cell">
                <span className="hidden-mobile">{dayName}</span>
                <span className="visible-mobile">{dayName.substring(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* CORPO DA GRADE DE DIAS */}
          <div className="calendar-grid-body">
            {calendarDays.map((cell) => {
              const dateKey = `${cell.dateObj.getFullYear()}-${String(cell.dateObj.getMonth() + 1).padStart(2, '0')}-${String(cell.dateObj.getDate()).padStart(2, '0')}`;
              const dayEvents = eventsByDateMap[dateKey] || [];
              const visibleEvents = dayEvents.slice(0, 3);
              const extraCount = dayEvents.length - visibleEvents.length;

              return (
                <div
                  key={cell.key}
                  className={`calendar-day-cell ${cell.isCurrentMonth ? '' : 'other-month'} ${cell.isToday ? 'is-today' : ''}`}
                >
                  {/* Número do Dia */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem'
                    }}
                  >
                    <span className="day-number-badge" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                      {cell.dateNumber}
                    </span>
                    {cell.isToday && (
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 800,
                          color: '#2e97b7',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Hoje
                      </span>
                    )}
                  </div>

                  {/* Lista de Atividades do Dia */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    {visibleEvents.map((ev) => {
                      const isCompleted = ev.status === 'completed';
                      return (
                        <div
                          key={ev.id}
                          className={`calendar-event-pill ${isCompleted ? 'event-completed' : ev.type === 'assignment' ? 'event-assignment' : 'event-quiz'}`}
                          onClick={() => setSelectedEvent(ev)}
                          title={`${ev.courseCode} • ${ev.typeLabel}: ${ev.title} (${ev.statusLabel})`}
                        >
                          <span>{ev.typeIcon}</span>
                          <strong style={{ fontSize: '0.65rem' }}>{ev.courseCode}</strong>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ev.title}
                          </span>
                          {isCompleted && <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>✓</span>}
                        </div>
                      );
                    })}

                    {extraCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedDayEvents({ date: cell.dateObj, events: dayEvents })}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '2px 4px',
                          textAlign: 'left',
                          fontSize: '0.675rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          marginTop: '2px'
                        }}
                      >
                        +{extraCount} mais prazo(s)...
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISÃO 2: AGENDA / LISTA CRONOLÓGICA DE PRAZOS */}
      {viewMode === 'agenda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredEvents.length === 0 ? (
            <div className="card empty-state" style={{ padding: '3rem 1.5rem' }}>
              <div className="empty-icon">📅</div>
              <h3>Nenhum prazo encontrado com os filtros selecionados</h3>
              <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1rem 0' }}>
                Tente ajustar os filtros de curso, tipo ou status para visualizar outras atividades.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedCourse('all');
                  setSelectedType('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                }}
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const isOverdue = ev.isOverdue;
              const isCompleted = ev.status === 'completed';
              const countdown = getDaysDiffLabel(ev.dueDate);

              return (
                <div
                  key={ev.id}
                  className="card card-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1.15rem 1.35rem',
                    borderLeft: `4px solid ${isCompleted ? '#a4dcb9' : ev.type === 'assignment' ? '#2e97b7' : '#5bcebf'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: '320px', flex: 1 }}>
                    {/* Bloco de Data e Hora */}
                    <div
                      style={{
                        minWidth: '85px',
                        textAlign: 'center',
                        backgroundColor: 'var(--bg-subtle)',
                        padding: '0.5rem 0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        {new Date(ev.dueDate).toLocaleDateString('pt-BR', { month: 'short' })}
                      </div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                        {new Date(ev.dueDate).getDate()}
                      </div>
                      <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {new Date(ev.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* Informações da Atividade */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                        <span className="course-code-tag">{ev.courseCode}</span>
                        <span
                          style={{
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: ev.type === 'assignment' ? 'rgba(46, 151, 183, 0.15)' : 'rgba(91, 206, 191, 0.25)',
                            color: ev.type === 'assignment' ? '#1a5b6e' : '#125763'
                          }}
                        >
                          {ev.typeIcon} {ev.typeLabel}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • {ev.courseTitle}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                        <button
                          type="button"
                          onClick={() => setSelectedEvent(ev)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: 'inherit',
                            fontWeight: 700,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          {ev.title}
                        </button>
                      </h3>

                      {ev.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0' }}>
                          {ev.description.substring(0, 110)}...
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.775rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isOverdue ? 'var(--danger)' : isCompleted ? 'var(--success)' : '#2e97b7'
                          }}
                        >
                          ⏰ {countdown}
                        </span>
                        {ev.score !== null && (
                          <span style={{ fontWeight: 700, color: '#2ea88b' }}>
                            Nota: {ev.score} / {ev.maxScore || 10}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Badges e Ações Diretas */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <ActivityStatusBadge status={ev.status} size="md" />

                    <Link to={ev.link} className="btn btn-sm btn-primary">
                      {isCompleted ? 'Revisar Atividade' : ev.type === 'assignment' ? 'Entregar Tarefa' : 'Fazer Prova'}
                    </Link>

                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setSelectedEvent(ev)}
                      title="Ver todos os detalhes desta atividade"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL 1: DETALHES DO EVENTO / PRAZO */}
      {selectedEvent && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="course-code-tag">{selectedEvent.courseCode}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: selectedEvent.type === 'assignment' ? 'rgba(46, 151, 183, 0.15)' : 'rgba(91, 206, 191, 0.25)',
                    color: selectedEvent.type === 'assignment' ? '#1a5b6e' : '#125763'
                  }}
                >
                  {selectedEvent.typeIcon} {selectedEvent.typeLabel}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedEvent(null)}
                style={{ padding: '0.2rem 0.6rem' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                  {selectedEvent.title}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Curso: <strong>{selectedEvent.courseTitle}</strong> • Docente: {selectedEvent.teacherName}
                </div>
              </div>

              {/* Bloco de Data e Prazos */}
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    DATA LIMITE & HORÁRIO:
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.15rem' }}>
                    {formatDateFull(selectedEvent.dueDate)}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    CONTAGEM REGRESSIVA:
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: selectedEvent.isOverdue ? 'var(--danger)' : selectedEvent.status === 'completed' ? 'var(--success)' : '#2e97b7',
                      marginTop: '0.15rem'
                    }}
                  >
                    {getDaysDiffLabel(selectedEvent.dueDate)}
                  </div>
                </div>
              </div>

              {/* Status do Aluno */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Situação da sua entrega:</span>
                <ActivityStatusBadge status={selectedEvent.status} size="md" />
              </div>

              {/* Enunciado e Instruções */}
              {selectedEvent.description && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Instruções da Atividade:
                  </h4>
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--bg-surface)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {selectedEvent.description}
                  </div>
                </div>
              )}

              {/* Nota / Feedback caso já avaliado */}
              {selectedEvent.score !== null && (
                <div
                  style={{
                    backgroundColor: 'var(--success-light)',
                    border: '1px solid var(--success-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem'
                  }}
                >
                  <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '0.95rem' }}>
                    Nota atribuída: {selectedEvent.score} / {selectedEvent.maxScore || 10}
                  </div>
                  {selectedEvent.feedback && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                      <strong>Feedback do Docente:</strong> "{selectedEvent.feedback}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <a
                href={createGoogleCalendarUrl(selectedEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <span>🗓️</span> Google Calendar
              </a>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  Fechar
                </button>
                <Link
                  to={selectedEvent.link}
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  {selectedEvent.status === 'completed'
                    ? 'Acessar Conteúdo'
                    : selectedEvent.type === 'assignment'
                    ? 'Ir para Entrega da Tarefa →'
                    : 'Iniciar Prova / Quiz →'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ATIVIDADES DE UM DIA ESPECÍFICO */}
      {selectedDayEvents && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                Prazos para {selectedDayEvents.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setSelectedDayEvents(null)}
                style={{ padding: '0.2rem 0.6rem' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedDayEvents.events.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <span className="course-code-tag">{ev.courseCode}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {ev.typeIcon} {ev.typeLabel}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ev.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Prazo: {new Date(ev.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ActivityStatusBadge status={ev.status} size="sm" />
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        setSelectedDayEvents(null);
                        setSelectedEvent(ev);
                      }}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedDayEvents(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

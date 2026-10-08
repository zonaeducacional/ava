/**
 * Utilitário para exportação de calendário acadêmico do LMS
 * Gera arquivos no formato padrão iCalendar (.ics) e links diretos
 * para agendamento no Google Calendar.
 */

// Formata data ISO para formato iCalendar UTC (YYYYMMDDTHHMMSSZ)
function formatToIcsDate(isoString) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Gera conteúdo .ics compatível com Google Calendar, Apple Calendar e Outlook
 */
export function generateIcsCalendar(events = [], calendarName = 'LMS - Calendário Acadêmico') {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mini Moodle LMS//Calendario Academico//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:America/Sao_Paulo'
  ];

  events.forEach((event) => {
    if (!event.dueDate) return;

    const startDate = new Date(event.dueDate);
    // Data de término padrão: 1 hora após o prazo para eventos pontuais
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const dtStart = formatToIcsDate(startDate.toISOString());
    const dtEnd = formatToIcsDate(endDate.toISOString());
    const dtStamp = formatToIcsDate(new Date().toISOString());

    const title = `[${event.courseCode || 'LMS'}] ${event.typeLabel}: ${event.title}`;
    const description = `Curso: ${event.courseTitle || ''}\\nTipo: ${event.typeLabel || ''}\\nStatus: ${event.statusLabel || ''}\\n${event.description ? event.description.replace(/\n/g, '\\n') : ''}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id || Date.now()}@lms.local`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${title.replace(/[,;]/g, ' ')}`);
    lines.push(`DESCRIPTION:${description.replace(/[,;]/g, ' ')}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Dispara download do arquivo .ics no navegador do usuário
 */
export function downloadIcsFile(events = [], filename = 'lms-calendario-academico.ics') {
  const icsContent = generateIcsCalendar(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Cria link para adicionar evento diretamente no Google Calendar (Web)
 */
export function createGoogleCalendarUrl(event) {
  if (!event || !event.dueDate) return '#';

  const startDate = new Date(event.dueDate);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatGCal = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dates = `${formatGCal(startDate)}/${formatGCal(endDate)}`;

  const title = encodeURIComponent(`[${event.courseCode || 'LMS'}] ${event.typeLabel}: ${event.title}`);
  const details = encodeURIComponent(
    `Prazo Acadêmico no LMS\nCurso: ${event.courseTitle}\nTipo: ${event.typeLabel}\nStatus: ${event.statusLabel}\n\n${event.description || ''}`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
}

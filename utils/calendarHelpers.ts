import { Activity } from '../types/activities';

/**
 * Gera URL para adicionar o evento ao Google Calendar
 */
export function createGoogleCalendarUrl(activity: Activity): string {
  const title = encodeURIComponent(activity.title);
  const details = encodeURIComponent(
    `${activity.description}\n\nOrganizado pelo NEEI UAlg\nLocal: ${activity.location}`
  );
  const location = encodeURIComponent(activity.location);

  const dateClean = activity.date.replace(/-/g, '');
  const datesParam = `${dateClean}T090000Z/${dateClean}T180000Z`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${datesParam}`;
}

/**
 * Gera URL para adicionar o evento ao Microsoft Outlook (Web / 365)
 */
export function createOutlookCalendarUrl(activity: Activity): string {
  const title = encodeURIComponent(activity.title);
  const details = encodeURIComponent(
    `${activity.description}\n\nOrganizado pelo NEEI UAlg\nLocal: ${activity.location}`
  );
  const location = encodeURIComponent(activity.location);

  const start = `${activity.date}T09:00:00Z`;
  const end = `${activity.date}T18:00:00Z`;

  return `https://outlook.live.com/calendar/0/action/compose?rru=addevent&subject=${title}&body=${details}&location=${location}&startdt=${start}&enddt=${end}`;
}

/**
 * Gera o conteúdo no formato padrão iCalendar (.ics) compatível com Apple Calendar (iPhone / Mac)
 */
export function generateIcsContent(activity: Activity): string {
  const dateClean = activity.date.replace(/-/g, '');
  const dtStart = `${dateClean}T090000Z`;
  const dtEnd = `${dateClean}T180000Z`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `neei-activity-${activity.id || Date.now()}@aaualg.pt`;

  const cleanSummary = (activity.title || 'Atividade NEEI')
    .replace(/[,;\\]/g, ' ')
    .replace(/\r?\n/g, ' ');
  const cleanLocation = (activity.location || 'Universidade do Algarve')
    .replace(/[,;\\]/g, ' ')
    .replace(/\r?\n/g, ' ');
  const cleanDescription =
    `${activity.description || ''}\n\nOrganizado pelo Núcleo de Estudantes de Engenharia Informática da UAlg (NEEI)`
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NEEI UAlg//Portal de Atividades//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Descarrega o ficheiro .ics que o iPhone (iOS), macOS e Outlook abrem nativamente
 */
export function downloadIcsCalendarFile(activity: Activity): void {
  const icsData = generateIcsContent(activity);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const safeName = activity.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 30);

  link.setAttribute('download', `${safeName || 'atividade_neei'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Activity } from '../types/activities';
import {
  createGoogleCalendarUrl,
  createOutlookCalendarUrl,
  generateIcsContent,
  downloadIcsCalendarFile,
} from '../utils/calendarHelpers';

const baseActivity = {
  id: 'act-1',
  title: 'Workshop AED',
  description: 'Aprende C, Java',
  location: 'Lab 1.2, Faro',
  date: '2026-09-30',
} as Activity;

describe('calendarHelpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createGoogleCalendarUrl', () => {
    it('constrói o URL com datas fixas 09h-18h (Zulu)', () => {
      const url = createGoogleCalendarUrl(baseActivity);
      expect(url).toBe(
        `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
          'Workshop AED'
        )}&details=${encodeURIComponent(
          'Aprende C, Java\n\nOrganizado pelo NEEI UAlg\nLocal: Lab 1.2, Faro'
        )}&location=${encodeURIComponent('Lab 1.2, Faro')}&dates=20260930T090000Z/20260930T180000Z`
      );
    });
  });

  describe('createOutlookCalendarUrl', () => {
    it('constrói o URL com startdt/enddt em ISO', () => {
      const url = createOutlookCalendarUrl(baseActivity);
      expect(url).toBe(
        `https://outlook.live.com/calendar/0/action/compose?rru=addevent&subject=${encodeURIComponent(
          'Workshop AED'
        )}&body=${encodeURIComponent(
          'Aprende C, Java\n\nOrganizado pelo NEEI UAlg\nLocal: Lab 1.2, Faro'
        )}&location=${encodeURIComponent('Lab 1.2, Faro')}&startdt=2026-09-30T09:00:00Z&enddt=2026-09-30T18:00:00Z`
      );
    });
  });

  describe('generateIcsContent', () => {
    it('gera um ficheiro .ics válido e determinístico', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-12T10:00:00Z'));
      const ics = generateIcsContent(baseActivity);
      expect(ics).toBe(
        [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//NEEI UAlg//Portal de Atividades//PT',
          'CALSCALE:GREGORIAN',
          'METHOD:PUBLISH',
          'BEGIN:VEVENT',
          'UID:neei-activity-act-1@aaualg.pt',
          'DTSTAMP:20260912T100000Z',
          'DTSTART:20260930T090000Z',
          'DTEND:20260930T180000Z',
          'SUMMARY:Workshop AED',
          'DESCRIPTION:Aprende C\\, Java\\n\\nOrganizado pelo Núcleo de Estudantes de Engenharia Informática da UAlg (NEEI)',
          'LOCATION:Lab 1.2  Faro',
          'STATUS:CONFIRMED',
          'SEQUENCE:0',
          'END:VEVENT',
          'END:VCALENDAR',
        ].join('\r\n')
      );
    });

    it('escapa caracteres especiais na descrição e limpa summary', () => {
      const act = {
        ...baseActivity,
        title: 'Seminário [A, B; C]',
        description: 'Introdução, avançada;\ncontinua',
      } as Activity;
      const ics = generateIcsContent(act);
      expect(ics).toContain('SUMMARY:Seminário [A  B  C]');
      expect(ics).toContain('DESCRIPTION:Introdução\\, avançada\\;\\ncontinua\\n\\nOrganizado');
    });

    it('usa fallbacks quando faltam dados', () => {
      const act = {
        id: '',
        title: '',
        description: '',
        location: '',
        date: '2026-09-30',
      } as Activity;
      const ics = generateIcsContent(act);
      expect(ics).toContain('SUMMARY:Atividade NEEI');
      expect(ics).toContain('LOCATION:Universidade do Algarve');
      expect(ics).toContain('UID:neei-activity-');
    });
  });

  describe('downloadIcsCalendarFile', () => {
    it('não lança exceções em ambiente DOM', () => {
      const activity = {
        ...baseActivity,
        title: 'Atividade com Título Longo para Testar o Nome do Ficheiro!',
      } as Activity;
      expect(() => downloadIcsCalendarFile(activity)).not.toThrow();
    });
  });
});

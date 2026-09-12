import { describe, it, expect } from 'vitest';
import {
  formatDateDDMMAAAA,
  formatDateWithMonthSigla,
  formatDateTimeDDMMAAAA,
  getCalendarDayMonth,
  MONTH_SIGLAS,
} from '../utils/dateHelpers';

describe('dateHelpers', () => {
  describe('MONTH_SIGLAS', () => {
    it('tem 12 meses na ordem cronológica', () => {
      expect(MONTH_SIGLAS).toHaveLength(12);
      expect(MONTH_SIGLAS[0]).toBe('JAN');
      expect(MONTH_SIGLAS[11]).toBe('DEZ');
    });
  });

  describe('formatDateDDMMAAAA', () => {
    it('formata data ISO (YYYY-MM-DD)', () => {
      expect(formatDateDDMMAAAA('2026-09-30')).toBe('30-09-2026');
    });

    it('formata data ISO com hora', () => {
      expect(formatDateDDMMAAAA('2026-09-30T14:00:00Z')).toBe('30-09-2026');
    });

    it('formata data já em DD-MM-AAAA preservando-a', () => {
      expect(formatDateDDMMAAAA('30-09-2026')).toBe('30-09-2026');
    });

    it('formata data em DD/MM/AAAA', () => {
      expect(formatDateDDMMAAAA('30/09/2026')).toBe('30-09-2026');
    });

    it('lida com dias e meses de um dígito', () => {
      expect(formatDateDDMMAAAA('2026-01-05')).toBe('05-01-2026');
    });

    it('aceita objetos Date', () => {
      expect(formatDateDDMMAAAA(new Date(2026, 8, 30))).toBe('30-09-2026');
    });

    it('devolve string vazia para entradas vazias', () => {
      expect(formatDateDDMMAAAA('')).toBe('');
      expect(formatDateDDMMAAAA(null)).toBe('');
      expect(formatDateDDMMAAAA(undefined)).toBe('');
    });

    it('preserva strings não normalizáveis', () => {
      expect(formatDateDDMMAAAA('data-invalida')).toBe('data-invalida');
      expect(formatDateDDMMAAAA('2026-13-40')).toBe('40-13-2026');
    });
  });

  describe('formatDateWithMonthSigla', () => {
    it('formata com mês por extenso em maiúsculas', () => {
      expect(formatDateWithMonthSigla('2026-09-30')).toBe('30 SET 2026');
    });

    it('formata já em DD-MM-AAAA', () => {
      expect(formatDateWithMonthSigla('30-09-2026')).toBe('30 SET 2026');
    });

    it('aceita objetos Date', () => {
      expect(formatDateWithMonthSigla(new Date(2026, 0, 5))).toBe('05 JAN 2026');
    });

    it('omite o ano quando includeYear é false', () => {
      expect(formatDateWithMonthSigla('2026-09-30', false)).toBe('30 SET');
    });

    it('devolve string vazia para entradas inválidas', () => {
      expect(formatDateWithMonthSigla('')).toBe('');
      expect(formatDateWithMonthSigla(null)).toBe('');
    });
  });

  describe('formatDateTimeDDMMAAAA', () => {
    it('formata objeto Date com hora', () => {
      expect(formatDateTimeDDMMAAAA(new Date(2026, 8, 12, 14, 30))).toBe('12-09-2026 14:30');
    });

    it('formata timestamp ISO', () => {
      const expected = formatDateTimeDDMMAAAA(new Date(2026, 8, 12, 14, 30).toISOString());
      expect(expected).toMatch(/^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/);
    });

    it('devolve string vazia para entradas inválidas', () => {
      expect(formatDateTimeDDMMAAAA('')).toBe('');
      expect(formatDateTimeDDMMAAAA(null)).toBe('');
    });
  });

  describe('getCalendarDayMonth', () => {
    it('decompõe data ISO em dia/mês/ano', () => {
      expect(getCalendarDayMonth('2026-09-30')).toEqual({ day: '30', month: 'SET', year: '2026' });
    });

    it('decompõe data em DD-MM-AAAA', () => {
      expect(getCalendarDayMonth('05-01-2026')).toEqual({ day: '05', month: 'JAN', year: '2026' });
    });

    it('devolve placeholders para entradas inválidas', () => {
      expect(getCalendarDayMonth('')).toEqual({ day: '--', month: 'MÊS', year: '' });
      expect(getCalendarDayMonth('xx')).toEqual({ day: '--', month: 'MÊS', year: '' });
    });
  });
});

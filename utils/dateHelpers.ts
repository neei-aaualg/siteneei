/**
 * Utilitários de Formatação de Datas em DD-MM-AAAA para o Portal NEEI
 */

/**
 * Converte uma data (string ISO, YYYY-MM-DD ou objeto Date) para o formato DD-MM-AAAA
 * Exemplos:
 *   "2026-09-30" -> "30-09-2026"
 *   "2026-10-05" -> "05-10-2026"
 *   "2026-09-30T14:00:00Z" -> "30-09-2026"
 */
export function formatDateDDMMAAAA(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}-${month}-${year}`;
  }

  const trimmed = dateInput.trim();
  if (!trimmed) return '';

  // Se já estiver no formato DD-MM-AAAA
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Se estiver no formato DD/MM/AAAA
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed.replace(/\//g, '-');
  }

  // Se estiver no formato YYYY-MM-DD (com ou sem timestamp)
  const datePart = trimmed.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }

  // Fallback para conversão via Date
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return trimmed;
}

/**
 * Converte data e hora para DD-MM-AAAA HH:mm
 * Exemplo: "2026-09-12T14:30:00Z" -> "12-09-2026 15:30" (ajustado ao fuso local)
 */
export function formatDateTimeDDMMAAAA(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

/**
 * Devolve dia (DD) e mês abreviado em maiúsculas (pt-PT) para cartões de calendário
 */
export function getCalendarDayMonth(dateStr: string): { day: string; month: string } {
  if (!dateStr) return { day: '--', month: 'MÊS' };
  try {
    const cleanDate = dateStr.trim().split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIndex, day);
      return {
        day: String(day).padStart(2, '0'),
        month: d.toLocaleDateString('pt-PT', { month: 'short' }).toUpperCase().replace('.', '')
      };
    }
  } catch {
    // fallback
  }
  return { day: '--', month: 'MÊS' };
}

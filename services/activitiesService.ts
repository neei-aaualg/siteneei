import {
  Activity,
  AdminActivityWithRegistrations,
  RegisterResponse,
  AdminAuthResponse,
  ActivityStatus
} from '../types/activities';

const ADMIN_TOKEN_KEY = 'neei_admin_token';

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save token to localStorage:', e);
  }
}

export function clearStoredAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear token from localStorage:', e);
  }
}

/**
 * Obtém as configurações da aplicação (ex.: visibilidade do calendário)
 */
export async function fetchAppConfig(): Promise<{ showCalendar: boolean }> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      return { showCalendar: Boolean(data.showCalendar) };
    }
  } catch {
    // Ignora erro de rede em ambiente offline/dev
  }

  // Fallback para variável de ambiente Vite
  const viteEnv = (import.meta as any).env?.VITE_SHOW_CALENDAR;
  if (viteEnv !== undefined) {
    return { showCalendar: viteEnv !== 'false' && viteEnv !== '0' };
  }

  return { showCalendar: true };
}

/**
 * Carrega a lista pública de atividades (a decorrer e futuras)
 */
export async function fetchPublicActivities(): Promise<Activity[]> {
  const res = await fetch('/api/activities', {
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) {
    throw new Error(`Erro ao obter atividades (${res.status})`);
  }

  return res.json();
}

/**
 * Efetua a inscrição de um aluno numa atividade a decorrer
 */
export async function registerForActivity(
  activityId: string,
  name: string,
  studentNumber: string
): Promise<RegisterResponse> {
  const res = await fetch('/api/activities/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ activityId, name, studentNumber })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Erro ao processar inscrição');
  }

  return data;
}

/**
 * Autentica o utilizador da equipa NEEI
 */
export async function adminLogin(password: string): Promise<AdminAuthResponse> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Credenciais inválidas');
  }

  if (data.token) {
    setStoredAdminToken(data.token);
  }

  return data;
}

/**
 * Carrega todas as atividades e respetivas listas de inscritos
 */
export async function fetchAdminActivities(token: string): Promise<AdminActivityWithRegistrations[]> {
  const res = await fetch('/api/admin/activities', {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    clearStoredAdminToken();
    throw new Error('Sessão expirada. Por favor faz login novamente.');
  }

  if (!res.ok) {
    throw new Error(`Erro ao carregar dados de administração (${res.status})`);
  }

  return res.json();
}

/**
 * Remove a inscrição de um aluno
 */
export async function removeRegistration(token: string, registrationId: string): Promise<boolean> {
  const res = await fetch(`/api/admin/registrations/${registrationId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    clearStoredAdminToken();
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao remover inscrição');
  }

  const data = await res.json();
  return data.success;
}

/**
 * Altera o estado de uma atividade ('ongoing' | 'upcoming' | 'completed')
 */
export async function updateActivityStatus(
  token: string,
  activityId: string,
  status: ActivityStatus
): Promise<boolean> {
  const res = await fetch('/api/admin/activities/status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ activityId, status })
  });

  if (res.status === 401) {
    clearStoredAdminToken();
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao atualizar estado');
  }

  const data = await res.json();
  return data.success;
}

/**
 * Cria ou atualiza uma atividade no painel de administração
 */
export async function saveActivity(
  token: string,
  activity: Partial<Activity>
): Promise<Activity> {
  const res = await fetch('/api/admin/activities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(activity)
  });

  if (res.status === 401) {
    clearStoredAdminToken();
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao guardar atividade');
  }

  const data = await res.json();
  return data.activity;
}

/**
 * Elimina uma atividade
 */
export async function deleteActivity(token: string, activityId: string): Promise<boolean> {
  const res = await fetch(`/api/admin/activities/${activityId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    clearStoredAdminToken();
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao eliminar atividade');
  }

  const data = await res.json();
  return data.success;
}

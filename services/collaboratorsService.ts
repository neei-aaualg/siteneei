import {
  CollaboratorApplication,
  CollaboratorStatus,
  ApplyCollaboratorPayload,
  ApplyCollaboratorResponse,
} from '../types/collaborators';

const API_BASE = '/api';

async function parseResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // not json
    }
  }

  if (!res.ok) {
    const errorMsg =
      data?.error ||
      (text && !text.includes('<!DOCTYPE')
        ? text
        : `${fallbackError} (${res.status} ${res.statusText})`);
    throw new Error(errorMsg);
  }

  return (data !== null ? data : {}) as T;
}

/**
 * Submete uma candidatura de colaborador
 */
export async function submitCollaboratorApplication(
  payload: ApplyCollaboratorPayload
): Promise<ApplyCollaboratorResponse> {
  const res = await fetch(`${API_BASE}/collaborators/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse<ApplyCollaboratorResponse>(res, 'Erro ao enviar a candidatura.');
}

/**
 * Obtém todas as candidaturas de colaboradores (requer token admin)
 */
export async function fetchAdminCollaborators(token: string): Promise<CollaboratorApplication[]> {
  const res = await fetch(`${API_BASE}/admin/collaborators`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<CollaboratorApplication[]>(
    res,
    'Erro ao carregar candidaturas de colaboradores.'
  );
}

/**
 * Atualiza o estado ou notas de uma candidatura (requer token admin)
 */
export async function updateCollaboratorStatus(
  token: string,
  id: string,
  status: CollaboratorStatus,
  notes?: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/admin/collaborators/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, status, notes }),
  });

  return parseResponse<{ success: boolean }>(res, 'Erro ao atualizar o estado da candidatura.');
}

/**
 * Elimina uma candidatura de colaborador (requer token admin)
 */
export async function deleteCollaboratorApplication(
  token: string,
  id: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/admin/collaborators/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ success: boolean }>(res, 'Erro ao eliminar candidatura.');
}

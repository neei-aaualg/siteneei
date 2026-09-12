import {
  CollaboratorApplication,
  CollaboratorStatus,
  ApplyCollaboratorPayload,
  ApplyCollaboratorResponse
} from '../types/collaborators';

const API_BASE = '/api';

/**
 * Submete uma candidatura de colaborador
 */
export async function submitCollaboratorApplication(
  payload: ApplyCollaboratorPayload
): Promise<ApplyCollaboratorResponse> {
  const res = await fetch(`${API_BASE}/collaborators/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao enviar a candidatura.');
  }
  return data;
}

/**
 * Obtém todas as candidaturas de colaboradores (requer token admin)
 */
export async function fetchAdminCollaborators(
  token: string
): Promise<CollaboratorApplication[]> {
  const res = await fetch(`${API_BASE}/admin/collaborators`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao carregar candidaturas de colaboradores.');
  }
  return data;
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
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id, status, notes })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao atualizar o estado da candidatura.');
  }
  return data;
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
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao eliminar candidatura.');
  }
  return data;
}

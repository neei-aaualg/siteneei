import {
  JobOffer,
  JobStatus,
  SubmitJobPayload,
  SubmitJobResponse
} from '../types/jobs';

const API_BASE = '/api';

/**
 * Submete uma oferta de emprego ou estágio (formulário público para empresas)
 */
export async function submitJobOffer(
  payload: SubmitJobPayload
): Promise<SubmitJobResponse> {
  const res = await fetch(`${API_BASE}/jobs/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao submeter a oferta de emprego.');
  }
  return data;
}

/**
 * Obtém as ofertas de emprego públicas ativas/publicadas
 */
export async function fetchPublicJobs(): Promise<JobOffer[]> {
  const res = await fetch(`${API_BASE}/jobs`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao carregar ofertas de emprego.');
  }
  return data;
}

/**
 * Obtém todas as ofertas de emprego (requer token admin)
 */
export async function fetchAdminJobs(
  token: string
): Promise<JobOffer[]> {
  const res = await fetch(`${API_BASE}/admin/jobs`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao carregar ofertas de emprego para administração.');
  }
  return data;
}

/**
 * Atualiza o estado ou notas de uma oferta de emprego (requer token admin)
 */
export async function updateJobStatus(
  token: string,
  id: string,
  status: JobStatus,
  notes?: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/admin/jobs/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id, status, notes })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao atualizar o estado da oferta de emprego.');
  }
  return data;
}

/**
 * Elimina uma oferta de emprego (requer token admin)
 */
export async function deleteJobOffer(
  token: string,
  id: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/admin/jobs/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao eliminar a oferta de emprego.');
  }
  return data;
}

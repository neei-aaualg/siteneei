import { JobOffer, JobStatus, SubmitJobPayload, SubmitJobResponse } from '../types/jobs';

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
 * Submete uma oferta de emprego ou estágio (formulário público para empresas)
 */
export async function submitJobOffer(payload: SubmitJobPayload): Promise<SubmitJobResponse> {
  const res = await fetch(`${API_BASE}/jobs/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return parseResponse<SubmitJobResponse>(res, 'Erro ao submeter a oferta de emprego.');
}

/**
 * Obtém as ofertas de emprego públicas ativas/publicadas
 */
export async function fetchPublicJobs(): Promise<JobOffer[]> {
  const res = await fetch(`${API_BASE}/jobs`);
  return parseResponse<JobOffer[]>(res, 'Erro ao carregar ofertas de emprego.');
}

/**
 * Obtém todas as ofertas de emprego (requer token admin)
 */
export async function fetchAdminJobs(token: string): Promise<JobOffer[]> {
  const res = await fetch(`${API_BASE}/admin/jobs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<JobOffer[]>(res, 'Erro ao carregar ofertas de emprego para administração.');
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
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id, status, notes }),
  });

  return parseResponse<{ success: boolean }>(
    res,
    'Erro ao atualizar o estado da oferta de emprego.'
  );
}

/**
 * Elimina uma oferta de emprego (requer token admin)
 */
export async function deleteJobOffer(token: string, id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/admin/jobs/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse<{ success: boolean }>(res, 'Erro ao eliminar a oferta de emprego.');
}

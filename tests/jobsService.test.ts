import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  submitJobOffer,
  fetchPublicJobs,
  fetchAdminJobs,
  updateJobStatus,
  deleteJobOffer,
} from '../services/jobsService';

const jsonResponse = (data: unknown, ok = true, status = 200, statusText = 'OK') => ({
  ok,
  status,
  statusText,
  text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
});

describe('jobsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('submitJobOffer', () => {
    it('submete a oferta e devolve a resposta', async () => {
      const payload = {
        company: 'Empresa X',
        title: 'Estágio em Desenvolvimento',
        type: 'Estágio',
        location: 'Faro',
        email: 'rh@empresa.pt',
        phone: '912345678',
        description: 'Descrição',
      } as never;
      const response = { success: true, message: 'Oferta submetida!' };
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(response));
      vi.stubGlobal('fetch', fetchMock);

      const result = await submitJobOffer(payload);
      expect(result).toEqual(response);
      expect(fetchMock.mock.calls[0][0]).toBe('/api/jobs/submit');
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload);
    });

    it('lança o erro devolvido pelo servidor', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({ error: 'Email inválido.' }, false, 400))
      );
      await expect(submitJobOffer({} as never)).rejects.toThrow('Email inválido.');
    });

    it('usa o erro de fallback para respostas HTML', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => '<!DOCTYPE html>',
        })
      );
      await expect(submitJobOffer({} as never)).rejects.toThrow(
        'Erro ao submeter a oferta de emprego. (500 Internal Server Error)'
      );
    });
  });

  describe('fetchPublicJobs', () => {
    it('devolve a lista de ofertas públicas', async () => {
      const data = [{ id: 1, title: 'Vaga' }];
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(data)));
      await expect(fetchPublicJobs()).resolves.toEqual(data);
    });
  });

  describe('fetchAdminJobs', () => {
    it('envia o Bearer token', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
      vi.stubGlobal('fetch', fetchMock);
      await fetchAdminJobs('tok');
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    });
  });

  describe('updateJobStatus', () => {
    it('envia id, estado e notas', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
      vi.stubGlobal('fetch', fetchMock);
      await updateJobStatus('tok', '5', 'published', 'Ok');
      const [, options] = fetchMock.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({ id: '5', status: 'published', notes: 'Ok' });
    });
  });

  describe('deleteJobOffer', () => {
    it('envia um pedido DELETE', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
      vi.stubGlobal('fetch', fetchMock);
      await deleteJobOffer('tok', '5');
      expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    });
  });
});

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  submitCollaboratorApplication,
  fetchAdminCollaborators,
  updateCollaboratorStatus,
  deleteCollaboratorApplication,
} from '../services/collaboratorsService';

const jsonResponse = (data: unknown, ok = true, status = 200, statusText = 'OK') => ({
  ok,
  status,
  statusText,
  text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
});

const htmlResponse = (status: number, statusText: string) => ({
  ok: false,
  status,
  statusText,
  text: async () => '<!DOCTYPE html><html><body>Erro</body></html>',
});

describe('collaboratorsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('submitCollaboratorApplication', () => {
    it('submete o payload e devolve a resposta', async () => {
      const payload = {
        name: 'Maria Silva',
        student_number: '74123',
        email: 'a74123@ualg.pt',
        phone: '912345678',
        course: 'LEI',
        academic_year: '3º Ano',
        motivation: 'Quero contribuir para o núcleo!',
      } as never;
      const response = { success: true, message: 'Candidatura enviada' };
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(response));
      vi.stubGlobal('fetch', fetchMock);

      const result = await submitCollaboratorApplication(payload);
      expect(result).toEqual(response);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/collaborators/apply');
      expect(JSON.parse(options.body)).toEqual(payload);
    });

    it('lança o erro devolvido pelo servidor', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({ error: 'Verifica os campos.' }, false, 400))
      );
      await expect(submitCollaboratorApplication({} as never)).rejects.toThrow(
        'Verifica os campos.'
      );
    });

    it('usa o erro de fallback para respostas HTML', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(htmlResponse(500, 'Internal Server Error')));
      await expect(submitCollaboratorApplication({} as never)).rejects.toThrow(
        'Erro ao enviar a candidatura. (500 Internal Server Error)'
      );
    });

    it('usa o corpo de texto simples quando não é HTML nem JSON', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse('texto simples', false, 422)));
      await expect(submitCollaboratorApplication({} as never)).rejects.toThrow('texto simples');
    });
  });

  describe('fetchAdminCollaborators', () => {
    it('envia o Bearer token', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
      vi.stubGlobal('fetch', fetchMock);
      await fetchAdminCollaborators('tok');
      expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
    });
  });

  describe('updateCollaboratorStatus', () => {
    it('envia id, estado e notas', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
      vi.stubGlobal('fetch', fetchMock);
      await updateCollaboratorStatus('tok', 'c1', 'accepted', 'Boa aluna');
      const [, options] = fetchMock.mock.calls[0];
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        id: 'c1',
        status: 'accepted',
        notes: 'Boa aluna',
      });
    });
  });

  describe('deleteCollaboratorApplication', () => {
    it('envia um pedido DELETE', async () => {
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true }));
      vi.stubGlobal('fetch', fetchMock);
      await deleteCollaboratorApplication('tok', 'c1');
      expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    });
  });
});

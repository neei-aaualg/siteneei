import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStoredAdminToken,
  setStoredAdminToken,
  clearStoredAdminToken,
  fetchAppConfig,
  fetchPublicActivities,
  registerForActivity,
  adminLogin,
  fetchAdminActivities,
} from '../services/activitiesService';

const jsonResponse = (data: unknown, ok = true, status = 200, statusText = 'OK') => ({
  ok,
  status,
  statusText,
  json: async () => data,
});

describe('activitiesService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('token helpers (localStorage)', () => {
    it('devolve null quando não existe token', () => {
      expect(getStoredAdminToken()).toBeNull();
    });

    it('guarda, lê e limpa o token', () => {
      setStoredAdminToken('tok-123');
      expect(getStoredAdminToken()).toBe('tok-123');
      clearStoredAdminToken();
      expect(getStoredAdminToken()).toBeNull();
    });
  });

  describe('fetchAppConfig', () => {
    it('usa o valor do servidor', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ showCalendar: false })));
      await expect(fetchAppConfig()).resolves.toEqual({ showCalendar: false });
    });

    // O ramo via `import.meta.env.VITE_SHOW_CALENDAR` (fallback quando o
    // servidor falha) não é controlável por teste: o vitest fornece o
    // `import.meta.env` por ficheiro e não deixa defini-lo per-case.
    it('devolve true por omissão em caso de erro sem env', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
      await expect(fetchAppConfig()).resolves.toEqual({ showCalendar: true });
    });
  });

  describe('fetchPublicActivities', () => {
    it('devolve a lista de atividades', async () => {
      const data = [{ id: 'act-1' }];
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(data)));
      await expect(fetchPublicActivities()).resolves.toEqual(data);
    });

    it('lança erro com o status em caso de falha', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false, 500)));
      await expect(fetchPublicActivities()).rejects.toThrow('Erro ao obter atividades (500)');
    });
  });

  describe('registerForActivity', () => {
    it('devolve a resposta da inscrição', async () => {
      const data = { success: true, message: 'Inscrição confirmada com sucesso!' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(data)));
      await expect(registerForActivity('act-1', 'João', '74123')).resolves.toEqual(data);
    });

    it('lança o erro devolvido pelo servidor', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            jsonResponse({ error: 'Já te encontras inscrito nesta atividade.' }, false, 409)
          )
      );
      await expect(registerForActivity('act-1', 'João', '74123')).rejects.toThrow(
        'Já te encontras inscrito'
      );
    });

    it('lança erro genérico quando não há mensagem', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false, 500)));
      await expect(registerForActivity('act-1', 'João', '74123')).rejects.toThrow(
        'Erro ao processar inscrição'
      );
    });
  });

  describe('adminLogin', () => {
    it('guarda o token devolvido pelo servidor', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({ success: true, token: 'abc' }))
      );
      const result = await adminLogin('senha');
      expect(result.token).toBe('abc');
      expect(getStoredAdminToken()).toBe('abc');
    });

    it('lança o erro das credenciais incorrectas', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({ error: 'Senha de equipa incorreta.' }, false, 401))
      );
      await expect(adminLogin('errada')).rejects.toThrow('Senha de equipa incorreta.');
    });

    it('não remove um token anterior quando o login falha', async () => {
      setStoredAdminToken('antigo');
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({ error: 'erro' }, false, 401))
      );
      await expect(adminLogin('errada')).rejects.toThrow();
      expect(getStoredAdminToken()).toBe('antigo');
    });
  });

  describe('fetchAdminActivities', () => {
    it('envia o token de autorização', async () => {
      const data = [{ id: 'act-1', registrations: [] }];
      const fetchMock = vi.fn().mockResolvedValue(jsonResponse(data));
      vi.stubGlobal('fetch', fetchMock);
      await fetchAdminActivities('tok');
      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers.Authorization).toBe('Bearer tok');
    });

    it('limpa o token e lança erro em caso de 401', async () => {
      setStoredAdminToken('tok');
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(jsonResponse({}, false, 401, 'Unauthorized'))
      );
      await expect(fetchAdminActivities('tok')).rejects.toThrow('Sessão expirada');
      expect(getStoredAdminToken()).toBeNull();
    });
  });
});

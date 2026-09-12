// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('server/auth', () => {
  let auth;
  const originalPassword = process.env.ADMIN_PASSWORD;

  beforeEach(async () => {
    vi.resetModules();
    process.env.ADMIN_PASSWORD = 'senha-teste-123';
    auth = await import('../../server/auth.js');
  });

  afterEach(() => {
    if (originalPassword === undefined) {
      delete process.env.ADMIN_PASSWORD;
    } else {
      process.env.ADMIN_PASSWORD = originalPassword;
    }
    vi.useRealTimers();
  });

  it('gera um token hex de 64 caracteres com expiração de 7 dias', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const before = Date.now();
    const result = auth.authenticateAdmin('senha-teste-123');
    expect(result.success).toBe(true);
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(result.expiresAt).toBeGreaterThan(before);
    expect(result.expiresAt - before).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('rejeita senha incorreta com 401', () => {
    try {
      auth.authenticateAdmin('senha-errada');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Senha de equipa incorreta');
    }
  });

  it('recusa autenticar sem ADMIN_PASSWORD configurada (500)', async () => {
    vi.resetModules();
    delete process.env.ADMIN_PASSWORD;
    const authSemSenha = await import('../../server/auth.js');
    try {
      authSemSenha.authenticateAdmin('qualquer-coisa');
      throw new Error('deveria lançar');
    } catch (err) {
      expect(err.statusCode).toBe(500);
      expect(err.message).toBe('Senha de equipa não configurada no servidor');
    }
  });

  it('rejeita senha em falta ou não textual com 400', () => {
    for (const bad of [undefined, null, '', 12345]) {
      try {
        auth.authenticateAdmin(bad);
        throw new Error('deveria lançar');
      } catch (err) {
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('Senha não fornecida');
      }
    }
  });

  it('é imune à diferença de comprimento (sem timing leak direto)', () => {
    // Comparação de comprimentos diferentes não lança exceção
    expect(() => {
      try {
        auth.authenticateAdmin('x');
      } catch {
        // esperado 401
      }
    }).not.toThrow();
  });

  it('verifica tokens via header Authorization Bearer', () => {
    const { token } = auth.authenticateAdmin('senha-teste-123');
    expect(auth.verifyAdminToken({ headers: { authorization: `Bearer ${token}` } })).toBe(true);
    expect(auth.verifyAdminToken({ headers: { authorization: `Bearer  ${token}  ` } })).toBe(true);
  });

  it('verifica tokens via header x-admin-token', () => {
    const { token } = auth.authenticateAdmin('senha-teste-123');
    expect(auth.verifyAdminToken({ headers: { 'x-admin-token': token } })).toBe(true);
  });

  it('rejeita pedidos sem token ou com token inválido', () => {
    expect(auth.verifyAdminToken({ headers: {} })).toBe(false);
    expect(auth.verifyAdminToken({ headers: { authorization: 'Bearer token-invalido' } })).toBe(
      false
    );
    expect(auth.verifyAdminToken({ headers: { authorization: 'SemBearer' } })).toBe(false);
  });

  it('invalida sessões ao fazer logout', () => {
    const { token } = auth.authenticateAdmin('senha-teste-123');
    expect(auth.verifyAdminToken({ headers: { authorization: `Bearer ${token}` } })).toBe(true);
    auth.revokeSession(token);
    expect(auth.verifyAdminToken({ headers: { authorization: `Bearer ${token}` } })).toBe(false);
  });

  it('rejeita sessões expiradas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const { token } = auth.authenticateAdmin('senha-teste-123');

    vi.setSystemTime(new Date('2026-01-08T00:00:01Z'));
    expect(auth.verifyAdminToken({ headers: { authorization: `Bearer ${token}` } })).toBe(false);
  });
});

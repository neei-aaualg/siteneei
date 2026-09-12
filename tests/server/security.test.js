// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRateLimiter, setSecurityHeaders, clientIp } from '../../server/security.js';

describe('server/security - rate limiter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite pedidos dentro do limite', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    expect(limiter.check('1.2.3.4').ok).toBe(true);
    expect(limiter.check('1.2.3.4').ok).toBe(true);
  });

  it('bloqueia pedidos acima do limite e indica o tempo de espera', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 2 });
    limiter.check('9.9.9.9');
    limiter.check('9.9.9.9');
    const result = limiter.check('9.9.9.9');
    expect(result.ok).toBe(false);
    expect(result.retryAfterSec).toBe(1);
  });

  it('reinicia a janela quando expira', () => {
    vi.useFakeTimers();
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    limiter.check('5.5.5.5');
    expect(limiter.check('5.5.5.5').ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(limiter.check('5.5.5.5').ok).toBe(true);
  });

  it('mantém limites independentes por IP', () => {
    const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
    limiter.check('1.1.1.1');
    expect(limiter.check('2.2.2.2').ok).toBe(true);
  });
});

describe('server/security - cabeçalhos e IP', () => {
  it('define os cabeçalhos de segurança', () => {
    const headers = {};
    const res = {
      setHeader: (key, value) => {
        headers[key] = value;
      },
    };
    setSecurityHeaders(res);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(headers['Content-Security-Policy']).toContain("object-src 'none'");
  });

  it('obtém o IP do cliente via x-forwarded-for com prioridade', () => {
    expect(clientIp({ headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' } })).toBe(
      '203.0.113.9'
    );
    expect(clientIp({ headers: {}, socket: { remoteAddress: '::1' } })).toBe('::1');
    expect(clientIp({ headers: {} })).toBe('unknown');
  });
});

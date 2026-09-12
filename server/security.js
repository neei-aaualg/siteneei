// Limite de pedidos em memória (por endereço IP) — mitigação simples contra
// força bruta e abuso de endpoints de escrita.
export function createRateLimiter({ windowMs = 60_000, max = 60 } = {}) {
  const hits = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits) {
      if (now - record.first > windowMs) hits.delete(key);
    }
  }, windowMs);

  // Não mantém o processo Node vivo por causa da limpeza.
  if (typeof cleanup.unref === 'function') cleanup.unref();

  return {
    check(ip) {
      const now = Date.now();
      const record = hits.get(ip);

      if (!record || now - record.first > windowMs) {
        hits.set(ip, { first: now, count: 1 });
        return { ok: true, retryAfterSec: null };
      }

      record.count += 1;
      if (record.count > max) {
        return { ok: false, retryAfterSec: Math.ceil(windowMs / 1000) };
      }

      return { ok: true, retryAfterSec: null };
    },
    _size: () => hits.size,
  };
}

// Cabeçalhos de segurança aplicados a todas as respostas HTTP.
export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // CSP pragmática: o site ainda usa o Tailwind via CDN e scripts inline
  // (tema + config). Remover o CDN do Tailwind permite apertar para
  // script-src 'self' sem 'unsafe-inline'/'unsafe-eval'.
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' https://cdn.tailwindcss.com 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data:",
      "connect-src 'self' https://emkc.org",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
}

export function clientIp(req) {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

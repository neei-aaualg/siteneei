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
        // Prevenção de crescimento descontrolado da memória em caso de ataques
        if (hits.size > 10_000) {
          const oldestKey = hits.keys().next().value;
          hits.delete(oldestKey);
        }
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
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=*');
  // CSP sem 'unsafe-eval'
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' https://cdn.tailwindcss.com https://js.stripe.com 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https://*.stripe.com",
      "connect-src 'self' https://emkc.org https://api.stripe.com https://maps.googleapis.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
}

export function clientIp(req) {
  const trustProxy = process.env.TRUST_PROXY !== 'false' && process.env.TRUST_PROXY !== '0';

  if (trustProxy && req?.headers && req.headers['x-forwarded-for']) {
    const raw = req.headers['x-forwarded-for'].toString().split(',')[0].trim();
    const sanitized = raw.replace(/[^\w.:-]/g, '').slice(0, 64);
    if (sanitized) return sanitized;
  }

  const socketIp = req?.socket?.remoteAddress;
  if (socketIp) {
    return socketIp.replace(/[^\w.:-]/g, '').slice(0, 64);
  }

  return 'unknown';
}

/**
 * Obtém o URL base canónico da aplicação validando o host para evitar Host Header Injection
 */
export function getCanonicalAppUrl(req = null) {
  const envUrl = (process.env.APP_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (req && req.headers && req.headers.host) {
    const rawHost = String(req.headers.host).trim();
    // Validação estrita: apenas domínios/hostnames válidos com porta opcional
    const hostMatch = rawHost.match(/^[a-zA-Z0-9.-]+(?::[0-9]{1,5})?$/);
    if (hostMatch) {
      const proto =
        req.headers['x-forwarded-proto'] === 'https' ||
          req.connection?.encrypted
          ? 'https'
          : 'http';
      return `${proto}://${hostMatch[0]}`;
    }
  }

  return 'https://neei.online';
}


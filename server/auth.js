import crypto from 'node:crypto';

// Senha única para a equipa NEEI (obrigatória: configura via ADMIN_PASSWORD)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Armazenamento em memória de tokens de sessão ativos (token -> expiração)
const activeSessions = new Map();
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

/**
 * Valida a senha da equipa e gera um token de sessão
 */
export function authenticateAdmin(password) {
  if (!password || typeof password !== 'string') {
    const err = new Error('Senha não fornecida');
    err.statusCode = 400;
    throw err;
  }

  // Falha silenciosa se a variável de ambiente não estiver configurada
  if (!ADMIN_PASSWORD) {
    const err = new Error('Senha de equipa não configurada no servidor');
    err.statusCode = 500;
    throw err;
  }

  // Comparação segura contra timing attacks
  const inputBuffer = Buffer.from(password.trim());
  const expectedBuffer = Buffer.from(ADMIN_PASSWORD.trim());

  let isMatch = false;
  if (inputBuffer.length === expectedBuffer.length) {
    isMatch = crypto.timingSafeEqual(inputBuffer, expectedBuffer);
  }

  if (!isMatch) {
    const err = new Error('Senha de equipa incorreta');
    err.statusCode = 401;
    throw err;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  activeSessions.set(token, expiresAt);

  // Limpeza periódica de sessões expiradas
  for (const [t, exp] of activeSessions.entries()) {
    if (Date.now() > exp) {
      activeSessions.delete(t);
    }
  }

  return {
    success: true,
    token,
    expiresAt,
  };
}

/**
 * Valida uma string de token de sessão de administrador
 */
export function verifyAdminTokenString(token) {
  if (!token || typeof token !== 'string') return false;
  const clean = token.trim();
  const expiresAt = activeSessions.get(clean);
  if (!expiresAt) return false;

  if (Date.now() > expiresAt) {
    activeSessions.delete(clean);
    return false;
  }

  return true;
}

/**
 * Verifica se o request contém um token de sessão válido (headers ou query params)
 */
export function verifyAdminToken(req, searchParams = null) {
  const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];

  let token = null;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      token = authHeader.trim();
    }
  } else if (searchParams && typeof searchParams.get === 'function') {
    token = searchParams.get('token') || searchParams.get('adminToken');
  }

  return verifyAdminTokenString(token);
}

/**
 * Invalida uma sessão (logout)
 */
export function revokeSession(token) {
  if (token) {
    activeSessions.delete(token);
  }
}

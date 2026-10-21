import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { handleActivitiesApi } from './server/api.js';
import { handleShopApi } from './server/shopApi.js';
import { createRateLimiter, setSecurityHeaders, clientIp } from './server/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  if (fs.existsSync('.env')) {
    process.loadEnvFile('.env');
  }
} catch (e) {
  // Ignora se não existir ou não suportado
}

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const BUILD_DIR = path.resolve(__dirname, 'build');

// Limites de taxa por IP (janela de 60s)
const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 120 });
const analyzeLimiter = createRateLimiter({ windowMs: 60_000, max: 30 });
const adminLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });
const loginLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

function sendTooManyRequests(res, retryAfterSec) {
  setSecurityHeaders(res);
  res.writeHead(429, {
    'Content-Type': 'application/json; charset=utf-8',
    'Retry-After': String(retryAfterSec),
  });
  res.end(JSON.stringify({ error: 'Demasiados pedidos. Tenta novamente dentro de pouco tempo.' }));
}

function isRateLimited(req, res, limiter) {
  const result = limiter.check(clientIp(req));
  if (!result.ok) {
    sendTooManyRequests(res, result.retryAfterSec);
    return true;
  }
  return false;
}

const FORBIDDEN_PATTERNS = [
  'system(',
  'exec(',
  'fork(',
  'popen(', // Processos C/C++
  'Runtime.getRuntime',
  'ProcessBuilder', // Processos Java
  'upload',
  'download',
  'socket',
  'http',
  'ftp', // Rede
  'while(1)',
  'while(true)',
  'for(;;)', // Loops infinitos óbvios
  '/etc/passwd',
  '/bin/sh',
  'cmd.exe', // Acesso ao sistema de ficheiros
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

async function handleAnalyze(req, res) {
  let rawBody = '';
  req.on('data', (chunk) => {
    rawBody += chunk;
    if (rawBody.length > 1e6) {
      req.destroy();
    }
  });

  req.on('end', async () => {
    try {
      const body = JSON.parse(rawBody || '{}');
      const { code, language, context = {} } = body;

      // 1. Validação de Input
      if (!code || typeof code !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ERROR', details: 'Código inválido.' }));
        return;
      }

      if (code.length > 5000) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ERROR',
            details: 'O código é demasiado longo para análise (máx 5000 caracteres).',
            hint: 'Tenta analisar funções mais pequenas individualmente.',
          })
        );
        return;
      }

      // 2. Verificação de Segurança
      const cleanCode = code.replace(/\s/g, '');
      if (FORBIDDEN_PATTERNS.some((pattern) => cleanCode.includes(pattern))) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'SECURITY_VIOLATION',
            output: '',
            details: 'ERRO DE SEGURANÇA: O código contém chamadas de sistema ou padrões proibidos.',
            hint: 'Remove chamadas ao sistema, acesso a rede ou ficheiros.',
          })
        );
        return;
      }

      // 3. Configuração da API
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ERROR',
            details: 'Erro de configuração no servidor (GEMINI_API_KEY em falta).',
            hint: 'Configura a variável GEMINI_API_KEY nas configurações da aplicação no Coolify.',
          })
        );
        return;
      }

      // 4. Construção do Prompt
      let promptInstruction = '';
      if (context.hasError) {
        promptInstruction = `
        O código FALHOU na execução real.
        Erro reportado: "${(context.errorMessage || '').substring(0, 1000)}" 
        Output parcial: "${(context.output || '').substring(0, 500)}"
        TAREFA: Explica o erro de compilação ou execução em Português de Portugal.
        `;
      } else if (context.output !== context.expected) {
        promptInstruction = `
        O código correu mas o output está INCORRETO.
        Output Obtido: "${(context.output || '').substring(0, 500)}"
        Output Esperado: "${context.expected || ''}"
        TAREFA: Explica a falha lógica.
        `;
      } else {
        promptInstruction = `
        O servidor de execução está indisponível. Simula a execução e age como compilador.
        Caso de Teste - Input: "${context.input || ''}" | Esperado: "${context.expected || ''}"
        `;
      }

      const fullPrompt = `
        Atua como um Tutor de Programação paciente para estudantes universitários (NEEI UAlg).
        Responde sempre em PORTUGUÊS DE PORTUGAL (pt-PT).
        Sê conciso e pedagógico. Não dês a solução completa, dá dicas.
        
        Linguagem: ${language === 'c' ? 'C (GCC)' : 'Java (OpenJDK)'}
        
        ${promptInstruction}

        CÓDIGO DO ALUNO:
        \`\`\`${language}
        ${code}
        \`\`\`
      `;

      const ai = new GoogleGenAI({ apiKey });
      const responseSchema = {
        type: 'OBJECT',
        properties: {
          status: { type: 'STRING', enum: ['SUCCESS', 'ERROR', 'SECURITY_VIOLATION'] },
          output: { type: 'STRING' },
          details: { type: 'STRING' },
          hint: { type: 'STRING' },
        },
        required: ['status', 'output', 'details', 'hint'],
      };

      const result = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: fullPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
          ],
        },
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(result.text);
    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ERROR',
          details: 'Erro interno ao processar o pedido com a IA.',
          hint: 'Tenta novamente dentro de alguns momentos.',
        })
      );
    }
  });
}

function serveStaticFile(req, res, filePath) {
  // Negociação transparente de WebP: se for pedido .png/.jpg/.jpeg e o browser aceitar WebP,
  // e se existir uma versão .webp correspondente, utiliza diretamente a versão WebP
  const initialExt = path.extname(filePath).toLowerCase();
  let resolvedPath = filePath;
  if (
    (initialExt === '.png' || initialExt === '.jpg' || initialExt === '.jpeg') &&
    req.headers.accept &&
    req.headers.accept.includes('image/webp')
  ) {
    const webpCandidate = filePath.slice(0, -initialExt.length) + '.webp';
    if (fs.existsSync(webpCandidate)) {
      resolvedPath = webpCandidate;
    }
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Se for um pedido de asset estático (ex.: imagem, estilo, script), devolve 404 em vez de index.html
      const ext = path.extname(resolvedPath).toLowerCase();
      const isStaticAssetType = [
        '.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico',
        '.css', '.js', '.mjs', '.woff', '.woff2', '.ttf', '.json'
      ].includes(ext) || resolvedPath.includes(path.join(BUILD_DIR, 'assets'));

      if (isStaticAssetType) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }

      // Fallback para index.html para rotas SPA (React Router)
      const indexPath = path.join(BUILD_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Erro 500: index.html não encontrado. Executaste "npm run build"?');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isImmutableAsset =
      resolvedPath.includes(path.join(BUILD_DIR, 'assets')) && (ext === '.js' || ext === '.css');
    const isImage =
      ext === '.webp' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.svg' || ext === '.ico';
    const isStaticAsset = resolvedPath.includes(path.join(BUILD_DIR, 'assets')) || isImage;

    let cacheControl = 'no-cache';
    if (isImmutableAsset) {
      cacheControl = 'public, max-age=31536000, immutable';
    } else if (isImage) {
      cacheControl = 'public, max-age=2592000, stale-while-revalidate=86400';
    } else if (isStaticAsset) {
      cacheControl = 'public, max-age=3600, stale-while-revalidate=86400';
    }

    const headers = {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    };
    if (resolvedPath !== filePath) {
      headers['Vary'] = 'Accept';
    }

    res.writeHead(200, headers);

    const stream = fs.createReadStream(resolvedPath);
    stream.pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  // Cabeçalhos de segurança em todas as respostas
  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  // Healthcheck para Coolify / Docker
  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
    return;
  }

  // Limitação de taxa para endpoints de escrita
  if (
    req.method === 'POST' ||
    req.method === 'PUT' ||
    req.method === 'PATCH' ||
    req.method === 'DELETE'
  ) {
    if (pathname === '/api/analyze') {
      if (isRateLimited(req, res, analyzeLimiter)) return;
    } else if (pathname.startsWith('/api/admin/login')) {
      if (isRateLimited(req, res, loginLimiter)) return;
    } else if (pathname.startsWith('/api/admin/')) {
      if (isRateLimited(req, res, adminLimiter)) return;
    } else if (
      pathname === '/api/webhooks/stripe' ||
      pathname === '/api/webhooks/ifthenpay' ||
      pathname === '/api/shop/webhook'
    ) {
      // Sem rate-limit estrito para webhook de pagamentos do gateway
    } else if (pathname.startsWith('/api/')) {
      if (isRateLimited(req, res, apiLimiter)) return;
    }
  }

  // API Loja, Sweats, Pré-encomendas e Webhooks Stripe
  if (
    pathname.startsWith('/api/shop/') ||
    pathname.startsWith('/api/admin/shop/') ||
    pathname === '/api/webhooks/stripe' ||
    pathname === '/api/webhooks/ifthenpay'
  ) {
    const handled = await handleShopApi(req, res, pathname, url.searchParams);
    if (handled !== false) return;
  }

  // API Atividades, Colaboradores, Vagas e Administração NEEI
  if (
    pathname.startsWith('/api/activities') ||
    pathname.startsWith('/api/admin/') ||
    pathname.startsWith('/api/collaborators') ||
    pathname.startsWith('/api/jobs') ||
    pathname === '/api/config'
  ) {
    const handled = await handleActivitiesApi(req, res, pathname);
    if (handled !== false) return;
  }

  // API Quack Analyze
  if (pathname === '/api/analyze') {
    if (req.method === 'POST') {
      handleAnalyze(req, res);
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
    return;
  }

  // Ficheiros estáticos
  let cleanPathname = pathname;
  if (cleanPathname.startsWith('/public/')) {
    cleanPathname = cleanPathname.replace('/public/', '/');
  }

  let safePath = path.normalize(path.join(BUILD_DIR, cleanPathname));
  if (!safePath.startsWith(BUILD_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (cleanPathname === '/' || cleanPathname === '') {
    safePath = path.join(BUILD_DIR, 'index.html');
  } else if (!fs.existsSync(safePath)) {
    // Tolerância para variações de extensão de imagem (.jpeg <-> .png <-> .jpg <-> .webp)
    if (safePath.endsWith('.jpeg')) {
      const webpAlt = safePath.replace(/\.jpeg$/, '.webp');
      const pngAlt = safePath.replace(/\.jpeg$/, '.png');
      const jpgAlt = safePath.replace(/\.jpeg$/, '.jpg');
      if (fs.existsSync(webpAlt)) safePath = webpAlt;
      else if (fs.existsSync(pngAlt)) safePath = pngAlt;
      else if (fs.existsSync(jpgAlt)) safePath = jpgAlt;
    } else if (safePath.endsWith('.png')) {
      const webpAlt = safePath.replace(/\.png$/, '.webp');
      const jpegAlt = safePath.replace(/\.png$/, '.jpeg');
      const jpgAlt = safePath.replace(/\.png$/, '.jpg');
      if (fs.existsSync(webpAlt)) safePath = webpAlt;
      else if (fs.existsSync(jpegAlt)) safePath = jpegAlt;
      else if (fs.existsSync(jpgAlt)) safePath = jpgAlt;
    } else if (safePath.endsWith('.jpg')) {
      const webpAlt = safePath.replace(/\.jpg$/, '.webp');
      const pngAlt = safePath.replace(/\.jpg$/, '.png');
      const jpegAlt = safePath.replace(/\.jpg$/, '.jpeg');
      if (fs.existsSync(webpAlt)) safePath = webpAlt;
      else if (fs.existsSync(pngAlt)) safePath = pngAlt;
      else if (fs.existsSync(jpegAlt)) safePath = jpegAlt;
    }
  }

  serveStaticFile(req, res, safePath);
});

server.listen(PORT, HOST, () => {
  console.log(`> NEEI Web Portal running at http://${HOST}:${PORT}`);
  console.log(`> Serving static files from: ${BUILD_DIR}`);
});

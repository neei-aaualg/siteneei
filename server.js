import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const BUILD_DIR = path.resolve(__dirname, 'build');

const FORBIDDEN_PATTERNS = [
  'system(', 'exec(', 'fork(', 'popen(', // Processos C/C++
  'Runtime.getRuntime', 'ProcessBuilder', // Processos Java
  'upload', 'download', 'socket', 'http', 'ftp', // Rede
  'while(1)', 'while(true)', 'for(;;)', // Loops infinitos óbvios
  '/etc/passwd', '/bin/sh', 'cmd.exe' // Acesso ao sistema de ficheiros
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
  req.on('data', chunk => {
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
        res.end(JSON.stringify({
          status: 'ERROR',
          details: 'O código é demasiado longo para análise (máx 5000 caracteres).',
          hint: 'Tenta analisar funções mais pequenas individualmente.'
        }));
        return;
      }

      // 2. Verificação de Segurança
      const cleanCode = code.replace(/\s/g, '');
      if (FORBIDDEN_PATTERNS.some(pattern => cleanCode.includes(pattern))) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'SECURITY_VIOLATION',
          output: '',
          details: 'ERRO DE SEGURANÇA: O código contém chamadas de sistema ou padrões proibidos.',
          hint: 'Remove chamadas ao sistema, acesso a rede ou ficheiros.'
        }));
        return;
      }

      // 3. Configuração da API
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ERROR',
          details: 'Erro de configuração no servidor (GEMINI_API_KEY em falta).',
          hint: 'Configura a variável GEMINI_API_KEY nas configurações da aplicação no Coolify.'
        }));
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
        required: ['status', 'output', 'details', 'hint']
      };

      const result = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: fullPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
          ]
        }
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(result.text);

    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ERROR',
        details: 'Erro interno ao processar o pedido com a IA.',
        hint: 'Tenta novamente dentro de alguns momentos.'
      }));
    }
  });
}

function serveStaticFile(req, res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
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
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isAsset = filePath.includes(path.join(BUILD_DIR, 'assets'));

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': isAsset ? 'public, max-age=31536000, immutable' : 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  // CORS Headers se necessário
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
  let safePath = path.normalize(path.join(BUILD_DIR, pathname));
  if (!safePath.startsWith(BUILD_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (pathname === '/' || pathname === '') {
    safePath = path.join(BUILD_DIR, 'index.html');
  }

  serveStaticFile(req, res, safePath);
});

server.listen(PORT, HOST, () => {
  console.log(`> NEEI Web Portal running at http://${HOST}:${PORT}`);
  console.log(`> Serving static files from: ${BUILD_DIR}`);
});

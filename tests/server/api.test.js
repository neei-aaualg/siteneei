// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:http';
import { PassThrough } from 'node:stream';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let server;
let base;
let api;
let tmpDir;
const originalDbPath = process.env.DATABASE_PATH;
const originalAdminPassword = process.env.ADMIN_PASSWORD;

async function boot() {
  vi.resetModules();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neei-api-test-'));
  process.env.DATABASE_PATH = path.join(tmpDir, 'api.db');
  process.env.ADMIN_PASSWORD = 'senha-teste';
  delete process.env.SHOW_CALENDAR;
  delete process.env.VITE_SHOW_CALENDAR;

  api = await import('../../server/api.js');

  server = createServer((req, res) => {
    api
      .handleActivitiesApi(
        req,
        res,
        decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname)
      )
      .then((handled) => {
        if (handled === false) {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      })
      .catch(() => {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Erro interno no servidor' }));
        }
      });
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (address && typeof address === 'object') {
    base = `http://127.0.0.1:${address.port}`;
  } else {
    throw new Error('Falha ao iniciar servidor de testes');
  }
}

async function post(target, body, token) {
  return fetch(base + target, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function getJson(target, token) {
  const res = await fetch(base + target, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, headers: res.headers, body: await res.json() };
}

beforeEach(async () => {
  await boot();
});

afterEach(async () => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  if (originalDbPath === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = originalDbPath;
  if (originalAdminPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = originalAdminPassword;
  delete process.env.SHOW_CALENDAR;
  delete process.env.VITE_SHOW_CALENDAR;
  vi.restoreAllMocks();
});

describe('server/api - /api/config', () => {
  it('devolve showCalendar a true por omissão', async () => {
    const { status, body } = await getJson('/api/config');
    expect(status).toBe(200);
    expect(body).toEqual({ showCalendar: true });
  });

  it('respeita SHOW_CALENDAR=false', async () => {
    process.env.SHOW_CALENDAR = 'false';
    const { body } = await getJson('/api/config');
    expect(body).toEqual({ showCalendar: false });
  });
});

describe('server/api - atividades públicas', () => {
  it('lista atividades a decorrer e futuras', async () => {
    const { status, body } = await getJson('/api/activities');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('registrations_count');
    expect(body.some((a) => a.id === 'act-workshop-intro-prog-1')).toBe(true);
  });

  it('devolve lista vazia quando o calendário está oculto', async () => {
    process.env.SHOW_CALENDAR = 'false';
    const { body } = await getJson('/api/activities');
    expect(body).toEqual([]);
  });
});

describe('server/api - inscrições', () => {
  it('inscreve um aluno com sucesso (201)', async () => {
    const res = await post('/api/activities/register', {
      activityId: 'act-workshop-intro-prog-1',
      name: 'João Silva',
      studentNumber: '74123',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.registration.studentNumber).toBe('a74123');
  });

  it('rejeita inscrições duplicadas (409)', async () => {
    await post('/api/activities/register', {
      activityId: 'act-workshop-intro-prog-1',
      name: 'João Silva',
      studentNumber: '74123',
    });
    const res = await post('/api/activities/register', {
      activityId: 'act-workshop-intro-prog-1',
      name: 'João Silva',
      studentNumber: 'a74123',
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('a74123');
  });

  it('valida o número de aluno (400)', async () => {
    const res = await post('/api/activities/register', {
      activityId: 'act-workshop-intro-prog-1',
      name: 'João Silva',
      studentNumber: 'xx',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Número de aluno');
  });

  it('devolve 400 para JSON inválido', async () => {
    const res = await fetch(base + '/api/activities/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{não é json',
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Formato JSON inválido');
  });

  it('devolve 404 para rotas não tratadas', async () => {
    const res = await fetch(base + '/api/nao-existe', {});
    expect(res.status).toBe(404);
  });
});

describe('server/api - readJsonBody', () => {
  it('resolve o corpo JSON', async () => {
    const req = new PassThrough();
    req.write('{"chave":"valor"}');
    req.end();
    await expect(api.readJsonBody(req)).resolves.toEqual({ chave: 'valor' });
  });

  it('resolve objeto vazio para corpo vazio', async () => {
    const req = new PassThrough();
    req.end();
    await expect(api.readJsonBody(req)).resolves.toEqual({});
  });
});

describe('server/api - candidaturas e vagas', () => {
  it('aceita candidaturas a colaborador e lista no admin', async () => {
    const res = await post('/api/collaborators/apply', {
      name: 'Maria Silva',
      student_number: '74123',
      email: '',
      phone: '912345678',
      course: 'LEI (Licenciatura em Eng. Informática)',
      academic_year: '3º Ano',
      motivation: 'Quero ser colaboradora do NEEI!',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.application.email).toBe('a74123@ualg.pt');

    // Autentica para consultar o painel
    const loginRes = await post('/api/admin/login', { password: 'senha-teste' });
    expect(loginRes.status).toBe(200);
    const { token } = await loginRes.json();

    const admin = await getJson('/api/admin/collaborators', token);
    expect(admin.body).toHaveLength(1);
  });

  it('aceita ofertas de emprego e publica-as apenas quando aprovadas', async () => {
    const res = await post('/api/jobs/submit', {
      company: 'Empresa X',
      title: 'Estágio em Desenvolvimento',
      type: 'Estágio',
      location: 'Faro',
      email: 'rh@empresa.pt',
      phone: '+351 912 345 678',
      description: 'Oportunidade para estudantes de informática.',
    });
    expect(res.status).toBe(201);
    const submitted = await res.json();
    const jobId = submitted.job.id;

    // Ainda não publicada
    const publicJobs = await getJson('/api/jobs');
    expect(publicJobs.body).toHaveLength(0);

    // Login admin e publicar
    const loginRes = await post('/api/admin/login', { password: 'senha-teste' });
    const { token } = await loginRes.json();

    const statusRes = await post(
      '/api/admin/jobs/status',
      { id: jobId, status: 'published', notes: 'OK' },
      token
    );
    expect(statusRes.status).toBe(200);

    const published = await getJson('/api/jobs');
    expect(published.body).toHaveLength(1);
    expect(published.body[0].id).toBe(jobId);
  });
});

describe('server/api - administração', () => {
  it('protege rotas admin sem token (401)', async () => {
    const { status } = await getJson('/api/admin/activities');
    expect(status).toBe(401);
  });

  it('rejeita credenciais incorretas', async () => {
    const res = await post('/api/admin/login', { password: 'errada' });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Senha de equipa incorreta');
  });

  it('gerir estados de atividades e inscrições', async () => {
    const loginRes = await post('/api/admin/login', { password: 'senha-teste' });
    const { token } = await loginRes.json();

    // Cria atividade concluída (não deve aparecer publicamente)
    const createRes = await post(
      '/api/admin/activities',
      {
        id: 'act-api-teste',
        title: 'Atividade de Teste',
        description: 'Descrição de teste.',
        category: 'Workshop',
        status: 'completed',
        date: '2026-05-01',
        time: '10:00 - 12:00',
        location: 'Sala X',
      },
      token
    );
    expect(createRes.status).toBe(200);

    const publics = await getJson('/api/activities');
    expect(publics.body.some((a) => a.id === 'act-api-teste')).toBe(false);

    // Inscreve um aluno e remove a inscrição pelo admin
    const regRes = await post('/api/activities/register', {
      activityId: 'act-workshop-intro-prog-1',
      name: 'Ana Silva',
      studentNumber: '77777',
    });
    const { registration } = await regRes.json();

    const delRes = await fetch(base + `/api/admin/registrations/${registration.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.success).toBe(true);

    // Estado público deixa de contar
    const after = await getJson('/api/activities');
    const act = after.body.find((a) => a.id === 'act-workshop-intro-prog-1');
    expect(act.registrations_count).toBe(0);
  });
});

describe('server/api - sendJson', () => {
  it('envia Cache-Control: no-store', async () => {
    const { headers } = await getJson('/api/config');
    expect(headers.get('cache-control')).toBe('no-store');
    expect(headers.get('content-type')).toContain('application/json');
  });
});

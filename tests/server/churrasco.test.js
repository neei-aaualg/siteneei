// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let server;
let base;
let churrascoApi;
let db;
let auth;
let tmpDir;
let adminToken;

async function postJson(pathname, data, headers = {}) {
  const res = await fetch(`${base}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function getJson(pathname, headers = {}) {
  const res = await fetch(`${base}${pathname}`, {
    headers,
  });
  const body = await res.json();
  return { status: res.status, body };
}

describe('Churrasco NEEI - Backend & API', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neei-churr-test-'));
    process.env.DATABASE_PATH = path.join(tmpDir, 'churrasco.db');
    process.env.ADMIN_PASSWORD = 'senha-secreta-teste';
    delete process.env.SHOW_CHURRASCO;
    delete process.env.VITE_SHOW_CHURRASCO;

    churrascoApi = await import('../../server/churrascoApi.js');
    db = await import('../../server/db.js');
    auth = await import('../../server/auth.js');

    const authRes = auth.authenticateAdmin('senha-secreta-teste');
    adminToken = authRes.token;

    server = createServer((req, res) => {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      churrascoApi
        .handleChurrascoApi(req, res, decodeURIComponent(url.pathname), url.searchParams)
        .then((handled) => {
          if (handled === false) {
            res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Not found' }));
          }
        })
        .catch((err) => {
          if (!res.headersSent) {
            res.writeHead(err.statusCode || 500, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: err.message || 'Erro interno' }));
          }
        });
    });

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    base = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    try {
      if (db && db.db && typeof db.db.close === 'function') {
        db.db.close();
      }
    } catch {
      // Ignora erro de fecho
    }
    try {
      if (tmpDir && fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    } catch {
      // Ignora erro de lock no Windows
    }
  });

  describe('Base de Dados & Lógica de Negócio (db.js)', () => {
    it('valida campos obrigatórios ao criar encomenda de churrasco', () => {
      // Nome inválido
      expect(() => {
        db.preparePendingChurrascoOrder({
          student_name: 'Di',
          student_email: 'diogo@ualg.pt',
          phone_number: '912345678',
        });
      }).toThrow(/Nome do aluno é obrigatório/);

      // Email inválido
      expect(() => {
        db.preparePendingChurrascoOrder({
          student_name: 'Diogo Rodrigues',
          student_email: 'email-invalido',
          phone_number: '912345678',
        });
      }).toThrow(/Email de contacto válido/);

      // Telemóvel inválido (não começa por 9)
      expect(() => {
        db.preparePendingChurrascoOrder({
          student_name: 'Diogo Rodrigues',
          student_email: 'diogo@ualg.pt',
          phone_number: '289123456',
        });
      }).toThrow(/Número de telemóvel inválido/);
    });

    it('calcula o preço correto com 4,50€ por passe e gera código de bilhete único', () => {
      const order1 = db.preparePendingChurrascoOrder({
        student_name: 'Diogo Rodrigues',
        student_email: 'diogo@ualg.pt',
        phone_number: '912345678',
        drink_preference: 'Cerveja',
        quantity: 1,
      });

      expect(order1).toBeDefined();
      expect(order1.unit_price).toBe(4.5);
      expect(order1.total_amount).toBe(4.5);
      expect(order1.quantity).toBe(1);
      expect(order1.ticket_code).toMatch(/^CH-[A-Z0-9]{4}$/);
      expect(order1.payment_status).toBe('pending');
      expect(order1.check_in).toBe(0);

      // 2 passes = 9,00€
      const order2 = db.preparePendingChurrascoOrder({
        student_name: 'Ana Pereira',
        student_email: 'ana@ualg.pt',
        phone_number: '961234567',
        drink_preference: 'Refrigerante',
        quantity: 2,
      });
      expect(order2.total_amount).toBe(9.0);
      expect(order2.quantity).toBe(2);
      expect(order2.ticket_code).not.toBe(order1.ticket_code);
    });

    it('confirma pagamento e regista data e referência', () => {
      const order = db.preparePendingChurrascoOrder({
        student_name: 'Carlos Silva',
        student_email: 'carlos@ualg.pt',
        phone_number: '931234567',
        quantity: 1,
      });

      const confirmed = db.confirmChurrascoOrderPayment(order.id, 'pi_stripe_12345');
      expect(confirmed.payment_status).toBe('paid');
      expect(confirmed.payment_ref).toBe('pi_stripe_12345');
      expect(confirmed.paid_at).toBeDefined();
    });

    it('permite alternar estado de check-in (levantamento no bar)', () => {
      const order = db.preparePendingChurrascoOrder({
        student_name: 'Beatriz Costa',
        student_email: 'beatriz@ualg.pt',
        phone_number: '921234567',
      });
      db.confirmChurrascoOrderPayment(order.id, 'ref_test');

      const checkedIn = db.toggleChurrascoCheckIn(order.id, true);
      expect(checkedIn.check_in).toBe(1);
      expect(checkedIn.check_in_at).toBeDefined();

      const unchecked = db.toggleChurrascoCheckIn(order.id, false);
      expect(unchecked.check_in).toBe(0);
      expect(unchecked.check_in_at).toBeNull();
    });

    it('permite criar vendas manuais pela equipa de administração', () => {
      const manual = db.createAdminManualChurrascoOrder({
        student_name: 'Aluno Presencial',
        student_email: 'presencial@neei.pt',
        phone_number: '911111111',
        drink_preference: 'Cerveja',
        quantity: 1,
        notes: 'Pago com nota de 5€',
      });

      expect(manual.is_admin_created).toBe(1);
      expect(manual.payment_status).toBe('paid');
      expect(manual.payment_provider).toBe('manual');
      expect(manual.admin_notes).toBe('Pago com nota de 5€');
    });

    it('controla a visibilidade pública da aba de churrasco', () => {
      expect(db.isChurrascoVisible()).toBe(true);

      db.setChurrascoVisibility(false);
      expect(db.isChurrascoVisible()).toBe(false);

      db.setChurrascoVisibility(true);
      expect(db.isChurrascoVisible()).toBe(true);
    });
  });

  describe('Endpoints REST (churrascoApi.js)', () => {
    it('GET /api/churrasco/status devolve estado e preço de 4.50€', async () => {
      const { status, body } = await getJson('/api/churrasco/status');
      expect(status).toBe(200);
      expect(body.visible).toBe(true);
      expect(body.unitPrice).toBe(4.5);
      expect(body.includes.food).toContain('Bifana');
    });

    it('POST /api/churrasco/checkout cria pedido e confirma em sandbox', async () => {
      const { status, body } = await postJson('/api/churrasco/checkout', {
        student_name: 'Mariana Duarte',
        student_email: 'mariana@ualg.pt',
        phone_number: '919876543',
        drink_preference: 'Cerveja',
        quantity: 1,
      });

      expect(status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.orderId).toBeDefined();
      expect(body.ticketCode).toMatch(/^CH-/);
      expect(body.checkoutUrl).toContain('success=1');
    });

    it('GET /api/churrasco/order/:id devolve o bilhete consultado', async () => {
      const order = db.preparePendingChurrascoOrder({
        student_name: 'Tiago Ramos',
        student_email: 'tiago@ualg.pt',
        phone_number: '965432198',
        quantity: 1,
      });

      const { status, body } = await getJson(`/api/churrasco/order/${order.id}`);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.order.studentName).toBe('Tiago Ramos');
      expect(body.order.ticketCode).toBe(order.ticket_code);
    });

    it('bloqueia checkout quando o churrasco estiver desativado', async () => {
      db.setChurrascoVisibility(false);

      const { status, body } = await postJson('/api/churrasco/checkout', {
        student_name: 'Rui Fernandes',
        student_email: 'rui@ualg.pt',
        phone_number: '912345678',
        quantity: 1,
      });

      expect(status).toBe(400);
      expect(body.error).toContain('encerradas');
    });

    it('protege rotas de administração contra acesso não autenticado', async () => {
      const getAdminRes = await getJson('/api/admin/churrasco');
      expect(getAdminRes.status).toBe(401);

      const toggleRes = await postJson('/api/admin/churrasco/toggle-visibility', { visible: false });
      expect(toggleRes.status).toBe(401);

      const checkInRes = await postJson('/api/admin/churrasco/check-in', { orderId: '1', status: true });
      expect(checkInRes.status).toBe(401);
    });

    it('permite ao admin consultar estatísticas e alterar visibilidade da aba', async () => {
      const authHeader = { Authorization: `Bearer ${adminToken}` };

      // Consulta dados
      const { status: listStatus, body: listBody } = await getJson('/api/admin/churrasco', authHeader);
      expect(listStatus).toBe(200);
      expect(listBody.success).toBe(true);
      expect(listBody.stats).toBeDefined();

      // Altera visibilidade para false
      const { status: toggleStatus, body: toggleBody } = await postJson(
        '/api/admin/churrasco/toggle-visibility',
        { visible: false },
        authHeader
      );
      expect(toggleStatus).toBe(200);
      expect(toggleBody.visible).toBe(false);
      expect(db.isChurrascoVisible()).toBe(false);

      // Reativa visibilidade
      const { body: reactivateBody } = await postJson(
        '/api/admin/churrasco/toggle-visibility',
        { visible: true },
        authHeader
      );
      expect(reactivateBody.visible).toBe(true);
      expect(db.isChurrascoVisible()).toBe(true);
    });

    it('permite ao admin registar venda manual e alternar check-in', async () => {
      const authHeader = { Authorization: `Bearer ${adminToken}` };

      const { status: manualStatus, body: manualBody } = await postJson(
        '/api/admin/churrasco/manual-order',
        {
          student_name: 'Estudante Balcão',
          student_email: 'balcao@neei.pt',
          phone_number: '910000000',
          quantity: 2,
          drink_preference: 'Cerveja',
          notes: 'Pagou 9€ ao staff',
        },
        authHeader
      );

      expect(manualStatus).toBe(201);
      expect(manualBody.order.quantity).toBe(2);
      expect(manualBody.order.total_amount).toBe(9.0);

      // Check-in
      const { status: checkStatus, body: checkBody } = await postJson(
        '/api/admin/churrasco/check-in',
        { orderId: manualBody.order.id, status: true },
        authHeader
      );
      expect(checkStatus).toBe(200);
      expect(checkBody.order.check_in).toBe(1);
    });
  });
});

// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmpDir;
let db;
let emailService;
let shopApi;
const originalDbPath = process.env.DATABASE_PATH;
const originalAdminPassword = process.env.ADMIN_PASSWORD;

beforeEach(async () => {
  vi.resetModules();
  vi.spyOn(console, 'log').mockImplementation(() => { });
  vi.spyOn(console, 'warn').mockImplementation(() => { });
  vi.spyOn(console, 'error').mockImplementation(() => { });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neei-shop-test-'));
  process.env.DATABASE_PATH = path.join(tmpDir, 'shop_test.db');
  process.env.ADMIN_PASSWORD = 'test-admin-secret';

  db = await import('../../server/db.js');
  emailService = await import('../../server/services/emailService.js');
  shopApi = await import('../../server/shopApi.js');
});

afterEach(() => {
  vi.restoreAllMocks();
  try {
    if (db && db.db && typeof db.db.close === 'function') {
      db.db.close();
    }
  } catch (e) {
    void e;
  }
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {
    void e;
  }
  if (originalDbPath === undefined) {
    delete process.env.DATABASE_PATH;
  } else {
    process.env.DATABASE_PATH = originalDbPath;
  }
  if (originalAdminPassword === undefined) {
    delete process.env.ADMIN_PASSWORD;
  } else {
    process.env.ADMIN_PASSWORD = originalAdminPassword;
  }
  vi.useRealTimers();
});

describe('Loja NEEI - Base de Dados & Pré-encomendas', () => {
  it('inicializa a campanha de pré-encomenda das sweats por omissão', () => {
    const campaign = db.getActiveShopCampaign();
    expect(campaign).toBeTruthy();
    expect(campaign.is_active).toBe(true);
    expect(campaign.item_price).toBe(25.0);
    expect(campaign.shipping_fee).toBe(3.5);
    expect(campaign.sizes_available).toContain('M');
    expect(campaign.sizes_available).toContain('L');
  });

  it('cria uma encomenda para recolha presencial no gabinete (0€ portes)', () => {
    const order = db.createShopOrder({
      student_name: 'David Rodrigues',
      student_email: 'aXXXXX@ualg.pt',
      phone_number: '912345678',
      nif: '123456789',
      size: 'L',
      delivery_type: 'pickup',
    });

    expect(order).toBeTruthy();
    expect(order.id).toMatch(/^SW-\d{4}-\d{4}$/);
    expect(order.item_price).toBe(25.0);
    expect(order.shipping_fee).toBe(0);
    expect(order.total_amount).toBe(25.0);
    expect(order.payment_status).toBe('pending');
    expect(order.delivery_type).toBe('pickup');
    expect(order.size).toBe('L');
  });

  it('cria uma encomenda com envio por correio CTT (+3.50€ portes)', () => {
    const order = db.createShopOrder({
      student_name: 'Maria Silva',
      student_email: 'maria@ualg.pt',
      phone_number: '965432100',
      size: 'S',
      delivery_type: 'shipping',
      shipping_address: 'Rua de Faro, Nº 12',
      shipping_postal_code: '8000-100',
      shipping_city: 'Faro',
    });

    expect(order).toBeTruthy();
    expect(order.shipping_fee).toBe(3.5);
    expect(order.total_amount).toBe(28.5);
    expect(order.delivery_type).toBe('shipping');
    expect(order.shipping_city).toBe('Faro');
  });

  it('rejeita encomendas com tamanho inválido ou campos em falta', () => {
    expect(() => {
      db.createShopOrder({
        student_name: 'David Rodrigues',
        student_email: 'david@ualg.pt',
        phone_number: '912345678',
        size: 'XXXXXL', // Inexistente
      });
    }).toThrow(/Tamanho inválido/);

    expect(() => {
      db.createShopOrder({
        student_name: 'Ab', // Muito curto
        student_email: 'david@ualg.pt',
        phone_number: '912345678',
        size: 'M',
      });
    }).toThrow(/Nome do aluno é obrigatório/);

    expect(() => {
      db.createShopOrder({
        student_name: 'David Rodrigues',
        student_email: 'email-invalido',
        phone_number: '912345678',
        size: 'M',
      });
    }).toThrow(/Email de contacto válido/);

    expect(() => {
      db.createShopOrder({
        student_name: 'David Rodrigues',
        student_email: 'david@ualg.pt',
        phone_number: '12345', // Não é número PT válido
        size: 'M',
      });
    }).toThrow(/Número de telemóvel inválido/);
  });

  it('atualiza o estado de pagamento para pago e reflete nas estatísticas de produção', () => {
    const order1 = db.createShopOrder({
      student_name: 'David Rodrigues',
      student_email: 'aluno1@ualg.pt',
      phone_number: '912345678',
      size: 'L',
      delivery_type: 'pickup',
    });

    const order2 = db.createShopOrder({
      student_name: 'Ana Santos',
      student_email: 'aluno2@ualg.pt',
      phone_number: '923456789',
      size: 'M',
      delivery_type: 'shipping',
      shipping_address: 'Av. 5 de Outubro',
      shipping_postal_code: '8000-077',
      shipping_city: 'Faro',
    });

    // Marca order1 e order2 como pagas
    db.updateShopOrderPaymentStatus(order1.id, 'paid', 'ref-mbway-1');
    db.updateShopOrderPaymentStatus(order2.id, 'paid', 'ref-mbway-2');

    const stats = db.getShopSummaryStats();
    expect(stats.totalPaidOrders).toBe(2);
    expect(stats.totalRevenue).toBe(53.5); // 25.0 + 28.5
    expect(stats.sizeCounts.L).toBe(1);
    expect(stats.sizeCounts.M).toBe(1);
    expect(stats.sizeCounts.S).toBe(0);
    expect(stats.pickupCount).toBe(1);
    expect(stats.shippingCount).toBe(1);

    const factoryData = db.getFactoryExportData();
    expect(factoryData).toHaveLength(2);
    expect(factoryData.map((d) => d.tamanho)).toContain('L');
    expect(factoryData.map((d) => d.tamanho)).toContain('M');
  });

  it('dispara o envio do email de confirmação sem lançar erro em modo dry-run', async () => {
    const order = db.createShopOrder({
      student_name: 'David Rodrigues',
      student_email: 'teste@ualg.pt',
      phone_number: '912345678',
      size: 'M',
      delivery_type: 'pickup',
    });

    const emailRes = await emailService.sendOrderConfirmationEmail(order);
    expect(emailRes.success).toBe(true);
    expect(emailRes.messageId).toBeTruthy();
  });

  it('respeita SWEATS_AVAILABLE=f ou false tornando as sweats indisponíveis, ocultando foto e bloqueando encomendas', () => {
    process.env.SWEATS_AVAILABLE = 'f';

    const campaign = db.getActiveShopCampaign();
    expect(campaign.is_available).toBe(false);
    expect(campaign.image_url).toBeNull();

    expect(() => {
      db.createShopOrder({
        student_name: 'David Rodrigues',
        student_email: 'teste@ualg.pt',
        phone_number: '912345678',
        size: 'M',
        delivery_type: 'pickup',
      });
    }).toThrow(/disponíveis brevemente.*instagram/i);

    delete process.env.SWEATS_AVAILABLE;
  });

  it('permite modo de teste com preço a 0.50€ quando SHOW_TEST_SHOP está ativo e isAdminPreview é true', () => {
    process.env.SHOW_TEST_SHOP = 'true';
    process.env.SWEATS_AVAILABLE = 'false';

    const campaign = db.getActiveShopCampaign(true);
    expect(campaign.is_available).toBe(true);
    expect(campaign.item_price).toBe(0.50);
    expect(campaign.isAdminPreview).toBe(true);

    const order = db.createShopOrder(
      {
        student_name: 'David Rodrigues',
        student_email: 'teste@ualg.pt',
        phone_number: '912345678',
        size: 'M',
        delivery_type: 'pickup',
      },
      true
    );
    expect(order.item_price).toBe(0.50);
    expect(order.total_amount).toBe(0.50);

    delete process.env.SHOW_TEST_SHOP;
    delete process.env.SWEATS_AVAILABLE;
  });

  it('bloqueia modo de teste quando SHOW_TEST_SHOP=false mesmo com isAdminPreview=true', () => {
    process.env.SHOW_TEST_SHOP = 'false';
    process.env.SWEATS_AVAILABLE = 'false';

    const campaign = db.getActiveShopCampaign(true);
    expect(campaign.is_available).toBe(false);
    expect(campaign.isAdminPreview).toBe(false);
    expect(campaign.item_price).toBe(25);

    expect(() => {
      db.createShopOrder(
        {
          student_name: 'David Rodrigues',
          student_email: 'teste@ualg.pt',
          phone_number: '912345678',
          size: 'M',
          delivery_type: 'pickup',
        },
        true
      );
    }).toThrow(/disponíveis brevemente.*instagram/i);

    delete process.env.SHOW_TEST_SHOP;
    delete process.env.SWEATS_AVAILABLE;
  });

  it('suporta o estado operacional test e permite atualização em lote de múltiplas encomendas', () => {
    const o1 = db.recordPaidShopOrder(
      db.preparePendingShopOrder({
        student_name: 'Teste Um',
        student_email: 'um@ualg.pt',
        phone_number: '912345671',
        size: 'S',
        delivery_type: 'pickup',
      }),
      'ref-teste-1'
    );
    const o2 = db.recordPaidShopOrder(
      db.preparePendingShopOrder({
        student_name: 'Teste Dois',
        student_email: 'dois@ualg.pt',
        phone_number: '912345672',
        size: 'L',
        delivery_type: 'pickup',
      }),
      'ref-teste-2'
    );

    // Teste de atualização individual para 'test'
    const success1 = db.updateShopOrderStatus(o1.id, 'test');
    expect(success1).toBe(true);
    expect(db.getShopOrderById(o1.id).order_status).toBe('test');

    // Teste de atualização em lote para 'in_production'
    const changes = db.updateMultipleShopOrderStatus([o1.id, o2.id], 'in_production');
    expect(changes).toBe(2);
    expect(db.getShopOrderById(o1.id).order_status).toBe('in_production');
    expect(db.getShopOrderById(o2.id).order_status).toBe('in_production');

    // Teste de atualização em lote para 'test'
    const changesTest = db.updateMultipleShopOrderStatus([o1.id, o2.id], 'test');
    expect(changesTest).toBe(2);
    expect(db.getShopOrderById(o1.id).order_status).toBe('test');
    expect(db.getShopOrderById(o2.id).order_status).toBe('test');
  });

  it('inicia pedido de pagamento Stripe em modo sandbox e processa webhook de sucesso', async () => {
    const paymentService = await import('../../server/services/paymentService.js');
    expect(paymentService.isPaymentSandbox()).toBe(true);

    const order = db.createShopOrder({
      student_name: 'David Rodrigues',
      student_email: 'david@ualg.pt',
      phone_number: '912345678',
      size: 'M',
      delivery_type: 'pickup',
    });

    const paymentRes = await paymentService.initiateMbWayPayment({
      orderId: order.id,
      amount: order.total_amount,
      mobileNumber: order.phone_number,
      studentEmail: order.student_email,
      studentName: order.student_name,
    });

    expect(paymentRes.success).toBe(true);
    expect(paymentRes.provider).toBe('stripe_sandbox');
    expect(paymentRes.paymentIntentId).toContain(order.id);

    // Simula evento de webhook da Stripe (payment_intent.succeeded)
    const webhookPayload = JSON.stringify({
      id: 'evt_test_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: paymentRes.paymentIntentId,
          metadata: {
            order_id: order.id,
          },
        },
      },
    });

    const verifiedEvent = paymentService.verifyStripeWebhook(webhookPayload);
    expect(verifiedEvent.type).toBe('payment_intent.succeeded');
    expect(verifiedEvent.data.object.metadata.order_id).toBe(order.id);
  });

  it('nunca regista a encomenda na base de dados a menos que o pagamento esteja confirmado', () => {
    const pending = db.preparePendingShopOrder({
      student_name: 'David Desistente',
      student_email: 'desistente@ualg.pt',
      phone_number: '912345678',
      size: 'M',
      delivery_type: 'pickup',
    });

    // 1. A encomenda pendente NÃO existe na tabela shop_orders
    expect(db.getShopOrderById(pending.id)).toBeNull();

    // 2. Não aparece na listagem administrativa por omissão
    const list = db.getAllShopOrders();
    expect(list.find((o) => o.id === pending.id)).toBeUndefined();

    // 3. Só passa a constar na tabela quando o pagamento for confirmado como pago
    const paid = db.recordPaidShopOrder(pending, 'pi_stripe_confirmed');
    expect(paid).toBeTruthy();
    expect(paid.payment_status).toBe('paid');

    const inDb = db.getShopOrderById(pending.id);
    expect(inDb).toBeTruthy();
    expect(inDb.payment_status).toBe('paid');
    expect(inDb.student_name).toBe('David Desistente');

    // 4. Agora sim consta na listagem da tabela
    const updatedList = db.getAllShopOrders();
    expect(updatedList.find((o) => o.id === pending.id)).toBeTruthy();
  });

  it('suporta rastreio e consulta de encomenda por ID ignorando maiúsculas/minúsculas e prefixo #', async () => {
    const pending = db.preparePendingShopOrder({
      student_name: 'Maria Rastreio',
      student_email: 'maria@ualg.pt',
      phone_number: '919876543',
      size: 'S',
      delivery_type: 'pickup',
    });

    const paid = db.recordPaidShopOrder(pending, 'pi_stripe_track_test');
    expect(paid).toBeTruthy();

    // 1. Consulta no db.js com minúsculas e com '#'
    const byLower = db.getShopOrderById(paid.id.toLowerCase());
    expect(byLower).toBeTruthy();
    expect(byLower.student_name).toBe('Maria Rastreio');

    const byHash = db.getShopOrderById(`#${paid.id}`);
    expect(byHash).toBeTruthy();
    expect(byHash.student_name).toBe('Maria Rastreio');

    // 2. Consulta via handleShopApi (/api/shop/track e /api/shop/order-status)
    let statusCode = 0;
    let jsonBody = null;
    const fakeRes = {
      writeHead: (code) => {
        statusCode = code;
      },
      end: (data) => {
        jsonBody = JSON.parse(data);
      },
    };

    const handled = await shopApi.handleShopApi(
      { method: 'GET', headers: {} },
      fakeRes,
      `/api/shop/track/${paid.id.toLowerCase()}`
    );

    expect(handled).toBe(true);
    expect(statusCode).toBe(200);
    expect(jsonBody.orderId).toBe(paid.id);
    expect(jsonBody.orderStatus).toBe('confirmed');
    expect(jsonBody.paymentStatus).toBe('paid');
    expect(jsonBody.studentName).toBe('Maria Rastreio');
    expect(jsonBody.size).toBe('S');
    expect(jsonBody.pickupLocation).toBeTruthy();
  });

  it('permite ao admin criar encomendas manuais com tag is_admin_created e notas', async () => {
    const manualOrder = db.createAdminManualOrder({
      student_name: 'Admin Teste',
      student_email: 'admintest@ualg.pt',
      phone_number: '912345678',
      nif: '123456789',
      size: 'L',
      color: 'Preto',
      delivery_type: 'shipping',
      shipping_address: 'Campus de Gambelas, Gabinete NEEI',
      shipping_postal_code: '8005-139',
      shipping_city: 'Faro, Faro',
      item_price: 20,
      shipping_fee: 4.5,
      total_amount: 24.5,
      payment_status: 'paid',
      order_status: 'confirmed',
      admin_notes: 'Pago em numerário',
    });

    expect(manualOrder).toBeTruthy();
    expect(manualOrder.is_admin_created).toBe(true);
    expect(manualOrder.admin_notes).toBe('Pago em numerário');
    expect(manualOrder.payment_status).toBe('paid');
    expect(manualOrder.shipping_city).toBe('Faro, Faro');

    // Verifica que getShopOrders inclui a tag
    const orders = db.getShopOrders();
    const found = orders.find((o) => o.id === manualOrder.id);
    expect(found).toBeTruthy();
    expect(found.is_admin_created).toBe(true);
    expect(found.admin_notes).toBe('Pago em numerário');

    // Verifica que export-factory inclui a origem e notas
    const factoryRows = db.getFactoryExportData();
    const factoryRow = factoryRows.find((r) => r.id === manualOrder.id);
    expect(factoryRow).toBeTruthy();
    expect(factoryRow.origem).toBe('Manual (Admin)');
    expect(factoryRow.notas).toBe('Pago em numerário');
  });

  it('cria encomenda manual através do endpoint POST /api/admin/shop/orders', async () => {
    let statusCode = 0;
    let jsonBody = null;
    const fakeRes = {
      writeHead: (code) => {
        statusCode = code;
      },
      end: (data) => {
        jsonBody = JSON.parse(data);
      },
    };

    const auth = await import('../../server/auth.js');
    const { token } = auth.authenticateAdmin('test-admin-secret');

    const payload = {
      student_name: 'Manuel Gabinete',
      student_email: 'manuel@ualg.pt',
      phone_number: '965432100',
      size: 'XL',
      delivery_type: 'pickup',
      payment_status: 'paid',
      admin_notes: 'Entrega em mão no dia aberto',
      send_email: false,
    };

    const handled = await shopApi.handleShopApi(
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: payload,
      },
      fakeRes,
      '/api/admin/shop/orders'
    );

    expect(handled).toBe(true);
    expect(statusCode).toBe(201);
    expect(jsonBody.success).toBe(true);
    expect(jsonBody.order).toBeTruthy();
    expect(jsonBody.order.is_admin_created).toBe(true);
    expect(jsonBody.order.admin_notes).toBe('Entrega em mão no dia aberto');
    expect(jsonBody.order.student_name).toBe('Manuel Gabinete');
  });
});

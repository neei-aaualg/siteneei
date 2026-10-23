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
    expect(order.payment_fee).toBe(0.63);
    expect(order.total_amount).toBe(25.63);
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
    expect(order.payment_fee).toBe(0.68);
    expect(order.total_amount).toBe(29.18);
    expect(order.delivery_type).toBe('shipping');
    expect(order.shipping_city).toBe('Faro');
  });

  it('calcula corretamente a taxa de pagamento de 0.25€ + 1.5% sobre compras', () => {
    expect(db.calculatePaymentFee(0)).toBe(0);
    expect(db.calculatePaymentFee(25)).toBe(0.63);
    expect(db.calculatePaymentFee(28.50)).toBe(0.68);
    expect(db.calculatePaymentFee(0.50)).toBe(0.26);
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
    expect(stats.totalRevenue).toBe(54.81); // 25.63 + 29.18
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
    expect(order.payment_fee).toBe(0.26);
    expect(order.total_amount).toBe(0.76);

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

  it('permite ao admin criar encomendas manuais de packs com bundle_selections e resumo formatado', () => {
    // 1. Criar peças individuais e um pack
    const piece1 = db.createShopCampaign({
      title: 'Sweat Pack Peça 1',
      item_name: 'Sweat Universitária',
      item_price: 25.0,
      sizes_available: ['S', 'M', 'L', 'XL'],
      colors_available: ['Preto', 'Azul'],
    });

    const piece2 = db.createShopCampaign({
      title: 'T-Shirt Pack Peça 2',
      item_name: 'T-Shirt Verão',
      item_price: 15.0,
      sizes_available: ['XS', 'S', 'M'],
      colors_available: ['Branco', 'Cinzento'],
    });

    const pack = db.createShopCampaign({
      title: 'Pack Especial de Boas-Vindas',
      item_name: 'Pack Boas-Vindas',
      item_price: 32.0,
      category: 'Pack',
      is_bundle: 1,
      bundle_items: [
        { campaign_id: piece1.id, item_name: 'Sweat Universitária' },
        { campaign_id: piece2.id, item_name: 'T-Shirt Verão' },
      ],
    });

    // 2. Criar encomenda manual para este pack
    const manualOrder = db.createAdminManualOrder({
      campaign_id: pack.id,
      item_name: pack.item_name,
      student_name: 'Aluno Pack Teste',
      student_email: 'alunopack@ualg.pt',
      phone_number: '912345678',
      delivery_type: 'pickup',
      item_price: 32.0,
      payment_status: 'paid',
      order_status: 'confirmed',
      admin_notes: 'Pack pago em dinheiro no gabinete',
      bundle_selections: [
        { campaign_id: piece1.id, item_name: 'Sweat Universitária', size: 'L', color: 'Azul' },
        { campaign_id: piece2.id, item_name: 'T-Shirt Verão', size: 'S', color: 'Branco' },
      ],
    });

    expect(manualOrder).toBeTruthy();
    expect(manualOrder.is_admin_created).toBe(true);
    expect(manualOrder.bundle_selections).toHaveLength(2);
    expect(manualOrder.bundle_selections[0]).toEqual({
      campaign_id: piece1.id,
      item_name: 'Sweat Universitária',
      size: 'L',
      color: 'Azul',
    });
    expect(manualOrder.bundle_selections[1]).toEqual({
      campaign_id: piece2.id,
      item_name: 'T-Shirt Verão',
      size: 'S',
      color: 'Branco',
    });
    expect(manualOrder.size).toBe('Sweat Universitária: L | T-Shirt Verão: S');
    expect(manualOrder.color).toBe('Sweat Universitária: Azul | T-Shirt Verão: Branco');

    // 3. Verifica em getShopOrders
    const allOrders = db.getShopOrders();
    const found = allOrders.find((o) => o.id === manualOrder.id);
    expect(found).toBeTruthy();
    expect(found.bundle_selections).toHaveLength(2);

    // 4. Verifica em factory export (linhas desdobradas para confeção de cada artigo do pack)
    const factoryRows = db.getFactoryExportData();
    const rows = factoryRows.filter((r) => r.id === manualOrder.id);
    expect(rows).toHaveLength(2);
    expect(rows[0].pack_origem).toBe('Pack Boas-Vindas');
    expect(rows[0].artigo).toBe('Sweat Universitária');
    expect(rows[0].tamanho).toBe('L');
    expect(rows[0].cor).toBe('Azul');
    expect(rows[0].origem).toBe('Manual (Admin)');
    expect(rows[1].pack_origem).toBe('Pack Boas-Vindas');
    expect(rows[1].artigo).toBe('T-Shirt Verão');
    expect(rows[1].tamanho).toBe('S');
    expect(rows[1].cor).toBe('Branco');
  });

  it('cria encomenda manual de pack através do endpoint POST /api/admin/shop/orders com bundle_selections', async () => {
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

    const p1 = db.createShopCampaign({
      title: 'Item Pack A',
      item_name: 'Item A',
      item_price: 20.0,
      sizes_available: ['M', 'L'],
      colors_available: ['Preto'],
    });
    const p2 = db.createShopCampaign({
      title: 'Item Pack B',
      item_name: 'Item B',
      item_price: 10.0,
      sizes_available: ['S', 'M'],
      colors_available: ['Vermelho'],
    });
    const packCamp = db.createShopCampaign({
      title: 'Pack Duo API',
      item_name: 'Pack Duo',
      item_price: 25.0,
      category: 'Pack',
      is_bundle: 1,
      bundle_items: [
        { campaign_id: p1.id, item_name: 'Item A' },
        { campaign_id: p2.id, item_name: 'Item B' },
      ],
    });

    const payload = {
      campaign_id: packCamp.id,
      item_name: 'Pack Duo',
      student_name: 'Inês Pack API',
      student_email: 'ines@ualg.pt',
      phone_number: '918887766',
      delivery_type: 'pickup',
      item_price: 25.0,
      payment_status: 'paid',
      admin_notes: 'Criado via endpoint admin',
      send_email: false,
      bundle_selections: [
        { campaign_id: p1.id, item_name: 'Item A', size: 'L', color: 'Preto' },
        { campaign_id: p2.id, item_name: 'Item B', size: 'S', color: 'Vermelho' },
      ],
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
    expect(jsonBody.order.bundle_selections).toHaveLength(2);
    expect(jsonBody.order.size).toBe('Item A: L | Item B: S');
    expect(jsonBody.order.color).toBe('Item A: Preto | Item B: Vermelho');
    expect(jsonBody.order.payment_ref).toBe(`admin-manual-${jsonBody.order.id}`);
  });

  it('permite criar múltiplas encomendas manuais normais e em pack sem conflito de payment_ref (UNIQUE constraint)', async () => {
    // 1. Criar uma encomenda manual simples
    const order1 = db.createAdminManualOrder({
      student_name: 'Primeiro Aluno',
      student_email: 'aluno1@ualg.pt',
      phone_number: '912345678',
      size: 'M',
      color: 'Preto',
      delivery_type: 'pickup',
      item_price: 25.0,
      payment_status: 'paid',
    });

    expect(order1).toBeTruthy();
    expect(order1.payment_ref).toBe(`admin-manual-${order1.id}`);

    // 2. Criar um pack com artigos
    const p1 = db.createShopCampaign({
      title: 'Pack Item 1',
      item_name: 'Artigo Um',
      item_price: 20.0,
    });
    const p2 = db.createShopCampaign({
      title: 'Pack Item 2',
      item_name: 'Artigo Dois',
      item_price: 15.0,
    });
    const pack = db.createShopCampaign({
      title: 'Super Pack Informática',
      item_name: 'Super Pack',
      item_price: 30.0,
      category: 'Pack',
      is_bundle: 1,
      bundle_items: [
        { campaign_id: p1.id, item_name: 'Artigo Um' },
        { campaign_id: p2.id, item_name: 'Artigo Dois' },
      ],
    });

    // 3. Criar uma segunda encomenda manual que é um pack
    const packOrder1 = db.createAdminManualOrder({
      campaign_id: pack.id,
      item_name: pack.item_name,
      student_name: 'Segundo Aluno Pack',
      student_email: 'aluno2@ualg.pt',
      phone_number: '965432100',
      delivery_type: 'pickup',
      item_price: 30.0,
      payment_status: 'paid',
      bundle_selections: [
        { campaign_id: p1.id, item_name: 'Artigo Um', size: 'M', color: 'Preto' },
        { campaign_id: p2.id, item_name: 'Artigo Dois', size: 'L', color: 'Branco' },
      ],
    });

    expect(packOrder1).toBeTruthy();
    expect(packOrder1.payment_ref).toBe(`admin-manual-${packOrder1.id}`);
    expect(packOrder1.payment_ref).not.toBe(order1.payment_ref);

    // 4. Criar uma terceira encomenda manual de pack pelo endpoint da API
    const auth = await import('../../server/auth.js');
    const { token } = auth.authenticateAdmin('test-admin-secret');

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
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          campaign_id: pack.id,
          student_name: 'Terceiro Aluno Pack API',
          student_email: 'aluno3@ualg.pt',
          phone_number: '934567890',
          delivery_type: 'pickup',
          bundle_selections: [
            { campaign_id: p1.id, item_name: 'Artigo Um', size: 'S', color: 'Preto' },
            { campaign_id: p2.id, item_name: 'Artigo Dois', size: 'M', color: 'Preto' },
          ],
        },
      },
      fakeRes,
      '/api/admin/shop/orders'
    );

    expect(handled).toBe(true);
    expect(statusCode).toBe(201);
    expect(jsonBody.success).toBe(true);
    expect(jsonBody.order.payment_ref).toBe(`admin-manual-${jsonBody.order.id}`);
    expect(jsonBody.order.payment_ref).not.toBe(packOrder1.payment_ref);
    expect(jsonBody.order.payment_ref).not.toBe(order1.payment_ref);
  });

  it('permite criar, editar, listar e gerir produtos no catálogo de loja', () => {
    // 1. Criar novo produto
    const newProduct = db.createShopCampaign({
      title: 'T-Shirt Oficial NEEI 2026',
      description: 'T-shirt de algodão leve de edição especial.',
      item_name: 'T-Shirt Oficial NEEI',
      item_price: 12.5,
      shipping_fee: 2.5,
      image_url: '/assets/tshirt_mockup.jpg',
      deadline_date: '2026-11-15',
      is_active: 1,
      allow_pickup: 1,
      allow_shipping: 1,
      pickup_location: 'Gabinete NEEI (Sala 0.18)',
      sizes_available: ['S', 'M', 'L', 'XL'],
    });

    expect(newProduct).toBeTruthy();
    expect(newProduct.id).toMatch(/^prod-/);
    expect(newProduct.item_name).toBe('T-Shirt Oficial NEEI');
    expect(newProduct.item_price).toBe(12.5);

    // 2. Listar produtos
    const all = db.getAllShopCampaigns();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const found = all.find((p) => p.id === newProduct.id);
    expect(found).toBeTruthy();

    // 3. Atualizar produto
    const updated = db.updateShopCampaign(newProduct.id, {
      title: 'T-Shirt Oficial NEEI 2026 - Edição Limitada',
      item_price: 14.0,
      item_name: 'T-Shirt Oficial Edição Limitada',
    });

    expect(updated.title).toBe('T-Shirt Oficial NEEI 2026 - Edição Limitada');
    expect(updated.item_price).toBe(14.0);
    expect(updated.item_name).toBe('T-Shirt Oficial Edição Limitada');

    // 4. Remover produto sem encomendas
    const deleted = db.deleteShopCampaign(newProduct.id);
    expect(deleted.success).toBe(true);

    const checkGone = db.getShopCampaignById(newProduct.id);
    expect(checkGone).toBeNull();
  });

  it('preserva permanentemente o nome do artigo (item_name) na encomenda vendida, mesmo após o produto ser editado ou renomeado', () => {
    // 1. Criar um produto inicial com nome específico
    const product = db.createShopCampaign({
      title: 'Hoodie de Programação V1',
      item_name: 'Hoodie Clássico 2026',
      item_price: 28.0,
      shipping_fee: 3.5,
      sizes_available: ['M', 'L'],
    });

    // 2. Criar uma encomenda para este produto
    const pendingOrder = db.preparePendingShopOrder({
      campaign_id: product.id,
      student_name: 'Beatriz Costa',
      student_email: 'beatriz@ualg.pt',
      phone_number: '912345678',
      size: 'M',
      delivery_type: 'pickup',
    });

    expect(pendingOrder.item_name).toBe('Hoodie Clássico 2026');

    // 3. Registar o pagamento e guardar a encomenda na BD
    const paidOrder = db.recordPaidShopOrder(pendingOrder, 'pi_test_snapshot_123');
    expect(paidOrder.item_name).toBe('Hoodie Clássico 2026');

    // 4. Admin edita o produto e altera o seu nome no catálogo para outro nome diferente
    db.updateShopCampaign(product.id, {
      title: 'Hoodie de Programação V2 (Renovado)',
      item_name: 'Hoodie Renovado 2027',
      item_price: 35.0,
    });

    // 5. Verificar que a encomenda previamente vendida AINDA mantém o nome original no momento da compra
    const fetchedOrder = db.getShopOrderById(paidOrder.id);
    expect(fetchedOrder.item_name).toBe('Hoodie Clássico 2026');

    // 6. Verificar que a lista de encomendas para o admin também apresenta o nome original
    const allOrders = db.getAllShopOrders();
    const orderInList = allOrders.find((o) => o.id === paidOrder.id);
    expect(orderInList).toBeTruthy();
    expect(orderInList.item_name).toBe('Hoodie Clássico 2026');

    // 7. Verificar que o export para a fábrica (CSV) inclui o artigo original
    const factoryRows = db.getFactoryExportData();
    const factoryOrder = factoryRows.find((r) => r.id === paidOrder.id);
    expect(factoryOrder).toBeTruthy();
    expect(factoryOrder.artigo).toBe('Hoodie Clássico 2026');

    // 8. Uma NOVA encomenda criada após a edição do produto recebe o novo nome
    const newPending = db.preparePendingShopOrder({
      campaign_id: product.id,
      student_name: 'Carlos Dias',
      student_email: 'carlos@ualg.pt',
      phone_number: '923456789',
      size: 'L',
      delivery_type: 'pickup',
    });
    expect(newPending.item_name).toBe('Hoodie Renovado 2027');
  });

  it('impede a eliminação de um produto que já tenha encomendas associadas', () => {
    const product = db.createShopCampaign({
      title: 'Caneca NEEI',
      item_name: 'Caneca Cerâmica NEEI',
      item_price: 6.0,
      sizes_available: ['M'],
    });

    // Criar encomenda associada ao produto
    const pending = db.preparePendingShopOrder({
      campaign_id: product.id,
      student_name: 'Diana Ferreira',
      student_email: 'diana@ualg.pt',
      phone_number: '934567890',
      size: 'M',
      delivery_type: 'pickup',
    });
    db.recordPaidShopOrder(pending, 'pi_test_delete_protect');

    // Tentativa de eliminação deve falhar
    expect(() => {
      db.deleteShopCampaign(product.id);
    }).toThrow(/Não é possível eliminar um produto com \d+ encomenda/);

    // O produto continua a existir na BD
    const stillExists = db.getShopCampaignById(product.id);
    expect(stillExists).toBeTruthy();
  });

  it('suporta endpoints REST /api/admin/shop/products com autenticação', async () => {
    const auth = await import('../../server/auth.js');
    const { token } = auth.authenticateAdmin('test-admin-secret');

    // 1. GET lista de produtos
    let statusCode = 0;
    let jsonBody = null;
    const fakeRes = () => ({
      writeHead: (code) => {
        statusCode = code;
      },
      end: (data) => {
        jsonBody = JSON.parse(data);
      },
    });

    let res = fakeRes();
    let handled = await shopApi.handleShopApi(
      { method: 'GET', headers: { authorization: `Bearer ${token}` } },
      res,
      '/api/admin/shop/products'
    );
    expect(handled).toBe(true);
    expect(statusCode).toBe(200);
    expect(Array.isArray(jsonBody.products)).toBe(true);

    // 2. POST criar produto
    res = fakeRes();
    handled = await shopApi.handleShopApi(
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          title: 'Gorro de Inverno NEEI',
          item_name: 'Gorro de Malha NEEI',
          item_price: 8.5,
          shipping_fee: 2.0,
          sizes_available: ['M'],
        },
      },
      res,
      '/api/admin/shop/products'
    );
    expect(handled).toBe(true);
    expect(statusCode).toBe(201);
    expect(jsonBody.product).toBeTruthy();
    expect(jsonBody.product.item_name).toBe('Gorro de Malha NEEI');
    const createdId = jsonBody.product.id;

    // 3. PUT atualizar produto
    res = fakeRes();
    handled = await shopApi.handleShopApi(
      {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          title: 'Gorro de Inverno NEEI 2026',
          item_name: 'Gorro de Malha Atualizado',
          item_price: 9.0,
        },
      },
      res,
      `/api/admin/shop/products/${createdId}`
    );
    expect(handled).toBe(true);
    expect(statusCode).toBe(200);
    expect(jsonBody.product.item_name).toBe('Gorro de Malha Atualizado');
    expect(jsonBody.product.item_price).toBe(9.0);

    // 4. DELETE remover produto
    res = fakeRes();
    handled = await shopApi.handleShopApi(
      {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      },
      res,
      `/api/admin/shop/products/${createdId}`
    );
    expect(handled).toBe(true);
    expect(statusCode).toBe(200);
    expect(jsonBody.success).toBe(true);
  });

  it('permite criar e atualizar features personalizadas de um produto na BD e API', async () => {
    const auth = await import('../../server/auth.js');
    const { token } = auth.authenticateAdmin('test-admin-secret');
    let statusCode = 200;
    let jsonBody = null;
    const fakeRes = () => ({
      writeHead: (code) => {
        statusCode = code;
      },
      end: (data) => {
        jsonBody = data ? JSON.parse(data) : null;
      },
    });

    // 1. Criar produto com features personalizadas
    let res = fakeRes();
    let handled = await shopApi.handleShopApi(
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          title: 'Sweat Engenharia Edição 2026',
          item_name: 'Sweat 2026',
          item_price: 25.0,
          shipping_fee: 3.5,
          sizes_available: ['S', 'M', 'L'],
          features: [
            '80% Algodão Premium cardado',
            'Bordado de alta definição NEEI',
            'Edição Oficial Limitada 2026',
          ],
        },
      },
      res,
      '/api/admin/shop/products'
    );
    expect(handled).toBe(true);
    expect(statusCode).toBe(201);
    expect(jsonBody.product.features).toEqual([
      '80% Algodão Premium cardado',
      'Bordado de alta definição NEEI',
      'Edição Oficial Limitada 2026',
    ]);
    const prodId = jsonBody.product.id;

    // 2. Verificar na base de dados diretamente
    const inDb = db.getShopCampaignById(prodId);
    expect(inDb.features).toEqual([
      '80% Algodão Premium cardado',
      'Bordado de alta definição NEEI',
      'Edição Oficial Limitada 2026',
    ]);

    // 3. Atualizar as features
    res = fakeRes();
    handled = await shopApi.handleShopApi(
      {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          features: [
            'Algodão 100% Orgânico',
            'Recolha no Campus de Gambelas',
          ],
        },
      },
      res,
      `/api/admin/shop/products/${prodId}`
    );
    expect(handled).toBe(true);
    expect(statusCode).toBe(200);
    expect(jsonBody.product.features).toEqual([
      'Algodão 100% Orgânico',
      'Recolha no Campus de Gambelas',
    ]);

    // 4. Verificar se a campanha ativa por omissão também traz features por defeito
    const active = db.getActiveShopCampaign();
    expect(Array.isArray(active.features)).toBe(true);
    expect(active.features.length).toBeGreaterThan(0);
  });

  it('permite configurar e atualizar a categoria de um produto na BD e API', async () => {
    const auth = await import('../../server/auth.js');
    const { token } = auth.authenticateAdmin('test-admin-secret');
    let statusCode = 200;
    let jsonBody = null;
    const fakeRes = () => ({
      writeHead: (code) => {
        statusCode = code;
      },
      end: (data) => {
        jsonBody = data ? JSON.parse(data) : null;
      },
    });

    // 1. A campanha padrão tem a categoria 'Vestuário'
    const defaultCamp = db.getActiveShopCampaign();
    expect(defaultCamp.category).toBe('Vestuário');

    // 2. Criar novo produto com categoria personalizada (ex: 'Acessórios')
    let res = fakeRes();
    let handled = await shopApi.handleShopApi(
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          title: 'Lanyard Oficial NEEI',
          item_name: 'Lanyard NEEI',
          category: 'Acessórios',
          item_price: 3.5,
          sizes_available: ['M'],
        },
      },
      res,
      '/api/admin/shop/products'
    );
    expect(handled).toBe(true);
    expect(statusCode).toBe(201);
    expect(jsonBody.product.category).toBe('Acessórios');
    const prodId = jsonBody.product.id;

    // 3. Verificar na BD diretamente
    const inDb = db.getShopCampaignById(prodId);
    expect(inDb.category).toBe('Acessórios');

    // 4. Atualizar a categoria para 'Material Escolar'
    res = fakeRes();
    handled = await shopApi.handleShopApi(
      {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: {
          category: 'Material Escolar',
        },
      },
      res,
      `/api/admin/shop/products/${prodId}`
    );
    expect(handled).toBe(true);
    expect(statusCode).toBe(200);
    expect(jsonBody.product.category).toBe('Material Escolar');

    const updatedInDb = db.getShopCampaignById(prodId);
    expect(updatedInDb.category).toBe('Material Escolar');
  });

  it('cria ou atualiza o Customer no Stripe com o nome da pessoa que comprou e associa ao PaymentIntent', async () => {
    const stripeService = await import('../../server/services/stripeService.js');

    const mockCustomers = [];
    const mockPaymentIntents = [];

    const mockStripe = {
      customers: {
        list: vi.fn(async ({ email }) => ({
          data: mockCustomers.filter((c) => c.email === email),
        })),
        create: vi.fn(async ({ email, name, phone, metadata }) => {
          const newCust = {
            id: `cus_test_${mockCustomers.length + 1}`,
            email,
            name,
            phone,
            metadata,
          };
          mockCustomers.push(newCust);
          return newCust;
        }),
        update: vi.fn(async (id, data) => {
          const cust = mockCustomers.find((c) => c.id === id);
          if (cust) Object.assign(cust, data);
          return cust;
        }),
      },
      paymentIntents: {
        create: vi.fn(async (payload) => {
          const pi = { id: `pi_test_${Date.now()}`, client_secret: 'pi_test_secret', ...payload };
          mockPaymentIntents.push(pi);
          return pi;
        }),
      },
    };

    // 1. Criação de novo cliente quando não existe
    const customerId = await stripeService.getOrCreateStripeCustomer(mockStripe, {
      email: 'maria.santos@ualg.pt',
      name: 'Maria Santos',
      phoneNumber: '912345678',
      orderId: 'SW-1234-5678',
    });

    expect(customerId).toBe('cus_test_1');
    expect(mockStripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'maria.santos@ualg.pt',
        name: 'Maria Santos',
        phone: '+351912345678',
      })
    );

    // 2. Reutilização de cliente existente sem sobrescrever dados não autenticados (M7)
    const customerId2 = await stripeService.getOrCreateStripeCustomer(mockStripe, {
      email: 'maria.santos@ualg.pt',
      name: 'Maria Santos Atualizada',
      phoneNumber: '912345678',
      orderId: 'SW-1234-5679',
    });

    expect(customerId2).toBe('cus_test_1');
    expect(mockStripe.customers.update).not.toHaveBeenCalled();

    // 3. Tolerância a falhas na API do Stripe
    const errorStripe = {
      customers: {
        list: vi.fn(async () => {
          throw new Error('Stripe API temporariamente indisponível');
        }),
      },
    };
    const fallbackId = await stripeService.getOrCreateStripeCustomer(errorStripe, {
      email: 'erro@ualg.pt',
      name: 'Erro Teste',
    });
    expect(fallbackId).toBeNull();
  });
});

describe('Segurança da Gateway de Pagamento & Webhooks (Issue #4)', () => {
  function makeMockResponse() {
    let statusCode = 200;
    let headers = {};
    let body = null;
    return {
      res: {
        writeHead: (code, h) => {
          statusCode = code;
          if (h) Object.assign(headers, h);
        },
        setHeader: (k, v) => {
          headers[k] = v;
        },
        end: (data) => {
          try {
            body = typeof data === 'string' ? JSON.parse(data) : data;
          } catch {
            body = data;
          }
        },
      },
      getStatusCode: () => statusCode,
      getBody: () => body,
    };
  }

  it('A1 — Rejeita webhook payment_intent.succeeded com montante ou moeda divergentes', async () => {
    const pending = db.preparePendingShopOrder({
      student_name: 'Teste Montante',
      student_email: 'montante@ualg.pt',
      phone_number: '912345678',
      size: 'L',
      delivery_type: 'pickup',
    });

    // 1. Webhook com moeda incorreta (ex: usd em vez de eur)
    const badCurrencyEvent = {
      id: 'evt_bad_curr_' + Date.now(),
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_bad_curr_' + Date.now(),
          amount_received: Math.round(pending.total_amount * 100),
          currency: 'usd',
          metadata: { order_id: pending.id },
        },
      },
    };

    const mockRes1 = makeMockResponse();
    await shopApi.handleShopApi(
      {
        method: 'POST',
        headers: {},
        rawBody: JSON.stringify(badCurrencyEvent),
      },
      mockRes1.res,
      '/api/webhooks/stripe'
    );
    expect(mockRes1.getStatusCode()).toBe(400);
    expect(mockRes1.getBody().error).toMatch(/moeda/i);
    expect(db.getShopOrderById(pending.id)).toBeNull();

    // 2. Webhook com montante inferior (ex: atacante pagou 0.50€ em vez de 25.63€)
    const badAmountEvent = {
      id: 'evt_bad_amount_' + Date.now(),
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_bad_amount_' + Date.now(),
          amount_received: 50, // 0.50€
          currency: 'eur',
          metadata: { order_id: pending.id },
        },
      },
    };

    const mockRes2 = makeMockResponse();
    await shopApi.handleShopApi(
      {
        method: 'POST',
        headers: {},
        rawBody: JSON.stringify(badAmountEvent),
      },
      mockRes2.res,
      '/api/webhooks/stripe'
    );
    expect(mockRes2.getStatusCode()).toBe(400);
    expect(mockRes2.getBody().error).toMatch(/montante/i);
    expect(db.getShopOrderById(pending.id)).toBeNull();
  });

  it('A1 — Rejeita reutilização de PaymentIntent (Double Spending) em encomendas diferentes', async () => {
    const order1 = db.preparePendingShopOrder({
      student_name: 'Cliente Um',
      student_email: 'um@ualg.pt',
      phone_number: '912345678',
      size: 'M',
      delivery_type: 'pickup',
    });
    const order2 = db.preparePendingShopOrder({
      student_name: 'Cliente Dois',
      student_email: 'dois@ualg.pt',
      phone_number: '919876543',
      size: 'L',
      delivery_type: 'pickup',
    });

    const sharedPaymentRef = 'pi_shared_payment_intent_test';
    // Regista a primeira encomenda como paga com este PI
    db.recordPaidShopOrder(order1, sharedPaymentRef);
    expect(db.getShopOrderById(order1.id)?.payment_status).toBe('paid');

    // Tentativa de associar o mesmo PI à segunda encomenda deve falhar
    expect(() => {
      db.recordPaidShopOrder(order2, sharedPaymentRef);
    }).toThrow(/já se encontra associada/);
  });

  it('A2 — Ignora checkout.session.completed se session.payment_status !== "paid"', async () => {
    const pending = db.preparePendingShopOrder({
      student_name: 'Teste Async',
      student_email: 'async@ualg.pt',
      phone_number: '912345678',
      size: 'S',
      delivery_type: 'pickup',
    });

    const unpaidSessionEvent = {
      id: 'evt_unpaid_session_' + Date.now(),
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_unpaid_' + Date.now(),
          client_reference_id: pending.id,
          payment_status: 'unpaid', // Pagamento ainda não liquidado
          currency: 'eur',
          amount_total: Math.round(pending.total_amount * 100),
          metadata: { order_id: pending.id },
        },
      },
    };

    const mockRes = makeMockResponse();
    await shopApi.handleShopApi(
      {
        method: 'POST',
        headers: {},
        rawBody: JSON.stringify(unpaidSessionEvent),
      },
      mockRes.res,
      '/api/webhooks/stripe'
    );

    expect(mockRes.getStatusCode()).toBe(200);
    expect(mockRes.getBody().payment_status).toBe('unpaid');
    // A encomenda NÃO pode ter sido registada como paga na base de dados
    expect(db.getShopOrderById(pending.id)).toBeNull();
  });

  it('A3 — Usa URL canónico e evita Host Header Injection no checkout-session', async () => {
    const originalAppUrl = process.env.APP_URL;
    process.env.APP_URL = 'https://neei.online';

    const security = await import('../../server/security.js');
    const safeUrl = security.getCanonicalAppUrl({
      headers: { host: 'evil-attacker.com', 'x-forwarded-proto': 'http' },
    });
    expect(safeUrl).toBe('https://neei.online');

    delete process.env.APP_URL;
    const fallbackCleanHost = security.getCanonicalAppUrl({
      headers: { host: 'portal.ualg.pt:8080' },
    });
    expect(fallbackCleanHost).toBe('http://portal.ualg.pt:8080');

    // Host inválido com injeção de cabeçalhos ou caracteres perigosos
    const maliciousHost = security.getCanonicalAppUrl({
      headers: { host: 'evil.com\r\nInjected: Header' },
    });
    expect(maliciousHost).toBe('https://neei.online');

    if (originalAppUrl !== undefined) {
      process.env.APP_URL = originalAppUrl;
    } else {
      delete process.env.APP_URL;
    }
  });

  it('A4 — Webhook fallback rejeita metadados adulterados ou com valor inconsistente', async () => {
    const forgedEvent = {
      id: 'evt_forged_' + Date.now(),
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_forged_' + Date.now(),
          amount_received: 100, // 1€ forjado
          currency: 'eur',
          metadata: {
            order_id: 'SW-2026-9999',
            student_name: 'Atacante Hacker',
            student_email: 'hacker@ualg.pt',
            phone_number: '912345678',
            size: 'M',
            delivery_type: 'pickup',
            total_amount: '1.00',
          },
        },
      },
    };

    const mockRes = makeMockResponse();
    await shopApi.handleShopApi(
      {
        method: 'POST',
        headers: {},
        rawBody: JSON.stringify(forgedEvent),
      },
      mockRes.res,
      '/api/webhooks/stripe'
    );

    expect(mockRes.getStatusCode()).toBe(400);
    expect(mockRes.getBody().error).toMatch(/forjado/i);
    expect(db.getShopOrderById('SW-2026-9999')).toBeNull();
  });

  it('M2 — Processa eventos charge.refunded, charge.dispute.created e checkout.session.expired', async () => {
    const pending = db.preparePendingShopOrder({
      student_name: 'Teste Reembolso',
      student_email: 'reembolso@ualg.pt',
      phone_number: '912345678',
      size: 'L',
      delivery_type: 'pickup',
    });
    const paidOrder = db.recordPaidShopOrder(pending, 'pi_refund_test_123');
    expect(paidOrder.payment_status).toBe('paid');

    // 1. charge.refunded
    const refundEvent = {
      id: 'evt_refund_' + Date.now(),
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_123',
          payment_intent: 'pi_refund_test_123',
          amount_refunded: 2563,
        },
      },
    };

    const mockRes1 = makeMockResponse();
    await shopApi.handleShopApi(
      { method: 'POST', headers: {}, rawBody: JSON.stringify(refundEvent) },
      mockRes1.res,
      '/api/webhooks/stripe'
    );
    expect(mockRes1.getStatusCode()).toBe(200);
    const orderAfterRefund = db.getShopOrderById(paidOrder.id);
    expect(orderAfterRefund.admin_notes).toContain('[REEMBOLSO STRIPE]');

    // 2. charge.dispute.created
    const disputeEvent = {
      id: 'evt_dispute_' + Date.now(),
      type: 'charge.dispute.created',
      data: {
        object: {
          id: 'dp_999',
          payment_intent: 'pi_refund_test_123',
          amount: 2563,
        },
      },
    };

    const mockRes2 = makeMockResponse();
    await shopApi.handleShopApi(
      { method: 'POST', headers: {}, rawBody: JSON.stringify(disputeEvent) },
      mockRes2.res,
      '/api/webhooks/stripe'
    );
    expect(mockRes2.getStatusCode()).toBe(200);
    const orderAfterDispute = db.getShopOrderById(paidOrder.id);
    expect(orderAfterDispute.admin_notes).toContain('[DISPUTA BANCÁRIA STRIPE]');

    // 3. checkout.session.expired
    const pending2 = db.preparePendingShopOrder({
      student_name: 'Teste Expirado',
      student_email: 'expirado@ualg.pt',
      phone_number: '912345678',
      size: 'M',
      delivery_type: 'pickup',
    });
    const expiredEvent = {
      id: 'evt_expired_' + Date.now(),
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_expired_123',
          client_reference_id: pending2.id,
        },
      },
    };
    const mockRes3 = makeMockResponse();
    await shopApi.handleShopApi(
      { method: 'POST', headers: {}, rawBody: JSON.stringify(expiredEvent) },
      mockRes3.res,
      '/api/webhooks/stripe'
    );
    expect(mockRes3.getStatusCode()).toBe(200);
  });

  it('M5 — Rejeita tokens de administrador fornecidos apenas na query string', async () => {
    const auth = await import('../../server/auth.js');
    const { token } = auth.authenticateAdmin('test-admin-secret');

    // Query string NÃO é aceite
    const searchParams = new URLSearchParams({ token });
    expect(auth.verifyAdminToken({ headers: {} }, searchParams)).toBe(false);

    // Header Authorization Bearer é aceite
    expect(auth.verifyAdminToken({ headers: { authorization: `Bearer ${token}` } })).toBe(true);
  });

  it('M10 — Rejeita simulate-payment em ambiente de produção', async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevStripeKey = process.env.STRIPE_SECRET_KEY;
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_live_fake123';

    const pending = db.preparePendingShopOrder({
      student_name: 'Prod Test',
      student_email: 'prod@ualg.pt',
      phone_number: '912345678',
      size: 'L',
      delivery_type: 'pickup',
    });

    const mockRes = makeMockResponse();
    await shopApi.handleShopApi(
      {
        method: 'POST',
        headers: {},
        body: { orderId: pending.id },
      },
      mockRes.res,
      '/api/shop/simulate-payment'
    );

    expect(mockRes.getStatusCode()).toBe(403);
    expect(mockRes.getBody().error).toMatch(/desativada em ambiente de produção/i);

    process.env.NODE_ENV = prevNodeEnv;
    if (prevStripeKey !== undefined) {
      process.env.STRIPE_SECRET_KEY = prevStripeKey;
    } else {
      delete process.env.STRIPE_SECRET_KEY;
    }
  });

  it('BAIXO — Deduplica eventos de webhook repetidos (Replay Attack)', async () => {
    const pending = db.preparePendingShopOrder({
      student_name: 'Deduplication Test',
      student_email: 'dedup@ualg.pt',
      phone_number: '912345678',
      size: 'M',
      delivery_type: 'pickup',
    });

    const eventId = 'evt_dedup_unique_id_' + Date.now();
    const event = {
      id: eventId,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_dedup_' + Date.now(),
          amount_received: Math.round(pending.total_amount * 100),
          currency: 'eur',
          metadata: { order_id: pending.id },
        },
      },
    };

    const mockRes1 = makeMockResponse();
    await shopApi.handleShopApi(
      { method: 'POST', headers: {}, rawBody: JSON.stringify(event) },
      mockRes1.res,
      '/api/webhooks/stripe'
    );
    expect(mockRes1.getStatusCode()).toBe(200);

    // Segundo envio do MESMO evento deve ser deduplicado imediatamente
    const mockRes2 = makeMockResponse();
    await shopApi.handleShopApi(
      { method: 'POST', headers: {}, rawBody: JSON.stringify(event) },
      mockRes2.res,
      '/api/webhooks/stripe'
    );
    expect(mockRes2.getStatusCode()).toBe(200);
    expect(mockRes2.getBody().deduplicated).toBe(true);
  });

  it('BAIXO — Expira encomendas pendentes em memória após o TTL', () => {
    const pending = db.preparePendingShopOrder({
      student_name: 'TTL Test',
      student_email: 'ttl@ualg.pt',
      phone_number: '912345678',
      size: 'S',
      delivery_type: 'pickup',
    });

    expect(db.getPendingShopOrder(pending.id)).toBeTruthy();

    // Simula passagem do tempo para além do TTL (2 horas + 1 minuto)
    pending.createdAtMs = Date.now() - (2 * 60 * 60 * 1000 + 60000);

    // Consulta deve retornar null por ter expirado
    expect(db.getPendingShopOrder(pending.id)).toBeNull();
  });

  it('Ordenação de tamanhos — preserva sempre a ordem do XS ao 3XL', () => {
    const unorderedSizes = ['L', '3XL', 'XS', 'XXL', 'M', 'XL', 'S'];
    const sorted = db.sortShopSizes(unorderedSizes);
    expect(sorted).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']);

    const product = db.createShopCampaign({
      title: 'T-Shirt Ordenada',
      sizes_available: ['XXL', 'S', 'XS', '3XL'],
    });
    expect(product.sizes_available).toEqual(['XS', 'S', 'XXL', '3XL']);
  });

  it('permite definir cores disponíveis e guia de tamanhos customizado para artigos de vestuário', () => {
    const customGuide = {
      S: { chest: 50, length: 66, sleeve: 61, label: 'Pequeno Fit' },
      M: { chest: 53, length: 69, sleeve: 63, label: 'Médio Regular' },
      L: { chest: 56, length: 72, sleeve: 65, label: 'Grande Regular' },
    };

    const product = db.createShopCampaign({
      title: 'Casaco Técnico NEEI 2026',
      item_name: 'Casaco Técnico NEEI',
      category: 'Vestuário',
      item_price: 35.0,
      sizes_available: ['S', 'M', 'L'],
      colors_available: ['Preto', 'Azul Marinho', 'Verde Garrafa'],
      size_guide: customGuide,
    });

    expect(product.colors_available).toEqual(['Preto', 'Azul Marinho', 'Verde Garrafa']);
    expect(product.size_guide).toEqual(customGuide);

    // Atualiza as cores e medidas
    const updatedGuide = {
      ...customGuide,
      M: { chest: 54, length: 70, sleeve: 64, label: 'Médio Confortável' },
    };
    const updated = db.updateShopCampaign(product.id, {
      colors_available: ['Preto', 'Bordeaux'],
      size_guide: updatedGuide,
    });

    expect(updated.colors_available).toEqual(['Preto', 'Bordeaux']);
    expect(updated.size_guide.M.chest).toBe(54);
    expect(updated.size_guide.M.label).toBe('Médio Confortável');
  });

  it('valida e guarda a cor selecionada pelo comprador na encomenda', () => {
    const product = db.createShopCampaign({
      title: 'Sweat Universitária 2026',
      item_name: 'Sweat Universitária',
      category: 'Vestuário',
      sizes_available: ['M', 'L'],
      colors_available: ['Preto', 'Branco', 'Azul Marinho'],
    });

    // Encomenda com cor válida
    const order1 = db.preparePendingShopOrder({
      campaign_id: product.id,
      student_name: 'Tiago Santos',
      student_email: 'tiago@ualg.pt',
      phone_number: '912345678',
      size: 'M',
      color: 'Azul Marinho',
      delivery_type: 'pickup',
    });

    expect(order1.color).toBe('Azul Marinho');

    // Encomenda sem cor especificada — recorre à primeira cor disponível
    const order2 = db.preparePendingShopOrder({
      campaign_id: product.id,
      student_name: 'Ana Pires',
      student_email: 'ana@ualg.pt',
      phone_number: '912345678',
      size: 'L',
      delivery_type: 'pickup',
    });

    expect(order2.color).toBe('Preto');

    // Registo do pagamento preserva a cor na base de dados
    const paid = db.recordPaidShopOrder(order1, 'pi_test_color_123');
    expect(paid.color).toBe('Azul Marinho');

    // Exportação da fábrica reflete a cor correta
    const exportRows = db.getFactoryExportData();
    const foundExport = exportRows.find((r) => r.id === paid.id);
    expect(foundExport).toBeTruthy();
    expect(foundExport.cor).toBe('Azul Marinho');
  });

  it('persiste color_images e a nova medida D (shoulder_to_wrist) no size_guide', () => {
    const product = db.createShopCampaign({
      title: 'Hoodie NEEI 2026',
      item_name: 'Hoodie',
      category: 'Vestuário',
      item_price: 30.0,
      sizes_available: ['S', 'M'],
      colors_available: ['Preto', 'Azul Marinho'],
      color_images: {
        'Preto': '/assets/hoodie_preto.jpg',
        'Azul Marinho': '/assets/hoodie_azul.jpg',
      },
      size_guide: {
        S: { chest: 50, length: 68, sleeve: 60, shoulder_to_wrist: 72, label: 'S Regular' },
        M: { chest: 53, length: 71, sleeve: 62, shoulder_to_wrist: 75, label: 'M Regular' },
      },
    });

    expect(product.color_images).toEqual({
      'Preto': '/assets/hoodie_preto.jpg',
      'Azul Marinho': '/assets/hoodie_azul.jpg',
    });
    expect(product.size_guide.S.shoulder_to_wrist).toBe(72);
    expect(product.size_guide.M.shoulder_to_wrist).toBe(75);

    // Atualização com nova imagem e alteração da medida D
    const updated = db.updateShopCampaign(product.id, {
      color_images: {
        'Preto': '/assets/hoodie_preto_v2.jpg',
      },
      size_guide: {
        ...product.size_guide,
        S: { ...product.size_guide.S, shoulder_to_wrist: 73 },
      },
    });

    expect(updated.color_images).toEqual({
      'Preto': '/assets/hoodie_preto_v2.jpg',
    });
    expect(updated.size_guide.S.shoulder_to_wrist).toBe(73);
  });

  describe('Margens de Lucro Esperadas & Gestão de Custos por Artigo (Dinâmico)', () => {
    it('sincroniza dinamicamente as margens com o catálogo da loja sem valores fixos no código', () => {
      const margins = db.getShopProfitMargins();
      expect(Array.isArray(margins)).toBe(true);
      expect(margins.length).toBeGreaterThanOrEqual(1);

      // Cada artigo inicializado vem do catálogo com custos e lucros a 0 até o admin configurar
      margins.forEach((m) => {
        expect(m).toHaveProperty('id');
        expect(m).toHaveProperty('product_name');
        expect(typeof m.sale_price).toBe('number');
        expect(typeof m.cost_min).toBe('number');
        expect(typeof m.cost_max).toBe('number');
        expect(typeof m.profit_min).toBe('number');
        expect(typeof m.profit_max).toBe('number');
      });
    });

    it('permite ao administrador configurar, guardar e calcular o lucro esperado dinamicamente', () => {
      // 1. Guardar margens de teste personalizadas
      const testMargins = [
        {
          id: 'artigo-teste-a',
          product_name: 'Artigo Teste Alpha',
          sale_price: 30.0,
          cost_min: 15.0,
          cost_max: 20.0,
          sponsorship: 2.0,
          profit_min: 12.0, // 30 - 20 + 2
          profit_max: 17.0, // 30 - 15 + 2
          display_order: 1,
        },
        {
          id: 'artigo-teste-b',
          product_name: 'Artigo Teste Beta',
          sale_price: 15.0,
          cost_min: 8.0,
          cost_max: 10.0,
          sponsorship: 0.0,
          profit_min: 5.0,
          profit_max: 7.0,
          display_order: 2,
        },
      ];

      const saved = db.saveShopProfitMargins(testMargins);
      expect(saved).toHaveLength(2);
      expect(saved[0].product_name).toBe('Artigo Teste Alpha');
      expect(saved[0].profit_min).toBe(12.0);
      expect(saved[0].profit_max).toBe(17.0);

      // 2. Simular encomendas pagas e validar cálculo das estatísticas
      const mockPaidOrders = [
        { item_name: 'Artigo Teste Alpha', payment_status: 'paid', order_status: 'confirmed' },
        { item_name: 'Artigo Teste Alpha', payment_status: 'paid', order_status: 'confirmed' },
        { item_name: 'Artigo Teste Beta', payment_status: 'paid', order_status: 'confirmed' },
      ];

      const summary = db.calculateShopProfitSummary(mockPaidOrders, saved);
      expect(summary.totalPaidUnits).toBe(3);
      // Lucro Alpha (2 un): min = 2 * 12 = 24, max = 2 * 17 = 34
      // Lucro Beta (1 un): min = 1 * 5 = 5, max = 1 * 7 = 7
      // Total Min = 29, Total Max = 41, Total Médio = 35
      expect(summary.totalProfitMin).toBe(29.0);
      expect(summary.totalProfitMax).toBe(41.0);
      expect(summary.totalProfitAvg).toBe(35.0);

      // 3. Reset restaura para sincronização do catálogo
      const restored = db.resetShopProfitMargins();
      expect(Array.isArray(restored)).toBe(true);
    });

    it('suporta endpoints REST /api/admin/shop/profit-margins com autenticação', async () => {
      const auth = await import('../../server/auth.js');
      const { token } = auth.authenticateAdmin('test-admin-secret');

      // 1. Rejeita sem token
      let resNoAuth = {
        statusCode: 0,
        jsonBody: null,
        writeHead(status) {
          this.statusCode = status;
        },
        end(data) {
          this.jsonBody = JSON.parse(data);
        },
      };
      await shopApi.handleShopApi(
        { method: 'GET', headers: {} },
        resNoAuth,
        '/api/admin/shop/profit-margins'
      );
      expect(resNoAuth.statusCode).toBe(401);

      // 2. Consulta GET
      let resGet = {
        statusCode: 0,
        jsonBody: null,
        writeHead(status) {
          this.statusCode = status;
        },
        end(data) {
          this.jsonBody = JSON.parse(data);
        },
      };
      await shopApi.handleShopApi(
        { method: 'GET', headers: { authorization: `Bearer ${token}` } },
        resGet,
        '/api/admin/shop/profit-margins'
      );
      expect(resGet.statusCode).toBe(200);
      expect(Array.isArray(resGet.jsonBody.margins)).toBe(true);
      expect(resGet.jsonBody.profitSummary).toBeDefined();

      // 3. Atualização PUT
      const customPayload = [
        {
          id: 'item-teste-rest',
          product_name: 'Produto Teste REST',
          sale_price: 25.0,
          cost_min: 10.0,
          cost_max: 12.0,
          sponsorship: 1.0,
          profit_min: 14.0,
          profit_max: 16.0,
          display_order: 1,
        },
      ];
      let resPut = {
        statusCode: 0,
        jsonBody: null,
        writeHead(status) {
          this.statusCode = status;
        },
        end(data) {
          this.jsonBody = JSON.parse(data);
        },
      };
      await shopApi.handleShopApi(
        {
          method: 'PUT',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: { margins: customPayload },
        },
        resPut,
        '/api/admin/shop/profit-margins'
      );
      expect(resPut.statusCode).toBe(200);
      const savedItem = resPut.jsonBody.margins.find((m) => m.id === 'item-teste-rest');
      expect(savedItem.profit_min).toBe(14.0);
      expect(savedItem.profit_max).toBe(16.0);

      // 4. Restaurar POST /reset
      let resReset = {
        statusCode: 0,
        jsonBody: null,
        writeHead(status) {
          this.statusCode = status;
        },
        end(data) {
          this.jsonBody = JSON.parse(data);
        },
      };
      await shopApi.handleShopApi(
        { method: 'POST', headers: { authorization: `Bearer ${token}` } },
        resReset,
        '/api/admin/shop/profit-margins/reset'
      );
      expect(resReset.statusCode).toBe(200);
      expect(Array.isArray(resReset.jsonBody.margins)).toBe(true);
    });
  });
});




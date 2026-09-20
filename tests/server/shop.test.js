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

beforeEach(async () => {
  vi.resetModules();
  vi.spyOn(console, 'log').mockImplementation(() => { });
  vi.spyOn(console, 'warn').mockImplementation(() => { });
  vi.spyOn(console, 'error').mockImplementation(() => { });
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'neei-shop-test-'));
  process.env.DATABASE_PATH = path.join(tmpDir, 'shop_test.db');

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
    }).toThrow(/Número de telemóvel inválido para MB WAY/);
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
});

import { readJsonBody, sendJson } from './api.js';
import { verifyAdminToken } from './auth.js';
import {
  getActiveShopCampaign,
  updateShopCampaign,
  createShopOrder,
  getShopOrderById,
  updateShopOrderPaymentStatus,
  updateShopOrderEmailSent,
  updateShopOrderMoloni,
  updateShopOrderStatus,
  getAllShopOrders,
  getShopSummaryStats,
  getFactoryExportData,
} from './db.js';
import { sendOrderConfirmationEmail } from './services/emailService.js';
import {
  initiateMbWayPayment,
  verifyIfthenpayWebhook,
  isPaymentSandbox,
} from './services/paymentService.js';
import { createMoloniInvoiceReceipt } from './services/moloniService.js';

/**
 * Roteador de endpoints da Loja e Encomendas de Sweats
 * Devolve true se o pedido foi tratado, ou false se a rota não corresponder
 */
export async function handleShopApi(req, res, pathname, searchParams) {
  try {
    /* =========================================================================
       ROTAS PÚBLICAS DA LOJA
       ========================================================================= */

    // 1. GET /api/shop/campaign - Obter dados da campanha ativa
    if (pathname === '/api/shop/campaign' && req.method === 'GET') {
      const campaign = getActiveShopCampaign();
      if (!campaign) {
        return sendJson(res, 404, { error: 'Nenhuma campanha ativa no momento.' });
      }
      return sendJson(res, 200, {
        campaign,
        isSandbox: isPaymentSandbox(),
      });
    }

    // 2. POST /api/shop/checkout - Criar encomenda e disparar MB WAY
    if (pathname === '/api/shop/checkout' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const order = createShopOrder(body);

      // Inicia pagamento por MB WAY
      const paymentResult = await initiateMbWayPayment({
        orderId: order.id,
        amount: order.total_amount,
        mobileNumber: order.phone_number,
        studentEmail: order.student_email,
        description: `NEEI - Sweat ${order.size}`,
      });

      if (!paymentResult.success) {
        return sendJson(res, 400, {
          error: paymentResult.message || 'Falha ao solicitar pagamento MB WAY.',
        });
      }

      // Guarda ref do pagamento
      updateShopOrderPaymentStatus(order.id, 'pending', paymentResult.requestId);

      return sendJson(res, 201, {
        success: true,
        orderId: order.id,
        totalAmount: order.total_amount,
        phoneNumber: order.phone_number,
        expiresInSeconds: paymentResult.expiresInSeconds || 300,
        message: paymentResult.message,
        isSandbox: isPaymentSandbox(),
      });
    }

    // 3. GET /api/shop/order-status/:id - Consultar estado da encomenda (polling no checkout)
    if (pathname.startsWith('/api/shop/order-status/') && req.method === 'GET') {
      const orderId = pathname.replace('/api/shop/order-status/', '').trim();
      const order = getShopOrderById(orderId);

      if (!order) {
        return sendJson(res, 404, { error: 'Encomenda não encontrada.' });
      }

      return sendJson(res, 200, {
        orderId: order.id,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        paidAt: order.paid_at,
        studentName: order.student_name,
        size: order.size,
        totalAmount: order.total_amount,
        deliveryType: order.delivery_type,
      });
    }

    // 4. POST ou GET /api/webhooks/ifthenpay - Callback de notificação de pagamento da Ifthenpay
    if (pathname === '/api/webhooks/ifthenpay' || pathname === '/api/shop/webhook') {
      let params = {};
      let body = {};

      if (req.method === 'GET') {
        params = Object.fromEntries(searchParams || []);
      } else if (req.method === 'POST') {
        body = await readJsonBody(req);
      }

      const isValid = verifyIfthenpayWebhook(params, body);
      if (!isValid) {
        return sendJson(res, 403, { error: 'Assinatura/Chave de webhook inválida' });
      }

      const orderId =
        body.orderId || body.order_id || body.referencia || params.orderId || params.referencia;
      const estado = (body.estado || body.status || params.estado || 'PAGO').toUpperCase();

      if (!orderId) {
        return sendJson(res, 400, { error: 'ID de encomenda não especificado no webhook' });
      }

      const order = getShopOrderById(orderId);
      if (!order) {
        return sendJson(res, 404, { error: 'Encomenda não encontrada' });
      }

      if (estado === 'PAGO' || estado === 'PAID' || estado === '000') {
        if (order.payment_status !== 'paid') {
          const updatedOrder = updateShopOrderPaymentStatus(
            order.id,
            'paid',
            body.requestId || params.requestId || 'webhook-ifthenpay',
            new Date().toISOString()
          );

          // 1. Enviar email de confirmação imediato
          try {
            const emailResult = await sendOrderConfirmationEmail(updatedOrder);
            if (emailResult && emailResult.success) {
              updateShopOrderEmailSent(updatedOrder.id);
            }
          } catch (mailErr) {
            console.error('[WEBHOOK ERROR] Falha no disparo do email:', mailErr);
          }

          // 2. Acionar Moloni de forma não-bloqueante
          createMoloniInvoiceReceipt(updatedOrder)
            .then((moloniRes) => {
              if (moloniRes.status === 'issued') {
                updateShopOrderMoloni(updatedOrder.id, moloniRes.documentId, 'issued');
              } else if (moloniRes.status === 'pending') {
                updateShopOrderMoloni(updatedOrder.id, null, 'pending');
              }
            })
            .catch((err) => console.error('[MOLONI ASYNC ERROR]', err));
        }

        return sendJson(res, 200, { status: 'ok', message: 'Pagamento registado com sucesso' });
      } else {
        updateShopOrderPaymentStatus(order.id, 'failed');
        return sendJson(res, 200, { status: 'failed', message: 'Pagamento rejeitado ou expirado' });
      }
    }

    // 5. POST /api/shop/simulate-payment - Simulação manual para testes em Sandbox
    if (pathname === '/api/shop/simulate-payment' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { orderId } = body;

      if (!orderId) {
        return sendJson(res, 400, { error: 'orderId é obrigatório' });
      }

      const order = getShopOrderById(orderId);
      if (!order) {
        return sendJson(res, 404, { error: 'Encomenda não encontrada' });
      }

      const updatedOrder = updateShopOrderPaymentStatus(
        order.id,
        'paid',
        `simulated-${Date.now()}`,
        new Date().toISOString()
      );

      // Dispara email
      const emailResult = await sendOrderConfirmationEmail(updatedOrder);
      if (emailResult && emailResult.success) {
        updateShopOrderEmailSent(updatedOrder.id);
      }

      // Moloni
      createMoloniInvoiceReceipt(updatedOrder)
        .then((moloniRes) => {
          if (moloniRes.status === 'issued') {
            updateShopOrderMoloni(updatedOrder.id, moloniRes.documentId, 'issued');
          } else {
            updateShopOrderMoloni(updatedOrder.id, null, 'pending');
          }
        })
        .catch((e) => console.error(e));

      return sendJson(res, 200, {
        success: true,
        message: 'Pagamento simulado com sucesso e email de confirmação despachado.',
        order: updatedOrder,
      });
    }

    /* =========================================================================
       ROTAS ADMINISTRATIVAS DA LOJA (REQUEREM TOKEN ADMIN)
       ========================================================================= */
    if (pathname.startsWith('/api/admin/shop/')) {
      if (!verifyAdminToken(req)) {
        return sendJson(res, 401, { error: 'Acesso não autorizado. Sessão expirada ou inválida.' });
      }

      // GET /api/admin/shop/campaign
      if (pathname === '/api/admin/shop/campaign' && req.method === 'GET') {
        const campaign = getActiveShopCampaign();
        return sendJson(res, 200, { campaign });
      }

      // PUT /api/admin/shop/campaign
      if (pathname === '/api/admin/shop/campaign' && req.method === 'PUT') {
        const body = await readJsonBody(req);
        const active = getActiveShopCampaign();
        const updated = updateShopCampaign(active.id, body);
        return sendJson(res, 200, { campaign: updated, message: 'Campanha atualizada' });
      }

      // GET /api/admin/shop/stats
      if (pathname === '/api/admin/shop/stats' && req.method === 'GET') {
        const stats = getShopSummaryStats();
        return sendJson(res, 200, stats);
      }

      // GET /api/admin/shop/orders
      if (pathname === '/api/admin/shop/orders' && req.method === 'GET') {
        const filters = {
          payment_status: searchParams?.get('payment_status') || undefined,
          order_status: searchParams?.get('order_status') || undefined,
          size: searchParams?.get('size') || undefined,
          delivery_type: searchParams?.get('delivery_type') || undefined,
          search: searchParams?.get('search') || undefined,
        };

        const orders = getAllShopOrders(filters);
        return sendJson(res, 200, { orders });
      }

      // PATCH /api/admin/shop/orders/:id - Atualizar estado da encomenda (produção, envio, etc.)
      if (pathname.startsWith('/api/admin/shop/orders/') && req.method === 'PATCH') {
        const orderId = pathname.replace('/api/admin/shop/orders/', '').trim();
        const body = await readJsonBody(req);
        const { order_status } = body;

        if (!order_status) {
          return sendJson(res, 400, { error: 'order_status é obrigatório' });
        }

        const success = updateShopOrderStatus(orderId, order_status);
        if (!success) {
          return sendJson(res, 404, { error: 'Encomenda não encontrada' });
        }

        const order = getShopOrderById(orderId);
        return sendJson(res, 200, { success: true, order });
      }

      // POST /api/admin/shop/orders/:id/resend-email - Reenviar email de confirmação
      if (pathname.includes('/resend-email') && req.method === 'POST') {
        const orderId = pathname
          .replace('/api/admin/shop/orders/', '')
          .replace('/resend-email', '')
          .trim();
        const order = getShopOrderById(orderId);

        if (!order) {
          return sendJson(res, 404, { error: 'Encomenda não encontrada' });
        }

        const emailResult = await sendOrderConfirmationEmail(order);
        if (emailResult && emailResult.success) {
          updateShopOrderEmailSent(order.id);
          return sendJson(res, 200, {
            success: true,
            message: `Email reenviado para ${order.student_email}`,
          });
        } else {
          return sendJson(res, 500, {
            error: emailResult.error || 'Falha ao reenviar email',
          });
        }
      }

      // GET /api/admin/shop/export-factory - Descarregar CSV de produção
      if (pathname === '/api/admin/shop/export-factory' && req.method === 'GET') {
        const rows = getFactoryExportData();

        // Cabeçalhos CSV em UTF-8 com BOM para abrir perfeitamente no Microsoft Excel
        const headers = [
          'ID Encomenda',
          'Nome do Aluno',
          'Email',
          'Telemóvel',
          'Tamanho',
          'Cor',
          'Modalidade de Entrega',
          'Morada de Envio',
          'NIF',
          'Total Pago',
          'Data de Pagamento',
        ];

        let csv = '\uFEFF' + headers.join(';') + '\n';
        for (const r of rows) {
          const line = [
            `"${r.id}"`,
            `"${(r.aluno || '').replace(/"/g, '""')}"`,
            `"${(r.email || '').replace(/"/g, '""')}"`,
            `"${r.telemovel}"`,
            `"${r.tamanho}"`,
            `"${r.cor}"`,
            `"${r.entrega}"`,
            `"${(r.morada_completa || '').replace(/"/g, '""')}"`,
            `"${r.nif}"`,
            `"${r.total_pago}"`,
            `"${r.data_pagamento}"`,
          ];
          csv += line.join(';') + '\n';
        }

        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="encomendas_sweats_fabrica.csv"',
          'Cache-Control': 'no-store',
        });
        res.end(csv);
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('[SHOP API ERROR]', err);
    return sendJson(res, err.statusCode || 500, {
      error: err.message || 'Erro interno no servidor da loja.',
    });
  }
}

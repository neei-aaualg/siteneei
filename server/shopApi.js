import { readJsonBody, readRawBody, sendJson } from './api.js';
import { verifyAdminToken, verifyAdminTokenString } from './auth.js';
import {
  getActiveShopCampaign,
  updateShopCampaign,
  preparePendingShopOrder,
  getPendingShopOrder,
  recordPaidShopOrder,
  createShopOrder,
  getShopOrderById,
  updateShopOrderPaymentStatus,
  updateShopOrderEmailSent,
  updateShopOrderStatus,
  updateMultipleShopOrderStatus,
  getAllShopOrders,
  getShopSummaryStats,
  getFactoryExportData,
  isSweatsAvailableEnv,
  isShowTestShopEnv,
  pendingOrdersCache,
} from './db.js';
import { sendOrderConfirmationEmail } from './services/emailService.js';
import {
  initiateMbWayPayment,
  createAutomaticPaymentIntent,
  createCheckoutSession,
  verifyStripeWebhook,
  isPaymentSandbox,
} from './services/paymentService.js';
import { getStripeClient, isStripeSandbox } from './services/stripeService.js';

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
      const isAdmin = verifyAdminToken(req, searchParams);
      const wantsPreview =
        searchParams?.get('admin_preview') === '1' || searchParams?.get('admin_preview') === 'true';
      const isSweatsAvailable = isSweatsAvailableEnv();
      const isTestShopAllowed = isShowTestShopEnv();
      const isAdminPreview = Boolean(isAdmin && wantsPreview && isTestShopAllowed);

      const campaign = getActiveShopCampaign(isAdminPreview);
      if (!campaign) {
        return sendJson(res, 404, { error: 'Nenhuma campanha ativa no momento.' });
      }

      return sendJson(res, 200, {
        campaign,
        sweatsAvailable: isAdminPreview ? true : Boolean(campaign.is_available) && isSweatsAvailable,
        isSandbox: isPaymentSandbox(),
        isAdminPreview,
        showTestShop: isTestShopAllowed,
      });
    }

    // 2. POST /api/shop/create-payment-intent - Preparar encomenda em memória + criar PaymentIntent Stripe
    // NUNCA grava na tabela da BD a menos que esteja já pago e confirmado
    if (pathname === '/api/shop/create-payment-intent' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const isTestShopAllowed = isShowTestShopEnv();
      const isAdmin =
        verifyAdminToken(req) ||
        (body.adminToken && verifyAdminTokenString(body.adminToken));
      const isAdminPreview = Boolean(isAdmin && body.adminPreview && isTestShopAllowed);

      // Apenas prepara em memória e valida dados (não grava na BD)
      const order = preparePendingShopOrder(body, isAdminPreview);

      const paymentResult = await createAutomaticPaymentIntent({
        orderId: order.id,
        amount: order.total_amount,
        studentEmail: order.student_email,
        studentName: order.student_name,
        description: isAdminPreview
          ? `NEEI - Sweat ${order.size} (Modo Teste 50c)`
          : `NEEI - Sweat ${order.size}`,
        metadata: {
          order_id: order.id,
          student_name: order.student_name,
          student_email: order.student_email,
          phone_number: order.phone_number,
          nif: order.nif || '',
          size: order.size,
          color: order.color || 'Preto',
          delivery_type: order.delivery_type,
          shipping_address: order.shipping_address || '',
          shipping_postal_code: order.shipping_postal_code || '',
          shipping_city: order.shipping_city || '',
          item_price: String(order.item_price),
          shipping_fee: String(order.shipping_fee),
          total_amount: String(order.total_amount),
          is_admin_preview: isAdminPreview ? '1' : '0',
        },
      });

      if (!paymentResult.success) {
        return sendJson(res, 400, {
          error: paymentResult.message || 'Falha ao criar pedido de pagamento.',
        });
      }

      order.payment_ref = paymentResult.paymentIntentId;
      pendingOrdersCache.set(order.id, order);

      return sendJson(res, 201, {
        success: true,
        orderId: order.id,
        totalAmount: order.total_amount,
        clientSecret: paymentResult.clientSecret,
        publishableKey: paymentResult.publishableKey,
        provider: paymentResult.provider,
        isSandbox: isPaymentSandbox(),
        isAdminPreview,
      });
    }

    // 3. POST /api/shop/checkout - Iniciar pagamento direto MB WAY
    if (pathname === '/api/shop/checkout' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const isTestShopAllowed = isShowTestShopEnv();
      const isAdmin =
        verifyAdminToken(req) ||
        (body.adminToken && verifyAdminTokenString(body.adminToken));
      const isAdminPreview = Boolean(isAdmin && body.adminPreview && isTestShopAllowed);

      const order = preparePendingShopOrder(body, isAdminPreview);

      // Inicia pagamento via Stripe
      const paymentResult = await initiateMbWayPayment({
        orderId: order.id,
        amount: order.total_amount,
        mobileNumber: order.phone_number,
        studentEmail: order.student_email,
        studentName: order.student_name,
        description: `NEEI - Sweat ${order.size}`,
      });

      if (!paymentResult.success) {
        return sendJson(res, 400, {
          error: paymentResult.message || 'Falha ao solicitar pagamento.',
        });
      }

      const paymentRef = paymentResult.paymentIntentId || paymentResult.requestId;
      order.payment_ref = paymentRef;
      pendingOrdersCache.set(order.id, order);

      return sendJson(res, 201, {
        success: true,
        orderId: order.id,
        totalAmount: order.total_amount,
        phoneNumber: order.phone_number,
        expiresInSeconds: paymentResult.expiresInSeconds || 300,
        message: paymentResult.message,
        clientSecret: paymentResult.clientSecret,
        provider: paymentResult.provider,
        isSandbox: isPaymentSandbox(),
      });
    }

    // 4. POST /api/shop/checkout-session - Criar sessão Stripe Checkout
    if (pathname === '/api/shop/checkout-session' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const order = preparePendingShopOrder(body);

      const baseUrl = `http://${req.headers.host || 'localhost:3000'}`;
      const sessionResult = await createCheckoutSession({
        order,
        successUrl: `${baseUrl}/merch?payment_intent_done=1&orderId=${order.id}`,
        cancelUrl: `${baseUrl}/merch?canceled=true&orderId=${order.id}`,
      });

      if (!sessionResult.success) {
        return sendJson(res, 400, {
          error: sessionResult.message || 'Erro ao gerar sessão de pagamento Stripe.',
        });
      }

      order.payment_ref = sessionResult.sessionId;
      pendingOrdersCache.set(order.id, order);

      return sendJson(res, 201, {
        success: true,
        orderId: order.id,
        checkoutUrl: sessionResult.url,
        sessionId: sessionResult.sessionId,
      });
    }

    // 5. GET /api/shop/order-status/:id ou /api/shop/track/:id - Consultar e rastrear estado da encomenda
    if (
      (pathname.startsWith('/api/shop/order-status/') || pathname.startsWith('/api/shop/track/')) &&
      req.method === 'GET'
    ) {
      const rawId = decodeURIComponent(
        pathname.startsWith('/api/shop/order-status/')
          ? pathname.replace('/api/shop/order-status/', '')
          : pathname.replace('/api/shop/track/', '')
      ).trim();
      const orderId = rawId.replace(/^#/, '');

      let order = getShopOrderById(orderId);
      if (!order) {
        order = getPendingShopOrder(orderId);
      }

      if (!order) {
        return sendJson(res, 404, { error: 'Encomenda não encontrada.' });
      }

      const campaign = getActiveShopCampaign();
      const pickupLocation =
        campaign?.pickup_location || 'Gabinete NEEI (Sala 0.18, Edifício 1, Campus de Gambelas)';

      return sendJson(res, 200, {
        orderId: order.id,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        paidAt: order.paid_at || null,
        createdAt: order.created_at || null,
        studentName: order.student_name,
        size: order.size,
        color: order.color || 'Preto',
        totalAmount: order.total_amount,
        deliveryType: order.delivery_type,
        shippingCity: order.shipping_city || null,
        pickupLocation,
      });
    }

    // 6. POST /api/shop/confirm-payment - Validação e registo do pagamento após conclusão no widget/redirect
    if (pathname === '/api/shop/confirm-payment' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { orderId, paymentIntentId } = body;

      if (!orderId) {
        return sendJson(res, 400, { error: 'orderId é obrigatório' });
      }

      let order = getShopOrderById(orderId);
      if (order && order.payment_status === 'paid') {
        return sendJson(res, 200, { success: true, order });
      }

      const pending = getPendingShopOrder(orderId);
      if (!pending && !order) {
        return sendJson(res, 404, { error: 'Encomenda não encontrada ou já expirada.' });
      }

      let isPaid = isPaymentSandbox();
      if (!isPaid && paymentIntentId && !isStripeSandbox()) {
        try {
          const stripe = getStripeClient();
          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (pi && pi.status === 'succeeded') {
            isPaid = true;
          }
        } catch (e) {
          console.error('[CONFIRM PAYMENT ERROR]', e.message);
        }
      }

      if (isPaid) {
        if (!order) {
          order = recordPaidShopOrder(pending, paymentIntentId || `client-confirmed-${Date.now()}`);
        } else {
          order = updateShopOrderPaymentStatus(order.id, 'paid', paymentIntentId);
        }

        if (order && !order.email_sent) {
          try {
            const emailResult = await sendOrderConfirmationEmail(order);
            if (emailResult && emailResult.success) {
              updateShopOrderEmailSent(order.id);
            }
          } catch (mailErr) {
            console.error('[CONFIRM EMAIL ERROR]', mailErr.message);
          }
        }

        return sendJson(res, 200, { success: true, order });
      }

      return sendJson(res, 400, { error: 'Pagamento ainda não confirmado pela rede.' });
    }

    // 7. POST /api/webhooks/stripe - Callback oficial da Stripe (PaymentIntent & Checkout Sessions)
    if (pathname === '/api/webhooks/stripe' && req.method === 'POST') {
      const signature = req.headers['stripe-signature'];
      const rawBody = await readRawBody(req);
      let event;

      try {
        event = verifyStripeWebhook(rawBody, signature);
      } catch (err) {
        console.error('[STRIPE WEBHOOK SIGNATURE ERROR]', err.message);
        return sendJson(res, 400, { error: `Webhook Error: ${err.message}` });
      }

      console.log(`[STRIPE WEBHOOK] Evento recebido: ${event.type}`);

      // Pagamento bem sucedido via PaymentIntent
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data?.object || {};
        const orderId = paymentIntent.metadata?.order_id;

        if (orderId) {
          let order = getShopOrderById(orderId);
          if (!order) {
            const pendingOrder = getPendingShopOrder(orderId) || {
              id: orderId,
              student_name: paymentIntent.metadata?.student_name,
              student_email: paymentIntent.metadata?.student_email,
              phone_number: paymentIntent.metadata?.phone_number,
              nif: paymentIntent.metadata?.nif,
              size: paymentIntent.metadata?.size,
              color: paymentIntent.metadata?.color || 'Preto',
              delivery_type: paymentIntent.metadata?.delivery_type,
              shipping_address: paymentIntent.metadata?.shipping_address,
              shipping_postal_code: paymentIntent.metadata?.shipping_postal_code,
              shipping_city: paymentIntent.metadata?.shipping_city,
              item_price: Number(paymentIntent.metadata?.item_price || 0),
              shipping_fee: Number(paymentIntent.metadata?.shipping_fee || 0),
              total_amount: Number(paymentIntent.metadata?.total_amount || (paymentIntent.amount ? paymentIntent.amount / 100 : 0)),
              isAdminPreview: paymentIntent.metadata?.is_admin_preview === '1',
            };
            order = recordPaidShopOrder(pendingOrder, paymentIntent.id, new Date().toISOString());
          } else if (order.payment_status !== 'paid') {
            order = updateShopOrderPaymentStatus(
              order.id,
              'paid',
              paymentIntent.id,
              new Date().toISOString()
            );
          }

          if (order && !order.email_sent) {
            try {
              const emailResult = await sendOrderConfirmationEmail(order);
              if (emailResult && emailResult.success) {
                updateShopOrderEmailSent(order.id);
              }
            } catch (mailErr) {
              console.error('[WEBHOOK ERROR] Falha no disparo do email:', mailErr);
            }
          }
        }
      }

      // Pagamento bem sucedido via Stripe Checkout Session
      if (event.type === 'checkout.session.completed') {
        const session = event.data?.object || {};
        const orderId = session.client_reference_id || session.metadata?.order_id;

        if (orderId) {
          let order = getShopOrderById(orderId);
          if (!order) {
            const pendingOrder = getPendingShopOrder(orderId) || {
              id: orderId,
              student_name: session.customer_details?.name,
              student_email: session.customer_details?.email || session.customer_email,
              phone_number: session.customer_details?.phone || '',
              size: session.metadata?.size || 'M',
              color: 'Preto',
              delivery_type: 'pickup',
              item_price: Number(session.amount_total ? session.amount_total / 100 : 25),
              shipping_fee: 0,
              total_amount: Number(session.amount_total ? session.amount_total / 100 : 25),
            };
            order = recordPaidShopOrder(pendingOrder, session.payment_intent || session.id, new Date().toISOString());
          } else if (order.payment_status !== 'paid') {
            order = updateShopOrderPaymentStatus(
              order.id,
              'paid',
              session.payment_intent || session.id,
              new Date().toISOString()
            );
          }

          if (order && !order.email_sent) {
            try {
              const emailResult = await sendOrderConfirmationEmail(order);
              if (emailResult && emailResult.success) {
                updateShopOrderEmailSent(order.id);
              }
            } catch (mailErr) {
              console.error('[WEBHOOK ERROR] Falha no disparo do email:', mailErr);
            }
          }
        }
      }

      // Falha no pagamento
      if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data?.object || {};
        const orderId = paymentIntent.metadata?.order_id;
        if (orderId) {
          const order = getShopOrderById(orderId);
          if (order) {
            updateShopOrderPaymentStatus(orderId, 'failed');
          }
        }
      }

      return sendJson(res, 200, { received: true });
    }

    // 8. POST ou GET /api/webhooks/ifthenpay - Fallback para webhook legado
    if (pathname === '/api/webhooks/ifthenpay' || pathname === '/api/shop/webhook') {
      let params = {};
      let body = {};

      if (req.method === 'GET') {
        params = Object.fromEntries(searchParams || []);
      } else if (req.method === 'POST') {
        body = await readJsonBody(req);
      }

      const orderId =
        body.orderId || body.order_id || body.referencia || params.orderId || params.referencia;
      const estado = (body.estado || body.status || params.estado || 'PAGO').toUpperCase();

      if (!orderId) {
        return sendJson(res, 400, { error: 'ID de encomenda não especificado no webhook' });
      }

      let order = getShopOrderById(orderId);
      if (!order) {
        const pending = getPendingShopOrder(orderId);
        if (pending) {
          order = recordPaidShopOrder(pending, body.requestId || params.requestId || 'webhook-ifthenpay');
        } else {
          return sendJson(res, 404, { error: 'Encomenda não encontrada' });
        }
      }

      if (estado === 'PAGO' || estado === 'PAID' || estado === '000') {
        if (order.payment_status !== 'paid') {
          const updatedOrder = updateShopOrderPaymentStatus(
            order.id,
            'paid',
            body.requestId || params.requestId || 'webhook-ifthenpay',
            new Date().toISOString()
          );

          try {
            const emailResult = await sendOrderConfirmationEmail(updatedOrder);
            if (emailResult && emailResult.success) {
              updateShopOrderEmailSent(updatedOrder.id);
            }
          } catch (mailErr) {
            console.error('[WEBHOOK ERROR] Falha no disparo do email:', mailErr);
          }
        }

        return sendJson(res, 200, { status: 'ok', message: 'Pagamento registado com sucesso' });
      } else {
        updateShopOrderPaymentStatus(order.id, 'failed');
        return sendJson(res, 200, { status: 'failed', message: 'Pagamento rejeitado ou expirado' });
      }
    }

    // 9. POST /api/shop/simulate-payment - Simulação manual para testes em Sandbox
    if (pathname === '/api/shop/simulate-payment' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { orderId } = body;

      if (!orderId) {
        return sendJson(res, 400, { error: 'orderId é obrigatório' });
      }

      let order = getShopOrderById(orderId);
      if (!order) {
        const pending = getPendingShopOrder(orderId);
        if (!pending) {
          return sendJson(res, 404, { error: 'Encomenda não encontrada' });
        }
        order = recordPaidShopOrder(pending, `simulated-${Date.now()}`);
      } else {
        order = updateShopOrderPaymentStatus(
          order.id,
          'paid',
          `simulated-${Date.now()}`,
          new Date().toISOString()
        );
      }

      // Dispara email
      const emailResult = await sendOrderConfirmationEmail(order);
      if (emailResult && emailResult.success) {
        updateShopOrderEmailSent(order.id);
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Pagamento simulado com sucesso e email de confirmação despachado.',
        order,
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

      // PATCH /api/admin/shop/orders/bulk-status - Atualizar estado de múltiplas encomendas de uma só vez
      if (
        (pathname === '/api/admin/shop/orders/bulk-status' ||
          pathname === '/api/admin/shop/orders/bulk-status/') &&
        (req.method === 'PATCH' || req.method === 'POST')
      ) {
        const body = await readJsonBody(req);
        const { order_ids, order_status } = body;

        if (!Array.isArray(order_ids) || order_ids.length === 0) {
          return sendJson(res, 400, {
            error: 'order_ids deve ser uma lista não vazia de identificadores de encomenda',
          });
        }

        if (!order_status) {
          return sendJson(res, 400, { error: 'order_status é obrigatório' });
        }

        try {
          const updatedCount = updateMultipleShopOrderStatus(order_ids, order_status);
          return sendJson(res, 200, { success: true, updatedCount });
        } catch (err) {
          return sendJson(res, 400, { error: err.message || 'Erro ao atualizar encomendas' });
        }
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

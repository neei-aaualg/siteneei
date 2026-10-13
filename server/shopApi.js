import { readJsonBody, readRawBody, sendJson } from './api.js';
import { verifyAdminToken, verifyAdminTokenString } from './auth.js';
import { getCanonicalAppUrl } from './security.js';
import {
  getActiveShopCampaign,
  getAllShopCampaigns,
  getActiveShopCampaigns,
  getShopCampaignById,
  createShopCampaign,
  deleteShopCampaign,
  updateShopCampaign,
  preparePendingShopOrder,
  getPendingShopOrder,
  recordPaidShopOrder,
  createShopOrder,
  getShopOrderById,
  getShopOrderByPaymentRef,
  updateShopOrderPaymentStatus,
  updateShopOrderEmailSent,
  updateShopOrderStatus,
  updateMultipleShopOrderStatus,
  appendShopOrderAdminNotes,
  calculatePaymentFee,
  getAllShopOrders,
  getShopSummaryStats,
  getFactoryExportData,
  isSweatsAvailableEnv,
  isShowTestShopEnv,
  pendingOrdersCache,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
  createAdminManualOrder,
} from './db.js';
import {
  sendOrderConfirmationEmail,
  isSmtpConfigured,
  verifySmtpConnection,
} from './services/emailService.js';
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
      const isAdmin = verifyAdminToken(req);
      const wantsPreview =
        searchParams?.get('admin_preview') === '1' || searchParams?.get('admin_preview') === 'true';
      const isSweatsAvailable = isSweatsAvailableEnv();
      const isTestShopAllowed = isShowTestShopEnv();
      const isAdminPreview = Boolean(isAdmin && wantsPreview && isTestShopAllowed);

      const campaign = getActiveShopCampaign(isAdminPreview);
      const campaigns = getActiveShopCampaigns(isAdminPreview);
      if (!campaign) {
        return sendJson(res, 404, { error: 'Nenhuma campanha ativa no momento.' });
      }

      return sendJson(res, 200, {
        campaign,
        campaigns,
        sweatsAvailable: isAdminPreview ? true : Boolean(campaign.is_available) && isSweatsAvailable,
        isSandbox: isPaymentSandbox(),
        isAdminPreview,
        showTestShop: isTestShopAllowed,
      });
    }

    // 1b. GET /api/shop/products - Obter todos os produtos/artigos ativos
    if (pathname === '/api/shop/products' && req.method === 'GET') {
      const isAdmin = verifyAdminToken(req);
      const wantsPreview =
        searchParams?.get('admin_preview') === '1' || searchParams?.get('admin_preview') === 'true';
      const isTestShopAllowed = isShowTestShopEnv();
      const isAdminPreview = Boolean(isAdmin && wantsPreview && isTestShopAllowed);
      const products = getActiveShopCampaigns(isAdminPreview);
      return sendJson(res, 200, { products });
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
        phoneNumber: order.phone_number,
        shippingAddress: order.shipping_address,
        shippingPostalCode: order.shipping_postal_code,
        shippingCity: order.shipping_city,
        description: isAdminPreview
          ? `NEEI - ${order.item_name} ${order.size} (Modo Teste 50c)`
          : `NEEI - ${order.item_name} ${order.size}`,
        metadata: {
          order_id: order.id,
          campaign_id: order.campaign_id,
          item_name: order.item_name,
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
          payment_fee: String(order.payment_fee || 0),
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
        itemName: order.item_name,
        itemPrice: order.item_price,
        shippingFee: order.shipping_fee,
        paymentFee: order.payment_fee || 0,
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
          payment_fee: String(order.payment_fee || 0),
          total_amount: String(order.total_amount),
          is_admin_preview: isAdminPreview ? '1' : '0',
        },
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
        itemName: order.item_name,
        itemPrice: order.item_price,
        shippingFee: order.shipping_fee,
        paymentFee: order.payment_fee || 0,
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

      const baseUrl = getCanonicalAppUrl(req);
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
        itemName: order.item_name || 'Sweat Oficial Engenharia Informática',
        size: order.size,
        color: order.color || 'Preto',
        itemPrice: order.item_price,
        shippingFee: order.shipping_fee,
        paymentFee: order.payment_fee || 0,
        totalAmount: order.total_amount,
        deliveryType: order.delivery_type,
        shippingAddress: order.shipping_address || null,
        shippingPostalCode: order.shipping_postal_code || null,
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

      const targetOrder = order || pending;
      const expectedAmountInCents = Math.round(Number(targetOrder.total_amount) * 100);

      let isPaid = false;
      let confirmedRef = paymentIntentId;

      // Fail-Closed: Em ambiente de produção NUNCA aceita sandbox sem validação Stripe
      const isProd = process.env.NODE_ENV === 'production';
      if (!isProd && isStripeSandbox()) {
        isPaid = true;
        confirmedRef = paymentIntentId || `client-confirmed-${Date.now()}`;
      } else if (paymentIntentId) {
        try {
          const stripe = getStripeClient();
          if (!stripe) {
            return sendJson(res, 500, { error: 'Serviço de pagamentos não configurado no servidor.' });
          }

          // Prevenção contra reutilização de PaymentIntent (Double Spending / PI Reuse attack)
          const existingWithRef = getShopOrderByPaymentRef(paymentIntentId);
          if (existingWithRef && existingWithRef.id !== targetOrder.id) {
            console.warn(
              `[CONFIRM PAYMENT WARNING] Tentativa de reutilização do PaymentIntent ${paymentIntentId} na encomenda ${targetOrder.id} (já associado a ${existingWithRef.id})`
            );
            return sendJson(res, 400, { error: 'Este identificador de pagamento já foi utilizado.' });
          }

          const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (!pi) {
            return sendJson(res, 400, { error: 'PaymentIntent não encontrado na Stripe.' });
          }

          // A1: Validação de moeda
          if ((pi.currency || '').toLowerCase() !== 'eur') {
            console.warn(`[CONFIRM PAYMENT] Moeda inválida: ${pi.currency} (esperado: eur)`);
            return sendJson(res, 400, { error: 'Moeda de pagamento inválida.' });
          }

          // A1: Validação de valor vs total da encomenda
          const receivedAmount = pi.amount_received || pi.amount || 0;
          if (receivedAmount !== expectedAmountInCents) {
            console.warn(
              `[CONFIRM PAYMENT] Valor incorreto: recebido ${receivedAmount} cêntimos, esperado ${expectedAmountInCents} cêntimos para ${targetOrder.id}`
            );
            return sendJson(res, 400, { error: 'O valor pago não coincide com o total da encomenda.' });
          }

          // A1: Validação de order_id nos metadados do PaymentIntent
          const piOrderId = pi.metadata?.order_id;
          if (piOrderId && piOrderId.toUpperCase() !== targetOrder.id.toUpperCase()) {
            console.warn(`[CONFIRM PAYMENT] Encomenda no PI (${piOrderId}) não coincide com o pedido (${targetOrder.id})`);
            return sendJson(res, 400, { error: 'Identificador de encomenda não corresponde a este pagamento.' });
          }

          if (pi.status === 'succeeded') {
            isPaid = true;
            confirmedRef = pi.id;
          }
        } catch (e) {
          console.error('[CONFIRM PAYMENT ERROR]', e.message);
          return sendJson(res, 400, { error: 'Falha ao validar estado do pagamento na Stripe.' });
        }
      }

      if (isPaid) {
        if (!order) {
          order = recordPaidShopOrder(pending, confirmedRef);
        } else {
          order = updateShopOrderPaymentStatus(order.id, 'paid', confirmedRef);
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

      console.log(`[STRIPE WEBHOOK] Evento recebido: ${event.type} (ID: ${event.id})`);

      // Deduplicação de eventos do webhook (Prevenção contra Replay Attacks)
      if (event.id && isWebhookEventProcessed(event.id)) {
        console.log(`[STRIPE WEBHOOK] Evento já processado anteriormente (deduplicated): ${event.id}`);
        return sendJson(res, 200, { received: true, deduplicated: true });
      }
      if (event.id) {
        markWebhookEventProcessed(event.id);
      }

      // Pagamento bem sucedido via PaymentIntent
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data?.object || {};
        const orderId = paymentIntent.metadata?.order_id;

        // Se estiver em modo real com Stripe, valida diretamente com a API Stripe para prevenir spoofing
        if (!isStripeSandbox() && paymentIntent.id) {
          try {
            const stripe = getStripeClient();
            if (stripe) {
              const verifiedPi = await stripe.paymentIntents.retrieve(paymentIntent.id);
              if (!verifiedPi || verifiedPi.status !== 'succeeded') {
                console.warn('[STRIPE WEBHOOK] PaymentIntent não confirmado na API Stripe:', paymentIntent.id);
                return sendJson(res, 400, { error: 'PaymentIntent status not succeeded' });
              }
            }
          } catch (vErr) {
            console.error('[STRIPE WEBHOOK VERIFY ERROR]', vErr.message);
            return sendJson(res, 400, { error: 'Falha ao validar PaymentIntent na Stripe' });
          }
        }

        // A1: Validação de moeda
        if (paymentIntent.currency && paymentIntent.currency.toLowerCase() !== 'eur') {
          console.warn(`[STRIPE WEBHOOK] Moeda inválida: ${paymentIntent.currency}`);
          return sendJson(res, 400, { error: 'Moeda inválida' });
        }

        if (orderId) {
          // Prevenção contra reutilização de PI
          const existingWithRef = getShopOrderByPaymentRef(paymentIntent.id);
          if (existingWithRef && existingWithRef.id !== orderId) {
            console.warn(
              `[STRIPE WEBHOOK SECURITY] Reutilização de PaymentIntent ${paymentIntent.id} na encomenda ${orderId} (já pertence a ${existingWithRef.id})`
            );
            return sendJson(res, 400, { error: 'PaymentIntent já associado a outra encomenda' });
          }

          let order = getShopOrderById(orderId);
          const pendingOrder = getPendingShopOrder(orderId);
          const targetOrder = order || pendingOrder;
          const paidAmount = paymentIntent.amount_received || paymentIntent.amount || 0;

          if (targetOrder) {
            // A1: Validação estrita do valor pago vs total da encomenda
            const expectedCents = Math.round(Number(targetOrder.total_amount) * 100);
            if (paidAmount !== expectedCents) {
              console.error(
                `[STRIPE WEBHOOK SECURITY] Discrepância de montante para encomenda ${orderId}: recebido ${paidAmount} cêntimos, esperado ${expectedCents} cêntimos`
              );
              return sendJson(res, 400, { error: 'Montante pago não coincide com a encomenda' });
            }

            if (!order) {
              order = recordPaidShopOrder(pendingOrder, paymentIntent.id, new Date().toISOString());
            } else if (order.payment_status !== 'paid') {
              order = updateShopOrderPaymentStatus(
                order.id,
                'paid',
                paymentIntent.id,
                new Date().toISOString()
              );
            }
          } else {
            // A4 Fallback: Quando nem a encomenda nem o pendente existem em cache (ex: reinício de servidor)
            // Validação estrita dos metadados contra a campanha ativa (NUNCA confiar cegamente na metadata do atacante)
            const campaign = getActiveShopCampaign();
            const studentEmail = (paymentIntent.metadata?.student_email || '').trim().toLowerCase();
            const studentName = (paymentIntent.metadata?.student_name || '').trim();
            const size = (paymentIntent.metadata?.size || '').toUpperCase().trim();
            const deliveryType = paymentIntent.metadata?.delivery_type === 'shipping' ? 'shipping' : 'pickup';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
              campaign &&
              studentName.length >= 3 &&
              emailRegex.test(studentEmail) &&
              campaign.sizes_available.includes(size)
            ) {
              const itemPrice = campaign.item_price;
              const shippingFee = deliveryType === 'shipping' ? campaign.shipping_fee : 0;
              const paymentFee = calculatePaymentFee(itemPrice + shippingFee);
              const expectedTotal = Math.round((itemPrice + shippingFee + paymentFee) * 100) / 100;
              const expectedCents = Math.round(expectedTotal * 100);

              if (paidAmount === expectedCents) {
                const reconstructedOrder = {
                  id: orderId,
                  campaign_id: campaign.id,
                  item_name: campaign.item_name || 'Sweat Oficial Engenharia Informática',
                  student_name: studentName,
                  student_email: studentEmail,
                  phone_number: paymentIntent.metadata?.phone_number || '',
                  nif: paymentIntent.metadata?.nif || 'Consumidor Final',
                  size,
                  color: paymentIntent.metadata?.color || 'Preto',
                  delivery_type: deliveryType,
                  shipping_address: paymentIntent.metadata?.shipping_address || null,
                  shipping_postal_code: paymentIntent.metadata?.shipping_postal_code || null,
                  shipping_city: paymentIntent.metadata?.shipping_city || null,
                  item_price: itemPrice,
                  shipping_fee: shippingFee,
                  payment_fee: paymentFee,
                  total_amount: expectedTotal,
                  isAdminPreview: paymentIntent.metadata?.is_admin_preview === '1',
                };
                order = recordPaidShopOrder(reconstructedOrder, paymentIntent.id, new Date().toISOString());
              } else {
                console.error(
                  `[STRIPE WEBHOOK SECURITY] Rejeitado webhook fallback: valor recebido ${paidAmount} != esperado ${expectedCents}`
                );
                return sendJson(res, 400, { error: 'Montante forjado ou inconsistente com a campanha' });
              }
            } else {
              console.error('[STRIPE WEBHOOK SECURITY] Rejeitado webhook fallback: metadados inválidos ou inexistentes');
              return sendJson(res, 400, { error: 'Metadados inválidos para criação da encomenda' });
            }
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
      if (
        event.type === 'checkout.session.completed' ||
        event.type === 'checkout.session.async_payment_succeeded'
      ) {
        const session = event.data?.object || {};

        // A2: Em pagamentos assíncronos, checkout.session.completed pode ter payment_status !== 'paid'
        if (session.payment_status !== 'paid') {
          console.log(`[STRIPE WEBHOOK] Sessão ${session.id} não paga ainda (payment_status: ${session.payment_status}). Aguardando liquidação.`);
          return sendJson(res, 200, { received: true, payment_status: session.payment_status });
        }

        const orderId = session.client_reference_id || session.metadata?.order_id;
        const paymentRef = session.payment_intent || session.id;

        if (session.currency && session.currency.toLowerCase() !== 'eur') {
          console.warn(`[STRIPE WEBHOOK] Moeda inválida na sessão: ${session.currency}`);
          return sendJson(res, 400, { error: 'Moeda inválida' });
        }

        if (orderId) {
          const existingWithRef = getShopOrderByPaymentRef(paymentRef);
          if (existingWithRef && existingWithRef.id !== orderId) {
            console.warn(
              `[STRIPE WEBHOOK SECURITY] Reutilização de sessão/PI ${paymentRef} na encomenda ${orderId} (já pertence a ${existingWithRef.id})`
            );
            return sendJson(res, 400, { error: 'Referência de pagamento já associada a outra encomenda' });
          }

          let order = getShopOrderById(orderId);
          const pendingOrder = getPendingShopOrder(orderId);
          const targetOrder = order || pendingOrder;
          const paidAmount = session.amount_total || 0;

          if (targetOrder) {
            const expectedCents = Math.round(Number(targetOrder.total_amount) * 100);
            if (paidAmount !== expectedCents) {
              console.error(`[STRIPE WEBHOOK SECURITY] Discrepância na sessão Checkout: recebido ${paidAmount}, esperado ${expectedCents}`);
              return sendJson(res, 400, { error: 'Montante pago não coincide com a encomenda' });
            }

            if (!order) {
              order = recordPaidShopOrder(pendingOrder, paymentRef, new Date().toISOString());
            } else if (order.payment_status !== 'paid') {
              order = updateShopOrderPaymentStatus(
                order.id,
                'paid',
                paymentRef,
                new Date().toISOString()
              );
            }
          } else {
            // A4 Fallback com validação contra campanha
            const campaign = getActiveShopCampaign();
            const studentEmail = (
              session.metadata?.student_email ||
              session.customer_details?.email ||
              session.customer_email ||
              ''
            ).trim().toLowerCase();
            const studentName = (session.metadata?.student_name || session.customer_details?.name || '').trim();
            const size = (session.metadata?.size || 'M').toUpperCase().trim();
            const deliveryType = session.metadata?.delivery_type === 'shipping' ? 'shipping' : 'pickup';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
              campaign &&
              studentName.length >= 3 &&
              emailRegex.test(studentEmail) &&
              campaign.sizes_available.includes(size)
            ) {
              const itemPrice = campaign.item_price;
              const shippingFee = deliveryType === 'shipping' ? campaign.shipping_fee : 0;
              const paymentFee = calculatePaymentFee(itemPrice + shippingFee);
              const expectedTotal = Math.round((itemPrice + shippingFee + paymentFee) * 100) / 100;
              const expectedCents = Math.round(expectedTotal * 100);

              if (paidAmount === expectedCents) {
                const reconstructedOrder = {
                  id: orderId,
                  campaign_id: campaign.id,
                  item_name: campaign.item_name || 'Sweat Oficial Engenharia Informática',
                  student_name: studentName,
                  student_email: studentEmail,
                  phone_number: session.metadata?.phone_number || session.customer_details?.phone || '',
                  nif: session.metadata?.nif || 'Consumidor Final',
                  size,
                  color: session.metadata?.color || 'Preto',
                  delivery_type: deliveryType,
                  shipping_address: session.metadata?.shipping_address || null,
                  shipping_postal_code: session.metadata?.shipping_postal_code || null,
                  shipping_city: session.metadata?.shipping_city || null,
                  item_price: itemPrice,
                  shipping_fee: shippingFee,
                  payment_fee: paymentFee,
                  total_amount: expectedTotal,
                };
                order = recordPaidShopOrder(reconstructedOrder, paymentRef, new Date().toISOString());
              } else {
                return sendJson(res, 400, { error: 'Montante forjado ou inconsistente com a campanha' });
              }
            } else {
              return sendJson(res, 400, { error: 'Metadados da sessão inválidos' });
            }
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

      // Falha no pagamento (M2)
      if (
        event.type === 'payment_intent.payment_failed' ||
        event.type === 'payment_intent.canceled' ||
        event.type === 'checkout.session.async_payment_failed'
      ) {
        const obj = event.data?.object || {};
        const orderId = obj.metadata?.order_id || obj.client_reference_id;
        if (orderId) {
          const order = getShopOrderById(orderId);
          if (order && order.payment_status !== 'paid') {
            updateShopOrderPaymentStatus(orderId, 'failed');
            console.log(`[STRIPE WEBHOOK] Encomenda ${orderId} marcada como falhada (${event.type})`);
          }
        }
      }

      // Expiração da sessão Checkout (M2)
      if (event.type === 'checkout.session.expired') {
        const session = event.data?.object || {};
        const orderId = session.metadata?.order_id || session.client_reference_id;
        if (orderId) {
          const order = getShopOrderById(orderId);
          if (order && order.payment_status !== 'paid') {
            updateShopOrderPaymentStatus(orderId, 'expired');
            console.log(`[STRIPE WEBHOOK] Encomenda ${orderId} marcada como expirada (checkout.session.expired)`);
          }
        }
      }

      // Reembolso de pagamento (M2)
      if (event.type === 'charge.refunded') {
        const charge = event.data?.object || {};
        const paymentRef = charge.payment_intent || charge.id;
        const order =
          getShopOrderByPaymentRef(paymentRef) ||
          (charge.metadata?.order_id ? getShopOrderById(charge.metadata.order_id) : null);
        if (order) {
          const refundAmount = ((charge.amount_refunded || 0) / 100).toFixed(2);
          const refundNote = `[REEMBOLSO STRIPE] Valor: ${refundAmount}€ em ${new Date().toISOString()}`;
          console.log(`[STRIPE AUDIT] Reembolso registado para encomenda ${order.id}: ${refundAmount}€`);
          appendShopOrderAdminNotes(order.id, refundNote);
        }
      }

      // Abertura de disputa / contestação bancária (M2)
      if (event.type === 'charge.dispute.created') {
        const dispute = event.data?.object || {};
        const paymentRef = dispute.payment_intent || dispute.charge;
        const order =
          getShopOrderByPaymentRef(paymentRef) ||
          (dispute.metadata?.order_id ? getShopOrderById(dispute.metadata.order_id) : null);
        if (order) {
          const disputeAmount = ((dispute.amount || 0) / 100).toFixed(2);
          const disputeNote = `[DISPUTA BANCÁRIA STRIPE] Disputa ${dispute.id} (${disputeAmount}€) iniciada em ${new Date().toISOString()}`;
          console.warn(`[STRIPE AUDIT WARNING] Disputa aberta para encomenda ${order.id}: ${dispute.id}`);
          appendShopOrderAdminNotes(order.id, disputeNote);
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
      if (process.env.NODE_ENV === 'production' && !isPaymentSandbox()) {
        return sendJson(res, 403, { error: 'Simulação desativada em ambiente de produção.' });
      }

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

      // GET /api/admin/shop/products - Listar todos os produtos/campanhas
      if (pathname === '/api/admin/shop/products' && req.method === 'GET') {
        const products = getAllShopCampaigns();
        return sendJson(res, 200, { products });
      }

      // POST /api/admin/shop/products - Criar novo produto
      if (pathname === '/api/admin/shop/products' && req.method === 'POST') {
        const body = await readJsonBody(req);
        try {
          const product = createShopCampaign(body);
          return sendJson(res, 201, { product, message: 'Produto criado com sucesso' });
        } catch (err) {
          return sendJson(res, 400, { error: err.message || 'Erro ao criar produto' });
        }
      }

      // PUT /api/admin/shop/products/:id - Atualizar produto existente
      if (pathname.startsWith('/api/admin/shop/products/') && req.method === 'PUT') {
        const productId = pathname.replace('/api/admin/shop/products/', '').trim();
        const body = await readJsonBody(req);
        try {
          const updated = updateShopCampaign(productId, body);
          return sendJson(res, 200, { product: updated, message: 'Produto atualizado com sucesso' });
        } catch (err) {
          return sendJson(res, 400, { error: err.message || 'Erro ao atualizar produto' });
        }
      }

      // DELETE /api/admin/shop/products/:id - Eliminar produto
      if (pathname.startsWith('/api/admin/shop/products/') && req.method === 'DELETE') {
        const productId = pathname.replace('/api/admin/shop/products/', '').trim();
        try {
          deleteShopCampaign(productId);
          return sendJson(res, 200, { success: true, message: 'Produto eliminado com sucesso' });
        } catch (err) {
          return sendJson(res, 400, { error: err.message || 'Erro ao eliminar produto' });
        }
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
          is_admin_created: searchParams?.get('is_admin_created') || undefined,
          search: searchParams?.get('search') || undefined,
        };

        const orders = getAllShopOrders(filters);
        return sendJson(res, 200, { orders });
      }

      // POST /api/admin/shop/orders - Criar encomenda manualmente por administrador
      if (pathname === '/api/admin/shop/orders' && req.method === 'POST') {
        const body = await readJsonBody(req);
        try {
          const newOrder = createAdminManualOrder(body);
          if (body.send_email && newOrder.payment_status === 'paid') {
            try {
              const mailRes = await sendOrderConfirmationEmail(newOrder);
              if (mailRes && mailRes.success) {
                updateShopOrderEmailSent(newOrder.id);
              }
            } catch (mailErr) {
              console.error('[ADMIN MANUAL ORDER EMAIL ERROR]', mailErr.message);
            }
          }
          return sendJson(res, 201, { success: true, order: newOrder });
        } catch (err) {
          return sendJson(res, 400, { error: err.message || 'Erro ao criar encomenda manual' });
        }
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

      // GET /api/admin/shop/smtp-status - Verificar estado da ligação SMTP
      if (pathname === '/api/admin/shop/smtp-status' && req.method === 'GET') {
        const verification = await verifySmtpConnection();
        return sendJson(res, 200, {
          isConfigured: isSmtpConfigured(),
          verification,
        });
      }

      // POST /api/admin/shop/test-email - Testar envio de email via painel admin
      if (pathname === '/api/admin/shop/test-email' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const targetEmail = (
          body.email ||
          process.env.SMTP_USER ||
          'neei@aaualg.pt'
        )
          .trim()
          .toLowerCase();

        const testOrder = {
          id: 'SW-TEST-EMAIL',
          student_name: 'Administrador NEEI (Teste)',
          student_email: targetEmail,
          phone_number: '912345678',
          delivery_type: 'pickup',
          item_price: 25.0,
          shipping_fee: 0,
          payment_fee: 0.63,
          total_amount: 25.63,
          size: 'M',
          color: 'Preto',
        };

        const result = await sendOrderConfirmationEmail(testOrder);
        return sendJson(res, result.success ? 200 : 500, {
          ...result,
          targetEmail,
          isSmtpConfigured: isSmtpConfigured(),
        });
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

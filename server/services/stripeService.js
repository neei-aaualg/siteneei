import Stripe from 'stripe';

export function getStripeSecretKey() {
  return (process.env.STRIPE_SECRET_KEY || '').trim();
}

export function getStripePublishableKey() {
  return (process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
}

export function getStripeWebhookSecret() {
  return (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
}

let stripeClient = null;

/**
 * Verifica se a aplicação está em modo Sandbox de desenvolvimento
 */
export function isStripeSandbox() {
  const key = getStripeSecretKey();
  return !key || key === 'sandbox' || key === 'test';
}

/**
 * Verifica se as chaves da Stripe estão em modo de testes (sk_test_...) ou sandbox
 */
export function isStripeTestMode() {
  const key = getStripeSecretKey();
  return isStripeSandbox() || key.startsWith('sk_test_');
}

/**
 * Obtém a instância do SDK Stripe configurada
 */
export function getStripeClient() {
  const secretKey = getStripeSecretKey();
  if (isStripeSandbox()) {
    stripeClient = null;
    return null;
  }

  if (!stripeClient || stripeClient._secretKey !== secretKey) {
    stripeClient = new Stripe(secretKey);
    stripeClient._secretKey = secretKey;
    const mode = isStripeTestMode() ? 'TEST (sk_test_)' : 'LIVE (sk_live_)';
    console.log(`[STRIPE] Cliente Stripe inicializado em modo ${mode}.`);
  }

  return stripeClient;
}

/**
 * Procura um cliente existente no Stripe por email ou cria um novo com o nome do comprador
 */
export async function getOrCreateStripeCustomer(
  stripe,
  { email, name, phoneNumber, orderId }
) {
  if (!stripe) return null;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();
  const cleanPhone = (phoneNumber || '').replace(/\s+/g, '');
  const formattedPhone = cleanPhone
    ? cleanPhone.startsWith('+')
      ? cleanPhone
      : `+351${cleanPhone.replace(/\D/g, '')}`
    : undefined;

  try {
    // 1. Procurar por cliente existente com o mesmo email
    if (cleanEmail) {
      const search = await stripe.customers.list({
        email: cleanEmail,
        limit: 1,
      });

      if (search.data && search.data.length > 0) {
        const existingCustomer = search.data[0];
        // Se o nome tiver sido fornecido e for diferente do que está no Stripe, atualiza o nome
        if (cleanName && existingCustomer.name !== cleanName) {
          try {
            await stripe.customers.update(existingCustomer.id, {
              name: cleanName,
              ...(formattedPhone ? { phone: formattedPhone } : {}),
            });
          } catch (updateErr) {
            console.warn(
              '[STRIPE] Aviso ao atualizar dados do cliente existente:',
              updateErr.message
            );
          }
        }
        return existingCustomer.id;
      }
    }

    // 2. Se não existir, criar novo cliente no Stripe
    const newCustomer = await stripe.customers.create({
      email: cleanEmail || undefined,
      name: cleanName || undefined,
      phone: formattedPhone || undefined,
      metadata: {
        source: 'neei_portal',
        last_order_id: orderId || '',
      },
    });

    console.log(`[STRIPE] Cliente criado com sucesso: ${newCustomer.id} (${cleanName})`);
    return newCustomer.id;
  } catch (error) {
    console.error('[STRIPE ERROR] Falha ao obter/criar Customer no Stripe:', error.message);
    return null;
  }
}

/**
 * Dispara um pedido direto de pagamento através de um PaymentIntent da Stripe
 */
export async function createStripeMbWayPaymentIntent({
  orderId,
  amount,
  mobileNumber,
  studentEmail,
  studentName,
  description,
  metadata = {},
}) {
  const cleanMobile = String(mobileNumber || '')
    .replace(/\s+/g, '')
    .replace(/^\+351/, '');
  const formattedAmount = Number(amount).toFixed(2);
  const amountInCents = Math.round(Number(amount) * 100);

  // Modo Sandbox de testes locais
  if (isStripeSandbox()) {
    console.log('---------------------------------------------------------');
    console.log(`[STRIPE SANDBOX] Pedido iniciado para ${orderId}`);
    console.log(`Telemóvel: ${cleanMobile} | Valor: ${formattedAmount}€ (${amountInCents} cêntimos)`);
    console.log(`Mensagem app: ${description || 'NEEI - Sweat Curso'}`);
    console.log('Modo Sandbox: Notificação simulada enviada para o telemóvel.');
    console.log('---------------------------------------------------------');

    return {
      success: true,
      provider: 'stripe_sandbox',
      paymentIntentId: `pi_sandbox_${Date.now()}_${orderId}`,
      clientSecret: `pi_sandbox_secret_${Date.now()}`,
      expiresInSeconds: 300,
      message: 'Notificação simulada enviada para o teu telemóvel.',
    };
  }

  // Modo Real com Stripe API
  try {
    const stripe = getStripeClient();

    let customerId = null;
    if (studentEmail || studentName) {
      customerId = await getOrCreateStripeCustomer(stripe, {
        email: studentEmail,
        name: studentName,
        phoneNumber: cleanMobile,
        orderId,
      });
    }

    const paymentIntentPayload = {
      amount: amountInCents,
      currency: 'eur',
      payment_method_types: ['mb_way'],
      payment_method_data: {
        type: 'mb_way',
        billing_details: {
          phone: `+351${cleanMobile}`,
          email: studentEmail,
          name: studentName || 'Estudante UAlg',
        },
      },
      confirm: true,
      return_url: `${process.env.APP_URL || 'http://localhost:3000'}/merch?payment_intent_done=1&orderId=${orderId}`,
      description: description || `NEEI Merch - Encomenda ${orderId}`,
      metadata: {
        order_id: orderId,
        student_email: studentEmail,
        student_name: studentName || '',
        ...metadata,
      },
    };

    if (customerId) {
      paymentIntentPayload.customer = customerId;
    }

    if (studentName) {
      paymentIntentPayload.shipping = {
        name: studentName.trim(),
        address: {
          line1: (metadata.shipping_address || 'Recolha Campus de Gambelas').trim(),
          postal_code: (metadata.shipping_postal_code || '8005-139').trim(),
          city: (metadata.shipping_city || 'Faro').trim(),
          country: 'PT',
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentPayload);

    console.log(
      `[STRIPE] PaymentIntent criado: ${paymentIntent.id} (Estado: ${paymentIntent.status})`
    );

    // No modo de teste da Stripe, pode haver uma URL de autorização de teste em next_action
    const nextActionUrl =
      paymentIntent.next_action?.redirect_to_url?.url ||
      paymentIntent.next_action?.verify_with_mb_way?.url ||
      paymentIntent.next_action?.use_stripe_sdk?.stripe_js;

    return {
      success: true,
      provider: 'stripe',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      nextActionUrl: nextActionUrl || null,
      expiresInSeconds: 300,
      message: 'Pedido enviado para a aplicação do teu telemóvel.',
    };
  } catch (error) {
    console.error('[STRIPE ERROR] Falha ao criar PaymentIntent:', error);
    return {
      success: false,
      provider: 'stripe',
      message: error.message || 'Erro ao comunicar com a rede através da Stripe.',
    };
  }
}

/**
 * Cria um PaymentIntent com todos os métodos de pagamento ativos automaticamente no Dashboard
 * (Cards, Apple Pay, Google Pay, MB WAY, Klarna, Pix, etc. conforme configurado no Stripe Dashboard)
 * Utiliza o PaymentIntents API compatível com o Stripe <Elements> + <PaymentElement>.
 */
export async function createStripePaymentIntentAutomatic({
  orderId,
  amount,
  studentEmail,
  studentName,
  phoneNumber,
  shippingAddress,
  shippingPostalCode,
  shippingCity,
  description,
  metadata = {},
}) {
  const amountInCents = Math.round(Number(amount) * 100);

  // Modo Sandbox — devolve um clientSecret fictício para teste local
  if (isStripeSandbox()) {
    return {
      success: true,
      provider: 'stripe_sandbox',
      paymentIntentId: `pi_sandbox_${Date.now()}_${orderId}`,
      clientSecret: `pi_sandbox_secret_${Date.now()}`,
      publishableKey: getStripePublishableKey() || 'pk_test_sandbox',
    };
  }

  try {
    const stripe = getStripeClient();

    // Obtém ou cria o cliente na Stripe para associar o nome e email diretamente
    let customerId = null;
    if (studentEmail || studentName) {
      customerId = await getOrCreateStripeCustomer(stripe, {
        email: studentEmail,
        name: studentName,
        phoneNumber: phoneNumber || metadata.phone_number,
        orderId,
      });
    }

    const paymentIntentPayload = {
      amount: amountInCents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      description: description || `NEEI Merch - Encomenda ${orderId}`,
      receipt_email: studentEmail,
      metadata: {
        order_id: orderId,
        student_email: studentEmail,
        student_name: studentName || '',
        ...metadata,
      },
    };

    if (customerId) {
      paymentIntentPayload.customer = customerId;
    }

    if (studentName) {
      paymentIntentPayload.shipping = {
        name: studentName.trim(),
        address: {
          line1: (
            shippingAddress ||
            metadata.shipping_address ||
            'Recolha Campus de Gambelas'
          ).trim(),
          postal_code: (
            shippingPostalCode ||
            metadata.shipping_postal_code ||
            '8005-139'
          ).trim(),
          city: (shippingCity || metadata.shipping_city || 'Faro').trim(),
          country: 'PT',
        },
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentPayload);

    console.log(
      `[STRIPE] PaymentIntent automático criado: ${paymentIntent.id} (${amountInCents} cêntimos)`
    );

    return {
      success: true,
      provider: 'stripe',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      publishableKey: getStripePublishableKey(),
    };
  } catch (error) {
    console.error('[STRIPE ERROR] Falha ao criar PaymentIntent automático:', error);
    return {
      success: false,
      provider: 'stripe',
      message: error.message || 'Erro ao criar pedido de pagamento.',
    };
  }
}

/**
 * Cria uma Checkout Session hospedada da Stripe para cartões de crédito/débito, Apple Pay e Google Pay
 */
export async function createStripeCheckoutSession({ order, successUrl, cancelUrl }) {
  if (isStripeSandbox()) {
    return {
      success: true,
      url: `${successUrl || '/merch'}?session_id=mock-session-${order.id}&orderId=${order.id}`,
      sessionId: `mock-session-${order.id}`,
    };
  }

  try {
    const stripe = getStripeClient();
    const amountInCents = Math.round(Number(order.total_amount) * 100);

    let customerId = null;
    if (order.student_email || order.student_name) {
      customerId = await getOrCreateStripeCustomer(stripe, {
        email: order.student_email,
        name: order.student_name,
        phoneNumber: order.phone_number,
        orderId: order.id,
      });
    }

    const sessionPayload = {
      payment_method_types: ['card', 'mb_way'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Sweat Oficial Engenharia Informática 2026 (${order.size})`,
              description: `Tamanho: ${order.size} | Cor: ${order.color || 'Preto'} | Entrega: ${
                order.delivery_type === 'shipping' ? 'Envio CTT' : 'Recolha Gambelas'
              }`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
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
        student_name: order.student_name,
        student_email: order.student_email,
        phone_number: order.phone_number,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    if (customerId) {
      sessionPayload.customer = customerId;
      sessionPayload.customer_update = { name: 'auto', address: 'auto' };
    } else if (order.student_email) {
      sessionPayload.customer_email = order.student_email;
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);

    return {
      success: true,
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('[STRIPE CHECKOUT ERROR]', error);
    return {
      success: false,
      message: error.message || 'Erro ao criar sessão de pagamento Stripe.',
    };
  }
}

/**
 * Valida a assinatura do webhook recebido da Stripe
 */
export function constructStripeWebhookEvent(rawBody, signature) {
  const webhookSecret = getStripeWebhookSecret();
  if (isStripeSandbox() || !webhookSecret) {
    // Se não houver segredo de webhook em desenvolvimento, faz parse do payload JSON
    try {
      const parsed = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
      return parsed;
    } catch (e) {
      throw new Error('Payload do webhook inválido');
    }
  }

  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}

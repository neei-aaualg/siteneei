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
    const paymentIntent = await stripe.paymentIntents.create({
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
    });

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
    const paymentIntent = await stripe.paymentIntents.create({
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
    });

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'mb_way'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Sweat Oficial Engenharia Informática 2026 (${order.size})`,
              description: `Tamanho: ${order.size} | Cor: ${order.color || 'Preto'} | Entrega: ${order.delivery_type === 'shipping' ? 'Envio CTT' : 'Recolha Gambelas'
                }`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: order.student_email,
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
        total_amount: String(order.total_amount),
        student_name: order.student_name,
        student_email: order.student_email,
        phone_number: order.phone_number,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

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

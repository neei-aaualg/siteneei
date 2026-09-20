import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;

let stripeClient = null;

/**
 * Verifica se a aplicação está em modo Sandbox de desenvolvimento
 */
export function isStripeSandbox() {
  return (
    !STRIPE_SECRET_KEY ||
    STRIPE_SECRET_KEY === 'sandbox' ||
    STRIPE_SECRET_KEY === 'test' ||
    STRIPE_SECRET_KEY.trim() === ''
  );
}

/**
 * Verifica se as chaves da Stripe estão em modo de testes (sk_test_...) ou sandbox
 */
export function isStripeTestMode() {
  return (
    isStripeSandbox() ||
    (typeof STRIPE_SECRET_KEY === 'string' && STRIPE_SECRET_KEY.startsWith('sk_test_'))
  );
}

/**
 * Obtém a instância do SDK Stripe configurada
 */
export function getStripeClient() {
  if (stripeClient) return stripeClient;

  if (!isStripeSandbox()) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
    const mode = isStripeTestMode() ? 'TEST (sk_test_)' : 'LIVE (sk_live_)';
    console.log(`[STRIPE] Cliente Stripe inicializado em modo ${mode}.`);
  } else {
    // Cliente mock para desenvolvimento sem chaves
    stripeClient = null;
    console.log('[STRIPE] A correr em modo SANDBOX / Mock.');
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
      return_url: `${process.env.APP_URL || 'http://localhost:3000'}/merch?orderId=${orderId}`,
      description: description || `NEEI Merch - Encomenda ${orderId}`,
      metadata: {
        order_id: orderId,
        student_email: studentEmail,
        student_name: studentName || '',
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
      publishableKey: STRIPE_PUBLISHABLE_KEY || 'pk_test_sandbox',
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
      publishableKey: STRIPE_PUBLISHABLE_KEY,
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
  if (isStripeSandbox() || !STRIPE_WEBHOOK_SECRET) {
    // Se não houver segredo de webhook em desenvolvimento, faz parse do payload JSON
    try {
      const parsed = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
      return parsed;
    } catch (e) {
      throw new Error('Payload do webhook inválido');
    }
  }

  const stripe = getStripeClient();
  return stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
}

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
 * Obtém a instância do SDK Stripe configurada
 */
export function getStripeClient() {
  if (stripeClient) return stripeClient;

  if (!isStripeSandbox()) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY);
    console.log('[STRIPE] Cliente Stripe inicializado em modo de produção/live.');
  } else {
    // Cliente mock para desenvolvimento sem chaves
    stripeClient = null;
    console.log('[STRIPE] A correr em modo SANDBOX / Mock.');
  }

  return stripeClient;
}

/**
 * Dispara um pedido direto de pagamento por MB WAY através de um PaymentIntent da Stripe
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
    console.log(`[STRIPE MB WAY SANDBOX] Pedido iniciado para ${orderId}`);
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
      message: 'Notificação MB WAY simulada enviada para o teu telemóvel.',
    };
  }

  // Modo Real com Stripe API
  try {
    const stripe = getStripeClient();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      payment_method_types: ['mbway'],
      payment_method_data: {
        type: 'mbway',
        billing_details: {
          phone: `+351${cleanMobile}`,
          email: studentEmail,
          name: studentName || 'Estudante UAlg',
        },
      },
      confirm: true,
      description: description || `NEEI Merch - Encomenda ${orderId}`,
      metadata: {
        order_id: orderId,
        student_email: studentEmail,
        student_name: studentName || '',
      },
    });

    console.log(
      `[STRIPE] PaymentIntent MB WAY criado: ${paymentIntent.id} (Estado: ${paymentIntent.status})`
    );

    return {
      success: true,
      provider: 'stripe',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      expiresInSeconds: 300,
      message: 'Pedido enviado para a aplicação MB WAY do teu telemóvel.',
    };
  } catch (error) {
    console.error('[STRIPE ERROR] Falha ao criar PaymentIntent MB WAY:', error);
    return {
      success: false,
      provider: 'stripe',
      message: error.message || 'Erro ao comunicar com a rede MB WAY através da Stripe.',
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
      payment_method_types: ['card', 'mbway'],
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

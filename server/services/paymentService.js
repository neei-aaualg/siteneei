import {
  createStripeMbWayPaymentIntent,
  createStripePaymentIntentAutomatic,
  createStripeEmbeddedCheckoutSession,
  createStripeCheckoutSession,
  constructStripeWebhookEvent,
  isStripeSandbox,
  isStripeTestMode,
} from './stripeService.js';

// Verifica se está a correr em modo de produção com chaves ativas ou em modo Sandbox/Testes
export function isPaymentSandbox() {
  return isStripeTestMode();
}

/**
 * Inicia um pedido de pagamento por MB WAY através da Stripe
 */
export async function initiateMbWayPayment({
  orderId,
  amount,
  mobileNumber,
  studentEmail,
  studentName,
  description,
}) {
  return createStripeMbWayPaymentIntent({
    orderId,
    amount,
    mobileNumber,
    studentEmail,
    studentName,
    description,
  });
}

/**
 * Cria uma sessão para o Payment Element moderno com todos os métodos ativos (EWCS)
 */
export async function createAutomaticPaymentIntent({
  orderId,
  amount,
  studentEmail,
  studentName,
  description,
  baseUrl,
}) {
  return createStripeEmbeddedCheckoutSession({
    orderId,
    amount,
    studentEmail,
    studentName,
    description,
    baseUrl,
  });
}

/**
 * Cria uma Checkout Session na Stripe (para cartões de crédito/débito ou Apple Pay)
 */
export async function createCheckoutSession({ order, successUrl, cancelUrl }) {
  return createStripeCheckoutSession({ order, successUrl, cancelUrl });
}

/**
 * Valida eventos de webhook da Stripe
 */
export function verifyStripeWebhook(rawBody, signature) {
  return constructStripeWebhookEvent(rawBody, signature);
}

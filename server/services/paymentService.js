import {
  createStripeMbWayPaymentIntent,
  createStripePaymentIntentAutomatic,
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
 * Inicia um pedido de pagamento através da Stripe
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
 * Cria um PaymentIntent com todos os métodos ativos (Payment Element)
 */
export async function createAutomaticPaymentIntent({
  orderId,
  amount,
  studentEmail,
  studentName,
  description,
  metadata,
}) {
  return createStripePaymentIntentAutomatic({
    orderId,
    amount,
    studentEmail,
    studentName,
    description,
    metadata,
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

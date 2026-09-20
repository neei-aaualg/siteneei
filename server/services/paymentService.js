import {
  createStripeMbWayPaymentIntent,
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

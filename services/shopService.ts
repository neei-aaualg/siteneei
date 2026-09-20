import {
  ShopCampaign,
  ShopOrder,
  CheckoutPayload,
  CheckoutResponse,
  OrderStatusResponse,
  ShopSummaryStats,
  OrderStatus,
} from '../types/shop';

/**
 * Obtém os dados da campanha ativa de pré-encomenda
 */
export async function fetchShopCampaign(): Promise<{
  campaign: ShopCampaign;
  isSandbox: boolean;
  sweatsAvailable?: boolean;
}> {
  const res = await fetch('/api/shop/campaign');
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'O servidor de desenvolvimento precisa de ser reiniciado para carregar as novas rotas da loja.'
    );
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Erro ao carregar a campanha de pré-encomenda.');
  }
  return res.json();
}

/**
 * Submete o checkout da encomenda e inicia o pagamento MB WAY
 */
export async function submitCheckout(payload: CheckoutPayload): Promise<CheckoutResponse> {
  const res = await fetch('/api/shop/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao processar encomenda.');
  }
  return data;
}

/**
 * Cria uma encomenda e retorna o clientSecret do PaymentIntent Stripe (Payment Element)
 */
export async function createPaymentIntent(payload: CheckoutPayload): Promise<{
  orderId: string;
  totalAmount: number;
  clientSecret: string;
  publishableKey: string;
  provider: string;
  isSandbox: boolean;
}> {
  const res = await fetch('/api/shop/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao criar pedido de pagamento.');
  }
  return data;
}

/**
 * Consulta o estado do pagamento / encomenda para o ecrã de espera do MB WAY
 */
export async function fetchOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  const res = await fetch(`/api/shop/order-status/${encodeURIComponent(orderId)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao consultar estado da encomenda.');
  }
  return res.json();
}

/**
 * Simula pagamento imediato em ambiente de desenvolvimento / Sandbox
 */
export async function simulatePayment(
  orderId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/shop/simulate-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao simular pagamento.');
  }
  return data;
}

/* =========================================================================
   MÉTODOS ADMINISTRATIVOS
   ========================================================================= */

/**
 * Obtém estatísticas da loja
 */
export async function fetchAdminShopStats(token: string): Promise<ShopSummaryStats> {
  const res = await fetch('/api/admin/shop/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Falha ao carregar estatísticas da loja');
  }
  return res.json();
}

/**
 * Obtém lista de encomendas
 */
export async function fetchAdminShopOrders(
  token: string,
  filters?: {
    payment_status?: string;
    order_status?: string;
    size?: string;
    delivery_type?: string;
    search?: string;
  }
): Promise<{ orders: ShopOrder[] }> {
  const params = new URLSearchParams();
  if (filters?.payment_status) params.set('payment_status', filters.payment_status);
  if (filters?.order_status) params.set('order_status', filters.order_status);
  if (filters?.size) params.set('size', filters.size);
  if (filters?.delivery_type) params.set('delivery_type', filters.delivery_type);
  if (filters?.search) params.set('search', filters.search);

  const url = `/api/admin/shop/orders?${params.toString()}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar lista de encomendas');
  }
  return res.json();
}

/**
 * Atualiza estado operacional da encomenda (ex: 'in_production', 'ready_for_pickup', 'shipped')
 */
export async function updateAdminOrderStatus(
  token: string,
  orderId: string,
  orderStatus: OrderStatus
): Promise<{ success: boolean; order: ShopOrder }> {
  const res = await fetch(`/api/admin/shop/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ order_status: orderStatus }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Falha ao atualizar estado da encomenda');
  }
  return res.json();
}

/**
 * Reenvia o email de confirmação de encomenda
 */
export async function resendOrderEmail(
  token: string,
  orderId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/admin/shop/orders/${encodeURIComponent(orderId)}/resend-email`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao reenviar email');
  }
  return data;
}

/**
 * Atualiza configurações da campanha
 */
export async function updateAdminCampaign(
  token: string,
  data: Partial<ShopCampaign>
): Promise<{ campaign: ShopCampaign }> {
  const res = await fetch('/api/admin/shop/campaign', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Falha ao atualizar campanha');
  }
  return res.json();
}

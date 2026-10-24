export interface ChurrascoOrder {
  id: string;
  ticket_code?: string;
  ticketCode?: string;
  student_name?: string;
  studentName?: string;
  student_email?: string;
  studentEmail?: string;
  phone_number?: string;
  phoneNumber?: string;
  student_number?: string | null;
  studentNumber?: string | null;
  drink_preference?: string;
  drinkPreference?: string;
  quantity: number;
  unit_price?: number;
  unitPrice?: number;
  total_amount?: number;
  totalAmount?: number;
  payment_status?: 'pending' | 'paid' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'cancelled';
  payment_provider?: string;
  check_in?: number | boolean;
  checkIn?: boolean;
  check_in_at?: string | null;
  bifanas_total?: number;
  bifanasTotal?: number;
  bifanas_served?: number;
  bifanasServed?: number;
  bifanas_remaining?: number;
  bifanasRemaining?: number;
  drinks_total?: number;
  drinksTotal?: number;
  drinks_served?: number;
  drinksServed?: number;
  drinks_remaining?: number;
  drinksRemaining?: number;
  is_fully_served?: boolean;
  isFullyServed?: boolean;
  is_admin_created?: number | boolean;
  admin_notes?: string | null;
  created_at?: string;
  createdAt?: string;
  paid_at?: string | null;
  paidAt?: string | null;
}

export interface ChurrascoStats {
  totalOrders: number;
  totalTickets: number;
  totalRevenue: number;
  totalCheckedIn: number;
  pendingCheckIn: number;
  pendingOrders: number;
  totalBifanas?: number;
  totalBifanasServed?: number;
  totalDrinks?: number;
  totalDrinksServed?: number;
  visibility: boolean;
}

export interface ChurrascoStatusResponse {
  visible: boolean;
  unitPrice: number;
  includes: {
    food: string;
    drinks: string;
  };
  location: string;
}

export interface ChurrascoCheckoutPayload {
  student_name: string;
  student_email: string;
  phone_number: string;
  student_number?: string;
  drink_preference?: string;
  quantity: number;
}

/**
 * Consulta estado e detalhes públicos do Churrasco
 */
export async function fetchChurrascoStatus(): Promise<ChurrascoStatusResponse> {
  try {
    const res = await fetch('/api/churrasco/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[CHURRASCO] Falha ao consultar status da API:', e);
  }
  return {
    visible: true,
    unitPrice: 4.5,
    includes: {
      food: '1 Bifana no pão',
      drinks: '2 Copos de cerveja ou refrigerante',
    },
    location: 'Campus de Gambelas (Gabinete NEEI / Pátio)',
  };
}

/**
 * Inicia o checkout do passe de churrasco
 */
export async function checkoutChurrasco(payload: ChurrascoCheckoutPayload): Promise<{
  success: boolean;
  orderId?: string;
  ticketCode?: string;
  checkoutUrl?: string;
  isSandbox?: boolean;
  error?: string;
}> {
  const res = await fetch('/api/churrasco/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao processar compra do bilhete.');
  }
  return data;
}

/**
 * Consulta um bilhete por ID ou Código
 */
export async function fetchChurrascoOrder(idOrCode: string): Promise<ChurrascoOrder | null> {
  try {
    const res = await fetch(`/api/churrasco/order/${encodeURIComponent(idOrCode)}`);
    if (res.ok) {
      const data = await res.json();
      return data.order || null;
    }
  } catch (err) {
    console.error('[CHURRASCO] Falha ao consultar bilhete:', err);
  }
  return null;
}

/**
 * Confirma pagamento após retorno de checkout
 */
export async function confirmChurrascoPayment(
  orderId: string,
  sessionId?: string
): Promise<{ success: boolean; order?: ChurrascoOrder }> {
  try {
    const res = await fetch('/api/churrasco/confirm-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, sessionId }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[CHURRASCO] Falha na confirmação de pagamento:', err);
  }
  return { success: false };
}

/* =========================================================================
   MÉTODOS DE ADMINISTRAÇÃO
   ========================================================================= */

function getAuthHeader(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchAdminChurrasco(token: string): Promise<{
  stats: ChurrascoStats;
  orders: ChurrascoOrder[];
  barPassword?: string;
  visibility: boolean;
}> {
  const res = await fetch('/api/admin/churrasco', {
    headers: getAuthHeader(token),
  });

  if (!res.ok) {
    throw new Error('Falha ao carregar dados do churrasco no painel de administração.');
  }
  return await res.json();
}

export async function updateAdminChurrascoBarPassword(
  token: string,
  password: string
): Promise<string> {
  const res = await fetch('/api/admin/churrasco/password', {
    method: 'POST',
    headers: getAuthHeader(token),
    body: JSON.stringify({ password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao atualizar a senha do churrasco-admin.');
  }
  return data.password;
}

/* =========================================================================
   MÉTODOS DO BALCÃO / CHURRASCO-ADMIN & CHURRASCO-QR
   ========================================================================= */

function getBarAuthHeader(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function loginChurrascoAdmin(password: string): Promise<{ token: string }> {
  const res = await fetch('/api/churrasco-admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Senha de acesso ao balcão incorreta.');
  }
  return data;
}

export async function verifyChurrascoQrCode(
  token: string,
  code: string
): Promise<{
  valid: boolean;
  isPaid: boolean;
  order: ChurrascoOrder;
}> {
  const res = await fetch(
    `/api/churrasco-admin/verify-code?code=${encodeURIComponent(code)}`,
    {
      headers: getBarAuthHeader(token),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao validar código QR.');
  }
  return data;
}

export async function serveChurrascoOrderItem(
  token: string,
  orderId: string,
  item: 'bifana' | 'drink',
  action: 'serve' | 'undo' = 'serve'
): Promise<{
  success: boolean;
  order: ChurrascoOrder;
  message: string;
}> {
  const res = await fetch('/api/churrasco-admin/serve', {
    method: 'POST',
    headers: getBarAuthHeader(token),
    body: JSON.stringify({ orderId, item, action }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao registar entrega do item.');
  }
  return data;
}

export async function toggleAdminChurrascoVisibility(
  token: string,
  visible: boolean
): Promise<boolean> {
  const res = await fetch('/api/admin/churrasco/toggle-visibility', {
    method: 'POST',
    headers: getAuthHeader(token),
    body: JSON.stringify({ visible }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao alterar visibilidade da aba do churrasco.');
  }

  const data = await res.json();
  // Dispara evento para sincronizar instantaneamente o Header
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('churrasco-visibility-changed', { detail: { visible: data.visible } })
    );
  }
  return Boolean(data.visible);
}

export async function toggleAdminChurrascoCheckIn(
  token: string,
  orderId: string,
  status: boolean
): Promise<ChurrascoOrder> {
  const res = await fetch('/api/admin/churrasco/check-in', {
    method: 'POST',
    headers: getAuthHeader(token),
    body: JSON.stringify({ orderId, status }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao atualizar estado de check-in do bilhete.');
  }

  const data = await res.json();
  return data.order;
}

export async function createAdminManualChurrasco(
  token: string,
  data: {
    student_name: string;
    student_email?: string;
    phone_number?: string;
    student_number?: string;
    drink_preference?: string;
    quantity: number;
    notes?: string;
  }
): Promise<ChurrascoOrder> {
  const res = await fetch('/api/admin/churrasco/manual-order', {
    method: 'POST',
    headers: getAuthHeader(token),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao criar bilhete manual.');
  }

  const resData = await res.json();
  return resData.order;
}

export async function deleteAdminChurrascoOrder(token: string, orderId: string): Promise<boolean> {
  const res = await fetch(`/api/admin/churrasco/order/${encodeURIComponent(orderId)}`, {
    method: 'DELETE',
    headers: getAuthHeader(token),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Falha ao eliminar bilhete.');
  }

  return true;
}

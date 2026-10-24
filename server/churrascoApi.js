import { readJsonBody, sendJson } from './api.js';
import { verifyAdminToken } from './auth.js';
import { getCanonicalAppUrl } from './security.js';
import {
  isChurrascoVisible,
  setChurrascoVisibility,
  preparePendingChurrascoOrder,
  getChurrascoOrderById,
  getChurrascoOrderByTicketCode,
  confirmChurrascoOrderPayment,
  getAllChurrascoOrders,
  getChurrascoStats,
  toggleChurrascoCheckIn,
  createAdminManualChurrascoOrder,
  deleteChurrascoOrder,
  serveChurrascoItem,
  getChurrascoLogs,
  getChurrascoAdminPassword,
  setChurrascoAdminPassword,
  verifyChurrascoAdminPassword,
  db,
} from './db.js';
import {
  createStripeCheckoutSession,
  isStripeSandbox,
  getStripeClient,
} from './services/stripeService.js';
import { getTransporter } from './services/emailService.js';

/**
 * Valida autorização de staff do balcão (churrasco-admin)
 */
function verifyBarStaffAuth(req) {
  if (verifyAdminToken(req)) return true;

  const authHeader = req.headers['authorization'] || req.headers['x-churrasco-token'] || '';
  let token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token.startsWith('churr_bar_')) {
    try {
      const b64 = token.replace('churr_bar_', '');
      const pass = Buffer.from(b64, 'base64').toString('utf-8');
      return verifyChurrascoAdminPassword(pass);
    } catch {
      return false;
    }
  }

  return verifyChurrascoAdminPassword(token);
}

/**
 * Sincroniza encomendas pendentes com a Stripe (útil para desenvolvimento local e falhas de webhook)
 */
async function syncPendingChurrascoOrdersWithStripe() {
  try {
    const stripe = getStripeClient();
    if (!stripe || isStripeSandbox()) return;

    const pendingOrders = db.prepare(`
      SELECT id, student_email, student_name, payment_ref
      FROM churrasco_orders
      WHERE payment_status = 'pending'
      ORDER BY created_at DESC
      LIMIT 20
    `).all();

    if (!pendingOrders || pendingOrders.length === 0) return;

    // 1. Tenta recuperar sessão diretamente se payment_ref tiver o checkout session_id (cs_...)
    const remainingPending = [];
    for (const pending of pendingOrders) {
      if (pending.payment_ref && pending.payment_ref.startsWith('cs_')) {
        try {
          const s = await stripe.checkout.sessions.retrieve(pending.payment_ref);
          if (s && s.payment_status === 'paid') {
            const confirmed = confirmChurrascoOrderPayment(pending.id, s.payment_intent || s.id);
            sendChurrascoTicketEmail(confirmed).catch(() => {});
            console.log(`[CHURRASCO SYNC] Pedido ${pending.id} confirmado como PAGO via Stripe Checkout (${s.id})`);
            continue;
          }
        } catch {
          // Se falhar retrieve, tenta pesquisa na lista geral abaixo
        }
      }
      remainingPending.push(pending);
    }

    if (remainingPending.length === 0) return;

    // 2. Consulta as sessões Stripe recentes (Stripe API não aceita client_reference_id como filtro em sessions.list)
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    if (!sessions || !sessions.data || sessions.data.length === 0) return;

    for (const pending of remainingPending) {
      const match = sessions.data.find(
        (s) =>
          s.client_reference_id === pending.id ||
          s.metadata?.order_id === pending.id ||
          s.metadata?.orderId === pending.id
      );

      if (match && match.payment_status === 'paid') {
        const confirmed = confirmChurrascoOrderPayment(pending.id, match.payment_intent || match.id);
        sendChurrascoTicketEmail(confirmed).catch(() => {});
        console.log(`[CHURRASCO SYNC] Pedido ${pending.id} confirmado como PAGO via Stripe Checkout (${match.id})`);
      }
    }
  } catch (err) {
    console.warn('[CHURRASCO SYNC WARN] Falha ao sincronizar pedidos pendentes:', err.message);
  }
}

/**
 * Envia email com o bilhete digital ao estudante
 */
async function sendChurrascoTicketEmail(order) {
  try {
    const transporter = getTransporter();
    const studentEmail = order.student_email;
    if (!studentEmail) return;

    const fromAddress = process.env.SMTP_FROM || 'NEEI - Núcleo de Estudantes de Engenharia Informática <neei@aaualg.pt>';
    const subject = `🍖 O teu Passe para o Churrasco NEEI está Confirmado! (Código: ${order.ticket_code})`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ea580c, #c2410c); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🍖 Grande Churrasco NEEI</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">Núcleo de Estudantes de Engenharia Informática - AAUAlg</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px;">Olá <strong>${order.student_name}</strong>,</p>
          <p style="font-size: 15px; color: #475569;">
            O teu pagamento foi confirmado com sucesso! Tens lugar garantido no churrasco do semestre.
          </p>

          <div style="background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #ea580c; letter-spacing: 1px;">Código do Bilhete</span>
            <div style="font-size: 32px; font-weight: 800; color: #9a3412; letter-spacing: 2px; margin: 8px 0;">
              ${order.ticket_code}
            </div>
            <p style="margin: 0; font-size: 13px; color: #7c2d12;">Apresenta este código ou o teu nome na receção/bar no dia do evento.</p>
          </div>

          <h3 style="font-size: 16px; margin: 20px 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Detalhes do Passe:</h3>
          <ul style="list-style: none; padding: 0; margin: 0; font-size: 14px; color: #334155; line-height: 1.8;">
            <li>🥩 <strong>Refeição:</strong> 1 Bifana quentinha no pão (por passe)</li>
            <li>🍻 <strong>Bebidas:</strong> 2 Copos de cerveja fresca ou refrigerante</li>
            <li>🥤 <strong>Preferência:</strong> ${order.drink_preference}</li>
            <li>🎟️ <strong>Quantidade:</strong> ${order.quantity} passe(s)</li>
            <li>💶 <strong>Total Pago:</strong> ${Number(order.total_amount).toFixed(2)}€</li>
          </ul>

          <div style="margin-top: 24px; padding: 14px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: #64748b;">
            📍 <strong>Localização:</strong> Campus de Gambelas (junto ao Edifício 1 / Gabinete NEEI)<br/>
            Dúvidas ou informações adicionais? Contacta-nos através de <a href="mailto:neei@aaualg.pt" style="color: #ea580c;">neei@aaualg.pt</a> ou no Instagram <a href="https://instagram.com/neeiualg" style="color: #ea580c;">@neeiualg</a>.
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: fromAddress,
      to: studentEmail,
      subject,
      html,
    });
    console.log(`[CHURRASCO EMAIL] Bilhete enviado com sucesso para ${studentEmail} (${order.ticket_code})`);
  } catch (err) {
    console.warn(`[CHURRASCO EMAIL WARN] Falha ao enviar email do bilhete para ${order.student_email}:`, err.message);
  }
}

/**
 * Roteador de endpoints REST para a aba e vendas do Churrasco NEEI
 */
export async function handleChurrascoApi(req, res, pathname, searchParams) {
  try {
    /* =========================================================================
       ROTAS PÚBLICAS DO CHURRASCO
       ========================================================================= */

    // 1. GET /api/churrasco/status - Obter estado de visibilidade e preço do churrasco
    if (pathname === '/api/churrasco/status' && req.method === 'GET') {
      const visible = isChurrascoVisible();
      return sendJson(res, 200, {
        visible,
        unitPrice: 4.5,
        includes: {
          food: '1 Bifana no pão',
          drinks: 'Bebidas sempre à discrição no bar',
        },
        location: 'Campus de Gambelas (Gabinete NEEI / Pátio)',
      });
    }

    // 2. POST /api/churrasco/checkout - Criar pedido e iniciar sessão Stripe Checkout
    if (pathname === '/api/churrasco/checkout' && req.method === 'POST') {
      const isVisible = isChurrascoVisible();
      if (!isVisible) {
        return sendJson(res, 400, {
          error: 'As inscrições para o churrasco encontram-se temporariamente encerradas.',
        });
      }

      const body = await readJsonBody(req);
      const order = preparePendingChurrascoOrder(body);
      const baseUrl = getCanonicalAppUrl(req);

      // Em ambiente Sandbox / sem chaves Stripe: confirmação direta instantânea
      if (isStripeSandbox()) {
        const confirmed = confirmChurrascoOrderPayment(order.id, `sandbox_${Date.now()}`);
        sendChurrascoTicketEmail(confirmed).catch(() => {});
        return sendJson(res, 201, {
          success: true,
          isSandbox: true,
          orderId: order.id,
          ticketCode: order.ticket_code,
          checkoutUrl: `${baseUrl}/churrasco?success=1&order_id=${order.id}`,
        });
      }

      // Modo Real Stripe Checkout
      const sessionResult = await createStripeCheckoutSession({
        order: {
          id: order.id,
          item_name: `Passe Churrasco NEEI (${order.quantity}x)`,
          description: `1 Bifana no pão + Bebida à discrição no bar`,
          total_amount: order.total_amount,
          student_name: order.student_name,
          student_email: order.student_email,
          phone_number: order.phone_number,
          type: 'churrasco',
        },
        successUrl: `${baseUrl}/churrasco?success=1&order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/churrasco?canceled=1`,
      });

      if (!sessionResult.success) {
        return sendJson(res, 400, {
          error: sessionResult.message || 'Erro ao gerar sessão de pagamento Stripe.',
        });
      }

      // Guarda o ID da sessão Stripe para reconciliação direta
      if (sessionResult.sessionId) {
        try {
          db.prepare('UPDATE churrasco_orders SET payment_ref = ? WHERE id = ?').run(
            sessionResult.sessionId,
            order.id
          );
        } catch {}
      }

      return sendJson(res, 201, {
        success: true,
        orderId: order.id,
        ticketCode: order.ticket_code,
        checkoutUrl: sessionResult.url,
        sessionId: sessionResult.sessionId,
      });
    }

    // 3. GET /api/churrasco/order/:id - Consultar bilhete por ID ou Código do Bilhete
    if (pathname.startsWith('/api/churrasco/order/') && req.method === 'GET') {
      const rawParam = decodeURIComponent(pathname.replace('/api/churrasco/order/', '')).trim();
      let order = getChurrascoOrderById(rawParam);
      if (!order) {
        order = getChurrascoOrderByTicketCode(rawParam);
      }

      if (!order) {
        return sendJson(res, 404, { error: 'Bilhete de churrasco não encontrado.' });
      }

      return sendJson(res, 200, {
        success: true,
        order: {
          id: order.id,
          ticketCode: order.ticket_code,
          studentName: order.student_name,
          studentEmail: order.student_email,
          phoneNumber: order.phone_number,
          studentNumber: order.student_number,
          drinkPreference: order.drink_preference,
          quantity: order.quantity,
          unitPrice: order.unit_price,
          totalAmount: order.total_amount,
          paymentStatus: order.payment_status,
          checkIn: Boolean(order.check_in),
          bifanasTotal: order.bifanas_total,
          bifanasServed: order.bifanas_served,
          bifanasRemaining: order.bifanas_remaining,
          drinksTotal: order.drinks_total,
          drinksServed: order.drinks_served,
          drinksRemaining: order.drinks_remaining,
          createdAt: order.created_at,
          paidAt: order.paid_at,
        },
      });
    }

    // 4. POST /api/churrasco/confirm-payment - Confirmar pagamento após retorno do utilizador
    if (pathname === '/api/churrasco/confirm-payment' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { orderId, sessionId } = body;

      if (!orderId) {
        return sendJson(res, 400, { error: 'orderId é obrigatório' });
      }

      let order = getChurrascoOrderById(orderId);
      if (!order) {
        return sendJson(res, 404, { error: 'Pedido de churrasco não encontrado.' });
      }

      if (order.payment_status === 'paid') {
        return sendJson(res, 200, { success: true, order });
      }

      // Validação em Sandbox ou verificação de sessão Stripe
      if (isStripeSandbox()) {
        order = confirmChurrascoOrderPayment(orderId, sessionId || `sandbox_confirm_${Date.now()}`);
        sendChurrascoTicketEmail(order).catch(() => {});
        return sendJson(res, 200, { success: true, order });
      }

      // Modo Real Stripe: validação por sessionId ou pesquisa nas sessões recentes
      try {
        const stripe = getStripeClient();
        if (stripe) {
          let session = null;
          const targetSessionId = sessionId && !sessionId.startsWith('{') ? sessionId : (order.payment_ref?.startsWith('cs_') ? order.payment_ref : null);
          if (targetSessionId) {
            session = await stripe.checkout.sessions.retrieve(targetSessionId);
          } else {
            const list = await stripe.checkout.sessions.list({ limit: 50 });
            if (list.data) {
              session = list.data.find(
                (s) =>
                  s.client_reference_id === orderId ||
                  s.metadata?.order_id === orderId ||
                  s.metadata?.orderId === orderId
              );
            }
          }
          if (session && session.payment_status === 'paid') {
            order = confirmChurrascoOrderPayment(orderId, session.payment_intent || session.id);
            sendChurrascoTicketEmail(order).catch(() => {});
            return sendJson(res, 200, { success: true, order });
          }
        }
      } catch (sErr) {
        console.warn('[CHURRASCO STRIPE CONFIRM WARN]:', sErr.message);
      }

      return sendJson(res, 200, { success: false, paymentStatus: order.payment_status, order });
    }

    /* =========================================================================
       ROTAS DO BALCÃO / LEITURA DE QR CODE (CHURRASCO-ADMIN & CHURRASCO-QR)
       ========================================================================= */

    // 5. POST /api/churrasco-admin/login - Login do staff do bar com a senha do churrasco e username
    if (pathname === '/api/churrasco-admin/login' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const { password } = body;
      const username = String(body.username || body.staffName || '').trim();

      if (!verifyChurrascoAdminPassword(password)) {
        return sendJson(res, 401, { error: 'Senha de acesso ao balcão incorreta.' });
      }

      const validUsername = username && username.length >= 2 ? username : 'Staff';
      const token = `churr_bar_${Buffer.from(String(password).trim()).toString('base64')}`;
      return sendJson(res, 200, {
        success: true,
        token,
        username: validUsername,
        message: 'Acesso ao balcão autorizado.',
      });
    }

    // 6. GET /api/churrasco-admin/verify-code OU /api/churrasco-qr - Ler e validar QR Code
    if (
      (pathname === '/api/churrasco-admin/verify-code' ||
        pathname === '/api/churrasco-qr' ||
        pathname === '/api/churrasco/qr') &&
      req.method === 'GET'
    ) {
      if (!verifyBarStaffAuth(req)) {
        return sendJson(res, 401, { error: 'Não autorizado. Introduz a senha do churrasco-admin.' });
      }

      const rawCode = (
        searchParams.get('code') ||
        searchParams.get('ticket') ||
        searchParams.get('id') ||
        searchParams.get('qr') ||
        ''
      ).trim();

      if (!rawCode) {
        return sendJson(res, 400, { error: 'Código do QR Code não fornecido.' });
      }

      // Normaliza o código: aceita URL completa, NEEI-CHURR:XXXX, ou código direto
      let cleanCode = rawCode;
      if (cleanCode.includes('code=')) {
        cleanCode = cleanCode.split('code=')[1].split('&')[0];
      }
      cleanCode = cleanCode.replace(/^NEEI-CHURR:/i, '').trim();

      let order = getChurrascoOrderByTicketCode(cleanCode);
      if (!order) {
        order = getChurrascoOrderById(cleanCode);
      }

      if (!order) {
        return sendJson(res, 404, {
          valid: false,
          error: `Bilhete não encontrado para o código "${cleanCode}".`,
        });
      }

      return sendJson(res, 200, {
        success: true,
        valid: true,
        isPaid: order.payment_status === 'paid',
        order,
      });
    }

    // 7. POST /api/churrasco-admin/serve - Servir bebida ou bifana e abater do passe
    if (pathname === '/api/churrasco-admin/serve' && req.method === 'POST') {
      if (!verifyBarStaffAuth(req)) {
        return sendJson(res, 401, { error: 'Não autorizado. Introduz a senha do churrasco-admin.' });
      }

      const body = await readJsonBody(req);
      const { orderId } = body;
      const item = body.item || body.itemType;
      const action = body.action || (body.delta && body.delta < 0 ? 'undo' : 'serve');
      const staffName = String(body.staffName || body.username || 'Staff').trim() || 'Staff';

      if (!orderId || !item) {
        return sendJson(res, 400, { error: 'orderId e item (bifana ou drink) são obrigatórios.' });
      }

      const updated = serveChurrascoItem(orderId, item, action, staffName);
      return sendJson(res, 200, {
        success: true,
        order: updated,
        staffName,
        message:
          action === 'undo'
            ? `1 ${item === 'bifana' ? 'bifana' : 'bebida'} reposta com sucesso por ${staffName}.`
            : `1 ${item === 'bifana' ? 'bifana' : 'bebida'} servida com sucesso por ${staffName}!`,
      });
    }

    /* =========================================================================
       ROTAS PROTEGIDAS DE ADMINISTRAÇÃO DO CHURRASCO (PAINEL PRINCIPAL)
       ========================================================================= */

    // 8. GET /api/admin/churrasco - Listar estatísticas e todos os bilhetes vendidos
    if (pathname === '/api/admin/churrasco' && req.method === 'GET') {
      if (!verifyAdminToken(req)) {
        return sendJson(res, 401, { error: 'Sessão de administração inválida ou expirada.' });
      }

      // Sincroniza pedidos pendentes com a Stripe (resolve pagamentos que não dispararam webhook local)
      await syncPendingChurrascoOrdersWithStripe();

      const stats = getChurrascoStats();
      const orders = getAllChurrascoOrders();
      const barPassword = getChurrascoAdminPassword();
      const logs = getChurrascoLogs(200);

      return sendJson(res, 200, {
        success: true,
        stats,
        orders,
        logs,
        barPassword,
        visibility: isChurrascoVisible(),
      });
    }

    // 9. POST /api/admin/churrasco/password - Alterar senha de acesso ao balcão/churrasco-admin
    if (pathname === '/api/admin/churrasco/password' && req.method === 'POST') {
      if (!verifyAdminToken(req)) {
        return sendJson(res, 401, { error: 'Sessão de administração inválida ou expirada.' });
      }

      const body = await readJsonBody(req);
      const newPass = setChurrascoAdminPassword(body.password);

      return sendJson(res, 200, {
        success: true,
        password: newPass,
        barPassword: newPass,
        message: 'Senha do balcão (churrasco-admin) atualizada com sucesso.',
      });
    }

    // 10. POST /api/admin/churrasco/toggle-visibility - Mostrar/esconder aba de churrasco no site
    if (pathname === '/api/admin/churrasco/toggle-visibility' && req.method === 'POST') {
      if (!verifyAdminToken(req)) {
        return sendJson(res, 401, { error: 'Sessão de administração inválida ou expirada.' });
      }

      const body = await readJsonBody(req);
      const isVisible = Boolean(body.visible);
      setChurrascoVisibility(isVisible);

      return sendJson(res, 200, {
        success: true,
        visible: isChurrascoVisible(),
        message: isVisible
          ? 'Aba do Churrasco ativada e visível no site.'
          : 'Aba do Churrasco desativada e ocultada do site.',
      });
    }

    // 11. POST /api/admin/churrasco/check-in - Alternar estado de levantamento do bilhete (Check-in)
    if (pathname === '/api/admin/churrasco/check-in' && req.method === 'POST') {
      if (!verifyAdminToken(req)) {
        return sendJson(res, 401, { error: 'Sessão de administração inválida ou expirada.' });
      }

      const body = await readJsonBody(req);
      const { orderId, status } = body;
      if (!orderId) {
        return sendJson(res, 400, { error: 'orderId é obrigatório' });
      }

      const updated = toggleChurrascoCheckIn(orderId, status !== false);
      return sendJson(res, 200, {
        success: true,
        order: updated,
      });
    }

    // 12. POST /api/admin/churrasco/manual-order - Registar bilhete manual (Presencial / Dinheiro)
    if (pathname === '/api/admin/churrasco/manual-order' && req.method === 'POST') {
      if (!verifyAdminToken(req)) {
        return sendJson(res, 401, { error: 'Sessão de administração inválida ou expirada.' });
      }

      const body = await readJsonBody(req);
      const order = createAdminManualChurrascoOrder(body);
      if (order.student_email && order.student_email !== 'presencial@neei.pt') {
        sendChurrascoTicketEmail(order).catch(() => {});
      }

      return sendJson(res, 201, {
        success: true,
        order,
      });
    }

    // 13. DELETE /api/admin/churrasco/order/:id - Eliminar pedido de churrasco
    if (pathname.startsWith('/api/admin/churrasco/order/') && req.method === 'DELETE') {
      if (!verifyAdminToken(req)) {
        return sendJson(res, 401, { error: 'Sessão de administração inválida ou expirada.' });
      }

      const orderId = decodeURIComponent(pathname.replace('/api/admin/churrasco/order/', '')).trim();
      const deleted = deleteChurrascoOrder(orderId);
      if (!deleted) {
        return sendJson(res, 404, { error: 'Bilhete não encontrado para eliminação.' });
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Bilhete eliminado com sucesso.',
      });
    }

    return false;
  } catch (err) {
    console.error(`[CHURRASCO API ERROR ${pathname}]:`, err);
    return sendJson(res, err.statusCode || 500, {
      error: err.message || 'Erro interno no servidor ao processar pedido de churrasco.',
    });
  }
}

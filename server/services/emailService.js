import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM =
  process.env.SMTP_FROM || 'NEEI - Núcleo de Estudantes de Engenharia Informática <neei@aaualg.pt>';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log(`[EMAIL] Transporte SMTP ativo configurado para ${SMTP_HOST}:${SMTP_PORT}`);
  } else {
    // Modo Dry-run / Sandbox em desenvolvimento
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('---------------------------------------------------------');
        console.log(`[EMAIL SIMULADO (DRY-RUN)] Para: ${mailOptions.to}`);
        console.log(`Assunto: ${mailOptions.subject}`);
        console.log(`De: ${mailOptions.from}`);
        console.log('Corpo do email gerado com sucesso.');
        console.log('---------------------------------------------------------');
        return { messageId: `mock-${Date.now()}` };
      },
    };
    console.log('[EMAIL] Credenciais SMTP não configuradas no .env. Ativo em modo DRY-RUN / Log.');
  }

  return transporter;
}

/**
 * Envia o email de confirmação de encomenda após o pagamento bem-sucedido
 */
export async function sendOrderConfirmationEmail(order) {
  if (!order || !order.student_email) {
    throw new Error('Dados de encomenda ou email do aluno em falta');
  }

  const isShipping = order.delivery_type === 'shipping';
  const deliveryText = isShipping
    ? `Envio por Correio (CTT) para: ${order.shipping_address}, ${order.shipping_postal_code} ${order.shipping_city}`
    : 'Levantamento no Gabinete do NEEI (Campus da Penha)';

  const formattedAmount = Number(order.total_amount).toFixed(2);
  const formattedItemPrice = Number(order.item_price).toFixed(2);
  const formattedShipping = Number(order.shipping_fee).toFixed(2);

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmação da tua Encomenda - NEEI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px 12px; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #06b6d4; }
    .logo-text { font-size: 24px; font-weight: 800; color: #38bdf8; letter-spacing: 1px; margin: 0; }
    .sub-title { font-size: 14px; color: #94a3b8; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; }
    .content { padding: 32px 24px; }
    .status-badge { display: inline-block; background-color: #064e3b; color: #34d399; font-weight: 600; font-size: 13px; padding: 6px 14px; border-radius: 9999px; border: 1px solid #059669; margin-bottom: 20px; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 16px 0; color: #ffffff; }
    p { font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 0 0 16px 0; }
    .order-box { background-color: #0f172a; border-radius: 8px; border: 1px solid #334155; padding: 20px; margin: 24px 0; }
    .order-item { display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 10px 0; font-size: 14px; }
    .order-item:last-child { border-bottom: none; }
    .item-label { color: #94a3b8; }
    .item-value { color: #f8fafc; font-weight: 600; text-align: right; }
    .total-row { display: flex; justify-content: space-between; padding-top: 14px; border-top: 2px solid #334155; font-size: 16px; font-weight: 700; color: #38bdf8; }
    .instructions { background-color: #172554; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-top: 24px; }
    .instructions h3 { margin: 0 0 8px 0; font-size: 15px; color: #93c5fd; }
    .instructions p { margin: 0; font-size: 13px; color: #bfdbfe; }
    .footer { background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155; font-size: 12px; color: #64748b; }
    .footer a { color: #38bdf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-text">NEEI · AAUAlg</div>
      <div class="sub-title">Núcleo de Estudantes de Engenharia Informática</div>
    </div>
    
    <div class="content">
      <div class="status-badge">✓ Pagamento Confirmado via MB WAY</div>
      <h1>Olá ${order.student_name},</h1>
      <p>O teu pagamento foi processado com sucesso e a tua pré-encomenda da <strong>Sweat Oficial de Engenharia Informática 2026</strong> foi confirmada!</p>
      
      <div class="order-box">
        <div class="order-item">
          <span class="item-label">Nº de Encomenda:</span>
          <span class="item-value">${order.id}</span>
        </div>
        <div class="order-item">
          <span class="item-label">Artigo:</span>
          <span class="item-value">Sweat Oficial Engenharia Informática</span>
        </div>
        <div class="order-item">
          <span class="item-label">Tamanho:</span>
          <span class="item-value" style="color: #38bdf8; font-size: 16px;">${order.size}</span>
        </div>
        <div class="order-item">
          <span class="item-label">Cor:</span>
          <span class="item-value">${order.color || 'Preto'}</span>
        </div>
        <div class="order-item">
          <span class="item-label">NIF registado:</span>
          <span class="item-value">${order.nif}</span>
        </div>
        <div class="order-item">
          <span class="item-label">Subtotal Sweat:</span>
          <span class="item-value">${formattedItemPrice}€</span>
        </div>
        <div class="order-item">
          <span class="item-label">Portes de Envio:</span>
          <span class="item-value">${formattedShipping > 0 ? `${formattedShipping}€` : 'Grátis (Gabinete)'}</span>
        </div>
        <div class="total-row">
          <span>Total Pago:</span>
          <span>${formattedAmount}€</span>
        </div>
      </div>

      <div class="instructions">
        <h3>Próximos Passos & Entrega</h3>
        <p><strong>Modalidade escolhida:</strong> ${deliveryText}</p>
        <p style="margin-top: 8px;">Esta é uma campanha de pré-encomenda. Assim que o lote de produção estiver pronto na fábrica, receberás novo email com os dias de recolha no Gabinete do NEEI ou o tracking de envio dos CTT.</p>
      </div>

      <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">
        Se tiveres qualquer dúvida ou precisares de suporte com a tua encomenda, basta responder a este email ou contactar-nos através de <a href="mailto:neei@aaualg.pt" style="color: #38bdf8;">neei@aaualg.pt</a>.
      </p>
    </div>

    <div class="footer">
      <p>NEEI - Núcleo de Estudantes de Engenharia Informática da AAUAlg</p>
      <p>Campus da Penha & Campus de Gambelas · Faro, Portugal</p>
      <p><a href="https://instagram.com/neeiualg">Instagram</a> · <a href="https://discord.gg/HzBuRFCAb5">Discord</a> · <a href="https://github.com/neei-aaualg">GitHub</a></p>
    </div>
  </div>
</body>
</html>
  `;

  const transport = getTransporter();

  const mailOptions = {
    from: SMTP_FROM,
    to: `${order.student_name} <${order.student_email}>`,
    subject: `[NEEI] Confirmação da Encomenda ${order.id} - Sweat Engenharia Informática`,
    html: htmlContent,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(
      `[EMAIL] Email de confirmação enviado para ${order.student_email} (ID: ${info.messageId})`
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] Falha ao enviar email para ${order.student_email}:`, error);
    // Não rebenta a aplicação, devolve status para registo
    return { success: false, error: error.message };
  }
}

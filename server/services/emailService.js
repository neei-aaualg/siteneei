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
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #334155;
      margin: 0;
      padding: 32px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
    }
    .header {
      background: linear-gradient(135deg, #0b1329 0%, #111e38 100%);
      padding: 32px 24px;
      text-align: center;
      border-top: 4px solid #06b6d4;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 800;
      color: #38bdf8;
      letter-spacing: 1.5px;
      margin: 0;
    }
    .sub-title {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
    }
    .content {
      padding: 32px 28px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      background-color: #ecfdf5;
      color: #065f46;
      font-weight: 600;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 9999px;
      border: 1px solid #a7f3d0;
      margin-bottom: 22px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 14px 0;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 16px 0;
    }
    .order-box {
      background-color: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      margin: 24px 0;
    }
    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      padding: 12px 18px;
      font-size: 14px;
    }
    .item-label {
      color: #64748b;
      font-weight: 500;
    }
    .item-value {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .size-pill {
      display: inline-block;
      background-color: #e0f2fe;
      color: #0369a1;
      font-weight: 700;
      font-size: 13px;
      padding: 2px 10px;
      border-radius: 6px;
      border: 1px solid #bae6fd;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 18px;
      background-color: #f1f5f9;
      border-top: 2px solid #e2e8f0;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .total-amount {
      color: #0284c7;
      font-size: 18px;
    }
    .instructions {
      background-color: #eff6ff;
      border-left: 4px solid #0284c7;
      border-top: 1px solid #dbeafe;
      border-right: 1px solid #dbeafe;
      border-bottom: 1px solid #dbeafe;
      padding: 18px;
      border-radius: 8px;
      margin: 26px 0;
    }
    .instructions h3 {
      margin: 0 0 8px 0;
      font-size: 15px;
      color: #1e40af;
      font-weight: 700;
    }
    .instructions p {
      margin: 0;
      font-size: 13.5px;
      color: #1e3a8a;
      line-height: 1.5;
    }
    .support-note {
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
      margin-top: 20px;
    }
    .support-note a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }
    .support-note a:hover {
      text-decoration: underline;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer a {
      color: #0284c7;
      text-decoration: none;
      font-weight: 500;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-text">NEEI · AAUAlg</div>
      <div class="sub-title">Núcleo de Estudantes de Engenharia Informática</div>
    </div>
    
    <div class="content">
      <div class="status-badge">
        <span>✓ Pagamento Confirmado via MB WAY</span>
      </div>
      
      <h1>Olá ${order.student_name},</h1>
      <p>O teu pagamento foi processado com sucesso e a tua pré-encomenda da <strong>Sweat Oficial de Engenharia Informática 2026</strong> está confirmada!</p>
      
      <div class="order-box">
        <div class="order-item">
          <span class="item-label">Nº de Encomenda:</span>
          <span class="item-value" style="font-family: monospace; font-size: 13px;">${order.id}</span>
        </div>
        <div class="order-item">
          <span class="item-label">Artigo:</span>
          <span class="item-value">Sweat Oficial Engenharia Informática</span>
        </div>
        <div class="order-item">
          <span class="item-label">Tamanho:</span>
          <span class="item-value"><span class="size-pill">${order.size}</span></span>
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
          <span class="item-value">${Number(formattedShipping) > 0 ? `${formattedShipping}€` : 'Grátis (Gabinete)'}</span>
        </div>
        <div class="total-row">
          <span>Total Pago:</span>
          <span class="total-amount">${formattedAmount}€</span>
        </div>
      </div>

      <div class="instructions">
        <h3>Próximos Passos & Entrega</h3>
        <p><strong>Modalidade escolhida:</strong> ${deliveryText}</p>
        <p style="margin-top: 10px;">Esta é uma campanha oficial de pré-encomenda. Assim que o lote consolidado estiver concluído na fábrica, receberás nova notificação por email com as datas para recolha presencial no Gabinete do NEEI ou o código de rastreio dos CTT.</p>
      </div>

      <p class="support-note">
        Tens dúvidas ou pretendes alterar algum dado da encomenda? Entra em contacto connosco respondendo a esta mensagem ou enviando um email para <a href="mailto:neei@aaualg.pt">neei@aaualg.pt</a>.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">NEEI - Núcleo de Estudantes de Engenharia Informática da AAUAlg</p>
      <p style="margin: 0 0 8px 0;">Campus da Penha & Campus de Gambelas · Faro, Portugal</p>
      <p style="margin: 0;">
        <a href="https://instagram.com/neeiualg" target="_blank" rel="noopener">Instagram</a> · 
        <a href="https://discord.gg/HzBuRFCAb5" target="_blank" rel="noopener">Discord</a> · 
        <a href="https://github.com/neei-aaualg" target="_blank" rel="noopener">GitHub</a>
      </p>
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

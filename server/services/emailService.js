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
    : 'Levantamento no Gabinete do NEEI (Sala 0.18, Edifício 1, Campus de Gambelas)';

  const formattedAmount = Number(order.total_amount).toFixed(2);
  const formattedItemPrice = Number(order.item_price).toFixed(2);
  const formattedShipping = Number(order.shipping_fee).toFixed(2);

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Confirmação da tua Encomenda - NEEI</title>
  <style>
    :root {
      color-scheme: dark light;
      supported-color-schemes: dark light;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #030712 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body bgcolor="#030712" style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Tabela de Enquadramento Global -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#030712" style="background-color: #030712; width: 100%; margin: 0; padding: 32px 12px;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Cartão Principal -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#090e1a" style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #090e1a; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);">
          
          <!-- Cabeçalho Oficial NEEI -->
          <tr>
            <td bgcolor="#050a14" style="background: linear-gradient(135deg, #050a14 0%, #0c152a 100%); background-color: #050a14; padding: 32px 24px; text-align: center; border-top: 4px solid #06b6d4; border-bottom: 1px solid #1e293b;">
              <div style="font-size: 24px; font-weight: 800; color: #38bdf8; letter-spacing: 1.5px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">NEEI · AAUAlg</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 6px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Núcleo de Estudantes de Engenharia Informática</div>
            </td>
          </tr>
          
          <!-- Conteúdo Principal -->
          <tr>
            <td bgcolor="#090e1a" style="padding: 32px 28px; background-color: #090e1a;">
              
              <!-- Badge de Pagamento Confirmado -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 22px;">
                <tr>
                  <td bgcolor="#022c22" style="background-color: #022c22; border: 1px solid #059669; border-radius: 9999px; padding: 7px 18px; color: #34d399; font-size: 13px; font-weight: 700; letter-spacing: 0.2px;">
                    ✓ Pagamento Confirmado via MB WAY
                  </td>
                </tr>
              </table>
              
              <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 14px 0; color: #ffffff; letter-spacing: -0.3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                Olá ${order.student_name},
              </h1>
              
              <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0; margin: 0 0 24px 0;">
                O teu pagamento foi processado com sucesso e a tua pré-encomenda da <strong style="color: #ffffff;">Sweat Oficial de Engenharia Informática 2026</strong> está confirmada!
              </p>
              
              <!-- Tabela de Detalhes da Encomenda -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f172a" style="width: 100%; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 13px 18px; color: #94a3b8; font-size: 13.5px; font-weight: 500; border-bottom: 1px solid #1e293b;">Nº de Encomenda:</td>
                  <td style="padding: 13px 18px; text-align: right; color: #38bdf8; font-size: 13.5px; font-weight: 700; font-family: 'Courier New', Courier, monospace; border-bottom: 1px solid #1e293b;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; color: #94a3b8; font-size: 13.5px; font-weight: 500; border-bottom: 1px solid #1e293b;">Artigo:</td>
                  <td style="padding: 13px 18px; text-align: right; color: #ffffff; font-size: 13.5px; font-weight: 600; border-bottom: 1px solid #1e293b;">Sweat Oficial Engenharia Informática</td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; color: #94a3b8; font-size: 13.5px; font-weight: 500; border-bottom: 1px solid #1e293b;">Tamanho:</td>
                  <td style="padding: 13px 18px; text-align: right; border-bottom: 1px solid #1e293b;">
                    <span style="display: inline-block; background-color: #0284c7; color: #ffffff; font-weight: 800; font-size: 12.5px; padding: 2px 12px; border-radius: 6px; border: 1px solid #38bdf8;">${order.size}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; color: #94a3b8; font-size: 13.5px; font-weight: 500; border-bottom: 1px solid #1e293b;">Cor:</td>
                  <td style="padding: 13px 18px; text-align: right; color: #ffffff; font-size: 13.5px; font-weight: 600; border-bottom: 1px solid #1e293b;">${order.color || 'Preto'}</td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; color: #94a3b8; font-size: 13.5px; font-weight: 500; border-bottom: 1px solid #1e293b;">Subtotal Sweat:</td>
                  <td style="padding: 13px 18px; text-align: right; color: #ffffff; font-size: 13.5px; font-weight: 600; border-bottom: 1px solid #1e293b;">${formattedItemPrice}€</td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; color: #94a3b8; font-size: 13.5px; font-weight: 500; border-bottom: 1px solid #1e293b;">Portes de Envio:</td>
                  <td style="padding: 13px 18px; text-align: right; color: #f1f5f9; font-size: 13.5px; font-weight: 600; border-bottom: 1px solid #1e293b;">${Number(formattedShipping) > 0 ? `${formattedShipping}€` : 'Grátis (Gabinete)'}</td>
                </tr>
                <tr>
                  <td bgcolor="#050a14" style="padding: 16px 18px; color: #ffffff; font-size: 15.5px; font-weight: 700; background-color: #050a14; border-top: 2px solid #0284c7;">Total Pago:</td>
                  <td bgcolor="#050a14" style="padding: 16px 18px; text-align: right; color: #38bdf8; font-size: 21px; font-weight: 800; background-color: #050a14; border-top: 2px solid #0284c7;">${formattedAmount}€</td>
                </tr>
              </table>

              <!-- Caixa de Próximos Passos & Entrega -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a1526" style="width: 100%; background-color: #0a1526; border-left: 4px solid #38bdf8; border-top: 1px solid #172d4c; border-right: 1px solid #172d4c; border-bottom: 1px solid #172d4c; border-radius: 8px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px;">
                    <div style="color: #38bdf8; font-size: 15px; font-weight: 700; margin-bottom: 8px;">
                      Próximos Passos & Entrega
                    </div>
                    <div style="color: #f1f5f9; font-size: 13.5px; line-height: 1.5; margin-bottom: 10px;">
                      <strong style="color: #38bdf8;">Modalidade escolhida:</strong> ${deliveryText}
                    </div>
                    <div style="color: #cbd5e1; font-size: 13px; line-height: 1.6;">
                      Esta é uma campanha oficial de pré-encomenda. Assim que o lote estiver concluído na fábrica, receberás nova notificação via Instagram e/ou email com as datas para recolha presencial no Gabinete do NEEI ou o código de rastreio dos CTT.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Nota de Apoio -->
              <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin: 0;">
                Tens dúvidas ou pretendes alterar algum dado da encomenda? Entra em contacto connosco respondendo a esta mensagem ou enviando um email para <a href="mailto:neei@aaualg.pt" style="color: #38bdf8; text-decoration: underline; font-weight: 600;">neei@aaualg.pt</a>.
              </p>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td bgcolor="#04070e" style="background-color: #04070e; padding: 24px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #94a3b8;">NEEI - Núcleo de Estudantes de Engenharia Informática da AAUAlg</p>
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #64748b;">Sala 0.18, Edifício 1, Campus de Gambelas · Faro, Portugal</p>
              <p style="margin: 0; font-size: 12px;">
                <a href="https://instagram.com/neeiualg" target="_blank" rel="noopener" style="color: #38bdf8; text-decoration: none; font-weight: 500;">Instagram</a>
                <span style="color: #475569; margin: 0 6px;">·</span>
                <a href="https://discord.gg/HzBuRFCAb5" target="_blank" rel="noopener" style="color: #38bdf8; text-decoration: none; font-weight: 500;">Discord</a>
                <span style="color: #475569; margin: 0 6px;">·</span>
                <a href="https://github.com/neei-aaualg" target="_blank" rel="noopener" style="color: #38bdf8; text-decoration: none; font-weight: 500;">GitHub</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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

import nodemailer from 'nodemailer';

function cleanEnvVal(val) {
  if (!val) return '';
  return String(val).trim().replace(/^['"]|['"]$/g, '');
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = cleanEnvVal(process.env.SMTP_HOST);
  const port = parseInt(cleanEnvVal(process.env.SMTP_PORT) || '587', 10);
  const user = cleanEnvVal(process.env.SMTP_USER);
  const pass = cleanEnvVal(process.env.SMTP_PASS);

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false, // Permite certificados institucionais / STARTTLS com segurança
      },
    });
    console.log(`[EMAIL] Transporte SMTP ativo configurado para ${host}:${port} (${user})`);
  } else {
    // Modo Dry-run / Sandbox em desenvolvimento
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('---------------------------------------------------------');
        console.log(`[EMAIL SIMULADO (DRY-RUN)] Para: ${mailOptions.to}`);
        console.log(`Assunto: ${mailOptions.subject}`);
        console.log(`De: ${mailOptions.from}`);
        console.log('Corpo do email gerado com sucesso (HTML & Texto Simples).');
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

  const cleanName = (order.student_name || 'Estudante').trim();
  const cleanEmail = (order.student_email || '').trim().toLowerCase();
  const isShipping = order.delivery_type === 'shipping';

  const addressLine = order.shipping_address || 'Morada não especificada';
  const postalCode = order.shipping_postal_code || '';
  const city = order.shipping_city || '';
  const fullShippingAddress = `${addressLine}${postalCode ? `, ${postalCode}` : ''}${city ? ` ${city}` : ''}`;

  const deliveryText = isShipping
    ? `Envio por Correio (CTT Nacional) para: ${fullShippingAddress}`
    : 'Levantamento no Gabinete do NEEI (Sala 0.18, Edifício 1, Campus de Gambelas, Faro)';

  const formattedAmount = Number(order.total_amount || 0).toFixed(2);
  const formattedItemPrice = Number(order.item_price || 0).toFixed(2);
  const formattedShipping = Number(order.shipping_fee || 0).toFixed(2);
  const orderColor = order.color || 'Preto';
  const orderSize = order.size || 'M';

  const smtpFrom =
    cleanEnvVal(process.env.SMTP_FROM) ||
    'NEEI · AAUAlg <neei@aaualg.pt>';

  // Versão em Texto Simples (Garante que NENHUM cliente de email vê o email vazio)
  const plainTextContent = `
============================================================
NEEI - NÚCLEO DE ESTUDANTES DE ENGENHARIA INFORMÁTICA AAUALG
Confirmação da tua Pré-encomenda
============================================================

Olá ${cleanName},

O teu pagamento foi confirmado com sucesso e a tua Sweat Oficial de Engenharia Informática 2026 já está garantida no sistema!

DETALHES DA ENCOMENDA:
------------------------------------------------------------
- Nº da Encomenda:    ${order.id}
- Artigo:             Sweat Oficial Engenharia Informática 2026
- Tamanho:            ${orderSize}
- Cor:                ${orderColor}
- Subtotal Sweat:     ${formattedItemPrice}€
- Portes de Envio:    ${Number(formattedShipping) > 0 ? `${formattedShipping}€` : 'Grátis (Levantamento no Gabinete)'}
- TOTAL PAGO:         ${formattedAmount}€

MODALIDADE DE ENTREGA:
------------------------------------------------------------
${deliveryText}

PRÓXIMOS PASSOS:
------------------------------------------------------------
Esta é uma campanha oficial de pré-encomenda. Assim que o lote de produção na fábrica estiver concluído, entraremos em contacto por email e/ou através do Instagram (@neeiualg) com as datas para levantamento no gabinete ou o código de rastreio dos CTT.

Podes acompanhar o estado da tua encomenda a qualquer momento em:
https://neei.aaualg.pt/merch?track=${encodeURIComponent(order.id)}

Dúvidas ou apoio?
Envia-nos um email para neei@aaualg.pt ou mensagem no Instagram @neeiualg.

Sala 0.18, Edifício 1, Campus de Gambelas, Faro
Núcleo de Estudantes de Engenharia Informática da AAUAlg
============================================================
`.trim();

  // Versão em HTML Bulletproof (compatível com Outlook, Gmail, Apple Mail, Dark/Light modes)
  const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirmação da tua Encomenda - NEEI</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f5f9" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Cartão Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          
          <!-- Banner Cabeçalho -->
          <tr>
            <td align="center" bgcolor="#0b192c" style="background-color: #0b192c; padding: 32px 24px; border-bottom: 4px solid #06b6d4;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; font-weight: 900; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">NEEI · AAUALG</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="font-size: 11px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Núcleo de Estudantes de Engenharia Informática</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo Principal do Email -->
          <tr>
            <td style="padding: 32px 28px; background-color: #ffffff;">
              
              <!-- Selo de Pagamento Confirmado -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td bgcolor="#ecfdf5" style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 9999px; padding: 6px 16px; color: #047857; font-size: 13px; font-weight: 700;">
                    ✓ Pagamento Confirmado com Sucesso
                  </td>
                </tr>
              </table>

              <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
                Olá, ${cleanName}!
              </h1>

              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
                Muito obrigado pela tua compra! O teu pagamento foi recebido com sucesso e a tua <strong style="color: #0f172a;">Sweat Oficial de Engenharia Informática 2026</strong> já está reservada no sistema.
              </p>

              <!-- Tabela Resumo do Pedido -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="width: 100%; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Nº de Encomenda:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0284c7; font-weight: 800; font-family: monospace; text-align: right; border-bottom: 1px solid #e2e8f0;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Artigo:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #e2e8f0;">Sweat Oficial Engenharia Informática 2026</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Tamanho / Cor:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #e2e8f0;">
                    <span style="background-color: #0284c7; color: #ffffff; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 800;">${orderSize}</span> · ${orderColor}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Preço da Sweat:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #e2e8f0;">${formattedItemPrice}€</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 13px; color: #64748b; font-weight: 600; border-bottom: 1px solid #e2e8f0;">Portes de Envio:</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right; border-bottom: 1px solid #e2e8f0;">
                    ${Number(formattedShipping) > 0 ? `${formattedShipping}€ (Envio CTT)` : 'Grátis (Gabinete)'}
                  </td>
                </tr>
                <tr>
                  <td bgcolor="#0b192c" style="padding: 16px; font-size: 15px; color: #ffffff; font-weight: 700; background-color: #0b192c; border-bottom-left-radius: 12px;">Total Pago:</td>
                  <td bgcolor="#0b192c" style="padding: 16px; font-size: 20px; color: #38bdf8; font-weight: 900; background-color: #0b192c; text-align: right; border-bottom-right-radius: 12px;">${formattedAmount}€</td>
                </tr>
              </table>

              <!-- Caixa de Entrega -->
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0fdfa" style="width: 100%; background-color: #f0fdfa; border: 1px solid #99f6e4; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px;">
                    <div style="font-size: 14px; font-weight: 800; color: #0f766e; margin-bottom: 8px;">
                      📦 Modalidade de Entrega Escolhida
                    </div>
                    <div style="font-size: 13px; line-height: 1.5; color: #134e4a; font-weight: 700; margin-bottom: 8px;">
                      ${deliveryText}
                    </div>
                    <div style="font-size: 12.5px; line-height: 1.5; color: #042f2e;">
                      Assim que o lote de confeção estiver pronto, enviaremos nova notificação por email e através do nosso Instagram com os horários de recolha no Gabinete do NEEI ou com o código de envio registado dos CTT.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Botão de Acompanhamento -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://neei.aaualg.pt/merch?track=${encodeURIComponent(order.id)}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 13px 28px; border-radius: 12px; box-shadow: 0 4px 10px rgba(2,132,199,0.3);">
                      Acompanhar Estado da Encomenda Online →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Suporte -->
              <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin: 0; text-align: center;">
                Tens alguma questão ou precisas de alterar algum dado? Fala connosco respondendo a este email ou através de <a href="mailto:neei@aaualg.pt" style="color: #0284c7; text-decoration: underline; font-weight: 600;">neei@aaualg.pt</a>.
              </p>
            </td>
          </tr>

          <!-- Rodapé Oficial -->
          <tr>
            <td bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 22px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #475569;">
                NEEI - Núcleo de Estudantes de Engenharia Informática da AAUAlg
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: #94a3b8;">
                Sala 0.18, Edifício 1, Campus de Gambelas · 8005-139 Faro, Portugal
              </p>
              <p style="margin: 0; font-size: 12px;">
                <a href="https://instagram.com/neeiualg" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 600;">Instagram</a>
                <span style="color: #cbd5e1; margin: 0 8px;">·</span>
                <a href="https://discord.gg/HzBuRFCAb5" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 600;">Discord</a>
                <span style="color: #cbd5e1; margin: 0 8px;">·</span>
                <a href="https://github.com/neei-aaualg" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 600;">GitHub</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  const transport = getTransporter();

  const mailOptions = {
    from: smtpFrom,
    to: `"${cleanName.replace(/"/g, '')}" <${cleanEmail}>`,
    subject: `[NEEI] Confirmação da Encomenda ${order.id} - Sweat Engenharia Informática`,
    text: plainTextContent,
    html: htmlContent,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(
      `[EMAIL] Email de confirmação enviado para ${cleanEmail} (ID: ${info.messageId})`
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] Falha ao enviar email para ${cleanEmail}:`, error);
    return { success: false, error: error.message };
  }
}

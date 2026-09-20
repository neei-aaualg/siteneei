import http from 'node:http';
import https from 'node:https';

const IFTHENPAY_MBWAY_KEY = process.env.IFTHENPAY_MBWAY_KEY || process.env.MBWAY_KEY;
const IFTHENPAY_ANTI_PHISHING_KEY = process.env.IFTHENPAY_ANTI_PHISHING_KEY;

// Verifica se está a correr em modo de produção com chaves ativas ou em modo Sandbox
export function isPaymentSandbox() {
  return (
    !IFTHENPAY_MBWAY_KEY || IFTHENPAY_MBWAY_KEY === 'sandbox' || IFTHENPAY_MBWAY_KEY === 'test'
  );
}

/**
 * Inicia um pedido de pagamento por MB WAY
 */
export async function initiateMbWayPayment({
  orderId,
  amount,
  mobileNumber,
  studentEmail,
  description,
}) {
  const formattedAmount = Number(amount).toFixed(2);
  const cleanMobile = String(mobileNumber)
    .replace(/\s+/g, '')
    .replace(/^\+351/, '');

  if (isPaymentSandbox()) {
    console.log('---------------------------------------------------------');
    console.log(`[MB WAY SANDBOX] Pedido iniciado para ${orderId}`);
    console.log(`Telemóvel: ${cleanMobile} | Valor: ${formattedAmount}€`);
    console.log(`Mensagem app: ${description || 'NEEI - Sweat Curso'}`);
    console.log('Modo Sandbox: Notificação simulada enviada para o telemóvel.');
    console.log('---------------------------------------------------------');

    return {
      success: true,
      provider: 'ifthenpay_sandbox',
      requestId: `sandbox-req-${Date.now()}-${orderId}`,
      expiresInSeconds: 300, // 5 minutos
      message: 'Notificação MB WAY simulada enviada com sucesso.',
    };
  }

  // Chamada à API oficial da Ifthenpay
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      mbWayKey: IFTHENPAY_MBWAY_KEY,
      orderId: orderId,
      amount: formattedAmount,
      mobileNumber: cleanMobile,
      email: studentEmail,
      description: description || 'NEEI - Sweat Engenharia Informática',
    });

    const options = {
      hostname: 'api.ifthenpay.com',
      port: 443,
      path: '/spg/payment/mbway',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          // Status 000 indica sucesso no envio do push pela SIBS / Ifthenpay
          if (json.Status === '000' || json.code === '0' || json.status === 'success') {
            resolve({
              success: true,
              provider: 'ifthenpay',
              requestId: json.RequestId || json.requestId || `ifthen-${Date.now()}`,
              expiresInSeconds: 300,
              message: 'Pedido enviado para a aplicação MB WAY do teu telemóvel.',
            });
          } else {
            console.error('[IFTHENPAY ERROR]', json);
            resolve({
              success: false,
              provider: 'ifthenpay',
              message: json.Message || json.message || 'Erro ao comunicar com a rede MB WAY.',
            });
          }
        } catch (e) {
          console.error('[IFTHENPAY PARSE ERROR]', data, e);
          reject(new Error('Resposta inválida do gateway Ifthenpay'));
        }
      });
    });

    req.on('error', (err) => {
      console.error('[IFTHENPAY HTTP ERROR]', err);
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Tempo limite excedido ao contactar o gateway Ifthenpay'));
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Valida a autenticidade do webhook da Ifthenpay
 */
export function verifyIfthenpayWebhook(params, body) {
  if (isPaymentSandbox()) {
    // Em modo de testes permite chamadas de simulação
    return true;
  }

  // Se tiver chave anti-phishing configurada, valida
  const keyToCheck = params?.chave || body?.chave || body?.antiPhishingKey;
  if (IFTHENPAY_ANTI_PHISHING_KEY) {
    return keyToCheck === IFTHENPAY_ANTI_PHISHING_KEY;
  }

  return true;
}

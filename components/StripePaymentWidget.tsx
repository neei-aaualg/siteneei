import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';

interface StripePaymentWidgetProps {
  clientSecret: string;
  publishableKey: string;
  orderId: string;
  totalAmount: number;
  isSandbox: boolean;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

/**
 * Formulário interno de pagamento (dentro do provider Elements)
 */
function PaymentForm({
  orderId,
  totalAmount,
  isSandbox,
  onSuccess,
  onError,
}: {
  orderId: string;
  totalAmount: number;
  isSandbox: boolean;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirming, setConfirming] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setConfirming(true);
    setPaymentError(null);

    const returnUrl = `${window.location.origin}/merch?payment_intent_done=1&orderId=${encodeURIComponent(orderId)}`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // Se chegar aqui, houve erro (sucesso = redireciona automaticamente)
    if (error) {
      const msg =
        error.type === 'card_error' || error.type === 'validation_error'
          ? (error.message ?? 'Erro de pagamento.')
          : 'Ocorreu um erro inesperado. Por favor tenta novamente.';
      setPaymentError(msg);
      onError(msg);
    }

    setConfirming(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
        }}
      />

      {paymentError && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/50 text-red-300 text-xs flex items-start gap-2">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{paymentError}</span>
        </div>
      )}

      {isSandbox && (
        <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-600/30 text-amber-300 text-xs">
          <span className="font-bold block mb-0.5">Modo de Testes</span>
          Cartão de teste: <span className="font-mono">4242 4242 4242 4242</span> · Data futura · CVC qualquer
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || confirming}
        className="w-full py-3.5 px-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-900/40 transition-all cursor-pointer"
      >
        {confirming ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>A processar pagamento...</span>
          </>
        ) : (
          <>
            <Lock size={16} />
            <span>Pagar {totalAmount.toFixed(2)}€ com segurança</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
        <ShieldCheck size={11} />
        <span>Pagamento processado com segurança pela Stripe · Os teus dados nunca passam pelo nosso servidor</span>
      </div>
    </form>
  );
}

/**
 * Widget de pagamento Stripe com todos os métodos ativos (Card, Apple Pay, Google Pay, MB WAY, Klarna, Pix…)
 */
export function StripePaymentWidget({
  clientSecret,
  publishableKey,
  orderId,
  totalAmount,
  isSandbox,
  onSuccess,
  onError,
}: StripePaymentWidgetProps) {
  const stripePromise = React.useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#06b6d4',
      colorBackground: '#0f172a',
      colorText: '#e2e8f0',
      colorDanger: '#f87171',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
      colorTextPlaceholder: '#475569',
    },
    rules: {
      '.Input': {
        border: '1px solid #1e293b',
        backgroundColor: '#020617',
        boxShadow: 'none',
      },
      '.Input:focus': {
        border: '1px solid #06b6d4',
        boxShadow: '0 0 0 2px rgba(6,182,212,0.2)',
      },
      '.Tab': {
        border: '1px solid #1e293b',
        backgroundColor: '#0f172a',
        color: '#94a3b8',
      },
      '.Tab:hover': {
        backgroundColor: '#1e293b',
        color: '#e2e8f0',
      },
      '.Tab--selected': {
        border: '1px solid #06b6d4',
        backgroundColor: '#083344',
        color: '#e2e8f0',
        boxShadow: '0 0 0 1px #06b6d4',
      },
      '.Label': {
        color: '#94a3b8',
        fontWeight: '500',
      },
    },
  };

  if (!stripePromise || !clientSecret) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
        <Loader2 size={18} className="animate-spin" />
        A carregar métodos de pagamento...
      </div>
    );
  }

  // Sandbox sem clientSecret real — mostra widget simulado
  if (isSandbox && clientSecret.startsWith('pi_sandbox_secret_')) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/30 text-center">
          <p className="text-amber-300 font-semibold text-sm mb-1">⚡ Modo Sandbox</p>
          <p className="text-amber-200/70 text-xs">
            Em modo sandbox, não há widget real. O pagamento será simulado automaticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={onSuccess}
          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all cursor-pointer"
        >
          ⚡ Simular Pagamento Aprovado
        </button>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
        locale: 'pt-PT',
      }}
    >
      <PaymentForm
        orderId={orderId}
        totalAmount={totalAmount}
        isSandbox={isSandbox}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

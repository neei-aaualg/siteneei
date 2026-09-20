import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Lock, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
          <AlertTriangle size={16} className="flex-shrink-0 text-red-500 mt-0.5" />
          <span className="leading-relaxed">{paymentError}</span>
        </div>
      )}

      {isSandbox && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs">
          <span className="font-bold block mb-1 flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
            ⚡ Modo de Testes Stripe
          </span>
          <p className="leading-relaxed text-[11px] text-amber-700 dark:text-amber-300/90">
            Cartão de teste: <span className="font-mono font-bold bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-200">4242 4242 4242 4242</span> · Data futura · CVC qualquer
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || confirming}
        className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-600/30 hover:shadow-cyan-500/40 transition-all cursor-pointer transform active:scale-[0.99]"
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

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <ShieldCheck size={13} className="text-emerald-500" />
        <span>Pagamento processado com segurança pela Stripe · Criptografia de ponta a ponta</span>
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
  const { isDark } = useTheme();

  const stripePromise = React.useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  const appearance = React.useMemo(() => {
    if (isDark) {
      return {
        theme: 'night' as const,
        variables: {
          colorPrimary: '#06b6d4',
          colorBackground: '#0c1724',
          colorText: '#f8fafc',
          colorDanger: '#f87171',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          spacingUnit: '4.5px',
          borderRadius: '12px',
          colorTextPlaceholder: '#64748b',
          colorIcon: '#38bdf8',
        },
        rules: {
          '.Input': {
            backgroundColor: '#020617',
            border: '1px solid #1e293b',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
            color: '#f8fafc',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          },
          '.Input:focus': {
            border: '1px solid #06b6d4',
            boxShadow: '0 0 0 2px rgba(6, 182, 212, 0.3)',
          },
          '.Tab': {
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            color: '#94a3b8',
            transition: 'all 0.15s ease',
          },
          '.Tab:hover': {
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
          '.Tab--selected': {
            backgroundColor: '#082f49',
            border: '1.5px solid #06b6d4',
            color: '#38bdf8',
            boxShadow: '0 0 0 1px #06b6d4',
          },
          '.Tab--selected:hover': {
            backgroundColor: '#082f49',
            border: '1.5px solid #06b6d4',
            color: '#38bdf8',
          },
          '.TabLabel': {
            fontWeight: '600',
          },
          '.Label': {
            color: '#cbd5e1',
            fontWeight: '600',
            fontSize: '12px',
            marginBottom: '6px',
          },
          '.Block': {
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
          },
        },
      };
    } else {
      return {
        theme: 'stripe' as const,
        variables: {
          colorPrimary: '#0891b2',
          colorBackground: '#ffffff',
          colorText: '#0f172a',
          colorDanger: '#dc2626',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          spacingUnit: '4.5px',
          borderRadius: '12px',
          colorTextPlaceholder: '#94a3b8',
          colorIcon: '#0891b2',
        },
        rules: {
          '.Input': {
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            color: '#0f172a',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          },
          '.Input:focus': {
            border: '1px solid #0891b2',
            boxShadow: '0 0 0 2px rgba(8, 145, 178, 0.2)',
          },
          '.Tab': {
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            transition: 'all 0.15s ease',
          },
          '.Tab:hover': {
            backgroundColor: '#f1f5f9',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
          },
          '.Tab--selected': {
            backgroundColor: '#ecfeff',
            border: '1.5px solid #0891b2',
            color: '#0e7490',
            boxShadow: '0 0 0 1px #0891b2',
          },
          '.Tab--selected:hover': {
            backgroundColor: '#ecfeff',
            border: '1.5px solid #0891b2',
            color: '#0e7490',
          },
          '.TabLabel': {
            fontWeight: '600',
          },
          '.Label': {
            color: '#334155',
            fontWeight: '600',
            fontSize: '12px',
            marginBottom: '6px',
          },
          '.Block': {
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          },
        },
      };
    }
  }, [isDark]);

  if (!stripePromise || !clientSecret) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
        <Loader2 size={18} className="animate-spin" />
        A carregar métodos de pagamento...
      </div>
    );
  }

  // Sandbox sem clientSecret real — mostra widget simulado
  if (
    isSandbox &&
    (clientSecret.startsWith('pi_sandbox_secret_') ||
      clientSecret.startsWith('cs_sandbox_secret_'))
  ) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
          <p className="text-amber-600 dark:text-amber-300 font-semibold text-sm mb-1">⚡ Modo Sandbox</p>
          <p className="text-amber-700 dark:text-amber-200/80 text-xs">
            Em modo sandbox local, o pagamento pode ser simulado diretamente.
          </p>
        </div>
        <button
          type="button"
          onClick={onSuccess}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm sm:text-base transition-all cursor-pointer shadow-lg shadow-amber-500/20"
        >
          ⚡ Simular Pagamento Aprovado ({totalAmount.toFixed(2)}€)
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

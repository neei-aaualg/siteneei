import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Ruler,
  AlertCircle,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  Info,
  ArrowRight,
  Loader2,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { ShopCampaign, SweatSize, DeliveryType } from '../types/shop';
import {
  fetchShopCampaign,
  submitCheckout,
  fetchOrderStatus,
  simulatePayment,
} from '../services/shopService';

// Tabela do Guia de Medidas (em centímetros)
const SIZE_GUIDE: Record<
  SweatSize,
  { chest: number; length: number; sleeve: number; label: string }
> = {
  XS: { chest: 49, length: 64, sleeve: 60, label: 'Extra Pequeno' },
  S: { chest: 52, length: 67, sleeve: 62, label: 'Pequeno' },
  M: { chest: 55, length: 70, sleeve: 64, label: 'Médio (Mais comum)' },
  L: { chest: 58, length: 73, sleeve: 66, label: 'Grande (Mais comum)' },
  XL: { chest: 61, length: 76, sleeve: 68, label: 'Extra Grande' },
  XXL: { chest: 64, length: 79, sleeve: 70, label: '2X Grande' },
  '3XL': { chest: 67, length: 82, sleeve: 72, label: '3X Grande' },
};

export const Shop: React.FC = () => {
  const [campaign, setCampaign] = useState<ShopCampaign | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seleções do comprador
  const [selectedSize, setSelectedSize] = useState<SweatSize>('M');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');

  // Modal Guia de Medidas
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  // Dados do Formulário
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nif, setNif] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCity, setShippingCity] = useState('');

  // Estados de Submissão e Pagamento
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [paymentTimeRemaining, setPaymentTimeRemaining] = useState(300); // 5 min
  const [paymentStatus, setPaymentStatus] = useState<
    'idle' | 'waiting_payment' | 'paid' | 'expired' | 'failed'
  >('idle');
  const [simulating, setSimulating] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Carrega dados da campanha
  useEffect(() => {
    let mounted = true;
    fetchShopCampaign()
      .then((data) => {
        if (mounted) {
          setCampaign(data.campaign);
          setIsSandbox(data.isSandbox);
          if (data.campaign?.sizes_available?.length > 0) {
            // Seleciona tamanho M se disponível, senão o primeiro
            if (data.campaign.sizes_available.includes('M')) {
              setSelectedSize('M');
            } else {
              setSelectedSize(data.campaign.sizes_available[0]);
            }
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Erro ao contactar o servidor.');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Cálculo de dias restantes até ao fim da campanha
  const daysLeft = useMemo(() => {
    if (!campaign?.deadline_date) return null;
    const deadline = new Date(campaign.deadline_date);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [campaign?.deadline_date]);

  // Cálculo do total
  const totalPrice = useMemo(() => {
    if (!campaign) return 0;
    const shipping = deliveryType === 'shipping' ? campaign.shipping_fee : 0;
    return Number((campaign.item_price + shipping).toFixed(2));
  }, [campaign, deliveryType]);

  // Polling de estado de pagamento quando activeOrderId está à espera
  useEffect(() => {
    if (!activeOrderId || paymentStatus !== 'waiting_payment') return;

    // Timer decrescente de 5 minutos
    const timer = setInterval(() => {
      setPaymentTimeRemaining((prev) => {
        if (prev <= 1) {
          setPaymentStatus('expired');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling ao backend a cada 2.5 segundos
    const pollInterval = setInterval(async () => {
      try {
        const status = await fetchOrderStatus(activeOrderId);
        if (status.paymentStatus === 'paid') {
          setPaymentStatus('paid');
          clearInterval(timer);
          clearInterval(pollInterval);
          // Lança confetes de celebração
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b'],
            });
          } catch (e) {
            // ignore
          }
        } else if (status.paymentStatus === 'failed' || status.paymentStatus === 'expired') {
          setPaymentStatus(status.paymentStatus);
          clearInterval(timer);
          clearInterval(pollInterval);
        }
      } catch (err) {
        // silencioso no polling
      }
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [activeOrderId, paymentStatus]);

  // Submissão do Checkout
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validações básicas
    if (!studentName.trim() || studentName.trim().length < 3) {
      setFormError('Por favor insere o teu nome completo.');
      return;
    }
    if (!studentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim())) {
      setFormError('Por favor insere um endereço de email válido para receberes a confirmação.');
      return;
    }
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/^\+351/, '');
    if (!/^9\d{8}$/.test(cleanPhone)) {
      setFormError(
        'Número de telemóvel inválido para MB WAY. Deve ter 9 dígitos portugueses a começar por 9.'
      );
      return;
    }
    if (deliveryType === 'shipping') {
      if (!shippingAddress.trim() || !shippingPostalCode.trim() || !shippingCity.trim()) {
        setFormError(
          'Para envio por correio é obrigatório preencher a Morada, Código Postal e Localidade.'
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await submitCheckout({
        student_name: studentName.trim(),
        student_email: studentEmail.trim(),
        phone_number: cleanPhone,
        nif: nif.trim() || undefined,
        size: selectedSize,
        delivery_type: deliveryType,
        shipping_address: deliveryType === 'shipping' ? shippingAddress.trim() : undefined,
        shipping_postal_code: deliveryType === 'shipping' ? shippingPostalCode.trim() : undefined,
        shipping_city: deliveryType === 'shipping' ? shippingCity.trim() : undefined,
      });

      setActiveOrderId(res.orderId);
      setPaymentTimeRemaining(res.expiresInSeconds || 300);
      setPaymentStatus('waiting_payment');
    } catch (err: any) {
      setFormError(err.message || 'Ocorreu um erro ao processar a tua encomenda. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Simular pagamento (modo sandbox / testes)
  const handleSimulatePayment = async () => {
    if (!activeOrderId) return;
    setSimulating(true);
    try {
      await simulatePayment(activeOrderId);
      setPaymentStatus('paid');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      alert('Erro na simulação: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  const copyOrderId = () => {
    if (activeOrderId) {
      navigator.clipboard.writeText(activeOrderId);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    }
  };

  // Formatador de minutos:segundos
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          A carregar a Loja de Merchandising do NEEI...
        </p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl inline-block mb-4">
          <AlertCircle size={36} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Loja Temporariamente Indisponível
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error || 'Não existe nenhuma campanha de pré-encomenda ativa de momento.'}
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 transition-colors"
        >
          Voltar ao Início
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070e17] text-slate-900 dark:text-slate-100 transition-colors py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Banner de Campanha & Urgência */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1724] border border-cyan-200/80 dark:border-cyan-500/30 shadow-sm dark:shadow-cyan-950/20 flex flex-col md:flex-row items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-3.5">
            <span className="flex h-3 w-3 relative flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-cyan-600 dark:text-cyan-400 block mb-0.5">
                Campanha Oficial de Pré-encomenda
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Sweat Oficial de Engenharia Informática UAlg 2026
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-cyan-50/80 dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-cyan-200/60 dark:border-cyan-500/20">
            <Clock size={16} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {daysLeft !== null && daysLeft > 0 ? (
                <>
                  Termina em{' '}
                  <strong className="text-cyan-700 dark:text-cyan-300 font-bold">
                    {daysLeft} dias
                  </strong>{' '}
                  <span className="text-slate-500 dark:text-slate-400">
                    ({campaign.deadline_date})
                  </span>
                </>
              ) : (
                <strong className="text-amber-600 dark:text-amber-400 font-bold">
                  Últimos dias de encomenda!
                </strong>
              )}
            </span>
          </div>
        </div>

        {/* Ecrã de Pagamento MB WAY Ativo (Modal / Overlay em foco) */}
        {paymentStatus !== 'idle' && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 text-center relative animate-in fade-in zoom-in-95 duration-200">
              {paymentStatus === 'waiting_payment' && (
                <div>
                  <div className="w-16 h-16 bg-cyan-500/20 border-2 border-cyan-500 rounded-full flex items-center justify-center mx-auto mb-5 text-cyan-400 animate-pulse">
                    <Smartphone size={32} />
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-800">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>À espera
                    de autorização
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">
                    Abre a tua app <span className="text-[#309b42] font-black">MB WAY</span>
                  </h3>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    Enviámos uma notificação para o teu telemóvel (
                    <strong className="text-white">{phoneNumber}</strong>) no valor de{' '}
                    <strong className="text-cyan-300 text-base">{totalPrice.toFixed(2)}€</strong>.
                    Autoriza na app para confirmar a tua sweat!
                  </p>

                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 flex items-center justify-around">
                    <div>
                      <span className="text-xs text-slate-400 block">Tempo restante</span>
                      <span className="text-2xl font-mono font-bold text-amber-400">
                        {formatTime(paymentTimeRemaining)}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-800"></div>
                    <div>
                      <span className="text-xs text-slate-400 block">Nº Encomenda</span>
                      <span className="text-sm font-mono font-semibold text-slate-200">
                        {activeOrderId}
                      </span>
                    </div>
                  </div>

                  {/* Sandbox helper */}
                  {isSandbox && (
                    <div className="mb-5 p-3.5 bg-amber-950/50 border border-amber-500/40 rounded-xl text-left">
                      <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs mb-1">
                        <Sparkles size={14} /> Modo Sandbox de Desenvolvimento
                      </div>
                      <p className="text-xs text-amber-200/80 mb-2">
                        Podes simular a aprovação instantânea da app MB WAY sem pagar nada:
                      </p>
                      <button
                        type="button"
                        onClick={handleSimulatePayment}
                        disabled={simulating}
                        className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow"
                      >
                        {simulating ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          '⚡ Simular Aprovação no Telemóvel'
                        )}
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          'Tens a certeza que queres fechar este ecrã? A tua encomenda continuará a aguardar pagamento.'
                        )
                      ) {
                        setPaymentStatus('idle');
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors underline"
                  >
                    Fechar e verificar mais tarde
                  </button>
                </div>
              )}

              {paymentStatus === 'paid' && (
                <div>
                  <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-400">
                    <CheckCircle2 size={36} />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">
                    Encomenda Confirmada com Sucesso!
                  </h3>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    Muito obrigado, <strong className="text-white">{studentName}</strong>! O teu
                    pagamento foi recebido e a tua sweat de tamanho{' '}
                    <strong className="text-cyan-300">{selectedSize}</strong> já está reservada para
                    produção.
                  </p>

                  <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left mb-6 space-y-2">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Nº de Encomenda:</span>
                      <button
                        type="button"
                        onClick={copyOrderId}
                        className="font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                      >
                        {activeOrderId}
                        {copiedOrderId ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Entrega:</span>
                      <span className="text-slate-200 font-medium">
                        {deliveryType === 'shipping' ? 'Envio CTT' : 'Gabinete NEEI (Penha)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Total Pago:</span>
                      <span className="text-emerald-400 font-bold">{totalPrice.toFixed(2)}€</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-cyan-950/50 border border-cyan-800/60 rounded-xl text-left mb-6">
                    <p className="text-xs text-cyan-200 leading-relaxed">
                      ✉️ <strong>Email enviado:</strong> Despachámos a confirmação com o recibo e
                      instruções detalhadas para <strong>{studentEmail}</strong>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStatus('idle');
                      setActiveOrderId(null);
                      // Reset form
                      setStudentName('');
                      setPhoneNumber('');
                      setNif('');
                      setShippingAddress('');
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all"
                  >
                    Concluir
                  </button>
                </div>
              )}

              {(paymentStatus === 'expired' || paymentStatus === 'failed') && (
                <div>
                  <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-5 text-red-400">
                    <X size={36} />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">
                    {paymentStatus === 'expired'
                      ? 'Tempo de Pagamento Expirado'
                      : 'Pagamento Não Concluído'}
                  </h3>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    O pedido de MB WAY expirou ou foi cancelado. Nenhuma cobrança foi efetuada.
                    Podes tentar novamente quando quiseres.
                  </p>

                  <button
                    type="button"
                    onClick={() => setPaymentStatus('idle')}
                    className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Guia de Medidas */}
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <Ruler className="text-cyan-500" size={22} />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Guia de Medidas (Centímetros)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Para teres a certeza do teu tamanho, estende uma sweat tua que te sirva bem numa
                mesa e mede o peito (de cava a cava) e o comprimento.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3">Tamanho</th>
                      <th className="py-2.5 px-3">Peito (A)</th>
                      <th className="py-2.5 px-3">Comprimento (B)</th>
                      <th className="py-2.5 px-3">Manga (C)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {Object.entries(SIZE_GUIDE).map(([sz, dims]) => (
                      <tr
                        key={sz}
                        className={
                          selectedSize === sz
                            ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-300 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }
                      >
                        <td className="py-2 px-3 flex items-center gap-1.5">
                          <span>{sz}</span>
                          {selectedSize === sz && (
                            <span className="text-[10px] bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                              Escolhido
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3">{dims.chest} cm</td>
                        <td className="py-2 px-3">{dims.length} cm</td>
                        <td className="py-2 px-3">{dims.sleeve} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Layout Principal em 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Coluna Esquerda: Vitrine do Artigo e Detalhes */}
          <div className="lg:col-span-6 space-y-6">
            {/* Fotografia / Mockup com Moldura Premium */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl group">
              <img
                src={campaign.image_url}
                alt={campaign.item_name}
                className="w-full aspect-square object-cover object-center group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-full">
                Algodão Premium 320g/m²
              </div>
            </div>

            {/* Descrição & Especificações */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm backdrop-blur-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                Especificações da Sweat
              </h3>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Composição:</strong> 80% Algodão cardado / 20% Poliéster de alta
                    gramagem (não encolhe na lavagem).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Design Exclusivo:</strong> Padrão de circuitos integrados com logótipo
                    oficial de Engenharia Informática UAlg.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 size={18} className="text-cyan-500 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Corte Unissexo Moderno:</strong> Bolso canguru frontal e capuz com
                    cordões reforçados.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Coluna Direita: Seleção de Opções & Checkout */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                    Merchandising Oficial LEI / MEI
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {campaign.item_name}
                  </h1>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Preço de Lançamento</span>
                  <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400">
                    {campaign.item_price.toFixed(2)}€
                  </span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-6">
                {/* 1. Seleção de Tamanho */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Tamanho Escolhido:{' '}
                      <span className="text-cyan-500 font-extrabold">{selectedSize}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                    >
                      <Ruler size={14} />
                      Guia de Medidas
                    </button>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {campaign.sizes_available.map((sz) => {
                      const isSelected = selectedSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`py-2.5 rounded-xl font-bold text-sm transition-all border ${isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 scale-102'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
                            }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Modalidade de Entrega */}
                <div>
                  <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5">
                    Modalidade de Entrega
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Levantamento no Gabinete */}
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-4 rounded-2xl border text-left transition-all ${deliveryType === 'pickup'
                        ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <MapPin
                            size={18}
                            className={
                              deliveryType === 'pickup' ? 'text-cyan-500' : 'text-slate-400'
                            }
                          />
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            Gabinete NEEI
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          Grátis (0€)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Recolha presencial no Campus da Penha ou Gambelas.
                      </p>
                    </button>

                    {/* Envio por CTT */}
                    <button
                      type="button"
                      onClick={() => setDeliveryType('shipping')}
                      className={`p-4 rounded-2xl border text-left transition-all ${deliveryType === 'shipping'
                        ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Truck
                            size={18}
                            className={
                              deliveryType === 'shipping' ? 'text-cyan-500' : 'text-slate-400'
                            }
                          />
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            Envio p/ Morada
                          </span>
                        </div>
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                          +{campaign.shipping_fee.toFixed(2)}€
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Envio por correio registado CTT para todo o país.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3. Dados do Estudante & Checkout */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Os teus Dados para Encomenda
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Ex: David Rodrigues"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Email para Confirmação *
                      </label>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="aXXXXX@ualg.pt"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Telemóvel MB WAY *
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="912 345 678"
                          className="w-full pl-3.5 pr-14 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-black text-[#309b42] bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                          MB WAY
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Receberás o push para aprovar neste número.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        NIF para Fatura (Opcional)
                      </label>
                      <input
                        type="text"
                        maxLength={9}
                        value={nif}
                        onChange={(e) => setNif(e.target.value)}
                        placeholder="Consumidor Final"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Campos de Morada se envio CTT */}
                  {deliveryType === 'shipping' && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Morada de Destino (Portugal)
                      </span>
                      <div>
                        <input
                          type="text"
                          required={deliveryType === 'shipping'}
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Rua, Número, Andar / Bloco"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          required={deliveryType === 'shipping'}
                          value={shippingPostalCode}
                          onChange={(e) => setShippingPostalCode(e.target.value)}
                          placeholder="Código Postal (ex: 8000-117)"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          required={deliveryType === 'shipping'}
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          placeholder="Localidade / Cidade"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Mensagem de Erro de validação */}
                {formError && (
                  <div className="p-3 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Resumo Final & Botão de Pagamento */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sm mb-1.5 text-slate-600 dark:text-slate-400">
                    <span>Sweat Oficial (Tam. {selectedSize}):</span>
                    <span>{campaign.item_price.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mb-3 text-slate-600 dark:text-slate-400">
                    <span>Portes de Envio:</span>
                    <span>
                      {deliveryType === 'shipping'
                        ? `${campaign.shipping_fee.toFixed(2)}€`
                        : '0.00€ (Gabinete)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-black text-slate-900 dark:text-white mb-5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Total a Pagar:</span>
                    <span className="text-2xl text-cyan-600 dark:text-cyan-400 font-extrabold">
                      {totalPrice.toFixed(2)}€
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        <span>A preparar pedido MB WAY...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone size={20} />
                        <span>Pagar com MB WAY ({totalPrice.toFixed(2)}€)</span>
                      </>
                    )}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>Pagamento Seguro certificado em parceria com a AAUAlg</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;

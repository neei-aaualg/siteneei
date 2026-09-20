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
  Lock,
  Package,
  Layers,
  Tag,
  Filter,
} from 'lucide-react';
import { ShopCampaign, SweatSize, DeliveryType, MerchProduct } from '../types/shop';
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
  const [sweatsAvailable, setSweatsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro de categoria no Merch
  const [activeCategory, setActiveCategory] = useState<'all' | 'clothing' | 'accessories'>('all');

  // Modal de Checkout / Encomenda
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

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

  // Atualiza o título da página
  useEffect(() => {
    document.title = 'Merch Oficial · NEEI AAUAlg';
  }, []);

  // Carrega dados da campanha da loja
  useEffect(() => {
    let mounted = true;
    fetchShopCampaign()
      .then((data) => {
        if (mounted) {
          setCampaign(data.campaign);
          setIsSandbox(data.isSandbox);
          // Determina disponibilidade pelas variáveis de ambiente / status
          const isAvail = data.sweatsAvailable !== false && data.campaign?.is_available !== false;
          setSweatsAvailable(isAvail);

          if (data.campaign?.sizes_available?.length > 0) {
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

  // Lista de produtos suportados no catálogo de Merch
  const products: MerchProduct[] = useMemo(() => {
    if (!campaign) return [];

    return [
      {
        id: 'sweat-ei-2026',
        name: campaign.item_name || 'Sweat Oficial Engenharia Informática 2026',
        category: 'clothing',
        price: campaign.item_price,
        imageUrl: campaign.image_url || '/assets/sweat_mockup.jpg',
        badge: sweatsAvailable ? 'Pré-encomenda' : 'Indisponível',
        description:
          'A sweat oficial do curso de Engenharia Informática da UAlg. Produzida em algodão premium de 320g/m² cardado, com corte unissexo moderno, bolso frontal canguru e bordado exclusivo.',
        features: [
          '80% Algodão cardado / 20% Poliéster (320g/m²)',
          'Bordado de alta definição NEEI · Engenharia Informática',
          'Corte unissexo confortável com cordões reforçados',
          'Recolha no Campus de Gambelas ou Envio CTT',
        ],
        available: sweatsAvailable,
        isPreorder: true,
        sizes: campaign.sizes_available,
        allowShipping: campaign.allow_shipping,
        shippingFee: campaign.shipping_fee,
        pickupLocation: campaign.pickup_location,
      },
    ];
  }, [campaign, sweatsAvailable]);

  // Produtos filtrados por categoria
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products;
    if (activeCategory === 'clothing') return products.filter((p) => p.category === 'clothing');
    return [];
  }, [products, activeCategory]);

  // Cálculo de dias restantes até ao fim da campanha
  const daysLeft = useMemo(() => {
    if (!campaign?.deadline_date) return null;
    const deadline = new Date(campaign.deadline_date);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [campaign?.deadline_date]);

  // Cálculo do total da encomenda
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

    if (!sweatsAvailable) {
      setFormError('As encomendas das sweats encontram-se temporariamente encerradas.');
      return;
    }

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
          A carregar a Coleção de Merch do NEEI...
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
          Merch Temporariamente Indisponível
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error || 'Não existe nenhum artigo de merchandising ativo de momento.'}
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
        {/* Header Hero da Página de Merch */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles size={14} className="text-cyan-500" />
            <span>Merchandise Oficial · NEEI AAUAlg</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
            Merch Oficial
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Veste a camisola do curso e apoia as atividades e projetos dos estudantes de Engenharia
            Informática da Universidade do Algarve.
          </p>

          {/* Filtros de Categoria */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
              }`}
            >
              Todos os Artigos ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('clothing')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === 'clothing'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
              }`}
            >
              Vestuário ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('accessories')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === 'accessories'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-500/50'
              }`}
            >
              Acessórios (Brevemente)
            </button>
          </div>
        </div>

        {/* Alerta Informativo quando as Sweats estão Indisponíveis (SWEATS_AVAILABLE=false) */}
        {!sweatsAvailable && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start sm:items-center gap-3.5 shadow-sm">
            <AlertCircle size={22} className="text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong className="font-bold">Aviso de Disponibilidade:</strong> A pré-encomenda das
              sweats encontra-se temporariamente indisponível para compra de momento. Acompanha o
              Instagram{' '}
              <a
                href="https://instagram.com/neeiualg"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-amber-900 dark:text-amber-100"
              >
                @neeiualg
              </a>{' '}
              para seres avisado da reabertura de encomendas!
            </div>
          </div>
        )}

        {/* Grelha de Artigos do Merch (Multi-Produto) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white dark:bg-[#0c1724] border border-slate-200 dark:border-cyan-950/80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all flex flex-col group"
            >
              {/* Imagem do Produto com Badge de Estado */}
              <div className="relative aspect-square overflow-hidden bg-slate-900">
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md border ${
                      prod.available
                        ? 'bg-emerald-500/90 text-white border-emerald-400'
                        : 'bg-amber-500/90 text-slate-950 border-amber-400'
                    }`}
                  >
                    {prod.badge}
                  </span>
                  {prod.available && daysLeft !== null && daysLeft > 0 && (
                    <span className="text-[11px] font-semibold bg-slate-950/80 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                      {daysLeft} dias restantes
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-white font-black text-lg px-3.5 py-1 rounded-xl">
                  {prod.price.toFixed(2)}€
                </div>
              </div>

              {/* Informações e Detalhes */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span className="uppercase tracking-wider font-bold text-cyan-600 dark:text-cyan-400">
                      Vestuário Oficial
                    </span>
                    <span>Tamanhos XS ao 3XL</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {prod.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed line-clamp-3">
                    {prod.description}
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {prod.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-cyan-500 flex-shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botões de Ação */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
                  {prod.available ? (
                    <button
                      type="button"
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
                    >
                      <ShoppingBag size={18} />
                      <span>Pré-encomendar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
                    >
                      <Lock size={16} />
                      <span>Indisponível de momento</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    title="Ver Guia de Tamanhos"
                  >
                    <Ruler size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Card Teaser: Novos Artigos a Caminho */}
          <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center bg-slate-100/50 dark:bg-slate-900/20">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-4">
              <Package size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Mais Artigos em Breve
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              T-shirts de eventos, autocolantes holográficos para portátil e lanyards exclusivos em
              preparação para as próximas edições de convívios e workshops do NEEI.
            </p>
            <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400">
              <span>Novidades em breve</span>
              <ChevronRight size={14} />
            </div>
          </div>
        </div>

        {/* Modal / Ecrã de Checkout (Pré-encomenda da Sweat) */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#0c1724] border border-slate-200 dark:border-cyan-900/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
              {/* Botão Fechar */}
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Pré-encomenda da Sweat Oficial
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preenche os teus dados para concluir o pedido via MB WAY.
                  </p>
                </div>
              </div>

              {!sweatsAvailable ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-sm">
                  As encomendas das sweats estão temporariamente suspensas de momento.
                </div>
              ) : (
                <form onSubmit={handleCheckout} className="space-y-6">
                  {/* 1. Seleção de Tamanho */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Tamanho:{' '}
                        <span className="text-cyan-600 dark:text-cyan-400 font-extrabold">
                          {selectedSize}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="inline-flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        <Ruler size={13} />
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
                            className={`py-2 px-1 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-600 text-white border-cyan-500 shadow-md scale-102'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/60'
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
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200 block mb-2">
                      Como queres receber a tua sweat?
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Opção 1: Levantamento no Gabinete (Gambelas) */}
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          deliveryType === 'pickup'
                            ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/50'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                            <MapPin size={16} className="text-cyan-500" />
                            <span>Gabinete NEEI</span>
                          </div>
                          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            Grátis
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Recolha na Sala 0.18, Edifício 1, Campus de Gambelas.
                        </p>
                      </button>

                      {/* Opção 2: Envio CTT Nacional */}
                      <button
                        type="button"
                        onClick={() => setDeliveryType('shipping')}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          deliveryType === 'shipping'
                            ? 'bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500/50'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                            <Truck size={16} className="text-cyan-500" />
                            <span>Envio CTT Nacional</span>
                          </div>
                          <span className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full">
                            +{campaign.shipping_fee.toFixed(2)}€
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Recebe em qualquer morada de Portugal Continental ou Ilhas.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Campos de Morada se Envio por Correio */}
                  {deliveryType === 'shipping' && (
                    <div className="p-4 rounded-2xl bg-cyan-50/40 dark:bg-slate-900/80 border border-cyan-200/60 dark:border-cyan-950/60 space-y-3 animate-in fade-in duration-150">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Morada de Envio *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Ex: Rua Dr. António José de Almeida, Nº 42, 2º Dto"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Código Postal *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingPostalCode}
                            onChange={(e) => setShippingPostalCode(e.target.value)}
                            placeholder="8000-000"
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Localidade / Cidade *
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingCity}
                            onChange={(e) => setShippingCity(e.target.value)}
                            placeholder="Faro"
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. Dados Pessoais do Aluno */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                          placeholder="Teu nome completo"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Email Institucional ou Pessoal *
                        </label>
                        <input
                          type="email"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          placeholder="aluno@ualg.pt"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Telemóvel (MB WAY) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="912 345 678"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Enviaremos o pedido direto para este número.
                        </span>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          NIF (Opcional)
                        </label>
                        <input
                          type="text"
                          value={nif}
                          onChange={(e) => setNif(e.target.value)}
                          placeholder="Consumidor Final se vazio"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Resumo de Valores */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Sweat Oficial ({selectedSize})</span>
                      <span>{campaign.item_price.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>
                        Portes:{' '}
                        {deliveryType === 'shipping'
                          ? 'Envio CTT Nacional'
                          : 'Levantamento no Gabinete'}
                      </span>
                      <span>
                        {deliveryType === 'shipping'
                          ? `${campaign.shipping_fee.toFixed(2)}€`
                          : 'Grátis'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                      <span>Total a pagar via MB WAY</span>
                      <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                        {totalPrice.toFixed(2)}€
                      </span>
                    </div>
                  </div>

                  {formError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Botão de Submissão */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>A processar encomenda...</span>
                      </>
                    ) : (
                      <>
                        <Smartphone size={18} />
                        <span>Pagar {totalPrice.toFixed(2)}€ com MB WAY</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal Guia de Medidas */}
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setIsSizeGuideOpen(false)}
                className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Ruler className="text-cyan-500" size={22} />
                Guia de Tamanhos (cm)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Medidas aproximadas com a peça esticada numa superfície plana.
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
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

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
                        className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
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
                        setIsCheckoutOpen(false);
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-white transition-colors underline cursor-pointer"
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
                        className="font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        {activeOrderId}
                        {copiedOrderId ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Email de Confirmação:</span>
                      <span className="text-slate-200 font-medium">{studentEmail}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Modalidade de Entrega:</span>
                      <span className="text-slate-200 font-medium">
                        {deliveryType === 'shipping'
                          ? 'Envio CTT Nacional'
                          : 'Levantamento no Gabinete NEEI'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-cyan-950/50 border border-cyan-800/60 rounded-xl text-left text-xs text-cyan-300 mb-6 flex items-start gap-2">
                    <Info size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Enviámos um email com todos os detalhes e instruções para{' '}
                      <strong>{studentEmail}</strong>. Assim que a sweat estiver pronta na fábrica,
                      avisaremos por email!
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStatus('idle');
                      setIsCheckoutOpen(false);
                      setActiveOrderId(null);
                    }}
                    className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
                  >
                    Concluir e Voltar ao Merch
                  </button>
                </div>
              )}

              {paymentStatus === 'expired' && (
                <div>
                  <div className="w-16 h-16 bg-amber-500/20 border-2 border-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 text-amber-400">
                    <Clock size={36} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Tempo Limite Expirado</h3>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    O pedido de pagamento MB WAY de 5 minutos expirou sem aprovação. Não te
                    preocupes, podes tentar de novo!
                  </p>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('idle')}
                    className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div>
                  <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-5 text-red-400">
                    <AlertCircle size={36} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Pagamento Não Concluído</h3>
                  <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                    A transação foi recusada ou cancelada na aplicação MB WAY.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('idle')}
                    className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm transition-all shadow-md cursor-pointer"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Merch = Shop;
export default Shop;

import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  X,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  AlertCircle,
  Copy,
  Check,
  Share2,
  Mail,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Factory,
} from 'lucide-react';
import { OrderStatusResponse, OrderStatus, DeliveryType } from '../types/shop';
import { fetchOrderStatus } from '../services/shopService';
import { formatDateTimeDDMMAAAA } from '../utils/dateHelpers';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = '',
}) => {
  const [orderQuery, setOrderQuery] = useState(initialOrderId);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Carrega automaticamente se for fornecido um initialOrderId
  useEffect(() => {
    if (initialOrderId && initialOrderId.trim()) {
      setOrderQuery(initialOrderId.trim());
      handleTrack(initialOrderId.trim());
    } else if (isOpen && !orderQuery) {
      setOrder(null);
      setError(null);
    }
  }, [initialOrderId, isOpen]);

  // Fecha com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleTrack = async (idToSearch?: string) => {
    const target = (idToSearch || orderQuery).trim().replace(/^#/, '');
    if (!target) {
      setError('Por favor introduz o número da tua encomenda (ex: SW-2026-1234).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchOrderStatus(target);
      setOrder(data);
    } catch (err: any) {
      setOrder(null);
      setError(
        err.message ||
        'Não encontramos nenhuma encomenda com este código. Confirma o email de confirmação ou tenta novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack();
  };

  const handleCopyId = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyShareLink = () => {
    if (!order) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/merch?track=${encodeURIComponent(order.orderId)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  // Determina a etapa numérica (1 a 4) do progresso
  // 1: Confirmada / Paga
  // 2: Em Produção na Fábrica
  // 3: Pronta para Levantamento (Gabinete) OU Enviada via CTT
  // 4: Entregue / Concluída
  const getProgressStepIndex = (status: OrderStatus, paymentStatus: string): number => {
    if (paymentStatus === 'pending' || status === 'pending_payment') {
      return 0; // Aguardar pagamento
    }
    switch (status) {
      case 'confirmed':
        return 1;
      case 'in_production':
        return 2;
      case 'ready_for_pickup':
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      case 'test':
        return 1;
      default:
        return 1;
    }
  };

  const currentStep = order ? getProgressStepIndex(order.orderStatus, order.paymentStatus) : 0;

  // Configuração dos 4 passos da linha temporal
  const getTimelineSteps = (deliveryType: DeliveryType) => {
    return [
      {
        index: 1,
        title: 'Pagamento & Confirmação',
        desc: 'Pagamento confirmado e encomenda reservada no sistema.',
        icon: CheckCircle2,
      },
      {
        index: 2,
        title: 'Em Produção',
        desc: 'Produção da encomenda em curso.',
        icon: Factory,
      },
      {
        index: 3,
        title:
          deliveryType === 'shipping'
            ? 'Enviada via CTT Nacional'
            : 'Pronta p/ Levantamento no Gabinete',
        desc:
          deliveryType === 'shipping'
            ? 'Expedida pelos CTT para a tua morada.'
            : 'Disponível na Sala 0.18, Edifício 1, Campus de Gambelas.',
        icon: deliveryType === 'shipping' ? Truck : MapPin,
      },
      {
        index: 4,
        title: 'Entregue',
        desc: 'Processo concluído com sucesso. Aproveita!',
        icon: Package,
      },
    ];
  };

  const timelineSteps = order ? getTimelineSteps(order.deliveryType) : [];

  const getStatusBadge = (status: OrderStatus, paymentStatus: string) => {
    if (paymentStatus === 'pending' || status === 'pending_payment') {
      return {
        label: 'Aguardar Pagamento',
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
        dot: 'bg-amber-400',
      };
    }
    switch (status) {
      case 'confirmed':
        return {
          label: 'Confirmada / A aguardar lote têxtil',
          bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-300',
          dot: 'bg-cyan-400',
        };
      case 'in_production':
        return {
          label: 'Em Produção (Fábrica)',
          bg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-300',
          dot: 'bg-indigo-400',
        };
      case 'ready_for_pickup':
        return {
          label: 'Pronta p/ Levantamento (Gabinete)',
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300',
          dot: 'bg-emerald-400',
        };
      case 'shipped':
        return {
          label: 'Enviada via CTT Nacional',
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-300',
          dot: 'bg-amber-400',
        };
      case 'delivered':
        return {
          label: 'Entregue / Concluída',
          bg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'test':
        return {
          label: '🧪 Encomenda de Teste (Admin)',
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-600 dark:text-purple-300',
          dot: 'bg-purple-400',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-500/15 border-slate-500/30 text-slate-600 dark:text-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const badge = order ? getStatusBadge(order.orderStatus, order.paymentStatus) : null;

  return (
    <div
      id="order-tracker-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#0c1724] border border-slate-200 dark:border-cyan-900/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tracker-title"
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar rastreio"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-start gap-3.5 mb-6 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Package size={22} />
          </div>
          <div>
            <h2 id="tracker-title" className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Seguir Encomenda
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Acompanha em tempo real o estado da tua encomenda.
            </p>
          </div>
        </div>

        {/* Barra de Pesquisa por ID */}
        <form onSubmit={handleFormSubmit} className="mb-6">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                id="order-tracker-input"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="Introduz o código (ex: SW-2026-1234)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
              <Search size={17} className="absolute left-3.5 top-3.5 text-slate-400" />
            </div>

            <button
              type="submit"
              disabled={loading}
              id="order-tracker-submit"
              className="py-3 px-6 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>A pesquisar...</span>
                </>
              ) : (
                <>
                  <span>Consultar Estado</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Mensagem de Erro */}
        {error && (
          <div
            id="order-tracker-error"
            className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-150"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <div className="leading-relaxed">
              <strong className="font-semibold block mb-0.5">Encomenda não localizada</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Estado da Encomenda Encontrada */}
        {order && (
          <div id="order-tracker-result" className="space-y-6 animate-in fade-in duration-200">
            {/* Cartão de Resumo do Cabeçalho */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Encomenda:
                  </span>
                  <span className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
                    {order.orderId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1 rounded-md text-slate-400 hover:text-cyan-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Copiar referência"
                  >
                    {copiedId ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>

                {badge && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${badge.bg}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
                    <span>{badge.label}</span>
                  </span>
                )}
              </div>

              {/* Informações Rápidas em Grelha */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Comprador</span>
                  <strong className="text-slate-800 dark:text-slate-200 truncate block">
                    {order.studentName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Tamanho / Cor</span>
                  <strong className="text-slate-800 dark:text-slate-200 block">
                    {order.size} · {order.color || 'Preto'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Entrega em</span>
                  <strong className="text-slate-800 dark:text-slate-200 block">
                    {order.deliveryType === 'shipping' ? 'Envio CTT' : 'Gabinete NEEI'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Total Pago</span>
                  <strong className="text-cyan-600 dark:text-cyan-400 font-bold block">
                    {order.totalAmount.toFixed(2)}€
                  </strong>
                </div>
              </div>
            </div>

            {/* Linha Temporal Visual (Stepper) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-5 flex items-center justify-between">
                <span>Progresso da Produção e Entrega</span>
                {order.paidAt && (
                  <span className="normal-case font-normal text-[11px] text-slate-400">
                    Confirmada a {formatDateTimeDDMMAAAA(order.paidAt)}
                  </span>
                )}
              </h4>

              <div className="relative space-y-6">
                {timelineSteps.map((step, idx) => {
                  const isDone = currentStep > step.index;
                  const isActive = currentStep === step.index;
                  const isPending = currentStep < step.index;
                  const isLast = idx === timelineSteps.length - 1;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.index} className="relative flex items-start gap-4 group">
                      {/* Linha de Conexão Vertical */}
                      {!isLast && (
                        <span
                          className={`absolute left-4 top-9 w-0.5 -ml-px h-[calc(100%-12px)] transition-colors ${isDone
                            ? 'bg-emerald-500'
                            : isActive
                              ? 'bg-gradient-to-b from-cyan-500 to-slate-200 dark:to-slate-800'
                              : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          aria-hidden="true"
                        />
                      )}

                      {/* Ícone de Estado */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-all z-10 ${isDone
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                          : isActive
                            ? 'bg-cyan-600 text-white ring-4 ring-cyan-500/20 shadow-md shadow-cyan-600/30'
                            : 'bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-400'
                          }`}
                      >
                        {isDone ? (
                          <Check size={15} className="stroke-[3]" />
                        ) : (
                          <StepIcon size={14} className={isActive ? 'animate-pulse' : ''} />
                        )}
                      </div>

                      {/* Descrição do Passo */}
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${isDone || isActive
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400 dark:text-slate-500'
                              }`}
                          >
                            {step.title}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                              Fase Atual
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ações Rápidas: Partilhar Link e Suporte */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 bg-white dark:bg-slate-900/60 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check size={14} className="text-emerald-500" />
                    <span>Link de Rastreio Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} className="text-cyan-500" />
                    <span>Copiar Link de Rastreio</span>
                  </>
                )}
              </button>

              <a
                href={`mailto:neei@aaualg.pt?subject=${encodeURIComponent(
                  `Dúvida sobre Encomenda ${order.orderId}`
                )}`}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 bg-white dark:bg-slate-900/60 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
              >
                <Mail size={14} className="text-cyan-500" />
                <span>Contactar NEEI via e-mail</span>
              </a>
            </div>
          </div>
        )}

        {/* Dica Inicial quando não há pesquisa ativa */}
        {!order && !loading && !error && (
          <div className="py-8 text-center text-slate-400 space-y-2">
            <Package size={36} className="mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-xs max-w-sm mx-auto">
              Introduz o identificador da encomenda recebido no teu email de confirmação (ex:{' '}
              <span className="font-mono text-cyan-600 dark:text-cyan-400">SW-2026-XXXX</span>) para
              acompanhar os passos de confecção e recolha.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

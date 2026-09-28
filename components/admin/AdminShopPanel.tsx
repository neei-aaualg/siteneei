import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Download,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Smartphone,
  ChevronDown,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  FlaskConical,
  Copy,
  Check,
  Eye,
  Plus,
  Tag,
  X,
  User,
  CreditCard,
} from 'lucide-react';
import {
  ShopOrder,
  ShopSummaryStats,
  OrderStatus,
  SweatSize,
  DeliveryType,
  AdminCreateOrderPayload,
} from '../../types/shop';
import {
  fetchAdminShopOrders,
  fetchAdminShopStats,
  updateAdminOrderStatus,
  updateMultipleAdminOrderStatus,
  resendOrderEmail,
  fetchShopCampaign,
  createAdminManualOrder,
} from '../../services/shopService';
import { formatDateTimeDDMMAAAA } from '../../utils/dateHelpers';
import { Portal } from '../Portal';
import { getPortugalDistricts, getCountiesForDistrict } from '../../constants/portugalDistricts';

interface AdminShopPanelProps {
  token: string;
  showFeedback: (id: string, message: string) => void;
}

export const AdminShopPanel: React.FC<AdminShopPanelProps> = ({ token, showFeedback }) => {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [stats, setStats] = useState<ShopSummaryStats | null>(null);
  const [sweatsAvailable, setSweatsAvailable] = useState<boolean>(true);
  const [showTestShop, setShowTestShop] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seleção Múltipla / Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('confirmed');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'admin' | 'web'>('all');

  // Modal de Criação Manual de Encomenda
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const initialManualForm = {
    student_name: '',
    student_email: '',
    phone_number: '',
    nif: '',
    size: 'M' as SweatSize,
    color: 'Preto',
    delivery_type: 'pickup' as DeliveryType,
    shipping_address: '',
    shipping_postal_code: '',
    shipping_district: 'Faro',
    shipping_county: 'Faro',
    item_price: 20,
    shipping_fee: 4.5,
    payment_status: 'paid' as 'paid' | 'pending',
    order_status: 'confirmed' as OrderStatus,
    send_email: true,
    admin_notes: '',
  };

  const [manualForm, setManualForm] = useState(initialManualForm);

  const districtsList = useMemo(() => getPortugalDistricts(), []);
  const manualCounties = useMemo(
    () => getCountiesForDistrict(manualForm.shipping_district),
    [manualForm.shipping_district]
  );

  // Estados de ação
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersData, statsData, campaignData] = await Promise.all([
        fetchAdminShopOrders(token),
        fetchAdminShopStats(token),
        fetchShopCampaign({ adminPreview: false }).catch(() => null),
      ]);
      setOrders(ordersData.orders || []);
      setStats(statsData);
      if (campaignData) {
        setSweatsAvailable(Boolean(campaignData.sweatsAvailable));
        if (campaignData.showTestShop !== undefined) {
          setShowTestShop(Boolean(campaignData.showTestShop));
        }
        if (campaignData.item_price) {
          setManualForm((prev) => ({
            ...prev,
            item_price: campaignData.item_price,
            shipping_fee: campaignData.shipping_fee || 4.5,
          }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar dados da loja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const previewUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/merch?admin_preview=1&token=${encodeURIComponent(token)}`
    : `/merch?admin_preview=1`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(previewUrl);
    setCopiedLink(true);
    showFeedback('copy-preview-link', 'Link de teste copiado para a área de transferência!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const [showQrCode, setShowQrCode] = useState(false);

  // Encomendas filtradas
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter;
      const matchesStatus = orderStatusFilter === 'all' || o.order_status === orderStatusFilter;
      const matchesSize = sizeFilter === 'all' || o.size === sizeFilter;
      const matchesDelivery = deliveryFilter === 'all' || o.delivery_type === deliveryFilter;
      const matchesOrigin =
        originFilter === 'all' ||
        (originFilter === 'admin' ? Boolean(o.is_admin_created) : !o.is_admin_created);

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.student_name.toLowerCase().includes(q) ||
        o.student_email.toLowerCase().includes(q) ||
        o.phone_number.includes(q) ||
        o.id.toLowerCase().includes(q) ||
        Boolean(o.nif && o.nif.includes(q)) ||
        Boolean(o.admin_notes && o.admin_notes.toLowerCase().includes(q));

      return (
        matchesPayment &&
        matchesStatus &&
        matchesSize &&
        matchesDelivery &&
        matchesOrigin &&
        matchesSearch
      );
    });
  }, [orders, search, paymentFilter, orderStatusFilter, sizeFilter, deliveryFilter, originFilter]);

  // Alterar estado operacional da encomenda
  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await updateAdminOrderStatus(token, orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: newStatus } : o))
      );
      showFeedback(orderId, 'Estado operacional da encomenda atualizado!');
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar estado da encomenda.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Reenviar email de confirmação
  const handleResendEmail = async (orderId: string) => {
    try {
      setResendingEmailId(orderId);
      const res = await resendOrderEmail(token, orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, email_sent: true } : o)));
      showFeedback(orderId, res.message || 'Email de confirmação reenviado!');
    } catch (err: any) {
      alert(err.message || 'Falha ao reenviar email.');
    } finally {
      setResendingEmailId(null);
    }
  };

  // Descarregar CSV para a fábrica
  const handleDownloadCsv = () => {
    const url = `/api/admin/shop/export-factory`;
    // Dispara o download com o token de autorização
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao gerar CSV');
        return res.blob();
      })
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `encomendas_sweats_fabrica_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showFeedback('csv-exported', 'Ficheiro CSV descarregado com sucesso!');
      })
      .catch((err) => {
        alert(err.message || 'Erro ao descarregar ficheiro CSV.');
      });
  };

  // Seleção e Alteração em Lote
  const allFilteredSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  const someFilteredSelected =
    filteredOrders.some((o) => selectedOrderIds.includes(o.id)) && !allFilteredSelected;

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredOrders.map((o) => o.id));
      setSelectedOrderIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const newSelected = new Set(selectedOrderIds);
      filteredOrders.forEach((o) => newSelected.add(o.id));
      setSelectedOrderIds(Array.from(newSelected));
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedOrderIds.length === 0) return;
    try {
      setIsBulkUpdating(true);
      await updateMultipleAdminOrderStatus(token, selectedOrderIds, bulkStatus);
      setOrders((prev) =>
        prev.map((o) =>
          selectedOrderIds.includes(o.id) ? { ...o, order_status: bulkStatus } : o
        )
      );
      showFeedback(
        'bulk-update-success',
        `${selectedOrderIds.length} encomenda(s) atualizada(s) para "${getOrderStatusLabel(bulkStatus)}"!`
      );
      setSelectedOrderIds([]);
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar encomendas em lote.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Status helper
  const getOrderStatusLabel = (st: OrderStatus) => {
    switch (st) {
      case 'pending_payment':
        return 'Pendente Pagamento';
      case 'confirmed':
        return 'Confirmada / A Aguardar Fabrico';
      case 'in_production':
        return 'Em Produção (Fábrica)';
      case 'ready_for_pickup':
        return 'Pronta p/ Levantamento';
      case 'shipped':
        return 'Enviada via CTT';
      case 'delivered':
        return 'Entregue / Concluída';
      case 'test':
        return 'Teste';
      default:
        return st;
    }
  };

  // Classes visuais harmoniosas para o selector de estado operacional (suporta light e dark mode sem bugs de contraste)
  const getOrderStatusSelectClasses = (status: OrderStatus) => {
    switch (status) {
      case 'test':
        return 'border-purple-300 dark:border-purple-600/60 bg-purple-100/90 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-bold focus:ring-purple-500';
      case 'confirmed':
        return 'border-cyan-300 dark:border-cyan-800/60 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-900 dark:text-cyan-200 font-semibold focus:ring-cyan-500';
      case 'in_production':
        return 'border-indigo-300 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold focus:ring-indigo-500';
      case 'ready_for_pickup':
        return 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold focus:ring-emerald-500';
      case 'shipped':
        return 'border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold focus:ring-amber-500';
      case 'delivered':
        return 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 font-semibold focus:ring-slate-500';
      case 'pending_payment':
        return 'border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-medium focus:ring-amber-500';
      default:
        return 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
    }
  };

  // Handlers para criação manual de encomendas
  const handleManualNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, '');
    setManualForm((prev) => ({ ...prev, student_name: clean }));
  };

  const handleManualPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setManualForm((prev) => ({ ...prev, phone_number: digits }));
  };

  const handleManualNifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setManualForm((prev) => ({ ...prev, nif: digits }));
  };

  const handleManualPostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
    if (digits.length <= 4) {
      setManualForm((prev) => ({ ...prev, shipping_postal_code: digits }));
    } else {
      setManualForm((prev) => ({
        ...prev,
        shipping_postal_code: `${digits.slice(0, 4)}-${digits.slice(4)}`,
      }));
    }
  };

  const handleManualDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDist = e.target.value;
    const counties = getCountiesForDistrict(newDist);
    setManualForm((prev) => ({
      ...prev,
      shipping_district: newDist,
      shipping_county: counties.length > 0 ? counties[0] : '',
    }));
  };

  const handleCreateManualOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const name = manualForm.student_name.trim();
    if (!name || name.length < 3) {
      setCreateError('Por favor insere o nome completo do aluno (mínimo 3 caracteres).');
      return;
    }

    const email = manualForm.student_email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCreateError('Por favor insere um endereço de email válido.');
      return;
    }

    const phone = manualForm.phone_number.replace(/\D/g, '');
    if (phone.length !== 9) {
      setCreateError('O telemóvel deve ter exatamente 9 dígitos portugueses.');
      return;
    }

    if (manualForm.delivery_type === 'shipping') {
      if (!manualForm.shipping_address.trim() || manualForm.shipping_address.trim().length < 5) {
        setCreateError('Por favor insere uma morada de envio completa.');
        return;
      }
      if (!/^\d{4}-\d{3}$/.test(manualForm.shipping_postal_code.trim())) {
        setCreateError('O código postal deve ter o formato 0000-000.');
        return;
      }
    }

    setCreatingOrder(true);
    try {
      const fullLocality =
        manualForm.delivery_type === 'shipping'
          ? `${manualForm.shipping_county}, ${manualForm.shipping_district}`
          : undefined;

      const payload: AdminCreateOrderPayload = {
        student_name: name,
        student_email: email,
        phone_number: phone,
        nif: manualForm.nif.trim() || undefined,
        size: manualForm.size,
        color: manualForm.color || 'Preto',
        delivery_type: manualForm.delivery_type,
        shipping_address:
          manualForm.delivery_type === 'shipping' ? manualForm.shipping_address.trim() : undefined,
        shipping_postal_code:
          manualForm.delivery_type === 'shipping'
            ? manualForm.shipping_postal_code.trim()
            : undefined,
        shipping_city: fullLocality,
        item_price: Number(manualForm.item_price) || 20,
        shipping_fee:
          manualForm.delivery_type === 'shipping' ? Number(manualForm.shipping_fee) || 4.5 : 0,
        payment_status: manualForm.payment_status,
        order_status: manualForm.order_status,
        send_email: manualForm.send_email,
        admin_notes: manualForm.admin_notes.trim() || undefined,
      };

      const res = await createAdminManualOrder(token, payload);
      if (res?.order) {
        setOrders((prev) => [res.order, ...prev]);
      }
      showFeedback('manual-order-created', `Encomenda ${res.order?.id || ''} registada com sucesso!`);
      setIsCreateModalOpen(false);
      setManualForm(initialManualForm);
      fetchAdminShopStats(token).then((st) => setStats(st)).catch(() => {});
    } catch (err: any) {
      setCreateError(err.message || 'Falha ao criar encomenda manual.');
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Secção de Modo de Teste da Loja (Checkout Real a 0.50€) - Dependente de SHOW_TEST_SHOP */}
      {showTestShop && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-900/60 border border-cyan-500/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/30">
                <FlaskConical size={13} />
                Modo de Teste da Loja
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-[11px] font-bold border border-cyan-500/20">
                Preço Especial: 0.50€
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Permite testar o fluxo de compra e pagamentos reais (MB WAY, Cartões, Apple Pay) com valor reduzido para apenas <strong>0.50€</strong> (mínimo Stripe) sem limitações de sandbox. Ativado via <code>SHOW_TEST_SHOP=true</code>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <Eye size={14} />
              <span>Abrir Loja de Teste (0.50€)</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar link com token para colar no telemóvel"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link p/ Tele'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrCode(!showQrCode)}
              className="px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Mostrar QR Code para ler com a câmara do telemóvel"
            >
              <Smartphone size={14} className="text-cyan-400" />
              <span>{showQrCode ? 'Ocultar QR' : 'QR Telemóvel'}</span>
            </button>
          </div>
        </div>
      )}

      {/* QR Code Desdobrável para Testes Rápidos no Telemóvel */}
      {showTestShop && showQrCode && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-cyan-500/30 max-w-sm mx-auto text-center space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <h4 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
            <Smartphone size={16} className="text-cyan-400" />
            Aponta a câmara do telemóvel
          </h4>
          <p className="text-xs text-slate-400">
            Abre a loja no teu telemóvel com sessão admin ativa e preço de 0.50€:
          </p>
          <div className="p-3 bg-white rounded-2xl inline-block shadow-lg mx-auto">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                previewUrl
              )}`}
              alt="QR Code de Teste"
              className="w-44 h-44 mx-auto"
            />
          </div>
          <p className="text-[11px] text-slate-400 font-mono break-all px-2">
            {previewUrl}
          </p>
        </div>
      )}

      {/* 1. Cartões de Resumo e Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faturado */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-text-200 dark:text-slate-400">
              Total Faturado (Pago)
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              €
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats ? `${stats.totalRevenue.toFixed(2)}€` : '0.00€'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Valor bruto recebido
          </span>
        </div>

        {/* Total Sweats Pagas */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-text-200 dark:text-slate-400">
              Sweats Confirmadas
            </span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <ShoppingBag size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-2">
            {stats ? stats.totalPaidOrders : 0}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {stats?.totalPaidOrders || 0} encomendas pagas e confirmadas
          </span>
        </div>

        {/* Levantamento Gabinete */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-text-200 dark:text-slate-400">
              Levantamento Gabinete
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MapPin size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {stats?.pickupCount || 0}
          </div>
        </div>

        {/* Envio CTT */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-text-200 dark:text-slate-400">
              Envio CTT Nacional
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Truck size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {stats?.shippingCount || 0}
          </div>
        </div>
      </div>

      {/* 2. Distribuição por Tamanhos para a Fábrica & Botão de Exportação CSV */}
      <div className="bg-white dark:bg-[#0c1724] p-6 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="text-cyan-500" size={18} />
              Contagem de Produção para a Fábrica
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Totais consolidados de sweats pagas e prontas a encomendar ao fornecedor.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto cursor-pointer"
          >
            <Download size={16} />
            <span>Exportar para CSV</span>
          </button>
        </div>

        {/* Tabela de Tamanhos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-4">
          {(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as SweatSize[]).map((sz) => {
            const count = stats?.sizeCounts?.[sz] || 0;
            return (
              <div
                key={sz}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center"
              >
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 block mb-1">
                  Tamanho {sz}
                </span>
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {count}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">unidades</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Lista e Gestão de Encomendas */}
      <div className="bg-white dark:bg-[#0c1724] p-6 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="text-cyan-500" size={18} />
              Lista Detalhada de Encomendas ({filteredOrders.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pesquisa, acompanhamento de pagamento e envio de encomendas.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>Nova Encomenda Manual</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 cursor-pointer"
              title="Recarregar"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Barra de Filtros e Pesquisa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Pesquisa Livre */}
          <div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar nome, email, tel..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          {/* Filtro Origem */}
          <div>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">Origem: Todas</option>
              <option value="admin">🏷️ Criadas por Admin</option>
              <option value="web">🌐 Loja Web Pública</option>
            </select>
          </div>

          {/* Filtro Pagamento */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
            >
              <option value="all">Pagamento: Todos</option>
              <option value="paid">Pago (Confirmado)</option>
              <option value="pending">Pendente</option>
              <option value="failed">Falhado / Expirado</option>
            </select>
          </div>

          {/* Filtro Estado Operacional */}
          <div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
            >
              <option value="all">Estado: Todos</option>
              <option value="confirmed">Confirmada</option>
              <option value="in_production">Em Produção</option>
              <option value="ready_for_pickup">Pronta p/ Levantamento</option>
              <option value="shipped">Enviada via CTT</option>
              <option value="delivered">Entregue</option>
              <option value="test">🧪 Teste</option>
              <option value="pending_payment">Pendente Pagamento</option>
            </select>
          </div>

          {/* Filtro Tamanho */}
          <div>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
            >
              <option value="all">Tamanho: Todos</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="3XL">3XL</option>
            </select>
          </div>

          {/* Filtro Entrega */}
          <div>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300"
            >
              <option value="all">Entrega: Todas</option>
              <option value="pickup">Gabinete NEEI</option>
              <option value="shipping">Envio CTT</option>
            </select>
          </div>
        </div>

        {/* Barra de Ações em Lote (Bulk Actions) */}
        {selectedOrderIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center text-xs border border-cyan-500/30">
                {selectedOrderIds.length}
              </span>
              <div>
                <span className="text-xs font-bold text-white block">
                  {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'encomenda selecionada' : 'encomendas selecionadas'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Altera o estado operacional dos pedidos marcados em simultâneo
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-semibold text-slate-300 whitespace-nowrap">
                  Novo Estado:
                </label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
                  className="px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-slate-900 text-xs text-white font-medium focus:ring-1 focus:ring-cyan-500"
                >
                  <option className="bg-slate-900 text-white" value="confirmed">Confirmada</option>
                  <option className="bg-slate-900 text-white" value="in_production">Em Produção</option>
                  <option className="bg-slate-900 text-white" value="ready_for_pickup">Pronta p/ Levantamento</option>
                  <option className="bg-slate-900 text-white" value="shipped">Enviada via CTT</option>
                  <option className="bg-slate-900 text-white" value="delivered">Entregue</option>
                  <option className="bg-slate-900 text-purple-300 font-bold" value="test">🧪 Teste</option>
                  <option className="bg-slate-900 text-white" value="pending_payment">Pendente Pagamento</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleBulkStatusChange}
                disabled={isBulkUpdating}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isBulkUpdating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Check size={13} />
                )}
                <span>{isBulkUpdating ? 'A aplicar...' : 'Aplicar a Todos'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Tabela de Encomendas */}
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <ShoppingBag size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma encomenda encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someFilteredSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                      title="Selecionar / Desmarcar todos os visíveis"
                    />
                  </th>
                  <th className="py-3 px-3">Encomenda</th>
                  <th className="py-3 px-3">Aluno</th>
                  <th className="py-3 px-3">Contacto</th>
                  <th className="py-3 px-3">Tamanho</th>
                  <th className="py-3 px-3">Entrega</th>
                  <th className="py-3 px-3">Valor</th>
                  <th className="py-3 px-3">Pagamento</th>
                  <th className="py-3 px-3">Estado Operacional</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className={`transition-colors ${
                      selectedOrderIds.includes(o.id)
                        ? 'bg-cyan-500/10 dark:bg-cyan-950/40'
                        : o.order_status === 'test'
                        ? 'bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/70 dark:hover:bg-purple-950/30'
                        : 'hover:bg-gray-50/60 dark:hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Checkbox de Seleção */}
                    <td className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(o.id)}
                        onChange={() => handleToggleSelectOrder(o.id)}
                        className="w-4 h-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                      />
                    </td>

                    {/* ID & Data */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {o.id}
                        </span>
                        {o.is_admin_created ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40"
                            title={o.admin_notes ? `Criada por Admin: ${o.admin_notes}` : 'Criada manualmente por um administrador'}
                          >
                            <Tag size={10} /> Criada por Admin
                          </span>
                        ) : null}
                        {o.order_status === 'test' && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60">
                            <FlaskConical size={10} /> Teste
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {formatDateTimeDDMMAAAA(o.created_at)}
                      </span>
                      {o.admin_notes && (
                        <span
                          className="text-[10px] text-amber-600 dark:text-amber-400 italic block truncate max-w-[180px]"
                          title={o.admin_notes}
                        >
                          Nota: {o.admin_notes}
                        </span>
                      )}
                    </td>

                    {/* Aluno */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {o.student_name}
                      </span>
                      <span className="text-[11px] text-slate-500">{o.student_email}</span>
                    </td>

                    {/* Contacto */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-700 dark:text-slate-300 block">
                        {o.phone_number}
                      </span>
                    </td>

                    {/* Tamanho */}
                    <td className="py-3 px-3">
                      <span className="px-2 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-black text-xs">
                        {o.size}
                      </span>
                    </td>

                    {/* Modalidade de Entrega */}
                    <td className="py-3 px-3">
                      {o.delivery_type === 'shipping' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                            <Truck size={12} /> CTT
                          </span>
                          <span
                            className="text-[10px] text-slate-400 block max-w-[140px] truncate"
                            title={`${o.shipping_address}, ${o.shipping_postal_code} ${o.shipping_city}`}
                          >
                            {o.shipping_city || o.shipping_address}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                          <MapPin size={12} /> Gabinete
                        </span>
                      )}
                    </td>

                    {/* Valor */}
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {o.total_amount.toFixed(2)}€
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-3">
                      {o.payment_status === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                          <CheckCircle2 size={11} /> Pago
                        </span>
                      )}
                      {o.payment_status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-medium text-[10px]">
                          <Clock size={11} /> Pendente
                        </span>
                      )}
                      {(o.payment_status === 'expired' || o.payment_status === 'failed') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-medium text-[10px]">
                          <XCircle size={11} /> Cancelado
                        </span>
                      )}
                    </td>

                    {/* Estado Operacional Selector */}
                    <td className="py-3 px-3">
                      <select
                        value={o.order_status}
                        disabled={updatingOrderId === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors cursor-pointer outline-none focus:ring-2 ${getOrderStatusSelectClasses(
                          o.order_status
                        )}`}
                      >
                        <option className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100" value="confirmed">Confirmada</option>
                        <option className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100" value="in_production">Em Produção</option>
                        <option className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100" value="ready_for_pickup">Pronta p/ Levantamento</option>
                        <option className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100" value="shipped">Enviada via CTT</option>
                        <option className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100" value="delivered">Entregue</option>
                        <option className="bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 font-bold" value="test">🧪 Teste</option>
                        <option className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100" value="pending_payment">Pendente Pagamento</option>
                      </select>
                    </td>

                    {/* Ações (Reenviar Email) */}
                    <td className="py-3 px-3 text-right">
                      {o.payment_status === 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleResendEmail(o.id)}
                          disabled={resendingEmailId === o.id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Reenviar email de confirmação"
                        >
                          {resendingEmailId === o.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Mail size={14} />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Adicionar Encomenda Manual (Criada por Admin) */}
      {isCreateModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Plus size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Nova Encomenda Manual
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                      <Tag size={10} /> Criada por Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Regista manualmente encomendas efetuadas em numerário, gabinete ou atribuídas internamente.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateManualOrderSubmit} className="space-y-5">
                {/* 1. Dados Pessoais do Aluno */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User size={13} className="text-cyan-500" />
                    <span>1. Dados do Comprador / Aluno</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={manualForm.student_name}
                        onChange={handleManualNameChange}
                        placeholder="Ex: David Rodrigues"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Email Institucional ou Pessoal *
                      </label>
                      <input
                        type="email"
                        required
                        value={manualForm.student_email}
                        onChange={(e) =>
                          setManualForm((prev) => ({ ...prev, student_email: e.target.value }))
                        }
                        placeholder="aXXXXX@ualg.pt"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Telemóvel (9 dígitos) *
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={9}
                        value={manualForm.phone_number}
                        onChange={handleManualPhoneChange}
                        placeholder="912345678"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        NIF (Opcional)
                      </label>
                      <input
                        type="text"
                        maxLength={9}
                        value={manualForm.nif}
                        onChange={handleManualNifChange}
                        placeholder="123456789"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Seleção de Peça e Tamanho */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShoppingBag size={13} className="text-cyan-500" />
                    <span>2. Configuração da Sweat</span>
                  </h4>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Tamanho da Sweat *
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as SweatSize[]).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setManualForm((prev) => ({ ...prev, size: sz }))}
                          className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            manualForm.size === sz
                              ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/60'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Preço da Peça (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={manualForm.item_price}
                        onChange={(e) =>
                          setManualForm((prev) => ({ ...prev, item_price: parseFloat(e.target.value) || 0 }))
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Cor
                      </label>
                      <input
                        type="text"
                        value={manualForm.color}
                        onChange={(e) =>
                          setManualForm((prev) => ({ ...prev, color: e.target.value }))
                        }
                        placeholder="Preto"
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Modalidade de Entrega */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Truck size={13} className="text-cyan-500" />
                    <span>3. Modalidade de Entrega</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setManualForm((prev) => ({ ...prev, delivery_type: 'pickup' }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        manualForm.delivery_type === 'pickup'
                          ? 'bg-cyan-50/50 dark:bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <MapPin size={14} className="text-cyan-500" /> Gabinete NEEI
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full">
                          Grátis
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Levantamento presencial no Campus de Gambelas.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualForm((prev) => ({ ...prev, delivery_type: 'shipping' }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        manualForm.delivery_type === 'shipping'
                          ? 'bg-cyan-50/50 dark:bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Truck size={14} className="text-cyan-500" /> Envio CTT Nacional
                        </span>
                        <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-1.5 py-0.2 rounded-full">
                          +{manualForm.shipping_fee.toFixed(2)}€
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Envio postal para morada do estudante.
                      </p>
                    </button>
                  </div>

                  {manualForm.delivery_type === 'shipping' && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 animate-in fade-in duration-150">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Morada Completa *
                        </label>
                        <input
                          type="text"
                          required
                          value={manualForm.shipping_address}
                          onChange={(e) =>
                            setManualForm((prev) => ({ ...prev, shipping_address: e.target.value }))
                          }
                          placeholder="Rua, Número de Polícia, Andar/Porta"
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Código Postal *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={8}
                            value={manualForm.shipping_postal_code}
                            onChange={handleManualPostalCodeChange}
                            placeholder="8000-000"
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Distrito *
                          </label>
                          <select
                            value={manualForm.shipping_district}
                            onChange={handleManualDistrictChange}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                          >
                            {districtsList.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Concelho *
                          </label>
                          <select
                            value={manualForm.shipping_county}
                            onChange={(e) =>
                              setManualForm((prev) => ({ ...prev, shipping_county: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                          >
                            {manualCounties.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Estado & Pagamento */}
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CreditCard size={13} className="text-cyan-500" />
                    <span>4. Estado Financeiro e Operacional</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Estado do Pagamento
                      </label>
                      <select
                        value={manualForm.payment_status}
                        onChange={(e) =>
                          setManualForm((prev) => ({
                            ...prev,
                            payment_status: e.target.value as 'paid' | 'pending',
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="paid">Pago (Confirmado)</option>
                        <option value="pending">Pendente Pagamento</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Estado Operacional
                      </label>
                      <select
                        value={manualForm.order_status}
                        onChange={(e) =>
                          setManualForm((prev) => ({
                            ...prev,
                            order_status: e.target.value as OrderStatus,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                      >
                        <option value="confirmed">Confirmada / Aguarda Fabrico</option>
                        <option value="in_production">Em Produção (Fábrica)</option>
                        <option value="ready_for_pickup">Pronta p/ Levantamento</option>
                        <option value="shipped">Enviada via CTT</option>
                        <option value="delivered">Entregue / Concluída</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Notas Internas do Administrador (opcional)
                    </label>
                    <input
                      type="text"
                      value={manualForm.admin_notes}
                      onChange={(e) =>
                        setManualForm((prev) => ({ ...prev, admin_notes: e.target.value }))
                      }
                      placeholder="Ex: Pago em dinheiro na sala 0.18 ao tesoureiro"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="manual_send_email"
                      checked={manualForm.send_email}
                      onChange={(e) =>
                        setManualForm((prev) => ({ ...prev, send_email: e.target.checked }))
                      }
                      className="w-4 h-4 rounded text-cyan-600 accent-cyan-500 cursor-pointer"
                    />
                    <label
                      htmlFor="manual_send_email"
                      className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                    >
                      Enviar email de confirmação imediato para o comprador
                    </label>
                  </div>
                </div>

                {/* Resumo do Total */}
                <div className="p-3.5 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-900/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Total Registado:
                  </span>
                  <span className="font-black text-cyan-600 dark:text-cyan-400 text-base">
                    {(
                      manualForm.item_price +
                      (manualForm.delivery_type === 'shipping' ? manualForm.shipping_fee : 0)
                    ).toFixed(2)}
                    €
                  </span>
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                {/* Botões do Modal */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingOrder}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {creatingOrder ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>A criar encomenda...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Criar Encomenda Manual</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};
export default AdminShopPanel;

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
} from 'lucide-react';
import { ShopOrder, ShopSummaryStats, OrderStatus, SweatSize } from '../../types/shop';
import {
  fetchAdminShopOrders,
  fetchAdminShopStats,
  updateAdminOrderStatus,
  resendOrderEmail,
  fetchShopCampaign,
} from '../../services/shopService';
import { formatDateTimeDDMMAAAA } from '../../utils/dateHelpers';

interface AdminShopPanelProps {
  token: string;
  showFeedback: (id: string, message: string) => void;
}

export const AdminShopPanel: React.FC<AdminShopPanelProps> = ({ token, showFeedback }) => {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [stats, setStats] = useState<ShopSummaryStats | null>(null);
  const [sweatsAvailable, setSweatsAvailable] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');

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

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.student_name.toLowerCase().includes(q) ||
        o.student_email.toLowerCase().includes(q) ||
        o.phone_number.includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.nif.includes(q);

      return matchesPayment && matchesStatus && matchesSize && matchesDelivery && matchesSearch;
    });
  }, [orders, search, paymentFilter, orderStatusFilter, sizeFilter, deliveryFilter]);

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
      default:
        return st;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Secção de Modo de Teste da Loja (Checkout Real a 0.50€) */}
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
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                sweatsAvailable
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {sweatsAvailable
                ? '● Loja Pública: Aberta (SWEATS_AVAILABLE=true)'
                : '○ Loja Pública: Oculta (SWEATS_AVAILABLE=false)'}
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Permite testar o fluxo de compra e pagamento real (MB WAY, Cartões, Apple Pay) mesmo quando as sweats estão desativadas para o público (<code>SWEATS_AVAILABLE=false</code>). O valor foi ajustado para apenas <strong>0.50€</strong> (mínimo Stripe) para poderes validar a compra no teu telemóvel.
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

      {/* QR Code Desdobrável para Testes Rápidos no Telemóvel */}
      {showQrCode && (
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
            De um total de {stats?.totalOrders || 0} pedidos iniciados
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

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-gray-200 self-start md:self-auto"
            title="Recarregar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Barra de Filtros e Pesquisa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Pesquisa Livre */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar nome, email, tel..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
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
                  <th className="py-3 px-3">Encomenda</th>
                  <th className="py-3 px-3">Aluno</th>
                  <th className="py-3 px-3">Contacto / NIF</th>
                  <th className="py-3 px-3">Tamanho</th>
                  <th className="py-3 px-3">Entrega</th>
                  <th className="py-3 px-3">Valor</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Estado Operacional</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-gray-50/60 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    {/* ID & Data */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {o.id}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTimeDDMMAAAA(o.created_at)}
                      </span>
                    </td>

                    {/* Aluno */}
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {o.student_name}
                      </span>
                      <span className="text-[11px] text-slate-500">{o.student_email}</span>
                    </td>

                    {/* Contacto & NIF */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-700 dark:text-slate-300 block">
                        {o.phone_number}
                      </span>
                      <span className="text-[10px] text-slate-400">NIF: {o.nif}</span>
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
                        className="px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] text-slate-800 dark:text-slate-200 font-medium"
                      >
                        <option value="pending_payment">Pendente Pagamento</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="in_production">Em Produção</option>
                        <option value="ready_for_pickup">Pronta p/ Levantamento</option>
                        <option value="shipped">Enviada via CTT</option>
                        <option value="delivered">Entregue</option>
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
    </div>
  );
};
export default AdminShopPanel;

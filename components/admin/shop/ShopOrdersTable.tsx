import React from 'react';
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Search,
  Check,
  Loader2,
  Tag,
  FlaskConical,
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  Mail,
} from 'lucide-react';
import { ShopOrder, OrderStatus } from '../../../types/shop';
import { formatDateTimeDDMMAAAA } from '../../../utils/dateHelpers';

interface ShopOrdersTableProps {
  orders: ShopOrder[];
  filteredOrders: ShopOrder[];
  selectedOrderIds: string[];
  allFilteredSelected: boolean;
  someFilteredSelected: boolean;
  bulkStatus: OrderStatus;
  isBulkUpdating: boolean;
  search: string;
  originFilter: 'all' | 'admin' | 'web';
  paymentFilter: string;
  orderStatusFilter: string;
  sizeFilter: string;
  deliveryFilter: string;
  loading: boolean;
  updatingOrderId: string | null;
  resendingEmailId: string | null;
  setSearch: (s: string) => void;
  setOriginFilter: (f: 'all' | 'admin' | 'web') => void;
  setPaymentFilter: (f: string) => void;
  setOrderStatusFilter: (f: string) => void;
  setSizeFilter: (f: string) => void;
  setDeliveryFilter: (f: string) => void;
  setBulkStatus: (s: OrderStatus) => void;
  onToggleSelectOrder: (id: string) => void;
  onToggleSelectAll: () => void;
  onBulkStatusChange: () => void;
  onStatusChange: (id: string, s: OrderStatus) => void;
  onResendEmail: (id: string) => void;
  onOpenCreateManualOrder: () => void;
  onRefresh: () => void;
  getOrderStatusSelectClasses: (s: OrderStatus) => string;
}

export const ShopOrdersTable: React.FC<ShopOrdersTableProps> = ({
  orders,
  filteredOrders,
  selectedOrderIds,
  allFilteredSelected,
  someFilteredSelected,
  bulkStatus,
  isBulkUpdating,
  search,
  originFilter,
  paymentFilter,
  orderStatusFilter,
  sizeFilter,
  deliveryFilter,
  loading,
  updatingOrderId,
  resendingEmailId,
  setSearch,
  setOriginFilter,
  setPaymentFilter,
  setOrderStatusFilter,
  setSizeFilter,
  setDeliveryFilter,
  setBulkStatus,
  onToggleSelectOrder,
  onToggleSelectAll,
  onBulkStatusChange,
  onStatusChange,
  onResendEmail,
  onOpenCreateManualOrder,
  onRefresh,
  getOrderStatusSelectClasses,
}) => {
  return (
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
            onClick={onOpenCreateManualOrder}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Nova Encomenda Manual</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
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
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar nome, email, tel..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
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
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
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
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
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
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
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
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
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
                className="px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-slate-900 text-xs text-white font-medium focus:ring-1 focus:ring-cyan-500 cursor-pointer"
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
              onClick={onBulkStatusChange}
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
              onClick={onToggleSelectAll}
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
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer accent-cyan-500"
                    title="Selecionar / Desmarcar todos os visíveis"
                  />
                </th>
                <th className="py-3 px-3">Encomenda</th>
                <th className="py-3 px-3">Artigo / Peça</th>
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
                      onChange={() => onToggleSelectOrder(o.id)}
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

                  {/* Artigo / Peça - Mostra o nome que tinha quando foi vendida */}
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 block">
                      {o.item_name || 'Sweat Oficial Engenharia Informática'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {o.campaign_id}
                    </span>
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
                    <div>{o.total_amount.toFixed(2)}€</div>
                    {Boolean(o.payment_fee) && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        taxa: {Number(o.payment_fee).toFixed(2)}€
                      </div>
                    )}
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
                      onChange={(e) => onStatusChange(o.id, e.target.value as OrderStatus)}
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
                        onClick={() => onResendEmail(o.id)}
                        disabled={resendingEmailId === o.id}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
  );
};

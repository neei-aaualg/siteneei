import React, { useState, useEffect } from 'react';
import {
  Flame,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  User,
  Beer,
  RefreshCw,
  QrCode,
  Check,
} from 'lucide-react';
import {
  ChurrascoOrder,
  ChurrascoStats,
  fetchAdminChurrasco,
  toggleAdminChurrascoVisibility,
  toggleAdminChurrascoCheckIn,
  createAdminManualChurrasco,
  deleteAdminChurrascoOrder,
} from '../../services/churrascoService';

interface AdminChurrascoTabProps {
  adminToken: string;
}

export const AdminChurrascoTab: React.FC<AdminChurrascoTabProps> = ({ adminToken }) => {
  const [stats, setStats] = useState<ChurrascoStats | null>(null);
  const [orders, setOrders] = useState<ChurrascoOrder[]>([]);
  const [visibility, setVisibility] = useState(true);
  const [loading, setLoading] = useState(true);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_checkin' | 'checked_in'>('all');

  // Manual Sale Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualStudentNumber, setManualStudentNumber] = useState('');
  const [manualDrink, setManualDrink] = useState('Cerveja');
  const [manualQuantity, setManualQuantity] = useState(1);
  const [manualNotes, setManualNotes] = useState('Venda manual presencial (Dinheiro)');
  const [submittingManual, setSubmittingManual] = useState(false);

  // Deletion Modal
  const [orderToDelete, setOrderToDelete] = useState<ChurrascoOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminChurrasco(adminToken);
      setStats(data.stats);
      setOrders(data.orders);
      setVisibility(data.visibility);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Falha ao carregar dados do churrasco.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [adminToken]);

  const handleToggleVisibility = async () => {
    try {
      setTogglingVisibility(true);
      const nextVal = !visibility;
      const resVal = await toggleAdminChurrascoVisibility(adminToken, nextVal);
      setVisibility(resVal);
      setFeedbackMsg({
        type: 'success',
        text: resVal
          ? 'Aba do Churrasco agora VISÍVEL no site e menu!'
          : 'Aba do Churrasco OCULTADA com sucesso.',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Erro ao alterar visibilidade.',
      });
    } finally {
      setTogglingVisibility(false);
    }
  };

  const handleCheckIn = async (order: ChurrascoOrder) => {
    const isChecked = Boolean(order.check_in || order.checkIn);
    const nextChecked = !isChecked;
    try {
      const updated = await toggleAdminChurrascoCheckIn(adminToken, order.id, nextChecked);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      // Atualiza contadores locais
      if (stats) {
        const qty = order.quantity || 1;
        setStats({
          ...stats,
          totalCheckedIn: nextChecked ? stats.totalCheckedIn + qty : Math.max(0, stats.totalCheckedIn - qty),
          pendingCheckIn: nextChecked ? Math.max(0, stats.pendingCheckIn - qty) : stats.pendingCheckIn + qty,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Falha ao atualizar check-in.');
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || manualName.trim().length < 3) {
      alert('Nome do aluno é obrigatório (mínimo 3 caracteres).');
      return;
    }
    setSubmittingManual(true);
    try {
      const newOrder = await createAdminManualChurrasco(adminToken, {
        student_name: manualName.trim(),
        student_email: manualEmail.trim() || undefined,
        phone_number: manualPhone.trim() || undefined,
        student_number: manualStudentNumber.trim() || undefined,
        drink_preference: manualDrink,
        quantity: manualQuantity,
        notes: manualNotes,
      });

      setOrders((prev) => [newOrder, ...prev]);
      setIsManualModalOpen(false);
      setManualName('');
      setManualEmail('');
      setManualPhone('');
      setManualStudentNumber('');
      setManualQuantity(1);

      setFeedbackMsg({
        type: 'success',
        text: `Venda manual registada com sucesso! Código: ${newOrder.ticket_code}`,
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Falha ao criar venda manual.');
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setDeleting(true);
    try {
      await deleteAdminChurrascoOrder(adminToken, orderToDelete.id);
      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      setOrderToDelete(null);
      setFeedbackMsg({
        type: 'success',
        text: 'Registo de bilhete eliminado com sucesso.',
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar bilhete.');
    } finally {
      setDeleting(false);
    }
  };

  // Exportação para ficheiro CSV
  const handleExportCsv = () => {
    if (orders.length === 0) return;
    const headers = [
      'Código Bilhete',
      'Nome do Aluno',
      'Email',
      'Telemóvel',
      'Nº Aluno',
      'Bebida',
      'Quantidade',
      'Total Pago (€)',
      'Estado Pagamento',
      'Check-in (Levantado)',
      'Data de Compra',
      'Notas',
    ];

    const rows = orders.map((o) => [
      `"${o.ticket_code || o.ticketCode || o.id}"`,
      `"${o.student_name || o.studentName || ''}"`,
      `"${o.student_email || o.studentEmail || ''}"`,
      `"${o.phone_number || o.phoneNumber || ''}"`,
      `"${o.student_number || o.studentNumber || ''}"`,
      `"${o.drink_preference || o.drinkPreference || 'Cerveja'}"`,
      o.quantity,
      Number(o.total_amount || o.totalAmount || 0).toFixed(2),
      `"${o.payment_status || o.paymentStatus || 'pending'}"`,
      Boolean(o.check_in || o.checkIn) ? 'SIM' : 'NÃO',
      `"${o.created_at || o.createdAt || ''}"`,
      `"${(o.admin_notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `churrasco_passes_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtragem de participantes
  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase().trim();
    const name = (order.student_name || order.studentName || '').toLowerCase();
    const email = (order.student_email || order.studentEmail || '').toLowerCase();
    const phone = (order.phone_number || order.phoneNumber || '').toLowerCase();
    const code = (order.ticket_code || order.ticketCode || order.id || '').toLowerCase();
    const studentNum = (order.student_number || order.studentNumber || '').toLowerCase();

    const matchesQuery =
      !query ||
      name.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      code.includes(query) ||
      studentNum.includes(query);

    const isCheckedIn = Boolean(order.check_in || order.checkIn);
    if (statusFilter === 'checked_in') return matchesQuery && isCheckedIn;
    if (statusFilter === 'pending_checkin') return matchesQuery && !isCheckedIn;
    return matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm shadow-xs transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-bold px-2 py-1 hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* CABEÇALHO DO CHURRASCO & VISIBILITY TOGGLE */}
      <div className="bg-white dark:bg-[#0c1724] border border-orange-200 dark:border-orange-950/70 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 shrink-0">
              <Flame size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-text-100 dark:text-white">
                  Churrasco NEEI
                </h2>
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-500/40">
                  4,50€ &bull; Bifana + 2 Bebidas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-200 dark:text-slate-400 mt-1">
                Controlo de vendas de bilhetes, lista de participantes e check-in no bar.
              </p>
            </div>
          </div>

          {/* CONTROLOS RÁPIDOS: MOSTRAR/ESCONDER ABA NO HEADER */}
          <div className="flex flex-wrap items-center gap-3">
            {/* TOGGLE VISIBILIDADE NO HEADER / SITE */}
            <div className="flex items-center gap-3 p-2.5 px-4 rounded-2xl bg-orange-50/70 dark:bg-[#08111c] border border-orange-200 dark:border-orange-900/50 shadow-xs">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-100 dark:text-white flex items-center gap-1.5">
                  {visibility ? <Eye size={14} className="text-emerald-500" /> : <EyeOff size={14} className="text-gray-400" />}
                  <span>Aba no Header:</span>
                </span>
                <span className="text-[11px] text-text-200 dark:text-slate-400">
                  {visibility ? 'Visível para todos' : 'Oculta do público'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleVisibility}
                disabled={togglingVisibility}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  visibility ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'
                }`}
                title={visibility ? 'Clique para ocultar a aba' : 'Clique para mostrar a aba'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    visibility ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* BOTÃO REGISTAR VENDA MANUAL */}
            <button
              type="button"
              onClick={() => setIsManualModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              <span>Venda Manual (Dinheiro)</span>
            </button>

            {/* BOTÃO EXPORTAR */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={orders.length === 0}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-text-100 dark:text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-40"
              title="Exportar CSV"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Exportar</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-text-100 dark:text-white transition"
              title="Recarregar dados"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ESTATÍSTICAS RÁPIDAS */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-orange-100 dark:border-orange-950/50">
            <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/30">
              <span className="text-xs font-bold text-orange-800 dark:text-orange-300 block">
                Passes Vendidos
              </span>
              <div className="text-2xl sm:text-3xl font-black text-orange-700 dark:text-orange-400 mt-1">
                {stats.totalTickets}
              </div>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                {stats.totalOrders} pedido(s) pagos
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                Total Faturado
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">
                {stats.totalRevenue.toFixed(2)}€
              </div>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                4,50€ por passe
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                Já Levantados (Check-in)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {stats.totalCheckedIn}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {stats.totalTickets > 0
                  ? `${Math.round((stats.totalCheckedIn / stats.totalTickets) * 100)}% atendidos`
                  : '0%'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 block">
                Por Levantar
              </span>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-blue-400 mt-1">
                {stats.pendingCheckIn}
              </div>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                Passes pendentes no bar
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FILTROS E PESQUISA DE PARTICIPANTES */}
      <div className="bg-white dark:bg-[#0c1724] border border-gray-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de Pesquisa */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, código (CH-...), email ou telemóvel..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#09121d] border border-gray-200 dark:border-slate-800 text-xs sm:text-sm text-text-100 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Filtros de Estado */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-slate-800/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-text-100 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-text-100'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending_checkin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'pending_checkin'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-text-100'
              }`}
            >
              Por Levantar
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('checked_in')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'checked_in'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 dark:text-slate-400 hover:text-text-100'
              }`}
            >
              Já Levantados
            </button>
          </div>
        </div>

        {/* TABELA DE PARTICIPANTES */}
        <div className="overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-text-200 dark:text-slate-400 text-sm">
              Nenhum bilhete encontrado com os critérios selecionados.
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-800 text-[11px] uppercase tracking-wider text-gray-400 dark:text-slate-400 font-bold">
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Aluno</th>
                  <th className="py-3 px-3">Bebida</th>
                  <th className="py-3 px-3">Qtd / Valor</th>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3 text-center">Check-in (Bar)</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                {filteredOrders.map((order) => {
                  const isChecked = Boolean(order.check_in || order.checkIn);
                  const isPaid = (order.payment_status || order.paymentStatus) === 'paid';
                  const code = order.ticket_code || order.ticketCode || order.id;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Código do Bilhete */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-black text-xs sm:text-sm px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60">
                          {code}
                        </span>
                        {order.is_admin_created ? (
                          <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            Manual
                          </span>
                        ) : null}
                      </td>

                      {/* Aluno */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-text-100 dark:text-white">
                          {order.student_name || order.studentName}
                        </div>
                        <div className="text-xs text-text-200 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{order.student_email || order.studentEmail}</span>
                          <span>&bull;</span>
                          <span>{order.phone_number || order.phoneNumber}</span>
                          {order.student_number || order.studentNumber ? (
                            <>
                              <span>&bull;</span>
                              <span className="font-mono">{order.student_number || order.studentNumber}</span>
                            </>
                          ) : null}
                        </div>
                      </td>

                      {/* Bebida */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-text-100 dark:text-slate-200">
                          <Beer size={14} className="text-amber-500" />
                          <span>{order.drink_preference || order.drinkPreference || 'Cerveja'}</span>
                        </span>
                      </td>

                      {/* Quantidade e Valor */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-text-100 dark:text-white">
                          {order.quantity}x passe(s)
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                          {Number(order.total_amount || order.totalAmount || 0).toFixed(2)}€
                        </div>
                      </td>

                      {/* Data */}
                      <td className="py-3 px-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {order.created_at || order.createdAt
                          ? new Date(order.created_at || order.createdAt!).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>

                      {/* Botão de Check-in no Bar */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleCheckIn(order)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5 ${
                            isChecked
                              ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                              : 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/70 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-300'
                          }`}
                        >
                          {isChecked ? (
                            <>
                              <Check size={14} />
                              <span>Levantado</span>
                            </>
                          ) : (
                            <>
                              <Clock size={14} />
                              <span>Marcar Levantado</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setOrderToDelete(order)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="Eliminar bilhete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE VENDA MANUAL (DINHEIRO / PRESENCIAL) */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0d1b2a] rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plus size={20} className="text-orange-500" />
                <h3 className="font-bold text-base sm:text-lg text-text-100 dark:text-white">
                  Registar Venda Manual de Passe
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-gray-400 hover:text-text-100 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-1.5">
                  Nome do Aluno *
                </label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nome completo do aluno"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm text-text-100 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="aluno@ualg.pt"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm text-text-100 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-1.5">
                    Telemóvel
                  </label>
                  <input
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="912 345 678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm text-text-100 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-1.5">
                    Bebida
                  </label>
                  <select
                    value={manualDrink}
                    onChange={(e) => setManualDrink(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm text-text-100 dark:text-white"
                  >
                    <option value="Cerveja">Cerveja</option>
                    <option value="Refrigerante">Refrigerante</option>
                    <option value="Água">Água</option>
                    <option value="À escolha no bar">À escolha no bar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-1.5">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={manualQuantity}
                    onChange={(e) => setManualQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm text-text-100 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-300 mb-1.5">
                  Notas de Pagamento
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Ex: Pago em numerário a João"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm text-text-100 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 text-xs font-semibold flex justify-between items-center">
                <span>Total a cobrar no local:</span>
                <span className="text-base font-extrabold">{(manualQuantity * 4.5).toFixed(2)}€</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-text-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  {submittingManual ? 'A registar...' : 'Confirmar Venda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE ELIMINAÇÃO */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#0d1b2a] rounded-3xl max-w-sm w-full p-6 border border-gray-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <div className="inline-flex p-3 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-text-100 dark:text-white">
              Eliminar Bilhete?
            </h3>
            <p className="text-xs text-text-200 dark:text-slate-400">
              Tens a certeza que pretendes eliminar o bilhete de{' '}
              <span className="font-bold text-text-100 dark:text-white">
                {orderToDelete.student_name || orderToDelete.studentName}
              </span>{' '}
              ({orderToDelete.ticket_code || orderToDelete.ticketCode})? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-text-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-sm disabled:opacity-50"
              >
                {deleting ? 'A eliminar...' : 'Sim, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

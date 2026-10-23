import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  ShieldAlert,
  Sparkles,
  DollarSign,
  Edit3,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Calculator,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Package,
  Layers,
  Info,
  FileJson,
  Upload,
  Copy,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  ProductProfitMargin,
  ShopProfitSummary,
  ShopSummaryStats,
  ShopOrder,
} from '../../../types/shop';
import {
  fetchShopProfitMargins,
  updateShopProfitMargins,
  resetShopProfitMargins,
} from '../../../services/shopService';

interface ShopProfitPanelProps {
  token: string;
  stats: ShopSummaryStats | null;
  orders: ShopOrder[];
  onRefreshStats?: () => void;
}

export const ShopProfitPanel: React.FC<ShopProfitPanelProps> = ({
  token,
  stats,
  orders,
  onRefreshStats,
}) => {
  const [margins, setMargins] = useState<ProductProfitMargin[]>([]);
  const [editedMargins, setEditedMargins] = useState<ProductProfitMargin[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Modal de Importar / Exportar JSON
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Filtro de cálculo: apenas pagas vs todas as encomendas
  const [orderScope, setOrderScope] = useState<'paid' | 'all'>('paid');

  // Carregar margens do backend
  useEffect(() => {
    let isMounted = true;
    const loadMargins = async () => {
      try {
        setLoading(true);
        const data = await fetchShopProfitMargins(token);
        if (isMounted) {
          setMargins(data.margins || []);
          setEditedMargins(data.margins || []);
        }
      } catch (err: any) {
        console.error('Erro ao carregar margens:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMargins();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Encomendas a considerar no cálculo
  const scopedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.order_status === 'test') return false;
      if (orderScope === 'paid') {
        return o.payment_status === 'paid';
      }
      return o.payment_status === 'paid' || o.payment_status === 'pending';
    });
  }, [orders, orderScope]);

  // Função para fazer a correspondência dinâmica da encomenda com a margem do artigo
  const matchOrder = (order: ShopOrder, marginList: ProductProfitMargin[]) => {
    if (!marginList || marginList.length === 0) return null;

    const rawItemName = (order.item_name || '').toLowerCase().trim();
    const rawCampaignId = (order.campaign_id || '').toLowerCase().trim();

    // 1. Por ID ou Nome exato
    for (const m of marginList) {
      if (m.id.toLowerCase() === rawCampaignId || m.id.toLowerCase() === rawItemName) {
        return m;
      }
      const mName = m.product_name.toLowerCase().trim();
      if (mName === rawItemName) {
        return m;
      }
    }

    // 2. Por correspondência parcial de nome
    for (const m of marginList) {
      const mName = m.product_name.toLowerCase().trim();
      if (rawItemName.includes(mName) || mName.includes(rawItemName)) {
        return m;
      }
    }

    // 3. Por palavras-chave
    const orderWords = rawItemName.split(/[\s+\-_/|]+/).filter((w) => w.length > 2);
    let bestMatch: ProductProfitMargin | null = null;
    let bestScore = 0;

    for (const m of marginList) {
      const mWords = m.product_name.toLowerCase().split(/[\s+\-_/|]+/).filter((w) => w.length > 2);
      let score = 0;
      for (const w of orderWords) {
        if (mWords.includes(w)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = m;
      }
    }
    if (bestMatch && bestScore > 0) return bestMatch;

    // 4. Por preço de venda aproximado
    const orderPrice = Number(order.item_price || 0);
    if (orderPrice > 0) {
      const priceMatch = marginList.find(
        (m) => Math.abs(Number(m.sale_price) - orderPrice) < 0.05
      );
      if (priceMatch) return priceMatch;
    }

    return marginList[0] || null;
  };

  // Contagem dinâmica em tempo real com base nas margens ativas (ou editadas)
  const currentList = isEditing ? editedMargins : margins;

  const calculation = useMemo(() => {
    const countsMap = new Map<string, number>();
    currentList.forEach((m) => countsMap.set(m.id, 0));

    scopedOrders.forEach((o) => {
      const match = matchOrder(o, currentList);
      if (match && countsMap.has(match.id)) {
        countsMap.set(match.id, (countsMap.get(match.id) || 0) + 1);
      }
    });

    let totalRevenue = 0;
    let totalProfitMin = 0;
    let totalProfitMax = 0;
    let totalUnits = 0;

    const items = currentList.map((m) => {
      const units = countsMap.get(m.id) || 0;
      const salePrice = Number(m.sale_price) || 0;
      const profitMin = Number(m.profit_min) || 0;
      const profitMax = Number(m.profit_max) || 0;
      const profitAvg = Number(((profitMin + profitMax) / 2).toFixed(2));

      const subRevenue = Number((units * salePrice).toFixed(2));
      const subProfitMin = Number((units * profitMin).toFixed(2));
      const subProfitMax = Number((units * profitMax).toFixed(2));
      const subProfitAvg = Number((units * profitAvg).toFixed(2));

      const marginMinPct = salePrice > 0 ? Number(((profitMin / salePrice) * 100).toFixed(1)) : 0;
      const marginMaxPct = salePrice > 0 ? Number(((profitMax / salePrice) * 100).toFixed(1)) : 0;
      const marginAvgPct = salePrice > 0 ? Number(((profitAvg / salePrice) * 100).toFixed(1)) : 0;

      totalUnits += units;
      totalRevenue += subRevenue;
      totalProfitMin += subProfitMin;
      totalProfitMax += subProfitMax;

      return {
        ...m,
        profit_avg: profitAvg,
        units,
        subRevenue,
        subProfitMin,
        subProfitMax,
        subProfitAvg,
        marginMinPct,
        marginMaxPct,
        marginAvgPct,
      };
    });

    const totalProfitAvg = Number(((totalProfitMin + totalProfitMax) / 2).toFixed(2));
    const overallMarginMinPct =
      totalRevenue > 0 ? Number(((totalProfitMin / totalRevenue) * 100).toFixed(1)) : 0;
    const overallMarginMaxPct =
      totalRevenue > 0 ? Number(((totalProfitMax / totalRevenue) * 100).toFixed(1)) : 0;
    const overallMarginAvgPct =
      totalRevenue > 0 ? Number(((totalProfitAvg / totalRevenue) * 100).toFixed(1)) : 0;

    return {
      items,
      totalUnits,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalProfitMin: Number(totalProfitMin.toFixed(2)),
      totalProfitMax: Number(totalProfitMax.toFixed(2)),
      totalProfitAvg,
      overallMarginMinPct,
      overallMarginMaxPct,
      overallMarginAvgPct,
    };
  }, [currentList, scopedOrders]);

  // Manipular alteração de valores em modo de edição
  const handleMarginChange = (
    index: number,
    field: keyof ProductProfitMargin,
    value: string | number
  ) => {
    setEditedMargins((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };
      const numVal = typeof value === 'string' ? parseFloat(value) || 0 : value;

      if (field === 'product_name') {
        item.product_name = String(value);
      } else {
        (item as any)[field] = numVal;
      }

      copy[index] = item;
      return copy;
    });
  };

  // Recalcular Lucro Mín e Máx através da fórmula padrão para um artigo
  const handleRecalculateFormula = (index: number) => {
    setEditedMargins((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };
      const sale = Number(item.sale_price) || 0;
      const costMin = Number(item.cost_min) || 0;
      const costMax = Number(item.cost_max) || 0;
      const sponsor = Number(item.sponsorship) || 0;

      // Lucro Min = Venda - Custo Max + Patrocínio
      item.profit_min = Number((sale - costMax + sponsor).toFixed(2));
      // Lucro Max = Venda - Custo Min + Patrocínio
      item.profit_max = Number((sale - costMin + sponsor).toFixed(2));

      copy[index] = item;
      return copy;
    });
  };

  // Adicionar um novo artigo
  const handleAddProduct = () => {
    const newId = `artigo-${Date.now().toString().slice(-4)}`;
    const newItem: ProductProfitMargin = {
      id: newId,
      product_name: 'Novo Artigo',
      sale_price: 0,
      cost_min: 0,
      cost_max: 0,
      sponsorship: 0,
      profit_min: 0,
      profit_max: 0,
      display_order: editedMargins.length + 1,
    };
    setEditedMargins((prev) => [...prev, newItem]);
    if (!isEditing) setIsEditing(true);
  };

  // Remover um artigo
  const handleRemoveProduct = (index: number) => {
    setEditedMargins((prev) => prev.filter((_, i) => i !== index));
  };

  // Guardar alterações no servidor
  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await updateShopProfitMargins(token, editedMargins);
      setMargins(res.margins);
      setEditedMargins(res.margins);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Margens de lucro guardadas com sucesso na base de dados!' });
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao guardar margens.' });
    } finally {
      setSaving(false);
    }
  };

  // Cancelar edição
  const handleCancel = () => {
    setEditedMargins([...margins]);
    setIsEditing(false);
    setFeedback(null);
  };

  // Sincronizar com os produtos existentes no catálogo
  const handleSyncWithProducts = async () => {
    if (
      !window.confirm(
        'Desejas repor a lista e sincronizar com os produtos registados no catálogo da loja?'
      )
    ) {
      return;
    }
    try {
      setSaving(true);
      setFeedback(null);
      const res = await resetShopProfitMargins(token);
      setMargins(res.margins);
      setEditedMargins(res.margins);
      setIsEditing(false);
      setFeedback({
        type: 'success',
        message: 'Tabela sincronizada com os produtos do catálogo!',
      });
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao sincronizar.' });
    } finally {
      setSaving(false);
    }
  };

  // Abrir Modal de Importar / Exportar JSON
  const handleOpenImportExport = () => {
    setJsonText(JSON.stringify(margins, null, 2));
    setJsonError(null);
    setIsImportExportOpen(true);
  };

  // Copiar JSON para o clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    alert('JSON copiado para a área de transferência!');
  };

  // Processar importação de JSON
  const handleApplyImportJson = async () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('O JSON deve ser um array de artigos [ { ... }, ... ]');
      }

      setSaving(true);
      const res = await updateShopProfitMargins(token, parsed);
      setMargins(res.margins);
      setEditedMargins(res.margins);
      setIsImportExportOpen(false);
      setFeedback({ type: 'success', message: 'Margens importadas e guardadas com sucesso na base de dados!' });
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setJsonError(err.message || 'Erro ao processar JSON');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cabeçalho do Painel de Lucros */}
      <div className="bg-white dark:bg-[#0c1724] p-6 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              <TrendingUp size={20} />
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Análise de Lucro & Margens de Venda
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Estimativa de lucro mínimo, médio e máximo com base nas encomendas da loja e custos de confeção.
            <span className="block mt-0.5 text-cyan-600 dark:text-cyan-400 font-medium">
              Configuração 100% privada e guardada na base de dados. Podes editar qualquer artigo ou colar a tua tabela.
            </span>
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Seletor de Encomendas (Pagas vs Todas) */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-gray-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setOrderScope('paid')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                orderScope === 'paid'
                  ? 'bg-white dark:bg-[#0c1724] text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Apenas encomendas com pagamento confirmado"
            >
              Apenas Pagas ({orders.filter((o) => o.payment_status === 'paid' && o.order_status !== 'test').length})
            </button>
            <button
              type="button"
              onClick={() => setOrderScope('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                orderScope === 'all'
                  ? 'bg-white dark:bg-[#0c1724] text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Inclui encomendas pendentes de pagamento (projeção total)"
            >
              Todas ({orders.filter((o) => o.order_status !== 'test').length})
            </button>
          </div>

          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <Edit3 size={15} />
                <span>Editar Margens</span>
              </button>

              <button
                type="button"
                onClick={handleOpenImportExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                title="Importar ou exportar configuração em JSON"
              >
                <FileJson size={14} />
                <span>Importar / Exportar</span>
              </button>

              <button
                type="button"
                onClick={handleSyncWithProducts}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                title="Sincroniza os artigos da tabela com os produtos registados na loja"
              >
                <RefreshCw size={14} />
                <span>Sincronizar Loja</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'A guardar...' : 'Guardar Alterações'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleAddProduct}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Adicionar Artigo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0" />
          ) : (
            <AlertCircle size={18} className="shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 4 Grandes Cartões de Destaque Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Lucro Mínimo Esperado */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lucro Mínimo Esperado
            </span>
            <span
              className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
              title="Pior cenário de produção (custo máximo cobrado pela fábrica)"
            >
              <ShieldAlert size={16} />
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {calculation.totalProfitMin.toFixed(2)}€
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300">
              Margem {calculation.overallMarginMinPct}%
            </span>
            <span className="text-[11px] text-slate-400">Pior cenário</span>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block leading-snug">
            Garantido mesmo se a confeção praticar os custos máximos de produção.
          </span>
        </div>

        {/* 2. Lucro Médio Esperado (Destaque Principal) */}
        <div className="bg-gradient-to-br from-cyan-50/50 to-emerald-50/50 dark:from-cyan-950/30 dark:to-emerald-950/30 p-5 rounded-2xl border-2 border-cyan-500/50 dark:border-cyan-500/40 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-cyan-500" />
              Lucro Médio Esperado
            </span>
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold">
              <DollarSign size={16} />
            </span>
          </div>

          <div className="text-3xl sm:text-4xl font-black text-cyan-700 dark:text-cyan-300 mt-2 font-mono tracking-tight">
            {calculation.totalProfitAvg.toFixed(2)}€
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-black bg-cyan-500/20 text-cyan-800 dark:text-cyan-200">
              Margem Média {calculation.overallMarginAvgPct}%
            </span>
            <span className="text-[11px] text-cyan-700 dark:text-cyan-300/80 font-semibold">
              Estimativa mais provável
            </span>
          </div>

          <span className="text-[10px] text-cyan-900/70 dark:text-cyan-300/70 mt-2 block leading-snug">
            Média ponderada do lucro das {calculation.totalUnits} peças encomendadas.
          </span>
        </div>

        {/* 3. Lucro Máximo Esperado */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lucro Máximo Esperado
            </span>
            <span
              className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
              title="Melhor cenário de produção (custo mínimo cobrado pela fábrica)"
            >
              <TrendingUp size={16} />
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {calculation.totalProfitMax.toFixed(2)}€
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              Margem {calculation.overallMarginMaxPct}%
            </span>
            <span className="text-[11px] text-slate-400">Melhor cenário</span>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block leading-snug">
            Possível caso a fábrica pratique o valor mínimo de tabela em quantidade.
          </span>
        </div>

        {/* 4. Total Vendas Contabilizadas */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Volume & Faturação
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              <Package size={16} />
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {calculation.totalRevenue.toFixed(2)}€
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300">
              {calculation.totalUnits} artigos
            </span>
            <span className="text-[11px] text-slate-400">
              {scopedOrders.length} encomendas ({orderScope === 'paid' ? 'pagas' : 'totais'})
            </span>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 block leading-snug">
            Volume bruto de produtos associados ao cálculo de margem.
          </span>
        </div>
      </div>

      {/* Tabela de Produtos, Custos e Margens */}
      <div className="bg-white dark:bg-[#0c1724] p-6 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator size={16} className="text-cyan-500" />
              Tabela de Margens e Lucros por Artigo / Pack ({calculation.items.length})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Valores configurados pelo administrador. Podes alterar qualquer campo de lucro, custo ou patrocínio.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Info size={13} />
              <span>Fórmula: Lucro = Venda - Custo + Patrocínio</span>
            </span>
          </div>
        </div>

        {calculation.items.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Nenhum artigo configurado na tabela de margens
            </p>
            <p className="text-xs text-slate-400 mb-4">
              Podes sincronizar automaticamente com os produtos do catálogo ou adicionar artigos manualmente.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSyncWithProducts}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
              >
                Sincronizar com Catálogo
              </button>
              <button
                type="button"
                onClick={handleAddProduct}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold cursor-pointer"
              >
                Adicionar Artigo Manual
              </button>
            </div>
          </div>
        ) : (
          /* Tabela com suporte a Scroll Horizontal */
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 font-extrabold border-b border-gray-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Produto</th>
                  <th className="py-3 px-3 text-right">Valor Venda</th>
                  <th className="py-3 px-3 text-right">Produção Mín</th>
                  <th className="py-3 px-3 text-right">Produção Máx</th>
                  <th className="py-3 px-3 text-right">Patrocínio</th>
                  <th className="py-3 px-3 text-right bg-amber-500/5 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                    Lucro Mín
                  </th>
                  <th className="py-3 px-3 text-right bg-cyan-500/5 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 font-black">
                    Lucro Médio
                  </th>
                  <th className="py-3 px-3 text-right bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300">
                    Lucro Máx
                  </th>
                  <th className="py-3 px-3 text-center">Unidades</th>
                  <th className="py-3 px-3 text-right font-black">Lucro Esperado Total</th>
                  {isEditing && <th className="py-3 px-3 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-medium">
                {calculation.items.map((item, idx) => {
                  const isPack =
                    item.product_name.toLowerCase().includes('pacote') ||
                    item.product_name.toLowerCase().includes('pack') ||
                    item.product_name.toLowerCase().includes('triplo');

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Produto */}
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.product_name}
                            onChange={(e) =>
                              handleMarginChange(idx, 'product_name', e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="truncate">{item.product_name}</span>
                            {isPack && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-[10px] font-black uppercase">
                                Pack
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Valor Venda */}
                      <td className="py-3 px-3 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={item.sale_price}
                            onChange={(e) =>
                              handleMarginChange(idx, 'sale_price', e.target.value)
                            }
                            className="w-20 px-2 py-1 text-xs text-right rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        ) : (
                          <span>{item.sale_price.toFixed(2)}€</span>
                        )}
                      </td>

                      {/* Produção Mín */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={item.cost_min}
                            onChange={(e) =>
                              handleMarginChange(idx, 'cost_min', e.target.value)
                            }
                            className="w-20 px-2 py-1 text-xs text-right rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        ) : (
                          <span>{item.cost_min.toFixed(2)}€</span>
                        )}
                      </td>

                      {/* Produção Máx */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={item.cost_max}
                            onChange={(e) =>
                              handleMarginChange(idx, 'cost_max', e.target.value)
                            }
                            className="w-20 px-2 py-1 text-xs text-right rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        ) : (
                          <span>{item.cost_max.toFixed(2)}€</span>
                        )}
                      </td>

                      {/* Patrocínio */}
                      <td className="py-3 px-3 text-right font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={item.sponsorship}
                            onChange={(e) =>
                              handleMarginChange(idx, 'sponsorship', e.target.value)
                            }
                            className="w-16 px-2 py-1 text-xs text-right rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                          />
                        ) : item.sponsorship > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            +{item.sponsorship.toFixed(2)}€
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Lucro Mín (Editável) */}
                      <td className="py-3 px-3 text-right font-mono bg-amber-500/5 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-bold">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.25"
                            value={item.profit_min}
                            onChange={(e) =>
                              handleMarginChange(idx, 'profit_min', e.target.value)
                            }
                            className="w-20 px-2 py-1 text-xs text-right rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-mono font-bold text-amber-700 dark:text-amber-300"
                          />
                        ) : (
                          <span>{item.profit_min.toFixed(2)}€</span>
                        )}
                      </td>

                      {/* Lucro Médio (Calculado automaticamente) */}
                      <td className="py-3 px-3 text-right font-mono bg-cyan-500/5 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 font-black">
                        <span>{item.profit_avg.toFixed(2)}€</span>
                      </td>

                      {/* Lucro Máx (Editável) */}
                      <td className="py-3 px-3 text-right font-mono bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.25"
                            value={item.profit_max}
                            onChange={(e) =>
                              handleMarginChange(idx, 'profit_max', e.target.value)
                            }
                            className="w-20 px-2 py-1 text-xs text-right rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 font-mono font-bold text-emerald-700 dark:text-emerald-300"
                          />
                        ) : (
                          <span>{item.profit_max.toFixed(2)}€</span>
                        )}
                      </td>

                      {/* Unidades Vendidas */}
                      <td className="py-3 px-3 text-center font-bold">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono ${
                            item.units > 0
                              ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-black'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.units} un.
                        </span>
                      </td>

                      {/* Subtotal de Lucro */}
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                        {item.units > 0 ? (
                          <div>
                            <div className="text-cyan-600 dark:text-cyan-400">
                              {item.subProfitAvg.toFixed(2)}€
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              ({item.subProfitMin.toFixed(2)}€ ~ {item.subProfitMax.toFixed(2)}€)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">0.00€</span>
                        )}
                      </td>

                      {/* Ações em Modo de Edição */}
                      {isEditing && (
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRecalculateFormula(idx)}
                              className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
                              title="Recalcular Lucro pela Fórmula (Venda - Custo + Patrocínio)"
                            >
                              <Calculator size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(idx)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                              title="Remover este artigo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {/* Linha Consolidada de Totais */}
                <tr className="bg-slate-100/80 dark:bg-slate-900 font-black border-t-2 border-gray-200 dark:border-slate-700">
                  <td className="py-3 px-3 text-slate-900 dark:text-white font-black">
                    Total Consolidado
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-900 dark:text-white">
                    —
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                  <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-950/20">
                    {calculation.totalProfitMin.toFixed(2)}€
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/5 dark:bg-cyan-950/20 text-sm">
                    {calculation.totalProfitAvg.toFixed(2)}€
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-950/20">
                    {calculation.totalProfitMax.toFixed(2)}€
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-cyan-600 dark:text-cyan-400">
                    {calculation.totalUnits} un.
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-cyan-600 dark:text-cyan-400 text-sm">
                    {calculation.totalProfitAvg.toFixed(2)}€
                  </td>
                  {isEditing && <td className="py-3 px-3 text-center">—</td>}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Dica / Explicação dos Valores */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <HelpCircle size={14} className="text-cyan-500" />
            Como funcionam as margens de lucro?
          </p>
          <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
            <li>
              <strong>Totalmente Configurável:</strong> Nenhum valor financeiro ou custo fica gravado no repositório público do GitHub. Todas as margens são gravadas e mantidas na tua base de dados privada.
            </li>
            <li>
              <strong>Lucro Mínimo:</strong> Pior cenário com custo máximo de produção cobrado pela confeção (<span className="font-mono">Venda - Produção Máx + Patrocínio</span>).
            </li>
            <li>
              <strong>Lucro Médio:</strong> Ponto médio entre o retorno mínimo e máximo (<span className="font-mono">(Lucro Mín + Lucro Máx) / 2</span>), ponderado pela quantidade vendida de cada produto.
            </li>
            <li>
              <strong>Lucro Máximo:</strong> Melhor cenário com custo mínimo de produção cobrado pela confeção (<span className="font-mono">Venda - Produção Mín + Patrocínio</span>).
            </li>
            <li>
              Podes usar o botão <strong>"Importar / Exportar"</strong> para fazer backup da configuração no teu computador ou colar diretamente os valores em formato JSON.
            </li>
          </ul>
        </div>
      </div>

      {/* Modal Importar / Exportar JSON */}
      {isImportExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#0c1724] border border-gray-200 dark:border-cyan-950 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileJson size={18} className="text-cyan-500" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Importar / Exportar Margens (JSON)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsImportExportOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Copia a configuração para guardar uma cópia no teu computador, ou cola aqui um JSON para carregar os teus artigos e margens privadas de uma só vez:
            </p>

            {jsonError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
                {jsonError}
              </div>
            )}

            <textarea
              rows={10}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-3 font-mono text-xs rounded-xl border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder='[ { "id": "exemplo", "product_name": "Artigo Exemplo", "sale_price": 20, "cost_min": 10, "cost_max": 12, "sponsorship": 0, "profit_min": 8, "profit_max": 10 } ]'
            />

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                <Copy size={14} />
                <span>Copiar JSON</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportExportOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleApplyImportJson}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/30 cursor-pointer disabled:opacity-50"
                >
                  <Upload size={14} />
                  <span>{saving ? 'A aplicar...' : 'Importar & Guardar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

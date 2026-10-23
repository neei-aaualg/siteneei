import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Edit3,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Upload,
  Copy,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  ProductProfitMargin,
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

  // Modo de exibição: Lucro Fixo vs Intervalo (Mín/Máx)
  const [profitMode, setProfitMode] = useState<'fixed' | 'range'>('fixed');

  // Filtro de encomendas: pagas vs todas
  const [orderScope, setOrderScope] = useState<'paid' | 'all'>('paid');

  // Modal de Importar / Exportar JSON
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Carregar dados da BD
  useEffect(() => {
    let isMounted = true;
    const loadMargins = async () => {
      try {
        setLoading(true);
        const data = await fetchShopProfitMargins(token);
        if (isMounted) {
          const list = data.margins || [];
          setMargins(list);
          setEditedMargins(list);

          // Se algum item tiver lucro mínimo diferente de máximo, ativa modo intervalo
          const hasRange = list.some(
            (m) => Number(m.profit_min || 0) !== Number(m.profit_max || 0)
          );
          if (hasRange) {
            setProfitMode('range');
          }
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

  // Encomendas a contabilizar
  const scopedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.order_status === 'test') return false;
      if (orderScope === 'paid') {
        return o.payment_status === 'paid';
      }
      return o.payment_status === 'paid' || o.payment_status === 'pending';
    });
  }, [orders, orderScope]);

  // Correspondência de encomenda a artigo
  const matchOrder = (order: ShopOrder, marginList: ProductProfitMargin[]) => {
    if (!marginList || marginList.length === 0) return null;

    const rawItemName = (order.item_name || '').toLowerCase().trim();
    const rawCampaignId = (order.campaign_id || '').toLowerCase().trim();

    for (const m of marginList) {
      if (m.id.toLowerCase() === rawCampaignId || m.id.toLowerCase() === rawItemName) {
        return m;
      }
      const mName = m.product_name.toLowerCase().trim();
      if (mName === rawItemName) {
        return m;
      }
    }

    for (const m of marginList) {
      const mName = m.product_name.toLowerCase().trim();
      if (rawItemName.includes(mName) || mName.includes(rawItemName)) {
        return m;
      }
    }

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

    const orderPrice = Number(order.item_price || 0);
    if (orderPrice > 0) {
      const priceMatch = marginList.find(
        (m) => Math.abs(Number(m.sale_price) - orderPrice) < 0.05
      );
      if (priceMatch) return priceMatch;
    }

    return marginList[0] || null;
  };

  const currentList = isEditing ? editedMargins : margins;

  // Cálculos consolidados
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
      const profitMax = Number(m.profit_max !== undefined ? m.profit_max : profitMin) || 0;
      const profitAvg = Number(((profitMin + profitMax) / 2).toFixed(2));

      const subRevenue = Number((units * salePrice).toFixed(2));
      const subProfitMin = Number((units * profitMin).toFixed(2));
      const subProfitMax = Number((units * profitMax).toFixed(2));
      const subProfitAvg = Number((units * profitAvg).toFixed(2));

      totalUnits += units;
      totalRevenue += subRevenue;
      totalProfitMin += subProfitMin;
      totalProfitMax += subProfitMax;

      return {
        ...m,
        profit_min: profitMin,
        profit_max: profitMax,
        profit_avg: profitAvg,
        units,
        subRevenue,
        subProfitMin,
        subProfitMax,
        subProfitAvg,
      };
    });

    const totalProfitAvg = Number(((totalProfitMin + totalProfitMax) / 2).toFixed(2));
    const overallMarginAvgPct =
      totalRevenue > 0 ? Number(((totalProfitAvg / totalRevenue) * 100).toFixed(1)) : 0;

    return {
      items,
      totalUnits,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalProfitMin: Number(totalProfitMin.toFixed(2)),
      totalProfitMax: Number(totalProfitMax.toFixed(2)),
      totalProfitAvg,
      overallMarginAvgPct,
    };
  }, [currentList, scopedOrders]);

  // Alteração de campos em edição
  const handleItemChange = (
    index: number,
    field: 'product_name' | 'sale_price' | 'profit_fixed' | 'profit_min' | 'profit_max',
    value: string
  ) => {
    setEditedMargins((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };

      if (field === 'product_name') {
        item.product_name = value;
      } else if (field === 'sale_price') {
        item.sale_price = parseFloat(value) || 0;
      } else if (field === 'profit_fixed') {
        // No modo fixo, define min e max com o mesmo valor
        const num = parseFloat(value) || 0;
        item.profit_min = num;
        item.profit_max = num;
      } else if (field === 'profit_min') {
        item.profit_min = parseFloat(value) || 0;
      } else if (field === 'profit_max') {
        item.profit_max = parseFloat(value) || 0;
      }

      copy[index] = item;
      return copy;
    });
  };

  const handleAddProduct = () => {
    const newId = `artigo-${Date.now().toString().slice(-4)}`;
    const newItem: ProductProfitMargin = {
      id: newId,
      product_name: 'Novo Artigo',
      sale_price: 0,
      profit_min: 0,
      profit_max: 0,
      display_order: editedMargins.length + 1,
    };
    setEditedMargins((prev) => [...prev, newItem]);
    if (!isEditing) setIsEditing(true);
  };

  const handleRemoveProduct = (index: number) => {
    setEditedMargins((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback(null);
      const res = await updateShopProfitMargins(token, editedMargins);
      setMargins(res.margins);
      setEditedMargins(res.margins);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Margens guardadas com sucesso!' });
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao guardar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedMargins([...margins]);
    setIsEditing(false);
    setFeedback(null);
  };

  const handleSyncWithProducts = async () => {
    if (!window.confirm('Sincronizar a lista com os artigos registados no catálogo da loja?')) {
      return;
    }
    try {
      setSaving(true);
      setFeedback(null);
      const res = await resetShopProfitMargins(token);
      setMargins(res.margins);
      setEditedMargins(res.margins);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Artigos sincronizados com a loja!' });
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao sincronizar.' });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenImportExport = () => {
    // Formato exportado simples e limpo
    const exportData = margins.map((m) => {
      const isFixed = Number(m.profit_min || 0) === Number(m.profit_max || 0);
      if (isFixed) {
        return {
          id: m.id,
          product_name: m.product_name,
          profit: Number(m.profit_min || 0),
        };
      }
      return {
        id: m.id,
        product_name: m.product_name,
        profit_min: Number(m.profit_min || 0),
        profit_max: Number(m.profit_max || 0),
      };
    });
    setJsonText(JSON.stringify(exportData, null, 2));
    setJsonError(null);
    setIsImportExportOpen(true);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    alert('JSON copiado!');
  };

  const handleApplyImportJson = async () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('O JSON deve ser um array de artigos: [ { ... } ]');
      }

      setSaving(true);
      const res = await updateShopProfitMargins(token, parsed);
      setMargins(res.margins);
      setEditedMargins(res.margins);
      setIsImportExportOpen(false);
      setFeedback({ type: 'success', message: 'Margens importadas com sucesso!' });
      if (onRefreshStats) onRefreshStats();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setJsonError(err.message || 'Erro ao processar JSON.');
    } finally {
      setSaving(false);
    }
  };

  const hasRangeProfit = calculation.totalProfitMin !== calculation.totalProfitMax;

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="bg-white dark:bg-[#0c1724] p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-cyan-600 dark:text-cyan-400" />
            Margens de Lucro da Loja
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define o lucro pretendido por artigo. Os valores são privados e guardados na tua base de dados.
          </p>
        </div>

        {/* Controlos e Ações */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Alternador de Modo: Fixo vs Intervalo */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 p-1 text-xs border border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setProfitMode('fixed')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                profitMode === 'fixed'
                  ? 'bg-white dark:bg-[#0c1724] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Lucro Fixo
            </button>
            <button
              type="button"
              onClick={() => setProfitMode('range')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                profitMode === 'range'
                  ? 'bg-white dark:bg-[#0c1724] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Intervalo (Mín/Máx)
            </button>
          </div>

          {/* Filtro Encomendas */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 p-1 text-xs border border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setOrderScope('paid')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                orderScope === 'paid'
                  ? 'bg-white dark:bg-[#0c1724] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Pagas ({orders.filter((o) => o.payment_status === 'paid' && o.order_status !== 'test').length})
            </button>
            <button
              type="button"
              onClick={() => setOrderScope('all')}
              className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                orderScope === 'all'
                  ? 'bg-white dark:bg-[#0c1724] text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Todas ({orders.filter((o) => o.order_status !== 'test').length})
            </button>
          </div>

          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Edit3 size={14} />
                <span>Editar Lucro</span>
              </button>

              <button
                type="button"
                onClick={handleOpenImportExport}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                title="Copiar ou colar lista em JSON"
              >
                <FileJson size={13} />
                <span>Importar / Exportar</span>
              </button>

              <button
                type="button"
                onClick={handleSyncWithProducts}
                disabled={saving}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer disabled:opacity-50"
                title="Sincronizar com catálogo"
              >
                <RefreshCw size={14} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save size={14} />
                <span>{saving ? 'A guardar...' : 'Guardar'}</span>
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleAddProduct}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 text-xs font-medium cursor-pointer hover:bg-cyan-100"
              >
                <Plus size={13} />
                <span>Artigo</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={15} className="shrink-0" />
          ) : (
            <AlertCircle size={15} className="shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 3 Cartões Simples de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Lucro Previsto */}
        <div className="bg-white dark:bg-[#0c1724] p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Lucro Previsto
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {!hasRangeProfit
              ? `${calculation.totalProfitAvg.toFixed(2)}€`
              : `${calculation.totalProfitMin.toFixed(2)}€ – ${calculation.totalProfitMax.toFixed(2)}€`}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
            {hasRangeProfit
              ? `Média estimada: ${calculation.totalProfitAvg.toFixed(2)}€ (${calculation.overallMarginAvgPct}%)`
              : `Margem sobre vendas: ${calculation.overallMarginAvgPct}%`}
          </span>
        </div>

        {/* Artigos Vendidos */}
        <div className="bg-white dark:bg-[#0c1724] p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Artigos Vendidos
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {calculation.totalUnits} un.
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
            {scopedOrders.length} encomendas consideradas
          </span>
        </div>

        {/* Faturação Bruta */}
        <div className="bg-white dark:bg-[#0c1724] p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Faturação Total
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {calculation.totalRevenue.toFixed(2)}€
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
            Total bruto das peças
          </span>
        </div>
      </div>

      {/* Tabela Simples */}
      <div className="bg-white dark:bg-[#0c1724] rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">A carregar margens...</div>
        ) : calculation.items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-3">
            <p>Nenhum artigo configurado.</p>
            <button
              type="button"
              onClick={handleSyncWithProducts}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
            >
              Sincronizar com Catálogo da Loja
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-gray-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Artigo</th>
                  <th className="py-2.5 px-3 text-right">Preço Venda</th>

                  {profitMode === 'fixed' ? (
                    <th className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-white">
                      Lucro / Peça (€)
                    </th>
                  ) : (
                    <>
                      <th className="py-2.5 px-3 text-right">Lucro Mín (€)</th>
                      <th className="py-2.5 px-3 text-right">Lucro Máx (€)</th>
                      <th className="py-2.5 px-3 text-right">Média (€)</th>
                    </>
                  )}

                  <th className="py-2.5 px-3 text-center">Vendas</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-800 dark:text-white">
                    Lucro Total
                  </th>
                  {isEditing && <th className="py-2.5 px-3 text-center w-12">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {calculation.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    {/* Nome do Artigo */}
                    <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      ) : (
                        item.product_name
                      )}
                    </td>

                    {/* Preço de Venda */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.sale_price}
                          onChange={(e) => handleItemChange(idx, 'sale_price', e.target.value)}
                          className="w-20 px-2 py-1 text-xs text-right rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      ) : (
                        `${item.sale_price.toFixed(2)}€`
                      )}
                    </td>

                    {/* Colunas de Lucro Conforme o Modo */}
                    {profitMode === 'fixed' ? (
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.25"
                            value={item.profit_min}
                            onChange={(e) =>
                              handleItemChange(idx, 'profit_fixed', e.target.value)
                            }
                            className="w-20 px-2 py-1 text-xs text-right rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                          />
                        ) : (
                          `${item.profit_avg.toFixed(2)}€`
                        )}
                      </td>
                    ) : (
                      <>
                        {/* Lucro Mín */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.25"
                              value={item.profit_min}
                              onChange={(e) =>
                                handleItemChange(idx, 'profit_min', e.target.value)
                              }
                              className="w-18 px-2 py-1 text-xs text-right rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                            />
                          ) : (
                            `${item.profit_min.toFixed(2)}€`
                          )}
                        </td>

                        {/* Lucro Máx */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          {isEditing ? (
                            <input
                              type="number"
                              step="0.25"
                              value={item.profit_max}
                              onChange={(e) =>
                                handleItemChange(idx, 'profit_max', e.target.value)
                              }
                              className="w-18 px-2 py-1 text-xs text-right rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                            />
                          ) : (
                            `${item.profit_max.toFixed(2)}€`
                          )}
                        </td>

                        {/* Média */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500 dark:text-slate-400">
                          {item.profit_avg.toFixed(2)}€
                        </td>
                      </>
                    )}

                    {/* Vendas */}
                    <td className="py-2.5 px-3 text-center font-mono">
                      {item.units > 0 ? (
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.units} un.
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    {/* Lucro Total */}
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {profitMode === 'fixed' || item.subProfitMin === item.subProfitMax ? (
                        `${item.subProfitAvg.toFixed(2)}€`
                      ) : (
                        <span>
                          {item.subProfitMin.toFixed(2)}€ – {item.subProfitMax.toFixed(2)}€
                        </span>
                      )}
                    </td>

                    {/* Ações em Edição */}
                    {isEditing && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                          title="Remover artigo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {/* Linha de Totais */}
                <tr className="bg-slate-50/80 dark:bg-slate-900/60 font-bold border-t border-gray-200 dark:border-slate-800">
                  <td className="py-3 px-4 text-slate-900 dark:text-white">Total</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                  {profitMode === 'fixed' ? (
                    <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                  ) : (
                    <>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                    </>
                  )}
                  <td className="py-3 px-3 text-center font-mono text-slate-900 dark:text-white">
                    {calculation.totalUnits} un.
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {!hasRangeProfit
                      ? `${calculation.totalProfitAvg.toFixed(2)}€`
                      : `${calculation.totalProfitMin.toFixed(2)}€ – ${calculation.totalProfitMax.toFixed(2)}€`}
                  </td>
                  {isEditing && <td className="py-3 px-3 text-center">—</td>}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Importar / Exportar JSON */}
      {isImportExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#0c1724] border border-gray-200 dark:border-slate-800 rounded-xl p-5 max-w-lg w-full space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileJson size={16} className="text-cyan-600 dark:text-cyan-400" />
                Importar / Exportar Margens
              </h4>
              <button
                type="button"
                onClick={() => setIsImportExportOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Podes colar aqui um JSON com o lucro por artigo para carregar rapidamente os teus valores:
            </p>

            {jsonError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
                {jsonError}
              </div>
            )}

            <textarea
              rows={9}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full p-2.5 font-mono text-xs rounded-lg border border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
              placeholder={`[\n  { "id": "sweat", "product_name": "Sweat", "profit": 3.0 },\n  { "id": "casaco", "product_name": "Casaco", "profit_min": 2.0, "profit_max": 3.5 }\n]`}
            />

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyJson}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
              >
                <Copy size={13} />
                <span>Copiar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportExportOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleApplyImportJson}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <Upload size={13} />
                  <span>{saving ? 'A aplicar...' : 'Importar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

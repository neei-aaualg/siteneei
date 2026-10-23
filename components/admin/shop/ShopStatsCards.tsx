import React, { useState } from 'react';
import { ShoppingBag, MapPin, Truck, FileSpreadsheet, Download, Layers, Shirt, TrendingUp, ArrowRight } from 'lucide-react';
import { ShopSummaryStats, SweatSize, getColorHex } from '../../../types/shop';

interface ShopStatsCardsProps {
  stats: ShopSummaryStats | null;
  onDownloadCsv?: () => void;
  showSizeBreakdown?: boolean;
  onOpenProfitPanel?: () => void;
}

const STANDARD_SIZES: SweatSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export const ShopStatsCards: React.FC<ShopStatsCardsProps> = ({
  stats,
  onDownloadCsv,
  showSizeBreakdown = false,
  onOpenProfitPanel,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Determinar produto ativo e tamanhos a exibir
  const activeProduct =
    selectedProduct !== 'all' && stats?.byProduct
      ? stats.byProduct.find((p) => p.itemName === selectedProduct) || null
      : null;

  const activeSizeCounts: Record<string, number> = activeProduct
    ? (activeProduct.sizeCounts as Record<string, number>) || {}
    : (stats?.sizeCounts as Record<string, number>) || {};

  // Descobrir se há tamanhos adicionais para além do standard (ex: Único)
  const extraSizes = Object.keys(activeSizeCounts).filter(
    (sz) => !STANDARD_SIZES.includes(sz as SweatSize) && (activeSizeCounts[sz] || 0) > 0
  );
  const displayedSizes = [...STANDARD_SIZES, ...extraSizes];

  const totalArticlesCount = stats ? (stats.totalItems ?? stats.totalPaidOrders) : 0;
  const activeUnitsCount = activeProduct ? activeProduct.totalUnits : totalArticlesCount;

  return (
    <div className="space-y-6">
      {/* Cartões de Resumo e Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Faturado */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Total Faturado (Pago)
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
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

        {/* Total Artigos Pagos */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Artigos a Produzir
            </span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <ShoppingBag size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-2">
            {totalArticlesCount}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {totalArticlesCount} artigos em {stats?.totalPaidOrders || 0} encomendas pagas
          </span>
        </div>

        {/* Levantamento Gabinete */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Levantamento Gabinete
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MapPin size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {stats?.pickupCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Levantamento no Gabinete NEEI
          </span>
        </div>

        {/* Envio CTT */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              Envio CTT Nacional
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Truck size={16} />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {stats?.shippingCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Envio por correio postal
          </span>
        </div>
      </div>

      {/* Cartão de Resumo de Lucro Esperado */}
      {stats?.profitSummary && (
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
              <TrendingUp size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Lucro Estimado da Loja
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {stats.profitSummary.totalPaidUnits} artigos pagos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.profitSummary.totalProfitMin === stats.profitSummary.totalProfitMax
                  ? `Margem sobre vendas: ${stats.profitSummary.overallMarginAvgPct}%`
                  : `Média estimada: ${stats.profitSummary.totalProfitAvg.toFixed(2)}€ (${stats.profitSummary.overallMarginAvgPct}% margem)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 self-start md:self-auto">
            {stats.profitSummary.totalProfitMin === stats.profitSummary.totalProfitMax ? (
              <div>
                <span className="text-[10px] uppercase font-medium text-slate-400 block">Lucro Previsto</span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {stats.profitSummary.totalProfitAvg.toFixed(2)}€
                </span>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <span className="text-[10px] uppercase font-medium text-slate-400 block">Mínimo</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-slate-700 dark:text-slate-300">
                    {stats.profitSummary.totalProfitMin.toFixed(2)}€
                  </span>
                </div>
                <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block">Médio</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                    {stats.profitSummary.totalProfitAvg.toFixed(2)}€
                  </span>
                </div>
                <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="text-center">
                  <span className="text-[10px] uppercase font-medium text-slate-400 block">Máximo</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-slate-700 dark:text-slate-300">
                    {stats.profitSummary.totalProfitMax.toFixed(2)}€
                  </span>
                </div>
              </>
            )}

            {onOpenProfitPanel && (
              <button
                type="button"
                onClick={onOpenProfitPanel}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <span>Configurar</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Distribuição por Produtos e Tamanhos para a Fábrica & Botão de Exportação CSV */}
      {showSizeBreakdown && (
        <div className="bg-white dark:bg-[#0c1724] p-6 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="text-cyan-500" size={18} />
                Contagem de Produção para a Fábrica
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Totais consolidados de todos os produtos e artigos pagos e prontos para confeção.
              </p>
            </div>

            {onDownloadCsv && (
              <button
                type="button"
                onClick={onDownloadCsv}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all self-start sm:self-auto cursor-pointer"
              >
                <Download size={16} />
                <span>Exportar para CSV</span>
              </button>
            )}
          </div>

          {/* Filtro por Produto */}
          {stats?.byProduct && stats.byProduct.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedProduct('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedProduct === 'all'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Layers size={13} />
                <span>Todos os Produtos</span>
                <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">
                  {totalArticlesCount}
                </span>
              </button>

              {stats.byProduct.map((p) => (
                <button
                  key={p.itemName}
                  type="button"
                  onClick={() => setSelectedProduct(p.itemName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedProduct === p.itemName
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Shirt size={13} />
                  <span>{p.itemName}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-[10px]">
                    {p.totalUnits}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Cabeçalho da Vista Ativa de Tamanhos */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {activeProduct
                ? `Tamanhos de ${activeProduct.itemName} (${activeUnitsCount} un.)`
                : `Tamanhos Consolidados de Todos os Artigos (${totalArticlesCount} un.)`}
            </span>
          </div>

          {/* Grade de Tamanhos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {displayedSizes.map((sz) => {
              const count = activeSizeCounts[sz] || 0;
              return (
                <div
                  key={sz}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center transition-all hover:border-cyan-500/40"
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

          {/* Cores do Produto Selecionado (se aplicável) */}
          {activeProduct && activeProduct.colorCounts && Object.keys(activeProduct.colorCounts).length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
                Cores encomendadas:
              </span>
              {Object.entries(activeProduct.colorCounts).map(([colorName, colorCount]) => (
                <span
                  key={colorName}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/20"
                    style={{ backgroundColor: getColorHex(colorName) }}
                  />
                  <span>{colorName}:</span>
                  <strong className="text-cyan-600 dark:text-cyan-400">{colorCount} un.</strong>
                </span>
              ))}
            </div>
          )}

          {/* Resumo Comparativo por Produto e Tamanho (Tabela Geral de Confeção) */}
          {stats?.byProduct && stats.byProduct.length > 0 && (
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layers size={14} className="text-cyan-500" />
                  <span>Resumo Comparativo por Artigo / Peça</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Clica num produto para filtrar os tamanhos acima
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-bold border-b border-gray-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Produto / Artigo</th>
                      {STANDARD_SIZES.map((sz) => (
                        <th key={sz} className="py-2.5 px-2 text-center">
                          {sz}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-right">Total Artigos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-medium">
                    {stats.byProduct.map((p) => {
                      const isSelected = selectedProduct === p.itemName;
                      return (
                        <tr
                          key={p.itemName}
                          onClick={() =>
                            setSelectedProduct(isSelected ? 'all' : p.itemName)
                          }
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors ${
                            isSelected ? 'bg-cyan-500/10 dark:bg-cyan-950/30 font-semibold' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isSelected ? 'bg-cyan-500 ring-2 ring-cyan-500/30' : 'bg-slate-400'
                              }`}
                            />
                            <span className="truncate max-w-[240px] sm:max-w-none">{p.itemName}</span>
                          </td>
                          {STANDARD_SIZES.map((sz) => {
                            const count = p.sizeCounts?.[sz] || 0;
                            return (
                              <td
                                key={sz}
                                className={`py-2.5 px-2 text-center ${
                                  count > 0
                                    ? 'text-slate-900 dark:text-white font-bold'
                                    : 'text-slate-400 dark:text-slate-600'
                                }`}
                              >
                                {count}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-3 text-right font-black text-cyan-600 dark:text-cyan-400">
                            {p.totalUnits} un.
                          </td>
                        </tr>
                      );
                    })}

                    {/* Linha Consolidada de Totais */}
                    <tr className="bg-slate-100/70 dark:bg-slate-900 font-bold border-t border-gray-200 dark:border-slate-700">
                      <td className="py-2.5 px-3 text-slate-900 dark:text-white font-black">
                        Total Consolidado
                      </td>
                      {STANDARD_SIZES.map((sz) => {
                        const totalSz = stats.sizeCounts?.[sz] || 0;
                        return (
                          <td
                            key={sz}
                            className="py-2.5 px-2 text-center text-cyan-600 dark:text-cyan-400 font-black"
                          >
                            {totalSz}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-right text-cyan-600 dark:text-cyan-400 font-black">
                        {totalArticlesCount} un.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { ShoppingBag, MapPin, Truck, FileSpreadsheet, Download } from 'lucide-react';
import { ShopSummaryStats, SweatSize } from '../../../types/shop';

interface ShopStatsCardsProps {
  stats: ShopSummaryStats | null;
  onDownloadCsv?: () => void;
  showSizeBreakdown?: boolean;
}

export const ShopStatsCards: React.FC<ShopStatsCardsProps> = ({
  stats,
  onDownloadCsv,
  showSizeBreakdown = false,
}) => {
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

        {/* Total Sweats Pagas */}
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
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

      {/* Distribuição por Tamanhos para a Fábrica & Botão de Exportação CSV */}
      {showSizeBreakdown && (
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
      )}
    </div>
  );
};

import React from 'react';
import {
  Tag,
  Plus,
  Package,
  Image as ImageIcon,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ListPlus,
  Palette,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { ShopCampaign, sortSweatSizes, getColorHex } from '../../../types/shop';

interface ShopProductCatalogProps {
  products: ShopCampaign[];
  onOpenCreate: () => void;
  onOpenEdit: (prod: ShopCampaign) => void;
  onToggleActive: (prod: ShopCampaign) => void;
  onDelete: (prod: ShopCampaign) => void;
  onUpdatePriority?: (prod: ShopCampaign, newPriority: number) => void;
}

export const ShopProductCatalog: React.FC<ShopProductCatalogProps> = ({
  products,
  onOpenCreate,
  onOpenEdit,
  onToggleActive,
  onDelete,
  onUpdatePriority,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0c1724] p-6 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="text-cyan-500" size={18} />
            Catálogo de Produtos à Venda ({products.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Adiciona, edita preços, características/features, prioridade e visibilidade dos artigos.
            <span className="block mt-0.5 text-cyan-600 dark:text-cyan-400 font-semibold">
              Prioridade na Loja: produtos com número 1 aparecem no topo da loja, seguidos de 2, 3, etc.
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/30 transition-all cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={16} />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Grelha de Produtos */}
      {products.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0c1724] rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
          <Package size={36} className="text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum produto registado</p>
          <p className="text-xs text-slate-500 mt-1">Clica no botão "Novo Produto" para adicionar um artigo à loja.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white dark:bg-[#0c1724] border border-gray-200 dark:border-cyan-950/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Imagem do Produto (formato integral sem corte) */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center p-3">
                  {prod.image_url ? (
                    <>
                      <img
                        src={prod.raw_image_url || prod.image_url}
                        alt={prod.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const next = target.nextElementSibling as HTMLElement | null;
                          if (next) next.style.display = 'flex';
                        }}
                      />
                      <div className="hidden items-center justify-center text-slate-600">
                        <ImageIcon size={32} />
                      </div>
                    </>
                  ) : (
                    <ImageIcon size={32} className="text-slate-600" />
                  )}
                  {/* Badge de Prioridade de Exibição */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-950/90 text-cyan-300 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm shadow border border-cyan-500/40 flex items-center gap-1">
                      <ArrowUpDown size={11} className="text-cyan-400" />
                      <span>
                        {prod.display_order && prod.display_order > 0
                          ? `#${prod.display_order} na Loja`
                          : (prod.priority && prod.priority > 0 ? `#${prod.priority} na Loja` : 'Padrão')}
                      </span>
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    {prod.is_active ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-sm shadow">
                        Ativo na Loja
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm shadow">
                        Oculto / Inativo
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-sm border border-cyan-500/30 text-white font-black text-sm flex items-baseline gap-1">
                    <span>{prod.item_price.toFixed(2)}€</span>
                    <span className="text-[10px] font-normal text-cyan-300">(+ taxas)</span>
                  </div>
                </div>

                {/* Detalhes do Produto */}
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-0.5">
                      {prod.category || 'Vestuário'}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{prod.title}</h4>
                    {prod.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {prod.description}
                      </p>
                    )}
                  </div>

                  {/* Nome Gravado no Registo */}
                  <div className="p-2.5 rounded-xl bg-cyan-50/5 dark:bg-cyan-950/30 border border-cyan-500/20 text-xs">
                    <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block mb-0.5">
                      Nome Gravado nas Encomendas
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {prod.item_name}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Portes CTT</span>
                      <span className="font-bold">{prod.shipping_fee.toFixed(2)}€</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Data Limite</span>
                      <span className="font-bold">{prod.deadline_date || 'Sem prazo'}</span>
                    </div>
                  </div>

                  {/* Features / Pontos Fortes */}
                  {prod.features && prod.features.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 mb-1">
                        <ListPlus size={11} />
                        Features / Destaques ({prod.features.length})
                      </span>
                      <ul className="space-y-1">
                        {prod.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                            <span className="line-clamp-1">{f}</span>
                          </li>
                        ))}
                      </ul>
                      {prod.features.length > 4 && (
                        <span className="text-[10px] text-slate-400 block mt-1">
                          +{prod.features.length - 4} mais
                        </span>
                      )}
                    </div>
                  )}

                  {/* Pack / Bundle Items */}
                  {prod.is_bundle ? (
                    <div className="p-2.5 rounded-xl bg-cyan-50/20 dark:bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                          <Package size={12} />
                          Artigos no Pack ({prod.bundle_items?.length || 0})
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-300">
                          Pack
                        </span>
                      </div>
                      <div className="space-y-1">
                        {prod.bundle_items && prod.bundle_items.length > 0 ? (
                          prod.bundle_items.map((bi, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                              <span className="line-clamp-1">{bi.item_name || 'Artigo'}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">Sem artigos configurados</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block pt-0.5 italic">
                        Tamanhos e cores configurados individualmente por peça.
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Tamanhos */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Tamanhos Disponíveis
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {sortSweatSizes(prod.sizes_available).map((sz) => (
                            <span
                              key={sz}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300"
                            >
                              {sz}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Cores Disponíveis */}
                      {prod.colors_available && prod.colors_available.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1 mb-1">
                            <Palette size={11} className="text-cyan-500" />
                            Cores Disponíveis ({prod.colors_available.length})
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {prod.colors_available.map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                              >
                                <span
                                  className="w-2 h-2 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                                  style={{ backgroundColor: getColorHex(c) }}
                                />
                                <span>{c}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Barra de Ajuste Rápido de Prioridade */}
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ArrowUpDown size={12} className="text-cyan-500" />
                  Prioridade na Loja:
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdatePriority?.(prod, Math.max(1, ((prod.display_order ?? prod.priority ?? 0) || 1) - 1))}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500 hover:text-white transition-colors cursor-pointer"
                    title="Aumentar prioridade (mover para mais perto do topo)"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={prod.display_order ?? prod.priority ?? 0}
                    onChange={(e) => onUpdatePriority?.(prod, parseInt(e.target.value, 10) || 0)}
                    className="w-12 text-center py-0.5 px-1 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono font-bold text-xs text-cyan-600 dark:text-cyan-400 focus:outline-none focus:border-cyan-500"
                    title="1 = topo da loja, 2 = segundo, etc. (0 = padrão)"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdatePriority?.(prod, ((prod.display_order ?? prod.priority ?? 0) || 0) + 1)}
                    className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-cyan-500 hover:text-white transition-colors cursor-pointer"
                    title="Diminuir prioridade"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>

              {/* Ações */}
              <div className="p-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onToggleActive(prod)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    prod.is_active
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                  }`}
                  title={prod.is_active ? 'Desativar na loja' : 'Ativar na loja'}
                >
                  {prod.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                  <span>{prod.is_active ? 'Ocultar' : 'Ativar'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenEdit(prod)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit size={13} />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(prod)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Eliminar produto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

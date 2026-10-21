import React, { useMemo, useEffect } from 'react';
import {
  X,
  Plus,
  Tag,
  User,
  ShoppingBag,
  Truck,
  MapPin,
  CreditCard,
  AlertCircle,
  Loader2,
  Package,
  Shirt,
  Check,
} from 'lucide-react';
import {
  SweatSize,
  OrderStatus,
  ShopCampaign,
  getColorHex,
  sortSweatSizes,
  BundleItemSelection,
} from '../../../types/shop';
import { Portal } from '../../Portal';

interface ShopManualOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  manualForm: any;
  setManualForm: React.Dispatch<React.SetStateAction<any>>;
  products: ShopCampaign[];
  districtsList: string[];
  manualCounties: string[];
  creatingOrder: boolean;
  createError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNifChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPostalCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDistrictChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const ShopManualOrderModal: React.FC<ShopManualOrderModalProps> = ({
  isOpen,
  onClose,
  manualForm,
  setManualForm,
  products,
  districtsList,
  manualCounties,
  creatingOrder,
  createError,
  onSubmit,
  onNameChange,
  onPhoneChange,
  onNifChange,
  onPostalCodeChange,
  onDistrictChange,
}) => {
  const selectedProd = products.find((p) => p.id === manualForm.campaign_id);
  const isBundle = Boolean(
    selectedProd?.is_bundle ||
    (selectedProd?.bundle_items && selectedProd.bundle_items.length > 0) ||
    selectedProd?.category === 'Pack'
  );

  const bundleResolvedItems = useMemo(() => {
    if (!isBundle || !selectedProd?.bundle_items) return [];
    return selectedProd.bundle_items.map((bi) => {
      const orig = products.find((p) => p.id === bi.campaign_id);
      return {
        campaign_id: bi.campaign_id,
        item_name: bi.item_name || orig?.item_name || orig?.title || 'Artigo',
        originalCampaign: orig || null,
        sizes_available:
          orig?.sizes_available && orig.sizes_available.length > 0
            ? orig.sizes_available
            : (['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as SweatSize[]),
        colors_available:
          orig?.colors_available && orig.colors_available.length > 0
            ? orig.colors_available
            : ['Preto'],
        color_images: orig?.color_images || {},
        category: orig?.category || 'Vestuário',
        image_url: orig?.raw_image_url || orig?.image_url || '',
        item_price: orig?.item_price || 0,
      };
    });
  }, [isBundle, selectedProd, products]);

  // Sincroniza e garante que bundle_selections tem todas as peças do pack
  useEffect(() => {
    if (isBundle && bundleResolvedItems.length > 0) {
      const existing: BundleItemSelection[] = manualForm.bundle_selections || [];
      const needsInit = bundleResolvedItems.some(
        (item) => !existing.some((e) => e.campaign_id === item.campaign_id)
      );
      if (needsInit || existing.length !== bundleResolvedItems.length) {
        const initialized: BundleItemSelection[] = bundleResolvedItems.map((item) => {
          const found = existing.find((e) => e.campaign_id === item.campaign_id);
          return {
            campaign_id: item.campaign_id,
            item_name: item.item_name,
            size: found?.size || item.sizes_available[0] || 'M',
            color: found?.color || item.colors_available[0] || 'Preto',
          };
        });
        setManualForm((prev: any) => ({ ...prev, bundle_selections: initialized }));
      }
    }
  }, [isBundle, bundleResolvedItems, manualForm.bundle_selections, setManualForm]);

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={onClose}
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

          <form onSubmit={onSubmit} className="space-y-5">
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
                    onChange={onNameChange}
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
                      setManualForm((prev: any) => ({ ...prev, student_email: e.target.value }))
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
                    onChange={onPhoneChange}
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
                    onChange={onNifChange}
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
                <span>2. Artigo e Tamanho</span>
              </h4>

              {products.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Associar a Produto do Catálogo
                  </label>
                  <select
                    value={manualForm.campaign_id}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selected = products.find((p) => p.id === selectedId);
                      if (selected) {
                        const selIsBundle = Boolean(
                          selected.is_bundle ||
                          (selected.bundle_items && selected.bundle_items.length > 0) ||
                          selected.category === 'Pack'
                        );
                        let initialSelections = undefined;
                        if (selIsBundle && selected.bundle_items) {
                          initialSelections = selected.bundle_items.map((bi) => {
                            const orig = products.find((p) => p.id === bi.campaign_id);
                            return {
                              campaign_id: bi.campaign_id,
                              item_name: bi.item_name || orig?.item_name || orig?.title || 'Artigo',
                              size: orig?.sizes_available?.[0] || 'M',
                              color: orig?.colors_available?.[0] || 'Preto',
                            };
                          });
                        }
                        setManualForm((prev: any) => ({
                          ...prev,
                          campaign_id: selected.id,
                          item_name: selected.item_name,
                          item_price: selected.item_price,
                          shipping_fee: selected.shipping_fee,
                          bundle_selections: initialSelections,
                        }));
                      } else {
                        setManualForm((prev: any) => ({
                          ...prev,
                          campaign_id: '',
                          bundle_selections: undefined,
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">(Personalizado / Sem catálogo associado)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.item_name} ({p.item_price.toFixed(2)}€) {!p.is_active ? '— [Inativo]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Artigo (gravado permanentemente na encomenda) *
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.item_name}
                  onChange={(e) =>
                    setManualForm((prev: any) => ({ ...prev, item_name: e.target.value }))
                  }
                  placeholder="Sweat Oficial Engenharia Informática"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Este nome fica registado para a fábrica e histórico mesmo se o produto for alterado depois.
                </p>
              </div>

              {/* Se for Pack, permite configurar cada artigo individual com preview, tamanhos e cores */}
              {isBundle ? (
                <div className="space-y-3.5 p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                        <Package size={17} />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-cyan-950 dark:text-cyan-100 flex items-center gap-1.5">
                          <span>Artigos Incluídos no Pack ({bundleResolvedItems.length} peças)</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                            Pack
                          </span>
                        </h5>
                        <p className="text-[11px] text-cyan-800/80 dark:text-cyan-300/80">
                          Escolhe o tamanho e a cor pretendidos para cada peça deste pack:
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {bundleResolvedItems.map((item, idx) => {
                      const curSel =
                        (manualForm.bundle_selections || []).find(
                          (b: BundleItemSelection) => b.campaign_id === item.campaign_id
                        ) || {
                          size: item.sizes_available[0] || 'M',
                          color: item.colors_available[0] || 'Preto',
                        };

                      return (
                        <div
                          key={item.campaign_id}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center p-0.5 overflow-hidden">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.item_name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Shirt size={16} className="text-cyan-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 block truncate">
                                Peça {idx + 1} · {item.category}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block">
                                {item.item_name}
                              </span>
                            </div>
                          </div>

                          {/* Seleção de Tamanho para este item */}
                          <div>
                            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Tamanho: <strong className="text-cyan-600 dark:text-cyan-400">{curSel.size}</strong>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {sortSweatSizes(item.sizes_available).map((sz) => {
                                const isSel = curSel.size === sz;
                                return (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => {
                                      setManualForm((prev: any) => {
                                        const current = prev.bundle_selections || [];
                                        const updated = current.some((b: any) => b.campaign_id === item.campaign_id)
                                          ? current.map((b: any) =>
                                              b.campaign_id === item.campaign_id ? { ...b, size: sz } : b
                                            )
                                          : [
                                              ...current,
                                              {
                                                campaign_id: item.campaign_id,
                                                item_name: item.item_name,
                                                size: sz,
                                                color: curSel.color || 'Preto',
                                              },
                                            ];
                                        return { ...prev, bundle_selections: updated };
                                      });
                                    }}
                                    className={`py-1 px-2.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                      isSel
                                        ? 'bg-cyan-600 text-white border-cyan-500 shadow-xs'
                                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50'
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Seleção de Cor para este item */}
                          <div>
                            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Cor: <strong className="text-cyan-600 dark:text-cyan-400">{curSel.color}</strong>
                            </div>
                            <input
                              type="text"
                              value={curSel.color || ''}
                              onChange={(e) => {
                                const newColor = e.target.value;
                                setManualForm((prev: any) => {
                                  const current = prev.bundle_selections || [];
                                  const updated = current.some((b: any) => b.campaign_id === item.campaign_id)
                                    ? current.map((b: any) =>
                                        b.campaign_id === item.campaign_id ? { ...b, color: newColor } : b
                                      )
                                    : [
                                        ...current,
                                        {
                                          campaign_id: item.campaign_id,
                                          item_name: item.item_name,
                                          size: curSel.size || 'M',
                                          color: newColor,
                                        },
                                      ];
                                  return { ...prev, bundle_selections: updated };
                                });
                              }}
                              placeholder="Preto, Azul, Branco..."
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                            />
                            {item.colors_available.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {item.colors_available.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => {
                                      setManualForm((prev: any) => {
                                        const current = prev.bundle_selections || [];
                                        const updated = current.some((b: any) => b.campaign_id === item.campaign_id)
                                          ? current.map((b: any) =>
                                              b.campaign_id === item.campaign_id ? { ...b, color: c } : b
                                            )
                                          : [
                                              ...current,
                                              {
                                                campaign_id: item.campaign_id,
                                                item_name: item.item_name,
                                                size: curSel.size || 'M',
                                                color: c,
                                              },
                                            ];
                                        return { ...prev, bundle_selections: updated };
                                      });
                                    }}
                                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                      curSel.color === c
                                        ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/50 font-bold'
                                        : 'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-cyan-500/30'
                                    }`}
                                  >
                                    <span
                                      className="w-2 h-2 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                                      style={{ backgroundColor: getColorHex(c) }}
                                    />
                                    <span>{c}</span>
                                    {curSel.color === c && <Check size={10} className="text-cyan-500" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                      Tamanho da Peça *
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {(['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as SweatSize[]).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setManualForm((prev: any) => ({ ...prev, size: sz }))}
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

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Cor
                    </label>
                    <input
                      type="text"
                      value={manualForm.color}
                      onChange={(e) =>
                        setManualForm((prev: any) => ({ ...prev, color: e.target.value }))
                      }
                      placeholder="Preto"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                    {/* Atalhos de cores do artigo selecionado */}
                    {(() => {
                      if (!selectedProd?.colors_available || selectedProd.colors_available.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {selectedProd.colors_available.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setManualForm((prev: any) => ({ ...prev, color: c }))}
                              className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                manualForm.color === c
                                  ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/50 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-cyan-500/30'
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                                style={{ backgroundColor: getColorHex(c) }}
                              />
                              <span>{c}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* Preço do Artigo / Pack */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {isBundle ? 'Preço Total do Pack (€)' : 'Preço da Peça (€)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualForm.item_price}
                  onChange={(e) =>
                    setManualForm((prev: any) => ({ ...prev, item_price: parseFloat(e.target.value) || 0 }))
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
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
                  onClick={() => setManualForm((prev: any) => ({ ...prev, delivery_type: 'pickup' }))}
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
                  onClick={() => setManualForm((prev: any) => ({ ...prev, delivery_type: 'shipping' }))}
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
                        setManualForm((prev: any) => ({ ...prev, shipping_address: e.target.value }))
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
                        onChange={onPostalCodeChange}
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
                        onChange={onDistrictChange}
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
                          setManualForm((prev: any) => ({ ...prev, shipping_county: e.target.value }))
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

            {/* 4. Estado Operacional */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Check size={13} className="text-cyan-500" />
                <span>4. Estado Operacional</span>
              </h4>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Estado Operacional da Encomenda
                </label>
                <select
                  value={manualForm.order_status}
                  onChange={(e) =>
                    setManualForm((prev: any) => ({
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

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notas Internas do Administrador (opcional)
                </label>
                <input
                  type="text"
                  value={manualForm.admin_notes}
                  onChange={(e) =>
                    setManualForm((prev: any) => ({ ...prev, admin_notes: e.target.value }))
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
                    setManualForm((prev: any) => ({ ...prev, send_email: e.target.checked }))
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
                onClick={onClose}
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
  );
};

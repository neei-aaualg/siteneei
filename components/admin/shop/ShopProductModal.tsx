import React, { useState } from 'react';
import {
  X,
  Edit,
  Plus,
  Tag,
  CreditCard,
  Truck,
  AlertCircle,
  Loader2,
  Check,
  ListPlus,
  Trash2,
  Palette,
  Ruler,
  RotateCcw,
  Package,
  ArrowUpDown,
} from 'lucide-react';
import {
  ShopCampaign,
  SweatSize,
  ProductFormData,
  ORDERED_SWEAT_SIZES,
  DEFAULT_PRESET_COLORS,
  DEFAULT_SIZE_GUIDE,
  getColorHex,
  SizeMeasurement,
} from '../../../types/shop';
import { Portal } from '../../Portal';

interface ShopProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ShopCampaign | null;
  productForm: ProductFormData;
  setProductForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
  handleToggleSize: (sz: SweatSize) => void;
  onSubmit: (e: React.FormEvent) => void;
  savingProduct: boolean;
  productError: string | null;
  availableProducts?: ShopCampaign[];
}

const FEATURE_SUGGESTIONS = [
  '80% Algodão cardado / 20% Poliéster (320g/m²)',
  'Bordado de alta definição NEEI · Engenharia Informática',
  'Edição Oficial Limitada 2026',
  'Interior cardado térmico de alto conforto',
  'Recolha no Campus de Gambelas ou Envio CTT',
  'Costuras reforçadas de dupla agulha',
];

export const ShopProductModal: React.FC<ShopProductModalProps> = ({
  isOpen,
  onClose,
  editingProduct,
  productForm,
  setProductForm,
  handleToggleSize,
  onSubmit,
  savingProduct,
  productError,
  availableProducts = [],
}) => {
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newColorText, setNewColorText] = useState('');

  if (!isOpen) return null;

  const isClothing = (productForm.category || 'Vestuário').trim().toLowerCase() === 'vestuário';

  const eligibleProducts = (availableProducts || []).filter(
    (p) => !p.is_bundle && p.id !== editingProduct?.id
  );

  const bundleItemConfigs = productForm.bundle_items || [];

  const handleToggleBundleItem = (campaignId: string) => {
    const targetProduct = eligibleProducts.find((p) => p.id === campaignId);
    const exists = bundleItemConfigs.some((b) => b.campaign_id === campaignId);
    if (exists) {
      setProductForm((prev) => ({
        ...prev,
        bundle_items: (prev.bundle_items || []).filter((b) => b.campaign_id !== campaignId),
      }));
    } else {
      setProductForm((prev) => ({
        ...prev,
        bundle_items: [
          ...(prev.bundle_items || []),
          {
            campaign_id: campaignId,
            item_name: targetProduct?.item_name || targetProduct?.title || 'Artigo',
          },
        ],
      }));
    }
  };

  const handleUpdateBundleItemName = (campaignId: string, customName: string) => {
    setProductForm((prev) => ({
      ...prev,
      bundle_items: (prev.bundle_items || []).map((b) =>
        b.campaign_id === campaignId ? { ...b, item_name: customName } : b
      ),
    }));
  };

  const bundleSelectedProducts = eligibleProducts.filter((p) =>
    bundleItemConfigs.some((b) => b.campaign_id === p.id)
  );
  const sumIndividualPrices = bundleSelectedProducts.reduce(
    (acc, p) => acc + (p.item_price || 0),
    0
  );
  const bundlePrice = productForm.item_price || 0;
  const bundleSavings = sumIndividualPrices > bundlePrice ? sumIndividualPrices - bundlePrice : 0;
  const bundleDiscountPercent =
    sumIndividualPrices > 0 ? Math.round((bundleSavings / sumIndividualPrices) * 100) : 0;

  const handleTogglePresetColor = (colorName: string) => {
    setProductForm((prev) => {
      const current = prev.colors_available || ['Preto'];
      const exists = current.includes(colorName);
      const next = exists
        ? current.filter((c) => c !== colorName)
        : [...current, colorName];
      return {
        ...prev,
        colors_available: next.length > 0 ? next : [colorName],
      };
    });
  };

  const handleAddCustomColor = () => {
    const trimmed = newColorText.trim();
    if (!trimmed) return;
    setProductForm((prev) => {
      const current = prev.colors_available || [];
      if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        colors_available: [...current, trimmed],
      };
    });
    setNewColorText('');
  };

  const handleRemoveColor = (index: number) => {
    setProductForm((prev) => {
      const current = prev.colors_available || [];
      const removedColor = current[index];
      const next = current.filter((_, i) => i !== index);
      const nextImages = { ...(prev.color_images || {}) };
      if (removedColor) {
        delete nextImages[removedColor];
      }
      return {
        ...prev,
        colors_available: next,
        color_images: nextImages,
      };
    });
  };

  const handleUpdateColorImage = (colorName: string, imageUrl: string) => {
    setProductForm((prev) => {
      const nextImages = { ...(prev.color_images || {}) };
      if (imageUrl.trim()) {
        nextImages[colorName] = imageUrl.trim();
      } else {
        delete nextImages[colorName];
      }
      return {
        ...prev,
        color_images: nextImages,
      };
    });
  };

  const handleUpdateSizeGuide = (sz: string, field: keyof SizeMeasurement, val: any) => {
    setProductForm((prev) => {
      const currentGuide = prev.size_guide ? { ...prev.size_guide } : { ...DEFAULT_SIZE_GUIDE };
      const currentItem =
        currentGuide[sz] ||
        DEFAULT_SIZE_GUIDE[sz as SweatSize] || {
          chest: 50,
          length: 70,
          sleeve: 60,
          shoulder_to_wrist: 75,
          label: '',
        };
      const parsedVal = field === 'label' ? val : (parseFloat(val) || 0);
      currentGuide[sz] = {
        ...currentItem,
        [field]: parsedVal,
      };
      return {
        ...prev,
        size_guide: currentGuide,
      };
    });
  };

  const handleResetSizeGuide = () => {
    setProductForm((prev) => ({
      ...prev,
      size_guide: { ...DEFAULT_SIZE_GUIDE },
    }));
  };

  const handleAddFeature = (text?: string) => {
    const feat = (text !== undefined ? text : newFeatureText).trim();
    if (!feat) return;
    if (productForm.features.includes(feat)) return;

    setProductForm((prev) => ({
      ...prev,
      features: [...prev.features, feat],
    }));
    if (text === undefined) {
      setNewFeatureText('');
    }
  };

  const handleUpdateFeature = (index: number, newText: string) => {
    setProductForm((prev) => {
      const updated = [...prev.features];
      updated[index] = newText;
      return { ...prev, features: updated };
    });
  };

  const handleRemoveFeature = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

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
              {editingProduct ? <Edit size={22} /> : <Plus size={22} />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingProduct ? 'Editar Produto do Catálogo' : 'Adicionar Novo Produto'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere o merchandising disponível para compra pelos estudantes de Engenharia Informática.
              </p>
            </div>
          </div>

          {/* Informação sobre snapshot de nome */}
          <div className="mb-5 p-3.5 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/30 border border-cyan-200/70 dark:border-cyan-800/60 text-xs text-cyan-900 dark:text-cyan-200 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-cyan-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Histórico Permanente das Encomendas:</span>
              <p className="text-[11px] text-cyan-800/90 dark:text-cyan-300/80 leading-relaxed">
                O <strong>Nome da Peça</strong> configurado abaixo é guardado de forma imutável em cada encomenda no momento da compra. Mesmo que o produto venha a ser renomeado ou editado posteriormente, as encomendas já vendidas retêm o nome exato que tinham quando foram compradas.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Seletor Tipo: Artigo Único vs Pack */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Tipo de Produto
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cria uma peça individual ou um Pack promocional combinando artigos existentes.
                </span>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800/80 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setProductForm((prev) => ({
                      ...prev,
                      is_bundle: false,
                      category: prev.category === 'Pack' ? 'Vestuário' : prev.category,
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !productForm.is_bundle
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Artigo Único
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProductForm((prev) => ({
                      ...prev,
                      is_bundle: true,
                      category: 'Pack',
                      bundle_items: prev.bundle_items || [],
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    productForm.is_bundle
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Package size={13} />
                  <span>Pack / Conjunto</span>
                </button>
              </div>
            </div>

            {/* Artigos incluídos no Pack (se is_bundle) */}
            {productForm.is_bundle && (
              <div className="space-y-3 p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                      <Package size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-cyan-950 dark:text-cyan-100">
                        Artigos Incluídos no Pack (Mínimo 2 artigos) *
                      </h4>
                      <p className="text-[11px] text-cyan-800/80 dark:text-cyan-300/80">
                        Seleciona as peças individuais do catálogo que fazem parte deste conjunto.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                    {bundleItemConfigs.length} selecionado(s)
                  </span>
                </div>

                {eligibleProducts.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold py-2">
                    Ainda não existem outros artigos individuais criados. Cria primeiro os artigos individuais (ex: Sweat, T-Shirt) para poder juntá-los num Pack.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {eligibleProducts.map((p) => {
                      const isChecked = bundleItemConfigs.some((b) => b.campaign_id === p.id);
                      const currentConfig = bundleItemConfigs.find((b) => b.campaign_id === p.id);
                      return (
                        <div
                          key={p.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-white dark:bg-slate-900 border-cyan-500 shadow-xs'
                              : 'bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleBundleItem(p.id)}
                                className="w-4 h-4 rounded text-cyan-600 accent-cyan-500 cursor-pointer"
                              />
                              {p.image_url && (
                                <img
                                  src={p.image_url}
                                  alt={p.title}
                                  className="w-10 h-10 rounded-lg object-contain bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 p-0.5"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                                  {p.title}
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Peça: <strong>{p.item_name}</strong> · Preço normal: <strong>{p.item_price.toFixed(2)} €</strong>
                                  {p.colors_available && p.colors_available.length > 0 && ` · ${p.colors_available.length} cores`}
                                  {p.sizes_available && p.sizes_available.length > 0 && ` · ${p.sizes_available.length} tamanhos`}
                                </span>
                              </div>
                            </label>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                              {p.item_price.toFixed(2)} €
                            </span>
                          </div>

                          {isChecked && (
                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                                Nome da peça no pack:
                              </span>
                              <input
                                type="text"
                                value={currentConfig?.item_name || ''}
                                onChange={(e) => handleUpdateBundleItemName(p.id, e.target.value)}
                                placeholder={p.item_name}
                                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comparativo de Preço & Poupança */}
                {bundleItemConfigs.length >= 2 && (
                  <div className="p-3 rounded-xl bg-cyan-100/60 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-800 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-cyan-900 dark:text-cyan-200 block font-medium">
                        Soma dos artigos em separado: <strong className="font-mono">{sumIndividualPrices.toFixed(2)} €</strong>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Configura o Preço do Pack na Secção 3 abaixo para definir o preço especial promocional.
                      </span>
                    </div>
                    {bundlePrice > 0 && (
                      <div className="text-right">
                        {bundleSavings > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-400/40">
                            Poupança: {bundleSavings.toFixed(2)} € ({bundleDiscountPercent}% OFF)
                          </span>
                        ) : bundlePrice === sumIndividualPrices ? (
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            Preço igual à soma
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Preço superior à soma
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 1. Identificação do Produto */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag size={13} className="text-cyan-500" />
                <span>1. Informação Principal</span>
              </h4>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título Comercial (Visível na Loja) *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Ex: Sweat Oficial Engenharia Informática 2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Peça / Artigo nas Encomendas (Gravado na Venda & Fábrica) *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.item_name}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, item_name: e.target.value }))
                  }
                  placeholder="Ex: Sweat Oficial Engenharia Informática"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Este nome é o que aparece no ficheiro CSV da fábrica e nos recibos do cliente.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Categoria do Artigo (Ex: Vestuário, Acessórios) *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  placeholder="Ex: Vestuário"
                  list="product-category-list"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
                <datalist id="product-category-list">
                  <option value="Vestuário" />
                  <option value="Acessórios" />
                  <option value="Material Escolar" />
                  <option value="Tecnologia" />
                  <option value="Outros" />
                </datalist>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {['Vestuário', 'Acessórios', 'Material Escolar', 'Outros'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProductForm((prev) => ({ ...prev, category: cat }))}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        productForm.category === cat
                          ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição Detalhada (Apresentada no modal ao clicar em Pré-encomendar)
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Detalhes completos sobre o material, corte, acabamentos ou mensagem da edição..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  URL da Imagem / Mockup
                </label>
                <input
                  type="text"
                  value={productForm.image_url}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, image_url: e.target.value }))
                  }
                  placeholder="/assets/sweat_mockup.jpg ou https://..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                />

                {/* Pré-visualização da Imagem Completa */}
                {productForm.image_url && (
                  <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1.5 shadow-xs">
                      <img
                        src={productForm.image_url}
                        alt="Preview do Artigo"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-200 block">Pré-visualização da Foto</span>
                      Exibição completa da peça em formato integral sem cortes.
                    </div>
                  </div>
                )}
              </div>

              {/* Prioridade / Posição na Loja */}
              <div className="pt-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
                  <ArrowUpDown size={13} className="text-cyan-500" />
                  <span>Posição / Prioridade na Loja Merch</span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={productForm.display_order ?? productForm.priority ?? ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setProductForm((prev) => ({
                        ...prev,
                        display_order: isNaN(val) ? 0 : val,
                        priority: isNaN(val) ? 0 : val,
                      }));
                    }}
                    placeholder="0 (Padrão)"
                    className="w-full sm:w-32 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                    <strong className="text-cyan-600 dark:text-cyan-400">1</strong> = 1.º lugar no topo, <strong className="text-cyan-600 dark:text-cyan-400">2</strong> = 2.º lugar, etc. <br className="hidden sm:inline" />
                    Valor <strong className="text-slate-700 dark:text-slate-300">0</strong> = ordem padrão por data no final do catálogo.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Pontos Fortes & Features (Editáveis pelo Admin) */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ListPlus size={13} className="text-cyan-500" />
                  <span>2. Pontos Fortes / Features (Visíveis no Catálogo)</span>
                </h4>
                <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                  {productForm.features.length} caraterística(s)
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estas características aparecem diretamente em destaque no cartão do artigo na loja pública.
              </p>

              {/* Lista de Features Atuais */}
              <div className="space-y-2">
                {productForm.features.map((feat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-500 flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleUpdateFeature(index, e.target.value)}
                      placeholder="Ex: 80% Algodão cardado..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                      title="Remover característica"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Adicionar Nova Característica */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  placeholder="Nova característica (ex: Edição Limitada)..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddFeature()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* 3. Preços e Prazos */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard size={13} className="text-cyan-500" />
                <span>3. Valores e Prazos</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Preço Base (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.item_price}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        item_price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1 block">
                    No checkout é adicionado (+ taxas)
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Portes CTT (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.shipping_fee}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        shipping_fee: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Data Limite (Opcional)
                  </label>
                  <input
                    type="date"
                    value={productForm.deadline_date}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, deadline_date: e.target.value }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* 4, 5, 6: Tamanhos, Cores e Guia de Medidas */}
            {productForm.is_bundle ? (
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 rounded-2xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-900 dark:text-cyan-200 flex items-start gap-3">
                  <Package size={20} className="text-cyan-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-sm block">
                      4, 5 & 6. Personalização Dinâmica por Artigo no Checkout
                    </span>
                    <p className="text-[11px] text-cyan-800/90 dark:text-cyan-300/80 leading-relaxed">
                      Como este produto é um <strong>Pack</strong> composto por vários artigos (ex: Casaco + T-Shirt), os tamanhos, cores disponíveis e tabelas de medidas são herdados automaticamente de cada peça individual.
                    </p>
                    <p className="text-[11px] text-cyan-800/90 dark:text-cyan-300/80 leading-relaxed">
                      Ao comprar este pack, o estudante terá seletores independentes para escolher a cor e o tamanho específico de cada artigo.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 4. Tamanhos Disponíveis */}
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    4. Tamanhos Disponíveis *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ORDERED_SWEAT_SIZES.map((sz) => {
                      const isSelected = productForm.sizes_available.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSize(sz)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isSelected
                            ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50'
                            }`}
                        >
                          {sz} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Cores Disponíveis (se for vestuário) */}
                {isClothing && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Palette size={13} className="text-cyan-500" />
                        <span>5. Cores Disponíveis *</span>
                      </h4>
                      <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                        {productForm.colors_available?.length || 0} cor(es) configurada(s)
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cores que os estudantes poderão escolher ao efetuar a encomenda desta peça na loja pública.
                    </p>

                    {/* Sugestões rápidas de cores predefinidas */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Cores Sugeridas (Clica para adicionar/remover):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {DEFAULT_PRESET_COLORS.map((preset) => {
                          const isSelected = productForm.colors_available?.includes(preset);
                          const hex = getColorHex(preset);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleTogglePresetColor(preset)}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs'
                                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
                              }`}
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                                style={{ backgroundColor: hex }}
                              />
                              <span>{preset}</span>
                              {isSelected && <Check size={12} className="text-cyan-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Cores ativas selecionadas com foto e remoção */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Cores Ativas & Foto por Cor ({productForm.colors_available?.length || 0}):
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Opcional: atribui fotos específicas para trocar a imagem na loja ao escolher a cor
                        </span>
                      </div>

                      {(!productForm.colors_available || productForm.colors_available.length === 0) ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                          Nenhuma cor ativa selecionada. Adiciona pelo menos uma cor (ex: Preto).
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {productForm.colors_available.map((c, idx) => {
                            const colorImg = productForm.color_images?.[c] || '';
                            return (
                              <div
                                key={c}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs"
                              >
                                <div className="flex items-center gap-2 min-w-[130px] shrink-0">
                                  <span
                                    className="w-4 h-4 rounded-full border border-black/20 dark:border-white/20 shrink-0 shadow-xs"
                                    style={{ backgroundColor: getColorHex(c) }}
                                  />
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {c}
                                  </span>
                                </div>

                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={colorImg}
                                    onChange={(e) => handleUpdateColorImage(c, e.target.value)}
                                    placeholder={`Foto para ${c} (ex: /assets/sweat_${c.toLowerCase()}.jpg ou URL)`}
                                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                                  />

                                  {colorImg && (
                                    <img
                                      src={colorImg}
                                      alt={c}
                                      className="w-8 h-8 rounded-lg object-contain bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 p-0.5"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                      }}
                                    />
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColor(idx)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                                    title={`Remover cor ${c}`}
                                  >
                                    <X size={15} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Adicionar cor personalizada */}
                      <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <input
                          type="text"
                          value={newColorText}
                          onChange={(e) => setNewColorText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddCustomColor();
                            }
                          }}
                          placeholder="Outra cor (ex: Bege, Verde Oliva)..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomColor}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        >
                          <Plus size={13} />
                          <span>Adicionar Cor</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Guia de Tamanhos (Medidas em cm) se for vestuário */}
                {isClothing && (
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Ruler size={13} className="text-cyan-500" />
                        <span>6. Guia de Tamanhos (Medidas em cm)</span>
                      </h4>
                      <button
                        type="button"
                        onClick={handleResetSizeGuide}
                        className="inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-semibold cursor-pointer"
                        title="Repor tabela com as medidas padrão da fábrica"
                      >
                        <RotateCcw size={12} />
                        <span>Repor Medidas Padrão</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ajusta as medidas em centímetros de cada tamanho para esta peça: Peito (A), Comprimento (B), Manga (C) e Ombro ao Punho (D). O guia será apresentado aos estudantes no modal da loja.
                    </p>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-900/60 font-bold">
                            <th className="py-2.5 px-3 w-14">Tam.</th>
                            <th className="py-2.5 px-3">Peito (A) cm</th>
                            <th className="py-2.5 px-3">Comprimento (B) cm</th>
                            <th className="py-2.5 px-3">Manga (C) cm</th>
                            <th className="py-2.5 px-3">Ombro ao Punho (D) cm</th>
                            <th className="py-2.5 px-3">Nota / Observação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {productForm.sizes_available.map((sz) => {
                            const currentItem =
                              productForm.size_guide?.[sz] ||
                              DEFAULT_SIZE_GUIDE[sz] || {
                                chest: 50,
                                length: 70,
                                sleeve: 60,
                                shoulder_to_wrist: 75,
                                label: '',
                              };
                            return (
                              <tr key={sz} className="hover:bg-cyan-500/5 transition-colors">
                                <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                                  <span className="px-2 py-0.5 rounded-lg bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-black">
                                    {sz}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={currentItem.chest ?? ''}
                                    onChange={(e) => handleUpdateSizeGuide(sz, 'chest', e.target.value)}
                                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:border-cyan-500"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={currentItem.length ?? ''}
                                    onChange={(e) => handleUpdateSizeGuide(sz, 'length', e.target.value)}
                                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:border-cyan-500"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={currentItem.sleeve ?? ''}
                                    onChange={(e) => handleUpdateSizeGuide(sz, 'sleeve', e.target.value)}
                                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:border-cyan-500"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={currentItem.shoulder_to_wrist ?? ''}
                                    onChange={(e) => handleUpdateSizeGuide(sz, 'shoulder_to_wrist', e.target.value)}
                                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:border-cyan-500"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={currentItem.label || ''}
                                    onChange={(e) => handleUpdateSizeGuide(sz, 'label', e.target.value)}
                                    placeholder="Ex: Médio (Mais comum)"
                                    className="w-full min-w-[130px] px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 7. Opções de Entrega & Visibilidade */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Truck size={13} className="text-cyan-500" />
                <span>7. Opções de Entrega & Visibilidade</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={productForm.allow_pickup}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, allow_pickup: e.target.checked }))
                    }
                    className="mt-0.5 w-4 h-4 rounded text-cyan-600 accent-cyan-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Permitir Levantamento Presencial
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Estudante levanta no gabinete NEEI sem custo de envio.
                    </span>
                  </div>
                </label>

                <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={productForm.allow_shipping}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, allow_shipping: e.target.checked }))
                    }
                    className="mt-0.5 w-4 h-4 rounded text-cyan-600 accent-cyan-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white block">
                      Permitir Envio Postal CTT
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Permite envio direto para morada com taxa de portes.
                    </span>
                  </div>
                </label>
              </div>

              {productForm.allow_pickup && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Local de Levantamento Presencial
                  </label>
                  <input
                    type="text"
                    value={productForm.pickup_location}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, pickup_location: e.target.value }))
                    }
                    placeholder="Gabinete do NEEI (Sala 0.18, Edifício 1, Campus de Gambelas)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Ativo na loja */}
              <div className="pt-2">
                <label className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 flex items-center justify-between cursor-pointer">
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      Disponível na Loja Pública
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Se ativo, estudantes e público geral podem encomendar na página de Merch.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={productForm.is_active}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="w-5 h-5 rounded text-emerald-600 accent-emerald-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {productError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{productError}</span>
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
                disabled={savingProduct}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingProduct ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>A guardar produto...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>{editingProduct ? 'Guardar Alterações' : 'Criar Produto'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div >
    </Portal >
  );
};

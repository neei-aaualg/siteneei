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
} from 'lucide-react';
import { ShopCampaign, SweatSize, ProductFormData, ORDERED_SWEAT_SIZES } from '../../../types/shop';
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
}) => {
  const [newFeatureText, setNewFeatureText] = useState('');

  if (!isOpen) return null;

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

            {/* 5. Opções de Entrega & Visibilidade */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Truck size={13} className="text-cyan-500" />
                <span>5. Opções de Entrega & Visibilidade</span>
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

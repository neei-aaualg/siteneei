import React from 'react';
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
} from 'lucide-react';
import { SweatSize, OrderStatus, ShopCampaign } from '../../../types/shop';
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
                      const selectedProd = products.find((p) => p.id === selectedId);
                      if (selectedProd) {
                        setManualForm((prev: any) => ({
                          ...prev,
                          campaign_id: selectedProd.id,
                          item_name: selectedProd.item_name,
                          item_price: selectedProd.item_price,
                          shipping_fee: selectedProd.shipping_fee,
                        }));
                      } else {
                        setManualForm((prev: any) => ({
                          ...prev,
                          campaign_id: '',
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Preço da Peça (€)
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
                </div>
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

            {/* 4. Estado & Pagamento */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard size={13} className="text-cyan-500" />
                <span>4. Estado Financeiro e Operacional</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Estado do Pagamento
                  </label>
                  <select
                    value={manualForm.payment_status}
                    onChange={(e) =>
                      setManualForm((prev: any) => ({
                        ...prev,
                        payment_status: e.target.value as 'paid' | 'pending',
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="paid">Pago (Confirmado)</option>
                    <option value="pending">Pendente Pagamento</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Estado Operacional
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

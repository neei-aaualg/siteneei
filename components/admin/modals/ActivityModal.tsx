import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Portal } from '../../Portal';
import { AdminActivityWithRegistrations, ActivityStatus } from '../../../types/activities';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  editingActivity: Partial<AdminActivityWithRegistrations> | null;
  savingActivity: boolean;
  formTitle: string;
  setFormTitle: (v: string) => void;
  formDescription: string;
  setFormDescription: (v: string) => void;
  formCategory: string;
  setFormCategory: (v: string) => void;
  formStatus: ActivityStatus;
  setFormStatus: (v: ActivityStatus) => void;
  formDate: string;
  onFormDateChange: (v: string) => void;
  formTime: string;
  setFormTime: (v: string) => void;
  formLocation: string;
  setFormLocation: (v: string) => void;
  formMaxCapacity: number;
  setFormMaxCapacity: (v: number) => void;
  formSpeaker: string;
  setFormSpeaker: (v: string) => void;
  formRegistrationOpensAt: string;
  onFormRegistrationOpensAtChange: (v: string) => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingActivity,
  savingActivity,
  formTitle,
  setFormTitle,
  formDescription,
  setFormDescription,
  formCategory,
  setFormCategory,
  formStatus,
  setFormStatus,
  formDate,
  onFormDateChange,
  formTime,
  setFormTime,
  formLocation,
  setFormLocation,
  formMaxCapacity,
  setFormMaxCapacity,
  formSpeaker,
  setFormSpeaker,
  formRegistrationOpensAt,
  onFormRegistrationOpensAtChange,
}) => {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-cyan-900/60 p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-text-100 dark:text-white">
              {editingActivity ? 'Editar Atividade' : 'Nova Atividade NEEI'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-semibold mb-1">Título da Atividade</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="ex.: Workshop de React e Tailwind"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Descrição Detalhada</label>
              <textarea
                required
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreve os objetivos, tópicos abordados e pré-requisitos..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Categoria</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Palestra">Palestra</option>
                  <option value="Convívio">Convívio</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Torneio">Torneio</option>
                  <option value="Sessão Prática">Sessão Prática</option>
                  <option value="Visita de Estudo">Visita de Estudo</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Estado das Inscrições</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ActivityStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                >
                  <option value="ongoing">A Decorrer (Inscrições Abertas)</option>
                  <option value="upcoming">Futura (Passa a Decorrer automaticamente na data/semana)</option>
                  <option value="completed">Concluída</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold">Data (DD-MM-AAAA)</label>
                  {formDate && (
                    <button
                      type="button"
                      onClick={() => onFormDateChange('')}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                    >
                      Limpar data (Por definir)
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => onFormDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                />
                {!formDate && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                    <span>ℹ️</span> Data vazia: surgirá como &quot;Por definir&quot;.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Horário</label>
                <input
                  type="text"
                  required
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  placeholder="ex.: 14:30 - 17:30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Localização</label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="ex.: Lab 1.15, Edifício 1, Gambelas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Lotação Máxima (0 = ilimitada)</label>
                <input
                  type="number"
                  min="0"
                  value={formMaxCapacity}
                  onChange={(e) => setFormMaxCapacity(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Orador / Facilitador (opcional)</label>
              <input
                type="text"
                value={formSpeaker}
                onChange={(e) => setFormSpeaker(e.target.value)}
                placeholder="ex.: Equipa NEEI ou Convidado"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Data de Abertura das Inscrições (opcional)
              </label>
              <input
                type="date"
                value={formRegistrationOpensAt}
                onChange={(e) => onFormRegistrationOpensAtChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
              />
              <span className="text-[11px] text-text-200 dark:text-slate-400 block mt-1">
                Quando esta data for atingida, a atividade passa automaticamente para{' '}
                <strong>A Decorrer</strong> (inscrições abertas).
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingActivity}
                className="px-5 py-2.5 bg-accent-200 dark:bg-cyan-600 hover:bg-accent-100 dark:hover:bg-cyan-500 text-white font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingActivity ? <Loader2 size={16} className="animate-spin" /> : null}
                <span>Guardar Atividade</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};

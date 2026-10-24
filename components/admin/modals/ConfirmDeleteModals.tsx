import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Portal } from '../../Portal';

interface ConfirmDeleteRegistrationModalProps {
  data: {
    regId: string;
    studentName: string;
    studentNumber: string;
    activityId: string;
  } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteRegistrationModal: React.FC<ConfirmDeleteRegistrationModalProps> = ({
  data,
  onClose,
  onConfirm,
}) => {
  if (!data) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle size={24} />
            <h3 className="text-lg font-bold text-text-100 dark:text-white">
              Remover Inscrição
            </h3>
          </div>
          <p className="text-sm text-text-200 dark:text-slate-300">
            Tens a certeza de que pretendes remover a inscrição de{' '}
            <strong className="text-text-100 dark:text-white">{data.studentName}</strong> (
            {data.studentNumber}) desta atividade?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

interface ConfirmDeleteActivityModalProps {
  activityId: string | null;
  activityTitle?: string;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const ConfirmDeleteActivityModal: React.FC<ConfirmDeleteActivityModalProps> = ({
  activityId,
  activityTitle,
  onClose,
  onConfirm,
}) => {
  if (!activityId) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle size={24} />
            <h3 className="text-lg font-bold text-text-100 dark:text-white">
              Eliminar Atividade
            </h3>
          </div>
          <p className="text-sm text-text-200 dark:text-slate-300">
            Tens a certeza de que pretendes eliminar definitivamente esta atividade
            {activityTitle ? ` (${activityTitle})` : ''} e todas as respetivas inscrições?
            Esta ação não pode ser revertida.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(activityId)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              Eliminar Definitivamente
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

interface ConfirmDeleteCollaboratorModalProps {
  data: {
    id: string;
    name: string;
  } | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const ConfirmDeleteCollaboratorModal: React.FC<ConfirmDeleteCollaboratorModalProps> = ({
  data,
  onClose,
  onConfirm,
}) => {
  if (!data) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle size={24} />
            <h3 className="text-lg font-bold text-text-100 dark:text-white">
              Eliminar Candidatura
            </h3>
          </div>
          <p className="text-sm text-text-200 dark:text-slate-300">
            Tens a certeza de que pretendes eliminar a candidatura de{' '}
            <strong className="text-text-100 dark:text-white">{data.name}</strong>? Esta
            ação é irreversível.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(data.id)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              Eliminar Definitivamente
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

interface ConfirmDeleteJobModalProps {
  data: {
    id: string;
    title: string;
    company: string;
  } | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const ConfirmDeleteJobModal: React.FC<ConfirmDeleteJobModalProps> = ({
  data,
  onClose,
  onConfirm,
}) => {
  if (!data) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
        <div className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <AlertCircle size={24} />
            <h3 className="text-lg font-bold text-text-100 dark:text-white">
              Eliminar Oferta de Vaga
            </h3>
          </div>
          <p className="text-sm text-text-200 dark:text-slate-300">
            Tens a certeza de que pretendes eliminar a oferta{' '}
            <strong className="text-text-100 dark:text-white">"{data.title}"</strong> da
            empresa <strong className="text-text-100 dark:text-white">{data.company}</strong>?
            Esta ação é irreversível.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(data.id)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              Eliminar Definitivamente
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

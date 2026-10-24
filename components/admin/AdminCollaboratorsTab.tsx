import React, { useState } from 'react';
import {
  UserPlus,
  Clock,
  CheckCircle,
  Search,
  X,
  Copy,
  Download,
  Trash2,
  Mail,
  Phone,
  GraduationCap,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { CollaboratorApplication, CollaboratorStatus } from '../../types/collaborators';
import { formatDateDDMMAAAA, formatDateTimeDDMMAAAA } from '../../utils/dateHelpers';

interface AdminCollaboratorsTabProps {
  collaborators: CollaboratorApplication[];
  updatingCollabId: string | null;
  onUpdateStatus: (collabId: string, status: CollaboratorStatus) => Promise<void>;
  onConfirmDelete: (data: { id: string; name: string }) => void;
  onCopyEmails: (filtered: CollaboratorApplication[]) => void;
  onExportCsv: (filtered: CollaboratorApplication[]) => void;
}

export const AdminCollaboratorsTab: React.FC<AdminCollaboratorsTabProps> = ({
  collaborators,
  updatingCollabId,
  onUpdateStatus,
  onConfirmDelete,
  onCopyEmails,
  onExportCsv,
}) => {
  const [collabSearch, setCollabSearch] = useState('');
  const [collabFilterStatus, setCollabFilterStatus] = useState<'all' | CollaboratorStatus>('all');

  const pendingCollabCount = collaborators.filter((c) => c.status === 'pending').length;
  const contactedCollabCount = collaborators.filter((c) => c.status === 'contacted').length;
  const acceptedCollabCount = collaborators.filter((c) => c.status === 'accepted').length;

  const filteredCollaborators = collaborators.filter((c) => {
    const matchesStatus = collabFilterStatus === 'all' || c.status === collabFilterStatus;
    const q = collabSearch.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.student_number.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.course.toLowerCase().includes(q) ||
      (c.areas_of_interest && c.areas_of_interest.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  const getCollabStatusLabel = (status: CollaboratorStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'contacted':
        return 'Contactado';
      case 'accepted':
        return 'Aceite';
      case 'rejected':
        return 'Rejeitado';
    }
  };

  const getCollabStatusBadgeClass = (status: CollaboratorStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border-gray-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Métricas de Colaboradores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Total Pedidos
            </span>
            <div className="text-3xl font-extrabold text-accent-200 dark:text-cyan-400 mt-1">
              {collaborators.length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent-100/30 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 flex items-center justify-center">
            <UserPlus size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Pendentes
            </span>
            <div className="text-3xl font-extrabold text-amber-500 mt-1">
              {pendingCollabCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Contactados
            </span>
            <div className="text-3xl font-extrabold text-blue-500 mt-1">
              {contactedCollabCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Mail size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Aceites na Equipa
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {acceptedCollabCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Pesquisa e Ações */}
      <div className="bg-white dark:bg-[#0c1724] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['all', 'Todos', collaborators.length],
              ['pending', 'Pendentes', pendingCollabCount],
              ['contacted', 'Contactados', contactedCollabCount],
              ['accepted', 'Aceites', acceptedCollabCount],
              [
                'rejected',
                'Rejeitados',
                collaborators.filter((c) => c.status === 'rejected').length,
              ],
            ] as const
          ).map(([st, label, count]) => {
            const isSelected = collabFilterStatus === st;
            return (
              <button
                key={st}
                onClick={() => setCollabFilterStatus(st as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-accent-200 text-white dark:bg-cyan-600 shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={collabSearch}
              onChange={(e) => setCollabSearch(e.target.value)}
              placeholder="Pesquisar nome, aluno, curso..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
            />
            {collabSearch && (
              <button
                onClick={() => setCollabSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => onCopyEmails(filteredCollaborators)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-semibold text-text-200 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Copiar lista de emails filtrados"
          >
            <Copy size={14} />
            <span>Emails ({filteredCollaborators.length})</span>
          </button>

          <button
            onClick={() => onExportCsv(filteredCollaborators)}
            className="px-3 py-1.5 rounded-xl bg-accent-200/10 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 hover:bg-accent-200/20 dark:hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Descarregar lista em CSV"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Lista de Colaboradores */}
      {filteredCollaborators.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0c1724] rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 space-y-2">
          <UserPlus className="mx-auto text-gray-400 dark:text-slate-600" size={32} />
          <p className="text-sm text-text-200 dark:text-slate-400">
            {collaborators.length === 0
              ? 'Ainda não existem candidaturas a colaborador submetidas.'
              : 'Nenhuma candidatura encontrada com os filtros selecionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCollaborators.map((collab) => {
            const areasList = collab.areas_of_interest
              ? collab.areas_of_interest
                  .split(',')
                  .map((a) => a.trim())
                  .filter(Boolean)
              : [];
            const regDate = formatDateDDMMAAAA(collab.created_at);
            const isUpdating = updatingCollabId === collab.id;

            return (
              <div
                key={collab.id}
                className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-cyan-950/70 p-5 sm:p-6 shadow-sm hover:border-gray-300 dark:hover:border-cyan-800/80 transition-all space-y-4"
              >
                {/* Top Header do Candidato */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-base font-bold text-text-100 dark:text-white">
                        {collab.name}
                      </span>
                      <span className="font-mono text-xs font-bold text-accent-200 dark:text-cyan-400 bg-accent-200/10 dark:bg-cyan-500/10 px-2 py-0.5 rounded">
                        {collab.student_number}
                      </span>
                      <span className="text-xs text-text-200 dark:text-slate-400">
                        {collab.academic_year}º Ano
                      </span>
                    </div>
                    <span className="text-[11px] text-text-200 dark:text-slate-400 flex items-center gap-1">
                      <Clock size={12} />
                      Submetida a {regDate}
                    </span>
                  </div>

                  {/* Seletor de Estado Rápido & Ações */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(['pending', 'contacted', 'accepted', 'rejected'] as const).map((st) => {
                        const isCurrent = collab.status === st;
                        return (
                          <button
                            key={st}
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(collab.id, st)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border cursor-pointer ${
                              isCurrent
                                ? getCollabStatusBadgeClass(st)
                                : 'border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {isCurrent && isUpdating ? (
                              <Loader2 size={12} className="animate-spin inline mr-1" />
                            ) : null}
                            {getCollabStatusLabel(st)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

                    <button
                      onClick={() =>
                        onConfirmDelete({ id: collab.id, name: collab.name })
                      }
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      title="Eliminar esta candidatura"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Contactos & Áreas de Interesse */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-text-200 dark:text-slate-300 bg-gray-50/70 dark:bg-[#081320]/60 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={14} className="text-accent-200 dark:text-cyan-400 shrink-0" />
                    <a
                      href={`mailto:${collab.email}`}
                      className="hover:text-accent-200 dark:hover:text-cyan-400 truncate"
                    >
                      {collab.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Phone
                      size={14}
                      className="text-accent-200 dark:text-cyan-400 shrink-0"
                    />
                    <a
                      href={`tel:${collab.phone}`}
                      className="hover:text-accent-200 dark:hover:text-cyan-400 truncate"
                    >
                      {collab.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <GraduationCap
                      size={14}
                      className="text-accent-200 dark:text-cyan-400 shrink-0"
                    />
                    <span className="truncate">{collab.course}</span>
                  </div>
                </div>

                {/* Áreas de Interesse */}
                {areasList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-text-200 dark:text-slate-400 mr-1">
                      Áreas de Interesse:
                    </span>
                    {areasList.map((area) => (
                      <span
                        key={area}
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-primary-100/70 dark:bg-slate-800 text-primary-300 dark:text-cyan-300 border border-transparent dark:border-slate-700"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                )}

                {/* Texto de Motivação */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-text-200 dark:text-slate-400 flex items-center gap-1">
                    <MessageSquare size={13} className="text-accent-200 dark:text-cyan-400" />
                    <span>Texto de Motivação:</span>
                  </span>
                  <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 text-xs text-text-100 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {collab.motivation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

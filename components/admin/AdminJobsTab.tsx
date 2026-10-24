import React, { useState } from 'react';
import {
  Briefcase,
  Clock,
  Check,
  Search,
  X,
  Copy,
  Download,
  Trash2,
  Building,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { JobOffer, JobStatus } from '../../types/jobs';
import { formatDateDDMMAAAA } from '../../utils/dateHelpers';

interface AdminJobsTabProps {
  jobs: JobOffer[];
  updatingJobId: string | null;
  onUpdateStatus: (jobId: string, status: JobStatus) => Promise<void>;
  onConfirmDelete: (data: { id: string; title: string; company: string }) => void;
  onCopyEmails: (filtered: JobOffer[]) => void;
  onExportCsv: (filtered: JobOffer[]) => void;
}

export const AdminJobsTab: React.FC<AdminJobsTabProps> = ({
  jobs,
  updatingJobId,
  onUpdateStatus,
  onConfirmDelete,
  onCopyEmails,
  onExportCsv,
}) => {
  const [jobSearch, setJobSearch] = useState('');
  const [jobFilterStatus, setJobFilterStatus] = useState<'all' | JobStatus>('all');

  const pendingJobCount = jobs.filter((j) => j.status === 'pending').length;
  const publishedJobCount = jobs.filter((j) => j.status === 'published').length;

  const filteredJobs = jobs.filter((j) => {
    const matchesStatus = jobFilterStatus === 'all' || j.status === jobFilterStatus;
    const q = jobSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      j.company.toLowerCase().includes(q) ||
      j.title.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      j.email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const getJobStatusLabel = (status: JobStatus) => {
    switch (status) {
      case 'published':
        return 'Publicada';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitada';
      default:
        return status;
    }
  };

  const getJobStatusBadgeClass = (status: JobStatus) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400 border-gray-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Resumo Métricas Vagas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Total de Vagas
            </span>
            <div className="text-3xl font-extrabold text-primary-300 dark:text-cyan-400 mt-1">
              {jobs.length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent-100/30 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 flex items-center justify-center">
            <Briefcase size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Pendentes de Revisão
            </span>
            <div className="text-3xl font-extrabold text-amber-500 mt-1">
              {pendingJobCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Publicadas no Portal
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {publishedJobCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Check size={24} />
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Pesquisa e Ações */}
      <div className="bg-white dark:bg-[#0c1724] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['all', 'Todas', jobs.length],
              ['pending', 'Pendentes', pendingJobCount],
              ['published', 'Publicadas', publishedJobCount],
              ['rejected', 'Rejeitadas', jobs.filter((j) => j.status === 'rejected').length],
            ] as const
          ).map(([st, label, count]) => {
            const isSelected = jobFilterStatus === st;
            return (
              <button
                key={st}
                onClick={() => setJobFilterStatus(st as any)}
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
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Pesquisar empresa, cargo, cidade..."
              className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
            />
            {jobSearch && (
              <button
                onClick={() => setJobSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => onCopyEmails(filteredJobs)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-xs font-semibold text-text-200 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
            title="Copiar emails das empresas filtradas"
          >
            <Copy size={14} />
            <span>Emails ({filteredJobs.length})</span>
          </button>

          <button
            onClick={() => onExportCsv(filteredJobs)}
            className="px-3 py-1.5 rounded-xl bg-accent-200/10 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 hover:bg-accent-200/20 dark:hover:bg-cyan-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Descarregar lista em CSV"
          >
            <Download size={14} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Lista de Vagas */}
      {filteredJobs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#0c1724] rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 space-y-2">
          <Briefcase className="mx-auto text-gray-400 dark:text-slate-600" size={32} />
          <p className="text-sm text-text-200 dark:text-slate-400">
            {jobs.length === 0
              ? 'Ainda não foram submetidas ofertas de emprego ou estágio.'
              : 'Nenhuma oferta encontrada com os filtros selecionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const regDate = formatDateDDMMAAAA(job.created_at);
            const isUpdating = updatingJobId === job.id;

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-cyan-950/70 p-5 sm:p-6 shadow-sm hover:border-gray-300 dark:hover:border-cyan-800/80 transition-all space-y-4"
              >
                {/* Top Header da Vaga */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-base font-bold text-text-100 dark:text-white">
                        {job.title}
                      </span>
                      <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-primary-100/70 dark:bg-slate-800 text-primary-300 dark:text-cyan-300 border border-transparent dark:border-slate-700">
                        {job.type}
                      </span>
                      <span className="text-xs font-semibold text-text-100 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1">
                        <Building size={12} className="text-accent-200 dark:text-cyan-400" />
                        {job.company}
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
                      {(['pending', 'published', 'rejected'] as const).map((st) => {
                        const isCurrent = job.status === st;
                        return (
                          <button
                            key={st}
                            disabled={isUpdating}
                            onClick={() => onUpdateStatus(job.id, st)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border cursor-pointer ${
                              isCurrent
                                ? getJobStatusBadgeClass(st)
                                : 'border-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            {isCurrent && isUpdating ? (
                              <Loader2 size={12} className="animate-spin inline mr-1" />
                            ) : null}
                            {getJobStatusLabel(st)}
                          </button>
                        );
                      })}
                    </div>

                    <div className="h-5 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

                    <button
                      onClick={() =>
                        onConfirmDelete({
                          id: job.id,
                          title: job.title,
                          company: job.company,
                        })
                      }
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      title="Eliminar oferta de vaga"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Localização & Contactos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-text-200 dark:text-slate-300 bg-gray-50/70 dark:bg-[#081320]/60 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin size={14} className="text-accent-200 dark:text-cyan-400 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={14} className="text-accent-200 dark:text-cyan-400 shrink-0" />
                    <a
                      href={`mailto:${job.email}`}
                      className="hover:text-accent-200 dark:hover:text-cyan-400 truncate"
                    >
                      {job.email}
                    </a>
                  </div>
                  {job.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone size={14} className="text-accent-200 dark:text-cyan-400 shrink-0" />
                      <a
                        href={`tel:${job.phone}`}
                        className="hover:text-accent-200 dark:hover:text-cyan-400 truncate"
                      >
                        {job.phone}
                      </a>
                    </div>
                  )}
                  {job.link && (
                    <div className="flex items-center gap-2 truncate">
                      <ExternalLink
                        size={14}
                        className="text-accent-200 dark:text-cyan-400 shrink-0"
                      />
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent-200 dark:hover:text-cyan-400 truncate underline"
                      >
                        Link da Candidatura
                      </a>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <div className="p-3 rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 text-xs text-text-100 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

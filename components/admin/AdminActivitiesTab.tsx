import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { AdminActivityWithRegistrations, ActivityStatus } from '../../types/activities';
import { formatDateDDMMAAAA, formatDateTimeDDMMAAAA } from '../../utils/dateHelpers';

interface AdminActivitiesTabProps {
  activities: AdminActivityWithRegistrations[];
  loading: boolean;
  error: string | null;
  expandedActivityIds: string[];
  onToggleExpand: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (activity: AdminActivityWithRegistrations) => void;
  onToggleStatus: (activity: AdminActivityWithRegistrations, newStatus: ActivityStatus) => void;
  onConfirmDeleteActivity: (activityId: string) => void;
  onConfirmDeleteRegistration: (data: {
    regId: string;
    studentName: string;
    studentNumber: string;
    activityId: string;
  }) => void;
  onCopyEmails: (activity: AdminActivityWithRegistrations) => void;
  onExportCsv: (activity: AdminActivityWithRegistrations) => void;
}

export const AdminActivitiesTab: React.FC<AdminActivitiesTabProps> = ({
  activities,
  loading,
  error,
  expandedActivityIds,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onOpenCreateModal,
  onOpenEditModal,
  onToggleStatus,
  onConfirmDeleteActivity,
  onConfirmDeleteRegistration,
  onCopyEmails,
  onExportCsv,
}) => {
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilterStatus, setActivityFilterStatus] = useState<'all' | ActivityStatus>('all');

  // Métricas
  const totalRegistrations = activities.reduce(
    (acc, a) => acc + (a.registrations?.length || 0),
    0
  );
  const ongoingCount = activities.filter((a) => a.status === 'ongoing').length;
  const upcomingCount = activities.filter((a) => a.status === 'upcoming').length;
  const completedCount = activities.filter((a) => a.status === 'completed').length;

  // Filtragem
  const filteredActivities = activities.filter((a) => {
    const matchesStatus = activityFilterStatus === 'all' || a.status === activityFilterStatus;
    const q = activitySearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      (a.speaker && a.speaker.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Resumo Métricas Atividades */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Total de Inscritos
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {totalRegistrations}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Atividades A Decorrer
            </span>
            <div className="text-3xl font-extrabold text-accent-200 dark:text-cyan-400 mt-1">
              {ongoingCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent-100/30 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 flex items-center justify-center">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Atividades Agendadas
            </span>
            <div className="text-3xl font-extrabold text-primary-300 dark:text-slate-200 mt-1">
              {upcomingCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-100/50 dark:bg-slate-800 text-primary-300 dark:text-slate-300 flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-text-200 dark:text-slate-400 uppercase tracking-wider">
              Atividades Concluídas
            </span>
            <div className="text-3xl font-extrabold text-gray-600 dark:text-slate-300 mt-1">
              {completedCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Lista de Atividades & Inscrições */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-text-100 dark:text-white">
              Atividades Registadas ({activities.length})
            </h2>
            <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
              Clica numa atividade para ver os inscritos ou altera o estado manualmente
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-200 text-white dark:bg-cyan-500 dark:text-slate-950 rounded-xl text-xs font-bold hover:brightness-110 shadow-sm transition cursor-pointer"
            >
              <Plus size={15} />
              <span>Nova Atividade</span>
            </button>
          </div>
        </div>

        {/* Filtros de Estado e Pesquisa de Atividades */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0c1724] p-3 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActivityFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activityFilterStatus === 'all'
                  ? 'bg-accent-200 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950'
                  : 'bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-400 hover:text-text-100'
              }`}
            >
              Todas ({activities.length})
            </button>
            <button
              onClick={() => setActivityFilterStatus('ongoing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activityFilterStatus === 'ongoing'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-400 hover:text-text-100'
              }`}
            >
              A Decorrer ({ongoingCount})
            </button>
            <button
              onClick={() => setActivityFilterStatus('upcoming')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activityFilterStatus === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-400 hover:text-text-100'
              }`}
            >
              Futuras ({upcomingCount})
            </button>
            <button
              onClick={() => setActivityFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activityFilterStatus === 'completed'
                  ? 'bg-slate-700 text-white shadow-sm dark:bg-slate-600'
                  : 'bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-400 hover:text-text-100'
              }`}
            >
              Concluídas ({completedCount})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filteredActivities.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onExpandAll}
                  className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-[11px] font-semibold text-text-200 dark:text-slate-300 hover:text-text-100 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Expandir todas as atividades em simultâneo para ver os participantes"
                >
                  Expandir todas
                </button>
                {expandedActivityIds.length > 0 && (
                  <button
                    type="button"
                    onClick={onCollapseAll}
                    className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-[11px] font-semibold text-text-200 dark:text-slate-300 hover:text-text-100 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Recolher todas as atividades"
                  >
                    Recolher todas ({expandedActivityIds.length})
                  </button>
                )}
              </div>
            )}

            <div className="relative min-w-[180px] sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar atividade..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-accent-200/50 dark:focus:ring-cyan-500/50"
              />
            </div>
          </div>
        </div>

        {loading && activities.length === 0 ? (
          <div className="py-16 text-center">
            <Loader2
              className="animate-spin mx-auto text-accent-200 dark:text-cyan-400 mb-3"
              size={32}
            />
            <p className="text-sm text-text-200 dark:text-slate-400">
              A carregar atividades...
            </p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-2xl text-center text-red-600">
            {error}
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#0c1724] rounded-2xl border border-dashed border-gray-300 dark:border-slate-800">
            <p className="text-text-200 dark:text-slate-400">
              Nenhuma atividade encontrada com os filtros atuais.
            </p>
            {activities.length === 0 && (
              <button
                onClick={onOpenCreateModal}
                className="mt-3 px-4 py-2 bg-accent-200 text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                Criar Primeira Atividade
              </button>
            )}
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const isExpanded = expandedActivityIds.includes(activity.id);
            const registrations = activity.registrations || [];

            return (
              <div
                key={activity.id}
                className={`bg-white dark:bg-[#0c1724] rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                  activity.status === 'ongoing'
                    ? 'border-emerald-500/40 dark:border-emerald-500/30'
                    : activity.status === 'upcoming'
                    ? 'border-blue-400/40 dark:border-blue-500/30'
                    : 'border-gray-200 dark:border-slate-800 opacity-90'
                }`}
              >
                {/* Cabeçalho do Card da Atividade */}
                <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                  <div
                    className="flex-1 min-w-[260px] cursor-pointer"
                    onClick={() => onToggleExpand(activity.id)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          activity.status === 'ongoing'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : activity.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {activity.status === 'ongoing'
                          ? '● A Decorrer'
                          : activity.status === 'upcoming'
                          ? '○ Futura'
                          : '✓ Concluída'}
                      </span>
                      <span className="text-xs font-semibold text-text-200 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {activity.category}
                      </span>
                      <span className="text-xs text-text-200 dark:text-slate-400 flex items-center gap-1">
                        <Calendar size={12} />{' '}
                        {activity.date ? (
                          formatDateDDMMAAAA(activity.date)
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            Por definir
                          </span>
                        )}
                      </span>
                      {activity.registration_opens_at && (
                        <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Calendar size={10} />
                          Abre a {formatDateDDMMAAAA(activity.registration_opens_at)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-text-100 dark:text-white flex items-center gap-2">
                      <span>{activity.title}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </h3>

                    <p className="text-xs text-text-200 dark:text-slate-400 line-clamp-1 mt-1">
                      {activity.location} • {activity.time}
                    </p>
                  </div>

                  {/* Ações e Contagem de Inscritos */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Badge de Inscritos */}
                    <button
                      onClick={() => onToggleExpand(activity.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-xs font-semibold text-text-100 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Users size={14} className="text-accent-200 dark:text-cyan-400" />
                      <span>{registrations.length} inscritos</span>
                    </button>

                    {/* Botão de Alterar Estado */}
                    <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-0.5">
                      <button
                        onClick={() => onToggleStatus(activity, 'ongoing')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                          activity.status === 'ongoing'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-text-200 dark:text-slate-400 hover:text-text-100'
                        }`}
                      >
                        A Decorrer
                      </button>
                      <button
                        onClick={() => onToggleStatus(activity, 'upcoming')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                          activity.status === 'upcoming'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-text-200 dark:text-slate-400 hover:text-text-100'
                        }`}
                      >
                        Futura
                      </button>
                      <button
                        onClick={() => onToggleStatus(activity, 'completed')}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition cursor-pointer ${
                          activity.status === 'completed'
                            ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-sm'
                            : 'text-text-200 dark:text-slate-400 hover:text-text-100'
                        }`}
                      >
                        Concluída
                      </button>
                    </div>

                    {/* Ações rápidas */}
                    <button
                      onClick={() => onCopyEmails(activity)}
                      className="p-2 rounded-xl text-text-200 hover:text-text-100 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Copiar lista de emails institucionais"
                    >
                      <Copy size={16} />
                    </button>

                    <button
                      onClick={() => onExportCsv(activity)}
                      className="p-2 rounded-xl text-text-200 hover:text-text-100 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Descarregar CSV com nomes e números"
                    >
                      <Download size={16} />
                    </button>

                    <button
                      onClick={() => onOpenEditModal(activity)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/50 dark:hover:bg-cyan-500/30 shadow-sm transition-all cursor-pointer"
                      title="Editar dados da atividade"
                    >
                      <Pencil size={13} className="text-sky-600 dark:text-cyan-400" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => onConfirmDeleteActivity(activity.id)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                      title="Eliminar atividade"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Detalhes Expansíveis: Tabela de Alunos Inscritos */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/40 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <h4 className="text-sm font-bold text-text-100 dark:text-white">
                          Estudantes Inscritos ({registrations.length})
                        </h4>
                      </div>

                      {registrations.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <button
                            onClick={() => onCopyEmails(activity)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-text-100 dark:text-slate-200 hover:bg-gray-50 transition cursor-pointer"
                          >
                            <Copy size={12} />
                            <span>Copiar Emails</span>
                          </button>
                          <button
                            onClick={() => onExportCsv(activity)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-text-100 dark:text-slate-200 hover:bg-gray-50 transition cursor-pointer"
                          >
                            <FileSpreadsheet size={12} />
                            <span>Exportar CSV</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {registrations.length === 0 ? (
                      <div className="py-8 text-center bg-white dark:bg-slate-900/60 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                        <Users
                          size={28}
                          className="mx-auto text-gray-300 dark:text-slate-600 mb-2"
                        />
                        <p className="text-xs font-medium text-text-200 dark:text-slate-400">
                          Ainda não existem inscrições registadas para esta atividade.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto bg-white dark:bg-slate-900/80 rounded-xl border border-gray-200 dark:border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 dark:bg-slate-800/80 text-text-200 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                            <tr>
                              <th className="py-3 px-4 font-semibold">#</th>
                              <th className="py-3 px-4 font-semibold">Nome Completo</th>
                              <th className="py-3 px-4 font-semibold">Nº de Aluno</th>
                              <th className="py-3 px-4 font-semibold">Email Institucional</th>
                              <th className="py-3 px-4 font-semibold">Data / Hora</th>
                              <th className="py-3 px-4 font-semibold text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {registrations.map((reg, index) => {
                              const regDate = formatDateTimeDDMMAAAA(reg.registered_at);

                              return (
                                <tr
                                  key={reg.id}
                                  className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition"
                                >
                                  <td className="py-3 px-4 text-gray-400 font-mono">
                                    {index + 1}
                                  </td>
                                  <td className="py-3 px-4 font-semibold text-text-100 dark:text-white">
                                    {reg.student_name}
                                  </td>
                                  <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                                    {reg.student_number}
                                  </td>
                                  <td className="py-3 px-4 text-text-200 dark:text-slate-400 font-mono">
                                    {reg.student_number}@ualg.pt
                                  </td>
                                  <td className="py-3 px-4 text-text-200 dark:text-slate-400">
                                    {regDate}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      onClick={() =>
                                        onConfirmDeleteRegistration({
                                          regId: reg.id,
                                          studentName: reg.student_name,
                                          studentNumber: reg.student_number,
                                          activityId: activity.id,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition font-medium text-[11px] cursor-pointer"
                                    >
                                      <Trash2 size={12} />
                                      <span>Desinscrever</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

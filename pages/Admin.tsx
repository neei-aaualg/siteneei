import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  LogOut,
  Users,
  Calendar,
  Trash2,
  Copy,
  Download,
  Check,
  AlertCircle,
  Loader2,
  Plus,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  Pencil
} from 'lucide-react';
import { AdminActivityWithRegistrations, ActivityStatus } from '../types/activities';
import {
  adminLogin,
  fetchAdminActivities,
  removeRegistration,
  updateActivityStatus,
  saveActivity,
  deleteActivity,
  getStoredAdminToken,
  clearStoredAdminToken
} from '../services/activitiesService';

export const Admin: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => getStoredAdminToken());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Dados do Dashboard
  const [activities, setActivities] = useState<AdminActivityWithRegistrations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de Interação
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string } | null>(null);
  const [confirmDeleteReg, setConfirmDeleteReg] = useState<{
    regId: string;
    studentName: string;
    studentNumber: string;
    activityId: string;
  } | null>(null);
  const [confirmDeleteAct, setConfirmDeleteAct] = useState<string | null>(null);

  // Modal de Criar/Editar Atividade
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Partial<AdminActivityWithRegistrations> | null>(null);
  const [savingActivity, setSavingActivity] = useState(false);

  // Form State para Nova Atividade (sem tags)
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Workshop');
  const [formStatus, setFormStatus] = useState<ActivityStatus>('upcoming');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formMaxCapacity, setFormMaxCapacity] = useState<number>(0);
  const [formSpeaker, setFormSpeaker] = useState('');
  const [formRegistrationOpensAt, setFormRegistrationOpensAt] = useState('');

  const loadDashboardData = async (activeToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminActivities(activeToken);
      setActivities(data);
      // Expande por padrão a primeira atividade a decorrer se existir
      const ongoing = data.find(a => a.status === 'ongoing');
      if (ongoing && !expandedActivityId) {
        setExpandedActivityId(ongoing.id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do painel');
      if (err.message?.includes('expirada') || err.message?.includes('login')) {
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboardData(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoggingIn(true);
      setLoginError(null);
      const res = await adminLogin(password);
      if (res.token) {
        setToken(res.token);
        setPassword('');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Senha incorreta. Tenta novamente.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    clearStoredAdminToken();
    setToken(null);
    setActivities([]);
    setPassword('');
  };

  const handleRemoveRegistration = async () => {
    if (!confirmDeleteReg || !token) return;

    try {
      await removeRegistration(token, confirmDeleteReg.regId);

      // Atualiza o estado local
      setActivities(prev =>
        prev.map(act => {
          if (act.id === confirmDeleteReg.activityId) {
            return {
              ...act,
              registrations: act.registrations.filter(r => r.id !== confirmDeleteReg.regId)
            };
          }
          return act;
        })
      );

      setConfirmDeleteReg(null);
      showFeedback('reg-removed', 'Inscrição removida com sucesso');
    } catch (err: any) {
      alert(err.message || 'Erro ao remover inscrição');
    }
  };

  const handleToggleStatus = async (activity: AdminActivityWithRegistrations, newStatus: ActivityStatus) => {
    if (!token) return;
    try {
      await updateActivityStatus(token, activity.id, newStatus);
      setActivities(prev =>
        prev.map(a => (a.id === activity.id ? { ...a, status: newStatus } : a))
      );
      showFeedback(activity.id, `Estado alterado para ${newStatus}`);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar estado da atividade');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!token) return;
    try {
      await deleteActivity(token, activityId);
      setActivities(prev => prev.filter(a => a.id !== activityId));
      setConfirmDeleteAct(null);
      showFeedback('act-deleted', 'Atividade eliminada');
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar atividade');
    }
  };

  const showFeedback = (id: string, message: string) => {
    setActionFeedback({ id, message });
    setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
  };

  const copyEmailsToClipboard = (activity: AdminActivityWithRegistrations) => {
    const emails = activity.registrations
      .map(r => `${r.student_number}@ualg.pt`)
      .join(', ');

    if (!emails) {
      alert('Não existem alunos inscritos nesta atividade.');
      return;
    }
    navigator.clipboard.writeText(emails);
    showFeedback(activity.id, `${activity.registrations.length} emails institucionais copiados!`);
  };

  const exportCsv = (activity: AdminActivityWithRegistrations) => {
    if (!activity.registrations || activity.registrations.length === 0) {
      alert('Não existem inscrições para exportar.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Nome,Numero de Aluno,Email Institucional,Data de Inscricao\n';

    activity.registrations.forEach(r => {
      const regDate = new Date(r.registered_at).toLocaleString('pt-PT');
      const email = `${r.student_number}@ualg.pt`;
      csvContent += `"${r.student_name}","${r.student_number}","${email}","${regDate}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeTitle = activity.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `inscritos_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCreateModal = () => {
    setEditingActivity(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Workshop');
    setFormStatus('upcoming');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTime('14:30 - 17:00');
    setFormLocation('Laboratório 1.15, Edifício 1, Gambelas');
    setFormMaxCapacity(35);
    setFormSpeaker('Equipa NEEI');
    setFormRegistrationOpensAt('');
    setIsActivityModalOpen(true);
  };

  const openEditModal = (activity: AdminActivityWithRegistrations) => {
    setEditingActivity(activity);
    setFormTitle(activity.title);
    setFormDescription(activity.description);
    setFormCategory(activity.category);
    setFormStatus(activity.status);
    setFormDate(activity.date);
    setFormTime(activity.time);
    setFormLocation(activity.location);
    setFormMaxCapacity(activity.max_capacity || 0);
    setFormSpeaker(activity.speaker || '');
    setFormRegistrationOpensAt(activity.registration_opens_at || '');
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSavingActivity(true);

      const payload: Partial<AdminActivityWithRegistrations> = {
        id: editingActivity?.id,
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory.trim(),
        status: formStatus,
        date: formDate.trim(),
        time: formTime.trim(),
        location: formLocation.trim(),
        max_capacity: Number(formMaxCapacity) || 0,
        speaker: formSpeaker.trim(),
        registration_opens_at: formRegistrationOpensAt ? formRegistrationOpensAt.trim() : undefined
      };

      await saveActivity(token, payload);
      setIsActivityModalOpen(false);
      loadDashboardData(token);
      showFeedback('act-saved', 'Atividade guardada com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao guardar atividade');
    } finally {
      setSavingActivity(false);
    }
  };

  // Cálculos de Resumo
  const totalRegistrations = activities.reduce((acc, a) => acc + (a.registrations?.length || 0), 0);
  const ongoingCount = activities.filter(a => a.status === 'ongoing').length;
  const upcomingCount = activities.filter(a => a.status === 'upcoming').length;

  // Se não estiver autenticado, exibe o ecrã de Login
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-bg-100 dark:bg-[#070e17] text-text-100 dark:text-slate-100">
        <div className="w-full max-w-md bg-white dark:bg-[#0c1724] rounded-3xl border border-gray-200 dark:border-cyan-950/80 shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent-200/10 dark:bg-cyan-500/10 border border-accent-200/30 dark:border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-accent-200 dark:text-cyan-400">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-100 dark:text-white">
              Painel de Controlo NEEI
            </h1>
            <p className="text-xs text-text-200 dark:text-slate-400 mt-1">
              Acesso restrito à equipa e órgãos sociais do núcleo
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-200 dark:text-slate-400 mb-2">
                Senha de Equipa
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Insere a senha do NEEI"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/40 dark:focus:ring-cyan-500/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-600 dark:text-red-300">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn || !password}
              className="w-full py-3 px-4 bg-primary-300 dark:bg-cyan-600 hover:bg-primary-200 dark:hover:bg-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loggingIn ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>A autenticar...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Entrar no Painel</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-gray-400 dark:text-slate-500">
              UAlg LEI • Núcleo de Estudantes de Engenharia Informática
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Autenticado
  return (
    <div className="min-h-screen bg-bg-100 dark:bg-[#070e17] text-text-100 dark:text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Superior */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#0c1724] p-6 rounded-2xl border border-gray-200 dark:border-cyan-950/80 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent-200/10 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400">
              <Shield size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-text-100 dark:text-white">
                  Painel de Administração
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  EQUIPA NEEI
                </span>
              </div>
              <p className="text-xs text-text-200 dark:text-slate-400">
                Gestão de inscrições e calendário de atividades
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => token && loadDashboardData(token)}
              disabled={loading}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
              title="Atualizar dados"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-200 dark:bg-cyan-600 hover:bg-accent-100 dark:hover:bg-cyan-500 text-white font-semibold text-xs sm:text-sm shadow-md transition"
            >
              <Plus size={16} />
              <span>Nova Atividade</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/70 text-xs font-semibold transition"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Terminar Sessão</span>
            </button>
          </div>
        </div>

        {/* Notificação Temporária de Feedback */}
        {actionFeedback && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>{actionFeedback.message}</span>
            </div>
            <button onClick={() => setActionFeedback(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Resumo Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
        </div>

        {/* Lista de Atividades & Inscrições */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-text-100 dark:text-white">
              Atividades Registadas ({activities.length})
            </h2>
            <span className="text-xs text-text-200 dark:text-slate-400">
              Clica numa atividade para ver os alunos inscritos
            </span>
          </div>

          {loading && activities.length === 0 ? (
            <div className="py-16 text-center">
              <Loader2 className="animate-spin mx-auto text-accent-200 dark:text-cyan-400 mb-3" size={32} />
              <p className="text-sm text-text-200 dark:text-slate-400">A carregar atividades...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-2xl text-center text-red-600">
              {error}
            </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#0c1724] rounded-2xl border border-dashed border-gray-300 dark:border-slate-800">
              <p className="text-text-200 dark:text-slate-400">Nenhuma atividade registada.</p>
              <button
                onClick={openCreateModal}
                className="mt-3 px-4 py-2 bg-accent-200 text-white rounded-xl text-sm font-semibold"
              >
                Criar Primeira Atividade
              </button>
            </div>
          ) : (
            activities.map(activity => {
              const isExpanded = expandedActivityId === activity.id;
              const registrations = activity.registrations || [];

              return (
                <div
                  key={activity.id}
                  className={`bg-white dark:bg-[#0c1724] rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${activity.status === 'ongoing'
                    ? 'border-emerald-500/40 dark:border-emerald-500/30'
                    : 'border-gray-200 dark:border-cyan-950/60'
                    }`}
                >
                  {/* Cabeçalho do Card da Atividade */}
                  <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                    <div
                      className="flex-1 min-w-[260px] cursor-pointer"
                      onClick={() => setExpandedActivityId(isExpanded ? null : activity.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${activity.status === 'ongoing'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : activity.status === 'upcoming'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                        >
                          {activity.status === 'ongoing'
                            ? '● A Decorrer'
                            : activity.status === 'upcoming'
                              ? '○ Futura'
                              : 'Concluída'}
                        </span>
                        <span className="text-xs font-semibold text-text-200 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {activity.category}
                        </span>
                        <span className="text-xs text-text-200 dark:text-slate-400 flex items-center gap-1">
                          <Calendar size={12} /> {activity.date}
                        </span>
                        {activity.registration_opens_at && (
                          <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Calendar size={10} />
                            Abre a {activity.registration_opens_at}
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
                        onClick={() => setExpandedActivityId(isExpanded ? null : activity.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-xs font-semibold text-text-100 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
                      >
                        <Users size={14} className="text-accent-200 dark:text-cyan-400" />
                        <span>{registrations.length} inscritos</span>
                      </button>

                      {/* Botão de Alterar Estado */}
                      <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-0.5">
                        <button
                          onClick={() => handleToggleStatus(activity, 'ongoing')}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${activity.status === 'ongoing'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-text-200 dark:text-slate-400 hover:text-text-100'
                            }`}
                        >
                          A Decorrer
                        </button>
                        <button
                          onClick={() => handleToggleStatus(activity, 'upcoming')}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${activity.status === 'upcoming'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-text-200 dark:text-slate-400 hover:text-text-100'
                            }`}
                        >
                          Futura
                        </button>
                      </div>

                      {/* Ações rápidas */}
                      <button
                        onClick={() => copyEmailsToClipboard(activity)}
                        className="p-2 rounded-xl text-text-200 hover:text-text-100 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                        title="Copiar lista de emails institucionais"
                      >
                        <Copy size={16} />
                      </button>

                      <button
                        onClick={() => exportCsv(activity)}
                        className="p-2 rounded-xl text-text-200 hover:text-text-100 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                        title="Descarregar CSV com nomes e números"
                      >
                        <Download size={16} />
                      </button>

                      <button
                        onClick={() => openEditModal(activity)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/50 dark:hover:bg-cyan-500/30 shadow-sm transition-all"
                        title="Editar dados da atividade"
                      >
                        <Pencil size={13} className="text-sky-600 dark:text-cyan-400" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => setConfirmDeleteAct(activity.id)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
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
                              onClick={() => copyEmailsToClipboard(activity)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-text-100 dark:text-slate-200 hover:bg-gray-50 transition"
                            >
                              <Copy size={12} />
                              <span>Copiar Emails</span>
                            </button>
                            <button
                              onClick={() => exportCsv(activity)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-text-100 dark:text-slate-200 hover:bg-gray-50 transition"
                            >
                              <FileSpreadsheet size={12} />
                              <span>Exportar CSV</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {registrations.length === 0 ? (
                        <div className="py-8 text-center bg-white dark:bg-slate-900/60 rounded-xl border border-dashed border-gray-200 dark:border-slate-800">
                          <Users size={28} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
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
                                const regDate = new Date(reg.registered_at).toLocaleString('pt-PT', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });

                                return (
                                  <tr key={reg.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition">
                                    <td className="py-3 px-4 text-gray-400 font-mono">{index + 1}</td>
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
                                          setConfirmDeleteReg({
                                            regId: reg.id,
                                            studentName: reg.student_name,
                                            studentNumber: reg.student_number,
                                            activityId: activity.id
                                          })
                                        }
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition font-medium text-[11px]"
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

      {/* MODAL DE CONFIRMAÇÃO DE REMOÇÃO DE INSCRIÇÃO */}
      {confirmDeleteReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold text-text-100 dark:text-white">Remover Inscrição</h3>
            </div>
            <p className="text-sm text-text-200 dark:text-slate-300">
              Tens a certeza de que pretendes desinscrever o aluno{' '}
              <strong className="text-text-100 dark:text-white">{confirmDeleteReg.studentName}</strong> (
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{confirmDeleteReg.studentNumber}</span>)?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteReg(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveRegistration}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Confirmar Remoção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE ELIMINAÇÃO DE ATIVIDADE */}
      {confirmDeleteAct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold text-text-100 dark:text-white">Eliminar Atividade</h3>
            </div>
            <p className="text-sm text-text-200 dark:text-slate-300">
              Atenção: Ao eliminar esta atividade, todas as inscrições associadas serão também removidas de forma irreversível.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDeleteAct(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteActivity(confirmDeleteAct)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAR/EDITAR ATIVIDADE (SEM TAGS) */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200 dark:border-cyan-900/60 p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-text-100 dark:text-white">
                {editingActivity ? 'Editar Atividade' : 'Nova Atividade NEEI'}
              </h3>
              <button onClick={() => setIsActivityModalOpen(false)}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Título da Atividade</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
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
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Descreve os objetivos, tópicos abordados e pré-requisitos..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Palestra">Palestra</option>
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
                    onChange={e => setFormStatus(e.target.value as ActivityStatus)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                  >
                    <option value="ongoing">A Decorrer (Inscrições Abertas)</option>
                    <option value="upcoming">Futura (No Calendário)</option>
                    <option value="completed">Concluída</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Data (MM-DD-AAAA)</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Horário</label>
                  <input
                    type="text"
                    required
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
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
                    onChange={e => setFormLocation(e.target.value)}
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
                    onChange={e => setFormMaxCapacity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Orador / Facilitador (opcional)</label>
                <input
                  type="text"
                  value={formSpeaker}
                  onChange={e => setFormSpeaker(e.target.value)}
                  placeholder="ex.: Equipa NEEI ou Convidado"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Data de Abertura das Inscrições (opcional)</label>
                <input
                  type="date"
                  value={formRegistrationOpensAt}
                  onChange={e => setFormRegistrationOpensAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900"
                />
                <span className="text-[11px] text-text-200 dark:text-slate-400 block mt-1">
                  Se preenchida, é exibido a todos os utilizadores a data em que as inscrições abrem (ex.: "Inscrições abrem a 28 de setembro").
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingActivity}
                  className="px-5 py-2.5 bg-accent-200 dark:bg-cyan-600 hover:bg-accent-100 dark:hover:bg-cyan-500 text-white font-semibold rounded-xl transition flex items-center gap-2"
                >
                  {savingActivity ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Guardar Atividade</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

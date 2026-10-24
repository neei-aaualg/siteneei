import React, { useState, useEffect } from 'react';
import {
  AdminActivityWithRegistrations,
  ActivityStatus,
} from '../types/activities';
import {
  CollaboratorApplication,
  CollaboratorStatus,
} from '../types/collaborators';
import { JobOffer, JobStatus } from '../types/jobs';
import {
  adminLogin,
  fetchAdminActivities,
  removeRegistration,
  updateActivityStatus,
  saveActivity,
  deleteActivity,
  getStoredAdminToken,
  clearStoredAdminToken,
} from '../services/activitiesService';
import {
  fetchAdminCollaborators,
  updateCollaboratorStatus as apiUpdateCollaboratorStatus,
  deleteCollaboratorApplication as apiDeleteCollaboratorApplication,
} from '../services/collaboratorsService';
import {
  fetchAdminJobs,
  updateJobStatus as apiUpdateJobStatus,
  deleteJobOffer as apiDeleteJobOffer,
} from '../services/jobsService';
import { formatDateTimeDDMMAAAA, formatDateDDMMAAAA } from '../utils/dateHelpers';

// Subcomponentes Modulares do Painel de Admin
import { AdminTab } from '../components/admin/adminTypes';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminActivitiesTab } from '../components/admin/AdminActivitiesTab';
import { AdminCollaboratorsTab } from '../components/admin/AdminCollaboratorsTab';
import { AdminJobsTab } from '../components/admin/AdminJobsTab';
import { AdminShopPanel } from '../components/admin/AdminShopPanel';
import { ActivityModal } from '../components/admin/modals/ActivityModal';
import {
  ConfirmDeleteRegistrationModal,
  ConfirmDeleteActivityModal,
  ConfirmDeleteCollaboratorModal,
  ConfirmDeleteJobModal,
} from '../components/admin/modals/ConfirmDeleteModals';
import { Check, X } from 'lucide-react';

export const Admin: React.FC = () => {
  // Autenticação & Token
  const [token, setToken] = useState<string | null>(() => getStoredAdminToken());
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Dados do Dashboard
  const [activities, setActivities] = useState<AdminActivityWithRegistrations[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorApplication[]>([]);
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab Ativa (Modular & Extensível)
  const [activeTab, setActiveTab] = useState<AdminTab>('activities');

  // Estados de Interação
  const [expandedActivityIds, setExpandedActivityIds] = useState<string[]>([]);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string } | null>(
    null
  );

  // Modais de Confirmação de Eliminação
  const [confirmDeleteReg, setConfirmDeleteReg] = useState<{
    regId: string;
    studentName: string;
    studentNumber: string;
    activityId: string;
  } | null>(null);
  const [confirmDeleteAct, setConfirmDeleteAct] = useState<string | null>(null);
  const [confirmDeleteCollab, setConfirmDeleteCollab] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmDeleteJob, setConfirmDeleteJob] = useState<{
    id: string;
    title: string;
    company: string;
  } | null>(null);

  // Modal de Criar/Editar Atividade
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] =
    useState<Partial<AdminActivityWithRegistrations> | null>(null);
  const [savingActivity, setSavingActivity] = useState(false);

  // Form State para Nova/Edição de Atividade
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

  // Estados de atualização em curso
  const [updatingCollabId, setUpdatingCollabId] = useState<string | null>(null);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  const showFeedback = (id: string, message: string) => {
    setActionFeedback({ id, message });
    setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
  };

  const loadDashboardData = async (activeToken: string) => {
    try {
      setLoading(true);
      setError(null);
      const [actData, collabData, jobData] = await Promise.all([
        fetchAdminActivities(activeToken),
        fetchAdminCollaborators(activeToken).catch((err) => {
          console.error('Error fetching collaborators:', err);
          return [] as CollaboratorApplication[];
        }),
        fetchAdminJobs(activeToken).catch((err) => {
          console.error('Error fetching jobs:', err);
          return [] as JobOffer[];
        }),
      ]);
      setActivities(actData);
      setCollaborators(collabData);
      setJobs(jobData);

      // Expande por padrão as atividades a decorrer se existirem
      const ongoingIds = actData.filter((a) => a.status === 'ongoing').map((a) => a.id);
      if (ongoingIds.length > 0) {
        setExpandedActivityIds((prev) => (prev.length === 0 ? ongoingIds : prev));
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

  const handleLogin = async (pwd: string) => {
    try {
      setLoggingIn(true);
      setLoginError(null);
      const res = await adminLogin(pwd);
      if (res.token) {
        setToken(res.token);
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
    setCollaborators([]);
    setJobs([]);
  };

  // Funções de Atividades
  const toggleActivityExpanded = (id: string) => {
    setExpandedActivityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const expandAllActivities = () => {
    setExpandedActivityIds(activities.map((a) => a.id));
  };

  const collapseAllActivities = () => {
    setExpandedActivityIds([]);
  };

  const handleToggleStatus = async (
    activity: AdminActivityWithRegistrations,
    newStatus: ActivityStatus
  ) => {
    if (!token) return;
    try {
      await updateActivityStatus(token, activity.id, newStatus);
      setActivities((prev) =>
        prev.map((a) => (a.id === activity.id ? { ...a, status: newStatus } : a))
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
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
      setConfirmDeleteAct(null);
      showFeedback('act-deleted', 'Atividade eliminada');
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar atividade');
    }
  };

  const handleRemoveRegistration = async () => {
    if (!confirmDeleteReg || !token) return;
    try {
      await removeRegistration(token, confirmDeleteReg.regId);
      setActivities((prev) =>
        prev.map((act) => {
          if (act.id === confirmDeleteReg.activityId) {
            return {
              ...act,
              registrations: act.registrations.filter((r) => r.id !== confirmDeleteReg.regId),
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

  const copyEmailsToClipboard = (activity: AdminActivityWithRegistrations) => {
    const emails = activity.registrations.map((r) => `${r.student_number}@ualg.pt`).join(', ');
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
    activity.registrations.forEach((r) => {
      const regDate = formatDateTimeDDMMAAAA(r.registered_at);
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
    const today = new Date().toISOString().split('T')[0];
    setEditingActivity(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Workshop');
    setFormStatus('ongoing');
    setFormDate(today);
    setFormTime('14:30 - 17:00');
    setFormLocation('Laboratório 1.15, Edifício 1, Gambelas');
    setFormMaxCapacity(35);
    setFormSpeaker('Equipa NEEI');
    setFormRegistrationOpensAt('');
    setIsActivityModalOpen(true);
  };

  const handleFormDateChange = (newDate: string) => {
    setFormDate(newDate);
    if (!newDate) return;
    if (!editingActivity || editingActivity.status !== 'completed') {
      const target = new Date(newDate + 'T00:00:00');
      if (!isNaN(target.getTime())) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const distanceToMonday = (dayOfWeek + 6) % 7;
        const monday = new Date(now);
        monday.setDate(now.getDate() - distanceToMonday);
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);
        if (target >= monday && target <= sunday) {
          setFormStatus('ongoing');
        } else if (
          target > sunday &&
          (!formRegistrationOpensAt || new Date(formRegistrationOpensAt + 'T00:00:00') > now)
        ) {
          setFormStatus('upcoming');
        }
      }
    }
  };

  const handleFormRegistrationOpensAtChange = (newRegDate: string) => {
    setFormRegistrationOpensAt(newRegDate);
    if (!editingActivity || editingActivity.status !== 'completed') {
      if (newRegDate) {
        const regTarget = new Date(newRegDate + 'T00:00:00');
        const now = new Date();
        if (!isNaN(regTarget.getTime()) && regTarget <= now) {
          setFormStatus('ongoing');
        }
      }
    }
  };

  const openEditModal = (activity: AdminActivityWithRegistrations) => {
    setEditingActivity(activity);
    setFormTitle(activity.title);
    setFormDescription(activity.description);
    setFormCategory(activity.category);
    setFormStatus(activity.status);
    setFormDate(activity.date || '');
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
        date: formDate ? formDate.trim() : '',
        time: formTime.trim(),
        location: formLocation.trim(),
        max_capacity: Number(formMaxCapacity) || 0,
        speaker: formSpeaker.trim(),
        registration_opens_at: formRegistrationOpensAt ? formRegistrationOpensAt.trim() : undefined,
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

  // Funções de Colaboradores
  const handleUpdateCollabStatus = async (collabId: string, newStatus: CollaboratorStatus) => {
    if (!token) return;
    try {
      setUpdatingCollabId(collabId);
      await apiUpdateCollaboratorStatus(token, collabId, newStatus);
      setCollaborators((prev) =>
        prev.map((c) => (c.id === collabId ? { ...c, status: newStatus } : c))
      );
      showFeedback(collabId, `Estado atualizado com sucesso`);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar estado da candidatura');
    } finally {
      setUpdatingCollabId(null);
    }
  };

  const handleDeleteCollab = async (collabId: string) => {
    if (!token) return;
    try {
      await apiDeleteCollaboratorApplication(token, collabId);
      setCollaborators((prev) => prev.filter((c) => c.id !== collabId));
      setConfirmDeleteCollab(null);
      showFeedback('collab-deleted', 'Candidatura removida com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar candidatura');
    }
  };

  const copyCollabEmails = (filtered: CollaboratorApplication[]) => {
    if (filtered.length === 0) {
      alert('Não existem candidaturas para copiar.');
      return;
    }
    const emails = filtered
      .map((c) => c.email || `${c.student_number}@ualg.pt`)
      .filter(Boolean)
      .join('; ');
    navigator.clipboard.writeText(emails);
    showFeedback('copy-collabs', `${filtered.length} emails de colaboradores copiados!`);
  };

  const exportCollabCsv = (filtered: CollaboratorApplication[]) => {
    if (filtered.length === 0) {
      alert('Não existem candidaturas para exportar.');
      return;
    }
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent +=
      'Nome,Numero de Aluno,Email,Telemovel,Curso,Ano,Areas de Interesse,Estado,Data Submissao,Motivacao\n';
    filtered.forEach((c) => {
      const regDate = formatDateTimeDDMMAAAA(c.created_at);
      const safeMotiv = (c.motivation || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const safeAreas = (c.areas_of_interest || '').replace(/"/g, '""');
      csvContent += `"${c.name}","${c.student_number}","${c.email}","${c.phone}","${c.course}","${c.academic_year}","${safeAreas}","${c.status}","${regDate}","${safeMotiv}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `candidaturas_colaboradores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funções de Vagas
  const handleUpdateJobStatus = async (jobId: string, newStatus: JobStatus) => {
    if (!token) return;
    try {
      setUpdatingJobId(jobId);
      await apiUpdateJobStatus(token, jobId, newStatus);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
      showFeedback(jobId, `Estado da vaga atualizado`);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar estado da vaga');
    } finally {
      setUpdatingJobId(null);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!token) return;
    try {
      await apiDeleteJobOffer(token, jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setConfirmDeleteJob(null);
      showFeedback('job-deleted', 'Oferta de vaga removida com sucesso!');
    } catch (err: any) {
      alert(err.message || 'Erro ao eliminar oferta de vaga');
    }
  };

  const copyJobEmails = (filtered: JobOffer[]) => {
    if (filtered.length === 0) {
      alert('Não existem ofertas filtradas para copiar.');
      return;
    }
    const emails = filtered
      .map((j) => j.email)
      .filter(Boolean)
      .join(', ');
    if (!emails) {
      alert('Nenhum email disponível.');
      return;
    }
    navigator.clipboard.writeText(emails);
    showFeedback('jobs-emails-copied', `${filtered.length} emails de recrutadores copiados!`);
  };

  const exportJobsCsv = (filtered: JobOffer[]) => {
    if (filtered.length === 0) {
      alert('Não existem ofertas para exportar.');
      return;
    }
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent +=
      'Empresa,Titulo,Tipo,Localizacao,Email,Telefone,Website,Estado,Data de Submissao,Descricao\n';
    filtered.forEach((j) => {
      const regDate = formatDateDDMMAAAA(j.created_at);
      const safeDesc = (j.description || '').replace(/"/g, '""').replace(/\n/g, ' ');
      csvContent += `"${j.company}","${j.title}","${j.type}","${j.location}","${j.email}","${j.phone}","${j.link || ''}","${j.status}","${regDate}","${safeDesc}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vagas_neei_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Se não estiver autenticado, exibe o Login modular
  if (!token) {
    return (
      <AdminLogin
        onLogin={handleLogin}
        loggingIn={loggingIn}
        loginError={loginError}
      />
    );
  }

  const ongoingCount = activities.filter((a) => a.status === 'ongoing').length;
  const pendingCollabCount = collaborators.filter((c) => c.status === 'pending').length;
  const pendingJobCount = jobs.filter((j) => j.status === 'pending').length;

  return (
    <div className="min-h-screen bg-bg-100 dark:bg-[#070e17] text-text-100 dark:text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar de Navegação Limpa & Espaçosa */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activitiesCount={activities.length}
        ongoingCount={ongoingCount}
        pendingCollabCount={pendingCollabCount}
        totalCollabCount={collaborators.length}
        pendingJobCount={pendingJobCount}
        totalJobCount={jobs.length}
        onNewActivity={openCreateModal}
        onRefresh={() => token && loadDashboardData(token)}
        onLogout={handleLogout}
        loading={loading}
      />

      {/* Conteúdo Principal do Painel */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner de Feedback Temporário */}
        {actionFeedback && (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-2xl text-sm flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2">
              <Check size={16} />
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Separador Modular Ativo */}
        {activeTab === 'activities' && (
          <AdminActivitiesTab
            activities={activities}
            loading={loading}
            error={error}
            expandedActivityIds={expandedActivityIds}
            onToggleExpand={toggleActivityExpanded}
            onExpandAll={expandAllActivities}
            onCollapseAll={collapseAllActivities}
            onOpenCreateModal={openCreateModal}
            onOpenEditModal={openEditModal}
            onToggleStatus={handleToggleStatus}
            onConfirmDeleteActivity={(id) => setConfirmDeleteAct(id)}
            onConfirmDeleteRegistration={(data) => setConfirmDeleteReg(data)}
            onCopyEmails={copyEmailsToClipboard}
            onExportCsv={exportCsv}
          />
        )}

        {activeTab === 'collaborators' && (
          <AdminCollaboratorsTab
            collaborators={collaborators}
            updatingCollabId={updatingCollabId}
            onUpdateStatus={handleUpdateCollabStatus}
            onConfirmDelete={(data) => setConfirmDeleteCollab(data)}
            onCopyEmails={copyCollabEmails}
            onExportCsv={exportCollabCsv}
          />
        )}

        {activeTab === 'jobs' && (
          <AdminJobsTab
            jobs={jobs}
            updatingJobId={updatingJobId}
            onUpdateStatus={handleUpdateJobStatus}
            onConfirmDelete={(data) => setConfirmDeleteJob(data)}
            onCopyEmails={copyJobEmails}
            onExportCsv={exportJobsCsv}
          />
        )}

        {activeTab === 'shop' && (
          <div className="animate-fadeIn">
            <AdminShopPanel token={token} />
          </div>
        )}
      </main>

      {/* MODAIS MODULARES */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSubmit={handleSaveActivity}
        editingActivity={editingActivity}
        savingActivity={savingActivity}
        formTitle={formTitle}
        setFormTitle={setFormTitle}
        formDescription={formDescription}
        setFormDescription={setFormDescription}
        formCategory={formCategory}
        setFormCategory={setFormCategory}
        formStatus={formStatus}
        setFormStatus={setFormStatus}
        formDate={formDate}
        onFormDateChange={handleFormDateChange}
        formTime={formTime}
        setFormTime={setFormTime}
        formLocation={formLocation}
        setFormLocation={setFormLocation}
        formMaxCapacity={formMaxCapacity}
        setFormMaxCapacity={setFormMaxCapacity}
        formSpeaker={formSpeaker}
        setFormSpeaker={setFormSpeaker}
        formRegistrationOpensAt={formRegistrationOpensAt}
        onFormRegistrationOpensAtChange={handleFormRegistrationOpensAtChange}
      />

      <ConfirmDeleteRegistrationModal
        data={confirmDeleteReg}
        onClose={() => setConfirmDeleteReg(null)}
        onConfirm={handleRemoveRegistration}
      />

      <ConfirmDeleteActivityModal
        activityId={confirmDeleteAct}
        activityTitle={activities.find((a) => a.id === confirmDeleteAct)?.title}
        onClose={() => setConfirmDeleteAct(null)}
        onConfirm={handleDeleteActivity}
      />

      <ConfirmDeleteCollaboratorModal
        data={confirmDeleteCollab}
        onClose={() => setConfirmDeleteCollab(null)}
        onConfirm={handleDeleteCollab}
      />

      <ConfirmDeleteJobModal
        data={confirmDeleteJob}
        onClose={() => setConfirmDeleteJob(null)}
        onConfirm={handleDeleteJob}
      />
    </div>
  );
};

export default Admin;

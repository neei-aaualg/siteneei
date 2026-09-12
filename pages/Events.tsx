import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarPlus,
  Send,
  X,
  Users,
  Hash
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Activity } from '../types/activities';
import { fetchPublicActivities, registerForActivity, fetchAppConfig } from '../services/activitiesService';

export const Events: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(true);

  // Modal / Formulário de Inscrição
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);

  // Filtro de Categoria no Calendário Futuro
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const loadActivities = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const [config, data] = await Promise.all([
        fetchAppConfig(),
        fetchPublicActivities()
      ]);
      setShowCalendar(config.showCalendar);
      setActivities(data);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      setFetchError(err.message || 'Não foi possível carregar as atividades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const ongoingActivities = activities.filter(a => a.status === 'ongoing');
  const upcomingActivities = activities.filter(a => a.status === 'upcoming');

  const categories = Array.from(new Set(upcomingActivities.map(a => a.category)));
  const filteredUpcoming = selectedCategory === 'all'
    ? upcomingActivities
    : upcomingActivities.filter(a => a.category === selectedCategory);

  const openRegisterModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setStudentName('');
    setStudentNumber('');
    setFormError(null);
    setRegistrationSuccess(null);
  };

  const closeRegisterModal = () => {
    setSelectedActivity(null);
    setStudentName('');
    setStudentNumber('');
    setFormError(null);
    setRegistrationSuccess(null);
  };

  const isStudentNumberValid = (val: string) => {
    const clean = val.trim().toLowerCase().replace(/@ualg\.pt$/i, '');
    return /^a?\d{4,7}$/i.test(clean);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    const cleanName = studentName.trim();
    const cleanNum = studentNumber.trim().toLowerCase().replace(/@ualg\.pt$/i, '');

    if (cleanName.length < 2) {
      setFormError('Por favor insere o teu nome completo');
      return;
    }

    if (!isStudentNumberValid(cleanNum)) {
      setFormError('Por favor insere um número de aluno válido (ex.: a74123 ou 74123)');
      return;
    }

    // Normaliza para o formato oficial 'a' + dígitos
    const finalNumber = cleanNum.startsWith('a') ? cleanNum : 'a' + cleanNum;

    try {
      setSubmitting(true);
      setFormError(null);

      const res = await registerForActivity(selectedActivity.id, cleanName, finalNumber);
      setRegistrationSuccess(res.message || 'Inscrição confirmada com sucesso!');

      // Efeito de confetis
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (cErr) {
        // Fallback silencioso
      }

      // Atualiza a lista em background
      loadActivities();
    } catch (err: any) {
      setFormError(err.message || 'Ocorreu um erro ao processar a tua inscrição.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(Number(year), month, day);
        return {
          day: String(day).padStart(2, '0'),
          month: d.toLocaleDateString('pt-PT', { month: 'short' }).toUpperCase().replace('.', ''),
          full: d.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        };
      }
    } catch (e) {
      // fallback
    }
    return { day: '--', month: 'MÊS', full: dateStr };
  };

  const formatOpenDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(Number(year), month, day);
        return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
      }
    } catch (e) {
      // fallback
    }
    return dateStr;
  };

  const createGoogleCalendarUrl = (activity: Activity) => {
    const title = encodeURIComponent(activity.title);
    const details = encodeURIComponent(`${activity.description}\n\nOrganizado pelo NEEI UAlg`);
    const location = encodeURIComponent(activity.location);

    const dateClean = activity.date.replace(/-/g, '');
    const datesParam = `${dateClean}T090000Z/${dateClean}T180000Z`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${datesParam}`;
  };

  return (
    <div className="min-h-screen bg-bg-100 dark:bg-[#070e17] text-text-100 dark:text-slate-100 transition-colors duration-300">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-primary-200/50 dark:border-cyan-950/70 bg-gradient-to-b from-primary-100/30 via-transparent to-transparent dark:from-cyan-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-100/20 dark:bg-cyan-500/10 border border-accent-100/40 dark:border-cyan-500/30 text-xs font-semibold text-primary-300 dark:text-cyan-300 mb-4">
                <Sparkles size={14} className="animate-pulse text-accent-200 dark:text-cyan-400" />
                <span>Calendário Oficial do Mandato</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-100 dark:text-white mb-4">
                Atividades & Eventos <span className="text-accent-200 dark:text-cyan-400">NEEI</span>
              </h1>
              <p className="text-lg text-text-200 dark:text-slate-300 leading-relaxed">
                Participa nos nossos workshops práticos, hackathons, palestras de carreira e torneios de programação.
                Garante o teu lugar nas atividades a decorrer com o teu nome e número de aluno.
              </p>
            </div>

            {/* Quick stats badge */}
            {showCalendar && (
              <div className="flex gap-4 sm:gap-6 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-gray-200/80 dark:border-cyan-900/50 shadow-sm">
                <div className="text-center px-3">
                  <div className="text-2xl sm:text-3xl font-bold text-accent-200 dark:text-cyan-400">
                    {ongoingActivities.length}
                  </div>
                  <div className="text-xs font-medium text-text-200 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    A Decorrer
                  </div>
                </div>
                <div className="w-px bg-gray-200 dark:bg-slate-800" />
                <div className="text-center px-3">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-300 dark:text-slate-200">
                    {upcomingActivities.length}
                  </div>
                  <div className="text-xs font-medium text-text-200 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    Agendadas
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="animate-spin text-accent-200 dark:text-cyan-400" size={42} />
            <p className="text-sm font-medium text-text-200 dark:text-slate-400">A carregar atividades do NEEI...</p>
          </div>
        ) : !showCalendar ? (
          <div className="py-20 sm:py-28 flex flex-col items-center justify-center text-center px-4 animate-fadeIn">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-cyan-500/10 dark:bg-cyan-500/20 text-accent-200 dark:text-cyan-400 flex items-center justify-center mb-6 shadow-sm border border-cyan-500/20">
              <CalendarIcon size={38} className="animate-pulse" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-text-100 dark:text-white tracking-tight mb-3">
              Calendário será anunciado brevemente...
            </h2>
            <p className="text-sm sm:text-base text-text-200 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Fica atento às nossas redes sociais e ao portal para saberes em primeira mão todas as datas das próximas atividades do NEEI.
            </p>
          </div>
        ) : fetchError ? (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 text-center">
            <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Erro ao carregar atividades</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{fetchError}</p>
            <button
              onClick={loadActivities}
              className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
            >
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            {/* SECÇÃO 1: Atividades a Decorrer */}
            <section aria-labelledby="ongoing-activities-title">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                  <h2 id="ongoing-activities-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-100 dark:text-white">
                    Atividades a Decorrer
                  </h2>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                  Inscrições Abertas
                </span>
              </div>

              {ongoingActivities.length === 0 ? (
                <div className="bg-white/50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 p-10 text-center">
                  <CalendarIcon className="mx-auto text-gray-400 dark:text-slate-600 mb-3 opacity-60" size={40} />
                  <p className="text-lg font-medium text-text-200 dark:text-slate-400">
                    Não existem atividades com inscrições abertas no momento.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">
                    Consulta abaixo o calendário das próximas atividades.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {ongoingActivities.map(activity => {
                    const dateInfo = formatDisplayDate(activity.date);
                    return (
                      <div
                        key={activity.id}
                        className="group relative bg-white dark:bg-[#0c1724] rounded-2xl border border-emerald-500/30 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/60 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                      >
                        {/* Top Accent bar */}
                        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

                        <div className="p-6 sm:p-8 flex-1">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {activity.category}
                            </span>

                            {activity.max_capacity && activity.max_capacity > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs text-text-200 dark:text-slate-400 bg-gray-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
                                <Users size={13} />
                                <span>
                                  {activity.registrations_count || 0} / {activity.max_capacity} inscritos
                                </span>
                              </span>
                            ) : null}
                          </div>

                          <h3 className="text-xl sm:text-2xl font-bold text-text-100 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {activity.title}
                          </h3>

                          <p className="text-sm sm:text-base text-text-200 dark:text-slate-300 leading-relaxed mb-6">
                            {activity.description}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-text-200 dark:text-slate-400 mb-6 bg-gray-50/80 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                              <CalendarIcon size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="font-medium text-text-100 dark:text-slate-200">{dateInfo.full}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Clock size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{activity.time}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <MapPin size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="truncate">{activity.location}</span>
                            </div>
                            {activity.speaker && (
                              <div className="flex items-center gap-2.5">
                                <User size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate">{activity.speaker}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Action Footer */}
                        <div className="p-6 sm:p-8 pt-0 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 dark:border-slate-800/80 mt-auto">
                          <button
                            onClick={() => openRegisterModal(activity)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <span>Inscrever-me na Atividade</span>
                            <Send size={15} />
                          </button>

                          <a
                            href={createGoogleCalendarUrl(activity)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-200 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
                            title="Adicionar ao Google Calendar"
                          >
                            <CalendarPlus size={16} />
                            <span className="hidden sm:inline">Google Calendar</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* SECÇÃO 2: Calendário de Atividades Futuras */}
            <section aria-labelledby="upcoming-activities-title" className="pt-8 border-t border-gray-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div>
                  <h2 id="upcoming-activities-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-text-100 dark:text-white">
                    Calendário de Atividades Futuras
                  </h2>
                  <p className="text-sm text-text-200 dark:text-slate-400 mt-1">
                    Planeia a tua participação com antecedência. As inscrições abrem na mesma semana da atividade, ou excecionalmente na semana anterior.
                  </p>
                </div>

                {/* Filtros de Categoria */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === 'all'
                        ? 'bg-accent-200 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-sm'
                        : 'bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                        }`}
                    >
                      Todas ({upcomingActivities.length})
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedCategory === cat
                          ? 'bg-accent-200 text-white dark:bg-cyan-500 dark:text-slate-950 shadow-sm'
                          : 'bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filteredUpcoming.length === 0 ? (
                <div className="bg-white/40 dark:bg-slate-900/30 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 p-12 text-center">
                  <CalendarIcon className="mx-auto text-gray-400 dark:text-slate-600 mb-3 opacity-60" size={40} />
                  <p className="text-base font-medium text-text-200 dark:text-slate-400">
                    Nenhuma atividade futura encontrada para a categoria selecionada.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredUpcoming.map(activity => {
                    const dateInfo = formatDisplayDate(activity.date);
                    return (
                      <div
                        key={activity.id}
                        className="bg-white dark:bg-[#0c1724] rounded-2xl border border-gray-200/80 dark:border-cyan-950/60 p-6 flex flex-col justify-between hover:border-accent-200/50 dark:hover:border-cyan-500/40 hover:shadow-md transition-all duration-200"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-4">
                            {/* Bloco de Data Visual */}
                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-primary-100/60 dark:bg-cyan-950/50 border border-primary-200 dark:border-cyan-800/60 text-center shrink-0">
                              <span className="text-lg font-black text-accent-200 dark:text-cyan-400 leading-none">
                                {dateInfo.day}
                              </span>
                              <span className="text-[10px] font-bold text-text-200 dark:text-slate-300 uppercase tracking-tight mt-0.5">
                                {dateInfo.month}
                              </span>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-100/80 dark:bg-slate-800 text-primary-300 dark:text-cyan-300 border border-transparent dark:border-slate-700">
                                {activity.category}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-lg font-bold text-text-100 dark:text-white mb-2 line-clamp-2">
                            {activity.title}
                          </h3>

                          <p className="text-sm text-text-200 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                            {activity.description}
                          </p>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800/80 text-xs text-text-200 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-accent-200 dark:text-cyan-400 shrink-0" />
                            <span>{activity.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-accent-200 dark:text-cyan-400 shrink-0" />
                            <span className="truncate">{activity.location}</span>
                          </div>

                          <div className="pt-2 flex items-center justify-between gap-2">
                            {activity.registration_opens_at ? (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/20 inline-flex items-center gap-1.5">
                                <CalendarIcon size={12} className="shrink-0" />
                                <span>Inscrições abrem a {formatOpenDate(activity.registration_opens_at)}</span>
                              </span>
                            ) : (
                              <span />
                            )}

                            <a
                              href={createGoogleCalendarUrl(activity)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text-200 dark:text-slate-400 hover:text-accent-200 dark:hover:text-cyan-300 transition-colors p-1 ml-auto"
                              title="Adicionar lembrete ao Google Calendar"
                            >
                              <CalendarPlus size={16} />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* MODAL DE INSCRIÇÃO */}
      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-[#0c1724] rounded-3xl border border-gray-200 dark:border-cyan-900/60 shadow-2xl w-full max-w-lg overflow-hidden transition-all transform animate-scaleUp"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Inscrição Oficial
                </span>
                <h3 className="text-xl font-bold text-text-100 dark:text-white leading-snug">
                  {selectedActivity.title}
                </h3>
              </div>
              <button
                onClick={closeRegisterModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {registrationSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 className="text-xl font-bold text-text-100 dark:text-white">Inscrição Confirmada!</h4>
                  <p className="text-sm text-text-200 dark:text-slate-300 max-w-sm mx-auto">
                    O teu lugar para esta atividade está reservado. Vemo-nos no dia {formatDisplayDate(selectedActivity.date).day} no {selectedActivity.location}.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={createGoogleCalendarUrl(selectedActivity)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-100 dark:bg-slate-800 hover:bg-primary-200 text-sm font-semibold rounded-xl transition"
                    >
                      <CalendarPlus size={16} />
                      <span>Adicionar ao Calendário</span>
                    </a>
                    <button
                      onClick={closeRegisterModal}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition"
                    >
                      Concluído
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="bg-primary-100/40 dark:bg-slate-900/60 p-4 rounded-xl text-xs text-text-200 dark:text-slate-300 space-y-1.5 border border-primary-200/40 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{formatDisplayDate(selectedActivity.date).full} ({selectedActivity.time})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{selectedActivity.location}</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="student-name-input" className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <input
                        id="student-name-input"
                        type="text"
                        autoComplete="name"
                        placeholder="ex.: Afonso Bitoque"
                        value={studentName}
                        onChange={e => {
                          setStudentName(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm text-text-100 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="student-number-input" className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5">
                      Número de Aluno
                    </label>
                    <div className="relative">
                      <input
                        id="student-number-input"
                        type="text"
                        placeholder="ex.: a74123 ou 74123"
                        value={studentNumber}
                        onChange={e => {
                          setStudentNumber(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-900 border text-sm text-text-100 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${studentNumber && !isStudentNumberValid(studentNumber)
                          ? 'border-amber-400 focus:ring-amber-400/20'
                          : studentNumber && isStudentNumberValid(studentNumber)
                            ? 'border-emerald-500 focus:ring-emerald-500/20'
                            : 'border-gray-200 dark:border-slate-700 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30'
                          }`}
                        required
                      />
                      {studentNumber && isStudentNumberValid(studentNumber) && (
                        <CheckCircle2
                          size={18}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-text-200 dark:text-slate-400 mt-1">
                      Insere apenas o teu número de aluno (não precisas de colocar @ualg.pt).
                    </p>
                  </div>

                  {formError && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300">
                      <AlertCircle size={16} className="shrink-0 text-red-500 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeRegisterModal}
                      className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !studentName || !studentNumber}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>A validar...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirmar Inscrição</span>
                          <Send size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  MapPin,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  X,
  Send,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  Mail,
  Phone,
  GraduationCap,
  Users,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { JobOffer, JobType } from '../types/jobs';
import { fetchPublicJobs, submitJobOffer } from '../services/jobsService';
import { formatDateDDMMAAAA } from '../utils/dateHelpers';

export const Jobs: React.FC = () => {
  const [jobs, setJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Campos do Formulário
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<JobType>('Estágio');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [link, setLink] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Carregar vagas públicas
  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await fetchPublicJobs();
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const toggleJob = (id: string) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  const handlePhoneChange = (val: string) => {
    // Aceita exclusivamente dígitos
    const numericOnly = val.replace(/\D/g, '');
    setPhone(numericOnly);
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCompany = company.trim();
    const cleanTitle = title.trim();
    const cleanLocation = location.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanLink = link.trim();
    const cleanDescription = description.trim();
    const cleanRequirements = requirements.trim();

    if (cleanCompany.length < 2) {
      setFormError('Por favor introduz o nome da empresa ou recrutador.');
      return;
    }

    if (cleanTitle.length < 2) {
      setFormError('Por favor introduz o título da vaga/função.');
      return;
    }

    if (cleanLocation.length < 2) {
      setFormError('Por favor introduz a localização (ex.: Faro / Híbrido, Remoto).');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Por favor introduz um email de contacto válido.');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 9) {
      setFormError(
        'Por favor introduz um número de contacto válido (apenas números, mín. 9 dígitos).'
      );
      return;
    }

    if (cleanDescription.length < 10) {
      setFormError('Por favor descreve a oportunidade com pelo menos 10 caracteres.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      await submitJobOffer({
        company: cleanCompany,
        title: cleanTitle,
        type,
        location: cleanLocation,
        email: cleanEmail,
        phone: cleanPhone,
        link: cleanLink || undefined,
        description: cleanDescription,
        requirements: cleanRequirements || undefined,
      });

      setSubmitted(true);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
        });
      } catch {
        // Silencioso se indisponível
      }
    } catch (err: any) {
      console.error('Error submitting job offer:', err);
      setFormError(err.message || 'Ocorreu um erro ao submeter a vaga.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setCompany('');
    setTitle('');
    setType('Estágio');
    setLocation('');
    setEmail('');
    setPhone('');
    setLink('');
    setDescription('');
    setRequirements('');
    setFormError(null);
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-bg-100 dark:bg-[#070e17] text-text-100 dark:text-slate-100 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Banner de Apresentação */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-100/20 dark:bg-cyan-500/10 border border-accent-100/40 dark:border-cyan-500/30 text-xs font-semibold text-primary-300 dark:text-cyan-300">
            <Sparkles size={14} className="animate-pulse text-accent-200 dark:text-cyan-400" />
            <span>Oportunidades Académicas & Profissionais</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-100 dark:text-white">
            Vagas de <span className="text-accent-200 dark:text-cyan-400">Emprego & Estágio</span>
          </h1>
          <p className="text-sm sm:text-base text-text-200 dark:text-slate-300 leading-relaxed">
            Oportunidades selecionadas para estudantes e recém-diplomados de Engenharia Informática
            da UAlg. Encontra o teu próximo desafio ou publica uma vaga para a nossa comunidade.
          </p>
        </div>

        {/* Pilares / Vantagens */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/70 dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200/80 dark:border-cyan-950/60 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-100/30 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <GraduationCap size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-100 dark:text-white">
                Estágios Curriculares
              </h4>
              <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                Oportunidades de estágio para conclusão de licenciatura e mestrado.
              </p>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200/80 dark:border-cyan-950/60 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Briefcase size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-100 dark:text-white">
                Emprego & Carreiras
              </h4>
              <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                Posições júnior e posições para recém-diplomados e alumni.
              </p>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200/80 dark:border-cyan-950/60 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Building size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-100 dark:text-white">
                Conexão Empresarial
              </h4>
              <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                Contacto direto com empresas que recrutam ativamente no Algarve.
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Vagas Abertas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-text-100 dark:text-white flex items-center gap-2">
              <Briefcase size={22} className="text-accent-200 dark:text-cyan-400" />
              <span>Oportunidades Disponíveis</span>
            </h2>
            <span className="text-xs text-text-200 dark:text-slate-400 font-medium">
              {jobs.length} {jobs.length === 1 ? 'vaga publicada' : 'vagas publicadas'}
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2
                className="animate-spin mx-auto text-accent-200 dark:text-cyan-400 mb-3"
                size={32}
              />
              <p className="text-sm text-text-200 dark:text-slate-400">
                A carregar oportunidades...
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 bg-white dark:bg-[#0c1724] rounded-3xl border-2 border-dashed border-gray-200 dark:border-cyan-950/80 text-center space-y-3 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-accent-100/30 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 flex items-center justify-center">
                <Briefcase size={30} />
              </div>
              <h3 className="text-lg font-bold text-text-100 dark:text-white">
                Não há oportunidades ativas de momento
              </h3>
              <p className="text-xs sm:text-sm text-text-200 dark:text-slate-400 max-w-md">
                Fica atento a futuras publicações. Se representas uma empresa, podes submeter uma
                proposta logo abaixo!
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-200 dark:bg-cyan-600 hover:bg-accent-100 dark:hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus size={16} />
                <span>Publicar a Primeira Oferta</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                const postedDate = formatDateDDMMAAAA(job.created_at);

                return (
                  <div
                    key={job.id}
                    className={`bg-white dark:bg-[#0c1724] rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                      isExpanded
                        ? 'border-accent-200 dark:border-cyan-500/80 shadow-md'
                        : 'border-gray-200 dark:border-cyan-950/70 hover:border-gray-300 dark:hover:border-cyan-800/80'
                    }`}
                  >
                    {/* Cabeçalho do Cartão da Vaga */}
                    <div
                      onClick={() => toggleJob(job.id)}
                      className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              job.type === 'Estágio'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : job.type === 'Full-time'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  : job.type === 'Part-time'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {job.type}
                          </span>
                          <span className="text-xs font-semibold text-text-100 dark:text-slate-200 bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {job.company}
                          </span>
                          <span className="text-xs text-text-200 dark:text-slate-400 flex items-center gap-1">
                            <Clock size={12} />
                            Publicado a {postedDate}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-text-100 dark:text-white truncate">
                          {job.title}
                        </h3>

                        <p className="text-xs text-text-200 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                          <MapPin
                            size={13}
                            className="text-accent-200 dark:text-cyan-400 shrink-0"
                          />
                          <span>{job.location}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-xs font-semibold text-text-100 dark:text-slate-200 flex items-center gap-1.5 transition"
                        >
                          <span>{isExpanded ? 'Menos Detalhes' : 'Ver Detalhes'}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Detalhes Expansíveis da Vaga */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/60 dark:bg-[#0a1420]/60 p-5 sm:p-6 space-y-5 animate-fadeIn">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-400 mb-2">
                            Descrição da Função
                          </h4>
                          <div className="text-xs sm:text-sm text-text-100 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-white dark:bg-[#0c1724] p-4 rounded-xl border border-gray-200/80 dark:border-slate-800">
                            {job.description}
                          </div>
                        </div>

                        {job.requirements && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-400 mb-2">
                              Requisitos & Competências
                            </h4>
                            <div className="text-xs sm:text-sm text-text-100 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-white dark:bg-[#0c1724] p-4 rounded-xl border border-gray-200/80 dark:border-slate-800">
                              {job.requirements}
                            </div>
                          </div>
                        )}

                        {/* Ações de Candidatura */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/60 dark:border-slate-800/60">
                          <div className="text-xs text-text-200 dark:text-slate-400 flex items-center gap-2">
                            <Mail size={14} className="text-accent-200 dark:text-cyan-400" />
                            <span>Contacto: </span>
                            <a
                              href={`mailto:${job.email}`}
                              className="font-semibold text-accent-200 dark:text-cyan-400 hover:underline"
                            >
                              {job.email}
                            </a>
                          </div>

                          {job.link && (
                            <div className="flex items-center gap-3">
                              <a
                                href={job.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-100 dark:bg-slate-800 hover:bg-primary-200 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl text-text-100 dark:text-slate-200 transition"
                              >
                                <span>Website da Vaga</span>
                                <ExternalLink size={13} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Secção de Submissão de Vagas por Empresas */}
        <div className="bg-white dark:bg-[#0c1724] rounded-3xl shadow-xl border border-gray-200/80 dark:border-cyan-950/80 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-100/30 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Building size={24} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-text-100 dark:text-white">
                  És uma empresa à procura de talento?
                </h3>
                <p className="text-xs sm:text-sm text-text-200 dark:text-slate-400 mt-0.5">
                  Publica a tua oferta de emprego ou estágio diretamente na nossa plataforma.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-2 shadow-sm shrink-0 self-start sm:self-auto ${
                isFormOpen
                  ? 'bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                  : 'bg-accent-200 dark:bg-cyan-600 text-white hover:bg-accent-100 dark:hover:bg-cyan-500'
              }`}
            >
              {isFormOpen ? <X size={16} /> : <Plus size={16} />}
              <span>{isFormOpen ? 'Fechar Formulário' : 'Submeter Oferta de Vaga'}</span>
            </button>
          </div>

          {/* Conteúdo do Formulário / Confirmação */}
          {isFormOpen && (
            <div className="p-6 sm:p-10 animate-fadeIn">
              {submitted ? (
                <div className="py-8 text-center space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={44} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-extrabold text-text-100 dark:text-white">
                      Oferta Submetida com Sucesso!
                    </h3>
                    <p className="text-xs sm:text-sm text-text-200 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                      Muito obrigado pela submissão,{' '}
                      <span className="font-semibold text-accent-200 dark:text-cyan-400">
                        {company}
                      </span>
                      ! A equipa do NEEI irá analisar a proposta e publicá-la no portal brevemente.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-2.5 bg-primary-100 dark:bg-slate-800 hover:bg-primary-200 dark:hover:bg-slate-700 text-text-100 dark:text-slate-200 rounded-xl font-semibold text-xs transition"
                    >
                      Submeter Outra Vaga
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {formError && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-3">
                      <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Grupo 1: Identificação da Empresa e Função */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="job-company"
                        className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                      >
                        Nome da Empresa / Recrutador *
                      </label>
                      <input
                        id="job-company"
                        type="text"
                        required
                        placeholder="ex.: Tech Solutions Lda"
                        value={company}
                        onChange={(e) => {
                          setCompany(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="job-title"
                        className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                      >
                        Título da Função / Vaga *
                      </label>
                      <input
                        id="job-title"
                        type="text"
                        required
                        placeholder="ex.: Desenvolvedor Frontend Júnior"
                        value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>

                  {/* Grupo 2: Tipo de Oferta e Localização */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="job-type"
                        className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                      >
                        Tipo de Oferta
                      </label>
                      <select
                        id="job-type"
                        value={type}
                        onChange={(e) => setType(e.target.value as JobType)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                      >
                        <option value="Estágio">Estágio (Curricular / Profissional)</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Bolsa">Bolsa de Investigação</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="job-location"
                        className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                      >
                        Localização *
                      </label>
                      <input
                        id="job-location"
                        type="text"
                        required
                        placeholder="ex.: Faro / Híbrido, Lisboa ou Remoto"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>

                  {/* Grupo 3: Contactos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="job-email"
                        className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                      >
                        Email de Contacto / Candidatura *
                      </label>
                      <input
                        id="job-email"
                        type="email"
                        required
                        placeholder="ex.: recrutamento@empresa.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formError) setFormError(null);
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="job-phone"
                        className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                      >
                        Nº Telemóvel / Contacto (apenas números) *
                      </label>
                      <input
                        id="job-phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        placeholder="ex.: 912345678"
                        value={phone}
                        onKeyDown={(e) => {
                          // Permite apenas dígitos e teclas de controlo
                          if (
                            !/^\d$/.test(e.key) &&
                            ![
                              'Backspace',
                              'Delete',
                              'Tab',
                              'ArrowLeft',
                              'ArrowRight',
                              'ArrowUp',
                              'ArrowDown',
                              'Home',
                              'End',
                              'Enter',
                            ].includes(e.key) &&
                            !e.ctrlKey &&
                            !e.metaKey
                          ) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                      />
                    </div>
                  </div>

                  {/* Link Externo (Opcional) */}
                  <div>
                    <label
                      htmlFor="job-link"
                      className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                    >
                      Link de Candidatura / Website da Vaga (opcional)
                    </label>
                    <input
                      id="job-link"
                      type="url"
                      placeholder="https://empresa.com/careers/vaga-123"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                    />
                  </div>

                  {/* Descrição Detalhada */}
                  <div>
                    <label
                      htmlFor="job-desc"
                      className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                    >
                      Descrição da Oferta & Responsabilidades *
                    </label>
                    <textarea
                      id="job-desc"
                      required
                      rows={4}
                      placeholder="Descreve as principais funções, tarefas diárias, tecnologias utilizadas e o que a empresa oferece..."
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30 leading-relaxed"
                    />
                  </div>

                  {/* Requisitos (Opcional) */}
                  <div>
                    <label
                      htmlFor="job-req"
                      className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                    >
                      Requisitos & Perfil Pretendido (opcional)
                    </label>
                    <textarea
                      id="job-req"
                      rows={3}
                      placeholder="ex.: Conhecimentos em React/Node.js, facilidade de trabalho em equipa, disponibilidade..."
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto px-8 py-3 bg-accent-200 dark:bg-cyan-600 hover:bg-accent-100 dark:hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>A Submeter Oferta...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Enviar Oferta de Vaga</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;

import React, { useState } from 'react';
import {
  UserPlus,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Users,
  Code2,
  Calendar,
  Share2,
  HeartHandshake,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitCollaboratorApplication } from '../services/collaboratorsService';

const AVAILABLE_AREAS = [
  'Organização de Eventos & Workshops',
  'Desenvolvimento de Projetos & Web',
  'Design & Imagem',
  'Redes Sociais & Comunicação',
  'Torneios de Jogos & Comunidade',
  'Parcerias & Patrocínios',
];

const COURSE_YEARS_MAP: Record<string, string[]> = {
  'LEI (Licenciatura em Eng. Informática)': ['1º Ano', '2º Ano', '3º Ano'],
  'MEI (Mestrado em Eng. Informática)': ['1º Ano', '2º Ano'],
  'PSC (Pós Graduação em Cibersegurança)': ['1º Ano'],
};

const getAvailableYearsForCourse = (selectedCourse: string): string[] => {
  return COURSE_YEARS_MAP[selectedCourse] || ['1º Ano', '2º Ano', '3º Ano'];
};

export const Join: React.FC = () => {
  const [name, setName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [academicYear, setAcademicYear] = useState('1º Ano');
  const [course, setCourse] = useState('LEI (Licenciatura em Eng. Informática)');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [motivation, setMotivation] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isStudentNumberValid = (val: string) => {
    const clean = val
      .trim()
      .toLowerCase()
      .replace(/@ualg\.pt$/i, '');
    return /^a?\d{4,7}$/i.test(clean);
  };

  const handleStudentNumberChange = (val: string) => {
    setStudentNumber(val);
    if (formError) setFormError(null);
    const clean = val
      .trim()
      .toLowerCase()
      .replace(/@ualg\.pt$/i, '');
    if (/^a?\d{4,7}$/i.test(clean) && !email) {
      const num = clean.startsWith('a') ? clean : `a${clean}`;
      setEmail(`${num}@ualg.pt`);
    }
  };

  const handlePhoneChange = (val: string) => {
    // Aceita exclusivamente dígitos
    const numericOnly = val.replace(/\D/g, '');
    setPhone(numericOnly);
    if (formError) setFormError(null);
  };

  const handleCourseChange = (newCourse: string) => {
    setCourse(newCourse);
    if (formError) setFormError(null);
    const availableYears = getAvailableYearsForCourse(newCourse);
    if (!availableYears.includes(academicYear)) {
      setAcademicYear(availableYears[0]);
    }
  };

  const toggleArea = (area: string) => {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanNum = studentNumber
      .trim()
      .toLowerCase()
      .replace(/@ualg\.pt$/i, '');
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanEmail =
      email.trim() ||
      (cleanNum ? `${cleanNum.startsWith('a') ? cleanNum : 'a' + cleanNum}@ualg.pt` : '');
    const cleanMotivation = motivation.trim();

    if (cleanName.length < 2) {
      setFormError('Por favor introduz o teu nome completo');
      return;
    }

    if (!isStudentNumberValid(cleanNum)) {
      setFormError('Por favor introduz um número de aluno válido (ex.: a74123 ou 74123)');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 9) {
      setFormError(
        'Por favor introduz um número de telemóvel válido (apenas números, mín. 9 dígitos)'
      );
      return;
    }

    if (cleanMotivation.length < 10) {
      setFormError(
        'Por favor diz-nos um pouco sobre porque queres colaborar (mínimo 10 caracteres)'
      );
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const finalNumber = cleanNum.startsWith('a') ? cleanNum : `a${cleanNum}`;

      await submitCollaboratorApplication({
        name: cleanName,
        student_number: finalNumber,
        email: cleanEmail,
        phone: cleanPhone,
        academic_year: academicYear,
        course,
        areas_of_interest: selectedAreas,
        motivation: cleanMotivation,
      });

      setSubmitted(true);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.55 },
        });
      } catch {
        // Fallback silencioso
      }
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setFormError(err.message || 'Ocorreu um erro ao submeter a tua candidatura.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setStudentNumber('');
    setEmail('');
    setPhone('');
    setAcademicYear('1º Ano');
    setCourse('LEI (Licenciatura em Eng. Informática)');
    setSelectedAreas([]);
    setMotivation('');
    setFormError(null);
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-bg-100 dark:bg-[#070e17] text-text-100 dark:text-slate-100 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Banner de Apresentação */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-100/20 dark:bg-cyan-500/10 border border-accent-100/40 dark:border-cyan-500/30 text-xs font-semibold text-primary-300 dark:text-cyan-300">
            <Sparkles size={14} className="animate-pulse text-accent-200 dark:text-cyan-400" />
            <span>Vem fazer a diferença</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-100 dark:text-white">
            Queres ser <span className="text-accent-200 dark:text-cyan-400">Colaborador</span>?
          </h1>
          <p className="text-sm sm:text-base text-text-200 dark:text-slate-300 leading-relaxed">
            Junta-te à equipa do NEEI! Aqui ganhas experiência prática, crias projetos com impacto
            real para os estudantes de Engenharia Informática e expandes a tua rede.
          </p>
        </div>

        {/* Vantagens / Pilares */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/70 dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200/80 dark:border-cyan-950/60 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-100/30 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Code2 size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-100 dark:text-white">Projetos Reais</h4>
              <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                Aplica o que aprendes em projetos e ferramentas reais para a universidade.
              </p>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200/80 dark:border-cyan-950/60 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-100 dark:text-white">
                Workshops & Eventos
              </h4>
              <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                Participa na criação de torneios, atividades e palestras com convidados.
              </p>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-[#0c1724] p-5 rounded-2xl border border-gray-200/80 dark:border-cyan-950/60 shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-100 dark:text-white">
                Networking & Amizade
              </h4>
              <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                Integra uma comunidade ativa de alunos de informática.
              </p>
            </div>
          </div>
        </div>

        {/* Caixa Principal do Formulário / Confirmação */}
        <div className="bg-white dark:bg-[#0c1724] rounded-3xl shadow-xl border border-gray-200/80 dark:border-cyan-950/80 overflow-hidden">
          {submitted ? (
            <div className="p-8 sm:p-14 text-center space-y-6 animate-fadeIn">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={44} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-text-100 dark:text-white">
                  Candidatura Recebida com Sucesso!
                </h3>
                <p className="text-sm sm:text-base text-text-200 dark:text-slate-300 max-w-lg mx-auto">
                  Obrigado pelo teu interesse em colaborar com o NEEI,{' '}
                  <span className="font-semibold text-accent-200 dark:text-cyan-400">{name}</span>!
                  A equipa irá rever o teu pedido e entrar em contacto em breve.
                </p>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 bg-primary-100 dark:bg-slate-800 hover:bg-primary-200 dark:hover:bg-slate-700 text-text-100 dark:text-slate-200 rounded-xl font-semibold text-sm transition"
                >
                  Submeter Outra Resposta
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-text-100 dark:text-white flex items-center gap-2">
                  <UserPlus size={24} className="text-accent-200 dark:text-cyan-400" />
                  <span>Formulário de Colaborador</span>
                </h2>
                <p className="text-xs sm:text-sm text-text-200 dark:text-slate-400 mt-1">
                  Preenche os teus dados abaixo para te juntares aos colaboradores do mandato.
                </p>
              </div>

              {formError && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs sm:text-sm text-red-700 dark:text-red-300 flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Seção 1: Identificação */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-400">
                  1. Identificação & Contactos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="collab-name"
                      className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                    >
                      Nome Completo *
                    </label>
                    <input
                      id="collab-name"
                      type="text"
                      required
                      placeholder="ex.: Maria Silva"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="collab-number"
                      className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                    >
                      Número de Aluno *
                    </label>
                    <div className="relative">
                      <input
                        id="collab-number"
                        type="text"
                        required
                        placeholder="ex.: a74123 ou 74123"
                        value={studentNumber}
                        onChange={(e) => handleStudentNumberChange(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 transition ${
                          studentNumber && !isStudentNumberValid(studentNumber)
                            ? 'border-amber-400 focus:ring-amber-400/20'
                            : studentNumber && isStudentNumberValid(studentNumber)
                              ? 'border-emerald-500 focus:ring-emerald-500/20'
                              : 'border-gray-200 dark:border-slate-800 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30'
                        }`}
                      />
                      {studentNumber && isStudentNumberValid(studentNumber) && (
                        <CheckCircle2
                          size={16}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="collab-email"
                      className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                    >
                      Email de Contacto *
                    </label>
                    <input
                      id="collab-email"
                      type="email"
                      required
                      placeholder="ex.: a74123@ualg.pt"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="collab-phone"
                      className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                    >
                      Nº Telemóvel (apenas números) *
                    </label>
                    <input
                      id="collab-phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      placeholder="ex.: 912345678"
                      value={phone}
                      onKeyDown={(e) => {
                        // Permite apenas dígitos e teclas de controlo/navegação
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
              </div>

              {/* Seção 2: Percurso Académico */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-400">
                  2. Percurso Académico
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="collab-course"
                      className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                    >
                      Curso
                    </label>
                    <select
                      id="collab-course"
                      value={course}
                      onChange={(e) => handleCourseChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                    >
                      <option value="LEI (Licenciatura em Eng. Informática)">
                        LEI (Licenciatura em Eng. Informática)
                      </option>
                      <option value="MEI (Mestrado em Eng. Informática)">
                        MEI (Mestrado em Eng. Informática)
                      </option>
                      <option value="PSC (Pós Graduação em Cibersegurança)">
                        PSC (Pós Graduação em Cibersegurança)
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="collab-year"
                      className="block text-xs font-semibold text-text-100 dark:text-slate-200 mb-1.5"
                    >
                      Ano Curricular
                    </label>
                    <select
                      id="collab-year"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30"
                    >
                      {getAvailableYearsForCourse(course).map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção 3: Áreas de Interesse */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-200 dark:text-slate-400">
                    3. Áreas em que mais gostarias de ajudar
                  </h3>
                  <p className="text-xs text-text-200 dark:text-slate-400 mt-0.5">
                    Seleciona uma ou mais opções (opcional):
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {AVAILABLE_AREAS.map((area) => {
                    const isSelected = selectedAreas.includes(area);
                    return (
                      <button
                        type="button"
                        key={area}
                        onClick={() => toggleArea(area)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                          isSelected
                            ? 'bg-accent-200 text-white border-accent-200 dark:bg-cyan-600 dark:border-cyan-500 shadow-sm'
                            : 'bg-gray-50 dark:bg-slate-900/80 border-gray-200 dark:border-slate-800 text-text-200 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-700'
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seção 4: Motivação */}
              <div className="space-y-2">
                <label
                  htmlFor="collab-motivation"
                  className="block text-xs font-semibold text-text-100 dark:text-slate-200"
                >
                  4. Motivação & Ideias *
                </label>
                <textarea
                  id="collab-motivation"
                  required
                  rows={4}
                  value={motivation}
                  onChange={(e) => {
                    setMotivation(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Porque gostarias de ser colaborador do NEEI? Tens alguma ideia de atividade, projeto ou área em que queiras focar-te?"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-accent-200/30 dark:focus:ring-cyan-500/30 leading-relaxed"
                />
              </div>

              {/* Submissão */}
              <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-accent-200 dark:bg-cyan-600 hover:bg-accent-100 dark:hover:bg-cyan-500 text-white font-bold text-sm shadow-md shadow-accent-200/20 hover:shadow-accent-200/30 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>A enviar candidatura...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Candidatura</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Join;

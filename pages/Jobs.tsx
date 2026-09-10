import React, { useState } from 'react';
import { JobOpportunity } from '../types';
import { Briefcase, MapPin, ChevronDown, ChevronUp, Clock, Plus, X, Send, Building } from 'lucide-react';

const Jobs: React.FC = () => {
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Lista de vagas vazia por defeito conforme solicitado.
  // Para adicionar vagas manualmente, insira objetos neste array.
  const jobs: JobOpportunity[] = [
    // Exemplo de estrutura (descomentar e preencher para adicionar):
    /*
    {
      id: 1,
      title: "Desenvolvedor Backend",
      company: "Tech Corp",
      type: "Full-time",
      location: "Porto",
      description: "Descrição detalhada...",
      requirements: ["Req 1", "Req 2"],
      postedDate: "Hoje"
    }
    */
  ];

  const toggleJob = (id: number) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="bg-primary-100 p-3 rounded-lg">
            <Briefcase className="text-accent-200" size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-text-100">Vaga de emprego/estagio</h1>
            <p className="text-text-200">Oportunidades selecionadas para alunos e alumni.</p>
        </div>
      </div>

      {/* Lista de Vagas */}
      <div className="space-y-4 mb-16">
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-bg-200 rounded-2xl border-2 border-dashed border-primary-300 text-center">
            <Briefcase className="text-primary-300 mb-4 opacity-50" size={48} />
            <p className="text-xl font-semibold text-text-200">Não há oportunidades abertas de momento</p>
            <p className="text-text-200 mt-2 text-sm">Fica atento a futuras atualizações.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div 
              key={job.id} 
              className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${
                  expandedJobId === job.id ? 'border-accent-200 shadow-md' : 'border-primary-200 hover:border-accent-100'
              }`}
            >
              {/* Job Header / Summary */}
              <div 
                  onClick={() => toggleJob(job.id)}
                  className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                  <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-text-100">{job.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              job.type === 'Estágio' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                          }`}>
                              {job.type}
                          </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-200">
                          <span className="font-semibold">{job.company}</span>
                          <span className="flex items-center gap-1"><MapPin size={14}/> {job.location}</span>
                          <span className="flex items-center gap-1"><Clock size={14}/> {job.postedDate}</span>
                      </div>
                  </div>
                  <div className="text-primary-300">
                      {expandedJobId === job.id ? <ChevronUp /> : <ChevronDown />}
                  </div>
              </div>

              {/* Expanded Details */}
              <div 
                  className={`bg-bg-200 px-6 overflow-hidden transition-all duration-300 ${
                      expandedJobId === job.id ? 'max-h-96 py-6 opacity-100' : 'max-h-0 py-0 opacity-0'
                  }`}
              >
                  <p className="text-text-100 mb-4 whitespace-pre-line">{job.description}</p>
                  
                  {job.requirements && job.requirements.length > 0 && (
                    <>
                      <h4 className="font-semibold text-sm text-text-100 mb-2">Requisitos:</h4>
                      <ul className="list-disc list-inside text-sm text-text-200 space-y-1 mb-6">
                          {job.requirements.map((req, idx) => (
                              <li key={idx}>{req}</li>
                          ))}
                      </ul>
                    </>
                  )}

                  <button className="bg-accent-200 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-accent-100 transition-colors">
                      Candidatar-se
                  </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Secção de Submissão para Empresas */}
      <div className="bg-primary-100 rounded-2xl p-8 text-center border border-primary-200">
        <div className="flex justify-center mb-4">
           <Building className="text-accent-200" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-100 mb-2">És uma empresa à procura de talento?</h2>
        <p className="text-text-200 mb-6">
          Publica a tua oferta de emprego ou estágio diretamente na nossa plataforma.
        </p>

        <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2 shadow-sm ${
                isFormOpen 
                ? 'bg-text-200 text-white hover:bg-text-100' 
                : 'bg-accent-200 text-white hover:bg-accent-100 hover:-translate-y-1'
            }`}
        >
            {isFormOpen ? <X size={20}/> : <Plus size={20}/>}
            {isFormOpen ? 'Fechar Formulário' : 'Submeter Vaga'}
        </button>

        {/* Formulário */}
        {isFormOpen && (
            <div className="mt-8 max-w-xl mx-auto text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-primary-200">
                    <form action="https://formspree.io/f/mgvqjydr" method="POST" className="space-y-5">
                        
                        {/* Nome / Empresa */}
                        <div className="space-y-1">
                            <label htmlFor="nome_empresa" className="block text-sm font-medium text-text-100">Nome da Empresa / Recrutador</label>
                            <input 
                                type="text" 
                                id="nome_empresa" 
                                name="nome_empresa" 
                                required 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 outline-none bg-white"
                                placeholder="Nome da empresa"
                            />
                        </div>

                        {/* Contacto */}
                        <div className="space-y-1">
                            <label htmlFor="contacto" className="block text-sm font-medium text-text-100">Contacto (Email)</label>
                            <input 
                                type="email" 
                                id="contacto" 
                                name="contacto" 
                                required 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 outline-none bg-white"
                                placeholder="recrutamento@empresa.com"
                            />
                        </div>

                        {/* Tipo de Oferta */}
                        <div className="space-y-1">
                             <label className="block text-sm font-medium text-text-100 mb-2">Tipo de Oferta</label>
                             <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="tipo_oferta" value="Estágio" className="accent-accent-200" defaultChecked />
                                    <span className="text-text-200">Estágio</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="tipo_oferta" value="Emprego" className="accent-accent-200" />
                                    <span className="text-text-200">Emprego</span>
                                </label>
                             </div>
                        </div>

                        {/* Descrição */}
                        <div className="space-y-1">
                            <label htmlFor="descricao" className="block text-sm font-medium text-text-100">Descrição da Oferta</label>
                            <textarea 
                                id="descricao" 
                                name="descricao" 
                                rows={5}
                                required 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 outline-none bg-white"
                                placeholder="Detalhes sobre a função, requisitos e benefícios..."
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-accent-200 text-white font-bold py-3 rounded-lg hover:bg-accent-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            Enviar Oferta
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
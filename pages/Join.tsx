import React from 'react';
import { Send, UserPlus } from 'lucide-react';

const Join: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white dark:bg-[#0c1724] rounded-3xl shadow-xl overflow-hidden border border-primary-200 dark:border-cyan-900/50">
        <div className="bg-primary-300 dark:bg-[#081320] p-8 text-white text-center border-b border-transparent dark:border-cyan-950/60">
            <UserPlus className="mx-auto mb-4 h-16 w-16 text-accent-100 dark:text-cyan-400" />
            <h1 className="text-3xl font-bold mb-2">Queres ser colaborador?</h1>
            <p className="text-primary-200 dark:text-slate-300">Junta-te à equipa do NEEI e ajuda-nos a criar impacto.</p>
        </div>

        <div className="p-8 md:p-12">
            <form action="https://formspree.io/f/xpwyovyd" method="POST" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Nome */}
                    <div className="space-y-2">
                        <label htmlFor="nome" className="block text-sm font-medium text-text-100 dark:text-slate-200">Nome Completo</label>
                        <input 
                            type="text" 
                            id="nome" 
                            name="nome" 
                            required 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-200 dark:focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-white dark:bg-[#070d14] text-text-100 dark:text-slate-100"
                            placeholder="Teu nome"
                        />
                    </div>

                    {/* Numero de Aluno */}
                    <div className="space-y-2">
                        <label htmlFor="numero_aluno" className="block text-sm font-medium text-text-100 dark:text-slate-200">Número de Aluno</label>
                        <input 
                            type="text" 
                            id="numero_aluno" 
                            name="numero_aluno" 
                            required 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-200 dark:focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-white dark:bg-[#070d14] text-text-100 dark:text-slate-100"
                            placeholder="ex: a12345"
                        />
                    </div>

                    {/* Telemovel */}
                    <div className="space-y-2">
                        <label htmlFor="telemovel" className="block text-sm font-medium text-text-100 dark:text-slate-200">Nº Telemóvel</label>
                        <input 
                            type="tel" 
                            id="telemovel" 
                            name="telemovel" 
                            required 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-200 dark:focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-white dark:bg-[#070d14] text-text-100 dark:text-slate-100"
                            placeholder="912 345 678"
                        />
                    </div>

                    {/* Ano Escolaridade */}
                    <div className="space-y-2">
                        <label htmlFor="ano_escolaridade" className="block text-sm font-medium text-text-100 dark:text-slate-200">Ano de Escolaridade</label>
                        <select 
                            id="ano_escolaridade" 
                            name="ano_escolaridade" 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-200 dark:focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-white dark:bg-[#070d14] text-text-100 dark:text-slate-100"
                        >
                            <option value="1">1º Ano</option>
                            <option value="2">2º Ano</option>
                            <option value="3">3º Ano</option>
                            <option value="Mestrado">Mestrado</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                </div>

                {/* Motivação */}
                <div className="space-y-2">
                    <label htmlFor="motivacao" className="block text-sm font-medium text-text-100 dark:text-slate-200">Texto de Motivação</label>
                    <textarea 
                        id="motivacao" 
                        name="motivacao" 
                        rows={5}
                        required 
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 focus:ring-2 focus:ring-accent-200 dark:focus:ring-cyan-500 focus:border-transparent outline-none transition-all bg-white dark:bg-[#070d14] text-text-100 dark:text-slate-100"
                        placeholder="Porque queres juntar-te ao NEEI? O que gostarias de fazer?"
                    ></textarea>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-accent-200 dark:bg-cyan-600 text-white font-bold py-4 rounded-lg shadow-md hover:bg-accent-100 dark:hover:bg-cyan-500 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    <Send size={20} />
                    Enviar Candidatura
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Join;
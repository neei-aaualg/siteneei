import React from 'react';
import { Send, UserPlus } from 'lucide-react';

const Join: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-primary-200">
        <div className="bg-primary-300 p-8 text-white text-center">
            <UserPlus className="mx-auto mb-4 h-16 w-16 text-accent-100" />
            <h1 className="text-3xl font-bold mb-2">Queres ser colaborador?</h1>
            <p className="text-primary-200">Junta-te à equipa do NEEI e ajuda-nos a criar impacto.</p>
        </div>

        <div className="p-8 md:p-12">
            <form action="https://formspree.io/f/xpwyovyd" method="POST" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Nome */}
                    <div className="space-y-2">
                        <label htmlFor="nome" className="block text-sm font-medium text-text-100">Nome Completo</label>
                        <input 
                            type="text" 
                            id="nome" 
                            name="nome" 
                            required 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 focus:border-transparent outline-none transition-all bg-white"
                            placeholder="Teu nome"
                        />
                    </div>

                    {/* Numero de Aluno */}
                    <div className="space-y-2">
                        <label htmlFor="numero_aluno" className="block text-sm font-medium text-text-100">Número de Aluno</label>
                        <input 
                            type="text" 
                            id="numero_aluno" 
                            name="numero_aluno" 
                            required 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 focus:border-transparent outline-none transition-all bg-white"
                            placeholder="ex: a12345"
                        />
                    </div>

                    {/* Telemovel */}
                    <div className="space-y-2">
                        <label htmlFor="telemovel" className="block text-sm font-medium text-text-100">Nº Telemóvel</label>
                        <input 
                            type="tel" 
                            id="telemovel" 
                            name="telemovel" 
                            required 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 focus:border-transparent outline-none transition-all bg-white"
                            placeholder="912 345 678"
                        />
                    </div>

                    {/* Ano Escolaridade */}
                    <div className="space-y-2">
                        <label htmlFor="ano_escolaridade" className="block text-sm font-medium text-text-100">Ano de Escolaridade</label>
                        <select 
                            id="ano_escolaridade" 
                            name="ano_escolaridade" 
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 focus:border-transparent outline-none transition-all bg-white"
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
                    <label htmlFor="motivacao" className="block text-sm font-medium text-text-100">Texto de Motivação</label>
                    <textarea 
                        id="motivacao" 
                        name="motivacao" 
                        rows={5}
                        required 
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 focus:border-transparent outline-none transition-all bg-white"
                        placeholder="Porque queres juntar-te ao NEEI? O que gostarias de fazer?"
                    ></textarea>
                </div>

                <button 
                    type="submit" 
                    className="w-full bg-accent-200 text-white font-bold py-4 rounded-lg shadow-md hover:bg-accent-100 hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
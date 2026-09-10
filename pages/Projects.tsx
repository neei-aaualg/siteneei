import React, { useState } from 'react';
import { Project } from '../types';
import { FolderOpen, Star, Plus, Send, X } from 'lucide-react';

const Projects: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Mock Data
  // Lista de projetos vazia conforme solicitado
  const projects: Project[] = [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-primary-100 p-3 rounded-lg">
            <FolderOpen className="text-accent-200" size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-text-100">Projetos</h1>
            <p className="text-text-200">O que andamos a fazer.</p>
        </div>
      </div>

      {/* Conditional Rendering for Projects List */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-bg-200 rounded-2xl border-2 border-dashed border-primary-300">
           <FolderOpen className="text-primary-300 mb-4 opacity-50" size={64} />
           <p className="text-2xl font-semibold text-text-200">Ainda não foram partilhados projetos</p>
           <p className="text-text-200 mt-2">Sê o primeiro a mostrar o teu trabalho!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-bg-300 group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={project.imageUrl} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-4 right-4 bg-bg-100/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-accent-200">
                  {project.category}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-text-100 mb-2 flex items-center gap-2">
                  {project.title}
                  {project.id === 1 && <Star size={16} className="text-yellow-400 fill-current" />}
                </h3>
                <p className="text-text-200">{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Submission Section */}
      <div className="bg-primary-100 rounded-2xl p-8 md:p-12 text-center mt-12 border border-primary-200">
        <h2 className="text-2xl font-bold text-text-100 mb-4">Queres partilhar um projeto teu?</h2>
        <p className="text-text-200 mb-8 max-w-2xl mx-auto">
          O NEEI apoia os projetos dos alunos, partilha os teus trabalhos mais recentes com a comunidade acadêmica!
        </p>
        
        <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`px-8 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2 shadow-md ${
                isFormOpen 
                ? 'bg-text-200 text-white hover:bg-text-100' 
                : 'bg-accent-200 text-white hover:bg-accent-100 hover:-translate-y-1'
            }`}
        >
            {isFormOpen ? <X size={20}/> : <Plus size={20}/>}
            {isFormOpen ? 'Fechar Formulário' : 'Queres partilhar o teu projeto?'}
        </button>

        {/* Form Container */}
        {isFormOpen && (
            <div className="mt-8 max-w-2xl mx-auto text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-primary-200">
                    <form action="https://formspree.io/f/xvgyjpgo" method="POST" className="space-y-6">
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Nome */}
                            <div className="space-y-2">
                                <label htmlFor="nome" className="block text-sm font-medium text-text-100">Nome Completo</label>
                                <input 
                                    type="text" 
                                    id="nome" 
                                    name="nome" 
                                    required 
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 outline-none bg-white"
                                    placeholder="Teu nome"
                                />
                            </div>

                            {/* Numero Aluno */}
                            <div className="space-y-2">
                                <label htmlFor="numero_aluno" className="block text-sm font-medium text-text-100">Número de Aluno</label>
                                <input 
                                    type="text" 
                                    id="numero_aluno" 
                                    name="numero_aluno" 
                                    required 
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 outline-none bg-white"
                                    placeholder="ex: a12345"
                                />
                            </div>
                        </div>

                        {/* Contacto */}
                        <div className="space-y-2">
                            <label htmlFor="contacto" className="block text-sm font-medium text-text-100">Contacto (Email ou Telemóvel)</label>
                            <input 
                                type="text" 
                                id="contacto" 
                                name="contacto" 
                                required 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 outline-none bg-white"
                                placeholder="Email ou Nº Telemóvel"
                            />
                        </div>

                        {/* Nome Projeto */}
                        <div className="space-y-2">
                            <label htmlFor="nome_projeto" className="block text-sm font-medium text-text-100">Nome do Projeto</label>
                            <input 
                                type="text" 
                                id="nome_projeto" 
                                name="nome_projeto" 
                                required 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 outline-none bg-white"
                                placeholder="Título do projeto"
                            />
                        </div>

                        {/* Resumo */}
                        <div className="space-y-2">
                            <label htmlFor="resumo_projeto" className="block text-sm font-medium text-text-100">Resumo do Projeto</label>
                            <textarea 
                                id="resumo_projeto" 
                                name="resumo_projeto" 
                                rows={4}
                                required 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent-200 outline-none bg-white"
                                placeholder="Descreve brevemente a tua ideia..."
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-accent-200 text-white font-bold py-3 rounded-lg hover:bg-accent-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send size={18} />
                            Submeter Projeto
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
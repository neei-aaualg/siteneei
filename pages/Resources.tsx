import React from 'react';
import { BookOpen, FileText, Video, Download } from 'lucide-react';

const Resources: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
       <div className="flex items-center gap-4 mb-12">
        <div className="bg-primary-100 p-3 rounded-lg">
            <BookOpen className="text-accent-200" size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-text-100">Recursos de Estudo</h1>
            <p className="text-text-200">Apontamentos, exames antigos e guias.</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Section 1st Year */}
        <div className="bg-white p-6 rounded-xl border border-primary-200 shadow-sm">
            <h2 className="text-xl font-bold text-text-100 mb-6 border-b border-bg-300 pb-2">1º Ano</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: 'Resumos de Programação I', type: 'PDF', size: '2.4 MB' },
                    { title: 'Álgebra Linear - Exames Resolvidos', type: 'PDF', size: '5.1 MB' },
                    { title: 'Intro a Sistemas Digitais', type: 'Video', size: 'Link' },
                ].map((res, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-bg-200 rounded-lg hover:bg-primary-100 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            {res.type === 'PDF' ? <FileText className="text-text-200" size={20}/> : <Video className="text-text-200" size={20}/>}
                            <div>
                                <p className="text-sm font-medium text-text-100">{res.title}</p>
                                <p className="text-xs text-text-200">{res.type} • {res.size}</p>
                            </div>
                        </div>
                        <Download className="text-accent-200 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                    </div>
                ))}
            </div>
        </div>

         {/* Section 2nd Year */}
         <div className="bg-white p-6 rounded-xl border border-primary-200 shadow-sm">
            <h2 className="text-xl font-bold text-text-100 mb-6 border-b border-bg-300 pb-2">2º Ano</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: 'Algoritmos e Estruturas de Dados', type: 'PDF', size: '8.2 MB' },
                    { title: 'Base de Dados - Cheat Sheet', type: 'PDF', size: '1.1 MB' },
                ].map((res, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-bg-200 rounded-lg hover:bg-primary-100 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <FileText className="text-text-200" size={20}/> 
                            <div>
                                <p className="text-sm font-medium text-text-100">{res.title}</p>
                                <p className="text-xs text-text-200">{res.type} • {res.size}</p>
                            </div>
                        </div>
                        <Download className="text-accent-200 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
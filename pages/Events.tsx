import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const Events: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="bg-primary-100 dark:bg-cyan-950/60 p-3 rounded-xl shadow-sm">
          <CalendarIcon className="text-accent-200 dark:text-cyan-400" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-100 dark:text-slate-100">Eventos</h1>
          <p className="text-text-200 dark:text-slate-400">Fica a par de tudo o que acontece no NEEI.</p>
        </div>
      </div>

      <div className="w-full">
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-bg-200 dark:bg-[#0c1724] rounded-2xl border-2 border-dashed border-primary-300 dark:border-cyan-900/40 text-center">
          <CalendarIcon className="text-primary-300 dark:text-cyan-600 mb-4 opacity-50" size={56} />
          <p className="text-xl md:text-2xl font-semibold text-text-200 dark:text-slate-300">
            Calendário será publicado em breve...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Events;
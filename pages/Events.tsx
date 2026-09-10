import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const Events: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="bg-primary-100 p-3 rounded-lg">
            <CalendarIcon className="text-accent-200" size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-text-100">Eventos</h1>
            <p className="text-text-200">Fica a par de tudo o que acontece no NEEI.</p>
        </div>
      </div>

      {/* Google Calendar Embed */}
      <div className="w-full">
        <h2 className="text-2xl font-bold text-text-100 mb-6">Calendário</h2>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary-200 overflow-hidden">
            <div className="relative w-full" style={{ paddingTop: '75%' }}> {/* Aspect Ratio for responsiveness */}
                <iframe 
                    src="https://calendar.google.com/calendar/embed?src=da58e0b778e56df2ac4813b8ad6e4dbb4bed212424c26797b5d9832efb5006ba%40group.calendar.google.com&ctz=Europe%2FLisbon" 
                    style={{ border: 0 }} 
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    frameBorder="0" 
                    scrolling="no"
                    title="Calendário NEEI"
                ></iframe>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
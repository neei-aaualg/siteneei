import React, { useState, useRef, useEffect } from 'react';
import { CalendarPlus, ChevronDown, Apple, ExternalLink, Download } from 'lucide-react';
import { Activity } from '../types/activities';
import {
  createGoogleCalendarUrl,
  createOutlookCalendarUrl,
  downloadIcsCalendarFile
} from '../utils/calendarHelpers';

interface CalendarDropdownProps {
  activity: Activity;
  label?: string;
  variant?: 'button' | 'icon';
  align?: 'left' | 'right';
  className?: string;
}

const GoogleCalendarIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3" y="4" width="18" height="17" rx="3" fill="#4285F4" />
    <path d="M3 9h18v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9z" fill="#FFFFFF" />
    <circle cx="8" cy="13" r="1.5" fill="#EA4335" />
    <circle cx="12" cy="13" r="1.5" fill="#FBBC04" />
    <circle cx="16" cy="13" r="1.5" fill="#34A853" />
    <circle cx="8" cy="17" r="1.5" fill="#4285F4" />
    <circle cx="12" cy="17" r="1.5" fill="#EA4335" />
    <circle cx="16" cy="17" r="1.5" fill="#34A853" />
    <rect x="7" y="2" width="2" height="4" rx="1" fill="#EA4335" />
    <rect x="15" y="2" width="2" height="4" rx="1" fill="#EA4335" />
  </svg>
);

const OutlookIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3" y="4" width="18" height="16" rx="2.5" fill="#0078D4" />
    <path d="M14 4h4.5A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5H14V4z" fill="#28A8EA" />
    <rect x="3" y="7" width="9" height="10" rx="1.5" fill="#005A9E" />
    <circle cx="7.5" cy="12" r="2.5" fill="#FFFFFF" />
  </svg>
);

export const CalendarDropdown: React.FC<CalendarDropdownProps> = ({
  activity,
  label = 'Adicionar ao Calendário',
  variant = 'button',
  align = 'right',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAppleIphoneClick = (e: React.MouseEvent) => {
    e.preventDefault();
    downloadIcsCalendarFile(activity);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          title="Adicionar ao Calendário (Google, Outlook, iPhone)"
          className="p-1.5 rounded-lg text-text-200 dark:text-slate-400 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <CalendarPlus size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 bg-gray-50 dark:bg-slate-800/80 hover:bg-primary-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700/80 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <CalendarPlus size={15} className="text-accent-200 dark:text-cyan-400" />
          <span>{label}</span>
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-60 rounded-2xl bg-white dark:bg-[#0c1724] border border-gray-200 dark:border-cyan-900/60 shadow-xl shadow-cyan-950/10 dark:shadow-black/60 py-2 z-50 animate-fadeIn`}
          role="menu"
        >
          <div className="px-3 py-1.5 border-b border-gray-100 dark:border-slate-800/80 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-200 dark:text-slate-400">
              Escolhe o Calendário
            </span>
          </div>

          {/* 1. Google Calendar */}
          <a
            href={createGoogleCalendarUrl(activity)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-3 py-2 text-xs text-text-100 dark:text-slate-200 hover:bg-primary-100/60 dark:hover:bg-cyan-950/60 hover:text-accent-200 dark:hover:text-cyan-300 transition-colors group"
          >
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-xs">
              <GoogleCalendarIcon size={16} />
            </div>
            <div className="flex flex-col flex-1 leading-tight">
              <span className="font-semibold">Google Calendar</span>
              <span className="text-[10px] text-text-200 dark:text-slate-400">Web & Android</span>
            </div>
            <ExternalLink size={12} className="opacity-40 group-hover:opacity-100" />
          </a>

          {/* 2. Microsoft Outlook */}
          <a
            href={createOutlookCalendarUrl(activity)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            role="menuitem"
            className="flex items-center gap-3 px-3 py-2 text-xs text-text-100 dark:text-slate-200 hover:bg-primary-100/60 dark:hover:bg-cyan-950/60 hover:text-accent-200 dark:hover:text-cyan-300 transition-colors group"
          >
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-xs">
              <OutlookIcon size={16} />
            </div>
            <div className="flex flex-col flex-1 leading-tight">
              <span className="font-semibold">Outlook Calendar</span>
              <span className="text-[10px] text-text-200 dark:text-slate-400">Web & Office 365</span>
            </div>
            <ExternalLink size={12} className="opacity-40 group-hover:opacity-100" />
          </a>

          {/* 3. Apple Calendar (iPhone / Mac) */}
          <button
            type="button"
            onClick={handleAppleIphoneClick}
            role="menuitem"
            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-text-100 dark:text-slate-200 hover:bg-primary-100/60 dark:hover:bg-cyan-950/60 hover:text-accent-200 dark:hover:text-cyan-300 transition-colors group text-left cursor-pointer"
          >
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors shadow-xs">
              <Apple size={16} />
            </div>
            <div className="flex flex-col flex-1 leading-tight">
              <span className="font-semibold">iPhone & Apple Calendar</span>
              <span className="text-[10px] text-text-200 dark:text-slate-400">Ficheiro iCal (.ics)</span>
            </div>
            <Download size={12} className="opacity-40 group-hover:opacity-100" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarDropdown;

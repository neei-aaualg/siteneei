import React, { useState } from 'react';
import {
  Shield,
  Calendar,
  UserPlus,
  Briefcase,
  ShoppingBag,
  LogOut,
  RefreshCw,
  Plus,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { AdminTab, AdminNavItemConfig } from './adminTypes';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  activitiesCount: number;
  ongoingCount: number;
  pendingCollabCount: number;
  totalCollabCount: number;
  pendingJobCount: number;
  totalJobCount: number;
  onNewActivity: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  loading: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  setActiveTab,
  activitiesCount,
  ongoingCount,
  pendingCollabCount,
  totalCollabCount,
  pendingJobCount,
  totalJobCount,
  onNewActivity,
  onRefresh,
  onLogout,
  loading,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Definição modular e configurável das páginas/tabs do Painel
  const navItems: AdminNavItemConfig[] = [
    {
      id: 'activities',
      label: 'Atividades',
      shortLabel: 'Atividades',
      description: 'Calendário e participantes',
      category: 'Gestão de Conteúdo',
      icon: <Calendar size={18} />,
      badge: {
        count: activitiesCount,
        text: ongoingCount > 0 ? `${ongoingCount} decorrer` : undefined,
        variant: ongoingCount > 0 ? 'emerald' : 'slate',
        isHighlight: ongoingCount > 0,
      },
    },
    {
      id: 'collaborators',
      label: 'Colaboradores',
      shortLabel: 'Colaboradores',
      description: 'Candidaturas à equipa',
      category: 'Gestão de Conteúdo',
      icon: <UserPlus size={18} />,
      badge: {
        count: pendingCollabCount > 0 ? pendingCollabCount : totalCollabCount,
        text: pendingCollabCount > 0 ? `${pendingCollabCount} novo${pendingCollabCount > 1 ? 's' : ''}` : undefined,
        variant: pendingCollabCount > 0 ? 'amber' : 'slate',
        isHighlight: pendingCollabCount > 0,
      },
    },
    {
      id: 'jobs',
      label: 'Oportunidades',
      shortLabel: 'Oportunidades',
      description: 'Estágios e propostas',
      category: 'Gestão de Conteúdo',
      icon: <Briefcase size={18} />,
      badge: {
        count: pendingJobCount > 0 ? pendingJobCount : totalJobCount,
        text: pendingJobCount > 0 ? `${pendingJobCount} nova${pendingJobCount > 1 ? 's' : ''}` : undefined,
        variant: pendingJobCount > 0 ? 'blue' : 'slate',
        isHighlight: pendingJobCount > 0,
      },
    },
    {
      id: 'shop',
      label: 'Sweats & Loja',
      shortLabel: 'Loja',
      description: 'Catálogo de artigos',
      category: 'Operações & Loja',
      icon: <ShoppingBag size={18} />,
    },
    {
      id: 'churrasco',
      label: 'Churrasco NEEI',
      shortLabel: 'Churrasco',
      description: 'Vendas de passes e check-in',
      category: 'Operações & Loja',
      icon: <Flame size={18} className="text-orange-500" />,
    },
  ];

  // Agrupamento por categorias para organização limpa e modular
  const categories = Array.from(new Set(navItems.map((item) => item.category)));

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBadgeStyle = (badge?: AdminNavItemConfig['badge']) => {
    if (!badge) return '';
    if (badge.variant === 'amber') {
      return 'bg-amber-500 text-white animate-pulse';
    }
    if (badge.variant === 'blue') {
      return 'bg-blue-500 text-white animate-pulse';
    }
    if (badge.variant === 'emerald') {
      return 'bg-emerald-500 text-white';
    }
    return 'bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-400';
  };

  return (
    <>
      {/* Barra Superior Mobile */}
      <div className="lg:hidden sticky top-16 z-30 bg-white/95 dark:bg-[#0c1724]/95 backdrop-blur-md border-b border-gray-200 dark:border-cyan-950/80 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-text-100 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
            aria-label="Abrir menu de navegação do painel"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <span className="text-xs font-bold text-text-100 dark:text-white block leading-tight">
              Admin NEEI
            </span>
            <span className="text-[11px] text-accent-200 dark:text-cyan-400 font-semibold">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-text-200 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition"
            title="Atualizar dados"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Drawer / Overlay Mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Principal (Desktop fixa / Mobile slide-over) */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-40 lg:z-10 h-screen lg:h-[calc(100vh-4rem)] w-72 sm:w-80 lg:w-72 shrink-0 bg-white dark:bg-[#0c1724] border-r border-gray-200 dark:border-cyan-950/80 shadow-xl lg:shadow-none flex flex-col justify-between transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Cabeçalho do Menu */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-accent-200/10 dark:bg-cyan-500/10 text-accent-200 dark:text-cyan-400 border border-accent-200/20 dark:border-cyan-500/20">
                <Shield size={22} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-text-100 dark:text-white leading-tight">
                  Painel de Administração
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Equipa NEEI
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navegação por Categorias */}
          <nav className="space-y-6">
            {categories.map((category) => {
              const items = navItems.filter((item) => item.category === category);
              return (
                <div key={category} className="space-y-2">
                  <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    {category}
                  </span>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all duration-150 cursor-pointer group ${isSelected
                            ? 'bg-accent-200/10 dark:bg-cyan-500/15 text-accent-200 dark:text-cyan-300 font-bold border border-accent-200/30 dark:border-cyan-500/30 shadow-xs'
                            : 'text-text-200 dark:text-slate-400 hover:bg-gray-100/80 dark:hover:bg-slate-800/80 hover:text-text-100 dark:hover:text-slate-200 border border-transparent'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`p-1.5 rounded-lg transition-colors ${isSelected
                                ? 'bg-accent-200 text-white dark:bg-cyan-500 dark:text-slate-950'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:text-accent-200 dark:group-hover:text-cyan-300'
                                }`}
                            >
                              {item.icon}
                            </span>
                            <div className="truncate">
                              <span className="block truncate leading-tight">{item.label}</span>
                              <span className="text-[10px] text-gray-400 dark:text-slate-500 block truncate font-normal mt-0.5">
                                {item.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {item.badge && (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${getBadgeStyle(
                                  item.badge
                                )}`}
                              >
                                {item.badge.text || item.badge.count}
                              </span>
                            )}
                            <ChevronRight
                              size={14}
                              className={`transition-opacity ${isSelected ? 'opacity-100 text-accent-200 dark:text-cyan-300' : 'opacity-0 group-hover:opacity-60'
                                }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-[#09111c] space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold text-text-200 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Recarregar dados"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Terminar Sessão"
            >
              <LogOut size={14} />
              <span>Terminar Sessão</span>
            </button>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              UAlg LEI • Painel NEEI
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};

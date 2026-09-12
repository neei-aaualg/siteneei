import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Terminal, Box, ExternalLink, ChevronDown, Calendar, FolderOpen, Briefcase, FileText, QrCode, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ExploreItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  desc: string;
  isExternal?: boolean;
}

const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const exploreItems: ExploreItem[] = [
    {
      name: 'Vagas',
      path: '/vagas',
      icon: <Briefcase size={18} />,
      desc: 'Estágios e oportunidades'
    },
    {
      name: 'Links',
      path: '/links',
      icon: <QrCode size={18} />,
      desc: 'Canais oficiais e QR Codes'
    },
    {
      name: 'Documentos',
      path: 'https://aaualg-my.sharepoint.com/:f:/g/personal/neei_aaualg_pt/IgCiZkWkiUSDR42VAH_iE99lAXHzPGqNFg-qekFAX2zOGSc?e=7QL1NJ',
      icon: <FileText size={18} />,
      desc: 'Documentos oficiais em vigor',
      isExternal: true
    },
    {
      name: 'Projetos',
      path: 'https://github.com/neei-aaualg/student-showcase',
      icon: <FolderOpen size={18} />,
      desc: 'Showcase de projetos dos alunos',
      isExternal: true
    },
  ];

  const isExploreActive = exploreItems.some(item => !item.isExternal && location.pathname === item.path);
  const isActive = (path: string) => location.pathname === path;

  // Função para saltar para o início da respetiva página ao clicar no logótipo ou separadores
  const jumpToPageTop = (targetPath: string) => {
    const isSameRoute =
      location.pathname === targetPath ||
      (targetPath === '/atividades' && location.pathname === '/eventos') ||
      (targetPath === '/eventos' && location.pathname === '/atividades');

    if (isSameRoute) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  // Fecha dropdown desktop ao clicar fora ou pressionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fecha menus ao mudar de rota
  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Abre mobile dropdown se alguma rota filha estiver ativa
  useEffect(() => {
    if (isExploreActive) {
      setIsMobileDropdownOpen(true);
    }
  }, [isExploreActive]);

  return (
    <header className="sticky top-0 z-50 bg-bg-100/90 dark:bg-[#0a1420]/90 backdrop-blur-md border-b border-primary-200 dark:border-cyan-950/60 shadow-sm print:hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Logo & Desktop Nav */}
          <div className="flex items-center gap-4 md:gap-6 lg:gap-12">
            {/* Logo com Jump to Top */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                onClick={() => jumpToPageTop('/')}
                className="flex items-center gap-2.5 group cursor-pointer"
                title="NEEI - Início"
              >
                <img
                  src="/assets/logoneeipequeno-removebg-preview.png"
                  alt="NEEI Logo"
                  className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </Link>
            </div>

            {/* Desktop Nav com Jump to Top */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2 xl:gap-3">
              <Link
                to="/"
                onClick={() => jumpToPageTop('/')}
                className={`inline-flex items-center px-2.5 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 cursor-pointer ${isActive('/')
                  ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                  : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                  }`}
              >
                Início
              </Link>

              <Link
                to="/sobre"
                onClick={() => jumpToPageTop('/sobre')}
                className={`inline-flex items-center px-2.5 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 cursor-pointer ${isActive('/sobre')
                  ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                  : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                  }`}
              >
                Sobre
              </Link>

              {/* Dropdown Explorar */}
              <div className="relative inline-flex items-center" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 cursor-pointer ${isExploreActive || isDropdownOpen
                    ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                    : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                    }`}
                >
                  <span>Explorar</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-accent-200 dark:text-cyan-300' : 'text-text-200 dark:text-slate-400 opacity-70'}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-white dark:bg-[#0c1724] border border-primary-200 dark:border-cyan-900/60 shadow-xl py-2 z-50">
                    {exploreItems.map((item) =>
                      item.isExternal ? (
                        <a
                          key={item.path}
                          href={item.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-2.5 text-xs lg:text-sm text-text-200 dark:text-slate-200 hover:bg-bg-200 dark:hover:bg-slate-800/80 hover:text-accent-200 dark:hover:text-cyan-300 transition-all duration-150 group"
                        >
                          <div className="p-2 rounded-lg bg-primary-100 dark:bg-cyan-950/80 text-accent-200 dark:text-cyan-300 group-hover:bg-accent-200 group-hover:text-white transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium leading-tight">{item.name}</span>
                              <ExternalLink size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-normal mt-0.5">{item.desc}</span>
                          </div>
                        </a>
                      ) : (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            jumpToPageTop(item.path);
                          }}
                          className={`flex items-center gap-3 px-3.5 py-2.5 text-xs lg:text-sm transition-all duration-150 cursor-pointer ${isActive(item.path)
                            ? 'bg-primary-100 dark:bg-cyan-950/70 text-accent-200 dark:text-cyan-300 font-semibold'
                            : 'text-text-200 dark:text-slate-200 hover:bg-bg-200 dark:hover:bg-slate-800/80 hover:text-accent-200 dark:hover:text-cyan-300'
                            }`}
                        >
                          <div className={`p-2 rounded-lg transition-colors ${isActive(item.path)
                            ? 'bg-accent-200 text-white'
                            : 'bg-primary-100 dark:bg-cyan-950/80 text-accent-200 dark:text-cyan-300'
                            }`}>
                            {item.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium leading-tight">{item.name}</span>
                            <span className="text-[11px] text-gray-500 dark:text-slate-400 font-normal mt-0.5">{item.desc}</span>
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>

              <Link
                to="/atividades"
                onClick={() => jumpToPageTop('/atividades')}
                className={`inline-flex items-center px-2.5 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 cursor-pointer ${isActive('/atividades')
                  ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                  : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                  }`}
              >
                Atividades
              </Link>

              <Link
                to="/colaborar"
                onClick={() => jumpToPageTop('/colaborar')}
                className={`inline-flex items-center px-2.5 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 cursor-pointer ${isActive('/colaborar')
                  ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                  : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                  }`}
              >
                Colaborar
              </Link>
            </nav>
          </div>

          {/* Action Buttons & Theme Toggle */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 shrink-0 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-center bg-white hover:bg-slate-50 border-primary-200 text-slate-700 shadow-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-amber-300 active:scale-95"
              title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
              aria-label={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <a
              href="https://box.neei.online"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-full font-bold text-xs lg:text-sm transition-all shadow-sm bg-accent-200 text-white hover:bg-accent-100 hover:shadow-md"
              title="Ir para o NEEIBox (box.neei.online)"
            >
              <Box size={16} />
              <span>Ir para o NEEIBox</span>
              <ExternalLink size={14} className="opacity-80" />
            </a>

            <Link
              to="/quack"
              className={`inline-flex items-center gap-2 px-3 lg:px-4 py-2 rounded-full font-bold text-xs lg:text-sm transition-all shadow-sm ${isActive('/quack')
                ? 'bg-accent-200 text-white ring-2 ring-offset-2 ring-accent-100'
                : 'bg-primary-300 text-white hover:bg-accent-200 hover:shadow-md'
                }`}
            >
              <Terminal size={16} />
              <span>Quack</span>
            </Link>
          </div>

          {/* Mobile menu button & Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 shrink-0 rounded-lg border text-xs transition-all cursor-pointer flex items-center justify-center bg-white dark:bg-slate-900 border-primary-200 dark:border-slate-700 text-slate-700 dark:text-amber-300 shadow-sm"
              title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
              aria-label={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-text-200 dark:text-slate-200 hover:text-accent-200 dark:hover:text-cyan-300 focus:outline-none p-1"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-bg-100 dark:bg-[#0a1420] border-t border-primary-200 dark:border-cyan-950/60 shadow-lg">
          <div className="px-3 pt-3 pb-4 space-y-1 sm:px-4">
            <Link
              to="/"
              onClick={() => {
                setIsMenuOpen(false);
                jumpToPageTop('/');
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')
                ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                }`}
            >
              Início
            </Link>

            <Link
              to="/sobre"
              onClick={() => {
                setIsMenuOpen(false);
                jumpToPageTop('/sobre');
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/sobre')
                ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                }`}
            >
              Sobre
            </Link>

            {/* Mobile Dropdown Explorar */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setIsMobileDropdownOpen(prev => !prev)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors ${isExploreActive
                  ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                  : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                  }`}
              >
                <span>Explorar</span>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180 text-accent-200 dark:text-cyan-300' : 'text-text-200 dark:text-slate-400'}`}
                />
              </button>

              {isMobileDropdownOpen && (
                <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-primary-200 dark:border-cyan-900/50 ml-3">
                  {exploreItems.map((item) =>
                    item.isExternal ? (
                      <a
                        key={item.path}
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-text-200 dark:text-slate-200 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-accent-200 dark:text-cyan-300">{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                        <ExternalLink size={14} className="opacity-60 text-text-200 dark:text-slate-400" />
                      </a>
                    ) : (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          setIsMenuOpen(false);
                          jumpToPageTop(item.path);
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${isActive(item.path)
                          ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                          : 'text-text-200 dark:text-slate-200 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                          }`}
                      >
                        <span className="text-accent-200 dark:text-cyan-300">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>

            <Link
              to="/atividades"
              onClick={() => {
                setIsMenuOpen(false);
                jumpToPageTop('/atividades');
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/atividades')
                ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                }`}
            >
              Atividades
            </Link>

            <Link
              to="/colaborar"
              onClick={() => {
                setIsMenuOpen(false);
                jumpToPageTop('/colaborar');
              }}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/colaborar')
                ? 'text-accent-200 dark:text-cyan-300 bg-primary-100 dark:bg-cyan-950/70 font-semibold'
                : 'text-text-200 dark:text-slate-300 hover:text-accent-200 dark:hover:text-cyan-300 hover:bg-bg-200 dark:hover:bg-slate-800/80'
                }`}
            >
              Colaborar
            </Link>

            <div className="pt-3 space-y-2 border-t border-primary-200 dark:border-cyan-950/60 mt-2">
              <a
                href="https://box.neei.online"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-md text-base font-bold bg-accent-200 text-white hover:bg-accent-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Box size={18} />
                  <span>Ir para o NEEIBox</span>
                </div>
                <ExternalLink size={16} />
              </a>

              <Link
                to="/quack"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md text-base font-bold bg-primary-300 text-white hover:bg-primary-200 transition-colors"
              >
                <Terminal size={18} />
                Quack Executor
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
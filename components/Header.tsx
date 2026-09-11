import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Terminal, Box, ExternalLink, ChevronDown, Calendar, FolderOpen, Briefcase, FileText } from 'lucide-react';

interface ExploreItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  desc: string;
  isExternal?: boolean;
}

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const exploreItems: ExploreItem[] = [
    {
      name: 'Eventos',
      path: '/eventos',
      icon: <Calendar size={18} />,
      desc: 'Workshops e atividades'
    },
    {
      name: 'Projetos',
      path: '/projetos',
      icon: <FolderOpen size={18} />,
      desc: 'Projetos e iniciativas'
    },
    {
      name: 'Vagas',
      path: '/vagas',
      icon: <Briefcase size={18} />,
      desc: 'Estágios e oportunidades'
    },
    {
      name: 'Atas',
      path: 'https://aaualg-my.sharepoint.com/:f:/g/personal/neei_aaualg_pt/IgA-rRiX_klZSoBVtLXO8_yzAShBWJ9h73-Un7de6RtktTQ',
      icon: <FileText size={18} />,
      desc: 'Atas de reuniões e assembleias',
      isExternal: true
    },
  ];

  const isExploreActive = exploreItems.some(item => !item.isExternal && location.pathname === item.path);
  const isActive = (path: string) => location.pathname === path;

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
    <header className="sticky top-0 z-50 bg-bg-100/90 backdrop-blur-md border-b border-primary-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side: Logo & Desktop Nav */}
          <div className="flex items-center gap-4 md:gap-6 lg:gap-12">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center gap-2.5 group">
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

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2 xl:gap-3">
              <Link
                to="/"
                className={`inline-flex items-center px-2.5 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 ${isActive('/')
                  ? 'text-accent-200 bg-primary-100'
                  : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
                  }`}
              >
                Início
              </Link>

              <Link
                to="/sobre"
                className={`inline-flex items-center px-2.5 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 ${isActive('/sobre')
                  ? 'text-accent-200 bg-primary-100'
                  : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
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
                  className={`inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 cursor-pointer ${isActive('/eventos') || isActive('/projetos') || isActive('/vagas') || isDropdownOpen
                    ? 'text-accent-200 bg-primary-100'
                    : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
                    }`}
                >
                  <span>Explorar</span>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-accent-200' : 'text-text-200 opacity-70'}`}
                  />
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 rounded-xl bg-white border border-primary-200 shadow-xl py-2 z-50">
                    {exploreItems.map((item) =>
                      item.isExternal ? (
                        <a
                          key={item.path}
                          href={item.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-3.5 py-2.5 text-xs lg:text-sm text-text-200 hover:bg-bg-200 hover:text-accent-200 transition-all duration-150 group"
                        >
                          <div className="p-2 rounded-lg bg-primary-100 text-accent-200 group-hover:bg-accent-200 group-hover:text-white transition-colors">
                            {item.icon}
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium leading-tight">{item.name}</span>
                              <ExternalLink size={12} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-[11px] text-gray-500 font-normal mt-0.5">{item.desc}</span>
                          </div>
                        </a>
                      ) : (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3.5 py-2.5 text-xs lg:text-sm transition-all duration-150 ${isActive(item.path)
                            ? 'bg-primary-100 text-accent-200 font-semibold'
                            : 'text-text-200 hover:bg-bg-200 hover:text-accent-200'
                            }`}
                        >
                          <div className={`p-2 rounded-lg transition-colors ${isActive(item.path)
                            ? 'bg-accent-200 text-white'
                            : 'bg-primary-100 text-accent-200'
                            }`}>
                            {item.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium leading-tight">{item.name}</span>
                            <span className="text-[11px] text-gray-500 font-normal mt-0.5">{item.desc}</span>
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>

              <Link
                to="/pertencer"
                className={`inline-flex items-center px-2.5 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-all duration-200 ${isActive('/pertencer')
                  ? 'text-accent-200 bg-primary-100'
                  : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
                  }`}
              >
                Colaborar
              </Link>
            </nav>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
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

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-text-200 hover:text-accent-200 focus:outline-none"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-bg-100 border-t border-primary-200 shadow-lg">
          <div className="px-3 pt-3 pb-4 space-y-1 sm:px-4">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/')
                ? 'text-accent-200 bg-primary-100'
                : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
                }`}
            >
              Início
            </Link>

            <Link
              to="/sobre"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/sobre')
                ? 'text-accent-200 bg-primary-100'
                : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
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
                  ? 'text-accent-200 bg-primary-100'
                  : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
                  }`}
              >
                <span>Explorar</span>
                <ChevronDown
                  size={18}
                  className={`transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180 text-accent-200' : 'text-text-200'}`}
                />
              </button>

              {isMobileDropdownOpen && (
                <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-primary-200 ml-3">
                  {exploreItems.map((item) =>
                    item.isExternal ? (
                      <a
                        key={item.path}
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-text-200 hover:text-accent-200 hover:bg-bg-200"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-accent-200">{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                        <ExternalLink size={14} className="opacity-60 text-text-200" />
                      </a>
                    ) : (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${isActive(item.path)
                          ? 'text-accent-200 bg-primary-100 font-semibold'
                          : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
                          }`}
                      >
                        <span className="text-accent-200">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    )
                  )}
                </div>
              )}
            </div>

            <Link
              to="/pertencer"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/pertencer')
                ? 'text-accent-200 bg-primary-100'
                : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
                }`}
            >
              Colaborar
            </Link>

            <div className="pt-3 space-y-2 border-t border-primary-200 mt-2">
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
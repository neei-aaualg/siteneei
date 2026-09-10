import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Terminal, GraduationCap } from 'lucide-react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Início', path: '/' },
    { name: 'Sobre', path: '/sobre' },
    { name: 'Eventos', path: '/eventos' },
    { name: 'Projetos', path: '/projetos' },
    { name: 'Recursos', path: '/resursos' },
    { name: 'Vagas', path: '/vagas' },
    { name: 'Colaborar', path: '/pertencer' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-bg-100/90 backdrop-blur-md border-b border-primary-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-accent-200 text-white p-2 rounded-lg shadow-md group-hover:bg-accent-100 transition-colors">
                <GraduationCap size={24} />
              </div>
              <span className="font-bold text-xl text-text-100 tracking-tight">NEEI</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-accent-200 bg-primary-100'
                    : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Quack Button */}
          <div className="hidden md:flex items-center">
            <Link
              to="/quack"
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${
                isActive('/quack') 
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
        <div className="md:hidden bg-bg-100 border-t border-primary-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                   isActive(item.path)
                    ? 'text-accent-200 bg-primary-100'
                    : 'text-text-200 hover:text-accent-200 hover:bg-bg-200'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/quack"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 mt-4 rounded-md text-base font-bold bg-primary-300 text-white"
            >
              <Terminal size={18} />
              Quack Executor
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
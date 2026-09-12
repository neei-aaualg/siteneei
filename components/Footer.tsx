import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, MapPin, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-300 dark:bg-[#050a10] text-bg-100 dark:text-slate-300 border-t border-transparent dark:border-cyan-950/70 mt-auto print:hidden transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary-100 dark:text-cyan-300">NEEI</h3>
            <p className="text-gray-300 dark:text-slate-400 text-sm leading-relaxed">
              Núcleo de Estudantes de Engenharia Informática. Promovendo a excelência académica e o desenvolvimento profissional desde 2010.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-100 dark:text-cyan-300">Links Rápidos</h3>
            <ul className="space-y-2 text-sm text-gray-300 dark:text-slate-400">
              <li><Link to="/sobre" className="hover:text-accent-100 dark:hover:text-cyan-300 transition-colors">Sobre Nós</Link></li>
              <li><Link to="/projetos" className="hover:text-accent-100 dark:hover:text-cyan-300 transition-colors">Projetos</Link></li>
              <li><Link to="/vagas" className="hover:text-accent-100 dark:hover:text-cyan-300 transition-colors">Oportunidades</Link></li>
              <li><Link to="/quack" className="hover:text-accent-100 dark:hover:text-cyan-300 transition-colors">Quack</Link></li>
              <li><Link to="/links" className="hover:text-accent-100 dark:hover:text-cyan-300 transition-colors">Links & QR Codes</Link></li>
              <li>
                <a
                  href="https://box.neei.online"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent-100 dark:hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>NEEIBox</span>
                  <ExternalLink size={12} className="opacity-75" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-100 dark:text-cyan-300">Contactos</h3>
            <ul className="space-y-3 text-sm text-gray-300 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-accent-100 dark:text-cyan-400" />
                <span>Sala 0.18, Edifício 1, Campus de Gambelas, Faro</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-accent-100 dark:text-cyan-400" />
                <span>geral@neei.pt</span>
              </li>
              <li className="flex items-center gap-4 mt-4">
                <a href="#" className="hover:text-accent-100 dark:hover:text-cyan-300 transition-colors"><Linkedin size={20} /></a>
                <a href="#" className="hover:text-accent-100 dark:hover:text-cyan-300 transition-colors"><Github size={20} /></a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-600 dark:border-slate-800 mt-8 pt-8 text-center text-xs text-gray-400 dark:text-slate-500">
          &copy; {new Date().getFullYear()} NEEI. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
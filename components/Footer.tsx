import React from 'react';
import { Github, Linkedin, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary-300 text-bg-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary-100">NEEI</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Núcleo de Estudantes de Engenharia Informática. Promovendo a excelência académica e o desenvolvimento profissional desde 2010.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-100">Links Rápidos</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="#/sobre" className="hover:text-accent-100 transition-colors">Sobre Nós</a></li>
              <li><a href="#/projetos" className="hover:text-accent-100 transition-colors">Projetos</a></li>
              <li><a href="#/vagas" className="hover:text-accent-100 transition-colors">Oportunidades</a></li>
              <li><a href="#/quack" className="hover:text-accent-100 transition-colors">Quack</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-100">Contactos</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-accent-100" />
                <span>Campus Universitário, Bloco B</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-accent-100" />
                <span>geral@neei.pt</span>
              </li>
              <li className="flex items-center gap-4 mt-4">
                <a href="#" className="hover:text-accent-100 transition-colors"><Linkedin size={20} /></a>
                <a href="#" className="hover:text-accent-100 transition-colors"><Github size={20} /></a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} NEEI. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
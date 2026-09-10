import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Users, Calendar, MapPin, Terminal } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-100 to-bg-100 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-primary-200 text-accent-200 text-xs font-bold uppercase tracking-wider mb-2">
              <MapPin size={12} />
              Universidade do Algarve - FCT Gambelas
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-text-100 leading-tight">
              <span className="text-accent-200">N</span>úcleo de <span className="text-accent-200">E</span>studantes de <span className="text-accent-200">E</span>ngenharia <span className="text-accent-200">I</span>nformática da <span className="text-accent-200">UAlg</span>
            </h1>
            <p className="text-lg text-text-200 max-w-lg mx-auto md:mx-0">
              Somos o órgão responsável por proporcionar atividades, workshops e eventos dedicados aos estudantes de Engenharia Informática da UAlg. Fomentamos a inovação e preparamos o teu futuro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/pertencer" className="bg-accent-200 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-accent-100 hover:-translate-y-1 transition-all duration-300">
                Ser Colaborador
              </Link>
              <Link to="/quack" className="bg-white text-accent-200 border border-accent-200 px-8 py-3 rounded-lg font-semibold hover:bg-primary-100 transition-all duration-300 flex items-center justify-center gap-2">
                <Code size={20} />
                Quack (Online Judge)
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center">
             <div className="relative">
                <div className="absolute -inset-4 bg-accent-100/20 rounded-full blur-xl"></div>
                <div className="relative rounded-2xl shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500 max-w-md w-full overflow-hidden bg-gradient-to-br from-primary-200 to-accent-200 p-1 flex items-center justify-center aspect-square md:aspect-auto md:h-96">
                  {/* Placeholder Gráfico em vez da imagem removida */}
                  <div className="bg-bg-100 w-full h-full rounded-xl flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-200 to-transparent"></div>
                      <Terminal size={80} className="text-accent-200 mb-6 relative z-10" />
                      <h3 className="text-2xl font-bold text-text-100 mb-2 relative z-10">NEEI UAlg</h3>
                      <p className="text-text-200 font-mono text-sm relative z-10">&lt;Estudantes /&gt;</p>
                      <p className="text-text-200 font-mono text-sm relative z-10">&lt;Inovação /&gt;</p>
                      <p className="text-text-200 font-mono text-sm relative z-10">&lt;Futuro /&gt;</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features / News */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-3xl font-bold text-text-100 mb-12 text-center">Destaques do Mandato</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Users className="text-accent-200" size={32} />,
              title: "Novo logo do NEEI é apresentado",
              desc: "Apresentamos com orgulho a nova identidade visual do NEEI, simbolizando uma nova era de inovação e união para o nosso curso.",
              date: "Nov 2025"
            },
            {
              icon: <Code className="text-accent-200" size={32} />,
              title: "Site do NEEI é apresentado como primeira proposta a ser cumprida pela nova direção do NEEI",
              desc: "Hello world!",
              date: "Nov 2025"
            }
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-primary-200 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  {item.icon}
                </div>
                <span className="text-xs font-semibold text-text-200 bg-bg-200 px-2 py-1 rounded">{item.date}</span>
              </div>
              <h3 className="text-xl font-bold text-text-100 mb-2">{item.title}</h3>
              <p className="text-text-200 mb-4">{item.desc}</p>
              <Link to="/eventos" className="text-accent-200 font-semibold flex items-center gap-1 hover:gap-2 transition-all text-sm">
                Ver detalhes <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
import React from 'react';
import { Target, Eye, Award, MapPin } from 'lucide-react';

const About: React.FC = () => {
  // Equipa Atualizada para o Mandato 2025/2026
  const direcao = [
    { name: 'David Rodrigues', role: 'Presidente' },
    { name: 'Martim Neves', role: 'Vice-Presidente' },
    { name: 'David Gonçalves', role: 'Tesoureiro' },
    { name: 'João Maria Baptista', role: 'Secretário' },
  ];

  const mesaPlenario = [
    { name: 'Francisco Molo', role: 'Presidente' },
    { name: 'Leonardo Cantachini', role: 'Vice-Presidente' },
    { name: 'Afonso Francisco', role: 'Secretário' },
    { name: 'Simão Reis', role: 'Primeiro Suplente' },
  ];

  const vogais = [
    'Barbara Pereira', 'Beatriz Mateia', 'David Silvestre',
    'Francisco Neves', 'João Miguel Batista',
    'José Tico', 'Leonardo Albudane', 'Miguel Alvito',
    'Raquel Nunes', 'Ricardo Vicente'
  ];

  // Mapeamento de fotos reais dos membros armazenadas em /assets/
  const memberPhotos: Record<string, string> = {
    'José Tico': '/assets/josetico.png',
    'David Gonçalves': '/assets/davidgoncalves.png',
    'Francisco Molo': '/assets/franciscomolo.png',
    'Leonardo Cantachini': '/assets/leonardocantachini.png',
    'Afonso Francisco': '/assets/afonsofrancisco.png',
    'Simão Reis': '/assets/simaoreis.png',
    'Barbara Pereira': '/assets/barbarapereira.png',
    'Beatriz Mateia': '/assets/beatrizmateia.png',
    'David Rodrigues': '/assets/davidrodrigues.png',
    'David Silvestre': '/assets/davidsilvestre.png',
    'Francisco Neves': '/assets/francisconeves.png',
    'João Maria Batista': '/assets/joaomariabatista.png',
    'João Maria Baptista': '/assets/joaomariabatista.png',
    'João Miguel Batista': '/assets/joaomiguelbatista.png',
    'Leonardo Albudane': '/assets/leonardoalbudane.png',
    'Martim Neves': '/assets/martimneves.png',
    'Miguel Alvito': '/assets/miguelalvito.png',
    'Raquel Nunes': '/assets/raquelnunes.png',
    'Ricardo Vicente': '/assets/ricardovicente.png',
  };

  // Função para obter foto do membro (foto local com fallback para avatar gerado)
  const getMemberPhoto = (name: string, role?: string) => {
    if (memberPhotos[name]) {
      return memberPhotos[name];
    }
    const bg = role?.includes('Presidente') ? '00668c' : 'b6ccd8';
    const color = role?.includes('Presidente') ? 'fff' : '1d1c1c';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Mission & Vision */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-text-100 mb-6">Sobre o NEEI - UAlg</h1>
        <div className="flex items-center justify-center gap-2 text-accent-200 mb-6 font-medium">
          <MapPin size={20} />
          <span>Faculdade de Ciências e Tecnologia (FCT), Campus de Gambelas</span>
        </div>
        <p className="text-lg text-text-200 leading-relaxed">
          O Núcleo de Estudantes de Engenharia Informática da Universidade do Algarve é a estrutura representativa de todos os alunos dos cursos de informática da FCT.
          Trabalhamos diariamente para dinamizar o campus, defender os direitos dos estudantes e criar oportunidades de ligação ao tecido empresarial do Algarve.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-bg-200 p-8 rounded-2xl text-center hover:bg-primary-100 transition-colors">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Target className="text-accent-200" size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-100 mb-4">Missão</h3>
          <p className="text-text-200">Ajudar os estudantes de LEI no seu percurso académico.</p>
        </div>
        <div className="bg-bg-200 p-8 rounded-2xl text-center hover:bg-primary-100 transition-colors">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Eye className="text-accent-200" size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-100 mb-4">Visão</h3>
          <p className="text-text-200">O NEEI deve ser um porto seguro para qualquer estudante de LEI que esteja a precisar de ajuda com os estudos/integração e tudo aqui que possamos ajudar.</p>
        </div>
        <div className="bg-bg-200 p-8 rounded-2xl text-center hover:bg-primary-100 transition-colors">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Award className="text-accent-200" size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-100 mb-4">Comunidade</h3>
          <p className="text-text-200">Promover o espírito de entreajuda, desde os caloiros aos finalistas.</p>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm border border-primary-200">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-100 mb-2">Órgãos Sociais</h2>
          <p className="text-accent-200 font-bold uppercase tracking-widest text-sm">Mandato 2025 / 2026</p>
        </div>

        {/* Direção */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-text-100 mb-10 border-b border-bg-300 pb-2 mx-auto max-w-xs">Direção</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {direcao.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center group w-full max-w-[240px]">
                <div className="relative w-44 h-44 sm:w-48 sm:h-48 md:w-52 md:h-52 mb-4 overflow-hidden rounded-full border-4 border-primary-100 group-hover:border-accent-200 transition-all duration-300 shadow-lg bg-bg-200 group-hover:shadow-2xl">
                  <img
                    src={getMemberPhoto(member.name, member.role)}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const bg = member.role?.includes('Presidente') ? '00668c' : 'b6ccd8';
                      const color = member.role?.includes('Presidente') ? 'fff' : '1d1c1c';
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${bg}&color=${color}`;
                    }}
                  />
                </div>
                <h4 className="font-bold text-lg sm:text-xl text-text-100">{member.name}</h4>
                <p className="text-accent-200 text-sm sm:text-base font-semibold mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mesa do Plenário */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-text-100 mb-10 border-b border-bg-300 pb-2 mx-auto max-w-xs">Mesa do Plenário</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {mesaPlenario.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center group w-full max-w-[220px]">
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 mb-4 overflow-hidden rounded-full border-4 border-bg-200 group-hover:border-accent-200 transition-all duration-300 shadow-md bg-bg-200 group-hover:shadow-xl">
                  <img
                    src={getMemberPhoto(member.name, member.role)}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      const bg = member.role?.includes('Presidente') ? '00668c' : 'b6ccd8';
                      const color = member.role?.includes('Presidente') ? 'fff' : '1d1c1c';
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${bg}&color=${color}`;
                    }}
                  />
                </div>
                <h4 className="font-bold text-base sm:text-lg text-text-100">{member.name}</h4>
                <p className="text-text-200 text-xs sm:text-sm font-medium mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vogais */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center text-text-100 mb-10 border-b border-bg-300 pb-2 mx-auto max-w-xs">Vogais da Direção</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-6 sm:gap-8 justify-center justify-items-center">
            {vogais.map((name) => (
              <div key={name} className="flex flex-col items-center text-center group w-full max-w-[180px]">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 mb-3 overflow-hidden rounded-full border-4 border-bg-200 group-hover:border-accent-200 transition-all duration-300 shadow-sm bg-bg-200 group-hover:shadow-md">
                  <img
                    src={getMemberPhoto(name, "Vogal")}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=b6ccd8&color=1d1c1c`;
                    }}
                  />
                </div>
                <h4 className="font-bold text-sm sm:text-base text-text-100">{name}</h4>
                <p className="text-text-200 text-xs font-medium mt-0.5">Vogal</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
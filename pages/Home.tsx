import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, MapPin, Terminal as TerminalIcon, Box, ExternalLink } from 'lucide-react';

// --- Componente do Terminal Interativo ---
const InteractiveTerminal: React.FC = () => {
  const [history, setHistory] = useState<Array<{ type: 'input' | 'output', content: React.ReactNode }>>([
    { type: 'output', content: 'NEEI_OS v1.0.5 [Secure Connection Established]' },
    { type: 'output', content: 'Welcome to NEEI System. Type "help" to see available commands.' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o fundo sempre que o histórico muda
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Focar no input ao clicar no terminal
  const handleFocus = () => {
    inputRef.current?.focus();
  };

  const handleCommand = (cmd: string) => {
    const command = cmd.trim().toLowerCase();
    const args = command.split(' ').slice(1);
    const mainCmd = command.split(' ')[0];

    let output: React.ReactNode = '';

    switch (mainCmd) {
      case 'help':
        output = (
          <div className="grid grid-cols-2 gap-2 max-w-xs">
            <span className="text-accent-200">help</span> <span>Lista comandos</span>
            <span className="text-accent-200">ls</span> <span>Lista ficheiros</span>
            <span className="text-accent-200">whoami</span> <span>Utilizador atual</span>
            <span className="text-accent-200">date</span> <span>Data sistema</span>
            <span className="text-accent-200">clear</span> <span>Limpa ecrã</span>
            <span className="text-accent-200">cat [file]</span> <span>Lê ficheiro</span>
          </div>
        );
        break;
      case 'ls':
        output = (
          <div className="flex gap-4 text-green-400 flex-wrap">
            <span>segredos_neei.log</span>
            <span>receita_sandes_atum.txt</span>
            <span>razões_para_ser_informatico.txt</span>
            <span className="text-blue-400">/projetos</span>
          </div>
        );
        break;
      case 'whoami':
        output = "guest_user@neei-ualg (Access Level: Student)";
        break;
      case 'date':
        output = new Date().toString();
        break;
      case 'sudo':
        output = "Permission denied: Nice try, but you are not root.";
        break;
      case 'hack':
        output = "Accessing mainframe... 0%... 10%... FAILED. Firewall is too strong.";
        break;
      case 'clear':
        setHistory([]);
        return; // Não adiciona ao histórico
      case 'cat':
        if (args.length === 0) {
          output = "Usage: cat [filename]";
        } else if (args[0] === 'segredos_neei.log') {
          output = "Error: File encrypted. Key required. (Dica: Pergunta ao presidente)";
        } else if (args[0] === 'receita_sandes_atum.txt') {
          output = (
            <div className="whitespace-pre-wrap text-yellow-200">
              {"=== RECEITA GOURMET DE ESTUDANTE ===\n1. Pão de ontem (se estiver duro, molha na água).\n2. Uma lata de atum (em óleo para escorregar melhor).\n3. Maionese (quanto mais, melhor).\n4. Misturar com as lágrimas de quem chumbou a Análise Matemática.\n5. Comer em 2 minutos antes da aula prática de AED."}
            </div>
          );
        } else if (args[0] === 'razões_para_ser_informatico.txt') {
          output = (
            <div className="whitespace-pre-wrap text-purple-300">
              {"=== PORQUE É QUE VIM PARA LEI? ===\n1. Era quem arranjava a televisão lá em casa (mudava o HDMI).\n2. Era quem concertava o computador da avó (desligava e voltava a ligar).\n3. Gosto de jogar jogos e achava que o curso era só gaming.\n4. O meu primo disse que dava dinheiro (ele vende NFTs).\n5. Tenho medo do sol."}
            </div>
          );
        } else {
          output = `cat: ${args[0]}: No such file or directory`;
        }
        break;
      case '':
        output = null;
        break;
      default:
        output = `Command not found: ${command}. Type "help".`;
    }

    if (output) {
      setHistory(prev => [...prev, { type: 'input', content: cmd }, { type: 'output', content: output }]);
    } else if (command !== '') {
      setHistory(prev => [...prev, { type: 'input', content: cmd }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(inputValue);
      setInputValue('');
    }
  };

  return (
    <div
      className="w-full h-full bg-[#0f172a] p-4 font-mono text-xs md:text-sm overflow-hidden flex flex-col relative"
      onClick={handleFocus}
    >
      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-10" style={{
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 2px, 3px 100%'
      }}></div>

      <div className="flex-1 overflow-y-auto z-0 space-y-1 scrollbar-hide pb-2" ref={scrollRef}>
        {history.map((line, i) => (
          <div key={i} className={`${line.type === 'input' ? 'text-gray-400 mt-2' : 'text-blue-300'}`}>
            {line.type === 'input' && <span className="text-accent-200 mr-2">$</span>}
            {line.content}
          </div>
        ))}

        <div className="flex items-center text-gray-200">
          <span className="text-accent-200 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none outline-none flex-1 text-blue-100 placeholder-gray-700"
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
          {/* Cursor a piscar */}
          <span className="w-2 h-4 bg-accent-200 animate-pulse ml-1"></span>
        </div>
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary-100 to-bg-100 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 space-y-6 text-center md:text-left mb-12 md:mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-primary-200 text-accent-200 text-xs font-bold uppercase tracking-wider mb-2">
              <MapPin size={12} />
              Sala 0.18, Edifício 1, Campus de Gambelas, Faro
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-text-100 leading-tight">
              <span className="text-accent-200">N</span>úcleo de <span className="text-accent-200">E</span>studantes de <span className="text-accent-200">E</span>ngenharia <span className="text-accent-200">I</span>nformática da <span className="text-accent-200">UAlg</span>
            </h1>
            <p className="text-lg text-text-200 max-w-lg mx-auto md:mx-0">
              Somos o órgão responsável por proporcionar atividades, workshops e eventos dedicados aos estudantes de Engenharia Informática da UAlg. Fomentamos a integração e a cooperação para uma experiência académica completa.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center md:justify-start">
              <Link to="/pertencer" className="bg-accent-200 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:bg-accent-100 hover:-translate-y-1 transition-all duration-300">
                Ser Colaborador
              </Link>
              <Link to="/quack" className="bg-white text-accent-200 border border-accent-200 px-8 py-3 rounded-lg font-semibold hover:bg-primary-100 transition-all duration-300 flex items-center justify-center gap-2">
                <Code size={20} />
                Quack (Online Judge)
              </Link>
              <a
                href="https://box.neei.online"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-text-100 border border-primary-200 hover:border-accent-200 px-8 py-3 rounded-lg font-semibold hover:bg-primary-100 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
              >
                <Box size={20} className="text-accent-200" />
                Ir para o NEEIBox
                <ExternalLink size={16} className="text-text-200 opacity-70" />
              </a>
            </div>
          </div>

          {/* MOLDURA ELÉTRICA INTERATIVA */}
          <div className="md:w-1/2 flex justify-center items-center w-full">
            <div className="relative group w-full max-w-lg">

              {/* 1. Efeito Glow Externo (Blur) */}
              <div className="absolute -inset-1 bg-gradient-to-r from-accent-200 via-blue-400 to-accent-200 rounded-xl blur opacity-20 group-hover:opacity-75 transition duration-500 group-hover:duration-200"></div>

              {/* 2. Container da Moldura */}
              <div className="relative rounded-xl bg-gray-900 ring-1 ring-white/10 overflow-hidden p-[2px] aspect-video shadow-2xl">

                {/* 3. Animação Elétrica (Borda Rotativa) */}
                <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_180deg,#00668c_240deg,#71c4ef_360deg)] animate-[spin_4s_linear_infinite]"></div>

                {/* 4. Área de Conteúdo (Máscara Preta Interna + Terminal) */}
                <div className="absolute inset-[2px] bg-[#0f172a] rounded-lg z-10 overflow-hidden">
                  <InteractiveTerminal />
                </div>
              </div>

              {/* Pequena dica abaixo da moldura */}
              <div className="text-center mt-4 opacity-60 text-xs font-mono text-gray-500">
                <TerminalIcon size={12} className="inline mr-1" />
                Sistema Interativo: Tenta escrever "help" ou "ls"
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
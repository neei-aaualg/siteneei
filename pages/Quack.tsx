import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, RefreshCw, AlertCircle, CheckCircle, AlertTriangle, BookOpen, ChevronRight, ShieldAlert, Clock, Unlock, Lightbulb, Code2 } from 'lucide-react';
import { analyzeCodeWithGemini } from '../services/geminiService';
import { ExecutionStatus, Course, Exercise } from '../types';

// Importação dos Dados das Cadeiras
import { piCourse } from '../data/pi';
import { pi2Course } from '../data/pi2';
import { lpCourse } from '../data/lp';
import { lp2Course } from '../data/lp2';
import { aedCourse } from '../data/aed';
import { aed2Course } from '../data/aed2';
import { aed3Course } from '../data/aed3';
import { pooCourse } from '../data/poo';
import { poo2Course } from '../data/poo2';

const COURSES: Course[] = [
    piCourse, pi2Course, 
    lpCourse, lp2Course, 
    aedCourse, aed2Course, aed3Course,
    pooCourse, poo2Course
];

// --- Componentes Auxiliares ---

// Editor com números de linha
const CodeEditor = ({ code, setCode, language }: { code: string, setCode: (s: string) => void, language: string }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumbersRef = useRef<HTMLDivElement>(null);

    const handleScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const lineCount = code.split('\n').length;
    const lines = Array.from({ length: Math.max(lineCount, 15) }, (_, i) => i + 1);

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-700 shadow-2xl">
             <div className="bg-[#2d2d2d] px-4 py-2 text-xs text-gray-400 flex items-center justify-between border-b border-gray-700 select-none">
                <div className="flex items-center gap-2">
                    <Code2 size={14} className="text-accent-200"/>
                    <span className="font-bold">Main.{language}</span>
                </div>
                <span className="text-gray-500">UTF-8</span>
            </div>
            <div className="relative flex-1 flex min-h-0">
                {/* Line Numbers */}
                <div 
                    ref={lineNumbersRef}
                    className="w-12 bg-[#1e1e1e] text-gray-600 text-right pr-3 pt-4 font-mono text-sm leading-6 select-none border-r border-gray-800 overflow-hidden"
                >
                    {lines.map(n => (
                        <div key={n}>{n}</div>
                    ))}
                </div>
                {/* Text Area */}
                <textarea
                    ref={textareaRef}
                    onScroll={handleScroll}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono p-4 pl-3 pt-4 resize-none focus:outline-none text-sm leading-6 whitespace-pre"
                    spellCheck="false"
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                />
            </div>
        </div>
    );
};

const Quack: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<Course>(COURSES[0]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise>(COURSES[0].exercises[0]);
  
  const [code, setCode] = useState<string>(COURSES[0].exercises[0].initialCode);
  const [status, setStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE);
  const [output, setOutput] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [hint, setHint] = useState<string>('');
  
  const [activeTab, setActiveTab] = useState<'terminal' | 'details' | 'hint'>('terminal');

  useEffect(() => {
    setCode(selectedExercise.initialCode);
    setStatus(ExecutionStatus.IDLE);
    setOutput('');
    setDetails('');
    setHint('');
    setActiveTab('terminal');
  }, [selectedExercise]);

  const handleRun = async () => {
    setStatus(ExecutionStatus.RUNNING);
    setOutput('');
    setDetails('');
    setHint('');
    setActiveTab('terminal');

    try {
      const result = await analyzeCodeWithGemini({
        code: code,
        language: selectedCourse.language,
        testCases: selectedExercise.testCases
      });
      
      let finalStatus = ExecutionStatus.ERROR;
      if (result.status === 'SUCCESS') finalStatus = ExecutionStatus.SUCCESS;
      if (result.status === 'SECURITY_VIOLATION') finalStatus = ExecutionStatus.SECURITY_VIOLATION;
      if (result.status === 'TIMEOUT') finalStatus = ExecutionStatus.TIMEOUT;
      
      setStatus(finalStatus);
      setOutput(result.output || '');
      setDetails(result.details || '');
      setHint(result.hint || '');

      // Auto switch tabs based on result
      if (finalStatus === ExecutionStatus.SUCCESS) {
          // Se sucesso, mostra detalhes/testes passados
          setActiveTab('details');
      } else if (result.hint) {
          // Se falhou e TEM dica, mostra a dica para ajudar o aluno
          setActiveTab('hint');
      } else {
          // Se falhou e não tem dica (erro grave), mostra o terminal/erro
          setActiveTab('details');
      }

    } catch (e) {
      setStatus(ExecutionStatus.ERROR);
      setDetails("Erro interno na execução da simulação.");
    }
  };

  const handleUseSolution = () => {
      if (selectedExercise.solutionCode) {
          setCode(selectedExercise.solutionCode);
          setStatus(ExecutionStatus.IDLE);
          setOutput('');
          setDetails('');
          setHint('');
      } else {
          alert("Solução não disponível.");
      }
  };

  // Safe check if courses loaded correctly
  if (!COURSES || COURSES.length === 0) {
      return <div className="p-10 text-center">A carregar conteúdos...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-6">
      
      {/* Sidebar Navigation */}
      <div className="hidden md:flex w-64 flex-col gap-4 overflow-y-auto pr-1">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-primary-200">
            <h2 className="font-bold text-text-100 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <BookOpen size={16} className="text-accent-200"/>
                Cadeiras
            </h2>
            <div className="space-y-3">
                {COURSES.map(course => (
                    <div key={course.id}>
                        <button 
                            onClick={() => {
                                setSelectedCourse(course);
                                setSelectedExercise(course.exercises[0]);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors flex justify-between items-center ${
                                selectedCourse.id === course.id 
                                ? 'bg-primary-300 text-white shadow-md' 
                                : 'text-text-200 hover:bg-primary-100'
                            }`}
                        >
                            {course.shortName}
                            <span className="text-[10px] font-mono opacity-80 bg-white/20 px-1 rounded">{course.language}</span>
                        </button>
                        
                        {selectedCourse.id === course.id && (
                            <div className="ml-3 mt-2 pl-3 border-l-2 border-primary-200 space-y-1">
                                {course.exercises.map(ex => (
                                    <button
                                        key={ex.id}
                                        onClick={() => setSelectedExercise(ex)}
                                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition-all flex items-center gap-2 ${
                                            selectedExercise.id === ex.id
                                            ? 'text-accent-200 font-bold bg-accent-100/10'
                                            : 'text-text-200 hover:text-accent-200 hover:translate-x-1'
                                        }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedExercise.id === ex.id ? 'bg-accent-200' : 'bg-gray-300'}`}></div>
                                        <span className="truncate">{ex.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 gap-4">
        
        {/* Header - Exercise Info */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-primary-200 flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-bold text-text-100 flex items-center gap-2">
                        {selectedExercise.title}
                        {status === ExecutionStatus.SUCCESS && <CheckCircle size={18} className="text-green-500"/>}
                    </h1>
                    <p className="text-text-200 text-sm mt-1">{selectedExercise.description}</p>
                </div>
                <div className="flex gap-2">
                     <button
                        onClick={handleUseSolution}
                        className="p-2 text-accent-200 hover:bg-accent-100/10 rounded-lg transition-colors"
                        title="Ver Solução"
                    >
                        <Unlock size={18} />
                    </button>
                    <button 
                        onClick={handleRun}
                        disabled={status === ExecutionStatus.RUNNING}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all text-sm ${
                            status === ExecutionStatus.RUNNING 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-500 hover:shadow-lg active:translate-y-0.5'
                        }`}
                    >
                        {status === ExecutionStatus.RUNNING ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                        {status === ExecutionStatus.RUNNING ? 'A Executar...' : 'Executar Código'}
                    </button>
                </div>
            </div>
            
            {/* Quick Stats / Tags */}
            <div className="flex items-center gap-4 text-xs text-text-200 border-t border-gray-100 pt-3 mt-1">
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Code2 size={12}/> {selectedCourse.language === 'c' ? 'GCC 10.2' : 'OpenJDK 15'}</span>
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Clock size={12}/> 30s Timeout</span>
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><ShieldAlert size={12}/> Sandbox (Piston)</span>
            </div>
        </div>

        {/* Workspace Split */}
        <div className="flex-1 grid lg:grid-cols-2 gap-4 min-h-0">
             
             {/* Left: Editor */}
             <CodeEditor code={code} setCode={setCode} language={selectedCourse.language} />

            {/* Right: Output & Tools */}
            <div className="flex flex-col bg-white rounded-xl shadow-xl border border-primary-200 overflow-hidden">
                
                {/* Tabs Header */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button 
                        onClick={() => setActiveTab('terminal')}
                        className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'terminal' ? 'border-accent-200 text-accent-200 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Terminal size={16} /> Terminal
                    </button>
                    <button 
                         onClick={() => setActiveTab('details')}
                         className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                            activeTab === 'details' ? 'border-accent-200 text-accent-200 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {status === ExecutionStatus.SUCCESS ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                        Resultados
                        {status !== ExecutionStatus.IDLE && status !== ExecutionStatus.RUNNING && (
                             <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status === ExecutionStatus.SUCCESS ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {status === ExecutionStatus.SUCCESS ? 'PASSOU' : 'ERRO'}
                             </span>
                        )}
                    </button>
                    {hint && (
                         <button 
                            onClick={() => setActiveTab('hint')}
                            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                                activeTab === 'hint' ? 'border-yellow-400 text-yellow-600 bg-white' : 'border-transparent text-yellow-600 hover:bg-yellow-50'
                            }`}
                        >
                            <Lightbulb size={16} className={activeTab === 'hint' ? 'fill-yellow-400' : ''}/> AI Tutor
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-0 overflow-y-auto bg-[#1e1e1e] relative">
                    
                    {/* TERMINAL TAB */}
                    {activeTab === 'terminal' && (
                        <div className="p-4 font-mono text-sm text-gray-300 min-h-full">
                            {status === ExecutionStatus.IDLE ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2 opacity-50 mt-10">
                                    <Terminal size={48} />
                                    <p>O output do programa aparecerá aqui.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="text-gray-500 text-xs mb-2 select-none">$ {selectedCourse.language === 'c' ? './main' : 'java Main'}</div>
                                    <div className="whitespace-pre-wrap">{output || <span className="text-gray-600 italic">(Sem output no stdout...)</span>}</div>
                                    {status === ExecutionStatus.SUCCESS && <div className="text-green-500 text-xs mt-4 select-none">Process finished with exit code 0</div>}
                                    {status !== ExecutionStatus.SUCCESS && status !== ExecutionStatus.RUNNING && <div className="text-red-500 text-xs mt-4 select-none">Process finished with errors</div>}
                                </>
                            )}
                        </div>
                    )}

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="p-6 bg-white h-full overflow-y-auto">
                            {status === ExecutionStatus.IDLE ? (
                                <div className="text-center text-gray-400 mt-10">
                                    <Play size={48} className="mx-auto mb-2 opacity-20"/>
                                    <p>Executa o código para ver a análise.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Status Banner */}
                                    <div className={`p-4 rounded-lg flex items-start gap-3 ${
                                        status === ExecutionStatus.SUCCESS ? 'bg-green-50 text-green-800' : 
                                        status === ExecutionStatus.TIMEOUT ? 'bg-orange-50 text-orange-800' :
                                        'bg-red-50 text-red-800'
                                    }`}>
                                        {status === ExecutionStatus.SUCCESS ? <CheckCircle className="mt-0.5 shrink-0"/> : <AlertTriangle className="mt-0.5 shrink-0"/>}
                                        <div>
                                            <h3 className="font-bold">
                                                {status === ExecutionStatus.SUCCESS ? 'Sucesso!' : 
                                                 status === ExecutionStatus.TIMEOUT ? 'Time Limit Exceeded' : 'Erro na Execução'}
                                            </h3>
                                            <p className="text-sm mt-1 whitespace-pre-wrap">{details}</p>
                                        </div>
                                    </div>

                                    {/* Test Cases List */}
                                    <div>
                                        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Code2 size={16}/> Casos de Teste
                                        </h4>
                                        <div className="space-y-3">
                                            {selectedExercise.testCases.map((tc, idx) => (
                                                <div key={idx} className="border border-gray-200 rounded-lg p-3 text-sm">
                                                    <div className="grid grid-cols-2 gap-4 mb-2">
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Input</span>
                                                            <div className="font-mono bg-gray-100 p-1.5 rounded text-gray-800 mt-1">{tc.input || "(vazio)"}</div>
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Esperado</span>
                                                            <div className="font-mono bg-gray-100 p-1.5 rounded text-gray-800 mt-1">{tc.expectedOutput}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* HINT TAB */}
                    {activeTab === 'hint' && (
                        <div className="p-6 bg-yellow-50 h-full overflow-y-auto">
                            <div className="flex items-start gap-4">
                                <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 shrink-0">
                                    <Lightbulb size={32} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-yellow-900 mb-2">Dica do Tutor IA</h3>
                                    <p className="text-yellow-800 leading-relaxed whitespace-pre-line">{hint}</p>
                                    <div className="mt-6 text-sm text-yellow-700/60 italic border-t border-yellow-200 pt-2">
                                        Esta dica foi gerada automaticamente pelo Gemini analisando o erro real do teu código.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Quack;
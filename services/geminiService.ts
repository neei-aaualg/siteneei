
import { ExecutionStatus, Language } from "../types";

// Piston API Configuration (Public Instance)
// Documentação: https://piston.readthedocs.io/en/latest/api-v2/
const PISTON_API_URL = "https://emkc.org/api/v2/piston/execute";

interface SimulationParams {
  code: string;
  language: Language;
  testCases: { input: string; expectedOutput: string }[];
}

/**
 * Executa o código usando a API Piston (Compilador Real).
 * Retorna null se a API falhar, ou o objeto de resultado se funcionar.
 */
async function executeWithPiston(code: string, language: Language, stdin: string): Promise<{ run: { stdout: string, stderr: string, code: number }, compile?: { stderr: string } } | null> {
    try {
        // Configuração específica para garantir que Java e C funcionam bem
        const langConfig = language === 'c' 
            ? { language: "c", version: "10.2.0", filename: "Main.c" }
            : { language: "java", version: "15.0.2", filename: "Main.java" };

        const response = await fetch(PISTON_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                language: langConfig.language,
                version: langConfig.version,
                files: [{ 
                    name: langConfig.filename,
                    content: code 
                }],
                stdin: stdin,
                run_timeout: 3000, // 3 segundos max de execução real no servidor
                compile_timeout: 10000
            })
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error("Piston API Error:", e);
        return null;
    }
}

export const analyzeCodeWithGemini = async (params: SimulationParams) => {
  const { code, language, testCases } = params;

  // --- FASE 1: Tentar Execução Real (Piston API) ---
  const primaryTestCase = testCases[0];
  const pistonResult = await executeWithPiston(code, language, primaryTestCase.input);

  let realOutput = "";
  let realError = "";
  let hasError = false;

  if (pistonResult) {
      // Verificar erro de compilação
      if (pistonResult.compile && pistonResult.compile.stderr) {
          realError = "Erro de Compilação:\n" + pistonResult.compile.stderr;
          hasError = true;
      } else {
          // Execução correu (pode ter erro de runtime ou sucesso)
          realOutput = pistonResult.run.stdout;
          // Se o código de saída for != 0, houve erro de runtime (ex: segfault)
          if (pistonResult.run.code !== 0) {
              realError = pistonResult.run.stderr || `Erro de execução (Exit Code: ${pistonResult.run.code})`;
              hasError = true;
          } else if (pistonResult.run.stderr) {
              // Às vezes há avisos no stderr mesmo com sucesso, mas assumimos como info
              // A menos que o stdout esteja vazio e haja stderr
              if (!realOutput) realError = pistonResult.run.stderr;
          }
          
          // Verifica se o output bate certo (normalização básica)
          const cleanOutput = realOutput ? realOutput.trim() : "";
          const cleanExpected = primaryTestCase.expectedOutput.trim();
          
          // Lógica de sucesso estrita (se funcionou perfeitamente, nem chamamos a IA)
          if (!hasError && cleanOutput === cleanExpected) {
              return {
                  status: ExecutionStatus.SUCCESS,
                  output: realOutput,
                  details: 'Execução bem sucedida no servidor remoto. Output correto.',
                  hint: 'Excelente! O teu código funciona como esperado e passou nos testes.',
                  passedTests: 1,
                  totalTests: 1
              };
          }
      }
  } else {
      // Piston falhou (API down?) - Forçamos a IA a simular
      realError = "Servidor de execução temporariamente indisponível.";
  }

  // --- FASE 2: Chamar o Backend Seguro para Análise ---
  
  try {
    // Agora enviamos dados estruturados, NÃO um prompt pronto.
    // O servidor é responsável por montar o prompt para evitar Injection.
    const payload = {
        code: code,
        language: language,
        context: {
            hasError: !!realError,
            errorMessage: realError,
            output: realOutput,
            input: primaryTestCase.input,
            expected: primaryTestCase.expectedOutput
        }
    };

    const backendResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!backendResponse.ok) {
        // Tenta ler o erro JSON se existir
        const errData = await backendResponse.json().catch(() => ({}));
        throw new Error(errData.details || `Backend Error: ${backendResponse.status}`);
    }

    const aiResult = await backendResponse.json();

    return {
        ...aiResult,
        // Força o output real se existir e não for violação de segurança
        output: (realOutput && aiResult.status !== 'SECURITY_VIOLATION') ? realOutput : aiResult.output,
        passedTests: aiResult.status === 'SUCCESS' ? 1 : 0,
        totalTests: 1
    };

  } catch (error: any) {
    console.error("AI Service Error:", error);
    return {
      status: ExecutionStatus.ERROR,
      output: realOutput,
      details: error.message || 'Erro de comunicação com o Tutor Inteligente.',
      hint: 'Ocorreu um erro ao contactar o servidor. Verifica se o código não é demasiado longo.'
    };
  }
};

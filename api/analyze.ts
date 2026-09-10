import { GoogleGenAI, Schema, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";

export const config = {
  runtime: 'edge',
};

// Segurança: Padrões proibidos verificados no servidor
const FORBIDDEN_PATTERNS = [
  'system(', 'exec(', 'fork(', 'popen(', // Processos C/C++
  'Runtime.getRuntime', 'ProcessBuilder', // Processos Java
  'upload', 'download', 'socket', 'http', 'ftp', // Rede
  'while(1)', 'while(true)', 'for(;;)', // Loops infinitos óbvios
  '/etc/passwd', '/bin/sh', 'cmd.exe' // Acesso ao sistema de ficheiros
];

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await request.json();
    const { code, language, context } = body;
    
    // 1. Validação de Input (Security & Anti-Abuse)
    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ status: 'ERROR', details: 'Código inválido.' }), { status: 400 });
    }

    // Limite de caracteres para evitar exaustão de tokens (max 5000 chars)
    if (code.length > 5000) {
      return new Response(JSON.stringify({ 
        status: 'ERROR', 
        details: 'O código é demasiado longo para análise (máx 5000 caracteres).',
        hint: 'Tenta analisar funções mais pequenas individualmente.'
      }), { status: 400 });
    }

    // 2. Verificação de Segurança (Server-Side)
    // Remove espaços em branco para evitar bypasses simples como "system ( "
    const cleanCode = code.replace(/\s/g, '');
    if (FORBIDDEN_PATTERNS.some(pattern => cleanCode.includes(pattern))) {
      return new Response(JSON.stringify({
        status: 'SECURITY_VIOLATION',
        output: '',
        details: 'ERRO DE SEGURANÇA: O código contém chamadas de sistema ou padrões proibidos.',
        hint: 'Remove chamadas ao sistema, acesso a rede ou ficheiros.'
      }), { status: 200 }); // Retorna 200 para o frontend processar o JSON graciosamente
    }

    // 3. Configuração da API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        status: 'ERROR',
        details: 'Erro de configuração no servidor (API Key em falta).',
        hint: 'Contacta o administrador do sistema.'
      }), { status: 500 });
    }

    // 4. Construção do Prompt (Server-Side para evitar Injection)
    // O cliente envia apenas o contexto do erro, nós construímos a instrução
    let promptInstruction = "";
    
    if (context.hasError) {
        promptInstruction = `
        O código FALHOU na execução real.
        Erro reportado: "${context.errorMessage.substring(0, 1000)}" 
        Output parcial: "${context.output.substring(0, 500)}"
        TAREFA: Explica o erro de compilação ou execução em Português de Portugal.
        `;
    } else if (context.output !== context.expected) {
        promptInstruction = `
        O código correu mas o output está INCORRETO.
        Output Obtido: "${context.output.substring(0, 500)}"
        Output Esperado: "${context.expected}"
        TAREFA: Explica a falha lógica.
        `;
    } else {
        promptInstruction = `
        O servidor de execução está indisponível. Simula a execução e age como compilador.
        Caso de Teste - Input: "${context.input}" | Esperado: "${context.expected}"
        `;
    }

    const fullPrompt = `
      Atua como um Tutor de Programação paciente para estudantes universitários (NEEI UAlg).
      Responde sempre em PORTUGUÊS DE PORTUGAL (pt-PT).
      Sê conciso e pedagógico. Não dês a solução completa, dá dicas.
      
      Linguagem: ${language === 'c' ? 'C (GCC)' : 'Java (OpenJDK)'}
      
      ${promptInstruction}

      CÓDIGO DO ALUNO:
      \`\`\`${language}
      ${code}
      \`\`\`
    `;

    const ai = new GoogleGenAI({ apiKey });

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        status: { type: Type.STRING, enum: ['SUCCESS', 'ERROR', 'SECURITY_VIOLATION'] },
        output: { type: Type.STRING },
        details: { type: Type.STRING },
        hint: { type: Type.STRING },
      },
      required: ['status', 'output', 'details', 'hint']
    };

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        // Configuração de segurança do modelo para evitar conteúdo tóxico
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
        ]
      }
    });

    return new Response(result.text, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Server API Error:", error);
    return new Response(JSON.stringify({
      status: 'ERROR',
      details: 'Erro interno ao processar o pedido.',
      hint: 'Tenta novamente mais tarde.'
    }), { status: 500 });
  }
}
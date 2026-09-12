import { describe, it, expect, vi, afterEach } from 'vitest';
import { analyzeCodeWithGemini } from '../services/geminiService';
import { ExecutionStatus } from '../types';

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';
const BACKEND_URL = '/api/analyze';

interface FetchCall {
  url: string;
  options: { method: string; body: string; headers: Record<string, string> };
}

describe('analyzeCodeWithGemini', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('devolve SUCCESS quando o Piston confirma o output (sem chamar o backend)', async () => {
    const calls: FetchCall[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, options: FetchCall['options']) => {
        calls.push({ url, options });
        if (url === PISTON_URL) {
          return {
            ok: true,
            json: async () => ({ run: { stdout: '5\n', stderr: '', code: 0 }, compile: null }),
          };
        }
        throw new Error('não deveria chamar o backend');
      })
    );

    const result = await analyzeCodeWithGemini({
      code: '#include <stdio.h>\nint main(){printf("5\\n");return 0;}',
      language: 'c',
      testCases: [{ input: '', expectedOutput: '5' }],
    });

    expect(result.status).toBe(ExecutionStatus.SUCCESS);
    expect(result.output.trim()).toBe('5');
    expect(result.passedTests).toBe(1);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(PISTON_URL);
  });

  it('solicita o backend em caso de erro de compilação', async () => {
    const calls: FetchCall[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, options: FetchCall['options']) => {
        calls.push({ url, options });
        if (url === PISTON_URL) {
          return { ok: true, json: async () => ({ compile: { stderr: 'error: expected ;' } }) };
        }
        return {
          ok: true,
          json: async () => ({
            status: 'ERROR',
            output: '',
            details: 'falhou a compilar',
            hint: 'verifica o ;',
          }),
        };
      })
    );

    const result = await analyzeCodeWithGemini({
      code: 'int main(){ return 0 }',
      language: 'c',
      testCases: [{ input: '', expectedOutput: '5' }],
    });

    expect(result.status).toBe(ExecutionStatus.ERROR);
    expect(result.details).toBe('falhou a compilar');
    expect(calls).toHaveLength(2);
    const context = JSON.parse(calls[1].options.body).context;
    expect(context.hasError).toBe(true);
    expect(context.errorMessage).toContain('Erro de Compilação');
  });

  it('mantém o output real quando o backend reporta SUCCESS', async () => {
    const calls: FetchCall[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, options: FetchCall['options']) => {
        calls.push({ url, options });
        if (url === PISTON_URL) {
          return {
            ok: true,
            json: async () => ({ run: { stdout: '7', stderr: '', code: 0 }, compile: null }),
          };
        }
        return {
          ok: true,
          json: async () => ({ status: 'SUCCESS', output: '', details: 'x', hint: 'y' }),
        };
      })
    );

    const result = await analyzeCodeWithGemini({
      code: 'printf("7")',
      language: 'c',
      testCases: [{ input: '', expectedOutput: '9' }],
    });

    expect(result.status).toBe(ExecutionStatus.SUCCESS);
    expect(result.output).toBe('7');
    expect(result.passedTests).toBe(1);
  });

  it('omit o output real em caso de violação de segurança', async () => {
    const calls: FetchCall[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, options: FetchCall['options']) => {
        calls.push({ url, options });
        if (url === PISTON_URL) {
          return {
            ok: true,
            json: async () => ({ run: { stdout: 'segredo', stderr: '', code: 0 }, compile: null }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            status: 'SECURITY_VIOLATION',
            output: '',
            details: 'código perigoso',
            hint: 'revê o teu código',
          }),
        };
      })
    );

    const result = await analyzeCodeWithGemini({
      code: 'rm -rf',
      language: 'c',
      testCases: [{ input: '', expectedOutput: 'x' }],
    });

    expect(result.status).toBe(ExecutionStatus.SECURITY_VIOLATION);
    expect(result.output).toBe('');
    expect(result.hint).toContain('revê o teu código');
  });

  it('recorre à IA quando a API Piston está indisponível', async () => {
    const calls: FetchCall[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, options: FetchCall['options']) => {
        calls.push({ url, options });
        if (url === PISTON_URL) {
          throw new Error('ECONNREFUSED');
        }
        return {
          ok: true,
          json: async () => ({ status: 'ERROR', output: '', details: 'simulou', hint: 'h' }),
        };
      })
    );

    const result = await analyzeCodeWithGemini({
      code: 'int x;',
      language: 'c',
      testCases: [{ input: '', expectedOutput: '1' }],
    });

    expect(result.details).toBe('simulou');
    const context = JSON.parse(calls[1].options.body).context;
    expect(context.hasError).toBe(true);
  });

  it('devolve ERROR quando o backend falha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === PISTON_URL) {
          return { ok: true, json: async () => ({ compile: { stderr: 'erro' } }) };
        }
        throw new Error('backend down');
      })
    );

    const result = await analyzeCodeWithGemini({
      code: 'int x;',
      language: 'c',
      testCases: [{ input: '', expectedOutput: '1' }],
    });

    expect(result.status).toBe(ExecutionStatus.ERROR);
    expect(result.hint).toContain('Ocorreu um erro ao contactar o servidor');
  });

  it('não falha quando não há casos de teste (chama apenas o backend)', async () => {
    const calls: FetchCall[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, options: FetchCall['options']) => {
        calls.push({ url, options });
        if (url === PISTON_URL) {
          throw new Error('não deveria chamar o Piston');
        }
        return {
          ok: true,
          json: async () => ({ status: 'SUCCESS', output: '', details: 'sim', hint: 'h' }),
        };
      })
    );

    const result = await analyzeCodeWithGemini({
      code: 'int main(){return 0;}',
      language: 'c',
      testCases: [],
    });

    expect(result.status).toBe(ExecutionStatus.SUCCESS);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('/api/analyze');
  });

  it('envia os dados estruturados ao backend (sem prompt injetável)', async () => {
    const calls: FetchCall[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, options: FetchCall['options']) => {
        calls.push({ url, options });
        if (url === PISTON_URL) {
          return { ok: true, json: async () => ({ compile: { stderr: 'erro sintaxe' } }) };
        }
        return {
          ok: true,
          json: async () => ({ status: 'ERROR', output: '', details: '', hint: '' }),
        };
      })
    );

    await analyzeCodeWithGemini({
      code: 'printf("olá")',
      language: 'java',
      testCases: [{ input: '', expectedOutput: 'olá' }],
    });

    const payload = JSON.parse(calls[1].options.body);
    expect(payload).toEqual({
      code: 'printf("olá")',
      language: 'java',
      context: {
        hasError: true,
        errorMessage: expect.stringContaining('Erro de Compilação'),
        output: '',
        input: '',
        expected: 'olá',
      },
    });
  });

  it('configura o Piston para C (10.2.0 / Main.c)', async () => {
    let pistonBody: any;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, options: FetchCall['options']) => {
        if (url === PISTON_URL) {
          pistonBody = JSON.parse(options.body);
          return {
            ok: true,
            json: async () => ({ run: { stdout: '5', stderr: '', code: 0 }, compile: null }),
          };
        }
        throw new Error('unexpected');
      })
    );

    const result = await analyzeCodeWithGemini({
      code: 'int main(){return 0;}',
      language: 'c',
      testCases: [{ input: '', expectedOutput: '5' }],
    });
    expect(result.status).toBe(ExecutionStatus.SUCCESS);
    expect(pistonBody).toMatchObject({
      language: 'c',
      version: '10.2.0',
      run_timeout: 3000,
      compile_timeout: 10000,
    });
    expect(pistonBody.files[0].name).toBe('Main.c');
  });
});

import { Course } from '../types';

export const pi2Course: Course = {
    id: 'pi2',
    name: 'Programação Imperativa 2',
    shortName: 'PI2',
    language: 'c',
    exercises: [
        // --- Operadores Bitwise e Tipos (Aprofundamento) ---
        {
            id: 'pi2_01',
            title: '1. Manipulação de Bits: Verificar Estado',
            description: 'A manipulação de bits é essencial em sistemas embebidos e otimização. Neste exercício, deves verificar se um bit específico está ativo.\n\nTarefa:\nLê um número inteiro N e um índice I (0 a 31).\nUsa o operador de shift (`>>`) e o operador AND (`&`) para verificar se o bit na posição I é 1.\nOutput: "1" se o bit estiver ativo, "0" caso contrário.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n, i;\n    scanf("%d %d", &n, &i);\n    // (n >> i) & 1\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, i;\n    scanf("%d %d", &n, &i);\n    if ((n >> i) & 1) printf("1"); else printf("0");\n    return 0;\n}',
            testCases: [{ input: "5 0", expectedOutput: "1" }, { input: "5 1", expectedOutput: "0" }]
        },
        {
            id: 'pi2_02',
            title: '2. Popcount: Contagem de Bits Ativos',
            description: 'O peso de Hamming (ou popcount) é o número de bits com valor 1 num número binário.\n\nTarefa:\nLê um inteiro sem sinal (`unsigned int`)\nConta quantos bits "1" existem na sua representação binária.\n\nDica: Podes fazer um ciclo que verifica o último bit (`n & 1`) e depois faz shift right (`n >>= 1`) até o número ser 0.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    unsigned int n;\n    scanf("%u", &n);\n    // Conta os bits a 1\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    unsigned int n, count = 0;\n    scanf("%u", &n);\n    while(n > 0) { if(n & 1) count++; n >>= 1; }\n    printf("%d", count);\n    return 0;\n}',
            testCases: [{ input: "7", expectedOutput: "3" }, { input: "8", expectedOutput: "1" }]
        },
        {
            id: 'pi2_03',
            title: '3. Máscaras de Bits: Set e Clear',
            description: 'As máscaras (masks) permitem alterar bits específicos sem afetar os restantes.\n\nTarefa:\nLê um inteiro N.\n1. Força o 3º bit (índice 2, valor 4) a ser 1 usando o operador OR (`|`).\n2. Força o 1º bit (índice 0, valor 1) a ser 0 usando o operador AND (`&`) com o complemento (`~`).\nImprime o número resultante.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // n = n | (1 << 2) ...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    n = n | (1 << 2); // Set bit 2\n    n = n & ~(1 << 0); // Clear bit 0\n    printf("%d", n);\n    return 0;\n}',
            testCases: [{ input: "0", expectedOutput: "4" }]
        },

        // --- Estruturas de Controlo Avançadas ---
        {
            id: 'pi2_04',
            title: '4. Loops Aninhados: Pirâmide',
            description: 'Loops aninhados são usados para gerar padrões bidimensionais.\n\nTarefa:\nLê um número N.\nImprime uma pirâmide centrada de altura N.\n\nExemplo para N=3:\n  1  (2 espaços, 1)\n 222 (1 espaço, 3 números)\n33333 (0 espaços, 5 números)\n\nFórmula: Linha i tem `N-i` espaços e `2*i-1` números.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // Loops para linhas, espaços e números\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for(int i=1; i<=n; i++) {\n        for(int j=0; j<n-i; j++) printf(" ");\n        for(int k=0; k<2*i-1; k++) printf("%d", i);\n        printf("\\n");\n    }\n    return 0;\n}',
            testCases: [{ input: "2", expectedOutput: " 1\n222\n" }]
        },
        {
            id: 'pi2_05',
            title: '5. Triângulo de Pascal',
            description: 'O Triângulo de Pascal é construído tal que cada número é a soma dos dois números acima dele.\n\nTarefa:\nLê N. Imprime as primeiras N linhas do triângulo.\n\nDica: O elemento na linha `i` e coluna `j` pode ser calculado por combinações C(n,k) ou iterativamente: `val = val * (i - j) / (j + 1)`.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // Implementa a lógica\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) {\n        int val = 1;\n        for(int j=0; j<=i; j++) {\n            printf("%d ", val);\n            val = val * (i - j) / (j + 1);\n        }\n        printf("\\n");\n    }\n    return 0;\n}',
            testCases: [{ input: "3", expectedOutput: "1 \n1 1 \n1 2 1 \n" }]
        },

        // --- Funções e Decomposição (Ponteiros como args) ---
        {
            id: 'pi2_06',
            title: '6. Retorno Múltiplo (Ponteiros)',
            description: 'Em C, uma função só retorna um valor. Para retornar mais, usamos ponteiros como argumentos de saída.\n\nTarefa:\nImplementa `void minmax(int v[], int n, int *min, int *max)`.\nA função deve percorrer o array e guardar o valor mínimo no endereço `min` e o máximo no endereço `max`.',
            initialCode: '#include <stdio.h>\n\nvoid minmax(int v[], int n, int *min, int *max) {\n    // Atualiza *min e *max\n}\n\nint main() {\n    int v[100], n, min, max;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) scanf("%d", &v[i]);\n    minmax(v, n, &min, &max);\n    printf("%d %d", min, max);\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nvoid minmax(int v[], int n, int *min, int *max) {\n    *min = v[0]; *max = v[0];\n    for(int i=1; i<n; i++) {\n        if(v[i] < *min) *min = v[i];\n        if(v[i] > *max) *max = v[i];\n    }\n}\n\nint main() {\n    int v[100], n, min, max;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) scanf("%d", &v[i]);\n    minmax(v, n, &min, &max);\n    printf("%d %d", min, max);\n    return 0;\n}',
            testCases: [{ input: "5 10 2 30 4 5", expectedOutput: "2 30" }]
        },
        {
            id: 'pi2_07',
            title: '7. Variáveis Estáticas (Persistência)',
            description: 'Variáveis locais normais perdem o valor quando a função termina. Variáveis `static` mantêm o valor entre chamadas.\n\nTarefa:\nCria uma função `int contador()` que usa uma variável estática para contar quantas vezes já foi chamada.\nO main chama esta função N vezes e imprime o retorno de cada chamada.',
            initialCode: '#include <stdio.h>\n\nint contador() {\n    static int c = 0;\n    // Incrementa e retorna\n}\n\nint main() {\n    int n; scanf("%d", &n);\n    for(int i=0; i<n; i++) printf("%d ", contador());\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint contador() {\n    static int c = 0;\n    return ++c;\n}\n\nint main() {\n    int n; scanf("%d", &n);\n    for(int i=0; i<n; i++) printf("%d ", contador());\n    return 0;\n}',
            testCases: [{ input: "3", expectedOutput: "1 2 3 " }]
        },

        // --- Recursividade Avançada (Pilha de Execução) ---
        {
            id: 'pi2_08',
            title: '8. Soma de Dígitos Recursiva',
            description: 'Podemos decompor um número nos seus dígitos recursivamente usando divisão e resto.\n\nTarefa:\nDado um número N (ex: 1234).\nCalcula a soma dos seus dígitos (1+2+3+4 = 10) de forma recursiva.\n\nDica: `soma(n) = (n % 10) + soma(n / 10)`. Caso base: `n == 0`.',
            initialCode: '#include <stdio.h>\n\nint somaDigitos(int n) {\n    // Implementa a recursão\n}\n\nint main() {\n    int n; scanf("%d", &n);\n    printf("%d", somaDigitos(n));\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint somaDigitos(int n) {\n    if(n == 0) return 0;\n    return (n % 10) + somaDigitos(n / 10);\n}\n\nint main() {\n    int n; scanf("%d", &n);\n    printf("%d", somaDigitos(n));\n    return 0;\n}',
            testCases: [{ input: "1234", expectedOutput: "10" }]
        },
        {
            id: 'pi2_09',
            title: '9. Função de Ackermann',
            description: 'A função de Ackermann é um exemplo clássico de recursão profunda que cresce muito rapidamente.\n\nDefinição:\nSe m=0 -> n+1\nSe m>0, n=0 -> A(m-1, 1)\nSe m>0, n>0 -> A(m-1, A(m, n-1))\n\nImplementa esta função. (Testa apenas com valores pequenos, ex: 2 2).',
            initialCode: '#include <stdio.h>\n\nint ackermann(int m, int n) {\n    // Segue a definição matemática\n}\n\nint main() {\n    int m, n; scanf("%d %d", &m, &n);\n    printf("%d", ackermann(m, n));\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint ackermann(int m, int n) {\n    if (m == 0) return n + 1;\n    if (n == 0) return ackermann(m - 1, 1);\n    return ackermann(m - 1, ackermann(m, n - 1));\n}\n\nint main() {\n    int m, n; scanf("%d %d", &m, &n);\n    printf("%d", ackermann(m, n));\n    return 0;\n}',
            testCases: [{ input: "2 2", expectedOutput: "7" }]
        },
        {
            id: 'pi2_10',
            title: '10. Algoritmo de Euclides (MDC)',
            description: 'O Máximo Divisor Comum (MDC) pode ser calculado eficientemente pelo algoritmo de Euclides.\n\nAlgoritmo Recursivo:\nMDC(A, 0) = A\nMDC(A, B) = MDC(B, A % B)\n\nImplementa e calcula o MDC de dois números lidos da entrada.',
            initialCode: '#include <stdio.h>\n\nint mdc(int a, int b) {\n    // Implementa Euclides\n}\n\nint main() {\n    int a, b; scanf("%d %d", &a, &b);\n    printf("%d", mdc(a, b));\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint mdc(int a, int b) {\n    if(b == 0) return a;\n    return mdc(b, a % b);\n}\n\nint main() {\n    int a, b; scanf("%d %d", &a, &b);\n    printf("%d", mdc(a, b));\n    return 0;\n}',
            testCases: [{ input: "48 18", expectedOutput: "6" }]
        },
        {
            id: 'pi2_11',
            title: '11. Conversão Decimal para Binário',
            description: 'Podemos imprimir a representação binária de um número usando recursão, sem precisar de arrays.\n\nLógica:\nPara imprimir N em binário, primeiro imprimimos N/2 em binário (chamada recursiva) e depois imprimimos o bit N%2.\n\nTarefa: Implementa `void binario(int n)`.',
            initialCode: '#include <stdio.h>\n\nvoid binario(int n) {\n    if (n > 1) binario(n / 2);\n    printf("%d", n % 2);\n}\n\nint main() {\n    int n; scanf("%d", &n);\n    binario(n);\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nvoid binario(int n) {\n    if (n > 1) binario(n / 2);\n    printf("%d", n % 2);\n}\n\nint main() {\n    int n; scanf("%d", &n);\n    binario(n);\n    return 0;\n}',
            testCases: [{ input: "10", expectedOutput: "1010" }]
        },

        // --- Arrays Multidimensionais ---
        {
            id: 'pi2_12',
            title: '12. Matrizes: Transposta',
            description: 'A transposta de uma matriz troca as suas linhas pelas colunas. Ou seja, o elemento M[i][j] passa para a posição T[j][i].\n\nTarefa:\nLê uma matriz 3x3.\nImprime a sua transposta.\n\nExemplo:\n1 2 3      1 4 7\n4 5 6  ->  2 5 8\n7 8 9      3 6 9',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int m[3][3];\n    // Lê M[i][j]\n    // Imprime M[j][i] ou cria nova matriz\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int m[3][3];\n    for(int i=0; i<3; i++) for(int j=0; j<3; j++) scanf("%d", &m[i][j]);\n    for(int j=0; j<3; j++) {\n        for(int i=0; i<3; i++) printf("%d ", m[i][j]);\n        printf("\\n");\n    }\n    return 0;\n}',
            testCases: [{ input: "1 2 3 4 5 6 7 8 9", expectedOutput: "1 4 7 \n2 5 8 \n3 6 9 \n" }]
        },
        {
            id: 'pi2_13',
            title: '13. Multiplicação de Matrizes',
            description: 'O produto de duas matrizes A (NxM) e B (MxP) resulta numa matriz C (NxP).\n\nTarefa:\nLê duas matrizes 2x2.\nCalcula o produto C, onde `C[i][j] = Somatório(A[i][k] * B[k][j])`.\nImprime a matriz resultante.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int a[2][2], b[2][2], c[2][2] = {0};\n    // Lê A e B\n    // 3 loops aninhados para multiplicar\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int a[2][2], b[2][2], c[2][2] = {0};\n    for(int i=0;i<2;i++) for(int j=0;j<2;j++) scanf("%d", &a[i][j]);\n    for(int i=0;i<2;i++) for(int j=0;j<2;j++) scanf("%d", &b[i][j]);\n    for(int i=0;i<2;i++)\n      for(int j=0;j<2;j++)\n        for(int k=0;k<2;k++)\n           c[i][j] += a[i][k] * b[k][j];\n    for(int i=0;i<2;i++) { for(int j=0;j<2;j++) printf("%d ", c[i][j]); printf("\\n"); }\n    return 0;\n}',
            testCases: [{ input: "1 2 3 4 2 0 1 2", expectedOutput: "4 4 \n10 8 \n" }]
        },

        // --- Strings e Manipulação (Cadeias de Caracteres) ---
        {
            id: 'pi2_14',
            title: '14. Aritmética de Ponteiros: Strlen',
            description: 'Podemos percorrer arrays usando ponteiros em vez de índices.\n\nTarefa:\nImplementa `int meu_strlen(char *s)`.\nUsa um ponteiro `p` inicializado em `s`.\nIncrementa `p` até apontar para `\\0`.\nRetorna a diferença `p - s` (o número de elementos entre eles).',
            initialCode: '#include <stdio.h>\n\nint meu_strlen(char *s) {\n    char *p = s;\n    // Avança p\n    return 0;\n}\n\nint main() {\n    char s[100]; scanf("%s", s);\n    printf("%d", meu_strlen(s));\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint meu_strlen(char *s) {\n    char *p = s;\n    while(*p) p++;\n    return p - s;\n}\n\nint main() {\n    char s[100]; scanf("%s", s);\n    printf("%d", meu_strlen(s));\n    return 0;\n}',
            testCases: [{ input: "Teste", expectedOutput: "5" }]
        },
        {
            id: 'pi2_15',
            title: '15. Comparação Manual de Strings',
            description: 'Implementa uma lógica similar ao `strcmp`.\n\nTarefa:\nLê duas strings.\nCompara-as caractere a caractere.\nSe todos forem iguais e terminarem ao mesmo tempo, imprime "IGUAL".\nCaso contrário, imprime "DIFERENTE".',
            initialCode: '#include <stdio.h>\n\nint main() {\n    char s1[100], s2[100];\n    scanf("%s %s", s1, s2);\n    // Loop de comparação\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    char s1[100], s2[100];\n    scanf("%s %s", s1, s2);\n    int i=0, igual=1;\n    while(s1[i] || s2[i]) {\n        if(s1[i] != s2[i]) { igual=0; break; }\n        i++;\n    }\n    if(igual) printf("IGUAL"); else printf("DIFERENTE");\n    return 0;\n}',
            testCases: [{ input: "ola ola", expectedOutput: "IGUAL" }, { input: "ola ole", expectedOutput: "DIFERENTE" }]
        },
        {
            id: 'pi2_16',
            title: '16. Manipulação: Remover Espaços',
            description: 'A manipulação de strings muitas vezes envolve copiar caracteres filtrados.\n\nTarefa:\nLê uma frase completa (usa `scanf("%[^\\n]", s)` para ler até ao enter).\nRemove todos os espaços da string, "compactando" os caracteres restantes.\nImprime a string resultante.',
            initialCode: '#include <stdio.h>\n\nvoid removeEspacos(char *s) {\n    // Usa dois índices: leitura (i) e escrita (j)\n}\n\nint main() {\n    char s[100];\n    scanf("%[^\\n]", s);\n    removeEspacos(s);\n    printf("%s", s);\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nvoid removeEspacos(char *s) {\n    int i = 0, j = 0;\n    while(s[i]) {\n        if(s[i] != \' \') s[j++] = s[i];\n        i++;\n    }\n    s[j] = \'\\0\';\n}\n\nint main() {\n    char s[100];\n    scanf("%[^\\n]", s);\n    removeEspacos(s);\n    printf("%s", s);\n    return 0;\n}',
            testCases: [{ input: "a b c", expectedOutput: "abc" }]
        },
        {
            id: 'pi2_17',
            title: '17. Tokenizer (strtok)',
            description: 'Dividir uma string em partes (tokens) é uma operação comum (ex: CSV).\n\nTarefa:\nLê uma string contendo palavras separadas por vírgulas (ex: "a,b,c").\nUsa a função `strtok` da biblioteca `string.h` para extrair e imprimir cada palavra numa nova linha.',
            initialCode: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[100];\n    scanf("%s", s);\n    // char *token = strtok(s, ",");\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[100];\n    scanf("%s", s);\n    char *token = strtok(s, ",");\n    while(token != NULL) {\n        printf("%s\\n", token);\n        token = strtok(NULL, ",");\n    }\n    return 0;\n}',
            testCases: [{ input: "a,b,c", expectedOutput: "a\nb\nc\n" }]
        },

        // --- Gestão Dinâmica de Memória ---
        {
            id: 'pi2_18',
            title: '18. Malloc e Free: Array Dinâmico',
            description: 'A alocação dinâmica é crucial quando o tamanho dos dados só é conhecido em tempo de execução.\n\nTarefa:\nLê N.\nAloca memória para N floats.\nLê os valores, calcula a média e imprime.\nIMPORTANTE: Não te esqueças de libertar a memória com `free()` no fim.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    float *v = NULL; // Faz malloc aqui\n    // ...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    if(scanf("%d", &n)!=1) return 1;\n    float *v = (float*)malloc(n * sizeof(float));\n    float soma = 0;\n    for(int i=0; i<n; i++) {\n        scanf("%f", &v[i]);\n        soma += v[i];\n    }\n    printf("%.2f", soma/n);\n    free(v);\n    return 0;\n}',
            testCases: [{ input: "3 10.0 20.0 30.0", expectedOutput: "20.00" }]
        },
        {
            id: 'pi2_19',
            title: '19. Realloc: Array Expansível',
            description: 'E se não soubermos N inicialmente? Usamos `realloc` para redimensionar o array conforme necessário.\n\nTarefa:\nComeça com um array de tamanho 2.\nLê inteiros indefinidamente até encontrares -1.\nSe o array encher, duplica o seu tamanho com `realloc`.\nNo fim, imprime todos os números lidos.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int cap = 2, size = 0, num;\n    int *arr = malloc(cap * sizeof(int));\n    // Loop leitura. Se size == cap -> realloc\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int cap = 2, size = 0, num;\n    int *arr = (int*)malloc(cap * sizeof(int));\n    while(scanf("%d", &num) && num != -1) {\n        if(size == cap) {\n            cap *= 2;\n            arr = (int*)realloc(arr, cap * sizeof(int));\n        }\n        arr[size++] = num;\n    }\n    for(int i=0; i<size; i++) printf("%d ", arr[i]);\n    free(arr);\n    return 0;\n}',
            testCases: [{ input: "1 2 3 4 5 -1", expectedOutput: "1 2 3 4 5 " }]
        },
        {
            id: 'pi2_20',
            title: '20. Matrizes Dinâmicas (Ponteiro para Ponteiro)',
            description: 'Para alocar uma matriz dinamicamente, precisamos de um `int **m` (array de ponteiros para linhas).\n\nTarefa:\nLê Linhas e Colunas.\nAloca a matriz.\nPreenche com números sequenciais (1, 2, 3...) e imprime.\nLiberta cada linha e depois o array de ponteiros.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int l, c;\n    scanf("%d %d", &l, &c);\n    // Alocar array de ponteiros, depois arrays de ints\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int l, c, k=1;\n    scanf("%d %d", &l, &c);\n    int **m = (int**)malloc(l * sizeof(int*));\n    for(int i=0; i<l; i++) m[i] = (int*)malloc(c * sizeof(int));\n    \n    for(int i=0; i<l; i++) \n        for(int j=0; j<c; j++) m[i][j] = k++;\n        \n    for(int i=0; i<l; i++) {\n        for(int j=0; j<c; j++) printf("%d ", m[i][j]);\n        printf("\\n");\n        free(m[i]);\n    }\n    free(m);\n    return 0;\n}',
            testCases: [{ input: "2 3", expectedOutput: "1 2 3 \n4 5 6 \n" }]
        },

        // --- Structs e Tabelas Chave-Valor (Simulação) ---
        {
            id: 'pi2_21',
            title: '21. Busca em Array de Structs',
            description: 'Vamos simular uma consulta a uma tabela de produtos.\n\nTarefa:\nDefine `struct Produto { int id; float preco; }`.\nLê N produtos.\nLê um ID de busca.\nProcura o produto com esse ID e imprime o preço. Se não existir, imprime -1.',
            initialCode: '#include <stdio.h>\n\ntypedef struct { int id; float preco; } Produto;\n\nint main() {\n    // Ler catalogo, depois ler id_busca\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\ntypedef struct { int id; float preco; } Produto;\n\nint main() {\n    int n, searchId, found=0;\n    scanf("%d", &n);\n    Produto p[100];\n    for(int i=0; i<n; i++) scanf("%d %f", &p[i].id, &p[i].preco);\n    scanf("%d", &searchId);\n    for(int i=0; i<n; i++) {\n        if(p[i].id == searchId) {\n            printf("%.2f", p[i].preco);\n            found = 1; break;\n        }\n    }\n    if(!found) printf("-1");\n    return 0;\n}',
            testCases: [{ input: "2 10 5.50 20 12.00 10", expectedOutput: "5.50" }]
        },
        {
            id: 'pi2_22',
            title: '22. Ordenação de Structs',
            description: 'Podemos ordenar estruturas complexas baseadas num dos seus campos.\n\nTarefa:\nLê N alunos (Nome Nota).\nOrdena-os por Nota de forma DECRESCENTE.\nImprime a lista ordenada.',
            initialCode: '#include <stdio.h>\n\ntypedef struct { char nome[20]; int nota; } Aluno;\n\nint main() {\n    // Implementa bubble sort trocando structs inteiras\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <string.h>\ntypedef struct { char nome[20]; int nota; } Aluno;\n\nint main() {\n    int n;\n    Aluno t[100], temp;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) scanf("%s %d", t[i].nome, &t[i].nota);\n    for(int i=0; i<n-1; i++)\n        for(int j=0; j<n-i-1; j++)\n            if(t[j].nota < t[j+1].nota) { temp=t[j]; t[j]=t[j+1]; t[j+1]=temp; }\n    for(int i=0; i<n; i++) printf("%s %d\\n", t[i].nome, t[i].nota);\n    return 0;\n}',
            testCases: [{ input: "3 Ana 15 Bob 10 Zac 18", expectedOutput: "Zac 18\nAna 15\nBob 10\n" }]
        },

        // --- Algoritmos de Busca Avançados ---
        {
            id: 'pi2_23',
            title: '23. Busca Binária (O(log N))',
            description: 'A busca binária é muito mais rápida que a linear, mas requer o array ordenado.\n\nTarefa:\nLê N inteiros (que já virão ordenados) e um valor K.\nImplementa a busca binária para encontrar o índice de K.\nRetorna o índice ou -1 se não existir.',
            initialCode: '#include <stdio.h>\n\nint binarySearch(int v[], int n, int k) {\n    // l=0, r=n-1, while(l<=r)...\n}\n\nint main() {\n    //...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint binarySearch(int v[], int n, int k) {\n    int l=0, r=n-1;\n    while(l <= r) {\n        int m = l + (r-l)/2;\n        if(v[m] == k) return m;\n        if(v[m] < k) l = m + 1;\n        else r = m - 1;\n    }\n    return -1;\n}\n\nint main() {\n    int n, k, v[100];\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) scanf("%d", &v[i]);\n    scanf("%d", &k);\n    printf("%d", binarySearch(v, n, k));\n    return 0;\n}',
            testCases: [{ input: "5 10 20 30 40 50 40", expectedOutput: "3" }]
        },
        {
            id: 'pi2_24',
            title: '24. Two Pointers: Soma Alvo',
            description: 'Dado um array ordenado, verifica se existem dois números cuja soma seja K.\n\nEstratégia O(N):\nUsa dois ponteiros: `left` no início, `right` no fim.\nSe `soma < k`, avança `left`.\nSe `soma > k`, recua `right`.\nSe `soma == k`, encontrou.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    // Array deve ser lido ordenado\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, k, v[100];\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) scanf("%d", &v[i]);\n    scanf("%d", &k);\n    int l=0, r=n-1, found=0;\n    while(l < r) {\n        int sum = v[l] + v[r];\n        if(sum == k) { printf("SIM"); found=1; break; }\n        if(sum < k) l++; else r--;\n    }\n    if(!found) printf("NAO");\n    return 0;\n}',
            testCases: [{ input: "4 1 2 4 8 6", expectedOutput: "SIM" }]
        },

        // --- Ponteiros para Ponteiros ---
        {
            id: 'pi2_25',
            title: '25. Indireção Múltipla (int **)',
            description: 'Ponteiros para ponteiros permitem alterar para onde um ponteiro aponta.\n\nTarefa:\nCria uma função `muda` que recebe `int **p` e `int *novo`.\nA função deve fazer com que `*p` passe a apontar para `novo`.\nTeste no main alterando o alvo de um ponteiro.',
            initialCode: '#include <stdio.h>\n\nvoid muda(int **p, int *novo) {\n    // Altera *p\n}\n\nint main() {\n    int a = 10, b = 20;\n    int *ptr = &a;\n    muda(&ptr, &b);\n    printf("%d", *ptr);\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nvoid muda(int **p, int *novo) {\n    *p = novo;\n}\n\nint main() {\n    int a = 10, b = 20;\n    int *ptr = &a;\n    muda(&ptr, &b);\n    printf("%d", *ptr);\n    return 0;\n}',
            testCases: [{ input: "", expectedOutput: "20" }]
        },

        // --- Lista Ligada Simples (Introdução a AED) ---
        {
            id: 'pi2_26',
            title: '26. Intro Listas Ligadas: Inserção',
            description: 'Listas ligadas são estruturas dinâmicas onde cada nó aponta para o próximo.\n\nTarefa:\nDefine `struct Node {int v; struct Node *next;}`.\nLê N inteiros.\nInsere cada um na CABEÇA da lista (ordem LIFO).\nImprime a lista percorrendo os ponteiros.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node {\n    int v;\n    struct Node *next;\n} Node;\n\nint main() {\n    Node *head = NULL;\n    // Inserir loops\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\ntypedef struct Node { int v; struct Node *next; } Node;\n\nint main() {\n    int n, val;\n    Node *head = NULL;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) {\n        scanf("%d", &val);\n        Node *novo = (Node*)malloc(sizeof(Node));\n        novo->v = val;\n        novo->next = head;\n        head = novo;\n    }\n    Node *curr = head;\n    while(curr) { printf("%d ", curr->v); curr = curr->next; }\n    return 0;\n}',
            testCases: [{ input: "3 1 2 3", expectedOutput: "3 2 1 " }]
        },

        // --- Ficheiros e Streams (Simulado) ---
        {
            id: 'pi2_27',
            title: '27. Leitura Segura de Linhas (fgets)',
            description: '`scanf` para na primeira palavra. `fgets` lê a linha inteira, incluindo espaços.\n\nTarefa:\nUsa `fgets` para ler 3 linhas de texto do stdin.\nImprime cada linha precedida pelo seu número (1: texto...).',
            initialCode: '#include <stdio.h>\n\nint main() {\n    char buffer[100];\n    // fgets(buffer, 100, stdin)\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    char buffer[100];\n    for(int i=1; i<=3; i++) {\n        if(fgets(buffer, 100, stdin)) printf("%d: %s", i, buffer);\n    }\n    return 0;\n}',
            testCases: [{ input: "Ola mundo\nTeste 2\nFim", expectedOutput: "1: Ola mundo\n2: Teste 2\n3: Fim" }]
        },

        // --- Desafios Finais ---
        {
            id: 'pi2_28',
            title: '28. Merge de Arrays Ordenados',
            description: 'Dados dois arrays já ordenados, cria um terceiro array também ordenado contendo todos os elementos.\n\nEstratégia O(N+M):\nCompara os elementos atuais de A e B.\nInsere o menor no resultado e avança o índice correspondente.\nRepete até acabarem os arrays.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    // Implementa a lógica de merge\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, m, a[50], b[50];\n    scanf("%d", &n); for(int i=0;i<n;i++) scanf("%d", &a[i]);\n    scanf("%d", &m); for(int i=0;i<m;i++) scanf("%d", &b[i]);\n    int i=0, j=0;\n    while(i<n && j<m) {\n        if(a[i] < b[j]) printf("%d ", a[i++]);\n        else printf("%d ", b[j++]);\n    }\n    while(i<n) printf("%d ", a[i++]);\n    while(j<m) printf("%d ", b[j++]);\n    return 0;\n}',
            testCases: [{ input: "3 1 3 5 2 2 4", expectedOutput: "1 2 3 4 5 " }]
        },
        {
            id: 'pi2_29',
            title: '29. Frequência de Caracteres (Histograma)',
            description: 'Conta quantas vezes cada caractere aparece numa string.\n\nEstratégia:\nUsa um array `freq[256]` inicializado a zeros.\nPara cada char `c` da string, faz `freq[c]++`.\nImprime os caracteres com contagem > 0.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int freq[256] = {0};\n    char s[100];\n    //...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <string.h>\nint main() {\n    int freq[256] = {0};\n    char s[100];\n    scanf("%s", s);\n    for(int i=0; s[i]; i++) freq[(int)s[i]]++;\n    for(int i=0; i<256; i++) if(freq[i]>0) printf("%c:%d ", i, freq[i]);\n    return 0;\n}',
            testCases: [{ input: "banana", expectedOutput: "a:3 b:1 n:2 " }]
        },
        {
            id: 'pi2_30',
            title: '30. Matriz Espiral',
            description: 'O Desafio Final.\nLê N.\nPreenche uma matriz NxN com números de 1 a N*N em espiral (sentido horário, começando em 0,0).\nImprime a matriz.\n\nRequer controlo cuidadoso de limites (top, bottom, left, right).',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n; scanf("%d", &n);\n    // Logica complexa de indices\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, m[20][20];\n    scanf("%d", &n);\n    int val=1, top=0, bottom=n-1, left=0, right=n-1;\n    while(val <= n*n) {\n        for(int i=left; i<=right; i++) m[top][i] = val++; top++;\n        for(int i=top; i<=bottom; i++) m[i][right] = val++; right--;\n        for(int i=right; i>=left; i--) m[bottom][i] = val++; bottom--;\n        for(int i=bottom; i>=top; i--) m[i][left] = val++; left++;\n    }\n    for(int i=0; i<n; i++) { for(int j=0; j<n; j++) printf("%d ", m[i][j]); printf("\\n"); }\n    return 0;\n}',
            testCases: [{ input: "3", expectedOutput: "1 2 3 \n8 9 4 \n7 6 5 \n" }]
        }
    ]
};
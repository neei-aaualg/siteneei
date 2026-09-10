import { Course } from '../types';

export const piCourse: Course = {
    id: 'pi',
    name: 'Programação Imperativa',
    shortName: 'PI',
    language: 'c',
    exercises: [
        // --- Introdução e I/O ---
        {
            id: 'pi_01',
            title: '1. O Primeiro Programa',
            description: 'Bem-vindo ao mundo da programação em C! O teu primeiro desafio é criar o programa mais clássico de todos. O objetivo é escrever um código que envie a mensagem "Ola Mundo" para a saída padrão (stdout). \n\nRequisitos:\n1. O programa deve imprimir exatamente a frase, respeitando maiúsculas e minúsculas.\n2. Deve terminar com um caractere de nova linha (\\n). \n\nIsto garante que o output fique formatado corretamente no terminal.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    // Escreve o teu código printf aqui\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    printf("Ola Mundo\\n");\n    return 0;\n}',
            testCases: [{ input: "", expectedOutput: "Ola Mundo" }]
        },
        {
            id: 'pi_02',
            title: '2. Leitura e Soma Simples',
            description: 'Neste exercício, vais aprender a interagir com o utilizador usando `scanf`. O objetivo é criar uma calculadora de soma simples.\n\nInput:\nO programa deve ler dois números inteiros separados por espaço (ex: "5 7").\n\nOutput:\nDeve imprimir apenas o resultado da soma desses dois números.\n\nLembra-te de declarar as variáveis com o tipo `int` antes de as usares.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int a, b;\n    // Usa scanf para ler e printf para mostrar a soma\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int a, b;\n    if(scanf("%d %d", &a, &b) != 2) return 1;\n    printf("%d", a + b);\n    return 0;\n}',
            testCases: [{ input: "5 7", expectedOutput: "12" }, { input: "-10 10", expectedOutput: "0" }]
        },
        
        // --- Tipos de Dados ---
        {
            id: 'pi_03',
            title: '3. Média Aritmética (Float)',
            description: 'A divisão de inteiros em C trunca o resultado (ex: 5/2 = 2). Para obter casas decimais, precisamos de usar tipos de ponto flutuante (`float` ou `double`).\n\nTarefa:\nLê 3 números inteiros da entrada.\nCalcula a média aritmética exata ((a+b+c)/3).\nImprime o resultado formatado com exatamente 2 casas decimais (usa `%.2f` no printf).\n\nDica: Faz cast de um dos operandos para float antes de dividir.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int a, b, c;\n    // Lê os valores e calcula a média com precisão decimal\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int a, b, c;\n    if(scanf("%d %d %d", &a, &b, &c) != 3) return 1;\n    printf("%.2f", (a + b + c) / 3.0);\n    return 0;\n}',
            testCases: [{ input: "10 20 30", expectedOutput: "20.00" }, { input: "2 2 3", expectedOutput: "2.33" }]
        },
        {
            id: 'pi_04',
            title: '4. Área do Círculo e Constantes',
            description: 'Vamos praticar o uso de constantes e matemática básica. O objetivo é calcular a área de um círculo dado o seu raio.\n\nFórmula: Área = PI * raio * raio\n\nInput:\nUm número inteiro representando o raio R.\n\nOutput:\nA área do círculo formatada com 2 casas decimais.\n\nNota: Usa o valor de PI como 3.14159.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int r;\n    // Declara PI e calcula a área\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int r;\n    scanf("%d", &r);\n    printf("%.2f", 3.14159 * r * r);\n    return 0;\n}',
            testCases: [{ input: "5", expectedOutput: "78.54" }]
        },

        // --- Estruturas de Controlo (Decisão) ---
        {
            id: 'pi_05',
            title: '5. Decisão: Par ou Ímpar',
            description: 'As estruturas condicionais (`if/else`) permitem ao programa tomar decisões. A tua tarefa é determinar a paridade de um número.\n\nInput:\nUm número inteiro N.\n\nOutput:\nEscreve "Par" se o número for divisível por 2.\nEscreve "Impar" caso contrário.\n\nDica: O operador módulo (`%`) devolve o resto da divisão inteira.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // Verifica se n % 2 é zero\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    if(n % 2 == 0) printf("Par");\n    else printf("Impar");\n    return 0;\n}',
            testCases: [{ input: "4", expectedOutput: "Par" }, { input: "7", expectedOutput: "Impar" }]
        },
        {
            id: 'pi_06',
            title: '6. Lógica: O Maior de Três',
            description: 'Muitas vezes precisamos de encontrar extremos num conjunto de dados. Neste exercício, deves comparar três valores distintos.\n\nTarefa:\nLê 3 números inteiros da entrada padrão.\nUsa estruturas `if` ou `if-else` encadeadas para descobrir qual deles é o maior.\nImprime apenas o maior número.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int a, b, c;\n    scanf("%d %d %d", &a, &b, &c);\n    // Implementa a lógica para encontrar o maior\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int a, b, c;\n    scanf("%d %d %d", &a, &b, &c);\n    int max = a;\n    if(b > max) max = b;\n    if(c > max) max = c;\n    printf("%d", max);\n    return 0;\n}',
            testCases: [{ input: "10 5 8", expectedOutput: "10" }, { input: "2 9 4", expectedOutput: "9" }]
        },
        {
            id: 'pi_07',
            title: '7. Condições Complexas: Ano Bissexto',
            description: 'As condições lógicas podem ser combinadas com `&&` (E) e `||` (OU). Vamos determinar se um ano é bissexto.\n\nRegra:\nUm ano é bissexto se:\n1. For divisível por 4 E NÃO for divisível por 100.\n2. OU se for divisível por 400.\n\nInput: Um inteiro representando o Ano.\nOutput: "SIM" ou "NAO".',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int ano;\n    // Combina as condições lógicas\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int ano;\n    scanf("%d", &ano);\n    if((ano % 4 == 0 && ano % 100 != 0) || (ano % 400 == 0)) printf("SIM");\n    else printf("NAO");\n    return 0;\n}',
            testCases: [{ input: "2024", expectedOutput: "SIM" }, { input: "1900", expectedOutput: "NAO" }]
        },
        {
            id: 'pi_08',
            title: '8. Conversão de Tempo',
            description: 'Este exercício testa a tua capacidade de usar divisão inteira e resto para converter unidades.\n\nTarefa:\nDado um valor inteiro representando segundos, converte-o para o formato Horas:Minutos:Segundos.\n\nExemplo: 3661 segundos = 1 hora, 1 minuto e 1 segundo -> Output: "1:1:1".\n\nInput: Inteiro T (segundos).\nOutput: HH:MM:SS.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int t;\n    // 1 hora = 3600s, 1 min = 60s\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int t;\n    scanf("%d", &t);\n    printf("%d:%d:%d", t/3600, (t%3600)/60, t%60);\n    return 0;\n}',
            testCases: [{ input: "3661", expectedOutput: "1:1:1" }]
        },

        // --- Estruturas de Controlo (Repetição) ---
        {
            id: 'pi_09',
            title: '9. Ciclos: Contagem Sequencial',
            description: 'Os ciclos (loops) são fundamentais para repetir tarefas. O ciclo `for` é ideal quando sabemos quantas vezes queremos repetir algo.\n\nTarefa:\nLê um número inteiro N.\nImprime todos os números de 1 até N (inclusive), separados por um espaço.\n\nExemplo Input: 5\nExemplo Output: 1 2 3 4 5 ',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    // Usa um ciclo for de i=1 até n\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for(int i=1; i<=n; i++) printf("%d ", i);\n    return 0;\n}',
            testCases: [{ input: "5", expectedOutput: "1 2 3 4 5 " }]
        },
        {
            id: 'pi_10',
            title: '10. Tabuada Automática',
            description: 'Vamos gerar a tabuada de um número utilizando um ciclo.\n\nInput:\nUm número inteiro N.\n\nOutput:\n10 linhas com a tabuada de N (de 1 a 10), no formato "N x i = Resultado".\n\nExemplo para N=5:\n5 x 1 = 5\n...\n5 x 10 = 50',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // Gera as 10 linhas da tabuada\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for(int i=1; i<=10; i++) printf("%d x %d = %d\\n", n, i, n*i);\n    return 0;\n}',
            testCases: [{ input: "5", expectedOutput: "5 x 1 = 5\n5 x 2 = 10\n5 x 3 = 15\n5 x 4 = 20\n5 x 5 = 25\n5 x 6 = 30\n5 x 7 = 35\n5 x 8 = 40\n5 x 9 = 45\n5 x 10 = 50\n" }]
        },
        {
            id: 'pi_11',
            title: '11. Acumulador: Soma de N Números',
            description: 'Neste exercício deves ler uma sequência de tamanho variável e somar todos os valores. \n\nInput:\n1. Um número N indicando quantos valores se seguem.\n2. Uma sequência de N números inteiros.\n\nOutput:\nA soma total de todos os N números.\n\nDica: Usa uma variável acumuladora inicializada a 0 dentro do ciclo.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n, temp, soma = 0;\n    scanf("%d", &n);\n    // Lê N vezes e soma\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, temp, soma = 0;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) { scanf("%d", &temp); soma += temp; }\n    printf("%d", soma);\n    return 0;\n}',
            testCases: [{ input: "3 10 20 5", expectedOutput: "35" }]
        },
        {
            id: 'pi_12',
            title: '12. Fatorial Iterativo',
            description: 'O fatorial de um número N (escrito N!) é o produto de todos os inteiros positivos menores ou iguais a N. Ex: 5! = 5*4*3*2*1 = 120.\n\nTarefa:\nCalcula o fatorial de N usando um ciclo `for` ou `while`.\n\nNota Importante: O fatorial cresce muito rápido. Usa o tipo `long long` para armazenar o resultado e evitar overflow em números maiores.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    long long fat = 1;\n    // Calcula o produto acumulado\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    long long fat = 1;\n    scanf("%d", &n);\n    for(int i=1; i<=n; i++) fat *= i;\n    printf("%lld", fat);\n    return 0;\n}',
            testCases: [{ input: "5", expectedOutput: "120" }]
        },
        {
            id: 'pi_13',
            title: '13. Verificação de Número Primo',
            description: 'Um número primo é aquele que só é divisível por 1 e por ele próprio (e deve ser maior que 1).\n\nTarefa:\nLê um número inteiro N.\nVerifica se é primo testando se tem divisores entre 2 e a raiz quadrada de N (ou N-1).\n\nOutput:\n"PRIMO" ou "NAO PRIMO".',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    // Testa divisores num loop\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, primo=1;\n    scanf("%d", &n);\n    if(n<=1) primo=0;\n    for(int i=2; i*i<=n; i++) if(n%i==0) primo=0;\n    if(primo) printf("PRIMO"); else printf("NAO PRIMO");\n    return 0;\n}',
            testCases: [{ input: "7", expectedOutput: "PRIMO" }, { input: "10", expectedOutput: "NAO PRIMO" }]
        },

        // --- Funções e Decomposição Funcional ---
        {
            id: 'pi_14',
            title: '14. Decomposição Funcional: O Dobro',
            description: 'A decomposição funcional ajuda a organizar o código em blocos lógicos reutilizáveis. \n\nTarefa:\n1. Cria uma função auxiliar `int dobro(int x)` que recebe um inteiro e retorna o valor multiplicado por 2.\n2. No `main`, lê um número, chama a função e imprime o resultado.\n\nO objetivo é praticar a sintaxe de definição e chamada de funções.',
            initialCode: '#include <stdio.h>\n\n// Define a função dobro aqui\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // printf("%d", dobro(n));\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint dobro(int x) { return x * 2; }\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%d", dobro(n));\n    return 0;\n}',
            testCases: [{ input: "15", expectedOutput: "30" }]
        },
        {
            id: 'pi_15',
            title: '15. Passagem por Referência (Ponteiros)',
            description: 'Em C, para que uma função altere o valor de uma variável externa, temos de usar ponteiros (passagem por referência). \n\nTarefa:\nImplementa a função `void troca(int *a, int *b)` que troca os valores das variáveis apontadas por `a` e `b`.\n\nNo main, lê dois números, chama a função de troca passando os endereços (`&x, &y`) e imprime-os na nova ordem.',
            initialCode: '#include <stdio.h>\n\nvoid troca(int *a, int *b) {\n    // Usa uma variavel temporaria para trocar os conteudos\n}\n\nint main() {\n    int x, y;\n    scanf("%d %d", &x, &y);\n    troca(&x, &y);\n    printf("%d %d", x, y);\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nvoid troca(int *a, int *b) { int t = *a; *a = *b; *b = t; }\n\nint main() {\n    int x, y;\n    scanf("%d %d", &x, &y);\n    troca(&x, &y);\n    printf("%d %d", x, y);\n    return 0;\n}',
            testCases: [{ input: "10 20", expectedOutput: "20 10" }]
        },

        // --- Recursividade ---
        {
            id: 'pi_16',
            title: '16. Fatorial Recursivo',
            description: 'Uma função recursiva é aquela que se chama a si mesma. O fatorial é o exemplo clássico.\n\nDefinição Recursiva:\nFatorial(0) = 1 (Caso Base)\nFatorial(N) = N * Fatorial(N-1) (Passo Recursivo)\n\nTarefa:\nImplementa a função `long long fatorial(int n)` usando esta lógica, sem ciclos.',
            initialCode: '#include <stdio.h>\n\nlong long fatorial(int n) {\n    // Define o caso base e a chamada recursiva\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%lld", fatorial(n));\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nlong long fatorial(int n) { if(n<=1) return 1; return n*fatorial(n-1); }\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%lld", fatorial(n));\n    return 0;\n}',
            testCases: [{ input: "5", expectedOutput: "120" }]
        },
        {
            id: 'pi_17',
            title: '17. Sequência de Fibonacci',
            description: 'A sequência de Fibonacci define-se como: o número atual é a soma dos dois anteriores.\nFib(0)=0, Fib(1)=1\nFib(N) = Fib(N-1) + Fib(N-2)\n\nTarefa:\nCalcula o N-ésimo número de Fibonacci de forma recursiva.\n\nInput: Inteiro N.\nOutput: O valor de Fib(N).',
            initialCode: '#include <stdio.h>\n\nint fib(int n) {\n    // Implementa a lógica de Fibonacci\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%d", fib(n));\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint fib(int n) { if(n<=1) return n; return fib(n-1)+fib(n-2); }\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%d", fib(n));\n    return 0;\n}',
            testCases: [{ input: "6", expectedOutput: "8" }]
        },

        // --- Arrays ---
        {
            id: 'pi_18',
            title: '18. Introdução a Arrays',
            description: 'Arrays permitem armazenar múltiplos valores do mesmo tipo numa única variável. \n\nTarefa:\n1. Lê um número N (assumimos N <= 100).\n2. Lê N números inteiros e guarda-os num array `int arr[100]`.\n3. Percorre o array e imprime os valores lidos na mesma ordem, separados por espaço.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int arr[100], n;\n    scanf("%d", &n);\n    // Primeiro ciclo para ler, segundo para imprimir\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int arr[100], n;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) scanf("%d", &arr[i]);\n    for(int i=0; i<n; i++) printf("%d ", arr[i]);\n    return 0;\n}',
            testCases: [{ input: "3 1 2 3", expectedOutput: "1 2 3 " }]
        },
        {
            id: 'pi_19',
            title: '19. Análise de Array: Máximo',
            description: 'Dado um conjunto de números armazenados num array, queremos encontrar o valor mais alto.\n\nAlgoritmo:\n1. Assume que o primeiro elemento (`arr[0]`) é o máximo atual.\n2. Percorre os restantes elementos.\n3. Se encontrares um valor maior que o máximo atual, atualiza o máximo.\n\nTarefa: Imprime o maior valor encontrado nos N números lidos.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int arr[100], n;\n    scanf("%d", &n);\n    // Lê e descobre o max\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, val, max;\n    scanf("%d", &n);\n    scanf("%d", &max);\n    for(int i=1; i<n; i++) { scanf("%d", &val); if(val>max) max=val; }\n    printf("%d", max);\n    return 0;\n}',
            testCases: [{ input: "4 10 50 20 5", expectedOutput: "50" }]
        },
        {
            id: 'pi_20',
            title: '20. Manipulação de Array: Inversão',
            description: 'Neste exercício, deves imprimir o conteúdo de um array de trás para a frente.\n\nInput:\nN seguido de N inteiros.\n\nOutput:\nOs inteiros na ordem inversa da leitura.\n\nDica: Faz um ciclo `for` que começa em `n-1` e vai até `0` (decrementando `i--`).',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int arr[100], n;\n    // Lê normalmente, imprime inversamente\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int arr[100], n;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) scanf("%d", &arr[i]);\n    for(int i=n-1; i>=0; i--) printf("%d ", arr[i]);\n    return 0;\n}',
            testCases: [{ input: "3 1 2 3", expectedOutput: "3 2 1 " }]
        },
        {
            id: 'pi_21',
            title: '21. Matrizes: Identidade',
            description: 'Uma matriz é um array a 2 dimensões. A matriz identidade de tamanho N tem 1s na diagonal principal e 0s no resto.\n\nTarefa:\nLê N. Imprime a matriz identidade NxN.\n\nDica: Usa dois ciclos aninhados (i para linhas, j para colunas). Se `i == j` imprime 1, senão 0.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // Loops aninhados\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) {\n        for(int j=0; j<n; j++) {\n            if(i==j) printf("1 "); else printf("0 ");\n        }\n        printf("\\n");\n    }\n    return 0;\n}',
            testCases: [{ input: "3", expectedOutput: "1 0 0 \n0 1 0 \n0 0 1 \n" }]
        },

        // --- Strings ---
        {
            id: 'pi_22',
            title: '22. Strings: Tamanho Manual',
            description: 'Em C, strings são arrays de caracteres terminados por um caractere nulo `\\0`. \n\nTarefa:\nLê uma palavra (sem espaços) para um array `char s[100]`.\nCalcula e imprime o número de caracteres da palavra **sem usar a função strlen**.\n\nDica: Percorre o array com um contador até encontrares o caractere `\\0`.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    char s[100];\n    scanf("%s", s);\n    // Loop while(s[i] != \'\\0\')\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    char s[100];\n    scanf("%s", s);\n    int i=0; while(s[i] != \'\\0\') i++;\n    printf("%d", i);\n    return 0;\n}',
            testCases: [{ input: "Ola", expectedOutput: "3" }]
        },
        {
            id: 'pi_23',
            title: '23. Processamento de Texto: Contar Vogais',
            description: 'Vamos analisar o conteúdo de uma string.\n\nTarefa:\nLê uma palavra.\nConta quantas vogais (a, e, i, o, u) ela contém, ignorando maiúsculas/minúsculas.\nImprime o total.\n\nDica: Podes converter cada char para minúscula antes de comparar.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    char s[100];\n    scanf("%s", s);\n    // Percorre e verifica se é vogal\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <ctype.h>\nint main() {\n    char s[100];\n    int c=0;\n    scanf("%s", s);\n    for(int i=0; s[i]; i++) {\n        char x = tolower(s[i]);\n        if(x==\'a\'||x==\'e\'||x==\'i\'||x==\'o\'||x==\'u\') c++;\n    }\n    printf("%d", c);\n    return 0;\n}',
            testCases: [{ input: "Banana", expectedOutput: "3" }]
        },
        {
            id: 'pi_24',
            title: '24. Palíndromos',
            description: 'Um palíndromo é uma palavra que se lê da mesma forma da esquerda para a direita e vice-versa (ex: "radar").\n\nTarefa:\nLê uma palavra.\nVerifica se é um palíndromo comparando o primeiro caractere com o último, o segundo com o penúltimo, etc.\nImprime "SIM" ou "NAO".',
            initialCode: '#include <stdio.h>\n#include <string.h>\n\nint main() {\n    char s[100];\n    scanf("%s", s);\n    // Compara s[i] com s[len-1-i]\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <string.h>\nint main() {\n    char s[100];\n    scanf("%s", s);\n    int len = strlen(s), pal=1;\n    for(int i=0; i<len/2; i++) if(s[i] != s[len-1-i]) pal=0;\n    if(pal) printf("SIM"); else printf("NAO");\n    return 0;\n}',
            testCases: [{ input: "radar", expectedOutput: "SIM" }, { input: "java", expectedOutput: "NAO" }]
        },

        // --- Algoritmos (Busca e Ordenação) ---
        {
            id: 'pi_25',
            title: '25. Busca Linear',
            description: 'A busca linear é o algoritmo mais simples para encontrar um elemento num array.\n\nInput:\n1. N e N inteiros (o array).\n2. Um inteiro X (o valor a procurar).\n\nOutput:\nO índice (começando em 0) da primeira ocorrência de X no array.\nSe X não existir, imprime -1.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int arr[100], n, x;\n    // Lê array, lê x, procura\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, x, arr[100], found=-1;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) scanf("%d", &arr[i]);\n    scanf("%d", &x);\n    for(int i=0; i<n; i++) if(arr[i]==x) { found=i; break; }\n    printf("%d", found);\n    return 0;\n}',
            testCases: [{ input: "5 10 20 30 40 50 30", expectedOutput: "2" }]
        },
        {
            id: 'pi_26',
            title: '26. Bubble Sort',
            description: 'O Bubble Sort é um algoritmo de ordenação clássico que "flutua" os maiores elementos para o fim do array através de trocas sucessivas.\n\nTarefa:\nLê N números.\nOrdena o array por ordem crescente usando o Bubble Sort.\nImprime o array ordenado.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    // Implementa dois ciclos aninhados para ordenar\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, arr[100];\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) scanf("%d", &arr[i]);\n    for(int i=0; i<n-1; i++) \n      for(int j=0; j<n-i-1; j++)\n        if(arr[j]>arr[j+1]) { int t=arr[j]; arr[j]=arr[j+1]; arr[j+1]=t; }\n    for(int i=0; i<n; i++) printf("%d ", arr[i]);\n    return 0;\n}',
            testCases: [{ input: "4 3 1 4 2", expectedOutput: "1 2 3 4 " }]
        },

        // --- Ponteiros e Memória ---
        {
            id: 'pi_27',
            title: '27. Manipulação de Ponteiros',
            description: 'Ponteiros armazenam endereços de memória. Alterar o valor apontado muda a variável original.\n\nTarefa:\n1. Declara um inteiro `x` inicializado a 10.\n2. Cria um ponteiro `ptr` que aponte para `x`.\n3. Usa **apenas o ponteiro** para alterar o valor de `x` para 20.\n4. Imprime `x` para provar que mudou.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int x = 10;\n    int *ptr = &x;\n    // Desreferencia ptr para mudar o valor\n    printf("%d", x);\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int x = 10;\n    int *ptr = &x;\n    *ptr = 20;\n    printf("%d", x);\n    return 0;\n}',
            testCases: [{ input: "", expectedOutput: "20" }]
        },
        {
            id: 'pi_28',
            title: '28. Alocação Dinâmica (malloc)',
            description: 'Quando não sabemos o tamanho do array em tempo de compilação, usamos `malloc` para pedir memória ao sistema.\n\nTarefa:\nLê N.\nAloca dinamicamente um array de N inteiros.\nPreenche com 0, 1, 2... N-1.\nImprime o array.\nLiberta a memória com `free` no final.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // int *arr = (int*)malloc(...)\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    int *arr = (int*)malloc(n * sizeof(int));\n    for(int i=0; i<n; i++) arr[i] = i;\n    for(int i=0; i<n; i++) printf("%d ", arr[i]);\n    free(arr);\n    return 0;\n}',
            testCases: [{ input: "5", expectedOutput: "0 1 2 3 4 " }]
        },

        // --- Structs e Tabelas ---
        {
            id: 'pi_29',
            title: '29. Estruturas de Dados (struct)',
            description: 'Structs permitem agrupar variáveis de tipos diferentes. Vamos criar um `Ponto` no plano 2D.\n\nTarefa:\nDefine `struct Ponto { int x, y; }`.\nLê dois pontos (x1, y1) e (x2, y2).\nSoma as coordenadas correspondentes para criar um novo ponto.\nImprime o resultado no formato "X Y".',
            initialCode: '#include <stdio.h>\n\ntypedef struct {\n    int x, y;\n} Ponto;\n\nint main() {\n    // Declara variáveis do tipo Ponto\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\ntypedef struct { int x, y; } Ponto;\n\nint main() {\n    Ponto p1, p2;\n    scanf("%d %d", &p1.x, &p1.y);\n    scanf("%d %d", &p2.x, &p2.y);\n    printf("%d %d", p1.x+p2.x, p1.y+p2.y);\n    return 0;\n}',
            testCases: [{ input: "1 2 3 4", expectedOutput: "4 6" }]
        },
        {
            id: 'pi_30',
            title: '30. Tabelas Chave-Valor (Struct Array)',
            description: 'Vamos simular uma base de dados simples de alunos.\n\nTarefa:\nDefine `struct Aluno { int nota; char nome[50]; }`.\nLê N alunos (cada linha tem "Nota Nome").\nEncontra o aluno com a maior nota.\nImprime o nome desse aluno.',
            initialCode: '#include <stdio.h>\n\ntypedef struct {\n    int nota;\n    char nome[50];\n} Aluno;\n\nint main() {\n    // O teu código aqui\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\ntypedef struct { int nota; char nome[50]; } Aluno;\n\nint main() {\n    int n; scanf("%d", &n);\n    Aluno melhor = { -1, "" };\n    Aluno temp;\n    for(int i=0; i<n; i++) {\n        scanf("%d %s", &temp.nota, temp.nome);\n        if(temp.nota > melhor.nota) melhor = temp;\n    }\n    printf("%s", melhor.nome);\n    return 0;\n}',
            testCases: [{ input: "3 15 Joao 18 Maria 12 Pedro", expectedOutput: "Maria" }]
        }
    ]
};
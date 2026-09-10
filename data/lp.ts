
import { Course } from '../types';

export const lpCourse: Course = {
    id: 'lp',
    name: 'Laboratório de Programação',
    shortName: 'LP',
    language: 'c',
    exercises: [
        // --- Estruturas e Arrays de Estruturas ---
        {
            id: 'lp_01',
            title: '1. Struct Complexo: Aritmética',
            description: 'A aritmética de números complexos é fundamental em engenharia eletrotécnica e física. Um número complexo é composto por uma parte real e uma parte imaginária.\n\n**Tarefa:**\n1. Define uma estrutura chamada `Complexo` que contenha dois campos do tipo `float`: `real` e `imag`.\n2. No `main`, lê dois números complexos da entrada. O input consiste em 4 valores: `r1 i1 r2 i2`.\n3. Calcula a soma destes dois números (soma as partes reais e as partes imaginárias separadamente).\n4. Imprime o resultado no formato matemático padrão: `R+Ri`, com exatamente 1 casa decimal.\n\nExemplo:\nInput: 2.0 3.0 1.5 2.5\nCálculo: (2.0+1.5) + (3.0+2.5)i = 3.5 + 5.5i',
            initialCode: '#include <stdio.h>\n\n// 1. Define a struct aqui\ntypedef struct {\n    float real, imag;\n} Complexo;\n\nint main() {\n    // 2. Lê os dados, soma e imprime\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\ntypedef struct { float real, imag; } Complexo;\n\nint main() {\n    Complexo a, b, s;\n    if(scanf("%f %f", &a.real, &a.imag) != 2) return 1;\n    if(scanf("%f %f", &b.real, &b.imag) != 2) return 1;\n    s.real = a.real + b.real;\n    s.imag = a.imag + b.imag;\n    printf("%.1f+%.1fi", s.real, s.imag);\n    return 0;\n}',
            testCases: [{ input: "2.0 3.0 1.5 2.5", expectedOutput: "3.5+5.5i" }]
        },
        {
            id: 'lp_02',
            title: '2. Array de Estruturas: Área Total',
            description: 'Estruturas são frequentemente usadas em arrays para representar coleções de objetos. Vamos calcular a área total ocupada por vários retângulos.\n\n**Tarefa:**\n1. Define uma struct `Retangulo` com inteiros `l` (largura) e `a` (altura).\n2. Lê um inteiro `N` que indica quantos retângulos se seguem.\n3. Lê `N` pares de inteiros, cada par representando as dimensões de um retângulo.\n4. Calcula a área individual de cada um e acumula numa variável `areaTotal`.\n5. Imprime a área total final.',
            initialCode: '#include <stdio.h>\n\ntypedef struct { int l, a; } Retangulo;\n\nint main() {\n    int n;\n    // Lê N, depois lê N retângulos e soma as áreas\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\ntypedef struct { int l, a; } Retangulo;\n\nint main() {\n    int n, areaTotal = 0;\n    Retangulo temp;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) {\n        scanf("%d %d", &temp.l, &temp.a);\n        areaTotal += (temp.l * temp.a);\n    }\n    printf("%d", areaTotal);\n    return 0;\n}',
            testCases: [{ input: "2 10 5 2 3", expectedOutput: "56" }]
        },
        {
            id: 'lp_03',
            title: '3. Filtragem de Dados em Structs',
            description: 'Muitas vezes precisamos de filtrar dados de uma base de dados simples. Vamos trabalhar com registos de alunos.\n\n**Tarefa:**\n1. Define a struct `Aluno` com `char nome[20]` e `int nota`.\n2. Lê um inteiro `N`.\n3. Lê `N` registos no formato "Nome Nota".\n4. Percorre os dados e imprime **apenas** o nome dos alunos que tiveram nota positiva (>= 10), um por linha.\n\nInput Exemplo:\n3\nAna 12\nBob 8\nZac 15\n\nOutput Esperado:\nAna\nZac',
            initialCode: '#include <stdio.h>\n\ntypedef struct { char nome[20]; int nota; } Aluno;\n\nint main() {\n    // Lê e filtra\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\ntypedef struct { char nome[20]; int nota; } Aluno;\n\nint main() {\n    int n;\n    Aluno a;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) {\n        scanf("%s %d", a.nome, &a.nota);\n        if(a.nota >= 10) printf("%s\\n", a.nome);\n    }\n    return 0;\n}',
            testCases: [{ input: "3 Ana 12 Bob 8 Zac 15", expectedOutput: "Ana\nZac\n" }]
        },

        // --- Alocação Dinâmica e Pilha de Execução ---
        {
            id: 'lp_04',
            title: '4. Alocação Dinâmica: Vetor Básico',
            description: 'Arrays estáticos (ex: `int v[100]`) são alocados na Stack e têm tamanho fixo. Para tamanhos variáveis ou grandes, usamos a Heap com `malloc`.\n\n**Tarefa:**\n1. Lê um inteiro `N`.\n2. Usa `malloc` para alocar dinamicamente um array de inteiros com capacidade para `N` elementos.\n3. Preenche o array com a sequência 0, 1, 2, ..., N-1.\n4. Imprime o array.\n5. **Importante:** Usa `free()` para libertar a memória no final. Em sistemas reais, esquecer o free causa memory leaks.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    // int *v = ...\n    // free(v);\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    int n; scanf("%d", &n);\n    int *v = malloc(n * sizeof(int));\n    for(int i=0; i<n; i++) v[i] = i;\n    for(int i=0; i<n; i++) printf("%d ", v[i]);\n    free(v);\n    return 0;\n}',
            testCases: [{ input: "5", expectedOutput: "0 1 2 3 4 " }]
        },
        {
            id: 'lp_05',
            title: '5. Implementação de strdup',
            description: 'A função `strdup` (string duplicate) não faz parte do padrão ANSI C original, mas é muito comum. Vamos implementá-la manualmente.\n\n**Tarefa:**\n1. Implementa a função `char* meu_strdup(char* s)`.\n2. Esta função deve calcular o tamanho de `s`, alocar memória suficiente na Heap (não esquecer o `+1` para o terminador `\\0`) e copiar o conteúdo de `s` para a nova memória.\n3. No `main`, lê uma palavra, duplica-a usando a tua função, imprime a cópia e liberta a memória.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nchar* meu_strdup(char* s) {\n    // 1. Malloc\n    // 2. Strcpy\n    // 3. Return\n}\n\nint main() {\n    char s[50]; scanf("%s", s);\n    char* copia = meu_strdup(s);\n    printf("%s", copia);\n    free(copia);\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nchar* meu_strdup(char* s) {\n    char* d = malloc(strlen(s) + 1);\n    if(d) strcpy(d, s);\n    return d;\n}\n\nint main() {\n    char s[50]; scanf("%s", s);\n    char* copia = meu_strdup(s);\n    printf("%s", copia);\n    free(copia);\n    return 0;\n}',
            testCases: [{ input: "teste", expectedOutput: "teste" }]
        },
        {
            id: 'lp_06',
            title: '6. Concatenação de Strings Dinâmica',
            description: 'Ao concatenar strings em C, o buffer de destino deve ter espaço suficiente. Com memória dinâmica, podemos alocar o tamanho exato necessário.\n\n**Tarefa:**\n1. Lê duas strings `s1` e `s2` (max 50 chars cada).\n2. Aloca dinamicamente uma nova string `res` com tamanho `strlen(s1) + strlen(s2) + 1`.\n3. Copia `s1` para `res` e concatena `s2`.\n4. Imprime o resultado e liberta a memória.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    char s1[50], s2[50];\n    scanf("%s %s", s1, s2);\n    // char *res = ...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    char s1[50], s2[50];\n    scanf("%s %s", s1, s2);\n    char *res = malloc(strlen(s1) + strlen(s2) + 1);\n    strcpy(res, s1);\n    strcat(res, s2);\n    printf("%s", res);\n    free(res);\n    return 0;\n}',
            testCases: [{ input: "Ola Mundo", expectedOutput: "OlaMundo" }]
        },

        // --- Arrays a 2 Dimensões (Matrizes) ---
        {
            id: 'lp_07',
            title: '7. Matrizes: Verificação de Simetria',
            description: 'Uma matriz quadrada é simétrica se `A[i][j] == A[j][i]` para todo o `i, j`.\n\n**Tarefa:**\n1. Lê a dimensão `N` da matriz.\n2. Lê os `N*N` elementos da matriz para um array bidimensional.\n3. Verifica se a matriz é simétrica.\n4. Imprime "SIM" ou "NAO".\n\nDica: Podes interromper a verificação assim que encontrares um par diferente.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n, m[10][10];\n    scanf("%d", &n);\n    // Lê matriz e verifica simetria\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, m[10][10], sim = 1;\n    scanf("%d", &n);\n    for(int i=0;i<n;i++) for(int j=0;j<n;j++) scanf("%d", &m[i][j]);\n    for(int i=0;i<n;i++) for(int j=0;j<n;j++) if(m[i][j] != m[j][i]) sim = 0;\n    printf("%s", sim ? "SIM" : "NAO");\n    return 0;\n}',
            testCases: [{ input: "2 1 2 2 1", expectedOutput: "SIM" }, { input: "2 1 2 3 1", expectedOutput: "NAO" }]
        },
        {
            id: 'lp_08',
            title: '8. Operações Matriciais: Soma de Linhas',
            description: 'Vamos processar dados em grelha. \n\n**Tarefa:**\n1. Lê `N`.\n2. Lê uma matriz `N x N`.\n3. Para cada linha da matriz, calcula a soma de todos os seus elementos.\n4. Imprime as somas de cada linha, separadas por espaço.\n\nExemplo:\nMatriz:\n1 2\n3 4\nOutput: 3 7',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n, m[10][10];\n    //...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, val;\n    scanf("%d", &n);\n    for(int i=0; i<n; i++) {\n        int soma = 0;\n        for(int j=0; j<n; j++) {\n            scanf("%d", &val);\n            soma += val;\n        }\n        printf("%d ", soma);\n    }\n    return 0;\n}',
            testCases: [{ input: "2 1 2 3 4", expectedOutput: "3 7 " }]
        },
        {
            id: 'lp_09',
            title: '9. Rotação de Matriz (90 Graus)',
            description: 'Manipulação de índices 2D. Vamos rodar uma imagem (matriz) 90 graus no sentido dos ponteiros do relógio.\n\n**Tarefa:**\n1. Lê `N` e a matriz `M`.\n2. Cria/Imprime uma nova matriz onde a primeira linha de M passa a ser a última coluna da nova matriz.\n\nFórmula de transformação:\n`Novo[j][N-1-i] = Original[i][j]`',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int n, m[10][10], res[10][10];\n    scanf("%d", &n);\n    // Lê e roda\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int n, m[10][10], res[10][10];\n    scanf("%d", &n);\n    for(int i=0;i<n;i++) for(int j=0;j<n;j++) scanf("%d", &m[i][j]);\n    for(int i=0;i<n;i++) for(int j=0;j<n;j++) res[j][n-1-i] = m[i][j];\n    for(int i=0;i<n;i++) { for(int j=0;j<n;j++) printf("%d ", res[i][j]); printf("\\n"); }\n    return 0;\n}',
            testCases: [{ input: "2 1 2 3 4", expectedOutput: "3 1 \n4 2 \n" }]
        },

        // --- Arrays Dinâmicos de Cadeias de Caracteres ---
        {
            id: 'lp_10',
            title: '10. Array de Strings (char**)',
            description: 'Um array de strings em C é tipicamente um `char**` (ponteiro para ponteiro de char), onde cada linha é alocada individualmente.\n\n**Tarefa:**\n1. Lê `N`.\n2. Aloca um array de ponteiros `char **lista` de tamanho `N`.\n3. Para cada posição, aloca espaço para uma palavra e copia o input.\n4. Imprime as palavras na ordem inversa à leitura.\n5. **Desafio:** Liberta toda a memória (primeiro cada string, depois o array principal).',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    char **lista = malloc(n * sizeof(char*));\n    //...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    char **lista = malloc(n * sizeof(char*));\n    char buffer[100];\n    for(int i=0; i<n; i++) {\n        scanf("%s", buffer);\n        lista[i] = malloc(strlen(buffer)+1);\n        strcpy(lista[i], buffer);\n    }\n    for(int i=n-1; i>=0; i--) {\n        printf("%s\\n", lista[i]);\n        free(lista[i]);\n    }\n    free(lista);\n    return 0;\n}',
            testCases: [{ input: "2 Ana Bob", expectedOutput: "Bob\nAna\n" }]
        },
        {
            id: 'lp_11',
            title: '11. Ordenação de Strings',
            description: 'Vamos ordenar alfabeticamente uma lista de nomes.\n\n**Tarefa:**\n1. Lê `N` nomes para um array dinâmico `char**`.\n2. Usa um algoritmo de ordenação (ex: Bubble Sort) para ordenar o array.\n3. **Atenção:** Ao trocar elementos, troca apenas os ponteiros `char*`, não copies o conteúdo das strings.\n4. Usa `strcmp(s1, s2) > 0` para comparar.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    // Lê, Ordena trocando ponteiros, Imprime\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n\nint main() {\n    int n; scanf("%d", &n);\n    char **lista = malloc(n * sizeof(char*));\n    char buffer[100];\n    for(int i=0; i<n; i++) { scanf("%s", buffer); lista[i] = strdup(buffer); }\n    for(int i=0; i<n-1; i++)\n        for(int j=0; j<n-i-1; j++)\n            if(strcmp(lista[j], lista[j+1]) > 0) {\n                char *t = lista[j]; lista[j] = lista[j+1]; lista[j+1] = t;\n            }\n    for(int i=0; i<n; i++) printf("%s ", lista[i]);\n    return 0;\n}',
            testCases: [{ input: "3 Zac Ana Bob", expectedOutput: "Ana Bob Zac " }]
        },

        // --- Listas Ligadas (Simples) ---
        {
            id: 'lp_12',
            title: '12. Listas Ligadas: Inserção na Cauda',
            description: 'Arrays têm tamanho fixo. Listas ligadas crescem dinamicamente. Cada nó contém o valor e um ponteiro para o próximo.\n\n**Tarefa:**\n1. Define `struct Node { int v; struct Node *next; }`.\n2. Implementa `Node* insereFim(Node* head, int v)`.\n3. Se a lista estiver vazia, retorna o novo nó.\n4. Se não, percorre até ao último nó (`temp->next == NULL`) e liga o novo nó.\n5. No main, lê N valores, insere-os e imprime a lista.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct Node { int v; struct Node *next; } Node;\n\nNode* insereFim(Node* head, int v) {\n    // Implementa inserção\n}\n\nint main() {\n    // Lê N e cria lista\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\ntypedef struct Node { int v; struct Node *next; } Node;\n\nNode* insereFim(Node* head, int v) {\n    Node* novo = malloc(sizeof(Node));\n    novo->v = v; novo->next = NULL;\n    if(!head) return novo;\n    Node* temp = head;\n    while(temp->next) temp = temp->next;\n    temp->next = novo;\n    return head;\n}\n\nint main() {\n    int n, v; scanf("%d", &n);\n    Node* head = NULL;\n    for(int i=0; i<n; i++) { scanf("%d", &v); head = insereFim(head, v); }\n    while(head) { printf("%d ", head->v); head = head->next; }\n    return 0;\n}',
            testCases: [{ input: "3 10 20 30", expectedOutput: "10 20 30 " }]
        },
        {
            id: 'lp_13',
            title: '13. Listas Ligadas: Contagem',
            description: 'Percorrer uma lista é uma operação fundamental.\n\n**Tarefa:**\n1. Cria uma função `int length(Node* head)`.\n2. A função deve percorrer a lista contando quantos nós existem até encontrar `NULL`.\n3. Retorna o total.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\ntypedef struct Node { int v; struct Node *next; } Node;\n\nint length(Node* head) {\n    //...\n}\n\nint main() {\n    // Constrói lista e testa\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\ntypedef struct Node { int v; struct Node *next; } Node;\n\nint length(Node* head) {\n    int c=0; while(head){ c++; head=head->next; } return c;\n}\n\nint main() {\n    int n, v; scanf("%d", &n);\n    Node *head=NULL, *tail=NULL;\n    for(int i=0; i<n; i++) {\n        scanf("%d", &v);\n        Node* novo = malloc(sizeof(Node)); novo->v=v; novo->next=NULL;\n        if(!head) head=tail=novo; else { tail->next=novo; tail=novo; }\n    }\n    printf("%d", length(head));\n    return 0;\n}',
            testCases: [{ input: "4 1 2 3 4", expectedOutput: "4" }]
        },
        {
            id: 'lp_14',
            title: '14. Listas Ligadas: Remoção',
            description: 'Remover um nó exige "coser" a lista: o anterior deve passar a apontar para o seguinte do nó removido.\n\n**Tarefa:**\n1. Implementa `Node* removeVal(Node* head, int x)`.\n2. Remove a **primeira** ocorrência de `x` na lista.\n3. Trata os casos especiais:\n   - Lista vazia.\n   - Remover a cabeça (o head muda!).\n   - Elemento no meio ou fim.\n4. Não esqueças de fazer `free` ao nó removido.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n// struct Node...\nNode* removeVal(Node* head, int x) {\n    // Tratar casos\n}\nint main() { ... }',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\ntypedef struct Node { int v; struct Node *next; } Node;\n\nNode* removeVal(Node* head, int x) {\n    if(!head) return NULL;\n    if(head->v == x) { Node* temp=head->next; free(head); return temp; }\n    Node* curr = head;\n    while(curr->next && curr->next->v != x) curr = curr->next;\n    if(curr->next) {\n        Node* lixo = curr->next;\n        curr->next = lixo->next;\n        free(lixo);\n    }\n    return head;\n}\n\nint main() {\n    int n, v, x; scanf("%d", &n);\n    Node *head=NULL, *tail=NULL;\n    for(int i=0; i<n; i++) {\n        scanf("%d", &v);\n        Node* novo = malloc(sizeof(Node)); novo->v=v; novo->next=NULL;\n        if(!head) head=tail=novo; else { tail->next=novo; tail=novo; }\n    }\n    scanf("%d", &x);\n    head = removeVal(head, x);\n    while(head) { printf("%d ", head->v); head=head->next; }\n    return 0;\n}',
            testCases: [{ input: "5 1 2 3 4 5 3", expectedOutput: "1 2 4 5 " }]
        },
        {
            id: 'lp_15',
            title: '15. Gestão de Memória: Libertar Lista',
            description: 'Quando o programa termina, ou a lista deixa de ser necessária, temos de devolver a memória à Heap.\n\n**Tarefa:**\n1. Implementa `void freeList(Node* head)`.\n2. Percorre a lista libertando cada nó.\n3. **Cuidado:** Não podes fazer `free(curr)` e depois tentar aceder a `curr->next`. Guarda o `next` numa variável temporária antes de libertar o nó atual.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n//...\nvoid freeList(Node* head) {\n    //...\n}\nint main() { ... printf("OK"); return 0; }',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\ntypedef struct Node { int v; struct Node *next; } Node;\n\nvoid freeList(Node* head) {\n    Node* temp;\n    while(head) { temp=head; head=head->next; free(temp); }\n}\n\nint main() {\n    Node* head = malloc(sizeof(Node)); head->next = malloc(sizeof(Node)); head->next->next = NULL;\n    freeList(head);\n    printf("OK");\n    return 0;\n}',
            testCases: [{ input: "", expectedOutput: "OK" }]
        },

        // --- Procedimentos de Ordem Superior (Ponteiros para Funções) ---
        {
            id: 'lp_16',
            title: '16. Higher-Order Functions: Map',
            description: 'Em C, podemos passar funções como argumentos. Isto permite criar algoritmos genéricos.\n\n**Tarefa:**\n1. Cria uma função `void map(int v[], int n, int (*func)(int))`.\n2. Esta função deve aplicar `func` a todos os elementos do array `v`, alterando-os.\n3. Cria uma função auxiliar `int quadrado(int x)`.\n4. Usa o `map` para elevar todos os elementos de um array ao quadrado.',
            initialCode: '#include <stdio.h>\n\n// Definição do map\nvoid map(int v[], int n, int (*func)(int)) {\n    //...\n}\n\nint quadrado(int x) { return x*x; }\n\nint main() {\n    int v[] = {1, 2, 3};\n    map(v, 3, quadrado);\n    // Imprime v\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nvoid map(int v[], int n, int (*func)(int)) {\n    for(int i=0; i<n; i++) v[i] = func(v[i]);\n}\nint quadrado(int x) { return x*x; }\nint main() {\n    int v[3]; for(int i=0;i<3;i++) scanf("%d",&v[i]);\n    map(v, 3, quadrado);\n    for(int i=0;i<3;i++) printf("%d ", v[i]);\n    return 0;\n}',
            testCases: [{ input: "2 3 4", expectedOutput: "4 9 16 " }]
        },
        {
            id: 'lp_17',
            title: '17. Qsort: Ordenação Genérica',
            description: 'A função `qsort` da biblioteca padrão usa ponteiros de função para saber como comparar elementos.\n\n**Tarefa:**\n1. Implementa a função de comparação `int compara(const void* a, const void* b)`.\n2. Lembra-te de fazer cast dos ponteiros `void*` para `int*` antes de aceder aos valores.\n3. Retorna negativo se `*a < *b`, positivo se `*a > *b`, ou 0 se iguais.\n4. Usa `qsort` para ordenar um array de inteiros lido do input.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint compara(const void* a, const void* b) {\n    // cast para int* e subtrai\n}\n\nint main() {\n    int v[5];\n    // Lê valores, chama qsort, imprime\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint compara(const void* a, const void* b) {\n    return (*(int*)a - *(int*)b);\n}\n\nint main() {\n    int v[5]; for(int i=0;i<5;i++) scanf("%d", &v[i]);\n    qsort(v, 5, sizeof(int), compara);\n    for(int i=0;i<5;i++) printf("%d ", v[i]);\n    return 0;\n}',
            testCases: [{ input: "10 2 8 5 1", expectedOutput: "1 2 5 8 10 " }]
        },
        {
            id: 'lp_18',
            title: '18. Calculadora Genérica',
            description: 'Vamos criar uma função que recebe dois números e uma operação a executar sobre eles.\n\n**Tarefa:**\n1. Define funções `soma` e `sub`.\n2. Define `int opera(int a, int b, int (*op)(int, int))` que executa `op(a, b)`.\n3. No main, lê dois números e imprime o resultado de chamar `opera` com `soma` e depois com `sub`.',
            initialCode: '#include <stdio.h>\n\nint soma(int a, int b) { return a+b; }\nint sub(int a, int b) { return a-b; }\nint opera(int a, int b, int (*op)(int, int)) {\n    //...\n}\nint main() { ... }',
            solutionCode: '#include <stdio.h>\nint soma(int a, int b) { return a+b; }\nint sub(int a, int b) { return a-b; }\nint opera(int a, int b, int (*op)(int, int)) { return op(a, b); }\nint main() {\n    int a, b; scanf("%d %d", &a, &b);\n    printf("%d %d", opera(a, b, soma), opera(a, b, sub));\n    return 0;\n}',
            testCases: [{ input: "10 5", expectedOutput: "15 5" }]
        },

        // --- Programação Dinâmica (Intro) e Recursão ---
        {
            id: 'lp_19',
            title: '19. Fibonacci com Memoization',
            description: 'A recursão simples para Fibonacci é ineficiente (O(2^N)). A programação dinâmica resolve isto guardando os resultados já calculados.\n\n**Tarefa:**\n1. Declara um array global `memo[100]` inicializado com -1.\n2. Implementa `fib(n)`.\n3. Antes de calcular, verifica se `memo[n]` já tem um valor válido (!= -1). Se sim, retorna-o imediatamente.\n4. Se não, calcula, guarda em `memo[n]` e retorna.',
            initialCode: '#include <stdio.h>\n\nint memo[100]; // Inicia com -1 no main\n\nint fib(int n) {\n    if(n<=1) return n;\n    // Lógica de memoization\n}\n\nint main() { ... }',
            solutionCode: '#include <stdio.h>\n\nint memo[100];\n\nint fib(int n) {\n    if(n<=1) return n;\n    if(memo[n] != -1) return memo[n];\n    return memo[n] = fib(n-1) + fib(n-2);\n}\n\nint main() {\n    for(int i=0; i<100; i++) memo[i] = -1;\n    int n; scanf("%d", &n);\n    printf("%d", fib(n));\n    return 0;\n}',
            testCases: [{ input: "10", expectedOutput: "55" }]
        },
        {
            id: 'lp_20',
            title: '20. Problema do Troco (Algoritmo Guloso)',
            description: 'Dado um valor `V` e moedas de {20, 10, 5, 1}, queremos dar o troco com o menor número de moedas possível.\n\n**Tarefa:**\n1. Para este conjunto de moedas, a estratégia gulosa (escolher sempre a maior moeda possível) funciona.\n2. Lê `V`.\n3. Iterativamente subtrai a maior moeda possível de `V` e incrementa o contador de moedas.\n4. Imprime o total de moedas.',
            initialCode: '#include <stdio.h>\n\nint main() {\n    int v; scanf("%d", &v);\n    //...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n\nint main() {\n    int v, count=0;\n    scanf("%d", &v);\n    int moedas[] = {20, 10, 5, 1};\n    for(int i=0; i<4; i++) {\n        count += v / moedas[i];\n        v %= moedas[i];\n    }\n    printf("%d", count);\n    return 0;\n}',
            testCases: [{ input: "26", expectedOutput: "3" }]
        },
        
        // --- Depuração e Lógica (Simulando GDB Tasks) ---
        {
            id: 'lp_21',
            title: '21. Debug: Buffer Overflow',
            description: 'O código fornecido tenta aceder a um índice inválido do array, causando comportamento indefinido ou crash (Segfault).\n\n**Tarefa:**\nAnalisa o ciclo `for` e corrige a condição de paragem para evitar sair dos limites do array `v[5]`.',
            initialCode: '#include <stdio.h>\nint main() {\n    int v[5];\n    // Erro aqui: i vai de 0 a 5 (6 elementos!)\n    for(int i=0; i<=5; i++) v[i] = i;\n    printf("Fim");\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\nint main() {\n    int v[5];\n    for(int i=0; i<5; i++) v[i] = i;\n    printf("Fim");\n    return 0;\n}',
            testCases: [{ input: "", expectedOutput: "Fim" }]
        },
        {
            id: 'lp_22',
            title: '22. Debug: Ponteiro Não Inicializado',
            description: 'Um ponteiro deve apontar para um endereço válido antes de ser desreferenciado (`*p = ...`).\n\n**Tarefa:**\nO código abaixo crasha. Corrige-o fazendo `p` apontar para uma variável válida `val` antes da atribuição.',
            initialCode: '#include <stdio.h>\nint main() {\n    int *p;\n    *p = 10; // CRASH! p tem lixo\n    printf("%d", *p);\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\nint main() {\n    int val;\n    int *p = &val;\n    *p = 10;\n    printf("%d", *p);\n    return 0;\n}',
            testCases: [{ input: "", expectedOutput: "10" }]
        },
        
        // --- Mais Exercícios Variados ---
        {
            id: 'lp_23',
            title: '23. Merge de Listas Ligadas',
            description: 'Dadas duas listas ligadas `l1` e `l2` **já ordenadas**.\n\n**Tarefa:**\nImplementa `Node* merge(Node* l1, Node* l2)` que funde as duas listas numa única lista ordenada.\n**Requisito:** Não alocar novos nós. Apenas ajusta os ponteiros `next` dos nós existentes.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n// struct Node...\nNode* merge(Node* l1, Node* l2) { ... }\nint main() { ... }',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\ntypedef struct Node { int v; struct Node *next; } Node;\nNode* novo(int v) { Node* n=malloc(sizeof(Node)); n->v=v; n->next=NULL; return n; }\nNode* merge(Node* l1, Node* l2) {\n    if(!l1) return l2; if(!l2) return l1;\n    if(l1->v < l2->v) { l1->next = merge(l1->next, l2); return l1; }\n    else { l2->next = merge(l1, l2->next); return l2; }\n}\nint main() {\n    Node *l1 = novo(1); l1->next = novo(3);\n    Node *l2 = novo(2); l2->next = novo(4);\n    Node *res = merge(l1, l2);\n    while(res) { printf("%d ", res->v); res=res->next; }\n    return 0;\n}',
            testCases: [{ input: "", expectedOutput: "1 2 3 4 " }]
        },
        {
            id: 'lp_24',
            title: '24. Processamento de Texto: Contar Palavras',
            description: 'Lê uma linha inteira de texto. Conta quantas palavras existem (sequências de caracteres separadas por espaços ou tabs).\n\n**Dica:** Usa uma flag `inWord` para saber se estás dentro de uma palavra e detetar transições de espaço->caractere.',
            initialCode: '#include <stdio.h>\n#include <ctype.h>\n\nint main() {\n    char s[100];\n    scanf("%[^\\n]", s);\n    //...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <ctype.h>\nint main() {\n    char s[100];\n    if(scanf("%[^\\n]", s) != 1) { printf("0"); return 0; }\n    int count=0, inWord=0;\n    for(int i=0; s[i]; i++) {\n        if(!isspace(s[i]) && !inWord) { inWord=1; count++; }\n        else if(isspace(s[i])) inWord=0;\n    }\n    printf("%d", count);\n    return 0;\n}',
            testCases: [{ input: "ola  mundo teste", expectedOutput: "3" }]
        },
        {
            id: 'lp_25',
            title: '25. Estrutura de Dados: Stack (Pilha)',
            description: 'Implementa uma Pilha (LIFO - Last In, First Out) usando um array estático `stack[100]` e um índice `top`.\n\n**Tarefa:**\nImplementa `void push(int)` e `int pop()`.\nNo main, faz: push(1), push(2), print(pop), print(pop). Output esperado: 2 1.',
            initialCode: '#include <stdio.h>\nint stack[100], top=0;\nvoid push(int v) { ... }\nint pop() { ... }\nint main() { push(1); push(2); printf("%d %d", pop(), pop()); return 0; }',
            solutionCode: '#include <stdio.h>\nint stack[100], top=0;\nvoid push(int v) { stack[top++] = v; }\nint pop() { return stack[--top]; }\nint main() { push(1); push(2); printf("%d %d", pop(), pop()); return 0; }',
            testCases: [{ input: "", expectedOutput: "2 1" }]
        },
        {
            id: 'lp_26',
            title: '26. Estrutura de Dados: Queue (Fila)',
            description: 'Implementa uma Fila (FIFO - First In, First Out) usando uma Lista Ligada.\n\n**Tarefa:**\nMantém ponteiros `head` (início) e `tail` (fim).\n`enqueue`: Insere no `tail`.\n`dequeue`: Remove do `head`.\nTesta com: enqueue(10), enqueue(20), dequeue(), dequeue().',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n// struct Node, head, tail...\nvoid enqueue(int v) { ... }\nint dequeue() { ... }\nint main() { ... }',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\ntypedef struct Node { int v; struct Node *next; } Node;\nNode *head=NULL, *tail=NULL;\nvoid enqueue(int v) {\n    Node* n=malloc(sizeof(Node)); n->v=v; n->next=NULL;\n    if(!tail) head=tail=n; else { tail->next=n; tail=n; }\n}\nint dequeue() {\n    if(!head) return -1;\n    int v = head->v; Node* t=head; head=head->next; if(!head) tail=NULL; free(t);\n    return v;\n}\nint main() { enqueue(10); enqueue(20); printf("%d %d", dequeue(), dequeue()); return 0; }',
            testCases: [{ input: "", expectedOutput: "10 20" }]
        },
        {
            id: 'lp_27',
            title: '27. Matriz Dinâmica e Calloc',
            description: 'Usa `calloc` (que inicializa a memória a zeros) para criar uma matriz.\n\n**Tarefa:**\n1. Lê `N`.\n2. Aloca uma matriz `N x N` dinamicamente (ponteiro para ponteiros).\n3. Usa `calloc` para as linhas.\n4. Define a diagonal principal como 1 (Matriz Identidade).\n5. Imprime e liberta.',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    // int **m = malloc...\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\nint main() {\n    int n; scanf("%d", &n);\n    int **m = malloc(n*sizeof(int*));\n    for(int i=0;i<n;i++) m[i] = calloc(n, sizeof(int));\n    for(int i=0;i<n;i++) m[i][i] = 1;\n    for(int i=0;i<n;i++) { for(int j=0;j<n;j++) printf("%d ", m[i][j]); printf("\\n"); free(m[i]); }\n    free(m);\n    return 0;\n}',
            testCases: [{ input: "2", expectedOutput: "1 0 \n0 1 \n" }]
        },
        {
            id: 'lp_28',
            title: '28. Busca Sequencial Recursiva',
            description: 'A recursão pode substituir qualquer ciclo.\n\n**Tarefa:**\nImplementa `int busca(int v[], int n, int k)` que procura o valor `k` no array `v` de tamanho `n`.\nSe encontrar, retorna 1. Se `n == 0`, retorna 0.\nNão uses ciclos `for` ou `while`.',
            initialCode: '#include <stdio.h>\nint busca(int v[], int n, int k) {\n    // Caso base: n==0 -> nao encontrou\n    // Caso base: v[n-1] == k -> encontrou\n    // Passo recursivo: busca no resto\n}\nint main() { ... }',
            solutionCode: '#include <stdio.h>\nint busca(int v[], int n, int k) {\n    if(n==0) return 0;\n    if(v[n-1]==k) return 1;\n    return busca(v, n-1, k);\n}\nint main() { int v[]={1,2,3}; printf("%d", busca(v,3,2)); return 0; }',
            testCases: [{ input: "", expectedOutput: "1" }]
        },
        {
            id: 'lp_29',
            title: '29. Inversão de Lista Ligada',
            description: 'Um clássico de entrevistas técnicas.\n\n**Tarefa:**\nImplementa `Node* reverse(Node* head)` que inverte a direção de todos os ponteiros da lista, retornando a nova cabeça.\nDeve ser feito in-place (sem alocar novos nós), usando três ponteiros auxiliares (prev, curr, next).',
            initialCode: '#include <stdio.h>\n#include <stdlib.h>\n// Node...\nNode* reverse(Node* head) { ... }\nint main() { ... }',
            solutionCode: '#include <stdio.h>\n#include <stdlib.h>\ntypedef struct Node { int v; struct Node *next; } Node;\nNode* reverse(Node* head) {\n    Node *prev=NULL, *curr=head, *next;\n    while(curr) { next=curr->next; curr->next=prev; prev=curr; curr=next; }\n    return prev;\n}\nint main() {\n    Node *h=malloc(sizeof(Node)); h->v=1; h->next=malloc(sizeof(Node)); h->next->v=2; h->next->next=NULL;\n    h = reverse(h);\n    printf("%d %d", h->v, h->next->v);\n    return 0;\n}',
            testCases: [{ input: "", expectedOutput: "2 1" }]
        },
        {
            id: 'lp_30',
            title: '30. Maior Subsequência Crescente (Versão Simplificada)',
            description: 'Dado um array de inteiros, encontra o comprimento do maior segmento **contíguo** que esteja ordenado crescentemente.\n\nExemplo: 1 2 5 3 4\nSegmentos crescentes: "1 2 5" (tam 3) e "3 4" (tam 2).\nResposta: 3.',
            initialCode: '#include <stdio.h>\nint main() {\n    // Percorre e conta run atual vs maximo\n    return 0;\n}',
            solutionCode: '#include <stdio.h>\nint main() {\n    int n, v[100]; scanf("%d", &n);\n    for(int i=0;i<n;i++) scanf("%d", &v[i]);\n    int max=0, curr=0;\n    for(int i=0;i<n;i++) {\n        if(i==0 || v[i] > v[i-1]) curr++;\n        else curr=1;\n        if(curr>max) max=curr;\n    }\n    printf("%d", max);\n    return 0;\n}',
            testCases: [{ input: "5 1 2 5 3 4", expectedOutput: "3" }]
        }
    ]
};

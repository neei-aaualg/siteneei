
import { Course } from '../types';

export const aedCourse: Course = {
    id: 'aed',
    name: 'Algoritmos e Estruturas de Dados 1',
    shortName: 'AED 1',
    language: 'java',
    exercises: [
        // --- Introdução ao Java ---
        {
            id: 'aed1_01',
            title: '1. Olá Java',
            description: 'Bem-vindo à disciplina de Algoritmos e Estruturas de Dados! O Java é uma linguagem Orientada a Objetos, o que significa que todo o código deve residir dentro de uma classe.\n\n**Tarefa:**\nEscreve um programa completo que imprima a mensagem "Ola Mundo" na consola.\n\n**Requisitos:**\n1. A tua classe principal deve chamar-se obrigatoriamente `Main`.\n2. O método de entrada deve ser `public static void main(String[] args)`.\n3. Usa `System.out.println` para imprimir.',
            initialCode: 'public class Main {\n    public static void main(String[] args) {\n        // O teu código aqui\n    }\n}',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Ola Mundo");\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Ola Mundo" }]
        },
        {
            id: 'aed1_02',
            title: '2. Entrada de Dados (Scanner)',
            description: 'Para ler dados do teclado em Java, utilizamos frequentemente a classe `java.util.Scanner`.\n\n**Tarefa:**\n1. Importa a classe Scanner.\n2. Cria um objeto Scanner associado ao `System.in`.\n3. Lê dois números inteiros da entrada.\n4. Imprime a soma desses dois números.\n\n**Nota:** Lembra-te que em Java deves lidar com tipos explicitamente (int).',
            initialCode: 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // int a = sc.nextInt();\n        // ...\n    }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(a + b);\n        }\n    }\n}',
            testCases: [{ input: "10 20", expectedOutput: "30" }]
        },
        {
            id: 'aed1_03',
            title: '3. Formatação de Output',
            description: 'Muitas vezes precisamos de formatar a saída, especialmente quando lidamos com números reais (double/float) e dinheiro.\n\n**Tarefa:**\n1. Lê um número real `r` que representa o raio de um círculo.\n2. Calcula a área do círculo usando a constante `Math.PI` e a fórmula $Area = \\pi \\times r^2$.\n3. Imprime o resultado formatado com **exatamente 2 casas decimais**.\n\n**Dica:** Usa `System.out.printf("%.2f", valor)` para formatar.',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        // Usa Math.PI e printf("%.2f")\n    }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        double r = sc.nextDouble();\n        System.out.printf("%.2f", Math.PI * r * r);\n    }\n}',
            testCases: [{ input: "5", expectedOutput: "78.54" }]
        },
        
        // --- Arrays e Loops em Java ---
        {
            id: 'aed1_04',
            title: '4. Arrays em Java',
            description: 'Arrays em Java são objetos. Têm um tamanho fixo definido na criação e propriedade `.length`.\n\n**Tarefa:**\n1. Lê um inteiro `N` que define o tamanho do array.\n2. Cria um array de inteiros (`new int[N]`).\n3. Lê `N` inteiros e guarda-os no array.\n4. Imprime os elementos pela ordem **inversa** da leitura, separados por espaço.',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        // int[] arr = ...\n    }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i=0; i<n; i++) arr[i] = sc.nextInt();\n        for(int i=n-1; i>=0; i--) System.out.print(arr[i] + " ");\n    }\n}',
            testCases: [{ input: "3 10 20 30", expectedOutput: "30 20 10 " }]
        },
        {
            id: 'aed1_05',
            title: '5. O For-Each Loop',
            description: 'O Java introduziu o "Enhanced For-Loop" (for-each) para simplificar a iteração sobre coleções e arrays.\n\n**Tarefa:**\n1. Lê `N` e de seguida `N` inteiros para um array.\n2. Calcula a soma de todos os elementos usando **exclusivamente** a sintaxe `for (int valor : array)`.\n3. Imprime a soma total.',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        //...\n    }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] arr = new int[n];\n        for(int i=0; i<n; i++) arr[i] = sc.nextInt();\n        int sum = 0;\n        for(int x : arr) sum += x;\n        System.out.println(sum);\n    }\n}',
            testCases: [{ input: "3 1 2 3", expectedOutput: "6" }]
        },

        // --- Programação com Classes (OOP) ---
        {
            id: 'aed1_06',
            title: '6. A Classe Ponto',
            description: 'Vamos praticar a criação de classes simples para representar dados estruturados.\n\n**Tarefa:**\n1. Dentro da classe `Main`, define uma classe estática aninhada chamada `Ponto`.\n2. Esta classe deve ter dois atributos inteiros: `x` e `y`.\n3. Implementa um construtor `Ponto(int x, int y)`.\n4. Sobrescreve o método `toString()` para retornar uma string no formato `"(x,y)"`.\n5. No main, lê dois inteiros, cria um objeto Ponto e imprime-o (o Java chama o `toString` automaticamente).',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    static class Ponto {\n        // Atributos, Construtor e toString\n    }\n    public static void main(String[] args) {\n        //...\n    }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    static class Ponto {\n        int x, y;\n        public Ponto(int x, int y) { this.x = x; this.y = y; }\n        public String toString() { return "(" + x + "," + y + ")"; }\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Ponto p = new Ponto(sc.nextInt(), sc.nextInt());\n        System.out.println(p.toString());\n    }\n}',
            testCases: [{ input: "10 20", expectedOutput: "(10,20)" }]
        },
        {
            id: 'aed1_07',
            title: '7. Encapsulamento',
            description: 'Um dos pilares da POO. Os dados devem estar protegidos (`private`) e ser acedidos via métodos (`public`).\n\n**Tarefa:**\n1. Cria uma classe `Retangulo` com atributos privados `largura` e `altura`.\n2. Cria um método público `setDimensoes(int w, int h)`.\n3. Cria um método público `getArea()` que retorna a área.\n4. No main, lê dois valores, configura o retângulo e imprime a sua área.',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    static class Retangulo {\n        // private w, h\n        // set, getArea\n    }\n    public static void main(String[] args) { ... }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    static class Retangulo {\n        private int w, h;\n        public void set(int w, int h) { this.w = w; this.h = h; }\n        public int getArea() { return w * h; }\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Retangulo r = new Retangulo();\n        r.set(sc.nextInt(), sc.nextInt());\n        System.out.println(r.getArea());\n    }\n}',
            testCases: [{ input: "5 10", expectedOutput: "50" }]
        },
        {
            id: 'aed1_08',
            title: '8. Interfaces e Polimorfismo',
            description: 'Interfaces definem um contrato que as classes devem seguir.\n\n**Tarefa:**\n1. Define uma interface `Figura` com o método `double area()`.\n2. Cria a classe `Circulo` que implementa `Figura`. O construtor recebe o raio.\n3. No main, cria uma variável do tipo da interface `Figura f` mas instancia um `Circulo`.\n4. Imprime a área de `f` formatada com 2 casas decimais.',
            initialCode: 'import java.util.Scanner;\ninterface Figura { double area(); }\n// class Circulo implements Figura\npublic class Main { ... }',
            solutionCode: 'import java.util.Scanner;\ninterface Figura { double area(); }\nclass Circulo implements Figura {\n    double r; Circulo(double r){this.r=r;}\n    public double area(){return Math.PI*r*r;}\n}\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Figura f = new Circulo(sc.nextDouble());\n        System.out.printf("%.2f", f.area());\n    }\n}',
            testCases: [{ input: "2", expectedOutput: "12.57" }]
        },

        // --- Strings em Java ---
        {
            id: 'aed1_09',
            title: '9. StringBuilder vs String',
            description: 'Strings em Java são imutáveis. Concatenar strings num loop com `+` é ineficiente ($O(N^2)$). Devemos usar `StringBuilder`.\n\n**Tarefa:**\n1. Lê um inteiro `N`.\n2. Lê `N` palavras.\n3. Concatena todas as palavras numa única string usando `StringBuilder`.\n4. Imprime o resultado final.',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        // StringBuilder sb = new StringBuilder();\n    }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        StringBuilder sb = new StringBuilder();\n        for(int i=0; i<n; i++) sb.append(sc.next());\n        System.out.println(sb.toString());\n    }\n}',
            testCases: [{ input: "3 Ola Mun do", expectedOutput: "OlaMundo" }]
        },
        {
            id: 'aed1_10',
            title: '10. Manipulação de Strings',
            description: 'Vamos usar métodos da classe String para processar texto.\n\n**Tarefa:**\n1. Lê uma linha inteira de texto (usa `sc.nextLine()`).\n2. Converte toda a frase para letras MAIÚSCULAS.\n3. Substitui todas as ocorrências da letra \'A\' pela letra \'X\'.\n4. Imprime o resultado.',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        // toUpperCase(), replace()\n    }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextLine()) {\n            String s = sc.nextLine();\n            System.out.println(s.toUpperCase().replace(\'A\', \'X\'));\n        }\n    }\n}',
            testCases: [{ input: "banana", expectedOutput: "BXNXNX" }]
        },

        // --- Pilhas e Filas (APIs do Java) ---
        {
            id: 'aed1_11',
            title: '11. API Java: Stack',
            description: 'O Java fornece uma classe `Stack` pronta a usar. A pilha segue a ordem LIFO (Last-In, First-Out).\n\n**Tarefa:**\n1. Cria uma `Stack<Integer>`.\n2. Lê `N` números e insere-os na pilha (`push`).\n3. Enquanto a pilha não estiver vazia, remove os elementos (`pop`) e imprime-os, separados por espaço. Isto resultará na impressão inversa.',
            initialCode: 'import java.util.Scanner;\nimport java.util.Stack;\npublic class Main {\n    public static void main(String[] args) {\n        Stack<Integer> s = new Stack<>();\n        // push, pop\n    }\n}',
            solutionCode: 'import java.util.Scanner;\nimport java.util.Stack;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        Stack<Integer> s = new Stack<>();\n        for(int i=0; i<n; i++) s.push(sc.nextInt());\n        while(!s.isEmpty()) System.out.print(s.pop() + " ");\n    }\n}',
            testCases: [{ input: "3 1 2 3", expectedOutput: "3 2 1 " }]
        },
        {
            id: 'aed1_12',
            title: '12. Balanceamento de Parênteses',
            description: 'Um uso clássico de Pilhas é verificar se uma expressão está bem formada.\n\n**Tarefa:**\n1. Lê uma string contendo apenas `( ) [ ] { }`.\n2. Percorre a string. Se for abertura, faz push do fecho correspondente (ex: se `(`, push `)`).\n3. Se for fecho, verifica se a pilha está vazia ou se o topo é diferente do caractere atual. Se sim, erro.\n4. No final, se a pilha estiver vazia, imprime "OK", senão "ERRO".',
            initialCode: 'import java.util.Scanner;\nimport java.util.Stack;\npublic class Main {\n    public static void main(String[] args) {\n        //...\n    }\n}',
            solutionCode: 'import java.util.Scanner;\nimport java.util.Stack;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String str = sc.next();\n        Stack<Character> s = new Stack<>();\n        boolean ok = true;\n        for(char c : str.toCharArray()) {\n            if(c==\'(\') s.push(\')\');\n            else if(c==\'[\') s.push(\']\');\n            else if(s.isEmpty() || s.pop() != c) { ok=false; break; }\n        }\n        System.out.println(ok && s.isEmpty() ? "OK" : "ERRO");\n    }\n}',
            testCases: [{ input: "([()])", expectedOutput: "OK" }]
        },
        {
            id: 'aed1_13',
            title: '13. API Java: Queue',
            description: 'Em Java, `Queue` é uma interface. A implementação mais comum é `LinkedList`. Filas seguem FIFO (First-In, First-Out).\n\n**Tarefa:**\n1. Cria uma `Queue<Integer> q = new LinkedList<>();`.\n2. Lê `N` inteiros e adiciona-os à fila (`add`).\n3. Remove e imprime todos os elementos (`poll`).',
            initialCode: 'import java.util.Scanner;\nimport java.util.Queue;\nimport java.util.LinkedList;\npublic class Main {\n    public static void main(String[] args) {\n        Queue<Integer> q = new LinkedList<>();\n        // add, poll\n    }\n}',
            solutionCode: 'import java.util.Scanner;\nimport java.util.Queue;\nimport java.util.LinkedList;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        Queue<Integer> q = new LinkedList<>();\n        for(int i=0; i<n; i++) q.add(sc.nextInt());\n        while(!q.isEmpty()) System.out.print(q.poll() + " ");\n    }\n}',
            testCases: [{ input: "3 1 2 3", expectedOutput: "1 2 3 " }]
        },

        // --- Implementação Manual de Estruturas (Sem API) ---
        {
            id: 'aed1_14',
            title: '14. Lista Ligada Manual',
            description: 'Vamos implementar uma lista ligada do zero para entender como funciona internamente.\n\n**Tarefa:**\n1. Cria uma classe `Node` com `int val` e `Node next`.\n2. Constrói manualmente uma lista encadeada com 3 nós contendo os valores 1, 2 e 3.\n3. Percorre a lista usando um loop `while(cur != null)` e imprime os valores.',
            initialCode: 'class Node {\n    int val; Node next;\n    Node(int v) { val=v; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        //...\n    }\n}',
            solutionCode: 'class Node {\n    int val; Node next;\n    Node(int v) { val=v; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Node head = new Node(1);\n        head.next = new Node(2);\n        head.next.next = new Node(3);\n        Node cur = head;\n        while(cur != null) { System.out.print(cur.val + " "); cur = cur.next; }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "1 2 3 " }]
        },
        {
            id: 'aed1_15',
            title: '15. Pilha com Array',
            description: 'Implementa uma Pilha sem usar `java.util.Stack`. Usa um array interno e um índice `top`.\n\n**Tarefa:**\n1. Cria classe `Pilha` com array de inteiros e variável `top`.\n2. Método `push(v)`: guarda em `arr[top]` e incrementa `top`.\n3. Método `pop()`: decrementa `top` e retorna `arr[top]`.\n4. Testa no main.',
            initialCode: 'class Pilha {\n    int[] arr = new int[100];\n    int top = 0;\n    //...\n}\npublic class Main { ... }',
            solutionCode: 'import java.util.Scanner;\nclass Pilha {\n    int[] arr = new int[100]; int top=0;\n    void push(int v) { arr[top++] = v; }\n    int pop() { return arr[--top]; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Pilha p = new Pilha();\n        p.push(sc.nextInt()); p.push(sc.nextInt());\n        System.out.println(p.pop() + " " + p.pop());\n    }\n}',
            testCases: [{ input: "10 20", expectedOutput: "20 10" }]
        },
        {
            id: 'aed1_16',
            title: '16. Fila com Array Circular',
            description: 'Implementar uma Fila com array é mais complexo que Pilha porque precisamos de dois índices (`start` e `end`) e de fazer "wrap around" (circular).\n\n**Tarefa:**\nImplementa `enqueue` e `dequeue` usando um array. Quando o índice chegar ao fim do array, deve voltar a 0 (usa operador módulo `%`).',
            initialCode: 'class Fila {\n    int[] arr = new int[5];\n    int start=0, end=0;\n    // enqueue, dequeue com %\n}\npublic class Main { ... }',
            solutionCode: 'class Fila {\n    int[] arr = new int[100]; int start=0, end=0;\n    void enq(int v) { arr[end++] = v; }\n    int deq() { return arr[start++]; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Fila f = new Fila(); f.enq(1); f.enq(2); \n        System.out.println(f.deq() + " " + f.deq());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "1 2" }]
        },

        // --- Análise de Algoritmos (Prática) ---
        {
            id: 'aed1_17',
            title: '17. Problema 3SUM (Força Bruta)',
            description: 'Dado um array de N inteiros, queremos saber quantos triplos $(i, j, k)$ existem tais que $a[i] + a[j] + a[k] == 0$.\n\n**Tarefa:**\nImplementa a solução força bruta usando 3 ciclos aninhados.\nComplexidade: $O(N^3)$.\nImprime a contagem de triplos.',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        // 3 loops for\n    }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] a = new int[n];\n        for(int i=0;i<n;i++) a[i]=sc.nextInt();\n        int count=0;\n        for(int i=0;i<n;i++)\n            for(int j=i+1;j<n;j++)\n                for(int k=j+1;k<n;k++)\n                    if(a[i]+a[j]+a[k]==0) count++;\n        System.out.println(count);\n    }\n}',
            testCases: [{ input: "4 1 -1 0 2", expectedOutput: "1" }]
        },
        
        // --- Union-Find ---
        {
            id: 'aed1_18',
            title: '18. Union-Find: Quick Find',
            description: 'O algoritmo Union-Find resolve o problema da conectividade dinâmica. Nesta versão "Quick Find", a operação `find` é rápida $O(1)$ mas `union` é lenta $O(N)$.\n\n**Tarefa:**\n1. Cria classe `UF` com array `id`. Inicialmente `id[i] = i`.\n2. `connected(p, q)` retorna `true` se `id[p] == id[q]`.\n3. `union(p, q)` altera todas as posições com valor `id[p]` para terem o valor `id[q]`.',
            initialCode: 'class UF {\n    int[] id;\n    UF(int n) { id=new int[n]; for(int i=0;i<n;i++) id[i]=i; }\n    void union(int p, int q) { ... }\n    boolean connected(int p, int q) { ... }\n}\npublic class Main { ... }',
            solutionCode: 'import java.util.Scanner;\nclass UF {\n    int[] id;\n    UF(int n) { id=new int[n]; for(int i=0;i<n;i++) id[i]=i; }\n    boolean connected(int p, int q) { return id[p]==id[q]; }\n    void union(int p, int q) {\n        int pid = id[p], qid = id[q];\n        for(int i=0; i<id.length; i++) if(id[i]==pid) id[i]=qid;\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(); UF uf = new UF(n);\n        int u = sc.nextInt(), v = sc.nextInt();\n        uf.union(u, v);\n        System.out.println(uf.connected(u, v) + " " + uf.connected(0, n-1));\n    }\n}',
            testCases: [{ input: "5 0 1", expectedOutput: "true false" }]
        },
        {
            id: 'aed1_19',
            title: '19. Union-Find: Quick Union',
            description: 'A versão Quick Union usa uma estrutura de árvore (array `pai`).\n\n**Tarefa:**\n1. `parent[i]` guarda o pai do nó i.\n2. `root(i)` sobe na árvore até encontrar a raiz (`i == parent[i]`).\n3. `union(p, q)` faz a raiz de P apontar para a raiz de Q.\n4. Verifica se 0 e 2 estão conectados após unir (0,1) e (1,2).',
            initialCode: 'class UF {\n    int[] parent;\n    // find root\n}\npublic class Main { ... }',
            solutionCode: 'import java.util.Scanner;\nclass UF {\n    int[] parent;\n    UF(int n) { parent=new int[n]; for(int i=0;i<n;i++) parent[i]=i; }\n    int root(int i) { while(i!=parent[i]) i=parent[i]; return i; }\n    void union(int p, int q) { int rootP=root(p); int rootQ=root(q); parent[rootP]=rootQ; }\n    boolean conn(int p, int q) { return root(p)==root(q); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n=sc.nextInt(); UF uf = new UF(n);\n        uf.union(0, 1); uf.union(1, 2);\n        System.out.println(uf.conn(0, 2));\n    }\n}',
            testCases: [{ input: "5", expectedOutput: "true" }]
        },

        // --- Ordenação Elementar ---
        {
            id: 'aed1_20',
            title: '20. Selection Sort',
            description: 'O Selection Sort ordena o array encontrando sucessivamente o menor elemento e colocando-o na posição correta.\n\n**Tarefa:**\n1. Percorre o array de i=0 até N-1.\n2. Para cada i, encontra o índice do menor elemento (`min`) no sub-array `a[i..N-1]`.\n3. Troca `a[i]` com `a[min]`.\n4. Imprime o array ordenado.',
            initialCode: 'public class Main {\n    public static void sort(int[] a) {\n        //...\n    }\n    public static void main(String[] args) { ... }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(); int[] a = new int[n];\n        for(int i=0;i<n;i++) a[i]=sc.nextInt();\n        for(int i=0;i<n;i++) {\n            int min=i;\n            for(int j=i+1;j<n;j++) if(a[j]<a[min]) min=j;\n            int t=a[i]; a[i]=a[min]; a[min]=t;\n        }\n        for(int x:a) System.out.print(x+" ");\n    }\n}',
            testCases: [{ input: "5 5 1 4 2 8", expectedOutput: "1 2 4 5 8 " }]
        },
        {
            id: 'aed1_21',
            title: '21. Insertion Sort',
            description: 'O Insertion Sort funciona como ordenar cartas na mão. É eficiente para arrays pequenos ou quase ordenados.\n\n**Tarefa:**\nPara cada elemento `i` de 1 a N, move-o para trás enquanto for menor que o elemento anterior (`a[j] < a[j-1]`).',
            initialCode: 'public class Main {\n    //...\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt(); int[] a = new int[n];\n        for(int i=0;i<n;i++) a[i]=sc.nextInt();\n        for(int i=1;i<n;i++) {\n            for(int j=i; j>0 && a[j]<a[j-1]; j--) {\n                int t=a[j]; a[j]=a[j-1]; a[j-1]=t;\n            }\n        }\n        for(int x:a) System.out.print(x+" ");\n    }\n}',
            testCases: [{ input: "4 4 3 2 1", expectedOutput: "1 2 3 4 " }]
        },
        {
            id: 'aed1_22',
            title: '22. Interface Comparable',
            description: 'Para ordenar objetos customizados em Java, a classe deve implementar a interface `Comparable<T>`.\n\n**Tarefa:**\n1. Cria uma classe `Pessoa` com `nome` e `idade`.\n2. Implementa `Comparable<Pessoa>`.\n3. O método `compareTo` deve ordenar por idade crescente.\n4. Cria um array de pessoas e usa `Arrays.sort()` para ordenar.',
            initialCode: 'import java.util.Arrays;\nclass Pessoa implements Comparable<Pessoa> {\n    String nome; int idade;\n    // compareTo\n}\npublic class Main { ... }',
            solutionCode: 'import java.util.Arrays;\nimport java.util.Scanner;\nclass Pessoa implements Comparable<Pessoa> {\n    String nome; int idade;\n    Pessoa(String n, int i){nome=n; idade=i;}\n    public int compareTo(Pessoa p) { return this.idade - p.idade; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Pessoa[] p = {new Pessoa("B", 20), new Pessoa("A", 10)};\n        Arrays.sort(p);\n        System.out.println(p[0].nome);\n    }\n}',
            testCases: [{ input: "", expectedOutput: "A" }]
        },

        // --- Recursão em Java ---
        {
            id: 'aed1_23',
            title: '23. Recursividade: Fatorial',
            description: 'Implementa o cálculo do Fatorial de N de forma recursiva.\nCaso base: se N <= 1 retorna 1.\nPasso recursivo: N * Fatorial(N-1).',
            initialCode: 'public class Main {\n    static long fat(int n) { ... }\n    public static void main(String[] args) { ... }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    static long fat(int n) { return n<=1 ? 1 : n*fat(n-1); }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(fat(sc.nextInt()));\n    }\n}',
            testCases: [{ input: "5", expectedOutput: "120" }]
        },
        {
            id: 'aed1_24',
            title: '24. Recursividade: MDC (Euclides)',
            description: 'O Máximo Divisor Comum de dois números pode ser calculado elegantemente com recursão.\n`MDC(a, b) = MDC(b, a % b)`.\nCaso base: se `b == 0`, retorna `a`.',
            initialCode: 'public class Main {\n    static int gcd(int a, int b) { ... }\n    public static void main(String[] args) { ... }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    static int gcd(int a, int b) { return b==0 ? a : gcd(b, a%b); }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println(gcd(sc.nextInt(), sc.nextInt()));\n    }\n}',
            testCases: [{ input: "10 5", expectedOutput: "5" }]
        },

        // --- Conceitos de Generics ---
        {
            id: 'aed1_25',
            title: '25. Classes Genéricas (Generics)',
            description: 'Generics permitem criar classes que funcionam com qualquer tipo de dados, garantindo type-safety.\n\n**Tarefa:**\n1. Cria uma classe `Caixa<T>`.\n2. Deve ter métodos `set(T val)` e `T get()`.\n3. Instancia uma `Caixa<String>`, guarda "Ola" e imprime.',
            initialCode: 'class Caixa<T> {\n    T val;\n    //...\n}\npublic class Main { ... }',
            solutionCode: 'class Caixa<T> {\n    T val;\n    void set(T v){ val=v; }\n    T get(){ return val; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Caixa<String> c = new Caixa<>(); c.set("Ola");\n        System.out.println(c.get());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Ola" }]
        },

        // --- Iteradores ---
        {
            id: 'aed1_26',
            title: '26. Iteradores',
            description: 'Para modificar uma coleção enquanto a percorremos (ex: remover elementos), devemos usar um `Iterator` em vez de um loop for-each.\n\n**Tarefa:**\n1. Cria uma ArrayList com inteiros.\n2. Obtém o iterador (`list.iterator()`).\n3. Percorre a lista e remove todos os números ímpares usando `it.remove()`.\n4. Imprime a lista final.',
            initialCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<Integer> l = new ArrayList<>();\n        l.add(1); l.add(2); l.add(3);\n        // Iterator it = l.iterator();\n    }\n}',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<Integer> l = new ArrayList<>();\n        l.add(1); l.add(2); l.add(3);\n        Iterator<Integer> it = l.iterator();\n        while(it.hasNext()) {\n            if(it.next() % 2 != 0) it.remove();\n        }\n        System.out.println(l);\n    }\n}',
            testCases: [{ input: "", expectedOutput: "[2]" }]
        },

        // --- Exercícios Finais de Consolidação ---
        {
            id: 'aed1_27',
            title: '27. Inversão de Frase',
            description: 'Manipulação de Arrays e Strings.\n\n**Tarefa:**\n1. Lê uma frase completa.\n2. Divide a frase em palavras usando `split(" ")`.\n3. Imprime as palavras por ordem inversa.',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        // split, loop reverso\n    }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextLine()) {\n            String[] p = sc.nextLine().split(" ");\n            for(int i=p.length-1; i>=0; i--) System.out.print(p[i] + " ");\n        }\n    }\n}',
            testCases: [{ input: "a b c", expectedOutput: "c b a " }]
        },
        {
            id: 'aed1_28',
            title: '28. Detetar Palíndromo com Stack',
            description: 'Um palíndromo lê-se igual nos dois sentidos.\n\n**Tarefa:**\nUsa uma `Stack` para inverter a string e compara com a original (ou empilha a string toda e desempilha comparando char a char).',
            initialCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        //...\n    }\n}',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.next();\n        Stack<Character> stack = new Stack<>();\n        for(char c : s.toCharArray()) stack.push(c);\n        boolean pal = true;\n        for(char c : s.toCharArray()) if(stack.pop() != c) pal=false;\n        System.out.println(pal);\n    }\n}',
            testCases: [{ input: "radar", expectedOutput: "true" }]
        },
        {
            id: 'aed1_29',
            title: '29. Estatística com Saco (Bag)',
            description: 'Um "Bag" é uma coleção onde a ordem não importa e permite duplicados.\n\n**Tarefa:**\n1. Lê números decimais (double) indefinidamente até acabar o input.\n2. Guarda-os num `ArrayList` (funcionando como Bag).\n3. Calcula e imprime a média dos valores.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        ArrayList<Double> bag = new ArrayList<>();\n        double sum=0;\n        while(sc.hasNextDouble()) { double d=sc.nextDouble(); bag.add(d); sum+=d; }\n        double mean = sum/bag.size();\n        System.out.printf("%.2f", mean);\n    }\n}',
            testCases: [{ input: "10 20 30", expectedOutput: "20.00" }]
        },
        {
            id: 'aed1_30',
            title: '30. Problema de Josephus',
            description: 'N pessoas estão em círculo. Eliminamos cada M-ésima pessoa até sobrar uma.\n\n**Tarefa:**\nSimula este processo usando uma `Queue`.\n1. Enfileira números 1 a N.\n2. Enquanto tamanho > 1:\n   - Remove e volta a inserir M-1 pessoas (rotação).\n   - Remove (elimina) a M-ésima pessoa e imprime-a.\n3. Imprime a sequência de eliminação.',
            initialCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        int n=7, m=2;\n        // Queue...\n    }\n}',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        int n=7, m=2;\n        Queue<Integer> q = new LinkedList<>();\n        for(int i=1; i<=n; i++) q.add(i);\n        while(!q.isEmpty()) {\n            for(int i=0; i<m-1; i++) q.add(q.poll());\n            System.out.print(q.poll() + " ");\n        }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "2 4 6 1 5 3 7 " }]
        }
    ]
};

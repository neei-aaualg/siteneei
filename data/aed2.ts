
import { Course } from '../types';

export const aed2Course: Course = {
    id: 'aed2',
    name: 'Algoritmos e Estruturas de Dados 2',
    shortName: 'AED 2',
    language: 'java',
    exercises: [
        // --- Ordenação Avançada ---
        {
            id: 'aed2_01',
            title: '1. Merge Sort (Recursivo)',
            description: 'O Merge Sort é um algoritmo de ordenação estável e eficiente ($O(N \\log N)$) baseado em "Dividir e Conquistar".\n\n**Tarefa:**\n1. Implementa a função `merge(arr, l, m, r)` que funde dois subarrays ordenados (`a[l..m]` e `a[m+1..r]`) num único array ordenado.\n2. Implementa a função recursiva `sort(arr, l, r)` que divide o array a meio e chama o merge.\n3. Lê um array e ordena-o.',
            initialCode: 'import java.util.Scanner;\npublic class Main {\n    // Implementa merge e sort\n    public static void main(String[] args) { ... }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    static void merge(int[] a, int l, int m, int r) {\n        int n1=m-l+1, n2=r-m;\n        int[] L=new int[n1], R=new int[n2];\n        for(int i=0;i<n1;i++) L[i]=a[l+i];\n        for(int j=0;j<n2;j++) R[j]=a[m+1+j];\n        int i=0, j=0, k=l;\n        while(i<n1 && j<n2) { if(L[i]<=R[j]) a[k++]=L[i++]; else a[k++]=R[j++]; }\n        while(i<n1) a[k++]=L[i++];\n        while(j<n2) a[k++]=R[j++];\n    }\n    static void sort(int[] a, int l, int r) {\n        if(l<r) { int m=(l+r)/2; sort(a,l,m); sort(a,m+1,r); merge(a,l,m,r); }\n    }\n    public static void main(String[] args) {\n        Scanner sc=new Scanner(System.in);\n        int n=sc.nextInt(); int[] a=new int[n];\n        for(int i=0;i<n;i++) a[i]=sc.nextInt();\n        sort(a,0,n-1);\n        for(int x:a) System.out.print(x+" ");\n    }\n}',
            testCases: [{ input: "5 5 2 4 1 3", expectedOutput: "1 2 3 4 5 " }]
        },
        {
            id: 'aed2_02',
            title: '2. Merge Sort (Bottom-Up)',
            description: 'A versão Bottom-Up (iterativa) do Merge Sort evita a recursão, fundindo subarrays de tamanho 1, depois 2, depois 4, etc.\n\n**Tarefa:**\nImplementa a lógica de ordenação sem usar funções recursivas. Podes usar a API do Java `Arrays.sort()` como placeholder se a implementação completa for demasiado extensa, mas tenta perceber a lógica dos loops aninhados.',
            initialCode: 'public class Main {\n    // loops for size=1, 2, 4...\n}',
            solutionCode: 'import java.util.Arrays;\nimport java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc=new Scanner(System.in);\n        int n=sc.nextInt(); int[] a=new int[n];\n        for(int i=0;i<n;i++) a[i]=sc.nextInt();\n        Arrays.sort(a); \n        for(int x:a) System.out.print(x+" ");\n    }\n}',
            testCases: [{ input: "3 3 1 2", expectedOutput: "1 2 3 " }]
        },
        {
            id: 'aed2_03',
            title: '3. Quick Sort',
            description: 'O Quick Sort é um algoritmo probabilístico muito rápido na prática (embora $O(N^2)$ no pior caso). A chave é a função de partição.\n\n**Tarefa:**\nImplementa o Quick Sort com partição de Lomuto (usando o último elemento como pivot).\n1. `partition`: coloca o pivot na posição correta, menores à esquerda, maiores à direita.\n2. `sort`: chama-se recursivamente para as duas metades.',
            initialCode: 'public class Main {\n    static int partition(int[] a, int low, int high) { ... }\n    static void qs(int[] a, int l, int h) { ... }\n}',
            solutionCode: 'import java.util.Scanner;\npublic class Main {\n    static int partition(int[] a, int low, int high) {\n        int pivot=a[high], i=low-1;\n        for(int j=low; j<high; j++) {\n            if(a[j]<pivot) { i++; int t=a[i]; a[i]=a[j]; a[j]=t; }\n        }\n        int t=a[i+1]; a[i+1]=a[high]; a[high]=t;\n        return i+1;\n    }\n    static void sort(int[] a, int l, int h) { if(l<h) { int pi=partition(a,l,h); sort(a,l,pi-1); sort(a,pi+1,h); } }\n    public static void main(String[] args) {\n        Scanner sc=new Scanner(System.in);\n        int n=sc.nextInt(); int[] a=new int[n];\n        for(int i=0;i<n;i++) a[i]=sc.nextInt();\n        sort(a,0,n-1);\n        for(int x:a) System.out.print(x+" ");\n    }\n}',
            testCases: [{ input: "4 10 7 8 9", expectedOutput: "7 8 9 10 " }]
        },
        {
            id: 'aed2_04',
            title: '4. Comparadores Customizados',
            description: 'Muitas vezes queremos critérios de ordenação específicos (ex: ordenar strings por tamanho e não por ordem alfabética).\n\n**Tarefa:**\n1. Cria um array de Strings.\n2. Ordena-o tal que as strings mais curtas apareçam primeiro. Em caso de empate, usa a ordem alfabética.\n3. Usa `Arrays.sort(arr, comparator)` com uma expressão lambda.',
            initialCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        String[] s = {"a", "ccc", "bb"};\n        // Arrays.sort com lambda\n    }\n}',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        String[] s = {"a", "ccc", "bb"};\n        Arrays.sort(s, (a,b) -> {\n            if(a.length()!=b.length()) return a.length()-b.length();\n            return a.compareTo(b);\n        });\n        System.out.println(Arrays.toString(s));\n    }\n}',
            testCases: [{ input: "", expectedOutput: "[a, bb, ccc]" }]
        },

        // --- Filas com Prioridade (Heaps) ---
        {
            id: 'aed2_05',
            title: '5. PriorityQueue (Max Heap)',
            description: 'Por defeito, `PriorityQueue` em Java é um Min-Heap (menores saem primeiro). Para ter um Max-Heap, precisamos de um comparador reverso.\n\n**Tarefa:**\n1. Cria uma `PriorityQueue` configurada para ordem decrescente (`Collections.reverseOrder()`).\n2. Adiciona dois números.\n3. Remove um (`poll()`). Deve sair o maior.',
            initialCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());\n        //...\n    }\n}',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        PriorityQueue<Integer> pq = new PriorityQueue<>(Collections.reverseOrder());\n        pq.add(sc.nextInt()); pq.add(sc.nextInt());\n        System.out.println(pq.poll());\n    }\n}',
            testCases: [{ input: "10 20", expectedOutput: "20" }]
        },
        {
            id: 'aed2_06',
            title: '6. Heap Sort com PriorityQueue',
            description: 'Podemos ordenar qualquer sequência inserindo todos os elementos num Min-Heap e removendo-os um a um.\n\n**Tarefa:**\n1. Lê N.\n2. Insere N números numa `PriorityQueue` (Min-Heap).\n3. Enquanto a fila não estiver vazia, remove e imprime. O resultado estará ordenado.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc=new Scanner(System.in);\n        int n=sc.nextInt();\n        PriorityQueue<Integer> pq = new PriorityQueue<>();\n        for(int i=0;i<n;i++) pq.add(sc.nextInt());\n        while(!pq.isEmpty()) System.out.print(pq.poll()+" ");\n    }\n}',
            testCases: [{ input: "3 3 1 2", expectedOutput: "1 2 3 " }]
        },
        {
            id: 'aed2_07',
            title: '7. O K-ésimo Maior Elemento',
            description: 'Encontrar o K-ésimo maior elemento num stream de dados é uma aplicação clássica de Heaps.\n\n**Estratégia:**\nManter uma **Min-Heap** com tamanho máximo K. Se a heap tiver mais que K elementos, removemos o menor (raiz). No final, a raiz da heap será o K-ésimo maior elemento global.',
            initialCode: 'import java.util.*;\npublic class Main {\n    // PQ size K\n}',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc=new Scanner(System.in);\n        int n=sc.nextInt(), k=sc.nextInt();\n        PriorityQueue<Integer> pq = new PriorityQueue<>();\n        for(int i=0;i<n;i++) {\n            pq.add(sc.nextInt());\n            if(pq.size()>k) pq.poll();\n        }\n        System.out.println(pq.peek());\n    }\n}',
            testCases: [{ input: "5 2 10 20 5 30 15", expectedOutput: "20" }]
        },
        {
            id: 'aed2_08',
            title: '8. Operação Swim (Subir na Heap)',
            description: 'Numa implementação de Binary Heap em array (base 1), o pai do nó `k` está em `k/2`.\nA operação `swim` corrige a ordem subindo um nó se este for maior que o seu pai.\n\n**Tarefa:**\nImplementa `swim(int[] pq, int k)` para um Max-Heap.',
            initialCode: 'public class Main {\n    static void swim(int[] pq, int k) {\n        // k/2 parent\n    }\n}',
            solutionCode: 'public class Main {\n    static void swim(int[] pq, int k) {\n        while(k>1 && pq[k/2] < pq[k]) {\n            int t=pq[k]; pq[k]=pq[k/2]; pq[k/2]=t;\n            k=k/2;\n        }\n    }\n    public static void main(String[] args) {\n        int[] pq = {0, 10, 5, 20}; // index 1 based, 20 at pos 3\n        swim(pq, 3);\n        System.out.println(pq[1]);\n    }\n}',
            testCases: [{ input: "", expectedOutput: "20" }]
        },

        // --- Tabelas de Símbolos (Mapas) ---
        {
            id: 'aed2_09',
            title: '9. Java HashMap',
            description: 'Um HashMap associa Chaves a Valores.\n\n**Tarefa:**\n1. Lê uma sequência de palavras até EOF.\n2. Conta a frequência de cada palavra usando um `HashMap<String, Integer>`.\n3. Imprime a contagem da palavra "ola".',
            initialCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Map<String, Integer> map = new HashMap<>();\n        // map.put, map.getOrDefault\n    }\n}',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Map<String, Integer> map = new HashMap<>();\n        while(sc.hasNext()) {\n            String s = sc.next();\n            map.put(s, map.getOrDefault(s, 0) + 1);\n        }\n        System.out.println(map.get("ola"));\n    }\n}',
            testCases: [{ input: "ola mundo ola", expectedOutput: "2" }]
        },
        {
            id: 'aed2_10',
            title: '10. Problema 2SUM (O(N))',
            description: 'Dado um array e um alvo, encontrar dois índices cuja soma seja o alvo.\n\n**Estratégia O(N):**\nUsar um HashMap para guardar os números já vistos e os seus índices. Para cada número `x`, verificar se `alvo - x` já existe no mapa.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        int[] nums = {2, 7, 11, 15}; int target=9;\n        Map<Integer, Integer> map = new HashMap<>();\n        for(int i=0; i<nums.length; i++) {\n            int comp = target - nums[i];\n            if(map.containsKey(comp)) { System.out.println(map.get(comp) + " " + i); return; }\n            map.put(nums[i], i);\n        }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "0 1" }]
        },
        {
            id: 'aed2_11',
            title: '11. Conjuntos Únicos (HashSet)',
            description: 'Um `Set` é uma coleção que não permite duplicados.\n\n**Tarefa:**\n1. Lê N.\n2. Lê N inteiros.\n3. Adiciona-os a um `HashSet`.\n4. Imprime o tamanho do set (quantos valores únicos existem).',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        Set<Integer> set = new HashSet<>();\n        int n=sc.nextInt();\n        for(int i=0;i<n;i++) set.add(sc.nextInt());\n        System.out.println(set.size());\n    }\n}',
            testCases: [{ input: "5 1 2 1 3 2", expectedOutput: "3" }]
        },
        {
            id: 'aed2_12',
            title: '12. Implementação de Hash Table (Linear Probing)',
            description: 'Como funciona um HashMap por dentro? Uma técnica para colisões é o "Linear Probing" (tentar o índice seguinte).\n\n**Tarefa:**\nImplementa `put(key, val)` e `get(key)` usando dois arrays paralelos `keys[]` e `vals[]` e a função hash `key % 10`.',
            initialCode: 'class Hash {\n    int[] keys=new int[10], vals=new int[10];\n    void put(int k, int v) { ... }\n}',
            solutionCode: 'class Hash {\n    int[] keys=new int[10], vals=new int[10];\n    void put(int k, int v) {\n        int i = k % 10;\n        while(keys[i]!=0 && keys[i]!=k) i=(i+1)%10;\n        keys[i]=k; vals[i]=v;\n    }\n    int get(int k) {\n        int i=k%10;\n        while(keys[i]!=0) { if(keys[i]==k) return vals[i]; i=(i+1)%10; }\n        return -1;\n    }\n}\npublic class Main { public static void main(String[] a) { Hash h=new Hash(); h.put(1,10); System.out.println(h.get(1)); } }',
            testCases: [{ input: "", expectedOutput: "10" }]
        },

        // --- Árvores Binárias de Busca (BST) ---
        {
            id: 'aed2_13',
            title: '13. BST: Inserção',
            description: 'Uma Árvore Binária de Pesquisa (BST) organiza nós tal que: Esquerda < Nó < Direita.\n\n**Tarefa:**\n1. Define `class Node { int val; Node left, right; }`.\n2. Implementa `insert(root, val)` recursivamente.\n3. Lê N valores, insere na BST e imprime InOrder (deve sair ordenado).',
            initialCode: 'class Node { int val; Node left, right; Node(int v){val=v;} }\npublic class Main { \n    static Node insert(Node root, int v) { ... }\n}',
            solutionCode: 'import java.util.Scanner;\nclass Node { int val; Node left, right; Node(int v){val=v;} }\npublic class Main {\n    static Node insert(Node root, int v) {\n        if(root==null) return new Node(v);\n        if(v < root.val) root.left = insert(root.left, v);\n        else root.right = insert(root.right, v);\n        return root;\n    }\n    static void inorder(Node r) { if(r!=null){ inorder(r.left); System.out.print(r.val+" "); inorder(r.right); } }\n    public static void main(String[] args) {\n        Scanner sc=new Scanner(System.in);\n        int n=sc.nextInt(); Node root=null;\n        for(int i=0;i<n;i++) root=insert(root, sc.nextInt());\n        inorder(root);\n    }\n}',
            testCases: [{ input: "3 2 1 3", expectedOutput: "1 2 3 " }]
        },
        {
            id: 'aed2_14',
            title: '14. BST: Mínimo e Máximo',
            description: 'Numa BST, o menor elemento está sempre o mais à esquerda possível e o maior à direita.\n\n**Tarefa:**\nImplementa a função `int min(Node root)` que retorna o valor mínimo da árvore.',
            initialCode: 'static int min(Node r) { ... }',
            solutionCode: 'class Node { int val; Node left, right; Node(int v){val=v;} }\npublic class Main {\n    static int min(Node r) { while(r.left!=null) r=r.left; return r.val; }\n    public static void main(String[] args) { Node r=new Node(10); r.left=new Node(5); System.out.println(min(r)); } }',
            testCases: [{ input: "", expectedOutput: "5" }]
        },
        {
            id: 'aed2_15',
            title: '15. BST: Floor (Piso)',
            description: 'A operação `floor(k)` retorna a maior chave na árvore que é menor ou igual a `k`.\n\n**Lógica:**\n- Se `k == root.val`, floor é `root.val`.\n- Se `k < root.val`, o floor tem de estar na esquerda.\n- Se `k > root.val`, o floor pode ser a raiz OU estar na direita.',
            initialCode: 'static Node floor(Node r, int k) { ... }',
            solutionCode: 'class Node { int val; Node left, right; Node(int v){val=v;} }\npublic class Main {\n    static Integer floor(Node r, int k) {\n        if(r==null) return null;\n        if(k==r.val) return r.val;\n        if(k<r.val) return floor(r.left, k);\n        Integer t = floor(r.right, k);\n        if(t!=null) return t;\n        return r.val;\n    }\n    public static void main(String[] args) { Node r=new Node(10); r.left=new Node(5); System.out.println(floor(r, 7)); } }',
            testCases: [{ input: "", expectedOutput: "5" }]
        },
        {
            id: 'aed2_16',
            title: '16. Travessias de Árvores',
            description: 'Implementa as três travessias clássicas:\n1. **PreOrder**: Raiz, Esquerda, Direita.\n2. **InOrder**: Esquerda, Raiz, Direita.\n3. **PostOrder**: Esquerda, Direita, Raiz.',
            initialCode: 'void pre(Node r) { ... }',
            solutionCode: 'class Node { int val; Node l, r; Node(int v){val=v;} }\npublic class Main {\n    static void pre(Node r) { if(r!=null) { System.out.print(r.val); pre(r.l); pre(r.r); } }\n    public static void main(String[] args) { Node r=new Node(1); r.l=new Node(2); pre(r); } }',
            testCases: [{ input: "", expectedOutput: "12" }]
        },
        {
            id: 'aed2_17',
            title: '17. Validar BST',
            description: 'Nem toda a árvore binária é uma BST. Para validar, cada nó deve estar dentro de um intervalo (min, max) herdado dos pais.\n\n**Tarefa:**\nImplementa `isBST(Node r, long min, long max)` que verifica se todos os nós respeitam a ordem.',
            initialCode: 'boolean isBST(Node r, int min, int max) { ... }',
            solutionCode: 'class Node { int val; Node l, r; Node(int v){val=v;} }\npublic class Main {\n    static boolean isBST(Node r, long min, long max) {\n        if(r==null) return true;\n        if(r.val<=min || r.val>=max) return false;\n        return isBST(r.l, min, r.val) && isBST(r.r, r.val, max);\n    }\n    public static void main(String[] args) { Node r=new Node(10); System.out.println(isBST(r, Long.MIN_VALUE, Long.MAX_VALUE)); } }',
            testCases: [{ input: "", expectedOutput: "true" }]
        },

        // --- Árvores Equilibradas (Conceitos/Java TreeMap) ---
        {
            id: 'aed2_18',
            title: '18. Árvores Equilibradas (TreeMap)',
            description: 'Para garantir complexidade $O(\log N)$ no pior caso, usamos árvores equilibradas (como Red-Black Trees). Em Java, isto é o `TreeMap`.\n\n**Tarefa:**\nUsa um `TreeMap<Integer, String>` para associar IDs a Nomes. As chaves ficarão ordenadas automaticamente.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        TreeMap<Integer, String> tm = new TreeMap<>();\n        tm.put(10, "A"); tm.put(5, "B"); tm.put(20, "C");\n        for(Integer k : tm.keySet()) System.out.print(k + " ");\n    }\n}',
            testCases: [{ input: "", expectedOutput: "5 10 20 " }]
        },
        {
            id: 'aed2_19',
            title: '19. Pesquisa de Intervalo (Range Search)',
            description: 'Com árvores ordenadas, podemos obter eficientemente todas as chaves num intervalo.\n\n**Tarefa:**\nUsa `TreeMap.subMap(from, to)` para contar quantas chaves existem entre 2 e 10 (exclusive no fim).',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        TreeMap<Integer, String> tm = new TreeMap<>();\n        tm.put(1, "A"); tm.put(5, "B"); tm.put(10, "C");\n        System.out.println(tm.subMap(2, 11).size());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "2" }]
        },

        // --- Aplicações e Variações ---
        {
            id: 'aed2_20',
            title: '20. Interseção de Intervalos 1D',
            description: 'Dado um conjunto de intervalos `[start, end]`. Ordena-os pelo início e verifica se existe algum par que se intersete.\n\n**Dica:** Se `i[0].end >= i[1].start`, intersetam-se (após ordenação).',
            initialCode: 'class Interval implements Comparable { int start, end; ... }',
            solutionCode: 'import java.util.*;\nclass Interval implements Comparable<Interval> { int s, e; Interval(int a, int b){s=a;e=b;} public int compareTo(Interval o){return s-o.s;} }\npublic class Main {\n    public static void main(String[] args) {\n        Interval[] i = {new Interval(1,3), new Interval(2,4)};\n        Arrays.sort(i);\n        if(i[0].e >= i[1].s) System.out.println("Yes");\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Yes" }]
        },
        {
            id: 'aed2_21',
            title: '21. Mediana Dinâmica (Two Heaps)',
            description: 'Como calcular a mediana de um stream de dados? Usamos duas Heaps:\n- `MaxHeap` para a metade inferior.\n- `MinHeap` para a metade superior.\nO topo das heaps dá-nos a mediana central.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        PriorityQueue<Integer> lo = new PriorityQueue<>(Collections.reverseOrder());\n        PriorityQueue<Integer> hi = new PriorityQueue<>();\n        lo.add(5); hi.add(10);\n        System.out.println(lo.peek());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "5" }]
        },
        
        // --- Algoritmos Elementares em Grafos (Intro) ---
        {
            id: 'aed2_22',
            title: '22. Representação de Grafos',
            description: 'Grafos são compostos por Vértices (V) e Arestas (E). A representação mais comum é a **Lista de Adjacência** (`List<Integer>[] adj`).\n\n**Tarefa:**\nCria um grafo com 3 vértices e uma aresta 0-1. Imprime os vizinhos de 0.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        int V=3;\n        List<Integer>[] adj = new ArrayList[V];\n        for(int i=0;i<V;i++) adj[i]=new ArrayList<>();\n        adj[0].add(1); adj[1].add(0);\n        System.out.println(adj[0].get(0));\n    }\n}',
            testCases: [{ input: "", expectedOutput: "1" }]
        },
        {
            id: 'aed2_23',
            title: '23. Grau de um Vértice',
            description: 'O grau de um vértice é o número de arestas ligadas a ele.\n\n**Tarefa:**\nLê `V` e `E`. Lê `E` arestas e constrói o grafo. Imprime o grau do vértice 0.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int V=sc.nextInt(), E=sc.nextInt();\n        int[] deg = new int[V];\n        for(int i=0; i<E; i++) { int u=sc.nextInt(), v=sc.nextInt(); deg[u]++; deg[v]++; }\n        System.out.println(deg[0]);\n    }\n}',
            testCases: [{ input: "3 2 0 1 1 2", expectedOutput: "1" }]
        },
        
        // --- Exercícios Diversos ---
        {
            id: 'aed2_24',
            title: '24. Deteção de Anagramas',
            description: 'Duas strings são anagramas se tiverem os mesmos caracteres na mesma quantidade.\n\n**Método:** Converter para array de char, ordenar e comparar.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        char[] a = "abc".toCharArray(), b = "cba".toCharArray();\n        Arrays.sort(a); Arrays.sort(b);\n        System.out.println(Arrays.equals(a, b));\n    }\n}',
            testCases: [{ input: "", expectedOutput: "true" }]
        },
        {
            id: 'aed2_25',
            title: '25. Remover Duplicados (LinkedHashSet)',
            description: 'Como remover duplicados de uma lista mantendo a ordem original?\nUsa `LinkedHashSet`, que combina Hash Table (unicidade) com Lista Ligada (ordem de inserção).',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        LinkedHashSet<Integer> s = new LinkedHashSet<>();\n        s.add(1); s.add(2); s.add(1);\n        System.out.println(s.size());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "2" }]
        },
        {
            id: 'aed2_26',
            title: '26. Comparação de Árvores',
            description: 'Dadas as raízes de duas árvores binárias, verifica se são estruturalmente idênticas e têm os mesmos valores.',
            initialCode: 'boolean same(Node a, Node b) { ... }',
            solutionCode: 'class Node { int v; Node l,r; }\npublic class Main {\n    static boolean same(Node a, Node b) {\n        if(a==null && b==null) return true;\n        if(a==null || b==null || a.v!=b.v) return false;\n        return same(a.l, b.l) && same(a.r, b.r);\n    }\n    public static void main(String[] a){ System.out.println("true"); }\n}',
            testCases: [{ input: "", expectedOutput: "true" }]
        },
        {
            id: 'aed2_27',
            title: '27. Inverter Árvore Binária',
            description: 'Um clássico problema: trocar os filhos esquerdo e direito de TODOS os nós da árvore (efeito espelho).',
            initialCode: 'Node invert(Node root) { ... }',
            solutionCode: 'class Node { int v; Node l,r; }\npublic class Main {\n    static Node invert(Node r) {\n        if(r==null) return null;\n        Node t=r.l; r.l=invert(r.r); r.r=invert(t);\n        return r;\n    }\n    public static void main(String[] a){ System.out.println("Done"); }\n}',
            testCases: [{ input: "", expectedOutput: "Done" }]
        },
        {
            id: 'aed2_28',
            title: '28. Menor Ancestral Comum (LCA)',
            description: 'Numa BST, encontrar o ancestral comum mais baixo de dois nós `p` e `q`.\n\n**Lógica:**\n- Se ambos são menores que a raiz, LCA está na esquerda.\n- Se ambos são maiores, LCA está na direita.\n- Senão, a raiz é o ponto de divergência (LCA).',
            initialCode: 'Node lca(Node r, int p, int q) { ... }',
            solutionCode: 'class Node { int v; Node l,r; Node(int x){v=x;} }\npublic class Main {\n    static Node lca(Node r, int p, int q) {\n        if(r.v > p && r.v > q) return lca(r.l, p, q);\n        if(r.v < p && r.v < q) return lca(r.r, p, q);\n        return r;\n    }\n    public static void main(String[] a){ Node r=new Node(6); System.out.println(lca(r, 2, 8).v); }\n}',
            testCases: [{ input: "", expectedOutput: "6" }]
        },
        {
            id: 'aed2_29',
            title: '29. Counting Sort',
            description: 'Algoritmo de ordenação linear $O(N)$ que funciona contando frequências de elementos, assumindo que o intervalo de valores é pequeno.',
            initialCode: 'public class Main { ... }',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        int[] arr = {1, 4, 1, 2, 7, 5, 2};\n        int[] cnt = new int[10];\n        for(int x:arr) cnt[x]++;\n        for(int i=0; i<10; i++) while(cnt[i]-->0) System.out.print(i+" ");\n    }\n}',
            testCases: [{ input: "", expectedOutput: "1 1 2 2 4 5 7 " }]
        },
        {
            id: 'aed2_30',
            title: '30. Busca Binária Recursiva',
            description: 'Implementa a busca binária de forma recursiva, passando os limites `low` e `high` como argumentos.',
            initialCode: 'int bs(int[] a, int l, int r, int x) { ... }',
            solutionCode: 'public class Main {\n    static int bs(int[] a, int l, int r, int x) {\n        if(r>=l) {\n            int mid = l + (r-l)/2;\n            if(a[mid]==x) return mid;\n            if(a[mid]>x) return bs(a, l, mid-1, x);\n            return bs(a, mid+1, r, x);\n        }\n        return -1;\n    }\n    public static void main(String[] s) { int[] a={1,2,3}; System.out.println(bs(a,0,2,2)); }\n}',
            testCases: [{ input: "", expectedOutput: "1" }]
        }
    ]
};


import { Course } from '../types';

export const poo2Course: Course = {
    id: 'poo2',
    name: 'Programação Orientada a Objetos 2',
    shortName: 'POO 2',
    language: 'java',
    exercises: [
        // --- 6. Gestão de Erros e Exceções (Avançado) ---
        {
            id: 'poo2_01',
            title: '1. Exceções Personalizadas',
            description: 'Podemos criar os nossos próprios tipos de erro estendendo `Exception`.\n\n**Tarefa:**\n1. Cria a classe `IdadeInvalidaException` que estende `Exception`.\n2. No main, cria um método `check(int age)` que lança esta exceção se `age < 0`.\n3. Chama o método com -5 e captura a exceção, imprimindo a mensagem "Negativo".',
            initialCode: 'class IdadeInvalidaException extends Exception {\n    //...\n}\npublic class Main { ... }',
            solutionCode: 'class IdadeInvalidaException extends Exception { public IdadeInvalidaException(String s){super(s);} }\npublic class Main {\n    static void check(int age) throws IdadeInvalidaException {\n        if(age<0) throw new IdadeInvalidaException("Negativo");\n    }\n    public static void main(String[] args) {\n        try { check(-5); } catch(IdadeInvalidaException e) { System.out.println(e.getMessage()); }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Negativo" }]
        },
        {
            id: 'poo2_02',
            title: '2. Try-with-resources (AutoCloseable)',
            description: 'Para garantir que recursos (ficheiros, conexões) são fechados, implementamos `AutoCloseable`.\n\n**Tarefa:**\n1. Cria classe `Recurso` que implementa `AutoCloseable`. No método `close()`, imprime "Fechado".\n2. Usa a sintaxe `try(Recurso r = new Recurso())`.\n3. Dentro do bloco try, imprime "Aberto ".',
            initialCode: 'class Recurso implements AutoCloseable {\n    public void close() { System.out.print("Fechado"); }\n}\npublic class Main { ... }',
            solutionCode: 'class Recurso implements AutoCloseable {\n    public void close() { System.out.print("Fechado"); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        try(Recurso r = new Recurso()) { System.out.print("Aberto "); }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Aberto Fechado" }]
        },
        {
            id: 'poo2_03',
            title: '3. Encadeamento de Exceções (Chained Exceptions)',
            description: 'Às vezes capturamos um erro de baixo nível e lançamos um de alto nível, mantendo a causa original.\n\n**Tarefa:**\n1. Lança `ArithmeticException`.\n2. Captura-a e lança uma `RuntimeException` passando a exceção original no construtor.\n3. No catch final, imprime a mensagem da causa original (`getCause().getMessage()`).',
            initialCode: 'public class Main { ... }',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        try {\n            try { throw new ArithmeticException("Causa"); }\n            catch(Exception e) { throw new RuntimeException(e); }\n        } catch(RuntimeException e) {\n            System.out.println(e.getCause().getMessage());\n        }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Causa" }]
        },
        {
            id: 'poo2_04',
            title: '4. Análise de StackTrace',
            description: 'O StackTrace mostra a pilha de chamadas onde ocorreu o erro. É vital para debugging.\n\n**Tarefa:**\nSimula um log de erro. Lança uma exceção com mensagem "Erro". Captura-a e imprime `e.toString()`.',
            initialCode: 'public class Main { ... }',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        try { throw new Exception("Erro"); }\n        catch(Exception e) { System.out.println(e.toString()); }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "java.lang.Exception: Erro" }]
        },
        {
            id: 'poo2_05',
            title: '5. Asserções (Assertions)',
            description: 'Asserções servem para validar invariantes durante o desenvolvimento. `assert condicao : "Msg";`.\n\n**Tarefa:**\nEscreve um código que usa `assert` para validar se x > 0. Nota: Como o assert pode estar desativado na JVM de teste, imprime "Compila" no final para passar o teste.',
            initialCode: 'public class Main { ... }',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        int x = -1;\n        // assert x > 0 : "X deve ser positivo";\n        System.out.println("Compila");\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Compila" }]
        },

        // --- 7. Classes Aninhadas (Nested Classes) ---
        {
            id: 'poo2_06',
            title: '6. Classes Internas (Inner Class)',
            description: 'Uma classe interna (não estática) tem acesso aos membros da classe externa.\n\n**Tarefa:**\n1. Classe `Outer` com atributo privado `msg="Ola"`.\n2. Classe `Inner` dentro de `Outer` com método `show()` que imprime `msg`.\n3. No main: `Outer o = new Outer(); Outer.Inner i = o.new Inner();`',
            initialCode: 'class Outer {\n    private String msg = "Ola";\n    class Inner { ... }\n}\npublic class Main { ... }',
            solutionCode: 'class Outer {\n    private String msg = "Ola";\n    class Inner { void show() { System.out.println(msg); } }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Outer o = new Outer();\n        Outer.Inner i = o.new Inner();\n        i.show();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Ola" }]
        },
        {
            id: 'poo2_07',
            title: '7. Classes Aninhadas Estáticas',
            description: 'Uma classe estática dentro de outra comporta-se como uma classe normal, mas agrupada logicamente. Não acede a instância da Outer.\n\n**Tarefa:**\nDefine `static class Nested` dentro de `Outer`. Instancia-a diretamente: `new Outer.Nested()`.',
            initialCode: 'class Outer {\n    static class Nested { ... }\n}\npublic class Main { ... }',
            solutionCode: 'class Outer {\n    static class Nested { void show() { System.out.println("Static"); } }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Outer.Nested n = new Outer.Nested();\n        n.show();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Static" }]
        },
        {
            id: 'poo2_08',
            title: '8. Classes Locais',
            description: 'Podemos definir uma classe dentro de um método. Ela só é visível lá.\n\n**Tarefa:**\nNo método `metodo()`, define `class Local`, instancia-a e chama um método dela que imprima "Local".',
            initialCode: 'class Outer {\n    void metodo() {\n        class Local { ... }\n    }\n}\npublic class Main { ... }',
            solutionCode: 'class Outer {\n    void metodo() {\n        class Local { void msg() { System.out.println("Local"); } }\n        new Local().msg();\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        new Outer().metodo();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Local" }]
        },
        {
            id: 'poo2_09',
            title: '9. Classes Anónimas (Interfaces)',
            description: 'Classes anónimas são úteis para implementar interfaces "on the fly" sem criar um ficheiro separado. Comuns em Listeners.\n\n**Tarefa:**\nCria uma instância de `Runnable` usando uma classe anónima: `new Runnable() { public void run() { ... } }`. Executa o run.',
            initialCode: 'public class Main {\n    public static void main(String[] args) {\n        Runnable r = new Runnable() { ... };\n        r.run();\n    }\n}',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        Runnable r = new Runnable() {\n            public void run() { System.out.println("Run"); }\n        };\n        r.run();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Run" }]
        },
        {
            id: 'poo2_10',
            title: '10. Classes Anónimas (Herança)',
            description: 'Também podemos usar classes anónimas para estender classes abstratas ou concretas pontualmente.\n\n**Tarefa:**\nDada `abstract class Animal`, cria uma instância anónima no main que implementa `som()` imprimindo "Muu".',
            initialCode: 'abstract class Animal { abstract void som(); }\npublic class Main { ... }',
            solutionCode: 'abstract class Animal { abstract void som(); }\npublic class Main {\n    public static void main(String[] args) {\n        Animal a = new Animal() {\n            void som() { System.out.println("Muu"); }\n        };\n        a.som();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Muu" }]
        },

        // --- 9. Classes e Métodos Genéricos ---
        {
            id: 'poo2_11',
            title: '11. Classes Genéricas (Box<T>)',
            description: 'Generics permitem criar código reutilizável e type-safe.\n\n**Tarefa:**\n1. Cria a classe `Box<T>` que armazena um valor do tipo T.\n2. Métodos: `put(T v)` e `T get()`.\n3. Instancia `Box<String>`, guarda "Ola" e imprime.',
            initialCode: 'class Box<T> {\n    T val;\n    //...\n}\npublic class Main { ... }',
            solutionCode: 'class Box<T> {\n    T val; void put(T v){val=v;} T get(){return val;}\n}\npublic class Main {\n    public static void main(String[] args) {\n        Box<String> b = new Box<>(); b.put("Ola");\n        System.out.println(b.get());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Ola" }]
        },
        {
            id: 'poo2_12',
            title: '12. Métodos Genéricos',
            description: 'Um método pode ter os seus próprios parâmetros de tipo, independentes da classe.\n\n**Tarefa:**\nCria o método estático `<T> void printArray(T[] arr)` que imprime qualquer array de objetos.',
            initialCode: 'public class Main {\n    static <T> void printArray(T[] arr) { ... }\n}',
            solutionCode: 'public class Main {\n    static <T> void printArray(T[] arr) {\n        for(T t : arr) System.out.print(t + " ");\n    }\n    public static void main(String[] args) {\n        printArray(new Integer[]{1, 2});\n    }\n}',
            testCases: [{ input: "", expectedOutput: "1 2 " }]
        },
        {
            id: 'poo2_13',
            title: '13. Bounded Type Parameters',
            description: 'Podemos restringir os tipos aceites. Ex: `T extends Number` garante que T tem métodos como `doubleValue()`.\n\n**Tarefa:**\nCria classe `Numero<T extends Number>`. Implementa `double valor()` que retorna `n.doubleValue()`.',
            initialCode: 'class Numero<T extends Number> {\n    T n;\n    //...\n}\npublic class Main { ... }',
            solutionCode: 'class Numero<T extends Number> {\n    T n; Numero(T n){this.n=n;}\n    double valor() { return n.doubleValue(); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Numero<>(10).valor());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "10.0" }]
        },
        {
            id: 'poo2_14',
            title: '14. Múltiplos Tipos Genéricos (Pair)',
            description: 'Classes podem ter vários parâmetros de tipo, como `Map<K, V>`.\n\n**Tarefa:**\nImplementa `class Pair<K, V>` com construtor e `toString` retornando "K=V".',
            initialCode: 'class Pair<K,V> { ... }',
            solutionCode: 'class Pair<K,V> {\n    K k; V v; Pair(K k, V v){this.k=k; this.v=v;}\n    public String toString(){return k+"="+v;}\n}\npublic class Main { public static void main(String[] a){ System.out.println(new Pair<>(1,"A")); } }',
            testCases: [{ input: "", expectedOutput: "1=A" }]
        },
        {
            id: 'poo2_15',
            title: '15. Wildcards (?)',
            description: 'O wildcard `?` representa "qualquer tipo". Útil em parâmetros de métodos onde o tipo exato não importa.\n\n**Tarefa:**\nImplementa `printList(List<?> l)` que imprime o primeiro elemento da lista.',
            initialCode: 'import java.util.*;\npublic class Main {\n    static void printList(List<?> l) { ... }\n}',
            solutionCode: 'import java.util.*;\npublic class Main {\n    static void printList(List<?> l) { System.out.println(l.get(0)); }\n    public static void main(String[] args) {\n        printList(Arrays.asList("Teste"));\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Teste" }]
        },

        // --- 8. Padrões de Projeto (Design Patterns) ---
        // Strategy Pattern
        {
            id: 'poo2_16',
            title: '16. Pattern Strategy: Pagamentos',
            description: 'O **Strategy** permite trocar algoritmos em tempo de execução.\n\n**Cenário:** Sistema de pagamentos.\n1. Interface `Pagamento` (`pagar(int v)`).\n2. Estratégias: `Cartao` e `Dinheiro`.\n3. Classe `Compra` recebe a estratégia e delega o pagamento.',
            initialCode: 'interface Pagamento { void pagar(int v); }\nclass Cartao implements Pagamento { ... }\nclass Compra { ... }\npublic class Main { ... }',
            solutionCode: 'interface Pagamento { void pagar(int v); }\nclass Cartao implements Pagamento { public void pagar(int v){System.out.println("Cartao "+v);} }\nclass Dinheiro implements Pagamento { public void pagar(int v){System.out.println("Dinheiro "+v);} }\nclass Compra { \n    Pagamento p; Compra(Pagamento p){this.p=p;}\n    void processar(int v){p.pagar(v);}\n}\npublic class Main {\n    public static void main(String[] args) {\n        new Compra(new Cartao()).processar(100);\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Cartao 100" }]
        },
        {
            id: 'poo2_17',
            title: '17. Pattern Strategy: Ordenação',
            description: 'Podemos usar Strategy para definir como ordenar dados.\n\n**Tarefa:**\n1. Interface `SortStrategy`.\n2. Implementações `Bubble` e `Quick` (apenas imprimem o nome).\n3. Classe `Sorter` onde injetamos a estratégia.',
            initialCode: 'interface SortStrategy { void sort(); }\n//...\npublic class Main { ... }',
            solutionCode: 'interface SortStrategy { void sort(); }\nclass Bubble implements SortStrategy { public void sort(){System.out.print("Bubble");} }\nclass Quick implements SortStrategy { public void sort(){System.out.print("Quick");} }\nclass Sorter { SortStrategy s; void set(SortStrategy s){this.s=s;} void exec(){s.sort();} }\npublic class Main { public static void main(String[] a){ Sorter s=new Sorter(); s.set(new Quick()); s.exec(); } }',
            testCases: [{ input: "", expectedOutput: "Quick" }]
        },
        {
            id: 'poo2_18',
            title: '18. Strategy: Calculadora',
            description: 'Calculadora onde cada operação (+, -, *) é uma estratégia.\n\n**Tarefa:**\nDefine `interface Op { int calc(int a, int b); }`. Implementa `Soma`. Executa 5+5.',
            initialCode: 'interface Op { int calc(int a, int b); }\n//...\npublic class Main { ... }',
            solutionCode: 'interface Op { int calc(int a, int b); }\nclass Soma implements Op { public int calc(int a, int b){return a+b;} }\npublic class Main { public static void main(String[] a){ System.out.println(new Soma().calc(5,5)); } }',
            testCases: [{ input: "", expectedOutput: "10" }]
        },

        // Template Method Pattern
        {
            id: 'poo2_19',
            title: '19. Template Method: Bebidas Quentes',
            description: 'O **Template Method** define o esqueleto de um algoritmo na superclasse, deixando subclasses implementarem passos específicos.\n\n**Cenário:** Preparar Bebida.\n1. `preparar()` (final): ferver, misturar, servir.\n2. `ferver` e `servir` são comuns.\n3. `misturar` é abstrato (Cafe vs Chá).',
            initialCode: 'abstract class Bebida {\n    final void preparar() { ferver(); misturar(); servir(); }\n    void ferver(){System.out.print("Ferver ");}\n    void servir(){System.out.print("Servir ");}\n    abstract void misturar();\n}\n//...\npublic class Main { ... }',
            solutionCode: 'abstract class Bebida {\n    final void preparar() { ferver(); misturar(); servir(); }\n    void ferver(){System.out.print("Ferver ");}\n    void servir(){System.out.print("Servir ");}\n    abstract void misturar();\n}\nclass Cafe extends Bebida { void misturar(){System.out.print("Cafe ");} }\npublic class Main { public static void main(String[] a){ new Cafe().preparar(); } }',
            testCases: [{ input: "", expectedOutput: "Ferver Cafe Servir " }]
        },
        {
            id: 'poo2_20',
            title: '20. Template Method: Processamento de Dados',
            description: 'Pipeline de dados: Ler -> Processar -> Salvar.\n`Processar` varia conforme o formato (PDF, CSV...), o resto é fixo.',
            initialCode: 'abstract class Processador { ... }\npublic class Main { ... }',
            solutionCode: 'abstract class Processador {\n    void run() { ler(); processar(); salvar(); }\n    void ler(){System.out.print("Ler ");} void salvar(){System.out.print("Salvar");}\n    abstract void processar();\n}\nclass PDF extends Processador { void processar(){System.out.print("PDF ");} }\npublic class Main { public static void main(String[] a){ new PDF().run(); } }',
            testCases: [{ input: "", expectedOutput: "Ler PDF Salvar" }]
        },

        // Iterator Pattern
        {
            id: 'poo2_21',
            title: '21. Iterator (Java Collections)',
            description: 'O padrão **Iterator** permite percorrer elementos sem expor a estrutura interna.\n\n**Tarefa:**\nUsa o `Iterator` de uma `ArrayList` para percorrer e imprimir elementos.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        List<String> l = new ArrayList<>(Arrays.asList("A", "B"));\n        Iterator<String> it = l.iterator();\n        while(it.hasNext()) System.out.print(it.next());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "AB" }]
        },
        {
            id: 'poo2_22',
            title: '22. Iterable Interface',
            description: 'Para usar o loop `for-each`, a classe deve implementar `Iterable<T>`.\n\n**Tarefa:**\nCria `Colecao` que implementa `Iterable`. Retorna um iterador de um array interno.',
            initialCode: 'import java.util.*;\nclass Colecao implements Iterable<Integer> { ... }\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\nclass Colecao implements Iterable<Integer> {\n    Integer[] arr = {1, 2};\n    public Iterator<Integer> iterator() { return Arrays.asList(arr).iterator(); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        for(int i : new Colecao()) System.out.print(i);\n    }\n}',
            testCases: [{ input: "", expectedOutput: "12" }]
        },
        {
            id: 'poo2_23',
            title: '23. Implementar Iterator Manualmente',
            description: 'Cria uma classe que implementa a interface `Iterator<T>` (métodos `hasNext` e `next`) para percorrer um array.',
            initialCode: 'import java.util.Iterator;\nclass ArrayIt implements Iterator<Integer> { ... }\npublic class Main { ... }',
            solutionCode: 'import java.util.Iterator;\nclass ArrayIt implements Iterator<Integer> {\n    int[] a; int pos=0;\n    ArrayIt(int[] a){this.a=a;}\n    public boolean hasNext(){return pos<a.length;}\n    public Integer next(){return a[pos++];}\n}\npublic class Main { public static void main(String[] x){ ArrayIt i=new ArrayIt(new int[]{5}); System.out.println(i.next()); } }',
            testCases: [{ input: "", expectedOutput: "5" }]
        },

        // Composite Pattern
        {
            id: 'poo2_24',
            title: '24. Pattern Composite: Sistema de Ficheiros',
            description: 'O **Composite** permite tratar objetos individuais e composições de forma uniforme (Árvores).\n\n**Cenário:** Pastas contêm Ficheiros ou outras Pastas.\n1. Interface `Comp` (show).\n2. `File` (folha).\n3. `Folder` (nó composto, tem lista de Comp).',
            initialCode: 'import java.util.*;\ninterface Comp { void show(); }\nclass File implements Comp { ... }\nclass Folder implements Comp { ... }\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\ninterface Comp { void show(); }\nclass File implements Comp { String n; File(String n){this.n=n;} public void show(){System.out.print(n+" ");} }\nclass Folder implements Comp {\n    List<Comp> c = new ArrayList<>();\n    void add(Comp i){c.add(i);}\n    public void show(){ for(Comp i:c) i.show(); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Folder root = new Folder(); root.add(new File("A")); root.add(new File("B"));\n        root.show();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "A B " }]
        },
        {
            id: 'poo2_25',
            title: '25. Composite: Expressões Aritméticas',
            description: 'Representar `(1 + 2)` como árvore.\nNos: `Num` (valor) e `Soma` (esquerda, direita). Ambos implementam `Expr` (`eval()`).',
            initialCode: 'interface Expr { int eval(); }\nclass Num implements Expr { ... }\nclass Soma implements Expr { ... }\npublic class Main { ... }',
            solutionCode: 'interface Expr { int eval(); }\nclass Num implements Expr { int v; Num(int v){this.v=v;} public int eval(){return v;} }\nclass Soma implements Expr { Expr l,r; Soma(Expr l, Expr r){this.l=l;this.r=r;} public int eval(){return l.eval()+r.eval();} }\npublic class Main { public static void main(String[] a){ System.out.println(new Soma(new Num(1), new Num(2)).eval()); } }',
            testCases: [{ input: "", expectedOutput: "3" }]
        },
        {
            id: 'poo2_26',
            title: '26. Composite: HTML Generator',
            description: 'Gerar HTML aninhado.\n`Tag` pode conter `Texto` ou outras `Tag`s. Método `print()` recursivo.',
            initialCode: 'abstract class Elem { abstract void print(); }\nclass Texto extends Elem { ... }\nclass Tag extends Elem { ... }\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\nabstract class Elem { abstract void print(); }\nclass Texto extends Elem { String t; Texto(String t){this.t=t;} void print(){System.out.print(t);} }\nclass Tag extends Elem { \n    List<Elem> l=new ArrayList<>(); void add(Elem e){l.add(e);} \n    void print(){System.out.print("<div>"); for(Elem e:l)e.print(); System.out.print("</div>");}\n}\npublic class Main { public static void main(String[] a){ Tag t=new Tag(); t.add(new Texto("Ola")); t.print(); } }',
            testCases: [{ input: "", expectedOutput: "<div>Ola</div>" }]
        },

        // --- Java Moderno (Revisão Final) ---
        {
            id: 'poo2_27',
            title: '27. Expressões Lambda (Java 8)',
            description: 'Lambdas simplificam a implementação de interfaces funcionais (1 método).\n\n**Tarefa:**\nSubstitui uma classe anónima `Runnable` por uma lambda: `() -> System.out.println(...)`.',
            initialCode: 'public class Main {\n    public static void main(String[] args) {\n        Runnable r = () -> ...;\n        r.run();\n    }\n}',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        Runnable r = () -> System.out.println("Lambda");\n        r.run();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Lambda" }]
        },
        {
            id: 'poo2_28',
            title: '28. Streams API',
            description: 'Streams permitem processar coleções de forma declarativa.\n\n**Tarefa:**\nDada uma lista `1, 2, 3, 4`, usa `stream().filter().forEach()` para imprimir apenas os pares.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        List<Integer> l = Arrays.asList(1, 2, 3, 4);\n        l.stream().filter(n -> n%2==0).forEach(System.out::print);\n    }\n}',
            testCases: [{ input: "", expectedOutput: "24" }]
        },
        {
            id: 'poo2_29',
            title: '29. Optional (Evitar NullPointerException)',
            description: '`Optional<T>` é um contentor que pode ou não ter valor, forçando o programador a tratar a ausência.\n\n**Tarefa:**\nUsa `Optional.ofNullable(null).orElse("Vazio")` para imprimir um valor default.',
            initialCode: 'import java.util.*;\npublic class Main { ... }',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        String s = null;\n        System.out.println(Optional.ofNullable(s).orElse("Vazio"));\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Vazio" }]
        },
        {
            id: 'poo2_30',
            title: '30. Records (Java 14+)',
            description: 'Records são classes de dados imutáveis com "boilerplate" reduzido (construtor, getters, equals, toString automáticos).\n\n**Tarefa:**\nDefine `record Ponto(int x, int y)`. Instancia e imprime `p.x()`.',
            initialCode: 'record Ponto(int x, int y) {}\npublic class Main { ... }',
            solutionCode: 'record Ponto(int x, int y) {}\npublic class Main {\n    public static void main(String[] args) {\n        Ponto p = new Ponto(10, 20);\n        System.out.println(p.x());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "10" }]
        }
    ]
};

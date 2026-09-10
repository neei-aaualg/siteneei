
import { Course } from '../types';

export const pooCourse: Course = {
    id: 'poo',
    name: 'Programação Orientada a Objetos',
    shortName: 'POO',
    language: 'java',
    exercises: [
        // --- 1. Princípios e Conceitos Fundamentais ---
        {
            id: 'poo_01',
            title: '1. A Primeira Classe e Objeto',
            description: 'Na Programação Orientada a Objetos (POO), uma **Classe** funciona como um molde ou planta, enquanto um **Objeto** é uma instância concreta desse molde.\n\n**Tarefa:**\n1. Define uma classe chamada `Pessoa`.\n2. Adiciona dois atributos públicos (campos): `nome` (do tipo String) e `idade` (do tipo int).\n3. Dentro da classe `Main`, no método `main`, cria (instancia) um objeto do tipo `Pessoa`.\n4. Atribui manualmente o nome "Ana" e a idade 20 aos atributos do objeto.\n5. Imprime os valores no formato: "Nome: [nome], Idade: [idade]".',
            initialCode: 'class Pessoa {\n    // Define os atributos aqui\n}\n\npublic class Main {\n    public static void main(String[] args) {\n        // Instancia a classe, define valores e imprime\n    }\n}',
            solutionCode: 'class Pessoa {\n    String nome; int idade;\n}\npublic class Main {\n    public static void main(String[] args) {\n        Pessoa p = new Pessoa();\n        p.nome = "Ana"; p.idade = 20;\n        System.out.println("Nome: " + p.nome + ", Idade: " + p.idade);\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Nome: Ana, Idade: 20" }]
        },
        {
            id: 'poo_02',
            title: '2. Construtores',
            description: 'Um **Construtor** é um método especial invocado quando criamos um objeto (`new`). Serve para inicializar o estado do objeto imediatamente.\n\n**Tarefa:**\n1. Cria uma classe `Carro` com os atributos `marca` e `modelo`.\n2. Define um construtor `Carro(String m, String mod)` que receba os valores e os atribua aos atributos da classe.\n3. Cria um método `detalhes()` que imprima "Marca Modelo" (separados por espaço).\n4. No `main`, cria um carro "Toyota Yaris" e chama o método `detalhes()`.',
            initialCode: 'class Carro {\n    String marca, modelo;\n    // Define o construtor aqui\n    \n    void detalhes() {\n        // Imprime\n    }\n}\npublic class Main { ... }',
            solutionCode: 'class Carro {\n    String marca, modelo;\n    Carro(String m, String mod) { marca=m; modelo=mod; }\n    void detalhes() { System.out.println(marca + " " + modelo); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Carro c = new Carro("Toyota", "Yaris");\n        c.detalhes();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Toyota Yaris" }]
        },
        {
            id: 'poo_03',
            title: '3. Encapsulamento (Getters e Setters)',
            description: 'O **Encapsulamento** diz que os dados internos de um objeto não devem ser acessíveis diretamente. Usamos modificadores como `private` e métodos de acesso (`get`/`set`) para controlar e validar os dados.\n\n**Tarefa:**\n1. Cria a classe `Conta` com um atributo `private double saldo`.\n2. Cria o método `setSaldo(double valor)`. Este método **só deve alterar o saldo se o valor for positivo**. Se for negativo, ignora a operação.\n3. Cria o método `getSaldo()` que retorna o saldo atual.\n4. Testa no `main`: tenta definir -100 (deve falhar) e depois 50 (deve funcionar). Imprime o saldo final.',
            initialCode: 'class Conta {\n    private double saldo;\n    // Implementa setSaldo com validação e getSaldo\n}\npublic class Main {\n    public static void main(String[] args) {\n        Conta c = new Conta();\n        c.setSaldo(-100);\n        c.setSaldo(50);\n        System.out.println(c.getSaldo());\n    }\n}',
            solutionCode: 'class Conta {\n    private double saldo;\n    public void setSaldo(double s) { if(s >= 0) saldo = s; }\n    public double getSaldo() { return saldo; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Conta c = new Conta();\n        c.setSaldo(-100); c.setSaldo(50);\n        System.out.println(c.getSaldo());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "50.0" }]
        },
        {
            id: 'poo_04',
            title: '4. Sobrecarga de Métodos (Overloading)',
            description: 'A **Sobrecarga** permite ter vários métodos com o mesmo nome na mesma classe, desde que a lista de parâmetros (assinatura) seja diferente.\n\n**Tarefa:**\n1. Cria a classe `Calc`.\n2. Implementa o método `int soma(int a, int b)`.\n3. Implementa uma sobrecarga `int soma(int a, int b, int c)`.\n4. No `main`, chama ambas as versões e imprime os resultados na mesma linha.',
            initialCode: 'class Calc {\n    // soma(int, int)\n    // soma(int, int, int)\n}\npublic class Main { ... }',
            solutionCode: 'class Calc {\n    int soma(int a, int b) { return a+b; }\n    int soma(int a, int b, int c) { return a+b+c; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Calc c = new Calc();\n        System.out.println(c.soma(2,3) + " " + c.soma(1,1,1));\n    }\n}',
            testCases: [{ input: "", expectedOutput: "5 3" }]
        },

        // --- 2. Modelação UML e 3. Projeto de Classes ---
        {
            id: 'poo_05',
            title: '5. Do UML para o Código: Classe Livro',
            description: 'Muitas vezes, a arquitetura é definida em diagramas UML antes de ser codificada. Implementa a seguinte especificação:\n\n**Classe Livro**\n- `titulo`: String\n- `paginas`: int\n- `Livro(String t, int p)`: Construtor\n- `isLongo()`: retorna `boolean`. (Verdadeiro se páginas > 300).\n\n**Tarefa:**\nImplementa a classe e testa com dois livros: um curto (100 págs) e um longo (500 págs).',
            initialCode: 'class Livro {\n    //...\n}\npublic class Main { ... }',
            solutionCode: 'class Livro {\n    String titulo; int paginas;\n    Livro(String t, int p) { titulo=t; paginas=p; }\n    boolean isLongo() { return paginas > 300; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Livro("A", 100).isLongo() + " " + new Livro("B", 500).isLongo());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "false true" }]
        },
        {
            id: 'poo_06',
            title: '6. Composição (Tem-Um)',
            description: 'A **Composição** define uma relação onde um objeto complexo é composto por outros objetos ("Tem-Um").\n\n**Tarefa:**\n1. Cria a classe `Motor` com atributo `potencia` (int).\n2. Cria a classe `Carro` que tem um atributo do tipo `Motor`.\n3. O construtor de `Carro` deve receber a potência e **instanciar** o `Motor` internamente.\n4. Cria um método `show()` em Carro que imprime a potência do motor.',
            initialCode: 'class Motor {\n    int pot;\n    Motor(int p){ pot=p; }\n}\n\nclass Carro {\n    Motor m;\n    // O construtor deve fazer: this.m = new Motor(p)...\n}\npublic class Main { ... }',
            solutionCode: 'class Motor { int pot; Motor(int p){pot=p;} }\nclass Carro {\n    Motor m;\n    Carro(int p) { m = new Motor(p); }\n    void show() { System.out.println(m.pot); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        new Carro(100).show();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "100" }]
        },
        {
            id: 'poo_07',
            title: '7. Membros Estáticos (Static)',
            description: 'Atributos `static` pertencem à classe e não a uma instância específica. São partilhados por todos os objetos.\n\n**Tarefa:**\n1. Cria uma classe `Contador` com um atributo `static int count = 0`.\n2. No construtor da classe, incrementa `count`.\n3. No `main`, cria 2 instâncias de `Contador`.\n4. Acede a `Contador.count` e imprime o valor (deve ser 2).',
            initialCode: 'class Contador {\n    static int count = 0;\n    // Construtor que incrementa count\n}\npublic class Main { ... }',
            solutionCode: 'class Contador {\n    static int count = 0;\n    Contador() { count++; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        new Contador(); new Contador();\n        System.out.println(Contador.count);\n    }\n}',
            testCases: [{ input: "", expectedOutput: "2" }]
        },
        {
            id: 'poo_08',
            title: '8. Métodos Utilitários (Static Methods)',
            description: 'Métodos estáticos podem ser chamados sem criar objetos da classe (ex: `Math.sqrt`). São úteis para funções utilitárias.\n\n**Tarefa:**\n1. Cria a classe `Util`.\n2. Define o método estático `boolean ehPar(int n)` que retorna true se N for par.\n3. No `main`, chama `Util.ehPar(4)` diretamente e imprime o resultado.',
            initialCode: 'class Util {\n    // static boolean ehPar...\n}\npublic class Main { ... }',
            solutionCode: 'class Util {\n    static boolean ehPar(int n) { return n%2==0; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(Util.ehPar(4));\n    }\n}',
            testCases: [{ input: "", expectedOutput: "true" }]
        },

        // --- 4. Herança, Polimorfismo e Binding ---
        {
            id: 'poo_09',
            title: '9. Herança Básica (Extends)',
            description: 'A **Herança** permite criar novas classes baseadas em classes existentes ("É-Um").\n\n**Tarefa:**\n1. Cria a classe `Animal` com o método `som()` que imprime "...".\n2. Cria a classe `Cao` que estende `Animal`.\n3. Sobrescreve (Override) o método `som()` em `Cao` para imprimir "Au".\n4. Instancia um `Cao` mas guarda-o numa variável do tipo `Animal` (Upcasting).\n5. Chama `som()`.',
            initialCode: 'class Animal {\n    void som() { System.out.print("..."); }\n}\nclass Cao extends Animal {\n    // Override som\n}\npublic class Main { ... }',
            solutionCode: 'class Animal {\n    void som() { System.out.print("..."); }\n}\nclass Cao extends Animal {\n    void som() { System.out.print("Au"); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Animal a = new Cao();\n        a.som();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Au" }]
        },
        {
            id: 'poo_10',
            title: '10. O Construtor da Superclasse (super)',
            description: 'Quando uma subclasse é instanciada, o construtor da superclasse deve ser executado primeiro. Usamos `super()` para isso.\n\n**Tarefa:**\n1. Classe `A`: construtor imprime "A".\n2. Classe `B` estende `A`: construtor chama `super()` e depois imprime "B".\n3. Instancia `B` e observa a ordem de execução.',
            initialCode: 'class A { ... }\nclass B extends A { ... }\npublic class Main { new B(); }',
            solutionCode: 'class A { A(){System.out.print("A");} }\nclass B extends A { B(){ super(); System.out.print("B");} }\npublic class Main {\n    public static void main(String[] args) {\n        new B();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "AB" }]
        },
        {
            id: 'poo_11',
            title: '11. Polimorfismo e Coleções',
            description: 'O **Polimorfismo** permite tratar objetos de diferentes subclasses de forma uniforme.\n\n**Tarefa:**\n1. Cria classe `Animal` com método `som()` vazio.\n2. `Cao` imprime "Au ", `Gato` imprime "Miau ".\n3. Cria um array `Animal[] zoo` contendo um Cao e um Gato.\n4. Usa um loop `for-each` para percorrer o array e chamar `som()` em cada elemento.',
            initialCode: 'class Animal { void som(){} }\nclass Cao extends Animal { ... }\nclass Gato extends Animal { ... }\npublic class Main { ... }',
            solutionCode: 'class Animal { void som(){} }\nclass Cao extends Animal { void som(){System.out.print("Au ");} }\nclass Gato extends Animal { void som(){System.out.print("Miau ");} }\npublic class Main {\n    public static void main(String[] args) {\n        Animal[] zoo = {new Cao(), new Gato()};\n        for(Animal a : zoo) a.som();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Au Miau " }]
        },
        {
            id: 'poo_12',
            title: '12. Classes Abstratas',
            description: 'Uma classe **Abstrata** não pode ser instanciada e pode conter métodos abstratos (sem corpo), obrigando as subclasses a implementá-los.\n\n**Tarefa:**\n1. Define `abstract class Forma` com `abstract double area()`.\n2. Cria a subclasse `Retangulo` que recebe largura e altura no construtor.\n3. Implementa `area()` no Retângulo.\n4. Calcula a área de um retângulo 5x2.',
            initialCode: 'abstract class Forma {\n    abstract double area();\n}\n//...\npublic class Main { ... }',
            solutionCode: 'abstract class Forma {\n    abstract double area();\n}\nclass Retangulo extends Forma {\n    int w, h; Retangulo(int w, int h){this.w=w; this.h=h;}\n    double area() { return w*h; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Forma f = new Retangulo(5, 2);\n        System.out.printf("%.0f", f.area());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "10" }]
        },
        {
            id: 'poo_13',
            title: '13. Classes e Métodos Finais',
            description: 'A palavra-chave `final` impede a herança (se usada na classe) ou a sobrescrita (se usada no método).\n\n**Tarefa:**\n1. Cria uma classe `final class Imutavel` com um método `msg()`.\n2. Tenta criar uma classe que estenda `Imutavel` (comentada porque daria erro de compilação).\n3. No main, apenas instancia a classe final e chama o método para provar que funciona como classe normal.',
            initialCode: 'final class Imutavel { }\n// class B extends Imutavel {} // Isto daria erro\npublic class Main { ... }',
            solutionCode: 'final class Imutavel { void msg(){System.out.println("OK");} }\npublic class Main {\n    public static void main(String[] args) {\n        new Imutavel().msg();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "OK" }]
        },
        {
            id: 'poo_14',
            title: '14. Binding Dinâmico (Runtime)',
            description: 'Em Java, as chamadas de método são resolvidas em tempo de execução (Dynamic Binding) com base no tipo real do objeto.\n\n**Tarefa:**\n1. `Classe A` tem método `m()` que imprime "A".\n2. `Classe B` estende `A` e sobrescreve `m()` imprimindo "B".\n3. `A obj = new B();`\n4. Chama `obj.m()`. Qual método é executado?',
            initialCode: 'class A { void m() { System.out.print("A"); } }\nclass B extends A { void m() { System.out.print("B"); } }\npublic class Main { ... }',
            solutionCode: 'class A { void m() { System.out.print("A"); } }\nclass B extends A { void m() { System.out.print("B"); } }\npublic class Main {\n    public static void main(String[] args) {\n        A obj = new B();\n        obj.m(); // Deve imprimir B\n    }\n}',
            testCases: [{ input: "", expectedOutput: "B" }]
        },
        {
            id: 'poo_15',
            title: '15. A Classe Object e toString()',
            description: 'Todas as classes em Java herdam de `Object`. O método `toString()` é usado para representar o objeto como texto.\n\n**Tarefa:**\n1. Na classe `Pessoa`, sobrescreve o método `public String toString()`.\n2. Deve retornar "Nome (Idade)".\n3. Ao fazer `System.out.println(pessoa)`, o Java chamará o teu método automaticamente.',
            initialCode: 'class Pessoa {\n    String nome="Ana"; int idade=20;\n    // Sobrescreve toString\n}\npublic class Main { ... }',
            solutionCode: 'class Pessoa {\n    String nome="Ana"; int idade=20;\n    public String toString() { return nome + " (" + idade + ")"; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Pessoa());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Ana (20)" }]
        },

        // --- 5. Interfaces ---
        {
            id: 'poo_16',
            title: '16. Introdução a Interfaces',
            description: 'Uma **Interface** é um contrato que define *o que* uma classe deve fazer, mas não *como*.\n\n**Tarefa:**\n1. Define a interface `Imprimivel` com o método `void imprimir()`.\n2. Cria a classe `Documento` que implementa essa interface.\n3. A implementação deve imprimir "Doc impresso".',
            initialCode: 'interface Imprimivel {\n    void imprimir();\n}\n//...\npublic class Main { ... }',
            solutionCode: 'interface Imprimivel { void imprimir(); }\nclass Documento implements Imprimivel {\n    public void imprimir() { System.out.println("Doc impresso"); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        new Documento().imprimir();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Doc impresso" }]
        },
        {
            id: 'poo_17',
            title: '17. Implementação Múltipla',
            description: 'Diferente das classes, uma classe pode implementar múltiplas interfaces.\n\n**Tarefa:**\n1. Interface `A` (metodo `ma()`) e Interface `B` (metodo `mb()`).\n2. Classe `C` implementa `A` e `B`.\n3. No main, chama ambos os métodos.',
            initialCode: 'interface A { void ma(); }\ninterface B { void mb(); }\nclass C implements A, B { ... }',
            solutionCode: 'interface A { void ma(); }\ninterface B { void mb(); }\nclass C implements A, B {\n    public void ma() { System.out.print("A"); }\n    public void mb() { System.out.print("B"); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        C c = new C(); c.ma(); c.mb();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "AB" }]
        },
        {
            id: 'poo_18',
            title: '18. Interface como Tipo de Dados',
            description: 'Podemos usar o nome da interface como tipo de variável ou argumento, permitindo desacoplamento.\n\n**Tarefa:**\n1. Interface `Movel` (`mover()`). `Carro` e `Pessoa` implementam-na.\n2. Cria um método estático `acao(Movel m)` que chama `m.mover()`.\n3. Passa instâncias de Carro e Pessoa para esse método.',
            initialCode: 'interface Movel { void mover(); }\n//...\npublic class Main { ... }',
            solutionCode: 'interface Movel { void mover(); }\nclass Carro implements Movel { public void mover(){System.out.print("Vrum ");} }\nclass Pessoa implements Movel { public void mover(){System.out.print("Andar ");} }\npublic class Main {\n    static void acao(Movel m) { m.mover(); }\n    public static void main(String[] args) {\n        acao(new Carro()); acao(new Pessoa());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Vrum Andar " }]
        },
        {
            id: 'poo_19',
            title: '19. Combinar Herança e Interfaces',
            description: 'Uma classe pode estender outra classe E implementar interfaces simultaneamente.\n\n**Tarefa:**\n1. `abstract class Veiculo` (atributo `marca`).\n2. `interface Eletrico` (metodo `carregar`).\n3. `class Tesla extends Veiculo implements Eletrico`.\n4. Implementa `carregar` imprimindo "[marca] a carregar".',
            initialCode: 'abstract class Veiculo { String marca; }\ninterface Eletrico { void carregar(); }\n//...\npublic class Main { ... }',
            solutionCode: 'abstract class Veiculo { String marca="Tesla"; }\ninterface Eletrico { void carregar(); }\nclass Tesla extends Veiculo implements Eletrico {\n    public void carregar() { System.out.println(marca + " a carregar"); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        new Tesla().carregar();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Tesla a carregar" }]
        },
        {
            id: 'poo_20',
            title: '20. Métodos Default (Java 8+)',
            description: 'Desde o Java 8, interfaces podem ter métodos com implementação padrão (`default`), evitando quebrar código existente ao adicionar novos métodos.\n\n**Tarefa:**\n1. Interface `I` com `default void msg() { print "Default" }`.\n2. Classe `C` implementa `I` mas NÃO sobrescreve o método.\n3. Chama o método numa instância de `C`.',
            initialCode: 'interface I { default void msg() { System.out.print("Default"); } }\nclass C implements I {}\npublic class Main { ... }',
            solutionCode: 'interface I { default void msg() { System.out.print("Default"); } }\nclass C implements I {}\npublic class Main {\n    public static void main(String[] args) {\n        new C().msg();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Default" }]
        },

        // --- 6. Gestão de Erros e Exceções (Intro) ---
        {
            id: 'poo_21',
            title: '21. Try-Catch: Aritmética',
            description: 'Exceções permitem lidar com erros em tempo de execução sem crashar o programa.\n\n**Tarefa:**\n1. Envolve uma divisão por zero num bloco `try`.\n2. Captura a `ArithmeticException` no bloco `catch`.\n3. No caso de erro, imprime "Erro" em vez de deixar o programa terminar abruptamente.',
            initialCode: 'public class Main {\n    public static void main(String[] args) {\n        int a=10, b=0;\n        // try catch aqui\n    }\n}',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        try {\n            int a=10, b=0;\n            System.out.println(a/b);\n        } catch(ArithmeticException e) {\n            System.out.println("Erro");\n        }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Erro" }]
        },
        {
            id: 'poo_22',
            title: '22. O Bloco Finally',
            description: 'O bloco `finally` é executado SEMPRE, ocorra erro ou não. É usado para limpeza de recursos.\n\n**Tarefa:**\n1. Lança propositadamente uma exceção no try.\n2. Captura-a e imprime "Catch ".\n3. No finally, imprime "Finally".',
            initialCode: 'public class Main {\n    public static void main(String[] args) {\n        try { throw new Exception(); }\n        catch(Exception e) { System.out.print("Catch "); }\n        finally { System.out.print("Finally"); }\n    }\n}',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        try { throw new Exception(); }\n        catch(Exception e) { System.out.print("Catch "); }\n        finally { System.out.print("Finally"); }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Catch Finally" }]
        },
        {
            id: 'poo_23',
            title: '23. A Keyword "throws"',
            description: 'Se um método pode lançar uma "Checked Exception", ele deve declarar isso na sua assinatura usando `throws`.\n\n**Tarefa:**\n1. Cria um método `risco()` que declara `throws IOException` e lança essa exceção.\n2. No `main`, chama `risco()` dentro de um try-catch para tratar o erro.',
            initialCode: 'import java.io.IOException;\npublic class Main {\n    static void risco() throws IOException { throw new IOException("IO"); }\n    public static void main(String[] args) {\n        // chame risco\n    }\n}',
            solutionCode: 'import java.io.IOException;\npublic class Main {\n    static void risco() throws IOException { throw new IOException("IO"); }\n    public static void main(String[] args) {\n        try { risco(); } catch(IOException e) { System.out.println(e.getMessage()); }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "IO" }]
        },
        {
            id: 'poo_24',
            title: '24. Múltiplos Blocos Catch',
            description: 'Podemos ter vários blocos catch para tratar diferentes tipos de erros de formas distintas.\n\n**Tarefa:**\n1. Tenta aceder ao tamanho de uma string nula (`null.length()`).\n2. Adiciona catch para `ArithmeticException` (imprime "Math").\n3. Adiciona catch para `NullPointerException` (imprime "Null").\nVerifica qual é executado.',
            initialCode: 'public class Main {\n    public static void main(String[] args) {\n        String s = null;\n        // Tenta s.length()\n    }\n}',
            solutionCode: 'public class Main {\n    public static void main(String[] args) {\n        String s = null;\n        try { System.out.println(s.length()); }\n        catch(ArithmeticException e) { System.out.print("Math"); }\n        catch(NullPointerException e) { System.out.print("Null"); }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Null" }]
        },
        {
            id: 'poo_25',
            title: '25. Input Invalido (Scanner)',
            description: 'Um erro comum é o utilizador introduzir texto quando se espera um número.\n\n**Tarefa:**\n1. Cria um Scanner inicializado com uma string "texto" (simulando input errado).\n2. Tenta fazer `nextInt()`.\n3. Captura a `InputMismatchException` e imprime "Invalido".',
            initialCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner("texto"); // Simula input errado\n        //...\n    }\n}',
            solutionCode: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner("texto");\n        try { int i = sc.nextInt(); }\n        catch(InputMismatchException e) { System.out.println("Invalido"); }\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Invalido" }]
        },

        // --- Exercícios de Consolidação ---
        {
            id: 'poo_26',
            title: '26. Casting de Objetos (Downcasting)',
            description: 'Para aceder a métodos específicos de uma subclasse quando temos uma referência da superclasse, precisamos de fazer casting explícito.\n\n**Tarefa:**\n1. `Animal a = new Cao()`. O método `ladrar()` só existe em `Cao`.\n2. Verifica se `a` é instância de Cao (`instanceof`).\n3. Faz o cast `((Cao)a).ladrar()`.',
            initialCode: 'class Animal {}\nclass Cao extends Animal { void ladrar(){System.out.println("Au");} }\npublic class Main { ... }',
            solutionCode: 'class Animal {}\nclass Cao extends Animal { void ladrar(){System.out.println("Au");} }\npublic class Main {\n    public static void main(String[] args) {\n        Animal a = new Cao();\n        if(a instanceof Cao) ((Cao)a).ladrar();\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Au" }]
        },
        {
            id: 'poo_27',
            title: '27. Comparação de Objetos (equals)',
            description: 'O operador `==` compara referências de memória. Para comparar conteúdo, devemos sobrescrever `equals()`.\n\n**Tarefa:**\nSobrescreve `equals` na classe `Ponto(x,y)` para retornar true se as coordenadas forem iguais, independentemente de serem objetos diferentes.',
            initialCode: 'class Ponto {\n    int x, y;\n    // equals\n}\npublic class Main { ... }',
            solutionCode: 'class Ponto {\n    int x, y; Ponto(int x, int y){this.x=x;this.y=y;}\n    public boolean equals(Object o) {\n        if(this==o) return true;\n        if(!(o instanceof Ponto)) return false;\n        Ponto p = (Ponto)o;\n        return x==p.x && y==p.y;\n    }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Ponto(1,1).equals(new Ponto(1,1)));\n    }\n}',
            testCases: [{ input: "", expectedOutput: "true" }]
        },
        {
            id: 'poo_28',
            title: '28. Tipos Enumerados (Enum)',
            description: 'Enums representam um conjunto fixo de constantes.\n\n**Tarefa:**\n1. Define `enum Dia { SEG, TER }`.\n2. Percorre todos os valores usando `Dia.values()` e imprime-os.',
            initialCode: 'enum Dia { ... }\npublic class Main { ... }',
            solutionCode: 'enum Dia { SEG, TER }\npublic class Main {\n    public static void main(String[] args) {\n        for(Dia d : Dia.values()) System.out.print(d + " ");\n    }\n}',
            testCases: [{ input: "", expectedOutput: "SEG TER " }]
        },
        {
            id: 'poo_29',
            title: '29. Associação Bidirecional',
            description: 'Modela uma relação onde A conhece B e B conhece A. \n\n**Tarefa:**\nClasses A e B. A tem método `setB`, B tem método `setA`. Instancia ambos e liga-os. Imprime "Link OK" se não houver erros (cuidado com recursão infinita no toString se o implementasses!).',
            initialCode: 'class A { B b; }\nclass B { A a; }\npublic class Main { ... }',
            solutionCode: 'class A { B b; void setB(B b){this.b=b;} }\nclass B { A a; void setA(A a){this.a=a;} }\npublic class Main {\n    public static void main(String[] args) {\n        A a = new A(); B b = new B();\n        a.setB(b); b.setA(a);\n        System.out.println("Link OK");\n    }\n}',
            testCases: [{ input: "", expectedOutput: "Link OK" }]
        },
        {
            id: 'poo_30',
            title: '30. Singleton (Padrão de Criação)',
            description: 'O Singleton garante que uma classe tem apenas uma instância.\n\n**Tarefa:**\n1. Classe `Config` com construtor privado.\n2. Atributo estático `instance`.\n3. Método estático `getInstance()` que cria a instância apenas se for null.\n4. Verifica se duas chamadas a `getInstance()` retornam o mesmo objeto (`==`).',
            initialCode: 'class Config {\n    private static Config instance;\n    private Config(){}\n    // getInstance\n}\npublic class Main { ... }',
            solutionCode: 'class Config {\n    private static Config instance;\n    private Config(){}\n    public static Config getInstance() { if(instance==null) instance=new Config(); return instance; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(Config.getInstance() == Config.getInstance());\n    }\n}',
            testCases: [{ input: "", expectedOutput: "true" }]
        }
    ]
};

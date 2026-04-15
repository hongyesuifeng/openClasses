# GDScript 编译器

> GDScript 编译器是 Godot 内置脚本语言的核心，负责将 .gd 源文件翻译为 GDScriptVM 可执行的字节码。本章深入分析编译器的四个阶段：词法分析、语法分析、语义分析和代码生成。

---

## 目录

- [1. 编译器总体架构](#1-编译器总体架构)
- [2. GDScriptLexer：词法分析](#2-gdscriptlexer词法分析)
- [3. GDScriptParser：语法分析](#3-gdscriptparser语法分析)
- [4. GDScriptAnalyzer：语义分析](#4-gdscriptanalyzer语义分析)
- [5. GDScriptCompiler：代码生成](#5-gdscriptcompiler代码生成)
- [6. 字节码格式详解](#6-字节码格式详解)
- [7. 源码导航](#7-源码导航)

---

## 1. 编译器总体架构

### 1.1 编译流水线

GDScript 编译器采用经典的多阶段编译架构，每个阶段处理一个独立关注点：

```
┌─────────────────────────────────────────────────────────────┐
│              GDScript 编译流水线                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  player.gd 源码文本                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ extends CharacterBody2D                              │   │
│  │                                                      │   │
│  │ var speed: float = 200.0                             │   │
│  │                                                      │   │
│  │ func _physics_process(delta: float) -> void:         │   │
│  │     var velocity = Vector2.ZERO                      │   │
│  │     if Input.is_action_pressed("move_right"):        │   │
│  │         velocity.x += speed * delta                  │   │
│  │     set_velocity(velocity)                           │   │
│  │     move_and_slide()                                 │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│    ┌────────────────────▼─────────────────────┐             │
│    │  Stage 1: GDScriptLexer (词法分析)        │             │
│    │  源码文本 → Token 列表                     │             │
│    │  文件: gdscript_tokenizer.h/cpp           │             │
│    └────────────────────┬─────────────────────┘             │
│                         │ Token 列表                         │
│    ┌────────────────────▼─────────────────────┐             │
│    │  Stage 2: GDScriptParser (语法分析)       │             │
│    │  Token 列表 → AST (抽象语法树)             │             │
│    │  文件: gdscript_parser.h/cpp              │             │
│    └────────────────────┬─────────────────────┘             │
│                         │ AST                                │
│    ┌────────────────────▼─────────────────────┐             │
│    │  Stage 3: GDScriptAnalyzer (语义分析)     │             │
│    │  AST → 标注后的 AST (类型检查 + 验证)      │             │
│    │  文件: gdscript_analyzer.h/cpp            │             │
│    └────────────────────┬─────────────────────┘             │
│                         │ 标注 AST                            │
│    ┌────────────────────▼─────────────────────┐             │
│    │  Stage 4: GDScriptCompiler (代码生成)     │             │
│    │  标注 AST → 字节码 (GDScriptFunction)     │             │
│    │  文件: gdscript_compiler.h/cpp            │             │
│    └────────────────────┬─────────────────────┘             │
│                         │                                   │
│                         ▼                                   │
│    ┌──────────────────────────────────────────┐             │
│    │  GDScript 对象 (可被 VM 执行)             │             │
│    │  ├── member_functions: HashMap            │             │
│    │  │   ("_physics_process" → GDScriptFunction) │         │
│    │  ├── constants: HashMap                   │             │
│    │  ├── members: Vector<MemberInfo>          │             │
│    │  └── signals: HashMap                     │             │
│    └──────────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 入口函数

编译的入口是 `GDScriptLanguage::_parse_script()` 或直接调用 `GDScript::reload()`：

```cpp
// modules/gdscript/gdscript.cpp (简化)
Error GDScript::reload(bool p_keep_state) {
    // 1. 读取源码
    String source = source_code;

    // 2. 解析
    GDScriptParser parser;
    Error err = parser.parse(source, path, false);
    if (err != OK) {
        // 报告语法错误
        _err_print_error(path, parser.get_errors());
        return err;
    }

    // 3. 分析
    GDScriptAnalyzer analyzer(&parser);
    err = analyzer.analyze();
    if (err != OK) {
        return err;
    }

    // 4. 编译
    GDScriptCompiler compiler;
    err = compiler.compile(&parser, this, p_keep_state);
    if (err != OK) {
        return err;
    }

    return OK;
}
```

---

## 2. GDScriptLexer：词法分析

### 2.1 Token 类型

词法分析器将源码文本拆分为 Token 流。GDScript 定义了丰富的 Token 类型：

```
GDScript Token 类别：

┌──────────────┬──────────────────────────────────────────────────┐
│  类别        │  Token 示例                                       │
├──────────────┼──────────────────────────────────────────────────┤
│ 关键字       │ var, const, func, class, extends, if, elif,     │
│              │ else, for, while, match, break, continue,       │
│              │ pass, return, enum, signal, await, self, super  │
│              │                                                  │
│ 类型关键字   │ int, float, bool, String, Vector2, Vector3,     │
│              │ Array, Dictionary, Color, void                   │
│              │                                                  │
│ 字面量       │ INTEGER (42), FLOAT (3.14), STRING ("hello"),   │
│              │ IDENTIFIER ("my_var"), TRUE, FALSE, NIL          │
│              │                                                  │
│ 运算符       │ +, -, *, /, %, =, ==, !=, <, >, <=, >=,        │
│              │ and, or, not, in, is,                           │
│              │ +=, -=, *=, /=, %=                              │
│              │ &, |, ^, ~, <<, >>                              │
│              │                                                  │
│ 分隔符       │ ( ) [ ] { } : , . .. -> => @ $                  │
│              │                                                  │
│ 特殊         │ NEWLINE (行尾), INDENT (缩进), DEDENT (反缩进),  │
│              │ EOF (文件结束), ANNOTATION (@export, @onready)    │
│              │                                                  │
│ 注释         │ 被跳过（不生成 Token）                             │
└──────────────┴──────────────────────────────────────────────────┘
```

### 2.2 词法分析过程

```
输入: var health: int = 100

词法分析器状态机：

Position 0:  'v'
  └── 进入标识符/关键字识别
  └── 'v' 'a' 'r' → 匹配关键字 "var"
  └── emit: Token(VAR, "var")
  └── advance(3)

Position 3:  ' '
  └── 跳过空白
  └── advance(1)

Position 4:  'h'
  └── 进入标识符识别
  └── 'h' 'e' 'a' 'l' 't' 'h'
  └── 不是关键字 → emit: Token(IDENTIFIER, "health")
  └── advance(6)

Position 10: ':'
  └── emit: Token(COLON, ":")
  └── advance(1)

Position 11: ' '
  └── 跳过空白
  └── advance(1)

Position 12: 'i'
  └── 'i' 'n' 't' → 匹配类型关键字
  └── emit: Token(TYPE_INT, "int")
  └── advance(3)

Position 15: ' '
  └── 跳过空白
  └── advance(1)

Position 16: '='
  └── emit: Token(ASSIGN, "=")
  └── advance(1)

Position 17: ' '
  └── 跳过空白
  └── advance(1)

Position 18: '1'
  └── 进入数字识别
  └── '1' '0' '0'
  └── emit: Token(CONSTANT, 100)   // Variant(int, 100)
  └── advance(3)

Position 21: '\n'
  └── emit: Token(NEWLINE)
  └── advance(1)

输出 Token 流:
[VAR] [IDENT:"health"] [COLON] [TYPE:int] [ASSIGN] [CONSTANT:100] [NEWLINE]
```

### 2.3 Python 风格的缩进处理

GDScript 采用 Python 风格的缩进语法，词法分析器需要处理 INDENT/DEDENT Token：

```
缩进处理机制：

源码：
func _ready():        ← 缩进级别 0
    var x = 10        ← 缩进级别 1 (4空格)
    if x > 5:         ← 缩进级别 1
        print(x)      ← 缩进级别 2 (8空格)
    print("done")     ← 缩进级别 1

词法分析器的缩进栈：
┌───────────────────────────────────┐
│ indent_stack: [0]   (初始)        │
│                                   │
│ 遇到 _ready() 行: 缩进=0         │
│   0 == stack.top → 不生成 INDENT  │
│                                   │
│ 遇到 "var x" 行: 缩进=4          │
│   4 > stack.top(0)               │
│   stack.push(4) → [0, 4]         │
│   emit: INDENT                    │
│                                   │
│ 遇到 "if x" 行: 缩进=4           │
│   4 == stack.top(4) → 不生成     │
│                                   │
│ 遇到 "print(x)" 行: 缩进=8       │
│   8 > stack.top(4)               │
│   stack.push(8) → [0, 4, 8]      │
│   emit: INDENT                    │
│                                   │
│ 遇到 "print(done)" 行: 缩进=4    │
│   4 < stack.top(8)               │
│   stack.pop() → [0, 4]           │
│   emit: DEDENT                    │
│                                   │
│ 文件结束:                         │
│   弹出所有剩余 → emit 对应 DEDENT │
│   stack.clear()                   │
└───────────────────────────────────┘
```

### 2.4 源码参考

```cpp
// modules/gdscript/gdscript_tokenizer.h (关键结构)
class GDScriptLexer {
    // ...
    struct Token {
        TokenType type;
        Variant value;         // 字面量值
        int line;              // 行号
        int column;            // 列号
        int end_line;          // 结束行号
        int end_column;        // 结束列号
    };

    // 核心方法
    Token scan();              // 扫描下一个 Token
    // 内部状态
    String source;             // 源码文本
    int position = 0;          // 当前位置
    int line = 1;              // 当前行号
    int column = 0;            // 当前列号
    Vector<int> indent_stack;  // 缩进栈
};
```

---

## 3. GDScriptParser：语法分析

### 3.1 AST 节点类型

语法分析器将 Token 流构建为抽象语法树（AST）。GDScript 定义了丰富的 AST 节点：

```
AST 节点层次结构 (GDScriptParser.h)：

GDScriptParser::Node (基类)
│
├── ClassNode                  ← 类声明 (extends, class_name)
│   ├── name
│   ├── extends                ← 继承的基类
│   ├── members[]              ← 成员列表
│   └── signals[]
│
├── FunctionNode               ← 函数声明
│   ├── name
│   ├── parameters[]
│   ├── return_type
│   └── body: BlockNode
│
├── VariableNode               ← 变量声明
│   ├── name
│   ├── type
│   ├── initializer: ExprNode
│   └── export/property info
│
├── ConstantNode               ← 常量声明
│
├── SignalNode                 ← 信号声明
│
├── EnumNode                   ← 枚举声明
│
├── AnnotationNode             ← 注解 (@export, @onready)
│
├── BlockNode                  ← 语句块
│   └── statements[]
│
├── IfNode                     ← if/elif/else
├── ForNode                    ← for-in 循环
├── WhileNode                  ← while 循环
├── MatchNode                  ← match 语句
├── BreakNode / ContinueNode   ← 循环控制
├── ReturnNode                 ← return
│
├── ExpressionNode (表达式基类)
│   ├── AssignNode             ← 赋值
│   ├── BinaryOpNode           ← 二元运算 (a + b)
│   ├── UnaryOpNode            ← 一元运算 (-a, not b)
│   ├── IdentifierNode         ← 标识符引用
│   ├── LiteralNode            ← 字面量 (42, "hello")
│   ├── CallNode               ← 函数调用
│   ├── GetNode                ← 属性访问 (obj.prop)
│   ├── SetNode                ← 属性设置
│   ├── SubscriptNode          ← 下标访问 (arr[i])
│   ├── ArrayNode              ← 数组构造 [1, 2, 3]
│   ├── DictionaryNode         ← 字典构造 {k: v}
│   ├── LambdaNode             ← lambda 函数
│   ├── AwaitNode              ← await 表达式
│   └── TypeCastNode           ← 类型转换 (x as int)
```

### 3.2 解析示例

```
解析 GDScript 代码：

func take_damage(amount: int) -> void:
    if amount > 0:
        health -= amount
        if health <= 0:
            health = 0
            die()

AST 结构：

FunctionNode
├── name: "take_damage"
├── parameters: [ParamNode("amount", type=int)]
├── return_type: void
└── body: BlockNode
    └── statements:
        └── IfNode
            ├── condition: BinaryOpNode(>)
            │   ├── left: IdentifierNode("amount")
            │   └── right: LiteralNode(0)
            ├── body: BlockNode
            │   ├── statements:
            │   │   └── AssignNode(-=)
            │   │       ├── target: IdentifierNode("health")
            │   │       └── value: IdentifierNode("amount")
            │   │   └── IfNode
            │   │       ├── condition: BinaryOpNode(<=)
            │   │       │   ├── left: IdentifierNode("health")
            │   │       │   └── right: LiteralNode(0)
            │   │       ├── body: BlockNode
            │   │       │   ├── AssignNode(=)
            │   │       │   │   ├── target: IdentifierNode("health")
            │   │       │   │   └── value: LiteralNode(0)
            │   │       │   └── CallNode
            │   │       │       ├── callee: IdentifierNode("die")
            │   │       │       └── args: []
```

### 3.3 运算符优先级解析

GDScript 使用 Pratt 解析器处理表达式优先级：

```
优先级从低到高：

┌──────────────┬─────────────────────────┬─────────────────────┐
│ 优先级       │ 运算符                   │ 结合性               │
├──────────────┼─────────────────────────┼─────────────────────┤
│ 1 (最低)     │ =, +=, -=, *=, /=      │ 右结合               │
│ 2            │ or                      │ 左结合               │
│ 3            │ and                     │ 左结合               │
│ 4            │ not                     │ 前缀                 │
│ 5            │ <, >, <=, >=, ==, !=   │ 左结合               │
│ 6            │ in, is, as              │ 左结合               │
│ 7            │ | (位或)                 │ 左结合               │
│ 8            │ ^ (位异或)              │ 左结合               │
│ 9            │ & (位与)                 │ 左结合               │
│ 10           │ <<, >>                 │ 左结合               │
│ 11           │ +, -                    │ 左结合               │
│ 12           │ *, /, %                │ 左结合               │
│ 13           │ -(负号), +(正号)        │ 前缀                 │
│ 14           │ ** (幂)                 │ 右结合               │
│ 15 (最高)    │ . (成员访问), []         │ 左结合               │
│              │ () (函数调用)           │                     │
└──────────────┴─────────────────────────┴─────────────────────┘

解析 1 + 2 * 3:

Pratt 解析过程：
1. 解析左侧主表达式 → Literal(1)
2. 看到 +，优先级 11
3. 递归解析右侧（最小优先级 12）
4. 解析主表达式 → Literal(2)
5. 看到 *，优先级 12 >= 12，继续
6. 解析右侧 → Literal(3)
7. 构建 BinaryOp(*, 2, 3)
8. 回到步骤 2，构建 BinaryOp(+, 1, 2*3)

结果 AST：
BinaryOp(+)
├── left:  Literal(1)
└── right: BinaryOp(*)
          ├── left:  Literal(2)
          └── right: Literal(3)
```

### 3.4 源码参考

```cpp
// modules/gdscript/gdscript_parser.h (关键方法)
class GDScriptParser {
    // 顶层解析
    Error parse(const String &p_source, const String &p_path, bool p_for_completion);

    // 声明解析
    ClassNode *parse_class();
    FunctionNode *parse_function();
    VariableNode *parse_variable();
    ConstantNode *parse_constant();
    SignalNode *parse_signal();
    EnumNode *parse_enum();

    // 语句解析
    Node *parse_statement();
    IfNode *parse_if();
    ForNode *parse_for();
    WhileNode *parse_while();
    MatchNode *parse_match();

    // 表达式解析 (Pratt Parser)
    ExpressionNode *parse_expression(int p_min_precedence = 0);
    ExpressionNode *parse_binary_op(ExpressionNode *p_left, int p_min_precedence);
    ExpressionNode *parse_primary_expression();
    ExpressionNode *parse_call(ExpressionNode *p_previous);
    ExpressionNode *parse_subscript(ExpressionNode *p_previous);

    // AST 和错误信息
    ClassNode *tree = nullptr;
    List<ParserError> errors;
};
```

---

## 4. GDScriptAnalyzer：语义分析

### 4.1 分析任务

语义分析器在 AST 上执行多种检查和标注：

```
┌─────────────────────────────────────────────────────────────┐
│                  语义分析任务                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 作用域与符号解析                                         │
│     ┌────────────────────────────────────────────────────┐  │
│     │ class Player:                                       │  │
│     │     var health: int = 100    ← 注册到类作用域       │  │
│     │                                                     │  │
│     │     func take_damage(amount):                       │  │
│     │         health -= amount     ← health: 类成员      │  │
│     │         var x = 42           ← x: 局部变量         │  │
│     │         print(y)             ← 错误: y 未定义       │  │
│     └────────────────────────────────────────────────────┘  │
│                                                             │
│  2. 类型检查                                                │
│     ┌────────────────────────────────────────────────────┐  │
│     │ var x: int = "hello"        ← 错误: 类型不匹配     │  │
│     │ var y = 42 + "hello"        ← 错误: int + String   │  │
│     │ var z: float = 10           ← OK: int 隐式转 float │  │
│     │ var arr: Array[int] = [1,2] ← 检查元素类型         │  │
│     └────────────────────────────────────────────────────┘  │
│                                                             │
│  3. 安全性检查                                              │
│     ┌────────────────────────────────────────────────────┐  │
│     │ var node: Node = null                                │  │
│     │ node.queue_free()            ← 警告: 可能为 null   │  │
│     │ if node:                                            │  │
│     │     node.queue_free()        ← OK: 有 null 检查    │  │
│     └────────────────────────────────────────────────────┘  │
│                                                             │
│  4. 函数签名验证                                             │
│     ┌────────────────────────────────────────────────────┐  │
│     │ func add(a: int, b: int) -> int:                    │  │
│     │     return a + b             ← OK                  │  │
│     │                                                     │  │
│     │ func bad() -> int:                                  │  │
│     │     pass                     ← 错告: 缺少返回值     │  │
│     └────────────────────────────────────────────────────┘  │
│                                                             │
│  5. 警告生成                                                │
│     ├── UNUSED_VARIABLE          未使用的变量              │
│     ├── UNUSED_PARAMETER         未使用的参数              │
│     ├── SHADOWED_VARIABLE        变量遮蔽                  │
│     ├── UNREACHABLE_CODE         不可达代码                │
│     ├── STANDALONE_EXPRESSION    无效的表达式语句          │
│     └── RETURN_VALUE_DISCARDED   忽略返回值                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 类型推断

GDScript 支持静态类型标注，分析器会尽可能推断类型：

```
类型推断规则：

1. 显式标注 → 使用标注类型
   var x: int = 42           → x: int
   var name: String = "hi"   → name: String

2. 初始值推断 → 从右侧推断
   var x = 42                → x: int (字面量)
   var v = Vector2(1, 2)     → v: Vector2 (构造函数)
   var arr = [1, 2, 3]       → arr: Array[int]

3. 函数返回推断 → 从 return 语句推断
   func get_value():
       return 42             → 返回类型: int

4. 表达式类型计算
   int + int         → int
   int * float       → float (隐式提升)
   Vector2 * float   → Vector2
   String + int      → String (自动转换)
   Node.get_child()  → Node (已知返回类型)
```

### 4.3 源码参考

```cpp
// modules/gdscript/gdscript_analyzer.h
class GDScriptAnalyzer {
    // 主入口
    Error analyze();

    // 声明分析
    void analyze_class(ClassNode *p_class);
    void analyze_function(FunctionNode *p_function);
    void analyze_variable(VariableNode *p_variable);
    void analyze_constant(ConstantNode *p_constant);

    // 语句分析
    void analyze_node(Node *p_node);
    void analyze_if(IfNode *p_node);
    void analyze_for(ForNode *p_node);
    void analyze_while(WhileNode *p_node);

    // 表达式类型解析
    void resolve_type(ExpressionNode *p_node);
    DataType resolve_datatype(TypeNode *p_type);
    bool is_type_compatible(const DataType &p_target, const DataType &p_source);

    // 作用域管理
    void push_scope();
    void pop_scope();
    void add_local(const StringName &p_name, const DataType &p_type);

    GDScriptParser *parser = nullptr;
};
```

---

## 5. GDScriptCompiler：代码生成

### 5.1 编译过程

编译器遍历分析后的 AST，为每个函数生成字节码：

```
┌─────────────────────────────────────────────────────────────┐
│                  代码生成过程                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  输入: 标注后的 AST                                          │
│                                                             │
│  1. 创建 GDScript 对象（如尚未创建）                          │
│     ├── 设置基类信息                                         │
│     ├── 收集成员变量信息                                     │
│     ├── 收集信号信息                                         │
│     └── 收集常量信息                                         │
│                                                             │
│  2. 编译类体                                                 │
│     ├── 遍历类成员                                           │
│     ├── 编译变量初始值                                       │
│     ├── 编译枚举和常量                                       │
│     └── 编译函数体                                           │
│                                                             │
│  3. 编译函数体                                               │
│     GDScriptCompiler::compile_function()                    │
│     ├── 创建代码生成器上下文 (CodeGen)                       │
│     ├── 分配局部变量槽位                                     │
│     ├── 遍历 AST 生成字节码                                  │
│     └── 创建 GDScriptFunction 对象                           │
│                                                             │
│  4. 生成 _init 函数（如果没有显式定义）                       │
│     ├── 收集所有成员变量的初始化表达式                        │
│     ├── 按声明顺序生成初始化代码                              │
│     └── 包含 @onready 变量（标记为延迟初始化）                │
│                                                             │
│  输出: GDScript 对象，包含所有编译后的函数                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 表达式编译

```
编译表达式示例：

GDScript: x + y * 2

AST:
BinaryOp(+)
├── left: Identifier("x")
└── right: BinaryOp(*)
          ├── left: Identifier("y")
          └── right: Literal(2)

编译过程（后序遍历）：

1. 编译 Identifier("x")
   → emit: OP_GET_LOCAL stack_slot_of_x

2. 编译 Identifier("y")
   → emit: OP_GET_LOCAL stack_slot_of_y

3. 编译 Literal(2)
   → emit: OP_CONSTANT index_of_2_in_constant_table

4. 编译 BinaryOp(*)
   → emit: OP_MULTIPLY

5. 编译 BinaryOp(+)
   → emit: OP_ADD

生成的字节码序列：
┌──────────┬────────────────────────────────────────────┐
│ 偏移     │ 指令                                        │
├──────────┼────────────────────────────────────────────┤
│ 0x00     │ OP_GET_LOCAL slot_x                        │
│ 0x03     │ OP_GET_LOCAL slot_y                        │
│ 0x06     │ OP_CONSTANT idx_2                          │
│ 0x09     │ OP_MULTIPLY                                │
│ 0x0A     │ OP_ADD                                     │
└──────────┴────────────────────────────────────────────┘

栈状态追踪：
指令执行后          栈内容
OP_GET_LOCAL x      [x_val]
OP_GET_LOCAL y      [x_val, y_val]
OP_CONSTANT 2       [x_val, y_val, 2]
OP_MULTIPLY         [x_val, y_val*2]
OP_ADD              [x_val + y_val*2]
```

### 5.3 控制流编译

```
if-else 语句编译：

GDScript:
if health > 0:
    take_damage(10)
else:
    die()

字节码生成：
┌──────────┬───────────────────────────────────────┐
│ 偏移     │ 指令                                   │
├──────────┼───────────────────────────────────────┤
│ 0x00     │ OP_GET_LOCAL slot_health              │
│ 0x03     │ OP_CONSTANT idx_0                     │
│ 0x06     │ OP_COMPARE GREATER                    │
│ 0x08     │ OP_JUMP_IF_FALSE 0x14    ← 跳到 else │
│          │                                       │
│          │ ;; if 块开始                           │
│ 0x0B     │ OP_GET_SELF             ;; self       │
│ 0x0E     │ OP_CONSTANT idx_10                    │
│ 0x11     │ OP_CALL_FUNC "take_damage" argc=1     │
│ 0x14     │ OP_JUMP 0x1A            ← 跳过 else  │
│          │                                       │
│          │ ;; else 块开始                         │
│ 0x17     │ OP_GET_SELF             ;; self       │
│ 0x1A     │ OP_CALL_FUNC "die" argc=0             │
│          │                                       │
│ 0x1E     │ ;; 后续代码...                         │
└──────────┴───────────────────────────────────────┘
```

### 5.4 函数调用编译

```
函数调用编译：

GDScript: result = obj.method(a, b, c)

字节码：
┌──────────┬────────────────────────────────────────┐
│ 偏移     │ 指令                                    │
├──────────┼────────────────────────────────────────┤
│ 0x00     │ OP_GET_LOCAL slot_obj                  │
│ 0x03     │ OP_GET_LOCAL slot_a                    │
│ 0x06     │ OP_GET_LOCAL slot_b                    │
│ 0x09     │ OP_GET_LOCAL slot_c                    │
│ 0x0C     │ OP_CALL_METHOD "method" argc=3         │
│ 0x10     │ OP_SET_LOCAL slot_result               │
└──────────┴────────────────────────────────────────┘

调用种类：

┌──────────────────┬────────────────────────────────────────┐
│ 调用类型          │ 指令 / 机制                             │
├──────────────────┼────────────────────────────────────────┤
│ 内置函数          │ OP_CALL_BUILT_IN                       │
│ (sin, len, ...)  │ 直接映射到 GDScript 内置函数表          │
│                  │                                        │
│ 成员方法          │ OP_CALL_METHOD                         │
│ (self.func())    │ 通过 ScriptInstance->call() 调用        │
│                  │                                        │
│ 其他对象方法      │ OP_CALL_METHOD                         │
│ (obj.func())     │ 通过 Object->call() 调用               │
│                  │                                        │
│ 静态方法          │ OP_CALL_STATIC                         │
│ (Class.func())   │ 查找类方法的静态版本                     │
│                  │                                        │
│ 超类方法          │ OP_CALL_SUPER                          │
│ (super.func())   │ 调用父类的脚本方法                       │
│                  │                                        │
│ Utility 函数     │ OP_CALL_UTILITY                        │
│ (type_convert)   │ Variant 的 utility 函数                 │
└──────────────────┴────────────────────────────────────────┘
```

---

## 6. 字节码格式详解

### 6.1 字节码存储结构

编译后的字节码存储在 `GDScriptFunction` 对象中：

```
GDScriptFunction 数据结构：

┌─────────────────────────────────────────────────────────────┐
│  GDScriptFunction                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  name: StringName          ← 函数名                         │
│  script: GDScript*         ← 所属脚本                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  字节码 (Vector<uint8_t>)                              │  │
│  │  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐  │  │
│  │  │ 0x0 │ 0x1 │ 0x2 │ 0x3 │ 0x4 │ 0x5 │ 0x6 │ ... │  │  │
│  │  │opcode│ arg │ arg │opcode│ arg │opcode│ ... │     │  │  │
│  │  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘  │  │
│  │                                                       │  │
│  │  每条指令：                                            │  │
│  │  ┌─────────────┬──────────────────┐                   │  │
│  │  │ 操作码      │ 操作数 (0~4字节)  │                   │  │
│  │  │ (1-4字节)   │ 根据指令类型变化   │                   │  │
│  │  └─────────────┴──────────────────┘                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  constants: Vector<Variant>  ← 常量表                       │
│  ├── [0] = 42                                               │
│  ├── [1] = "hello"                                          │
│  └── [2] = Vector2(1, 0)                                    │
│                                                             │
│  argument_count: int        ← 参数数量                      │
│  stack_size: int            ← 所需栈大小                    │
│  line_info: Map<addr, int>  ← 地址→行号映射（调试用）       │
│                                                              │
│  debug_info:                                                │
│  ├── 总指令数                                               │
│  ├── 分支数量                                               │
│  └── 函数复杂度评估                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 操作码定义

```
关键操作码定义 (modules/gdscript/gdscript_function.h)：

┌──────────────────┬──────────────────────────────────────────┐
│  操作码           │  语义                                    │
├──────────────────┼──────────────────────────────────────────┤
│                  │  常量与栈操作                              │
│ OP_CONSTANT      │  将常量压栈（索引到常量表）                │
│ OP_CONSTANT_NIL  │  将 nil 压栈                              │
│ OP_CONSTANT_TRUE │  将 true 压栈                             │
│ OP_CONSTANT_FALSE│  将 false 压栈                            │
│ OP_POP           │  弹出栈顶                                 │
│ OP_DUP           │  复制栈顶                                 │
│                  │                                          │
│                  │  变量访问                                  │
│ OP_GET_LOCAL     │  读取局部变量                              │
│ OP_SET_LOCAL     │  设置局部变量                              │
│ OP_GET_MEMBER    │  读取成员变量（通过 ScriptInstance）       │
│ OP_SET_MEMBER    │  设置成员变量                              │
│ OP_GET_GLOBAL    │  读取全局（AutoLoad 等）                  │
│                  │                                          │
│                  │  算术运算                                  │
│ OP_ADD           │  栈顶两个值相加                            │
│ OP_SUBTRACT      │  减法                                     │
│ OP_MULTIPLY      │  乘法                                     │
│ OP_DIVIDE        │  除法                                     │
│ OP_NEGATE        │  取负                                     │
│ OP_MODULE        │  取模                                     │
│                  │                                          │
│                  │  比较运算                                  │
│ OP_EQUAL         │  相等比较                                  │
│ OP_NOT_EQUAL     │  不等比较                                  │
│ OP_LESS          │  小于                                     │
│ OP_LESS_EQUAL    │  小于等于                                  │
│ OP_GREATER       │  大于                                     │
│ OP_GREATER_EQUAL │  大于等于                                  │
│                  │                                          │
│                  │  控制流                                    │
│ OP_JUMP          │  无条件跳转                                │
│ OP_JUMP_IF       │  条件为真跳转                              │
│ OP_JUMP_IF_NOT   │  条件为假跳转                              │
│ OP_JUMP_BACK     │  向后跳转（用于循环）                      │
│ OP_RETURN        │  函数返回                                  │
│                  │                                          │
│                  │  函数调用                                  │
│ OP_CALL          │  调用函数                                  │
│ OP_CALL_METHOD   │  调用对象方法                              │
│ OP_CALL_BUILT_IN │  调用内建函数                              │
│ OP_CALL_SUPER    │  调用父类方法                              │
│                  │                                          │
│                  │  协程                                      │
│ OP_AWAIT         │  挂起协程等待信号                          │
│ OP_YIELD         │  产生值（已弃用）                          │
└──────────────────┴──────────────────────────────────────────┘
```

---

## 7. 源码导航

### 关键文件列表

| 文件 | 路径 | 说明 |
|------|------|------|
| 词法分析器 | `modules/gdscript/gdscript_tokenizer.h` | Token 定义与扫描 |
| 语法分析器 | `modules/gdscript/gdscript_parser.h` | AST 节点定义与解析 |
| 语义分析器 | `modules/gdscript/gdscript_analyzer.h` | 类型检查与验证 |
| 编译器 | `modules/gdscript/gdscript_compiler.h` | AST 到字节码 |
| 字节码定义 | `modules/gdscript/gdscript_function.h` | 操作码与函数结构 |
| GDScript 主类 | `modules/gdscript/gdscript.h` | GDScript 脚本对象 |

### 阅读建议

```
推荐阅读路径：

1. modules/gdscript/gdscript_tokenizer.h
   → 了解 Token 类型定义

2. modules/gdscript/gdscript_parser.h
   → 重点看 AST 节点定义（搜索 "struct XXXNode"）
   → 了解 parse_expression() 的 Pratt 解析实现

3. modules/gdscript/gdscript_analyzer.h
   → 了解类型系统 (DataType 枚举)
   → 看 reduce_expression() 的类型推断

4. modules/gdscript/gdscript_compiler.h
   → 看 code_gen_functions() 的代码生成逻辑
   → 对比操作码定义理解字节码

5. modules/gdscript/gdscript_function.h
   → 查看完整的操作码枚举
   → 理解字节码的内存布局
```

---

## 小结

| 编译阶段 | 输入 | 输出 | 关键数据结构 |
|----------|------|------|------------|
| 词法分析 | 源码文本 | Token 流 | Token{type, value, line} |
| 语法分析 | Token 流 | AST | ClassNode, FunctionNode, ... |
| 语义分析 | AST | 标注 AST | DataType, 符号表 |
| 代码生成 | 标注 AST | 字节码 | GDScriptFunction, 操作码序列 |

GDScript 编译器是理解脚本系统的基础。四个阶段各有独立职责，通过清晰的数据结构（Token、AST、字节码）传递信息，这种模块化设计使得每个阶段可以独立开发和测试。

---

## 下一步

理解编译器后，继续学习 [02-GDScript 虚拟机](./02-gdscript-vm.md)，了解字节码是如何被执行的。

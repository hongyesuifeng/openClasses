# 技术原理：脚本系统

> 在阅读 Godot 脚本系统源码之前，先理解编译原理基础、虚拟机原理、脚本语言抽象接口以及 GDExtension 扩展机制的设计动机与技术原理。

---

## 目录

- [1. 编译原理基础](#1-编译原理基础)
- [2. 虚拟机原理](#2-虚拟机原理)
- [3. 脚本语言接口](#3-脚本语言接口)
- [4. GDExtension vs Module](#4-gdextension-vs-module)
- [5. 热重载原理](#5-热重载原理)

---

## 1. 编译原理基础

### 编译器的一般架构

脚本语言的编译器将人类可读的源代码翻译为可执行的指令。这个过程通常分为多个阶段：

```
┌─────────────────────────────────────────────────────────────┐
│                    编译器流水线 (Compiler Pipeline)           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   源代码文本                                                 │
│   "var x = 42"                                              │
│       │                                                     │
│       ▼                                                     │
│  ┌─────────────┐                                            │
│  │  词法分析    │  Lexical Analysis / Tokenization           │
│  │  (Lexer)    │  字符流 → Token 流                          │
│  └──────┬──────┘                                            │
│         │  [VAR] [IDENT:"x"] [ASSIGN] [INT:42]              │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  语法分析    │  Syntax Analysis / Parsing                 │
│  │  (Parser)   │  Token 流 → AST（抽象语法树）               │
│  └──────┬──────┘                                            │
│         │    VariableDecl                                   │
│         │    ├── name: "x"                                  │
│         │    └── value: Literal(42)                         │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  语义分析    │  Semantic Analysis                         │
│  │ (Analyzer)  │  类型检查、作用域解析、错误检测              │
│  └──────┬──────┘                                            │
│         │  类型标注、符号表验证                               │
│         ▼                                                   │
│  ┌─────────────┐                                            │
│  │  代码生成    │  Code Generation                           │
│  │ (Compiler)  │  AST → 字节码 / 机器码                     │
│  └──────┬──────┘                                            │
│         │  OP_ASSIGN address:"x", value:42                  │
│         ▼                                                   │
│     字节码输出                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.1 词法分析 (Lexing)

词法分析器（Lexer / Tokenizer / Scanner）将字符流拆分为有意义的 Token：

```
输入: var health: int = 100

词法分析过程：

位置 0:   'v' 'a' 'r'  → 识别为关键字 → Token(KEYWORD, "var")
位置 4:   ' '           → 跳过空白
位置 5:   'h' 'e' 'a' 'l' 't' 'h'  → 识别为标识符 → Token(IDENTIFIER, "health")
位置 11:  ':'           → Token(COLON)
位置 13:  'i' 'n' 't'   → 识别为类型 → Token(TYPE, "int")
位置 16:  '='           → Token(ASSIGN)
位置 18:  '1' '0' '0'   → 识别为整数 → Token(INT_LITERAL, 100)

输出 Token 流：
[VAR] [IDENT:"health"] [COLON] [TYPE:int] [ASSIGN] [INT:100]
```

关键概念：
- **Token**：最小的语法单元，包含类型和值
- **关键字识别**：`var`、`func`、`if`、`for` 等保留字
- **字面量解析**：整数、浮点数、字符串等常量
- **空白与注释处理**：跳过无效内容

### 1.2 语法分析 (Parsing)

语法分析器（Parser）根据语法规则将 Token 流组织为抽象语法树（AST）：

```
输入 Token 流：
[FUNC] [IDENT:"take_damage"] [LPAREN] [IDENT:"amount"] [COLON] [TYPE:int]
[RPAREN] [ARROW] [TYPE:void] [COLON]
[IF] [IDENT:"amount"] [GT] [INT:0] [COLON]
[IDENT:"health"] [MINUS_ASSIGN] [IDENT:"amount"]

语法分析过程（递归下降解析）：

AST 输出：
FunctionDecl
├── name: "take_damage"
├── parameters: [Param("amount", int)]
├── return_type: void
└── body: Block
    └── IfStmt
        ├── condition: BinaryOp(>, Ident("amount"), Literal(0))
        └── body: Assign(-=, Ident("health"), Ident("amount"))
```

常见的解析策略：

| 策略 | 说明 | 优缺点 |
|------|------|--------|
| 递归下降 | 每个语法规则对应一个函数 | 直观易读，左递归需特殊处理 |
| 运算符优先 | Pratt 解析器处理表达式 | 表达式解析高效 |
| LL(k) | 从左到右，前看 k 个 Token | 自顶向下，适合手写解析器 |
| LR/LALR | 从左到右，归约 | 自底向上，通常工具生成 |

GDScript 使用**递归下降解析器**，辅以 Pratt 解析器处理表达式优先级。

### 1.3 语义分析 (Analysis)

语义分析器在 AST 上执行各种验证：

```
语义分析检查项：

1. 类型检查
   ── "x" + 42  → 错误：不能将 String 和 int 相加
   ── var a: int = "hello"  → 错误：类型不匹配

2. 作用域检查
   ── 访问未声明的变量 → 错误
   ── 变量重复声明 → 错误
   ── 正确的局部/全局作用域

3. 控制流检查
   ── return 类型是否匹配函数签名
   ── 是否所有分支都有返回值
   ── break/continue 是否在循环中

4. 类属性检查
   ── super() 调用是否在构造函数中
   ── @onready 变量的使用限制
   ── 枚举和常量的正确性
```

### 1.4 代码生成 (Code Generation)

代码生成器遍历 AST 并输出目标代码：

```
AST 节点到字节码的映射：

var x = 42
  → OP_CONSTANT index_of(42)    // 将常量 42 压入栈
  → OP_ASSIGN address_of("x")   // 存储到变量 x

var y = x + 10
  → OP_LOAD_LOCAL address_of("x")   // 加载 x
  → OP_CONSTANT index_of(10)        // 压入 10
  → OP_ADD                          // 弹出两个值，压入结果
  → OP_ASSIGN address_of("y")       // 存储到 y

if x > 0:
  → OP_LOAD_LOCAL address_of("x")
  → OP_CONSTANT index_of(0)
  → OP_COMPARE GREATER
  → OP_JUMP_IF_FALSE end_label
  ... if body ...
  end_label:
```

---

## 2. 虚拟机原理

### 2.1 什么是虚拟机

虚拟机（Virtual Machine, VM）是一个软件模拟的计算机，它执行编译器生成的字节码（Bytecode）。字节码是一种中间表示，比源代码更紧凑，比机器码更可移植。

```
┌─────────────────────────────────────────────────────────────┐
│                  虚拟机类型对比                               │
├──────────────────┬──────────────────────────────────────────┤
│   基于栈的 VM    │           基于寄存器的 VM                 │
├──────────────────┼──────────────────────────────────────────┤
│                  │                                          │
│  操作数在栈上     │  操作数在寄存器中                          │
│                  │                                          │
│  ADD 指令：      │  ADD R1, R2, R3 指令：                   │
│  ┌──────────┐   │  ┌──────────┐                            │
│  │   ...    │   │  │ R1=R2+R3 │                            │
│  │   b      │   │  └──────────┘                            │
│  │   a      │   │                                          │
│  └──────────┘   │  指令较长但总数较少                         │
│       ↓ ADD     │                                          │
│  ┌──────────┐   │  代表：Lua 5.0+                           │
│  │ a + b    │   │                                          │
│  └──────────┘   │                                          │
│                  │                                          │
│  指令短小紧凑     │                                          │
│  代表：JVM,      │                                          │
│        GDScript  │                                          │
│        Python    │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### 2.2 基于栈的虚拟机

GDScript 使用基于栈的虚拟机。操作数通过压栈（Push）和弹栈（Pop）传递：

```
计算 (3 + 4) * 2 的执行过程：

指令                    栈状态
─────────────────      ──────────
OP_CONSTANT 3          [3]
OP_CONSTANT 4          [3, 4]
OP_ADD                 [7]         ← 弹出 3 和 4，压入 7
OP_CONSTANT 2          [7, 2]
OP_MULTIPLY            [14]        ← 弹出 7 和 2，压入 14

特点：
- 指令不需要指定操作数位置（隐含在栈顶）
- 指令编码紧凑（通常只需操作码 + 可选参数）
- 自然支持嵌套表达式
- 不需要寄存器分配算法
```

### 2.3 字节码格式

字节码由以下部分组成：

```
┌─────────────────────────────────────────────────────────────┐
│                    字节码文件结构                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  文件头 (Header)                        │ │
│  │  魔数 + 版本号 + 校验信息                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              常量表 (Constants Table)                   │ │
│  │  整数、浮点数、字符串等编译期常量                          │ │
│  │                                                        │ │
│  │  [0]  Integer: 42                                     │ │
│  │  [1]  String:  "player"                               │ │
│  │  [2]  Float:   3.14                                   │ │
│  │  [3]  String:  "health"                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              标识符表 (Identifiers Table)               │ │
│  │  变量名、函数名、类名等标识符                             │ │
│  │                                                        │ │
│  │  [0]  "x"                                             │ │
│  │  [1]  "health"                                        │ │
│  │  [2]  "take_damage"                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              行号表 (Line Table)                        │ │
│  │  字节码偏移 → 源码行号的映射                              │ │
│  │  用于调试和错误报告                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              函数体 (Function Bodies)                   │ │
│  │  每个函数的字节码序列                                    │ │
│  │                                                        │ │
│  │  _init():                                              │ │
│  │    0x00: OP_CONSTANT 0    // 42                       │ │
│  │    0x02: OP_ASSIGN 0      // x                        │ │
│  │    0x04: OP_RETURN                                    │ │
│  │                                                        │ │
│  │  take_damage():                                        │ │
│  │    0x00: OP_LOAD_LOCAL 1  // amount                   │ │
│  │    0x02: OP_CONSTANT 1    // 0                        │ │
│  │    0x04: OP_COMPARE GT                                │ │
│  │    0x06: OP_JUMP_IF_FALSE 0x12                        │ │
│  │    ...                                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 指令集设计

虚拟机的指令集定义了所有可执行的操作：

```
GDScript 指令集类别：

┌──────────────┬─────────────────────────────────────────────┐
│   类别       │  典型指令                                    │
├──────────────┼─────────────────────────────────────────────┤
│ 栈操作       │ OP_CONSTANT, OP_POP, OP_DUP                │
│ 变量访问     │ OP_LOAD_LOCAL, OP_STORE_LOCAL               │
│              │ OP_LOAD_MEMBER, OP_STORE_MEMBER             │
│ 算术运算     │ OP_ADD, OP_SUB, OP_MUL, OP_DIV, OP_MOD     │
│ 位运算       │ OP_BIT_AND, OP_BIT_OR, OP_BIT_XOR          │
│ 比较运算     │ OP_EQUAL, OP_LESS, OP_GREATER              │
│ 逻辑运算     │ OP_AND, OP_OR, OP_NOT                      │
│ 控制流       │ OP_JUMP, OP_JUMP_IF_FALSE, OP_JUMP_BACK    │
│ 函数调用     │ OP_CALL, OP_CALL_BUILT_IN, OP_RETURN       │
│ 类型操作     │ OP_TYPE_CAST, OP_IS_TYPE                   │
│ 迭代器       │ OP_ITERATE_BEGIN, OP_ITERATE               │
│ 协程         │ OP_AWAIT, OP_YIELD                         │
└──────────────┴─────────────────────────────────────────────┘
```

### 2.5 执行循环

虚拟机的核心是一个取指-译码-执行循环（Fetch-Decode-Execute Cycle）：

```
┌─────────────────────────────────────────────────────────────┐
│                    VM 执行循环                               │
│                                                             │
│         ┌──────────────────────────┐                        │
│         │    加载函数字节码          │                        │
│         │    设置指令指针 IP = 0    │                        │
│         │    初始化栈帧             │                        │
│         └────────────┬─────────────┘                        │
│                      │                                      │
│         ┌────────────▼─────────────┐                        │
│    ┌───►│  FETCH: 取指令            │                        │
│    │    │  opcode = bytecode[IP++] │                        │
│    │    └────────────┬─────────────┘                        │
│    │                 │                                      │
│    │    ┌────────────▼─────────────┐                        │
│    │    │  DECODE: 解码操作数       │                        │
│    │    │  读取参数（如常量索引）   │                        │
│    │    └────────────┬─────────────┘                        │
│    │                 │                                      │
│    │    ┌────────────▼─────────────┐                        │
│    │    │  EXECUTE: 执行操作       │                        │
│    │    │  根据操作码执行对应逻辑   │                        │
│    │    │  操作栈上的数据           │                        │
│    │    └────────────┬─────────────┘                        │
│    │                 │                                      │
│    │    ┌────────────▼─────────────┐                        │
│    │    │  检查是否到达函数末尾     │                        │
│    │    └──┬──────────┬────────────┘                        │
│    │       │ 未结束    │ 已结束                              │
│    │       │          │                                    │
│    └───────┘     ┌────▼─────────┐                          │
│                  │  RETURN       │                          │
│                  │  弹出返回值    │                          │
│                  │  恢复调用者栈帧│                          │
│                  └──────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 脚本语言接口

### 3.1 ScriptLanguage 抽象

Godot 设计了 `ScriptLanguage` 抽象接口，允许引擎同时支持多种脚本语言：

```
┌─────────────────────────────────────────────────────────────┐
│              ScriptLanguage 抽象接口                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ScriptLanguage（抽象基类）                                   │
│  ├── get_name()           → "GDScript" / "C#"               │
│  ├── get_type()           → Script 类型                     │
│  ├── get_recognized_extensions() → [".gd"] / [".cs"]       │
│  ├── validate()           → 验证脚本语法                     │
│  ├── get_global_class_name() → 获取全局类名                  │
│  ├── find_function()      → 查找函数位置                     │
│  ├── make_template()      → 创建脚本模板                     │
│  ├── init()               → 语言初始化                       │
│  ├── finish()             → 语言清理                         │
│  ├── get_built_in_docs()  → 内建文档                         │
│  ├── debug_*()            → 调试接口                         │
│  └── reload_*()           → 热重载接口                       │
│                                                             │
│  具体实现：                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ GDScriptLanguage │  │  C# Language     │                │
│  │ (modules/        │  │  (modules/       │                │
│  │  gdscript/)      │  │   mono/)         │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Script 与 ScriptInstance

`Script` 是脚本资源的基类，`ScriptInstance` 是脚本实例的运行时表示：

```
脚本实例化过程：

  GDScript 资源 (Script 对象)
  ┌─────────────────────────────┐
  │  字节码                      │
  │  常量表                      │
  │  方法签名表                  │
  │  属性列表                    │
  │  信号列表                    │
  └──────────┬──────────────────┘
             │  Node.set_script(script)
             │
             ▼
  创建 ScriptInstance (PlaceHolderScriptInstance / GDScriptInstance)
  ┌─────────────────────────────┐
  │  指向 owner (C++ Object)     │
  │  指向 script (GDScript)      │
  │  成员变量值表                 │
  │                              │
  │  接口方法：                   │
  │  ├── set() / get()          │
  │  ├── call()                 │
  │  ├── notification()         │
  │  ├── get_script_type()      │
  │  └── get_property_list()    │
  └──────────┬──────────────────┘
             │
             ▼
  C++ Object (如 Node)
  ┌─────────────────────────────┐
  │  script_instance 指针        │──► 指向上方 ScriptInstance
  │                              │
  │  当调用 script_method():     │
  │  1. 查找 script_instance    │
  │  2. 调用 script_instance    │
  │     ->call("method", args)  │
  │  3. GDScriptVM 执行字节码   │
  └─────────────────────────────┘
```

### 3.3 多语言共存机制

```
Godot 中的脚本语言共存：

┌─────────────────────────────────────────────────────────────┐
│                  ScriptServer (脚本管理器)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  languages: Vector<ScriptLanguage*>                         │
│  ┌───────┬──────────────────────────────────────────────┐  │
│  │ [0]   │ GDScriptLanguage                              │  │
│  │       │  - 默认内置语言                                │  │
│  │       │  - .gd 文件                                   │  │
│  │       │  - 编译为字节码，VM 执行                       │  │
│  ├───────┼──────────────────────────────────────────────┤  │
│  │ [1]   │ C# Language (如果启用)                         │  │
│  │       │  - 需要 .NET 模块                              │  │
│  │       │  - .cs 文件                                   │  │
│  │       │  - 编译为 IL，Mono/NET 运行时执行               │  │
│  ├───────┼──────────────────────────────────────────────┤  │
│  │ [2]   │ GDExtensionLanguage                           │  │
│  │       │  - 原生扩展语言                                │  │
│  │       │  - .gdextension 文件                           │  │
│  │       │  - 直接调用 C/C++/Rust 动态库                  │  │
│  └───────┴──────────────────────────────────────────────┘  │
│                                                             │
│  语言查找流程：                                               │
│  1. 根据文件扩展名匹配语言                                    │
│  2. .gd → GDScriptLanguage                                  │
│  3. .cs → C# Language                                       │
│  4. 根据 .gdextension 文件加载 GDExtension                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. GDExtension vs Module

### 4.1 两种扩展方式对比

Godot 提供了两种主要的扩展方式，各有适用场景：

```
┌─────────────────────────────────────────────────────────────┐
│              Module vs GDExtension 对比                      │
├───────────────────┬──────────────────┬──────────────────────┤
│                   │    Module        │   GDExtension        │
├───────────────────┼──────────────────┼──────────────────────┤
│ 编译方式          │ 编译进引擎       │ 独立编译为动态库       │
│                   │ (静态链接)       │ (.so / .dll / .dylib) │
│                   │                  │                      │
│ 发布方式          │ 随引擎一起       │ 独立发布              │
│                   │ 需要自定义构建   │ 无需重新编译引擎      │
│                   │                  │                      │
│ 版本兼容          │ 紧耦合           │ 版本化 API 接口       │
│                   │ 同版本必须重编译 │ 有一定前向兼容性       │
│                   │                  │                      │
│ 性能              │ 最高             │ 接近原生              │
│                   │ 无 FFI 开销      │ 极小的 FFI 开销       │
│                   │                  │                      │
│ 访问引擎内部      │ 完全访问         │ 仅通过公共 API        │
│                   │ 可用私有 API     │ 受限于暴露的接口      │
│                   │                  │                      │
│ 开发语言          │ C++              │ C/C++, Rust, Swift,  │
│                   │                  │ D, 以及任何可调用 C   │
│                   │                  │ ABI 的语言            │
│                   │                  │                      │
│ 适用场景          │ 引擎核心功能     │ 游戏专用模块          │
│                   │ 通用功能         │ 第三方库集成          │
│                   │ 提交给官方       │ 闭源商业插件          │
│                   │                  │                      │
│ 典型示例          │ GDScript, Mono, │ 事项: godot-rust,    │
│                   │ Bullet, OpenXR  │ godot-cpp, SQLite    │
└───────────────────┴──────────────────┴──────────────────────┘
```

### 4.2 Module 机制

Module 是编译进引擎的扩展模块，位于 `modules/` 目录：

```
modules/ 目录结构：

modules/
├── gdscript/          ← GDScript 脚本语言（作为一个 Module）
│   ├── config.py      ← SCons 构建配置
│   ├── gdscript.h
│   ├── gdscript_parser.h
│   ├── gdscript_compiler.h
│   ├── gdscript_vm.h
│   └── ...
├── mono/              ← C# 支持
├── bullet/            ← Bullet 物理
├── openxr/            ← OpenXR VR 支持
├── gltf/              ← glTF 导入/导出
├── regex/             ← 正则表达式
├── jsonrpc/           ← JSON-RPC（语言服务器协议）
└── ...                ← 更多可选模块

Module 注册流程：
1. 每个模块包含 register_types.h/cpp
2. 在 register_types.cpp 中：
   - initialize_module() → 注册类、创建 Server
   - uninitialize_module() → 清理资源
3. SCons 构建系统自动扫描 modules/ 目录
4. 可通过 module_*=no 禁用特定模块
```

### 4.3 GDExtension 架构

GDExtension 通过 C ABI 接口加载动态库：

```
┌─────────────────────────────────────────────────────────────┐
│                  GDExtension 加载流程                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  .gdextension 文件（INI 格式）                                │
│  ┌───────────────────────────────────────┐                  │
│  │ [configuration]                       │                  │
│  │ entry_symbol = "example_library_init" │                  │
│  │ compatibility_minimum = 4.2           │                  │
│  │                                       │                  │
│  │ [libraries]                           │                  │
│  │ linux.debug.x86_64 = "lib/example.linux.debug.x86_64.so"│
│  │ linux.release.x86_64 = "lib/example.linux.release.x86_64.so"│
│  │ windows.debug.x86_64 = "lib/example.windows.debug.x86_64.dll"│
│  │ macos.debug.arm64 = "lib/example.macos.debug.arm64.dylib"│
│  └───────────────────┬───────────────────┘                  │
│                      │                                      │
│                      ▼                                      │
│  GDExtensionManager 加载                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. 解析 .gdextension 文件                              │  │
│  │ 2. 根据平台/架构选择对应的动态库                         │  │
│  │ 3. dlopen/LoadLibrary 加载动态库                        │  │
│  │ 4. 查找 entry_symbol 函数（如 example_library_init）    │  │
│  │ 5. 调用入口函数，传递 GDExtensionInterface 结构体       │  │
│  │ 6. 入口函数返回 GDExtensionClassLibrary 结构体          │  │
│  │ 7. 扩展注册其类、方法、属性                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

入口函数签名（C ABI）：

GDExtensionBool example_library_init(
    const GDExtensionInterface *p_interface,   // 引擎提供的 API 函数表
    const GDExtensionClassLibraryPtr p_library, // 类库指针
    GDExtensionInitialization *r_initialization // 扩展初始化信息
);

GDExtensionInterface 包含数百个函数指针：
├── 内存管理：mem_alloc, mem_free, mem_realloc
├── 对象操作：object_get_instance, object_set_instance
├── 类注册：classdb_register_class, classdb_register_method
├── Variant 操作：variant_new, variant_destroy, variant_call
├── 字符串操作：string_new, string_to_utf8
├── 数组操作：array_new, array_append, array_get
├── 节点树操作：node_add_child, node_remove_child
└── ... 更多引擎 API
```

---

## 5. 热重载原理

### 5.1 为什么需要热重载

热重载（Hot Reload）允许开发者在游戏运行时修改脚本并立即生效，无需重启游戏：

```
开发体验对比：

无热重载：
  修改代码 → 停止运行 → 重新编译 → 重新启动 → 回到修改点 → 测试
  耗时：30秒 ~ 数分钟

有热重载：
  修改代码 → 保存 → 自动重载 → 立即测试
  耗时：< 1秒
```

### 5.2 热重载实现机制

```
┌─────────────────────────────────────────────────────────────┐
│                    热重载流程                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 检测文件变更                                             │
│     ResourceFileSystem::scan() 检测 .gd 文件修改时间变更      │
│     │                                                       │
│     ▼                                                       │
│  2. 重新编译脚本                                             │
│     GDScriptLanguage::reload_script(script)                  │
│     ├── 重新词法分析                                         │
│     ├── 重新语法分析                                         │
│     ├── 重新语义分析                                         │
│     └── 重新编译为字节码                                     │
│     │                                                       │
│     ▼                                                       │
│  3. 替换字节码                                               │
│     GDScript 对象的字节码指针更新为新编译结果                   │
│     旧的 GDScriptFunction 对象被替换                          │
│     │                                                       │
│     ▼                                                       │
│  4. 迁移实例状态                                             │
│     遍历所有使用该脚本的 ScriptInstance                       │
│     ├── 保留匹配的成员变量值                                  │
│     ├── 新增的变量使用默认值                                  │
│     ├── 删除的变量被移除                                     │
│     └── 类型变更的变量尝试转换或使用默认值                     │
│     │                                                       │
│     ▼                                                       │
│  5. 恢复信号连接                                             │
│     重新建立脚本中定义的信号连接                               │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  关键设计决策：                                          │ │
│  │                                                        │ │
│  │  - Script 对象不变（保持引用）                           │ │
│  │  - 内部字节码替换                                       │ │
│  │  - ScriptInstance 不重建（保持 Object 关联）             │ │
│  │  - 成员变量平滑迁移                                     │ │
│  │  - 正在执行的函数完成当前调用后再更新                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 热重载的限制

```
可以热重载：
  ✅ 函数体的修改
  ✅ 新增/删除函数
  ✅ 新增/删除变量
  ✅ 信号声明修改
  ✅ 导出属性修改

不能热重载：
  ❌ 类继承关系变更（extends 换了基类）
  ❌ 类名变更
  ❌ @icon 修改（需要重启编辑器）
  ❌ 静态变量初始化（某些边界情况）

需要注意：
  ⚠️ 正在 await 的协程不会中断
  ⚠️ _ready() 不会重新调用
  ⚠️ @onready 变量不会重新初始化
  ⚠️ 导出的枚举类型变更可能丢失值
```

---

## 源码导航

### 核心源码文件

| 阶段 | 文件 | 说明 |
|------|------|------|
| 脚本语言接口 | `core/object/script_language.h` | ScriptLanguage 抽象定义 |
| 脚本基类 | `core/object/script.h` | Script 资源基类 |
| 脚本服务器 | `core/object/script_language.cpp` | ScriptServer 实现 |
| 词法分析 | `modules/gdscript/gdscript_tokenizer.h` | GDScript 词法分析器 |
| 语法分析 | `modules/gdscript/gdscript_parser.h` | GDScript 语法分析器 |
| 语义分析 | `modules/gdscript/gdscript_analyzer.h` | GDScript 语义分析器 |
| 编译器 | `modules/gdscript/gdscript_compiler.h` | GDScript 字节码编译器 |
| 虚拟机 | `modules/gdscript/gdscript_vm.h` | GDScript 字节码执行引擎 |
| 扩展接口 | `core/extension/gdextension.h` | GDExtension C 接口 |
| 扩展管理 | `core/extension/gdextension_manager.h` | 扩展加载与管理 |

### 推荐阅读顺序

```
1. core/object/script_language.h        → 理解脚本语言抽象
2. core/object/script.h                 → 理解 Script 资源
3. modules/gdscript/gdscript.h          → GDScript 整体结构
4. modules/gdscript/gdscript_tokenizer.h → 词法分析
5. modules/gdscript/gdscript_parser.h   → 语法分析
6. modules/gdscript/gdscript_analyzer.h → 语义分析
7. modules/gdscript/gdscript_compiler.h → 编译器
8. modules/gdscript/gdscript_vm.h       → 虚拟机
9. core/extension/gdextension.h         → 扩展机制
```

---

## 小结

| 概念 | 核心思想 | Godot 实现 |
|------|----------|-----------|
| 编译原理 | 源码 → Token → AST → 字节码 | GDScript 四阶段编译器 |
| 虚拟机 | 基于栈的字节码执行引擎 | GDScriptVM |
| 语言抽象 | ScriptLanguage 接口统一多语言 | ScriptServer 管理多语言 |
| 原生扩展 | C ABI 动态库加载 | GDExtension |
| 模块扩展 | 编译期静态集成 | modules/ 目录 |
| 热重载 | 运行时替换字节码，保持实例 | GDScriptLanguage::reload_script |

---

## 下一步

理解技术原理后，继续学习 [01-GDScript 编译器](./01-gdscript-compiler.md)，深入了解 GDScript 从源码到字节码的完整编译流程。

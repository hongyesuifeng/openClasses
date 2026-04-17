# 脚本系统

脚本系统是 Godot 引擎与开发者交互最频繁的子系统。Godot 4.x 内置 GDScript 语言，并通过 ScriptLanguage 抽象接口支持多种脚本语言。GDExtension 机制则允许开发者使用 C/C++、Rust 等原生语言编写高性能扩展模块。

## 目录

- **[00-技术原理](./00-technical-principles.md) - 编译原理、虚拟机原理、脚本语言接口、GDExtension vs Module、热重载（建议首先阅读）**
- [01-GDScript 编译器](./01-gdscript-compiler.md) - Lexer、Parser、Analyzer、Compiler，从源码到字节码
- [02-GDScript 虚拟机](./02-gdscript-vm.md) - GDScriptVM 执行引擎、函数调用、协程与 await
- [03-GDExtension 机制](./03-gdextension.md) - C 接口扩展、类注册、生命周期管理、性能对比

---

## 核心概念

### 脚本系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                      脚本系统架构                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           ScriptLanguage 抽象接口                      │  │
│  │  get_name() / get_type() / get_recognized_extensions() │  │
│  │  get_global_class_name() / validate() / ...           │  │
│  └─────────────┬──────────────┬─────────────────────────┘  │
│                │              │                             │
│     ┌──────────┘     ┌────────┘          ┌──────────┐      │
│     ▼                ▼                   ▼          │      │
│ ┌──────────┐  ┌──────────────┐  ┌────────────────┐  │      │
│ │GDScript  │  │GDScriptNative│  │GDExtension     │  │      │
│ │Language  │  │Language(已弃 │  │Language        │  │      │
│ │          │  │用)            │  │                │  │      │
│ └────┬─────┘  └──────────────┘  └───────┬────────┘  │      │
│      │                                  │            │      │
│      ▼                                  ▼            │      │
│ ┌──────────────────┐           ┌──────────────────┐  │      │
│ │ GDScript 编译器   │           │ GDExtension API  │  │      │
│ │ Lexer → Parser   │           │ C FFI 接口       │  │      │
│ │ → Analyzer       │           │                  │  │      │
│ │ → Compiler       │           │ 动态库加载       │  │      │
│ └────────┬─────────┘           └────────┬─────────┘  │      │
│          │                              │            │      │
│          ▼                              │            │      │
│ ┌──────────────────┐                    │            │      │
│ │ GDScript VM      │                    │            │      │
│ │ 基于栈的字节码    │                    │            │      │
│ │ 虚拟机           │                    │            │      │
│ └──────────────────┘                    │            │      │
│                                        │            │      │
├────────────────────────────────────────┼────────────┼──────┤
│              C++ Object 系统            │            │      │
│  Object → ScriptInstance 桥接          │            │      │
│  属性绑定 / 方法绑定 / 信号绑定         ◄────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 脚本执行流程

```
脚本加载与执行流程：

ResourceLoader::load("player.gd")
    │
    ▼
GDScriptLanguage::get_script()  ──► 创建 GDScript 对象
    │
    ├── 源码加载
    │   └── 读取 .gd 文件文本内容
    │
    ▼
GDScriptLexer::tokenize()  ──► 词法分析，生成 Token 流
    │
    ▼
GDScriptParser::parse()  ──► 语法分析，构建 AST
    │
    ▼
GDScriptAnalyzer::analyze()  ──► 语义分析，类型检查
    │
    ▼
GDScriptCompiler::compile()  ──► 生成字节码
    │
    ▼
GDScript 对象就绪（包含字节码和元数据）
    │
    ├── 节点关联：Node.set_script(gd_script)
    │   └── 创建 ScriptInstance（C++ Object ↔ 脚本 桥梁）
    │
    ▼
运行时执行：GDScriptVM::call_function()
    │
    ├── 从字节码加载指令
    ├── 操作栈进行计算
    ├── 方法调用通过 ScriptInstance 桥接
    └── await 创建协程（GDScriptFunctionState）
```

---

## 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| ScriptLanguage | `core/object/script_language.h` | 脚本语言抽象接口 |
| Script | `core/object/script.h` | 脚本资源基类 |
| GDScriptLanguage | `modules/gdscript/gdscript.h` | GDScript 语言实现 |
| GDScriptLexer | `modules/gdscript/gdscript_tokenizer.h` | 词法分析器 |
| GDScriptParser | `modules/gdscript/gdscript_parser.h` | 语法分析器 |
| GDScriptAnalyzer | `modules/gdscript/gdscript_analyzer.h` | 语义分析器 |
| GDScriptCompiler | `modules/gdscript/gdscript_compiler.h` | 字节码编译器 |
| GDScriptVM | `modules/gdscript/gdscript_vm.h` | GDScript 虚拟机 |
| GDExtension | `core/extension/gdextension.h` | 原生扩展接口 |
| GDExtensionManager | `core/extension/gdextension_manager.h` | 扩展管理器 |

---

## 学习目标

完成本章节后，你将能够：

1. 理解编译原理在脚本系统中的应用（词法分析、语法分析、代码生成）
2. 掌握 GDScript 从源码到字节码的完整编译流程
3. 理解基于栈的虚拟机的执行模型和指令系统
4. 理解 ScriptInstance 如何桥接 C++ 对象与脚本
5. 掌握 GDExtension 的架构设计与使用场景
6. 理解热重载的实现原理
7. 能够阅读和修改 Godot 脚本系统相关的 C++ 源码

---

## 预计时间

- 技术原理：1-2 天
- GDScript 编译器：1-2 天
- GDScript 虚拟机：1-2 天
- GDExtension 机制：1 天

**总计：4-7 天**

---

## 导航

| 上一章 | 下一章 |
|--------|--------|
| [资源管理](../05-asset-management/README.md) | [编辑器与扩展](../07-editor-extension/README.md) |

---

## 下一步

准备好后，从 [00-技术原理](./00-technical-principles.md) 开始学习。

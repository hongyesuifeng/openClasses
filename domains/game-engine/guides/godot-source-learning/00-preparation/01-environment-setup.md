# 环境配置

本文档介绍如何搭建 Godot 4.x 引擎源码的阅读和调试环境。Godot 使用 SCons 作为构建系统，用 C++ 编写核心代码，因此环境配置与传统的 Web 项目有显著不同。

## 目录

- [系统要求](#系统要求)
- [获取源码](#获取源码)
- [编译引擎](#编译引擎)
- [关键编译参数](#关键编译参数)
- [IDE 配置](#ide-配置)
- [调试配置](#调试配置)
- [创建测试项目](#创建测试项目)
- [常见问题](#常见问题)

---

## 系统要求

### 必需软件

| 软件 | 版本要求 | 说明 | 安装方式 |
|------|----------|------|----------|
| **Python** | >= 3.6 | SCons 构建系统的运行时 | 系统包管理器或 python.org |
| **SCons** | >= 4.0 | Godot 的构建系统（Python 实现） | `pip install scons` |
| **C++ 编译器** | 视平台 | 编译引擎源码 | 见下表 |
| **Git** | 最新版 | 版本控制 | 系统包管理器 |

### 各平台 C++ 编译器要求

| 平台 | 推荐编译器 | 最低版本 | 安装方式 |
|------|-----------|----------|----------|
| **Linux** | GCC 或 Clang | GCC 9+, Clang 10+ | `sudo apt install build-essential` |
| **Windows** | MSVC (Visual Studio) | VS 2019 16+ | 安装 Visual Studio（含 C++ 桌面开发工作负载） |
| **macOS** | Clang (Xcode) | Xcode 12+ | `xcode-select --install` |
| **Android (交叉编译)** | Android NDK | NDK r23+ | 通过 Android Studio SDK Manager |

### 推荐软件

| 软件 | 用途 |
|------|------|
| VSCode | 推荐的源码阅读 IDE（配合 C++ 扩展） |
| GDB / LLDB | 调试引擎 |
| ccache | 加速重复编译 |
| clangd | 更好的代码补全和导航（替代 VSCode C++ 扩展） |

---

## 获取源码

### 方式一：克隆 GitHub 仓库（推荐）

```bash
# 克隆 Godot 引擎仓库
git clone https://github.com/godotengine/godot.git

# 进入目录
cd godot

# 切换到 4.x 稳定分支（推荐）
git checkout 4.x-stable

# 或者切换到特定版本标签
git checkout godot-4.3-stable
```

### 方式二：下载压缩包

1. 访问 [Godot Engine GitHub Releases](https://github.com/godotengine/godot/releases)
2. 下载最新 4.x 稳定版的 Source Code (zip 或 tar.gz)
3. 解压到本地目录

### 方式三：使用 GitHub CLI

```bash
# 安装 gh CLI 后
gh repo clone godotengine/godot
cd godot
git checkout 4.x-stable
```

> **建议**：使用 `4.x-stable` 分支而非 `master` 分支。`4.x-stable` 是最新的稳定版本，代码更可靠；`master` 是开发分支，可能有未完成的改动。

---

## 编译引擎

### 安装 SCons

```bash
# 使用 pip 安装 SCons
pip install scons

# 验证安装
scons --version
# 应该输出 SCons 版本号，如 SCons 4.7.0
```

### Linux 编译

```bash
# 编译 Debug 编辑器版本（推荐用于源码学习）
scons platform=linuxbsd dev_build=yes -j$(nproc)

# 如果使用 Clang
scons platform=linuxbsd dev_build=yes use_llvm=yes -j$(nproc)
```

编译完成后，可执行文件位于 `bin/` 目录：

```bash
./bin/godot.linuxbsd.editor.dev.x86_64
```

### Windows 编译

```bash
# 在 Developer Command Prompt for VS 中执行
scons platform=windows dev_build=yes -j%NUMBER_OF_PROCESSORS%

# 编译产物
bin\godot.windows.editor.dev.x86_64.exe
```

### macOS 编译

```bash
scons platform=macos dev_build=yes -j$(sysctl -n hw.logicalcpu)

# 编译产物
./bin/godot.macos.editor.dev.x86_64
# 或 ARM 版本
scons platform=macos arch=arm64 dev_build=yes -j$(sysctl -n hw.logicalcpu)
```

### Web 编译（需要 Emscripten）

```bash
# 先安装 Emscripten SDK
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# 编译 Web 模板（注意：Web 版只有导出模板，没有编辑器）
scons platform=web dlink_enabled=yes -j$(nproc)
```

### 编译时间参考

| 平台 | 首次编译（全量） | 增量编译（修改少量文件） |
|------|-----------------|----------------------|
| Linux (Ryzen 9, 16核) | 约 10-15 分钟 | 约 30-60 秒 |
| Windows (i7, 8核) | 约 15-25 分钟 | 约 1-2 分钟 |
| macOS (M1/M2) | 约 10-15 分钟 | 约 30-60 秒 |

> **提示**：安装 `ccache` 可以显著加速重复编译：
> ```bash
> sudo apt install ccache    # Linux
> ```
> SCons 会自动检测并使用 ccache。

---

## 关键编译参数

SCons 的编译参数控制着编译产物的行为和性能：

| 参数 | 默认值 | 说明 | 推荐值（源码学习） |
|------|--------|------|-------------------|
| `platform` | （必需） | 目标平台：`linuxbsd`, `windows`, `macos`, `android`, `ios`, `web` | 你的开发平台 |
| `dev_build` | `no` | 开发构建：启用额外检查、调试日志、更详细的断言 | **`yes`** |
| `target` | `editor` | 编译目标：`editor`（编辑器）, `template_debug`（调试导出模板）, `template_release`（发布导出模板） | `editor` |
| `optimize` | `auto` | 优化级别：`none`, `auto`, `speed`, `size` | `none` 或 `auto` |
| `symbols` | `auto` | 调试符号：生成 `.pdb`/`.dwarf` 调试信息 | `yes`（调试时必需） |
| `debug_symbols` | `yes` | 同 symbols | `yes` |
| `use_llvm` | `no` | 使用 Clang 而非 GCC（Linux） | 视个人偏好 |
| `use_lto` | `auto` | 链接时优化（Link-Time Optimization） | `no`（加速编译） |
| `use_ccache` | `auto` | 使用 ccache 加速编译 | `yes` |
| `dlink_enabled` | `no` | 启用动态链接（仅限 Web 平台） | Web 时用 |
| `module_*_enabled` | `yes` | 禁用特定模块，如 `module_mono_enabled=no` | 按需 |
| `verbose` | `no` | 显示详细编译命令 | 调试编译问题时 `yes` |
| `-j` | 1 | 并行编译任务数 | CPU 核心数 |

### 推荐的编译命令组合

```bash
# 源码学习最佳配置（编译快 + 可调试 + 丰富的调试信息）
scons platform=linuxbsd dev_build=yes optimize=none symbols=yes use_lto=no -j$(nproc)

# 日常开发配置（兼顾编译速度和运行速度）
scons platform=linuxbsd dev_build=yes optimize=auto symbols=yes -j$(nproc)

# 仅想快速看效果（最快编译，但无调试信息）
scons platform=linuxbsd -j$(nproc)
```

### 禁用不需要的模块加速编译

```bash
# 如果不需要 C# 支持，禁用 mono 模块可以节省编译时间
scons platform=linuxbsd dev_build=yes module_mono_enabled=no -j$(nproc)

# 查看所有可用模块及其启用状态
scons platform=linuxbsd --help
```

---

## IDE 配置

### VSCode（推荐）

#### 1. 安装必需扩展

在 VSCode 中安装以下扩展：

| 扩展 | ID | 用途 |
|------|-----|------|
| C/C++ | `ms-vscode.cpptools` | C++ 智能提示、调试 |
| C/C++ Intellisense | `austin.code-gnu-global` | 更好的代码导航 |
| CMake Tools | `ms-vscode.cmake-tools` | （可选）如果使用 CMake 生成 |
| SCons | `danielhiver.scons` | SCons 语法高亮 |

#### 2. 配置 c_cpp_properties.json

创建或编辑 `.vscode/c_cpp_properties.json`：

```json
{
    "configurations": [
        {
            "name": "Godot Linux",
            "includePath": [
                "${workspaceFolder}/**"
            ],
            "defines": [
                "_DEBUG",
                "LINUXBSD_ENABLED",
                "X11_ENABLED",
                "VULKAN_ENABLED",
                " GLES3_ENABLED",
                "TOOLS_ENABLED"
            ],
            "compilerPath": "/usr/bin/g++",
            "cStandard": "c17",
            "cppStandard": "c++17",
            "intelliSenseMode": "linux-gcc-x64",
            "compileCommands": "${workspaceFolder}/compile_commands.json",
            "browse": {
                "path": [
                    "${workspaceFolder}/core",
                    "${workspaceFolder}/scene",
                    "${workspaceFolder}/servers",
                    "${workspaceFolder}/platform",
                    "${workspaceFolder}/drivers"
                ],
                "limitSymbolsToIncludedHeaders": true
            }
        }
    ],
    "version": 4
}
```

#### 3. 生成 compile_commands.json

Godot 4.x 可以通过 SCons 生成编译数据库：

```bash
# 生成 compile_commands.json（用于 IDE 代码导航）
scons platform=linuxbsd dev_build=yes compiledb=yes -j$(nproc)
```

> **注意**：如果没有生成 `compile_commands.json`，可以使用 Bear 工具：
> ```bash
> # 安装 Bear
> sudo apt install bear
>
> # 使用 Bear 捕获编译命令
> bear -- scons platform=linuxbsd dev_build=yes -j$(nproc)
> ```

#### 4. 推荐的 VSCode 设置

创建或编辑 `.vscode/settings.json`：

```json
{
    "files.associations": {
        "*.h": "cpp",
        "*.cpp": "cpp",
        "*.tscn": "ini",
        "*.tres": "ini",
        "*.gd": "gdscript",
        "SConstruct": "python",
        "SCsub": "python"
    },
    "search.exclude": {
        "**/thirdparty": true,
        "**/bin": true,
        "**/.sconsign.dblite": true
    },
    "C_Cpp.default.compilerPath": "/usr/bin/g++",
    "C_Cpp.default.cppStandard": "c++17",
    "C_Cpp.default.intelliSenseMode": "linux-gcc-x64"
}
```

### clangd 配置（替代方案）

如果你偏好 clangd（通常比 VSCode C++ 扩展更快更准确）：

```bash
# 安装 clangd
sudo apt install clangd   # Linux
# 或在 VSCode 中安装 clangd 扩展

# 生成 compile_commands.json
scons platform=linuxbsd dev_build=yes compiledb=yes -j$(nproc)
```

创建 `.clangd` 配置文件：

```yaml
CompileFlags:
  Add: [-DLINUXBSD_ENABLED, -DVULKAN_ENABLED, -DGLES3_ENABLED, -DTOOLS_ENABLED]
Diagnostics:
  Suppress: ['pp_file_not_found', 'drv_unknown_header']
```

---

## 调试配置

### GDB 调试（Linux）

#### 1. 安装 GDB

```bash
# Debian/Ubuntu
sudo apt install gdb

# Arch
sudo pacman -S gdb
```

#### 2. VSCode 调试配置

创建 `.vscode/launch.json`：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Godot Editor (GDB)",
            "type": "cppdbg",
            "request": "launch",
            "program": "${workspaceFolder}/bin/godot.linuxbsd.editor.dev.x86_64",
            "args": [
                "--path",
                "/path/to/your/test/project"
            ],
            "stopAtEntry": false,
            "cwd": "${workspaceFolder}",
            "environment": [],
            "externalConsole": false,
            "MIMode": "gdb",
            "setupCommands": [
                {
                    "description": "为 GDB 启用整齐打印",
                    "text": "-enable-pretty-printing",
                    "ignoreFailures": true
                }
            ],
            "preLaunchTask": "Build Debug"
        },
        {
            "name": "Debug Godot Editor (Attach)",
            "type": "cppdbg",
            "request": "attach",
            "program": "${workspaceFolder}/bin/godot.linuxbsd.editor.dev.x86_64",
            "MIMode": "gdb",
            "processId": "${command:pickProcess}"
        }
    ]
}
```

#### 3. 创建构建任务

创建 `.vscode/tasks.json`：

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Build Debug",
            "type": "shell",
            "command": "scons",
            "args": [
                "platform=linuxbsd",
                "dev_build=yes",
                "optimize=none",
                "symbols=yes",
                "-j${command:pickProcess}"
            ],
            "group": {
                "kind": "build",
                "isDefault": true
            },
            "problemMatcher": ["$gcc"],
            "presentation": {
                "reveal": "always",
                "panel": "new"
            }
        },
        {
            "label": "Build (Incremental)",
            "type": "shell",
            "command": "scons",
            "args": [
                "platform=linuxbsd",
                "dev_build=yes",
                "-j8"
            ],
            "group": "build",
            "problemMatcher": ["$gcc"]
        }
    ]
}
```

### LLDB 调试（macOS）

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Godot Editor (LLDB)",
            "type": "cppdbg",
            "request": "launch",
            "program": "${workspaceFolder}/bin/godot.macos.editor.dev.x86_64",
            "args": ["--path", "/path/to/test/project"],
            "cwd": "${workspaceFolder}",
            "MIMode": "lldb",
            "preLaunchTask": "Build Debug"
        }
    ]
}
```

### 常用调试技巧

#### 在引擎代码中设置断点

1. **启动断点**：在 `main/main.cpp` 的 `Main::setup()` 函数第一行设置断点，可以跟踪引擎完整的初始化流程

2. **帧循环断点**：在 `main/main.cpp` 的 `Main::iteration()` 函数设置断点，可以观察每帧的执行

3. **场景加载断点**：在 `scene/resources/packed_scene.cpp` 的 `PackedScene::instantiate()` 设置断点

4. **渲染断点**：在 `servers/rendering/renderer_scene_cull.cpp` 的渲染函数设置断点

#### GDB 命令行调试速查

```bash
# 启动 GDB 调试
gdb ./bin/godot.linuxbsd.editor.dev.x86_64

# GDB 内部命令
(gdb) break main/main.cpp:1500          # 在指定文件行号设断点
(gdb) break Main::iteration             # 在函数入口设断点
(gdb) break RenderingServer::draw       # 渲染断点
(gdb) run --path /path/to/project       # 带参数运行
(gdb) continue                          # 继续执行
(gdb) step                              # 单步进入函数
(gdb) next                              # 单步跳过函数
(gdb) print variable_name               # 打印变量值
(gdb) call node->get_name()             # 调用对象方法
(gdb) backtrace                         # 查看调用栈
(gdb) info threads                      # 查看线程
```

#### Godot 专用 GDB 便捷命令

```bash
# 打印 String 变量的内容（Godot 的 String 不是标准 char*）
(gdb) print my_string.utf8().get_data()

# 打印 Vector3
(gdb) print my_vec3.x
(gdb) print my_vec3.y
(gdb) print my_vec3.z

# 打印节点树
(gdb) call root_node->print_tree()
```

---

## 创建测试项目

为了更好地调试引擎，建议创建一个包含多种引擎功能的测试项目：

### 1. 创建项目

```bash
# 用编译好的引擎创建新项目
./bin/godot.linuxbsd.editor.dev.x86_64 --path /path/to/test-project
```

或者在引擎编辑器中选择 "New Project"。

### 2. 建议的测试场景内容

创建一个包含以下元素的测试场景，以覆盖主要引擎功能：

| 元素 | 覆盖的引擎模块 | 调试入口 |
|------|---------------|----------|
| 一个 CharacterBody3D + MeshInstance3D | 场景系统、3D 渲染 | `scene/3d/` |
| 一个 RigidBody3D + 碰撞体 | 3D 物理系统 | `servers/physics_3d/` |
| 一个 Sprite2D + 动画 | 2D 渲染、动画系统 | `scene/2d/` |
| 一个 Button + Label | UI 系统 | `scene/gui/` |
| 一个 AudioStreamPlayer | 音频系统 | `servers/audio/` |
| 一个 Camera3D | 渲染系统 | `servers/rendering/` |
| 一段 GDScript `_process()` 脚本 | 脚本系统 | `modules/gdscript/` |

### 3. 链接源码引擎

如果你修改了引擎源码，需要用编译出的编辑器二进制文件打开项目：

```bash
# 直接用编译的引擎打开项目
./bin/godot.linuxbsd.editor.dev.x86_64 --path /path/to/test-project

# 或者用 -e 参数显式启动编辑器
./bin/godot.linuxbsd.editor.dev.x86_64 -e --path /path/to/test-project
```

---

## 常见问题

### 问题 1：编译时找不到 Python 模块

```bash
# 确保 pip 安装的包在 Python 路径中
python3 -m pip install --user scons
# 或
pip3 install scons

# 验证
scons --version
```

### 问题 2：Windows 上 MSVC 找不到

确保在 **Developer Command Prompt for VS** 或 **Developer PowerShell for VS** 中执行 scons 命令。或者直接打开 VSCode 从该环境中启动。

```bash
# 检查 MSVC 编译器
where cl
# 应该输出类似 C:\Program Files\Microsoft Visual Studio\...\cl.exe
```

### 问题 3：编译内存不足

```bash
# 减少并行任务数
scons platform=linuxbsd dev_build=yes -j4    # 只用 4 个并行任务

# 或禁用 LTO（链接时优化会消耗大量内存）
scons platform=linuxbsd dev_build=yes use_lto=no -j$(nproc)
```

### 问题 4：头文件找不到（IDE 报红）

```bash
# 重新生成 compile_commands.json
scons platform=linuxbsd dev_build=yes compiledb=yes -j$(nproc)

# 然后在 VSCode 中按 Ctrl+Shift+P → "C/C++: Reload IntelliSense Database"
```

### 问题 5：修改代码后断点不生效

```bash
# 确保使用了带调试符号的编译配置
scons platform=linuxbsd dev_build=yes optimize=none symbols=yes -j$(nproc)

# 检查二进制文件是否包含调试信息
file bin/godot.linuxbsd.editor.dev.x86_64
# 应该包含 "not stripped" 或 "with debug_info"
```

---

## 验证环境

运行以下检查确认环境配置正确：

```bash
# 1. 检查 Python 版本
python3 --version    # 应该 >= 3.6

# 2. 检查 SCons 版本
scons --version      # 应该 >= 4.0

# 3. 检查编译器
g++ --version        # Linux，应该 >= 9.0

# 4. 编译引擎（快速测试，只编译少量文件）
scons platform=linuxbsd dev_build=yes -j$(nproc)

# 5. 运行引擎
./bin/godot.linuxbsd.editor.dev.x86_64 --version
# 应该输出 Godot 版本号

# 6. 验证调试符号
gdb ./bin/godot.linuxbsd.editor.dev.x86_64 \
    -ex "break Main::setup" -ex "run" -ex "quit"
# 如果 GDB 能识别 Main::setup，说明调试符号正确
```

如果以上命令都能正常执行，说明环境配置成功！

---

## 下一步

环境配置完成后，继续阅读 [02-源码结构](./02-source-structure.md) 了解引擎的目录组织和关键文件。

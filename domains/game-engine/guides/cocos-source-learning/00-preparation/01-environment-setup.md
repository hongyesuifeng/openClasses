# 环境配置

本文档介绍如何搭建 Cocos Creator 3.8.8 引擎源码的阅读和调试环境。

## 目录

- [系统要求](#系统要求)
- [获取源码](#获取源码)
- [安装依赖](#安装依赖)
- [编译引擎](#编译引擎)
- [IDE 配置](#ide-configuration)
- [调试配置](#debug-configuration)

---

## 系统要求

### 必需软件

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 16.x | JavaScript 运行时 |
| npm | >= 8.x | 包管理器 |
| Git | 最新版 | 版本控制 |
| VSCode | 最新版 | 推荐的 IDE |

### 推荐软件

| 软件 | 用途 |
|------|------|
| Cocos Creator 3.8.8 | 创建测试项目 |
| Chrome | 调试 Web 版本 |
| Visual Studio | 调试原生版本 (Windows) |
| Xcode | 调试原生版本 (macOS/iOS) |

---

## 获取源码

### 方式一：克隆 GitHub 仓库

```bash
# 克隆引擎仓库
git clone https://github.com/cocos/cocos-engine.git

# 进入目录
cd cocos-engine

# 切换到 3.8.8 版本标签
git checkout 3.8.8
```

### 方式二：下载压缩包

1. 访问 [Cocos Engine Releases](https://github.com/cocos/cocos-engine/releases)
2. 下载 3.8.8 版本的 Source Code (zip)
3. 解压到本地目录

---

## 安装依赖

```bash
# 安装 npm 依赖
npm install

# 如果遇到网络问题，可以使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

### 常见问题

**问题 1：node-gyp 编译失败**

```bash
# Windows 安装构建工具
npm install -g windows-build-tools

# macOS 安装 Xcode Command Line Tools
xcode-select --install
```

**问题 2：依赖安装超时**

```bash
# 设置更长的超时时间
npm install --timeout=60000
```

---

## 编译引擎

### 开发模式编译

```bash
# 编译 TypeScript（开发模式，包含 source map）
npm run build
```

### 编译产物

编译后的文件位于：
- `bin/` - 编译输出目录
- `bin/.cache/` - 缓存文件

---

## IDE 配置

### VSCode 推荐扩展

创建 `.vscode/extensions.json`：

```json
{
    "recommendations": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-vscode.vscode-typescript-next",
        "usernamehw.errorlens",
        "streetsidesoftware.code-spell-checker"
    ]
}
```

### VSCode 设置

创建 `.vscode/settings.json`：

```json
{
    "typescript.tsdk": "node_modules/typescript/lib",
    "typescript.enablePromptUseWorkspaceTsdk": true,
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
    },
    "search.exclude": {
        "**/node_modules": true,
        "**/bower_components": true,
        "**/dist": true,
        "**/bin": true
    }
}
```

---

## 调试配置

### 调试 Web 版本

创建 `.vscode/launch.json`：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "chrome",
            "request": "launch",
            "name": "Debug Cocos (Chrome)",
            "url": "http://localhost:7456",
            "webRoot": "${workspaceFolder}",
            "sourceMaps": true,
            "sourceMapPathOverrides": {
                "webpack:///./~/*": "${webRoot}/node_modules/*",
                "webpack:///./*": "${webRoot}/*",
                "webpack:///*": "*"
            }
        },
        {
            "type": "node",
            "request": "launch",
            "name": "Debug Build Script",
            "runtimeExecutable": "npm",
            "runtimeArgs": ["run", "build"],
            "console": "integratedTerminal"
        }
    ]
}
```

### 调试步骤

1. **启动 Cocos Creator 编辑器**
   - 打开一个测试项目
   - 点击"运行"预览游戏

2. **在 VSCode 中设置断点**
   - 打开源码文件（如 `cocos/game/game.ts`）
   - 在行号左侧点击添加断点

3. **启动调试**
   - 按 F5 或点击"运行和调试"
   - 选择 "Debug Cocos (Chrome)" 配置
   - Chrome 会自动打开并连接调试器

4. **触发断点**
   - 在浏览器中操作游戏
   - 当代码执行到断点时会自动暂停

---

## 创建测试项目

为了更好地调试引擎，建议创建一个简单的测试项目：

### 1. 创建新项目

1. 打开 Cocos Creator 3.8.8
2. 创建一个新的空项目
3. 记住项目路径

### 2. 链接源码引擎

修改项目的 `package.json`：

```json
{
    "dependencies": {
        "cc": "file:/path/to/cocos-engine"
    }
}
```

### 3. 创建测试场景

创建一个包含以下元素的测试场景：
- 一个 3D 立方体
- 一个 2D 精灵
- 一个 UI 按钮
- 一个简单的动画

这样可以覆盖大部分引擎功能，便于调试。

---

## 验证环境

运行以下检查确认环境配置正确：

```bash
# 检查 Node.js 版本
node -v  # 应该 >= 16.x

# 检查 npm 版本
npm -v   # 应该 >= 8.x

# 检查 TypeScript 版本
npx tsc -v

# 尝试编译引擎
npm run build
```

如果以上命令都能正常执行，说明环境配置成功！

---

## 下一步

环境配置完成后，继续阅读 [02-源码结构](./02-source-structure.md) 了解引擎的目录组织。

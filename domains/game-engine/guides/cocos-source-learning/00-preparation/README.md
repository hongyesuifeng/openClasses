# 准备工作

本章节帮助你搭建源码阅读环境，了解源码结构，掌握高效的阅读方法。

## 目录

- **[00-技术原理](./00-technical-principles.md) - 游戏引擎架构、游戏循环、跨平台设计原理（建议首先阅读）**
- [01-环境配置](./01-environment-setup.md) - 开发环境搭建
- [02-源码结构](./02-source-structure.md) - 源码目录导览
- [03-阅读方法](./03-reading-methodology.md) - 源码阅读技巧

---

## 学习目标

完成本章节后，你将能够：

1. 成功编译和调试引擎源码
2. 了解引擎的整体目录结构
3. 掌握高效的源码阅读方法
4. 配置 IDE 获得最佳开发体验

---

## 快速开始

### 1. 获取源码

```bash
# 克隆引擎仓库
git clone https://github.com/cocos/cocos-engine.git

# 切换到 3.8.8 版本
cd cocos-engine
git checkout 3.8.8

# 安装依赖
npm install
```

### 2. 编译引擎

```bash
# 编译 TypeScript
npm run build
```

### 3. 配置调试

参考 [01-环境配置](./01-environment-setup.md) 配置 VSCode 调试环境。

---

## 预计时间

- 环境配置：2-4 小时
- 源码结构了解：1-2 小时
- 阅读方法学习：1 小时

**总计：约 1 天**

---

## 下一步

完成准备工作后，继续学习 [核心基础层](../01-core-foundation/README.md)。

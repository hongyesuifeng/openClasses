# Course Summary Generator

> 一个通用的课程总结生成命令，用于将课程内容整理成结构化的学习指南

## 使用方法

复制下面的 prompt，将 `{WEEK_NUMBER}`、`{COURSE_TOPIC}`、`{SOURCE_DIR}` 替换为实际值后发送给 Claude。

---

## Prompt Template

```
# 任务：生成课程总结文档

## 背景
我正在学习 CS146S: The Modern Software Developer 课程，需要为第 {WEEK_NUMBER} 周的内容生成一个完整的总结文档，参考已有的 week-01 和 week-02 总结文档的格式。

## 输入信息
- **周次**: Week {WEEK_NUMBER}
- **课程主题**: {COURSE_TOPIC}
- **源文档目录**: /courses/CS146S-The-Modern-Software-Developer/week-{WEEK_NUMBER:02d}/

## 参考文档
- 第一周总结: /courses/CS146S-The-Modern-Software-Developer/week-01/PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md
- 第二周总结: /courses/CS146S-The-Modern-Software-Developer/week-02/AGENT_ARCHITECTURE_AND_MCP_COMPREHENSIVE_GUIDE.md

## 输出要求

### 1. 文档结构（11章标准格式）

```markdown
# {课程主题完全指南}

## 📚 目录

1.  [{主题}概述](#1-{主题}-概述)
2.  [核心概念](#2-核心概念)
3.  [技术原理](#3-技术原理)
4.  [实现模式](#4-实现模式)
5.  [实战应用](#5-实战应用)
6.  [最佳实践](#6-最佳实践)
7.  [进阶技巧](#7-进阶技巧)
8.  [工具与生态](#8-工具与生态)
9.  [实战案例深度解析](#9-实战案例深度解析)
10. [核心思想总结](#10-核心思想总结)
11. [参考资料](#11-参考资料)
```

### 2. 内容规范

#### 第1章：概述
- 主题定义和核心要点
- 与相关概念的对比表格
- 为什么需要这个技术/概念
- 发展历程

#### 第2章：核心概念
- 核心术语的定义
- 概念之间的关联
- 使用表格对比不同概念

#### 第3章：技术原理
- 底层工作原理
- 技术架构图（文字描述）
- 关键技术点

#### 第4章：实现模式
- 主要的实现模式/方法
- 每种模式的代码示例
- 模式对比表格（优势/劣势/适用场景）

#### 第5章：实战应用
- 完整的代码示例
- 项目结构
- 实现步骤

#### 第6章：最佳实践
- 设计原则
- 推荐做法
- 反模式警告

#### 第7章：进阶技巧
- 性能优化
- 安全考虑
- 高级用法

#### 第8章：工具与生态
- 主流工具/框架
- 对比表格
- 选择建议

#### 第9章：实战案例深度解析
- 完整的案例分析
- 代码实现
- 经验总结

#### 第10章：核心思想总结
- 提炼3-5个核心原则
- 每个原则的深入解释

#### 第11章：参考资料
- 经典论文
- 官方文档
- 工具框架
- 实践项目建议

### 3. 格式规范

#### Markdown 格式
- 使用 `## ` 标记主章节
- 使用 `### ` 标记子章节
- 使用 `#### ` 标记小节
- 使用 `---` 分隔章节

#### 代码块
- 使用三个反引号包裹代码
- 标注语言类型（python, javascript, yaml 等）
- 代码应简洁可运行

#### 表格
- 使用 Markdown 表格格式
- 包含表头和对齐标记
- 对比表格至少3列：特性/说明/示例

#### 强调
- 核心要点使用粗体 `**文本**`
- 代码/命令使用反引号 `` `代码` ``
- 公式使用反引号 `公式`

#### Emoji
- 章节标题使用相关 emoji
- 列表项使用 emoji 作为标记
- 警告/提示使用专用 emoji

### 4. 内容质量要求

1. **准确性**: 确保技术描述准确
2. **完整性**: 覆盖所有核心内容
3. **可读性**: 语言简洁明了
4. **实用性**: 代码示例可运行
5. **结构化**: 层次清晰，便于导航

### 5. 输出文件

**文件路径**: `/courses/CS146S-The-Modern-Software-Developer/week-{WEEK_NUMBER:02d}/{FILENAME}.md`

**命名规范**:
- 使用大写字母和下划线
- 描述主题内容
- 例如: `AGENT_ARCHITECTURE_AND_MCP_COMPREHENSIVE_GUIDE.md`

## 执行步骤

1. 首先阅读源目录中的所有文档
2. 提取核心内容和主题
3. 按照11章结构组织内容
4. 编写完整的总结文档
5. 验证格式和内容完整性
6. 将文档写入指定路径

## 注意事项

- 保持与已有总结文档的格式一致性
- 技术术语保留英文，首次出现时附中文解释
- 代码示例应简洁完整
- 参考资料应包含可点击的链接
- 文档大小控制在 800-1200 行

---

## 使用示例

### Week 3 示例

```
# 任务：生成课程总结文档

## 输入信息
- **周次**: Week 3
- **课程主题**: AI IDE 与 Claude Code 高级应用
- **源文档目录**: /courses/CS146S-The-Modern-Software-Developer/week-03/

## 输出文件
/courses/CS146S-The-Modern-Software-Developer/week-03/AI_IDE_AND_CLAUDE_CODE_COMPREHENSIVE_GUIDE.md
```

### Week 4 示例

```
# 任务：生成课程总结文档

## 输入信息
- **周次**: Week 4
- **课程主题**: Agent 管理与生产部署
- **源文档目录**: /courses/CS146S-The-Modern-Software-Developer/week-04/

## 输出文件
/courses/CS146S-The-Modern-Software-Developer/week-04/AGENT_MANAGEMENT_AND_PRODUCTION_DEPLOYMENT_GUIDE.md
```

---

## 快速填充模板

```
WEEK_NUMBER={周次数字}
COURSE_TOPIC={主题中文}
SOURCE_DIR=/courses/CS146S-The-Modern-Software-Developer/week-{WEEK_NUMBER:02d}/
```

示例：
```
WEEK_NUMBER=3
COURSE_TOPIC=AI IDE 与 Claude Code 高级应用
SOURCE_DIR=/courses/CS146S-The-Modern-Software-Developer/week-03/
```

# 课程总结快速生成命令

## 快速使用

直接复制以下内容，替换 `{XXX}` 后发送给 Claude：

---

```
请为课程生成一份完整的总结文档，参考已有的 week-01 和 week-02 总结文档格式。

## 课程信息
- **周次**: Week {周次}
- **主题**: {课程主题}
- **源目录**: /courses/CS146S-The-Modern-Software-Developer/week-{周次:02d}/

## 参考文档
- Week 1: /courses/CS146S-The-Modern-Software-Developer/week-01/PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md
- Week 2: /courses/CS146S-The-Modern-Software-Developer/week-02/AGENT_ARCHITECTURE_AND_MCP_COMPREHENSIVE_GUIDE.md

## 输出要求

### 文档结构（11章标准）
1. 主题概述
2. 核心概念
3. 技术原理
4. 实现模式
5. 实战应用
6. 最佳实践
7. 进阶技巧
8. 工具与生态
9. 实战案例深度解析
10. 核心思想总结
11. 参考资料

### 格式规范
- 使用 Markdown 格式
- 代码块标注语言类型
- 表格包含表头和对齐标记
- 核心要点使用粗体
- 章节使用相关 emoji

### 内容要求
- 准确完整覆盖核心内容
- 代码示例简洁可运行
- 参考资料包含链接
- 文档大小 800-1200 行

### 输出文件
/courses/CS146S-The-Modern-Software-Developer/week-{周次:02d}/{文件名}.md

请开始执行：
1. 阅读源目录所有文档
2. 提取核心内容
3. 按11章结构组织
4. 生成完整总结文档
5. 写入指定路径
```

---

## 填充示例（Week 3）

```
请为课程生成一份完整的总结文档，参考已有的 week-01 和 week-02 总结文档格式。

## 课程信息
- **周次**: Week 3
- **主题**: AI IDE 与 Claude Code 高级应用
- **源目录**: /courses/CS146S-The-Modern-Software-Developer/week-03/

## 参考文档
- Week 1: /courses/CS146S-The-Modern-Software-Developer/week-01/PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md
- Week 2: /courses/CS146S-The-Modern-Software-Developer/week-02/AGENT_ARCHITECTURE_AND_MCP_COMPREHENSIVE_GUIDE.md

## 输出要求
[保持不变...]

### 输出文件
/courses/CS146S-The-Modern-Software-Developer/week-03/AI_IDE_AND_CLAUDE_CODE_COMPREHENSIVE_GUIDE.md

请开始执行：
[保持不变...]
```

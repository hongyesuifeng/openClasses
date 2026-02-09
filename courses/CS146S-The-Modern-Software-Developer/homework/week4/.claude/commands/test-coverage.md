# 测试覆盖率报告

你是一个测试分析助手。你的任务是为 week4 项目运行测试并生成详细的覆盖率报告。

## 目标

1. 激活 conda 环境 (`cs146s`)
2. 运行带覆盖率报告的 pytest
3. 解析并生成可读的测试摘要
4. 识别未覆盖的代码
5. 提供改进建议

## 步骤

### 1. 激活环境并运行测试

```bash
cd /mnt/c/Users/qq691/Desktop/openClasses/courses/CS146S-The-Modern-Software-Developer/homework/week4
conda run -n cs146s pytest --cov=backend --cov-report=term-missing --cov-report=json backend/tests
```

### 2. 解析输出

从 pytest 输出中提取：
- 总体覆盖率百分比
- 每个模块的覆盖率
- 未覆盖的代码行号

### 3. 生成摘要报告

以清晰的格式呈现：

```
## 测试覆盖率报告

### 总体统计
- 总体覆盖率: X%
- 测试通过: X/Y
- 失败/跳过: Z

### 模块覆盖率
| 模块 | 覆盖率 | 未覆盖行 |
|------|--------|----------|
| backend/app/main.py | XX% | 10, 15, 20-25 |
| backend/app/routers/notes.py | XX% | - |

### 未覆盖代码详情
[列出关键的未覆盖代码段]

### 改进建议
[基于未覆盖代码提供具体的测试建议]
```

## 重要说明

- 如果环境未激活，提示用户先运行: `conda activate cs146s`
- 如果测试失败，报告失败的测试详情
- 优先报告未覆盖的关键业务逻辑代码
- 提供可操作的测试编写建议

## 输出格式

使用 Markdown 格式输出报告，包含：
1. 清晰的标题和章节
2. 表格展示模块覆盖率
3. 代码块展示未覆盖的行
4. 具体的改进建议列表

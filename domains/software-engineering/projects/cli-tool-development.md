# CLI 工具开发实践指南

> 从零开始构建一个生产级命令行工具

## 📚 项目概述

**项目名称**: 自定义 CLI 工具开发

**学习目标**:
- 掌握 CLI 工具开发的核心技能
- 学习软件工程最佳实践
- 理解 AI 辅助开发的完整流程
- 建立代码质量和测试意识

**技术栈**:
- 语言: Python 3.9+ / Go 1.19+
- 框架: Click (Python) / Cobra (Go)
- 测试: pytest / go test
- 打包: PyInstaller / Go build
- 文档: Markdown + Sphinx

## 🎯 项目阶段

### 阶段 1: 项目初始化 (1-2 天)

**目标**: 建立项目基础结构

**任务**:
- [ ] 创建项目目录结构
- [ ] 初始化版本控制 (Git)
- [ ] 配置开发环境
- [ ] 设置依赖管理
- [ ] 编写基础 README

**项目结构**:
```
my-cli-tool/
├── src/
│   └── my_cli_tool/
│       ├── __init__.py
│       ├── cli.py           # CLI 入口
│       ├── commands/        # 命令实现
│       ├── core/           # 核心逻辑
│       └── utils/          # 工具函数
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
├── examples/
├── setup.py
├── pyproject.toml
├── .gitignore
├── README.md
└── LICENSE
```

### 阶段 2: 核心功能开发 (3-5 天)

**目标**: 实现 CLI 框架和核心命令

**任务**:
- [ ] 设计命令结构
- [ ] 实现参数解析
- [ ] 开发核心功能
- [ ] 添加配置管理
- [ ] 实现日志系统

**基础 CLI 框架** (Python + Click):
```python
# cli.py
import click
from .version import __version__

@click.group()
@click.version_option(version=__version__)
def cli():
    """我的 CLI 工具 - 简短描述"""
    pass

@cli.command()
@click.argument('name')
@click.option('--count', default=1, help='重复次数')
def hello(name, count):
    """打招呼命令"""
    for _ in range(count):
        click.echo(f'Hello {name}!')

if __name__ == '__main__':
    cli()
```

### 阶段 3: 功能扩展 (5-7 天)

**目标**: 添加实用功能

**可选功能**:
- [ ] 文件处理
- [ ] 数据转换
- [ ] API 集成
- [ ] 配置文件支持
- [ ] 插件系统

**示例: 文件处理命令**
```python
@cli.command()
@click.argument('input_file', type=click.Path(exists=True))
@click.argument('output_file', type=click.Path())
@click.option('--format', default='json', help='输出格式')
def process(input_file, output_file, format):
    """处理输入文件并生成输出"""
    try:
        data = read_file(input_file)
        result = transform_data(data)
        write_file(output_file, result, format)
        click.echo(f'成功处理: {input_file} -> {output_file}')
    except Exception as e:
        click.echo(f'错误: {e}', err=True)
        raise click.Abort()
```

### 阶段 4: 测试和质量保证 (3-4 天)

**目标**: 建立完整的测试体系

**任务**:
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 设置测试覆盖率
- [ ] 配置 CI/CD
- [ ] 添加代码质量检查

**测试示例**:
```python
# tests/test_commands.py
import pytest
from click.testing import CliRunner
from my_cli_tool.cli import cli

def test_hello_command():
    runner = CliRunner()
    result = runner.invoke(cli, ['hello', 'World'])
    assert result.exit_code == 0
    assert 'Hello World!' in result.output

def test_hello_with_count():
    runner = CliRunner()
    result = runner.invoke(cli, ['hello', 'Test', '--count', '3'])
    assert result.exit_code == 0
    assert result.output.count('Hello Test!') == 3
```

### 阶段 5: 打包和分发 (2-3 天)

**目标**: 准备工具的发布

**任务**:
- [ ] 配置打包设置
- [ ] 编写安装文档
- [ ] 创建发布说明
- [ ] 测试安装流程
- [ ] 发布到 PyPI/GitHub

## 🛠️ 开发最佳实践

### 代码质量

1. **遵循语言规范**
   - Python: PEP 8
   - Go: Effective Go
   - 使用格式化工具 (black, gofmt)

2. **编写清晰的代码**
   - 有意义的命名
   - 单一职责原则
   - 适当的注释

3. **错误处理**
   - 明确的错误消息
   - 适当的退出码
   - 用户友好的提示

### 文档编写

**README 结构**:
```markdown
# 项目名称

简短的项目描述

## 安装

```bash
pip install my-cli-tool
```

## 快速开始

```bash
my-cli-tool hello World
```

## 命令

### hello
打招呼命令

```bash
my-cli-tool hello [OPTIONS] NAME
```

### process
处理文件

```bash
my-cli-tool process [OPTIONS] INPUT_FILE OUTPUT_FILE
```

## 配置

配置文件位置和格式

## 开发

如何设置开发环境

## 贡献

贡献指南

## 许可证

MIT License
```

### 测试策略

1. **单元测试**: 测试单个函数
2. **集成测试**: 测试命令流程
3. **端到端测试**: 测试完整场景
4. **覆盖率目标**: >80%

## 🤖 AI 辅助开发

### 使用 AI 工具

**场景 1: 初始代码生成**
```
请创建一个 Python Click CLI 工具框架，
包含以下命令：
1. init - 初始化项目
2. build - 构建项目
3. deploy - 部署项目

要求：
- 使用 Python 3.9+
- 包含类型注解
- 添加错误处理
- 支持配置文件
```

**场景 2: 测试生成**
```
为以下 CLI 命令生成单元测试：
{命令代码}

使用 pytest 框架，
覆盖正常情况和异常情况。
```

**场景 3: 文档生成**
```
为以下 CLI 工具生成用户文档，
包括安装说明、使用示例和命令参考。
```

### AI 辅助工作流

1. **需求分析**: 使用 AI 理解需求
2. **架构设计**: AI 辅助设计命令结构
3. **代码生成**: AI 生成初始代码
4. **测试编写**: AI 生成测试用例
5. **文档编写**: AI 生成文档初稿
6. **代码审查**: AI 辅助代码审查
7. **优化改进**: AI 提供优化建议

## 📊 进度跟踪

### 里程碑

| 里程碑 | 目标 | 状态 | 完成日期 |
|--------|------|------|----------|
| 项目初始化 | 基础结构建立 | ⏳ | - |
| 核心功能 | CLI 框架完成 | ⏳ | - |
| 功能扩展 | 实用功能添加 | ⏳ | - |
| 测试完成 | 测试覆盖率达标 | ⏳ | - |
| 发布准备 | 打包和文档完成 | ⏳ | - |

### 技能检查

- [ ] 理解 CLI 工具架构
- [ ] 掌握参数解析
- [ ] 能够处理文件 I/O
- [ ] 理解错误处理
- [ ] 能够编写测试
- [ ] 掌握打包发布

## 🎓 学习资源

### 官方文档

- [Click Documentation](https://click.palletsprojects.com/)
- [Cobra Documentation](https://github.com/spf13/cobra)
- [CLI Design Guidelines](https://clig.dev/)

### 推荐阅读

- [Command Line Apps in Ruby](https://dl.google.com/line/googleio2010/Command%20Line%20Apps%20in%20Ruby.pdf)
- [The Art of Command Line](https://github.com/jlevy/the-art-of-command-line)

### 示例项目

- [GitHub CLI](https://github.com/cli/cli)
- [AWS CLI](https://github.com/aws/aws-cli)
- [kubectl](https://github.com/kubernetes/kubectl)

## 🚀 扩展方向

完成基础项目后，可以考虑：

1. **AI 集成**
   - 添加 AI 辅助功能
   - 集成 LLM API
   - 智能命令补全

2. **插件系统**
   - 支持第三方插件
   - 插件开发文档
   - 插件市场

3. **Web 界面**
   - TUI (Terminal UI)
   - Web Dashboard
   - 远程执行

4. **性能优化**
   - 并行处理
   - 缓存机制
   - 增量处理

## 💡 最佳实践总结

### CLI 设计原则

1. **简洁**: 命令和参数命名清晰
2. **一致**: 遵循 Unix 哲学
3. **友好**: 提供帮助和错误提示
4. **高效**: 快速响应和执行

### 代码质量

1. **测试**: 高覆盖率
2. **文档**: 完整的用户和开发文档
3. **错误处理**: 优雅的错误处理
4. **日志**: 适当的日志记录

### 发布流程

1. **版本管理**: 语义化版本
2. **变更日志**: 维护 CHANGELOG
3. **发布说明**: 详细的更新说明
4. **用户支持**: 问题追踪和反馈

---

**下一步**: [API 开发实践指南](./api-development.md)

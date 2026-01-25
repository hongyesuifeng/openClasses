# Reading 2: Semgrep Static Analysis in Practice
# Semgrep 静态分析实战指南

> **Week 6 Reading #2**
> **主题**: 掌握 Semgrep 静态分析工具的实战应用
> **预计阅读时间**: 60-90 分钟

---

## 📚 导读

Semgrep 是一个现代化的静态分析工具，它通过模式匹配快速发现代码中的安全漏洞和 bug。与传统的静态分析工具相比，Semgrep 更快、更准确、更易定制。本文全面介绍 Semgrep 的实战应用，帮助你：

1. **理解原理** - Semgrep 的工作机制和优势
2. **掌握规则** - 编写自定义规则
3. **集成流程** - 在 CI/CD 中集成
4. **实战应用** - 真实场景的案例分析

---

## 🎯 学习目标

阅读完本文后，你应该能够：

- ✅ 理解 Semgrep 的工作原理
- ✅ 编写自定义 Semgrep 规则
- ✅ 在 CI/CD 中集成 Semgrep
- ✅ 处理误报和优化规则
- ✅ 建立团队的安全扫描流程

---

## 第一部分：Semgrep 基础

### 1. 什么是 Semgrep？

**定义**: 一个快速、开源、支持多语言的静态分析工具。

**核心特性**:

| 特性 | 说明 |
|------|------|
| **速度快** | 扫描百万行代码只需分钟级 |
| **零误报** | 聚焦高质量规则，减少误报 |
| **易定制** | 团队可以编写自己的规则 |
| **多语言** | Python, JavaScript, Go, Java 等 |
| **CI/CD 集成** | 开箱即用的 GitHub/GitLab 集成 |

**工作原理**:

```
源代码
   ↓
解析为 AST
   ↓
模式匹配
   ↓
发现问题 → 报告
```

### 2. 安装和配置

#### 安装

```bash
# macOS
brew install semgrep

# Linux
pip install semgrep

# Docker
docker run --rm -v "$PWD:/src" returntocorp/semgrep

# 验证安装
semgrep --version
```

#### 初始化配置

```bash
# 初始化 Semgrep
semgrep init

# 生成配置文件 .semgrep.yaml
# 创建规则目录 semgrep-rules/
```

### 3. 基础扫描

```bash
# 扫描当前目录
semgrep .

# 扫描特定目录
semgrep src/

# 扫描特定文件类型
semgrep --config=auto src/**/*.py

# 使用自动规则
semgrep --config=auto .

# 查看详细输出
semgrep --verbose .
```

---

## 第二部分：Semgrep 规则编写

### 1. 规则结构

#### 完整规则示例

```yaml
# rules/sql-injection.yaml
id: python-sql-injection
message: "可能的 SQL 注入漏洞"
languages: [python]
severity: ERROR
pattern-either:
  - pattern: |
      $QUERY.execute($INPUT)
      where:
        $QUERY.$METHOD == "execute"
        and not $INPUT.is_safe()
  - pattern: |
      $QUERY.execute("$FORMAT" % $INPUT)
  - pattern: |
      $QUERY.execute(f"$FORMAT{$INPUT}")
metadata:
  category: security
  technology:
    - python
    - sql
  owasp: "A01:2021 - Injection"
  cwe: "CWE-89: SQL Injection"
```

**规则字段说明**:

| 字段 | 说明 | 示例 |
|------|------|------|
| `id` | 规则唯一标识 | `python-sql-injection` |
| `message` | 发现问题时的提示 | "可能的 SQL 注入" |
| `languages` | 适用的语言 | `[python, javascript]` |
| `severity` | 严重程度 | `ERROR`, `WARNING`, `INFO` |
| `pattern` | 匹配模式 | `$VAR.method(...)` |
| `metadata` | 元数据 | 分类、技术栈、OWASP 等 |

### 2. 模式匹配

#### 2.1 基础模式

```yaml
# 精确匹配
pattern: os.system("...")

# 变量匹配
pattern: os.system($CMD)

# 通配符匹配
pattern: subprocess.$METHOD($INPUT)
```

#### 2.2 复杂模式

```yaml
# 多行匹配
pattern: |
  def $FUNC($ARGS):
      ...
      return $VALUE

# 嵌套匹配
pattern: |
  $OBJ.$METHOD(
      ...,
      $INPUT,
      ...
  )

# 条件匹配
pattern: |
  $QUERY.execute($INPUT)
  where:
    $INPUT != "..."  # 不匹配字符串字面量
```

#### 2.3 模式操作符

```yaml
# pattern-either: 任一模式匹配
pattern-either:
  - pattern: eval(...)
  - pattern: exec(...)

# pattern-all: 所有模式匹配
pattern-regex: "password.*=.*\"...\""  # 正则表达式
pattern-not: secure_function(...)  # 否定模式
```

### 3. 实用规则示例

#### 规则 1: 硬编码密码

```yaml
rules:
  - id: hardcoded-password
    pattern: password = "..."
    message: 硬编码密码，使用环境变量
    severity: ERROR
    languages: [python, javascript, go]
    metadata:
      category: security
```

#### 规则 2: 不安全的随机数

```yaml
rules:
  - id: insecure-random
    pattern: math.random()
    message: 不安全的随机数生成，使用 secrets 模块
    severity: WARNING
    languages: [python, javascript]
    fix: secrets.SystemRandom()
```

#### 规则 3: SQL 注入

```yaml
rules:
  - id: sql-injection-f-string
    pattern: |
      $QUERY.execute(f"$SQL{$INPUT}")
    message: f-string 中的 SQL 注入风险
    severity: ERROR
    languages: [python]
    fix: |
      使用参数化查询:
      cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
```

#### 规则 4: 未验证的重定向

```yaml
rules:
  - id: open-redirect
    pattern: |
      redirect($USER_INPUT)
    message: 未验证的重定向，可能导致钓鱼攻击
    severity: WARNING
    languages: [python, javascript, go]
```

#### 规则 5: 弱加密算法

```yaml
rules:
  - id: weak-cryptography
    pattern-either:
      - pattern: hashlib.md5(...)
      - pattern: hashlib.sha1(...)
    message: 使用弱加密算法，推荐使用 SHA-256 或更强
    severity: WARNING
    languages: [python]
    fix: hashlib.sha256(...)
```

---

## 第三部分：高级功能

### 1. 数据流分析

#### 追踪数据流动

```yaml
rules:
  - id: tainted-sql
    message: 用户输入直接用于 SQL 查询
    mode: taint
    pattern-sources:
      - pattern: flask.request.form.get(...)
      - pattern: flask.request.args.get(...)
    pattern-sinks:
      - pattern: execute($QUERY)
    pattern-sanitizers:
      - pattern: escape_string(...)
```

**工作原理**:

```
污染源 (Source)
   ↓
数据流动
   ↓
净化器 (Sanitizer) → 停止追踪
   ↓
汇聚点 (Sink) → 报告漏洞
```

### 2. 跨文件分析

```yaml
rules:
  - id: cross-file-vulnerability
    message: 跨文件的漏洞检测
    languages: [python]
    mode: taint
    pattern-sources:
      - pattern: get_user_input(...)
        includes: "utils/input.py"
    pattern-sinks:
      - pattern: execute(...)
        includes: "database/db.py"
```

### 3. 自定义验证

```yaml
rules:
  - id: check-logger-usage
    pattern: logger.$LEVEL($MSG)
    message: 使用 logger 记录日志
    validation:
      after-regex: "logger\\.(info|debug|warning|error)"
```

---

## 第四部分：CI/CD 集成

### 1. GitHub Actions 集成

#### 基础配置

```yaml
# .github/workflows/semgrep.yml
name: Semgrep

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  semgrep:
    name: Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            auto
            --config=.semgrep.yaml
```

#### 高级配置

```yaml
name: Semgrep Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # 每周日扫描

jobs:
  semgrep:
    runs-on: ubuntu-latest

    # 仅在特定条件下运行
    if: |
      github.event_name == 'schedule' ||
      github.event_name == 'push' ||
      github.event_name == 'pull_request'

    steps:
      - uses: actions/checkout@v3

      - name: Semgrep Scan
        uses: returntocorp/semgrep-action@v1
        with:
          # 配置选项
          config: |
            p/security-audit
            p/cwe-top-25
            p/owasp-top-10
            .semgrep-rules/

          # 高级选项
          audit: 'on'
          generate-sarif: '1'
          severity: ERROR

      # 上传结果到 GitHub Security
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: semgrep.sarif

      # 评论 PR
      - name: PR Comment
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('semgrep.sarif', 'utf8'));

            if (results.runs[0].results.length > 0) {
              const comment = `## Semgrep 发现 ${results.runs[0].results.length} 个问题\n\n请查看详细报告。`;
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: comment
              });
            }
```

### 2. GitLab CI 集成

```yaml
# .gitlab-ci.yml
stages:
  - test

semgrep:
  stage: test
  image: returntocorp/semgrep
  script:
    - semgrep --config=auto --json --output=semgrep.json .
  artifacts:
    paths:
      - semgrep.json
    expire_in: 1 week
  only:
    - merge_requests
    - main
```

### 3. Jenkins 集成

```groovy
// Jenkinsfile
pipeline {
    agent any

    stages {
        stage('Semgrep Scan') {
            steps {
                sh 'semgrep --config=auto --json --output=semgrep.json .'
            }
        }

        stage('Parse Results') {
            steps {
                script {
                    def results = readJSON file: 'semgrep.json'
                    def errorCount = results['results'].size()

                    if (errorCount > 0) {
                        error("Semgrep found ${errorCount} issues")
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'semgrep.json'
        }
    }
}
```

---

## 第五部分：实战案例

### 案例 1: Web 应用安全扫描

**场景**: 扫描 Python Flask 应用

```bash
# 1. 创建配置
cat > .semgrep.yaml <<EOF
rules:
  - id: flask-security
    pattern-either:
      - pattern: app.run(debug=True)
      - pattern: app.run(host="0.0.0.0")
    message: Flask 开发服务器不应在生产环境使用
    severity: ERROR
    languages: [python]
EOF

# 2. 运行扫描
semgrep --config=.semgrep.yaml .

# 3. 查看结果
# flask/app.py:5: app.run(debug=True)
# ❌ Flask 开发服务器不应在生产环境使用
```

### 案例 2: API 安全检查

**场景**: 检查 API 安全问题

```yaml
rules:
  - id: missing-auth
    pattern: |
      @app.route("/api/...")
      def $FUNC():
          ...
    message: API 端点缺少认证装饰器
    severity: WARNING
    languages: [python]

  - id: cors-misconfiguration
    pattern: |
      CORS(app, resources={r"/*": {"origins": "*"}})
    message: CORS 配置过于宽松
    severity: WARNING
    languages: [python]
```

### 案例 3: 依赖漏洞扫描

```bash
# 结合依赖扫描
semgrep --config=p/pip-audit .

# 输出
# requirements.txt:5: package 'django==2.2.0' has known vulnerabilities
# 建议: 升级到 Django 3.2 或更高版本
```

---

## 第六部分：最佳实践

### 1. 规则编写原则

#### 原则 1: 从小开始

```yaml
# ❌ 太复杂
rules:
  - id: complex-rule
    pattern: |
      $APP.route($PATH, methods=[$METHOD])
      def $FUNC($ARGS):
          if not request.headers.get("Authorization"):
              return $RESPONSE, 401
          ...
    message: 复杂的认证检查

# ✅ 简单明确
rules:
  - id: missing-auth-check
    pattern: |
      @app.route("/api/...")
      def $FUNC():
          ...
    message: API 端点可能缺少认证
```

#### 原则 2: 提供修复建议

```yaml
rules:
  - id: sql-injection
    pattern: cursor.execute(f"$SQL{$INPUT}")
    message: SQL 注入风险
    severity: ERROR
    fix: |
      cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    references:
      - https://owasp.org/www-community/attacks/SQL_Injection
```

#### 原则 3: 处理误报

```yaml
rules:
  - id: weak-encryption
    pattern: hashlib.md5(...)
    message: 弱加密算法
    severity: WARNING
    # 排除特定场景
    paths:
      exclude:
        - tests/.*
        - examples/.*
```

### 2. 团队协作

#### 建立规则库

```bash
# 项目结构
semgrep-rules/
├── internal/          # 内部规则
│   ├── python/
│   ├── javascript/
│   └── go/
├── external/          # 外部规则
│   └── community/
└── custom/            # 自定义规则
    └── business-logic/
```

#### 规则审查流程

```markdown
## 新规则审查清单

### 准确性
- [ ] 规则能正确识别问题
- [ ] 误报率 < 5%
- [ ] 漏报率 < 10%

### 可用性
- [ ] 消息清晰明确
- [ ] 提供修复建议
- [ ] 包含参考链接

### 性能
- [ ] 扫描速度快
- [ ] 内存占用合理
- [ ] 不影响 CI/CD
```

### 3. 持续改进

```python
# 定期审查规则
def review_rules():
    """审查 Semgrep 规则效果"""

    # 统计误报
    false_positives = analyze_false_positives()

    # 优化规则
    for rule in false_positives:
        update_rule(rule, add_exceptions=True)

    # 发现新模式
    new_patterns = discover_vulnerability_patterns()
    for pattern in new_patterns:
        create_rule(pattern)
```

---

## 📊 知识检查

### 自我评估问题

1. **Semgrep 相比其他静态分析工具的优势是什么？**

2. **如何编写一个自定义的 Semgrep 规则？**

3. **如何在 CI/CD 中集成 Semgrep？**

4. **如何处理 Semgrep 的误报？**

5. **数据流分析在 Semgrep 中如何工作？**

---

## 📚 延伸阅读

### 官方文档

1. [Semgrep 官方文档](https://semgrep.dev/docs)
2. [Semgrep 规则编写指南](https://semgrep.dev/docs/writing-rules/overview)
3. [Semgrep CI/CD 集成](https://semgrep.dev/docs/integrations/)

### 推荐资源

1. [Semgrep 规则库](https://semgrep.dev/explore)
2. [OWASP Semgrep 规则](https://github.com/semgrep/semgrep-rules)
3. [静态分析最佳实践](https://github.com/github/super-linter)

---

**课程总结**: Semgrep 是一个强大而灵活的静态分析工具。通过掌握规则编写和 CI/CD 集成，你可以建立自动化的安全扫描流程，在开发早期发现和修复安全问题。

**下一步**: 在你的项目中集成 Semgrep，建立团队规则库。

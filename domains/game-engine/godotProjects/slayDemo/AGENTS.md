# slayDemo Agent Rules

## Test Before Delivery

After every feature or module development task, run the project unit test suite before delivery.

Required command from the repository root:

```bash
cd client/slay-demo
godot --headless --path . res://tests/test_runner.tscn
```

If Godot is not available on `PATH` in WSL, use the Windows console binary as documented in `client/slay-demo/tests/README.md`.

Delivery is complete only when the test run exits with code `0` and includes:

```text
All tests passed.
```

If tests fail, fix the failing behavior and rerun the suite. If the local environment cannot run Godot tests, report that clearly and ask the user to run the command manually before accepting delivery.

---

## Use Universal Logger for Debugging

### 日志系统概述

项目使用 **Universal Logger** 插件进行运行时日志记录，支持双格式输出：
- **控制台**：人类可读的文本格式
- **文件**：JSON 格式，AI Agent 可解析

### 日志文件位置

```
client/slay-demo/.godot/game.log          # JSON 格式日志（AI 可解析）
client/slay-demo/.godot/logger_config.yaml # 日志配置文件
```

### 日志 API 使用

```gdscript
# 基础日志方法
ULogger.debug("MODULE", "调试信息", {"key": "value"})
ULogger.info("MODULE", "普通信息")
ULogger.warn("MODULE", "警告信息")
ULogger.error("MODULE", "错误信息")

# 业务便捷方法
ULogger.battle("战斗开始，敌人数量=3")
ULogger.skill("技能释放：fireball")
ULogger.ai("敌人决策：攻击")
ULogger.ui("UI刷新：血量更新")
ULogger.lifecycle("对象创建：enemy_1")
```

### Agent 调试工作流

当遇到运行时错误或需要调试时：

**1. 运行游戏产生日志**
```bash
cd client/slay-demo
godot --headless --path . res://tests/test_runner.tscn
```

**2. 读取日志文件**
```bash
# 查看 JSON 格式日志
cat .godot/game.log | jq .

# 查找特定模块的日志
grep '"module":"BATTLE"' .godot/game.log | jq .
```

**3. 分析日志模式**
```python
import json

# 读取日志并分析
with open('.godot/game.log') as f:
    for line in f:
        entry = json.loads(line)
        if entry['level'] == 'ERROR':
            print(f"错误: {entry['msg']}")
            print(f"位置: {entry.get('data', {})}")
```

**4. 根据日志修复代码**
- 定位错误发生的脚本和行号
- 理解错误上下文
- 应用最小修复
- 重新运行验证

### 日志级别控制

默认配置（`.godot/logger_config.yaml`）：
```yaml
global_level: INFO
modules:
  BATTLE: DEBUG    # 战斗模块详细日志
  SKILL: DEBUG     # 技能模块详细日志
  AI: INFO         # AI 模块普通日志
  UI: WARN         # UI 模块只记录警告
  LIFECYCLE: INFO  # 生命周期模块普通日志
```

### 运行时日志分析

**查找错误模式**：
```bash
# 查找所有错误日志
grep '"level":"ERROR"' .godot/game.log | jq .

# 查找特定时间段的日志
grep '"ts":1780328' .godot/game.log | jq .

# 统计错误类型
grep '"level":"ERROR"' .godot/game.log | jq -r '.msg' | sort | uniq -c
```

**分析业务流程**：
```bash
# 查看战斗流程
grep '"module":"BATTLE"' .godot/game.log | jq -r '.msg'

# 查看技能释放顺序
grep '"module":"SKILL"' .godot/game.log | jq -r '.msg'

# 查看 AI 决策
grep '"module":"AI"' .godot/game.log | jq -r '.msg'
```

### 重要提示

1. **日志与测试结合**：测试失败时，优先查看日志了解运行状态
2. **结构化数据**：利用日志中的 `data` 字段传递关键信息
3. **最小修复原则**：根据日志定位问题后，只做必要的修复
4. **验证闭环**：修复后重新运行，检查日志确认错误消失

# Universal Logger for Godot

AI 友好的通用日志系统，支持结构化输出和自动错误模式识别。

> **注意**：日志系统的 Autoload 名称是 `ULogger`（避免与引擎内置类名冲突）

## 功能特性

- ✅ **结构化日志**：JSON 格式输出，便于 AI Agent 解析
- ✅ **双格式输出**：控制台文本 + 文件 JSON
- ✅ **日志级别**：DEBUG / INFO / WARN / ERROR
- ✅ **模块化**：按模块控制日志级别
- ✅ **AI 模式识别**：自动识别常见错误并生成修复建议
- ✅ **运行时配置**：支持热加载配置文件

## 快速开始

### 1. 启用插件

打开 Godot 编辑器：
`项目 → 项目设置 → 插件 → 启用 Universal Logger`

### 2. 基础用法

```gdscript
# 使用日志级别方法
Logger.debug("MODULE", "调试信息", {"key": "value"})
Logger.info("MODULE", "普通信息")
Logger.warn("MODULE", "警告信息")
Logger.error("MODULE", "错误信息")

# 使用业务便捷方法
ULogger.battle("战斗开始，敌人数量=3")
ULogger.skill("技能释放：fireball")
ULogger.ai("敌人决策：攻击")
ULogger.ui("UI刷新：血量更新")
ULogger.lifecycle("对象创建：enemy_1")
```

### 3. 配置文件

创建 `.godot/logger_config.yaml`：

```yaml
# 全局日志级别
global_level: INFO

# 模块级别配置
modules:
  BATTLE: DEBUG
  SKILL: DEBUG
  AI: INFO
  UI: WARN
  LIFECYCLE: INFO

# 输出配置
outputs:
  - type: console
  - type: file
    path: .godot/game.log
    format: json
```

### 4. 日志输出

**控制台输出**（人类可读）：
```
[10:30:45] [INFO] [BATTLE] 战斗开始，敌人数量=3
```

**文件输出**（AI 可解析，JSON 格式）：
```json
{"ts":1714542645,"level":"INFO","module":"BATTLE","msg":"战斗开始，敌人数量=3","data":{}}
```

## AI 模式识别

系统会自动识别以下错误模式：

### 1. 空引用错误（null_reference）

识别特征：
- `Invalid get index on base: null object`
- `Attempt to call function on base: null object`

修复建议：
```gdscript
# 在访问前检查 null
if target != null and is_instance_valid(target):
    target.apply_damage(damage)
```

### 2. 数组越界错误（index_out_of_bounds）

识别特征：
- `Invalid get index (-1)`
- `Index out of bounds`

修复建议：
```gdscript
# 检查索引范围
if index >= 0 and index < array.size():
    value = array[index]
```

### 3. 信号断连错误（signal_disconnect）

识别特征：
- `signal not found`
- `object was freed`

修复建议：
```gdscript
# 检查对象有效性
if is_instance_valid(object):
    object.signal_name.connect(_on_handler)
```

## Agent 集成

### 读取日志

```python
import json

with open('.godot/game.log') as f:
    for line in f:
        entry = json.loads(line)
        if entry['module'] == 'BATTLE':
            print(f"[{entry['level']}] {entry['msg']}")
```

### 获取分析报告

```python
import json

with open('.godot/analysis_report.json') as f:
    report = json.load(f)

for error in report['errors']:
    print(f"模式: {error['pattern']}")
    print(f"次数: {error['count']}")
    print(f"修复: {error['fix']}")
```

## API 参考

### 日志方法

| 方法 | 描述 |
|------|------|
| `ULogger.debug(module, msg, data)` | 调试级别日志 |
| `ULogger.info(module, msg, data)` | 信息级别日志 |
| `ULogger.warn(module, msg, data)` | 警告级别日志 |
| `ULogger.error(module, msg, data)` | 错误级别日志 |
| `ULogger.battle(msg, data)` | 战斗模块日志（INFO） |
| `ULogger.skill(msg, data)` | 技能模块日志（INFO） |
| `ULogger.ai(msg, data)` | AI 模块日志（INFO） |
| `ULogger.ui(msg, data)` | UI 模块日志（INFO） |
| `ULogger.lifecycle(msg, data)` | 生命周期日志（INFO） |

### 运行时控制

| 方法 | 描述 |
|------|------|
| `ULogger.set_level(module, level)` | 设置模块日志级别 |
| `ULogger.enable_module(module, enabled)` | 启用/禁用模块日志 |
| `LogConfig.reload()` | 重新加载配置文件 |

## 目录结构

```
addons/universal_logger/
├── plugin.gd                    # 插件入口
├── plugin.cfg                   # 插件配置
├── logger.gd                    # 核心 Logger
├── log_config.gd                # 配置管理
├── outputs/
│   ├── log_output.gd            # 输出接口
│   ├── file_output.gd           # 文件输出
│   └── console_output.gd        # 控制台输出
├── patterns/
│   ├── pattern_matcher.gd       # 模式匹配器基类
│   ├── null_ref_pattern.gd      # 空引用模式
│   ├── index_error_pattern.gd   # 数组越界模式
│   ├── signal_disconnect_pattern.gd  # 信号断连模式
│   └── report_generator.gd      # 报告生成器
└── README.md                     # 本文档
```

## 集成示例

### 现有代码迁移

**之前**：
```gdscript
func _log(message: String) -> void:
    message_logged.emit(message)
```

**之后**（保持向后兼容）：
```gdscript
func _log(message: String) -> void:
    message_logged.emit(message)  # 保留信号

    var logger = get_node_or_null("/root/ULogger")
    if logger:
        logger.battle(message)  # 新增结构化日志
```

## 故障排除

### 问题：日志未输出

检查：
1. 插件是否已启用（项目设置 → 插件）
2. 检查 `.godot/game.log` 文件权限
3. 确认日志级别设置（DEBUG 级别可能未启用）

### 问题：JSON 解析失败

确保每行日志是一个完整的 JSON 对象。如果解析失败，会降级为文本格式。

## 许可证

MIT License

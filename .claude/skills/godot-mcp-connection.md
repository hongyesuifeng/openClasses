# Godot MCP 连接与恢复技能

> 用于通过 GoPeak Godot MCP 连接、复用、恢复并验证 Godot 编辑器控制链路。

## 技能目标

当需要使用 Godot MCP 编辑项目时，优先复用当前已经打开并连接成功的 Godot 编辑器；只有在连接不可用、bridge owner 混乱或端口冲突时，才清理旧进程并重新启动一套可控的 GoPeak MCP + Godot Editor。

核心原则：**一个 GoPeak bridge owner 控制一个 Godot Editor 连接**。不要同时启动多个 GoPeak、多个 OpenCode 子会话或多个 Godot 编辑器来抢占 `127.0.0.1:6505`。

## 适用场景

- 需要让 AI 通过 Godot MCP 创建场景、添加节点、修改场景树。
- Godot 右上角 MCP 状态显示 `Connecting...`、`Disconnected` 或工具返回 `Not connected`。
- 出现 `EADDRINUSE: address already in use 127.0.0.1:6505`。
- 已经打开 Godot 编辑器，想让 MCP 直接连接，不想重复打开 Godot。

## 项目默认路径

当前仓库常用 Godot 项目路径：

```text
D:\openClass\openClasses\domains\game-engine\godotProjects\slayDemo\client\slay-demo
```

当前 Godot 可执行文件路径：

```text
C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64.exe
C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64_console.exe
```

OpenCode MCP 配置应包含：

```json
{
  "mcp": {
    "godot": {
      "type": "local",
      "command": ["npx", "-y", "gopeak"],
      "enabled": true,
      "environment": {
        "GODOT_PATH": "C:\\Users\\Lenovo\\Downloads\\Godot_v4.6.2-stable_win64.exe\\Godot_v4.6.2-stable_win64_console.exe",
        "GOPEAK_TOOL_PROFILE": "compact"
      }
    }
  }
}
```

## 标准工作流

### 1. 先检查已有连接

不要一上来启动新的 Godot。先确认当前端口和进程状态：

```powershell
Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 6505 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess

Get-CimInstance Win32_Process |
  Where-Object { $_.Name -like 'Godot*' } |
  Select-Object ProcessId,Name,ExecutablePath,CommandLine

Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'gopeak|godot-mcp|Gopeak' } |
  Select-Object ProcessId,Name,ExecutablePath,CommandLine
```

判断标准：

- 有 `127.0.0.1:6505 Listen`：GoPeak bridge 已启动。
- 有 `127.0.0.1:6505 Established`：Godot 插件已连接 bridge。
- Godot 编辑器右上角显示 `MCP: Connected`：可以直接使用当前连接。
- 只有 `Listen` 没有 `Established`，且 Godot 显示 `Connecting...`：插件还没连上或连接到了错误 owner。

### 2. 如果已有连接可用，直接调用 MCP

满足以下条件时，不要重启 Godot：

- `6505` 有 `Established`。
- Godot 编辑器打开的是目标项目。
- Godot 右上角 MCP 状态不是一直 `Connecting...`。

此时直接使用 Godot MCP 工具，例如：

```text
projectPath: D:\openClass\openClasses\domains\game-engine\godotProjects\slayDemo\client\slay-demo
scenePath: scenes/mcp_test_scene.tscn
```

可执行验证：

1. `scene-nodes` 读取场景树。
2. `scene-node-add` 添加一个临时 `Node2D`。
3. 再次 `scene-nodes` 或读取 `.tscn` 文件确认写入。

## 故障恢复工作流

### 3. 如果连接不可用，先清理所有冲突进程

当出现以下情况时执行清理：

- `Not connected`
- `EADDRINUSE`
- Godot 一直显示 `MCP: Connecting...`
- 多个 `gopeak` / `node.exe` / Godot 进程同时存在
- `6505` 的 owner 不是当前可控 MCP

清理命令：

```powershell
Get-CimInstance Win32_Process |
  Where-Object {
    ($_.Name -eq 'node.exe' -and $_.CommandLine -match 'gopeak|godot-mcp|Gopeak') -or
    ($_.Name -like 'Godot*')
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
    "Stopped $($_.Name) PID $($_.ProcessId)"
  }
```

然后确认端口释放：

```powershell
$c = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 6505 -ErrorAction SilentlyContinue
if ($c) { $c | Select-Object LocalAddress,LocalPort,State,OwningProcess } else { "Port 6505 is free" }
```

注意：`TimeWait` 且 `OwningProcess = 0` 是端口关闭后的短暂状态，不需要杀 PID 0。

### 4. 重新启动一套可控连接

启动顺序必须是：

1. 启动 GoPeak bridge。
2. 等 `6505 Listen`。
3. 启动 Godot 编辑器打开目标项目。
4. 等 `6505 Established` 或 `/health` 显示 `connected: true`。
5. 再执行 scene/script 工具。

PowerShell 启动模板：

```powershell
$env:GODOT_PATH = "C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64_console.exe"
$env:GOPEAK_TOOL_PROFILE = "compact"
$env:GOPEAK_BRIDGE_PORT = "6505"
$env:GODOT_BRIDGE_PORT = "6505"
$env:MCP_BRIDGE_PORT = "6505"

Start-Process -FilePath "npx.cmd" -ArgumentList "-y", "gopeak" -WindowStyle Hidden
Start-Sleep -Seconds 5

Start-Process -FilePath "C:\Users\Lenovo\Downloads\Godot_v4.6.2-stable_win64.exe\Godot_v4.6.2-stable_win64.exe" `
  -ArgumentList "--path", "D:\openClass\openClasses\domains\game-engine\godotProjects\slayDemo\client\slay-demo", "--editor"
```

连接检查：

```powershell
Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 6505 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress,LocalPort,RemoteAddress,RemotePort,State,OwningProcess
```

成功时应至少看到：

```text
127.0.0.1  6505  Listen       <node pid>
127.0.0.1  6505  Established  <same node pid>
```

也可以检查 health：

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:6505/health"
```

成功时 `bridge.connected` 应为 `true`，并且 `bridge.projectPath` 指向目标 Godot 项目。

## MCP 编辑验证模板

### 创建测试场景

目标：创建一个最小 `Node2D` 场景。

```text
projectPath: D:\openClass\openClasses\domains\game-engine\godotProjects\slayDemo\client\slay-demo
scenePath: scenes/mcp_smoke_test_scene.tscn
rootNodeType: Node2D
```

验证文件内容应类似：

```gdscene
[gd_scene format=3 uid="uid://..."]

[node name="Node2D" type="Node2D" unique_id=...]
```

### 添加测试节点

目标：在已有场景根节点下添加 `Node2D`。

```text
scenePath: scenes/mcp_test_scene.tscn
parentNodePath: .
nodeName: 1234
nodeType: Node2D
properties: { "position": { "type": "Vector2", "x": 240, "y": 200 } }
```

验证 `.tscn` 应包含：

```gdscene
[node name="1234" type="Node2D" parent="."]
position = Vector2(240, 200)
```

## 重要反模式

不要使用嵌套的：

```powershell
opencode run "...Godot MCP..."
```

原因：`opencode run` 会启动新的临时 OpenCode/MCP 进程，而不是复用当前已经连接 Godot 的 GoPeak bridge。新进程会尝试再绑定 `6505`，常见结果是：

```text
EADDRINUSE: address already in use 127.0.0.1:6505
```

然后它会误判自己的 bridge 未连接，并尝试重新 `godot_editor-launch`，导致重复打开 Godot。

## 排障速查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| Godot 显示 `MCP: Connecting...` | 插件加载了，但没有连上 bridge | 检查 `6505 Listen`；没有则启动 GoPeak；有但不通则清理重启 |
| `EADDRINUSE` | 另一个 GoPeak 占用 `6505` | 停掉旧 GoPeak/node 进程，只保留一个 owner |
| `Not connected` | 当前调用工具的 MCP 不是 bridge owner | 不要嵌套 `opencode run`；使用当前 owner 或清理重启 |
| 有 `Listen` 无 `Established` | bridge 开了但 Godot 插件没连上 | 确认 Godot 打开目标项目且插件启用，必要时重启 Godot |
| 有多个 Godot 窗口 | 多次 `launch_editor` 或手动启动 | 关闭多余窗口，只保留目标项目 |

## 完成标准

一次 Godot MCP 编辑测试只有同时满足以下条件才算成功：

1. `6505` 有 `Listen` 和 `Established`。
2. `bridge.connected = true`。
3. Godot 打开的项目路径是目标项目。
4. MCP 工具返回成功，而不是仅文件系统手写成功。
5. 读取 `.tscn` 或 `scene-nodes` 能看到新场景/新节点。

---

**技能版本**: 1.0
**创建日期**: 2026-05-15

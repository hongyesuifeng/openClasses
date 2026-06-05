# 15. Godot slayDemo → 微信小游戏包转化方案

> **文档版本**：v2.0（最终版）
> **创建日期**：2026-06-05
> **适用项目**：slayDemo（Godot 4.6 类杀戮尖塔卡牌 Roguelike）
> **COS 域名**：`https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com`
> **目标**：1-2 周内完成 MVP，跑通微信小游戏启动 + 基础场景渲染 + 远程资源加载

---

## 1. 背景

Godot 官方只支持 Web/HTML5 导出，微信小游戏不是标准浏览器环境，三个根本性差异导致无法直接使用：

| 差异 | 浏览器标准 | 微信小游戏 |
|------|-----------|-----------|
| wasm 加载 API | `WebAssembly.instantiateStreaming(fetch(url))` | `WXWebAssembly.instantiate(path)` |
| 多线程支持 | SharedArrayBuffer + pthreads | **不支持** |
| 文件系统 | IndexedDB / OPFS | WXMEMFS（自定义内存文件系统） |

官方预编译的 Godot wasm 在微信中**无法启动**，必须使用经过 patch 的特殊版本。

---

## 2. 技术选型：godothub/godot-minigame

**仓库**：https://github.com/godothub/godot-minigame
**支持版本**：Godot 4.4 ~ 4.6.2（含 4.6.2，2026-06-04 发布）

### 2.1 核心机制（查证后）

插件通过三个层次解决兼容性问题：

**① C++ patch + 预编译 wasm 模板**
- 插件团队在 Godot 源码 commit `a16e481cf4`（即 4.6.2-rc）基础上打 patch，预编译好 `.tpz` 导出模板
- **用户无需自己编译 Godot 源码**，插件安装后自动从 GitHub Releases 下载匹配版本的模板
- wasm 编译参数：`scons platform=web target=template_release threads=no wasm_simd=no`（单线程、无 SIMD）

**② WXMEMFS 内存文件系统**
- 插件在 wasm 内置了 WXMEMFS，挂载在 `GameGlobal.GODOTSDK`
- 提供 `GODOTSDK.releasePck`、`GODOTSDK.getWxPath`、`GODOTSDK.getGodotPath` 等方法
- 远程资源通过 `fsUtils.localFetch` 原语获取，经过 WXMEMFS 映射后 Godot 可以正常访问
- `GODOTSDK.load_pack` 是暴露给 GDScript 的桥接接口（对应 `load_resource_pack`）

**③ JS 运行时胶水层**
- `godot-sdk.js` 将微信 API 桥接到 Godot Web 运行时
- `WXWebAssembly.instantiate(path)` 替代标准 `WebAssembly.instantiateStreaming`

### 2.2 关于 `load_resource_pack` 的真实情况（重要修正）

> 旧方案中直接调用 `ProjectSettings.load_resource_pack(local_path)` 加载 COS 下载的 pck，**这在标准 Web 环境下不可行**。

正确理解：
- Web 平台无本地文件系统，`wx.downloadFile` 下载到 `USER_DATA_PATH` 后，路径对 Godot 不可见
- godot-minigame 的 WXMEMFS 层**绕开了这个问题**，而不是修复标准 API
- 实际链路是：`wx.downloadFile` → WXMEMFS 注入 → `GODOTSDK.load_pack(godot_path)` → Godot 资源挂载
- 具体调用方式需按插件文档/示例操作，不能直接用裸的 `ProjectSettings.load_resource_pack`

### 2.3 开发环境（混合）

| 职责 | 环境 |
|------|------|
| Godot 编辑器 GUI、场景编辑、导出 | Windows 本机（Godot 4.6.2） |
| 命令行操作（git、微信工具等） | WSL2（Ubuntu） |
| 项目文件 | `D:\openClass\openClasses\...`（WSL2 路径 `/mnt/d/...`） |

> **不需要** WSL2 编译 Godot wasm——插件提供预编译模板，Windows Godot 编辑器直接使用。

---

## 3. 包体结构

### 3.1 三层资源结构

```
主包（≤ 4MB）
  game.js / game.json / project.config.json
  Godot 启动 JS（不含 wasm）
  boot.pck（最小启动场景 + Loading）
  基础字体 + 基础 UI

引擎分包（engine/，wasm ~20MB，不计入主包限制）
  godot.wasm
  godot.worker.js

功能分包（总计 ≤ 30MB）
  battle/battle.pck
  map/map.pck
  shop/shop.pck

COS 远程资源（不计入包体，按需下载）
  cards_v001.pck
  relics_v001.pck
  monsters_v001.pck
  audio_v001.pck
```

### 3.2 slayDemo 现有目录 → 包体归属

| 现有路径 | 归属 | 备注 |
|---------|------|------|
| `scripts/autoload/` | 主包 | Autoload 单例必须在主包，否则分包崩溃 |
| `scenes/app/` + `scenes/main_menu/` | 主包 | |
| `scenes/battle/` + `scripts/battle/` | battle 分包 | |
| `scenes/map/` + `scripts/map/` | map 分包 | |
| `scenes/shop/` | shop 分包 | |
| `scenes/event/`、`scenes/rest/` 等 | 视体积放主包或分包 | |
| `assets/cards/`（图片） | COS 远程 cards_v001.pck | |
| `assets/` 音频文件 | COS 远程 audio_v001.pck | |
| `addons/godot_mcp_*`、`addons/auto_reload` | **Web 导出时排除** | 开发工具，不打包 |

### 3.3 版本管理规则

远程 pck **不覆盖旧文件**，只新增：

```
cards_v001.pck   ← 线上版
cards_v002.pck   ← 更新版（manifest.json 指向它）
```

回滚只需改 `manifest.json`，不删 COS 文件。

---

## 4. MVP 执行计划（7 天）

### Day 1：渲染器兼容性验证（卡点，必须先过）

**原因**：Web 导出只能用 Compatibility（OpenGL ES），slayDemo 桌面用 Forward+（Vulkan）。如有 shader 用了 Vulkan 特性，画面会异常，必须先确认。

**操作**：
1. Godot 编辑器 → 项目 → 导出 → 添加 **Web** 预设
2. 渲染器选 **Compatibility**，关闭 pthreads（`html/use_pthreads=false`）
3. 导出到本地目录，用浏览器打开 `index.html`（需要本地服务器，可用 VS Code Live Server 或 `python -m http.server`）
4. 检查：卡牌渲染、战斗 UI、粒子特效、字体、场景切换是否正常

**判断**：
- ✅ 视觉正常 → 继续
- ⚠️ 轻微差异 → 记录，后续修复
- ❌ 严重异常 → 先排查 `.gdshader` 文件，再推进

---

### Day 1-2：安装 godot-minigame 插件 + 研究

**操作**：
1. 从 https://github.com/godothub/godot-minigame/releases 下载对应 Godot 4.6.2 版本
2. 复制 `addons/godot-minigame/` 到 `client/slay-demo/addons/`
3. 项目设置 → 插件 → 启用 `godot-minigame`
4. **重点阅读**插件文档，确认：
   - [ ] `GODOTSDK.load_pack` 的调用方式
   - [ ] 远程 pck 加载的完整链路（WXMEMFS 如何使用）
   - [ ] 分包配置方式
   - [ ] 导出目录结构

**关键文件**：
- `addons/godot-minigame/` — 新增（导出时排除 mcp/auto_reload 等开发插件）
- `project.godot` — 添加插件配置

---

### Day 2-3：微信开发者工具启动验证

**准备**：
- 微信小游戏 AppID（在 mp.weixin.qq.com 注册，没有 AppID 也可用测试号）
- 微信开发者工具（最新稳定版）

**操作**：
1. 按插件指引，从 Godot 编辑器导出微信小游戏工程
2. 检查导出产物，确认 `game.json` 的分包配置正确
3. 微信开发者工具 → 导入项目 → 选择导出目录
4. 模拟器运行

**验收**：
- [ ] Godot 引擎正常初始化（控制台无致命错误）
- [ ] 主场景渲染正常
- [ ] 基础交互响应（点击、拖拽）
- [ ] 主包体积 ≤ 4MB（记录实际值）

---

### Day 3-4：Boot 启动场景

**目的**：为 Web 平台创建独立启动入口，不修改桌面端主场景。

**新增文件**：

`scenes/boot/boot.tscn`：
```
Node
└─ CanvasLayer
   ├─ Label（"Loading..."）
   └─ ProgressBar
```

`scripts/autoload/platform_bridge.gd`：
```gdscript
extends Node

signal boot_ready

func _ready() -> void:
    if OS.has_feature("web"):
        _boot_web()
    else:
        boot_ready.emit()

func _boot_web() -> void:
    print("[PlatformBridge] Web platform detected")
    # 按 godot-minigame 插件文档初始化 GODOTSDK
    boot_ready.emit()
```

**关键**：在 Web 导出预设中**覆盖主场景**为 `boot.tscn`，`project.godot` 的全局主场景不变，桌面开发不受影响。

**关键文件变更**：
- `scenes/boot/boot.tscn` — 新增
- `scripts/autoload/platform_bridge.gd` — 新增
- `export_presets.cfg` — Web 预设覆盖主场景

---

### Day 4-6：COS 远程资源链路

**注意**：此步骤的具体实现取决于 Day 1-2 插件研究的结果，以下为预期方案。

#### COS 目录结构

```
godot_slaydemo/
└─ v001/
   ├─ manifest.json
   ├─ test/
   │  └─ helloWorld.txt        ← 已验证可访问
   └─ packs/
      ├─ test_cards_v001.pck   ← MVP 测试用
      ├─ cards_v001.pck
      ├─ relics_v001.pck
      ├─ monsters_v001.pck
      └─ audio_v001.pck
```

#### manifest.json

```json
{
  "version": "v001",
  "base_url": "https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com/godot_slaydemo/v001",
  "packs": {
    "test_cards": {
      "file": "packs/test_cards_v001.pck",
      "local_name": "test_cards_v001.pck",
      "size": 0,
      "md5": ""
    },
    "cards": {
      "file": "packs/cards_v001.pck",
      "local_name": "cards_v001.pck",
      "size": 0,
      "md5": ""
    }
  }
}
```

#### 远程资源加载链路（修正后）

```
微信 JS 层                            Godot GDScript 层
──────────                            ─────────────────
wx.request(manifest_url)
  → 获取 manifest.json
wx.downloadFile(pck_url)
  → 下载到 USER_DATA_PATH/xxx.pck
GODOTSDK.releasePck(wx_path)          ← 关键：经 WXMEMFS 映射
  → 返回 godot_path
                                      platform_bridge.load_pack(godot_path)
                                        → GODOTSDK.load_pack(godot_path)
                                        → 资源挂载成功
                                      load("res://game/cards/test_card.png") ✓
```

> ⚠️ **注意**：`GODOTSDK.releasePck` / `GODOTSDK.load_pack` 的具体调用方式以插件文档为准，上图为预期流程。

#### remote_asset_loader.js（预期实现）

```js
// wechat_export/platform/wechat/remote_asset_loader.js

const COS_BASE_URL = 'https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com/godot_slaydemo/v001'

function requestJson(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'GET',
      success(res) {
        if (res.statusCode === 200) resolve(res.data)
        else reject(new Error(`request failed: ${res.statusCode}`))
      },
      fail: reject
    })
  })
}

async function downloadAndLoadPack(packName, onProgress) {
  const manifest = await requestJson(`${COS_BASE_URL}/manifest.json`)
  const pack = manifest.packs[packName]
  if (!pack) throw new Error(`pack not found: ${packName}`)

  const wxPath = await new Promise((resolve, reject) => {
    const localPath = `${wx.env.USER_DATA_PATH}/${pack.local_name}`
    const task = wx.downloadFile({
      url: `${manifest.base_url}/${pack.file}`,
      filePath: localPath,
      success(res) {
        if (res.statusCode === 200) resolve(localPath)
        else reject(new Error(`download failed: ${res.statusCode}`))
      },
      fail: reject
    })
    if (onProgress && task?.onProgressUpdate) {
      task.onProgressUpdate(res => onProgress(res.progress))
    }
  })

  // 通过 WXMEMFS 映射路径，让 Godot 可访问
  const godotPath = GameGlobal.GODOTSDK.releasePck(wxPath)
  return { packName, godotPath }
}

module.exports = { requestJson, downloadAndLoadPack }
```

#### platform_bridge.gd（修正后）

```gdscript
# res://scripts/autoload/platform_bridge.gd
extends Node

signal boot_ready
var loaded_packs := {}

func load_remote_pack(pack_name: String, godot_path: String) -> void:
    if loaded_packs.has(pack_name):
        return
    # 注意：此处调用方式以插件文档为准
    # 可能是 JavaScriptBridge 调用 GODOTSDK.load_pack
    # 也可能插件封装了 GDScript API
    var js_result = JavaScriptBridge.eval(
        'GameGlobal.GODOTSDK.load_pack("%s")' % godot_path
    )
    if js_result:
        loaded_packs[pack_name] = true
        ULogger.info("PLATFORM", "远程包加载成功", {"pack": pack_name})
    else:
        ULogger.error("PLATFORM", "远程包加载失败", {"pack": pack_name, "path": godot_path})
```

---

### Day 6-7：MVP 整合验证

**完整验收清单**：

- [ ] Compatibility 渲染器下视觉正常（浏览器 HTML5 测试）
- [ ] godot-minigame 插件导出成功，无报错
- [ ] 微信开发者工具模拟器中游戏启动
- [ ] Boot 场景 Loading 正常显示
- [ ] 主菜单场景正常渲染
- [ ] 战斗场景可进入，卡牌可拖拽
- [ ] 主包体积 ≤ 4MB（记录实际值）
- [ ] COS manifest.json 可通过 `wx.request` 获取
- [ ] 测试 pck 下载成功并加载
- [ ] 测试资源图片可在画面中显示

---

## 5. 微信后台配置

### 合法域名（必须配置）

在微信公众平台 → 开发管理 → 开发设置 中配置：

| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com` |
| downloadFile 合法域名 | `https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com` |

未配置时真机会报：`url not in domain list`，微信开发者工具模拟器可暂时绕过。

---

## 6. export_presets.cfg 关键配置

```ini
[preset.0]

name="微信小游戏"
platform="Web"
runnable=true
export_filter="all_resources"
# 排除开发工具插件
exclude_filter="addons/godot_mcp_editor/*,addons/godot_mcp_runtime/*,addons/auto_reload/*"

[preset.0.options]

html/use_pthreads=false
html/thread_support="no"
# 覆盖主场景为 Boot 场景（桌面端不受影响）
application/boot_splash_image=""
```

---

## 7. 风险矩阵

| 风险 | 概率 | 影响 | 处理方案 |
|------|------|------|---------|
| 渲染器异常（shader 不兼容） | 中 | 高（卡点） | Day 1 先验证；排查 `.gdshader` 文件 |
| 插件 GODOTSDK API 与预期不符 | 中 | 中 | 详读插件文档和示例代码，以实际 API 为准 |
| 主包体积超 4MB | 低（插件已优化） | 高 | 记录实际值；超出则移更多资源进分包 |
| 微信域名未配置 | 低 | 中（真机） | 模拟器可绕过；真机前必须配置 |
| pck 版本与 Godot 版本不匹配 | 低 | 高 | 用同一个 Godot 4.6.2 导出所有 pck |
| iOS WebGL 兼容性 | 高（iOS 15.0-15.1） | 中 | MVP 只关注 Android，iOS 后续优化 |

---

## 8. 需要提前准备

| 准备项 | 说明 |
|--------|------|
| 微信小游戏 AppID | mp.weixin.qq.com 注册；无 AppID 也可用测试号体验 |
| 微信开发者工具 | 下载最新稳定版 |
| godot-minigame 插件 | 从 GitHub Releases 下载 Godot 4.6.2 对应版本 |
| COS 合法域名配置 | 真机测试前必须配置（见第 5 节） |

---

## 9. MVP 之后的扩展方向

- 微信分包：battle / map / shop 正式拆分
- 正式资源拆分：cards / relics / monsters / audio 独立 pck
- 下载进度 UI + 弱网重试
- 本地缓存判断（跳过已下载的 pck）
- 真机测试（Android + iOS）
- 审核资源一致性检查
- 自定义引擎编译裁剪（减小 wasm 体积）

---

## 10. 参考资料

- godothub/godot-minigame：https://github.com/godothub/godot-minigame
- 微信小游戏分包加载：https://developers.weixin.qq.com/minigame/dev/guide/base-ability/subPackage/useSubPackage.html
- 微信小游戏 WXWebAssembly：https://developers.weixin.qq.com/minigame/dev/guide/performance/perf-webassembly.html
- Godot Web 导出文档：https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html
- Godot JavaScriptBridge：https://docs.godotengine.org/en/stable/tutorials/platform/web/javascript_bridge.html

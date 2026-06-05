# 15. Godot slayDemo → 微信小游戏包转化方案

> **文档版本**：v3.0（整合版）
> **创建日期**：2026-06-05
> **适用项目**：slayDemo（Godot 4.6 类杀戮尖塔卡牌 Roguelike）
> **COS 域名**：`https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com`
> **目标**：1-2 周内完成 MVP，跑通微信小游戏启动 + 基础场景渲染 + 远程资源加载

---

## 1. 背景与核心结论

Godot 官方只支持 Web/HTML5 导出，微信小游戏不是标准浏览器环境，三个根本性差异导致无法直接使用：

| 差异 | 浏览器标准 | 微信小游戏 |
|------|-----------|-----------|
| wasm 加载 API | `WebAssembly.instantiateStreaming(fetch(url))` | `WXWebAssembly.instantiate(path)` |
| 多线程支持 | SharedArrayBuffer + pthreads | **不支持** |
| 文件系统 | IndexedDB / OPFS | WXMEMFS（自定义内存文件系统） |

> 官方预编译的 Godot wasm 在微信中**无法启动**，必须使用经过 patch 的特殊版本。

更准确的工程理解是：

> 先将 Godot 项目导出为 Web/WASM 产物，再通过适配层、资源拆分、WXMEMFS 映射、远程资源管理等手段，将其组织成符合微信小游戏运行环境的工程结构。

---

## 2. 技术选型：godothub/godot-minigame

**仓库**：https://github.com/godothub/godot-minigame
**支持版本**：Godot 4.4 ~ 4.6.2（含 4.6.2，2026-06-04 发布）

### 2.1 核心机制

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

### 2.2 关于 `load_resource_pack` 的真实情况（重要）

> 直接调用 `ProjectSettings.load_resource_pack(local_path)` 加载 COS 下载的 pck，**在标准 Web 环境下不可行**。

正确链路：
- Web 平台无本地文件系统，`wx.downloadFile` 下载到 `USER_DATA_PATH` 后，路径对 Godot 不可见
- godot-minigame 的 WXMEMFS 层绕开了这个问题
- 实际链路：`wx.downloadFile` → WXMEMFS 注入 → `GODOTSDK.load_pack(godot_path)` → Godot 资源挂载

### 2.3 开发环境

| 职责 | 环境 |
|------|------|
| Godot 编辑器 GUI、场景编辑、导出 | Windows 本机（Godot 4.6.2） |
| 命令行操作（git、微信工具等） | WSL2（Ubuntu） |
| 项目文件 | `D:\openClass\openClasses\...`（WSL2 路径 `/mnt/d/...`） |

> 不需要 WSL2 编译 Godot wasm——插件提供预编译模板，Windows Godot 编辑器直接使用。

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

### 3.3 资源拆分参考表

| 资源路径 | 文件大小 | 建议位置 | 加载时机 |
|---------|---------|---------|---------|
| `assets/loading/logo.png` | 小 | 主包 | 启动时 |
| `scenes/boot/boot.tscn` | 小 | 主包 | 启动时 |
| `scripts/autoload/*.gd` | 小 | 主包 | 启动时 |
| `scenes/battle/` | 中 | battle 分包 | 进入战斗前 |
| `scenes/map/` | 中 | map 分包 | 进入地图前 |
| `assets/cards/*.png` | 大 | COS 远程 | 进入战斗前 |
| `assets/audio/bgm_battle.mp3` | 大 | COS 远程 | 进入战斗前 |
| `assets/cards/*.pck` | 大 | COS 远程 cards_v001.pck | 按需加载 |

### 3.4 版本管理规则

远程 pck **不覆盖旧文件**，只新增：

```
cards_v001.pck   ← 线上版
cards_v002.pck   ← 更新版（manifest.json 指向它）
```

回滚只需改 `manifest.json`，不删 COS 文件。

---

## 4. 微信小游戏工程目录结构

```
wechat_minigame/
├─ game.json
├─ game.js
├─ project.config.json
├─ adapter/
│  ├─ wx-adapter.js          ← 微信 API 总入口
│  ├─ canvas-adapter.js      ← wx.createCanvas() 适配
│  ├─ network-adapter.js     ← wx.request / wx.downloadFile 适配
│  ├─ fs-adapter.js          ← wx.getFileSystemManager 适配
│  └─ audio-adapter.js       ← wx.createInnerAudioContext 适配
├─ engine/
│  ├─ godot.loader.js
│  ├─ godot.wasm             ← 放引擎分包
│  └─ godot.js
├─ bootstrap/
│  ├─ startup.js             ← 启动协调器
│  ├─ resource_manager.js    ← 逻辑路径解析
│  ├─ version_manager.js     ← latest.json + manifest 管理
│  ├─ download_manager.js    ← 并发下载 + 重试
│  ├─ cache_manager.js       ← 缓存容量控制 + 旧版本清理
│  └─ error_reporter.js      ← 统一错误捕获
├─ assets/
│  ├─ loading/               ← 首屏 Loading 图
│  └─ base_config/           ← 最小基础配置
├─ subpackages/
│  ├─ battle/
│  ├─ map/
│  └─ shop/
└─ remote_manifest_sample/
   ├─ latest.json
   └─ manifest.json
```

---

## 5. 关键适配点

### 5.1 入口适配

浏览器 API → 微信 API 对照：

| 浏览器标准 | 微信小游戏替代 |
|-----------|-------------|
| `document.createElement('canvas')` | `wx.createCanvas()` |
| `fetch(url)` | `wx.request()` |
| `XMLHttpRequest` | `wx.request()` |
| `localStorage` | `wx.getStorageSync()` |
| `IndexedDB` | `wx.getFileSystemManager()` |
| `AudioContext` | `wx.createInnerAudioContext()` |
| `Worker` | 不支持，需关闭或替代 |
| `SharedArrayBuffer` | 不支持，必须关闭线程 |

需检查 Godot 导出 JS 中是否存在以上调用，判断由 adapter 模拟还是替换。

### 5.2 Canvas / WebGL 适配

需要处理：

```js
// 浏览器
const canvas = document.getElementById("canvas")

// 微信小游戏
const canvas = wx.createCanvas()
```

关注点：Canvas 尺寸、DPR 适配、横竖屏、触摸事件、WebGL Context、resize 事件、onShow/onHide 生命周期。

### 5.3 文件系统适配

路径映射关系：

```
Godot 逻辑路径：  res://cards/card_001.png
远程 URL：        https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com/godot_slaydemo/v001/cards/card_001.png
微信本地缓存：    wx.env.USER_DATA_PATH + "/cache/v001/cards/card_001.png"
```

### 5.4 音频适配

slayDemo 有 AudioManager autoload，Web 导出时需确认：
- BGM/SFX 替换为 `wx.createInnerAudioContext()`
- onShow 恢复音频，onHide 暂停音频
- 远程音频文件走 COS 缓存

---

## 6. COS 远程资源目录结构

```
godot_slaydemo/
├─ latest.json
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

### 6.1 latest.json

```json
{
  "latest": "v001",
  "minClientVersion": "1.0.0",
  "forceUpdate": false,
  "manifest": "https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com/godot_slaydemo/v001/manifest.json"
}
```

### 6.2 manifest.json

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
    },
    "relics": {
      "file": "packs/relics_v001.pck",
      "local_name": "relics_v001.pck",
      "size": 0,
      "md5": ""
    },
    "monsters": {
      "file": "packs/monsters_v001.pck",
      "local_name": "monsters_v001.pck",
      "size": 0,
      "md5": ""
    },
    "audio": {
      "file": "packs/audio_v001.pck",
      "local_name": "audio_v001.pck",
      "size": 0,
      "md5": ""
    }
  }
}
```

---

## 7. Bootstrap 模块设计

### 7.1 启动流程

```
微信启动小游戏
  ↓ game.js
  ↓ 初始化 adapter（canvas / network / fs / audio）
  ↓ 创建 Canvas / WebGL 上下文
  ↓ 显示 Loading
  ↓ VersionManager.init() → 请求 latest.json
  ↓ VersionManager.fetchManifest() → 下载 manifest.json
  ↓ CacheManager.diff() → 对比本地 manifest，找出缺失/过期资源
  ↓ DownloadManager.downloadRequired() → 下载首屏必要资源
  ↓ CacheManager.save() → 保存到微信本地，校验 md5
  ↓ 初始化 Godot WASM（WXWebAssembly.instantiate）
  ↓ GODOTSDK.load_pack(boot_pck)
  ↓ 进入主菜单
  ↓ 按需加载战斗、地图、章节资源
```

### 7.2 VersionManager

职责：

```
1. 获取 latest.json（禁止强缓存）
2. 获取 manifest.json（禁止强缓存）
3. 判断当前资源版本
4. 判断是否强制更新
5. 判断客户端版本是否满足 minClientVersion
```

### 7.3 ResourceManager

职责：

```
1. 根据逻辑路径获取资源
2. 判断资源本地是否存在
3. 判断资源 md5 是否正确
4. 不存在则触发下载
5. 返回可被引擎使用的本地路径（经 WXMEMFS 映射）
```

### 7.4 DownloadManager

职责：

```
1. 并发下载控制
2. 下载进度统计（供 Loading UI 使用）
3. 失败重试（最多 3 次）
4. 超时处理
5. 下载完成回调
```

### 7.5 CacheManager

职责：

```
1. 管理本地缓存目录（按版本号分目录）
2. 保存文件到 wx.env.USER_DATA_PATH
3. 删除旧版本资源目录
4. 控制缓存体积上限
5. 清理临时文件
```

### 7.6 ErrorReporter

职责：

```
1. 捕获启动错误
2. 捕获资源下载错误
3. 捕获 WASM 加载错误
4. 捕获 PCK 加载错误
5. 输出可读日志，方便 AI / 开发者继续修复
```

---

## 8. 远程资源加载链路（修正后）

```
微信 JS 层                            Godot GDScript 层
──────────                            ─────────────────
VersionManager.init()
  → wx.request(latest.json)
  → wx.request(manifest.json)
DownloadManager.download(pck_url)
  → wx.downloadFile → USER_DATA_PATH/xxx.pck
GODOTSDK.releasePck(wx_path)          ← 关键：经 WXMEMFS 映射
  → 返回 godot_path
                                      platform_bridge.load_pack(godot_path)
                                        → GODOTSDK.load_pack(godot_path)
                                        → 资源挂载成功
                                      load("res://cards/card_001.png") ✓
```

### 8.1 remote_asset_loader.js（预期实现）

```js
// wechat_minigame/bootstrap/remote_asset_loader.js

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

  const godotPath = GameGlobal.GODOTSDK.releasePck(wxPath)
  return { packName, godotPath }
}

module.exports = { requestJson, downloadAndLoadPack }
```

### 8.2 platform_bridge.gd（修正后）

```gdscript
# res://scripts/autoload/platform_bridge.gd
extends Node

signal boot_ready
var loaded_packs := {}

func _ready() -> void:
    if OS.has_feature("web"):
        _boot_web()
    else:
        boot_ready.emit()

func _boot_web() -> void:
    ULogger.info("PLATFORM", "Web 平台初始化")
    # 按 godot-minigame 插件文档初始化 GODOTSDK
    boot_ready.emit()

func load_remote_pack(pack_name: String, godot_path: String) -> void:
    if loaded_packs.has(pack_name):
        return
    # 注意：调用方式以插件文档为准
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

## 9. MVP 执行计划（7 天）

### Day 1：渲染器兼容性验证（卡点，必须先过）

**原因**：Web 导出只能用 Compatibility（OpenGL ES），slayDemo 桌面用 Forward+（Vulkan）。

**操作**：
1. Godot 编辑器 → 项目 → 导出 → 添加 **Web** 预设
2. 渲染器选 **Compatibility**，关闭 pthreads（`html/use_pthreads=false`）
3. 导出到本地目录，用浏览器打开 `index.html`（需要本地服务器）
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

---

### Day 2-3：微信开发者工具启动验证

**准备**：微信小游戏 AppID（mp.weixin.qq.com 注册，或使用测试号）

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

`scripts/autoload/platform_bridge.gd`：见第 8.2 节

**关键**：在 Web 导出预设中**覆盖主场景**为 `boot.tscn`，`project.godot` 的全局主场景不变，桌面开发不受影响。

**关键文件变更**：
- `scenes/boot/boot.tscn` — 新增
- `scripts/autoload/platform_bridge.gd` — 新增
- `export_presets.cfg` — Web 预设覆盖主场景

---

### Day 4-6：COS 远程资源链路

按第 6、7、8 节规划实现：
1. 确认 COS 目录结构已就位（latest.json / manifest.json / test 资源）
2. 实现 `remote_asset_loader.js`
3. 实现 `platform_bridge.gd` 的 `load_remote_pack`
4. 测试 helloWorld.txt → 测试 test_cards_v001.pck 完整链路

---

### Day 6-7：MVP 整合验证

完整验收清单见第 10 节。

---

## 10. 验收清单

### 10.1 Web 浏览器验收

- [ ] Compatibility 渲染器下视觉正常（浏览器 HTML5 测试）
- [ ] 卡牌渲染正常
- [ ] 战斗 UI 正常
- [ ] 粒子特效正常
- [ ] 场景切换正常
- [ ] 无明显 JS 报错

### 10.2 微信开发者工具验收

- [ ] godot-minigame 插件导出成功，无报错
- [ ] game.js 正常执行
- [ ] Canvas / WebGL 正常创建
- [ ] Godot 引擎正常初始化
- [ ] Boot 场景 Loading 正常显示
- [ ] 主菜单场景正常渲染
- [ ] 战斗场景可进入，卡牌可拖拽
- [ ] 基础触摸/点击响应正常
- [ ] onShow / onHide 生命周期正常
- [ ] 主包体积 ≤ 4MB（记录实际值）

### 10.3 COS 远程资源验收

- [ ] COS manifest.json 可通过 `wx.request` 获取
- [ ] `wx.downloadFile` 能下载测试文件（helloWorld.txt）
- [ ] 文件保存到 `wx.env.USER_DATA_PATH` 成功
- [ ] 文件可读取
- [ ] 测试 pck 下载成功并加载（WXMEMFS 映射正常）
- [ ] 测试资源图片可在画面中显示
- [ ] 二次启动命中缓存（不重复下载）

### 10.4 真机验收（MVP 之后）

- [ ] Android 真机启动
- [ ] iOS 真机启动
- [ ] 首次启动完整下载
- [ ] 二次启动缓存复用
- [ ] 切后台恢复正常
- [ ] 弱网下载失败有重试
- [ ] 内存警告处理
- [ ] 资源更新（改 manifest 版本后触发更新）
- [ ] 清缓存后重新下载

---

## 11. 自动化构建工具规划

建议最终输出以下构建脚本，在 MVP 验证后逐步实现：

```
tools/
├─ build_wechat_minigame.js    ← 主构建脚本
├─ generate_manifest.js        ← 生成 manifest.json
└─ upload_to_cos.js            ← 上传到腾讯云 COS
```

### 11.1 build_wechat_minigame.js 构建流程

```
1.  清理 dist/wechat_minigame/ 目录
2.  调用 Godot 导出 Web（Compatibility 模式）
3.  拷贝 Web 产物到构建目录
4.  提取 index.html 中的启动逻辑，生成 game.js
5.  生成 game.json（含分包配置）
6.  生成 project.config.json
7.  拷贝 adapter/ 目录
8.  拷贝 bootstrap/ 目录
9.  分析资源体积
10. 将大资源移动到 dist/remote_assets/
11. 调用 generate_manifest.js → 生成 manifest.json + latest.json
12. 压缩主包资源
13. 检查主包体积（超过 4MB 报错）
14. 调用 upload_to_cos.js → 上传 remote_assets
15. 输出微信小游戏工程目录 dist/wechat_minigame/
16. 输出构建报告 dist/report/build_report.json
```

推荐命令：

```bash
node tools/build_wechat_minigame.js
```

输出结构：

```
dist/
├─ wechat_minigame/     ← 导入微信开发者工具
├─ remote_assets/       ← 上传到 COS
└─ report/
   └─ build_report.json ← 主包体积 / 分包体积 / 远程资源列表
```

---

## 12. 微信后台配置

### 合法域名（必须配置）

在微信公众平台 → 开发管理 → 开发设置 中配置：

| 类型 | 域名 |
|------|------|
| request 合法域名 | `https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com` |
| downloadFile 合法域名 | `https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com` |

> 未配置时真机会报：`url not in domain list`，微信开发者工具模拟器可暂时绕过。

### COS 配置要求

```
1. 资源 URL 必须是 HTTPS
2. COS 文件必须可被公网访问（或正确配置签名访问）
3. manifest 文件禁止强缓存（no-store 或带时间戳参数）
4. 资源文件可以强缓存（内容以版本号区分）
5. 路径不要包含中文、空格、反斜杠
6. 上传后需要验证 URL 能直接访问
```

---

## 13. export_presets.cfg 关键配置

```ini
[preset.0]

name="微信小游戏"
platform="Web"
runnable=true
export_filter="all_resources"
exclude_filter="addons/godot_mcp_editor/*,addons/godot_mcp_runtime/*,addons/auto_reload/*"

[preset.0.options]

html/use_pthreads=false
html/thread_support="no"
# 覆盖主场景为 Boot 场景（桌面端不受影响）
application/boot_splash_image=""
```

---

## 14. 风险矩阵

| 风险 | 概率 | 影响 | 处理方案 |
|------|------|------|---------|
| 渲染器异常（shader 不兼容） | 中 | 高（卡点） | Day 1 先验证；排查 `.gdshader` 文件 |
| 插件 GODOTSDK API 与预期不符 | 中 | 中 | 详读插件文档和示例代码，以实际 API 为准 |
| 主包体积超 4MB | 低（插件已优化） | 高 | 记录实际值；超出则移更多资源进分包 |
| 微信域名未配置 | 低 | 中（真机） | 模拟器可绕过；真机前必须配置 |
| pck 版本与 Godot 版本不匹配 | 低 | 高 | 用同一个 Godot 4.6.2 导出所有 pck |
| iOS WebGL 兼容性（iOS 15.0-15.1） | 高 | 中 | MVP 只关注 Android，iOS 后续优化 |
| manifest 缓存导致资源不更新 | 中 | 中 | latest.json 禁止强缓存；资源路径带版本号 |
| 微信本地缓存失控 | 中 | 中 | 缓存按版本目录；启动时清理旧版本目录 |
| WASM 体积过大 | 中 | 高 | 裁剪 Godot 模块；检查是否能放入引擎分包 |

---

## 15. 需要提前准备

| 准备项 | 说明 |
|--------|------|
| 微信小游戏 AppID | mp.weixin.qq.com 注册；无 AppID 也可用测试号体验 |
| 微信开发者工具 | 下载最新稳定版 |
| godot-minigame 插件 | 从 GitHub Releases 下载 Godot 4.6.2 对应版本 |
| COS 合法域名配置 | 真机测试前必须配置（见第 12 节） |

---

## 16. MVP 之后的扩展方向

- 微信分包：battle / map / shop 正式拆分
- 正式资源拆分：cards / relics / monsters / audio 独立 pck
- 下载进度 UI + 弱网重试
- 本地缓存判断（跳过已下载的 pck）
- 真机测试（Android + iOS）
- 构建脚本自动化（第 11 节）
- 审核资源一致性检查
- 自定义引擎编译裁剪（减小 wasm 体积）

---

## 17. 参考资料

- godothub/godot-minigame：https://github.com/godothub/godot-minigame
- 微信小游戏分包加载：https://developers.weixin.qq.com/minigame/dev/guide/base-ability/subPackage/useSubPackage.html
- 微信小游戏 WXWebAssembly：https://developers.weixin.qq.com/minigame/dev/guide/performance/perf-webassembly.html
- Godot Web 导出文档：https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html
- Godot JavaScriptBridge：https://docs.godotengine.org/en/stable/tutorials/platform/web/javascript_bridge.html

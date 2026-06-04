# Godot slayDemo → 微信小游戏 技术方案（审阅稿）

> **文档状态**：方案讨论稿，待确认关键假设后进入实施
>
> **适用项目**：slayDemo（Godot 4.6 杀戮尖塔类卡牌 Roguelike）
>
> **目标**：1-2 周内完成 MVP，跑通微信小游戏启动 + 基础场景渲染 + 一键导出
>
> **与原始文档的关系**：本文档基于 `godot_to_wechat_minigame_packaging_solution.md` 的框架，针对实际项目情况进行了技术验证和方案修订。原始文档中仍然有效的部分（COS 结构、manifest 设计、包体拆分原则等）不再重复，本文档重点记录**新增发现、修订建议和 MVP 实施路径**。

---

## 1. 关键决策记录

| 决策项 | 结论 |
|--------|------|
| 适配方案 | 优先使用 `godothub/godot-minigame` 插件（支持 Godot 4.4+） |
| 项目目录 | 保持现有结构（`scenes/`、`scripts/`、`data/`、`assets/`），不重组 |
| 渲染器 | Web 导出需切换为 Compatibility（OpenGL），桌面端保留 Forward+ |
| 时间线 | 1-2 周 MVP |

---

## 2. 技术风险与关键发现

### ⚠️ 风险 A：`load_resource_pack()` 在 Web 环境不可用（已确认）

**发现**：Godot 4.x 的 `ProjectSettings.load_resource_pack()` 在 HTML5/WebGL 导出中返回 `false`，原因是 Web 浏览器沙盒限制直接文件系统访问。

**影响**：原始方案中"COS 下载 PCK → Godot load_resource_pack → 加载资源"的核心链路在标准 Web 导出中**不可行**。

**影响范围**：
- ❌ 不能直接在 Web 环境中动态加载远程 PCK
- ❌ 不能通过 `wx.downloadFile` 下载 PCK 后让 Godot 直接加载

**可能的解决路径**：

| 方案 | 可行性 | 说明 |
|------|--------|------|
| A. godot-minigame 插件内置解决方案 | 高（待验证） | 插件声称支持"分包"，可能有自定义的文件系统映射或修改引擎行为 |
| B. JavaScriptBridge 中转资源数据 | 中 | JS 下载资源 → 转为 ArrayBuffer → 通过 `JavaScriptBridge` 传给 Godot → 创建 Image/Texture |
| C. HTTPRequest 节点直接下载 | 中 | Godot 内置的 HTTPRequest 可能在插件适配后可用，直接从 COS 拉取资源 |
| D. 自定义 Emscripten FS 注入 | 低（复杂） | 从 JS 侧直接写入 Emscripten 虚拟文件系统，Godot 通过正常路径访问 |
| E. 自定义编译引擎，修补 load_resource_pack | 低（成本高） | 修改 Godot 源码使该 API 在 Web 环境可用 |

**MVP 策略**：先不纠结远程资源加载，**第一步先把游戏跑起来**，在过程中验证插件对资源加载的支持能力。

---

### ⚠️ 风险 B：WASM 体积超过 4MB 主包限制（高概率）

| 指标 | 数值 |
|------|------|
| Godot 4.x WASM 压缩后 | ~5MB |
| 微信小游戏主包上限 | **4MB** |

**MVP 策略**：先导出看实际体积，godot-minigame 插件可能已内置体积优化。如果仍超标，后续考虑自定义引擎编译裁剪模块（移除 3D、Jolt Physics 等）。

---

### ⚠️ 风险 C：渲染器兼容性（中）

| 环境 | 渲染器 |
|------|--------|
| 桌面开发 | Forward+ (Vulkan) ← 保持不变 |
| Web / 微信导出 | Compatibility (OpenGL ES 3.0 / WebGL 2.0) ← 必须 |

**影响**：Web 导出只能使用 Compatibility 渲染器。对于 2D 卡牌游戏，大部分 2D 渲染功能（CanvasItem、粒子、基础着色器）都能正常工作。主要可能受影响的是：
- 使用了 Vulkan 特有着色器语法的 `.gdshader` 文件
- 高级后处理效果

**好消息**：Godot 4.x 的导出预设是**按平台独立配置**的，可以为 Web 导出单独设置 Compatibility 渲染器，桌面端继续使用 Forward+，互不影响。

---

### ⚠️ 风险 D：iOS WebGL 2 兼容性（中）

- Android：WebGL 2.0 完全支持
- iOS 15.0-15.1：基本不可用（黑屏、渲染异常）
- iOS 15.2+：可用但性能约为原生 1/3

**MVP 策略**：MVP 阶段只关注 Android 和微信开发者工具模拟器，iOS 兼容性作为后续优化。

---

## 3. MVP 实施计划（7 天）

### 第一步：渲染器可行性验证（Day 1）

> **卡点**：如果 Compatibility 渲染器下视觉效果严重异常，后续工作暂停

**操作**：
1. 在 Godot 编辑器中创建一个新的 Web 导出预设（不影响现有桌面开发）
2. 导出预设中选择 Compatibility 渲染器
3. 导出为 Web/HTML5，在浏览器中运行
4. 逐一检查：卡牌渲染、战斗 UI、粒子效果、字体、场景切换

**关键文件**：
- `export_presets.cfg` — 新增 Web 导出预设
- `assets/` 下的 `.tres` / `.gdshader` 文件 — 检查着色器兼容性

**判断标准**：
- ✅ 视觉效果可接受 → 继续下一步
- ⚠️ 有轻微差异 → 记录差异，后续修复
- ❌ 严重渲染异常 → 需要排查 shader 问题，可能需要较多修复工作

---

### 第二步：安装 godot-minigame 插件 + 研究插件能力（Day 1-2）

> **卡点**：插件是否支持 Godot 4.6；插件的资源加载机制是什么

**操作**：
1. 从 GitHub 下载 `godothub/godot-minigame`（选择支持 Godot 4.4+ 的版本）
2. 安装到 `addons/godot-minigame/`
3. 在项目设置中启用插件
4. **仔细阅读插件文档和源码**，重点确认：
   - [ ] 插件如何处理 WASM 体积问题
   - [ ] 插件是否提供远程资源加载能力（替代 `load_resource_pack`）
   - [ ] 插件的分包机制如何工作
   - [ ] 插件如何映射微信文件系统到 Godot 虚拟文件系统
   - [ ] 插件是否支持 Godot 4.6（或需要降级到 4.4/4.5）

**关键文件**：
- `addons/godot-minigame/` — 新增
- `project.godot` — 添加插件配置

---

### 第三步：微信开发者工具启动（Day 2-3）

> **卡点**：WASM 体积是否超过 4MB；游戏是否能在模拟器中渲染

**操作**：
1. 按插件指引导出微信小游戏工程
2. 检查导出产物结构和总体积
3. 在 `project.config.json` 中填入微信小游戏 AppID（需要提前准备）
4. 用微信开发者工具打开导出目录
5. 在模拟器中启动，检查引擎初始化和场景渲染

**需要提前准备**：
- 微信小游戏 AppID（在微信公众平台注册）
- 微信开发者工具（最新稳定版）

**检查项**：
- [ ] Godot 引擎正常初始化（控制台无致命错误）
- [ ] 主场景正常渲染
- [ ] 基础交互响应（点击、拖拽）
- [ ] 主包体积 ≤ 4MB（记录实际值）

---

### 第四步：添加 Boot 启动场景（Day 3-4）

> **目的**：创建 Web 启动流程，与桌面端解耦

**操作**：
1. 创建 `scenes/boot/boot.tscn` — 最小启动场景
   - Loading 标签
   - 简单进度条
   - 平台检测逻辑
2. 创建 `scripts/autoload/platform_bridge.gd` — 平台桥接
   ```gdscript
   extends Node

   signal boot_ready

   func _ready():
       if OS.has_feature("web"):
           _boot_web()
       else:
           _boot_native()

   func _boot_web():
       print("[PlatformBridge] Web/WeChat platform detected")
       # TODO: 根据 godot-minigame 插件提供的 API 初始化
       boot_ready.emit()

   func _boot_native():
       print("[PlatformBridge] Native platform")
       boot_ready.emit()
   ```
3. 在 Web 导出预设中覆盖主场景为 `boot.tscn`（桌面端保持原主场景不变）

**关键原则**：通过导出预设覆盖主场景，**不修改** `project.godot` 中的全局主场景设置，这样桌面开发不受影响。

**关键文件**：
- `scenes/boot/boot.tscn` — 新增
- `scripts/autoload/platform_bridge.gd` — 新增
- `export_presets.cfg` — 修改 Web 预设的主场景覆盖

---

### 第五步：COS 远程资源验证（Day 4-6）

> **卡点**：取决于第二步中插件能力调研的结果
>
> **注意**：此步骤的实施方案需要根据 godot-minigame 插件的实际能力来决定，以下提供多种备选路径

#### 路径 A：如果插件提供了资源加载机制（优先）

直接按插件文档的指引实现远程资源加载。

#### 路径 B：如果插件不提供，使用 JavaScriptBridge 中转

```
微信 JS 层                          Godot GDScript 层
──────────                          ─────────────────
wx.request(manifest_url)
  → 获取 manifest.json
wx.downloadFile(image_url)
  → 下载到 USER_DATA_PATH
读取文件为 ArrayBuffer
  → JavaScriptBridge.eval()
      ─────────────────────→     var data = JavaScriptBridge.eval("...")
                                  var image = Image.new()
                                  image.load_from_data(data)  ← 需验证此 API
                                  var texture = ImageTexture.create_from_image(image)
                                  # 将 texture 应用到 UI 节点
```

**限制**：只能加载图片等可通过内存数据创建的资源，无法加载场景（.tscn）和脚本。

#### 路径 C：使用 HTTPRequest 节点（如果插件适配了微信网络 API）

```gdscript
# 在 Godot 内部直接请求
var http = HTTPRequest.new()
add_child(http)
http.request("https://godot-assets-1259051895.cos.ap-guangzhou.myqcloud.com/godot_slaydemo/v001/packs/test_cards_v001.pck")
# 处理响应数据...
```

**前提**：godot-minigame 插件需要将 `HTTPRequest` 底层的浏览器 fetch 映射到微信的 `wx.request`。

#### 路径 D：最小可行 — 暂不做远程加载，先确保主包能跑

如果上述路径都不可行，MVP 先把所有必要资源打进主包（接受体积超标），先证明游戏能在微信跑起来，后续再优化。

---

### 第六步：MVP 整合验证（Day 6-7）

**验证清单**：
- [ ] Compatibility 渲染器下项目视觉正常（浏览器测试）
- [ ] godot-minigame 插件导出成功
- [ ] 微信开发者工具中游戏启动
- [ ] Boot 场景显示 Loading
- [ ] 主场景（战斗/菜单）正常渲染
- [ ] 基础交互响应正常
- [ ] 主包体积记录（无论是否达标）
- [ ] 如远程资源链路已验证：COS 下载 → 资源显示

---

## 4. 关键文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `export_presets.cfg` | 新增 | Web 导出预设（Compatibility 渲染器，主场景覆盖） |
| `addons/godot-minigame/` | 新增 | 微信小游戏导出插件 |
| `scenes/boot/boot.tscn` | 新增 | Web 启动场景（Loading） |
| `scripts/autoload/platform_bridge.gd` | 新增 | 平台检测 & 资源加载桥接 |
| `assets/test/test_card.png` | 新增 | 测试用资源（用于远程加载验证） |
| `project.godot` | 小改 | 注册 autoload、添加插件配置 |

**不改动**：现有 `scenes/`（除新增 boot）、`scripts/`、`data/`、`assets/` 目录结构保持不变。桌面端开发体验不受影响。

**开发插件建议在 Web 导出时排除**：`godot_mcp_editor`、`godot_mcp_runtime`、`auto_reload` 是开发辅助工具，不应包含在 Web 导出中。

---

## 5. 需要用户提前准备

| 准备项 | 用途 | 说明 |
|--------|------|------|
| 微信小游戏 AppID | project.config.json 配置 | 在微信公众平台 mp.weixin.qq.com 注册 |
| 微信开发者工具 | 调试和预览 | 下载最新稳定版 |
| COS 域名白名单 | request + downloadFile 合法域名 | 微信后台 → 开发管理 → 开发设置 |
| godot-minigame 插件 | 核心适配工具 | 从 GitHub Releases 下载对应 Godot 版本 |

---

## 6. 原始方案文档的修订建议

与用户原始文档 `godot_to_wechat_minigame_packaging_solution.md` 的主要差异：

| 原始方案 | 修订建议 | 原因 |
|----------|----------|------|
| 第 12 节：`load_resource_pack()` 加载远程 PCK | 需要替代方案 | 该 API 在 Web 导出中不可用 |
| 第 13 节：wx.downloadFile → load_resource_pack | 需要重新设计链路 | 同上 |
| 第 4 节：重组为 `res://game/bootstrap/` 等新结构 | 保持现有目录结构 | 最小化改动，降低风险 |
| 第 10 节：remote_asset_loader.js 直接传路径给 Godot | 需要通过 JavaScriptBridge 中转 | Web 环境文件系统映射不同 |
| 未提及渲染器切换 | Day 1 首先验证 | 这是最基础的兼容性问题 |
| 未提及 WASM 体积问题 | Day 2-3 记录实际值并评估 | 5MB WASM vs 4MB 主包限制 |

**原始方案中仍然有效的部分**（无需修改）：
- ✅ 第 1 节：背景与目标 — 完全正确
- ✅ 第 3 节：包体拆分原则 — 主包/分包/远程资源的三级结构
- ✅ 第 6 节：game.json 分包配置 — 配置格式正确
- ✅ 第 7 节：COS 远程资源目录结构 — 合理
- ✅ 第 8 节：manifest.json 设计 — 版本管理方案合理
- ✅ 第 9 节：微信后台域名配置 — 必要步骤
- ✅ 第 17 节：常见风险与处理方案 — 大部分仍然适用
- ✅ 第 18 节：阶段计划 — 整体节奏合理
- ✅ 第 19 节：版本管理建议 — 不覆盖旧版本原则正确

---

## 7. MVP 之后的扩展方向（暂不实施）

- 微信分包加载（battle / map / shop）
- 正式资源拆分（cards / relics / monsters / audio 独立资源包）
- 下载进度 UI 与弱网处理
- 真机测试与性能优化（Android + iOS）
- 审核资源一致性检查
- 自定义引擎编译裁剪（减小 WASM 体积）

---

## 参考资料

- [Godot Web 导出文档](https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html)
- [godothub/godot-minigame](https://github.com/godothub/godot-minigame) — Godot 4 微信小游戏导出插件
- [Godot JavaScriptBridge 文档](https://docs.godotengine.org/en/stable/tutorials/platform/web/javascript_bridge.html)
- [微信小游戏分包加载说明](https://www.tencentcloud.com/zh/document/product/1219/68072)
- [Godot load_resource_pack 在 Web 中不可用 — 社区讨论](https://www.reddit.com/r/godot/comments/1h43l29/unable_to_load_pck_files_in_html_5_exports/)

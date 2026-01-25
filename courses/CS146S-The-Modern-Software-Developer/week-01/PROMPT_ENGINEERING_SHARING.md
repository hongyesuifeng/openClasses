# 提示词工程：核心原理与实战案例

> **快速分享文档** - 用于团队分享提示词工程的核心原理和实战应用

---

## 核心原理

提示词工程本质是"通过结构化的上下文设计，引导 LLM 的概率分布向预期方向收敛"。

LLM 是概率模型，输出 `P(token | context)` 高度依赖提示词提供的上下文。

### 关键技术原理

| 原理                      | 说明                                          |
| ----------------------- | ------------------------------------------- |
| **In-Context Learning** | 模型从示例中学习"如何学习"，注意力机制会优先关注相关性高且位置靠后的示例（近因效应） |
| **Chain-of-Thought**    | 分步推理将复杂任务分解，`P(正确) = (1-ε')^T`，降低单步错误率      |
| **RAG（检索增强）**           | 检索相关文档补充上下文，减少模型幻觉                          |

---

## 实战案例 - 在 MVC 架构中生成 UI 面板代码

**任务**：创建一个"设置面板"，包含音量滑块、画质下拉菜单、分辨率选择、保存/取消按钮

**技术栈**：Cocos Creator / TypeScript

---

### 方法对比

| 方法                 | 提示词                                                         | 输出效果                        | 原理分析                    |
| ------------------ | ----------------------------------------------------------- | --------------------------- | ----------------------- |
| **Zero-Shot**      | "创建一个设置面板"                                                  | ⭐⭐ 生成通用的 UI 代码，不符合项目 MVC 架构 | 依赖模型先验知识，缺少项目上下文        |
| **Few-Shot**       | + 2 个现有面板代码示例                                               | ⭐⭐⭐ 代码结构符合项目风格              | 示例引导模型理解命名规范、目录结构（近因效应） |
| **CoT**            | "让我们一步步：1.创建 View 类 2.创建 Controller 类 3.配置注册 4.绑定 UI 元素..." | ⭐⭐⭐⭐ 步骤完整，逻辑清晰              | 任务分解，每步可验证，降低遗漏风险       |
| **RAG + Few-Shot** | + 项目架构文档 + 代码示例                                             | ⭐⭐⭐⭐⭐ 完全符合项目规范，自动完成配置注册     | RAG 提供准确上下文（架构规范），避免幻觉  |

---

### 最佳实践方案：RAG + Few-Shot

#### 提示词结构

```
# System Prompt
你是 Cocos Creator UI 开发专家。

# 项目架构文档 (RAG)
- 所有 View 继承 BaseView，所有 Controller 继承 BaseViewCtrl
- 使用 @property 装饰器绑定 UI 节点
- 目录规范：assets/scripts/pk/modules/{ModuleName}/
- 配置注册：需在 ViewEnum、ViewCtrlEnum、ViewForms、MVCForms 中添加

# 代码示例 (Few-Shot)
示例 - LoginPanel View:
```typescript
export class LoginView extends BaseView {
    @property({ type: Node })
    protected content: Node = null;

    @property({ type: Button })
    protected loginBtn: Button = null;
}
```

示例 - LoginPanel Controller:

```typescript
export class LoginViewCtrl extends BaseViewCtrl {
    protected viewClass: any = LoginView;

    protected onBindView() {
        this.view.loginBtn.node.on(Button.EventType.CLICK, this.onLoginClick, this);
    }
}
```

# 任务

创建 Setting 模块的 SettingView 和 SettingViewCtrl

# 输出要求

1. View 类：包含音量滑块、画质下拉菜单、分辨率选择、保存/取消按钮的 UI 绑定

2. Controller 类：包含事件处理逻辑

3. 配置注册：在 ViewEnum、ViewCtrlEnum、ViewForms、MVCForms 中添加对应配置
   
   ```
   
   ```

#### 输出结果

```typescript
// View: assets/scripts/pk/modules/setting/SettingView.ts
export class SettingView extends BaseView {
    @property({ type: Slider })
    protected volumeSlider: Slider = null;

    @property({ type: ComboBox })
    protected qualityComboBox: ComboBox = null;

    @property({ type: ComboBox })
    protected resolutionComboBox: ComboBox = null;

    @property({ type: Button })
    protected saveBtn: Button = null;

    @property({ type: Button })
    protected cancelBtn: Button = null;
}

// Controller: assets/scripts/pk/modules/setting/SettingViewCtrl.ts
export class SettingViewCtrl extends BaseViewCtrl {
    protected viewClass: any = SettingView;

    protected onBindView() {
        this.view.saveBtn.node.on(Button.EventType.CLICK, this.onSaveClick, this);
        this.view.cancelBtn.node.on(Button.EventType.CLICK, this.onCancelClick, this);
    }

    private onSaveClick() {
        // 保存设置逻辑
    }
}

// 配置注册
ViewEnum.SettingView = "SettingView";
ViewCtrlEnum.SettingViewCtrl = "SettingViewCtrl";
ViewForms.SettingView = "resources/prefabs/setting/SettingPanel";
MVCForms.SettingView = { view: ViewEnum.SettingView, ctrl: ViewCtrlEnum.SettingViewCtrl };
```

---

### 技术原理说明

**为什么 RAG + Few-Shot 效果最好？**

1. **RAG 提供项目架构文档** → 模型知道"要遵守什么规范"
2. **Few-Shot 提供代码示例** → 模型学习"代码应该长什么样"
3. **近因效应** → 最后的示例权重最大，应放最相关的示例

**注意力权重可视化**（模型生成代码时的关注点分布）：

```
[架构文档] [示例1-View] [示例2-Ctrl] [任务描述]
    ████       ████████       ██████████       ████████████████
    10%           25%             30%              35%
```

---

## 实用技巧

1. **最相关的示例放最后** - 利用近因效应，最后的示例权重最大

2. **示例质量 > 数量** - 3 个高质量示例优于 10 个低质量示例

3. **复杂任务分解** - 先用 CoT 分解，再配合 RAG 提供准确上下文

4. **RAG 的价值** - 对于需要准确性的场景（技术文档、API 规范），RAG 是必需的

---

## 核心洞察

`★ Insight ─────────────────────────────────────`

**从 MVC UI 案例学到的关键点：**

1. **项目规范必须通过 RAG 提供** - 模型无法"猜"出你的架构规范（继承关系、目录结构、配置注册流程）

2. **示例的作用是传递"代码风格"** - 命名约定、装饰器使用、事件绑定模式都需要通过示例学习

3. **近因效应的实战应用** - 如果你希望生成 View，就把 View 示例放最后；希望生成 Controller，就把 Controller 示例放最后

`─────────────────────────────────────────────────`

---

## 延伸学习

**📚 详细原理文档**：`PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md`

**核心论文**：

- GPT-3 (2020): Few-shot Learning 基础
- CoT (2022): 思维链推理
- ReAct (2022): 推理+行动
- Reflexion (2023): 自我反思迭代
- RAG (2020): 检索增强生成

---

**版本**: v1.0 | **更新**: 2026-01-25

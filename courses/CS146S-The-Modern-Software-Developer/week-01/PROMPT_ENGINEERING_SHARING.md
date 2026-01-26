# 【讨论】三种提问方式，为什么结果差这么多？

最近在用 AI 帮忙生成 Cocos Creator 的 UI 代码，同一个任务，三种不同的问法，结果差别巨大。

---

## 三种提问方式

**任务**：创建一个装备面板 `EquipmentMainView`

### 方式一：直接问

```
帮我创建一个 EquipmentMainView 面板。
```

**结果**：
- 可能忘记写 `$$` 后缀（项目规范要求所有类名加 `$$`）
- 6 个配置文件经常漏掉几个
- 方法名也不对

---

### 方式二：给示例（Few-Shot）

```
帮我创建一个 EquipmentMainView 面板。

参考以下代码：

// 示例 1: RoleMainView
export class RoleMainView$$ extends BaseView$$ {
    @property({ type: Node })
    protected content$$: Node = null;
}

// 示例 2: BagMainView
export class BagMainView$$ extends BaseView$$ {
    @property(Node)
    protected itemList$$: Node = null;

    @property(Node)
    protected closeBtn$$: Node = null;
}
```

**结果**：
- `$$` 后缀记住了
- 代码风格对味了
- 但配置文件还是会漏
- 一些方法名还是不对（比如 `onViewWillShow$$`）

---

### 方式三：给文档 + 给示例（RAG + Few-Shot）

```
# 项目架构文档

## MVC 框架规范
- View 基类: BaseView$$ (位于 fn 框架库)
- Controller 基类: BaseViewCtrl$$
- 命名规范: 所有类名必须使用 $$ 后缀
- 属性命名: 所有属性名使用 $$ 后缀

## 6 步配置注册
1. ViewEnum$$ - 添加 View 枚举
2. ViewCtrlEnum$$ - 添加 Controller 枚举（重要！容易遗漏）
3. ViewCtrlForms$$ - 注册 Controller 类
4. ViewForms$$ - 配置 Prefab 路径
5. MVCForms$$ - 注册 MVC 关系
6. ModuleEnum$$ - 添加模块枚举

# 代码示例

// View: BagMainView$$.ts
export class BagMainView$$ extends BaseView$$ {
    @property({ type: Node })
    protected content$$: Node = null;
}

// Controller: BagMainViewCtrl$$.ts
export class BagMainViewCtrl$$ extends BaseViewCtrl$$ {
    protected viewClass: any = BagMainView$$;

    protected override onViewWillShow$$(): void {
        super.onViewWillShow$$();
    }
}

// 任务
创建 Equipment 模块的 EquipmentMainView 面板
```

**结果**：
- 6 个配置一步不落
- 方法名全都对（`onViewWillShow$$`、`viewClass` 等）
- 代码风格也符合项目

---

## 问题来了

为什么三种方式差别这么大？

- 给示例起了什么作用？
- 给文档起了什么作用？
- 为什么要两者结合？

---

## 原理分析

### 1. LLM 的工作原理

LLM 本质上是在做"填空题"：根据前面的内容，预测下一个字。

所以：
- 你给的信息越具体，它预测得越准
- 你给的参考越多，它越知道"该填什么"

### 2. 三种方式背后的技术

#### 方式一：Zero-Shot Prompting（零样本提示）

**技术定义**：不提供示例，直接给任务指令。

**原理**：依赖 LLM 训练时学到的通用知识。

**局限**：
- 项目的 `$$` 命名规范，通用知识里没有
- 6 步配置流程，通用知识里也没有
- AI 只能"猜"，猜错就很正常

---

#### 方式二：Few-Shot Prompting（少样本提示）

**技术定义**：提供 K 个示例，引导模型理解任务。

**原理**：示例展示了"代码应该长什么样"，模型通过示例学习规律。

**在我们的例子中**：
- `RoleMainView$$`、`BagMainView$$` 告诉它"类名要加 `$$`"
- `@property({ type: Node })` 告诉它"属性怎么声明"
- `content$$`、`itemList$$` 告诉它"属性名也要加 `$$`"

**为什么还不够？**
- 示例教的是"代码风格"，但教不了"方法签名"
- `onViewWillShow$$` 这个方法名，示例里不一定有
- `viewClass` 这个属性，示例里不一定有
- 6 步配置流程，示例也体现不出来

---

#### 方式三：RAG + Few-Shot

**两个技术结合**：

**（1）RAG（检索增强生成）**

把项目的框架文档作为参考资料给 AI。

**作用**：告诉 AI "有什么方法可以用"

在我们的例子中：
- 文档里写了 `BaseViewCtrl$$` 基类，AI 就知道要继承它
- 文档里写了 `onViewWillShow$$` 方法，AI 就知道有这个生命周期方法
- 文档里写了 6 步配置，AI 就知道要注册哪些文件

**（2）Few-Shot**

给代码示例。

**作用**：告诉 AI "代码怎么写才对味"

在我们的例子中：
- `@property({ type: Node })` 展示了装饰器怎么用
- `override` 关键字展示了怎么重写方法
- 代码格式展示了缩进、命名等风格

**两者结合**：
- 文档解决"有什么"（方法名、配置项）
- 示例解决"怎么写"（代码风格、格式）

---

### 3. 还有个有趣的发现：近因效应

我发现：**最后的示例影响最大**。

比如要生成 View，如果最后放的是 View 示例，结果就更好；要生成 Controller，就把 Controller 示例放最后。

这叫"近因效应"（Recency Effect）—— AI 对最后看的内容印象最深。

---

## 总结对比

| 提问方式 | 使用的技术 | 作用 | 适合场景 |
|---------|-----------|------|---------|
| 直接问 | Zero-Shot | 依赖通用知识 | 简单问题、快速原型 |
| 给示例 | Few-Shot | 教会"风格" | 代码风格、格式统一 |
| 给文档 + 给示例 | RAG + Few-Shot | 教会"有什么"+"怎么写" | 需要准确性的技术场景 |

**核心思路**：
- 文档解决"准确性"问题（方法名、配置项）
- 示例解决"风格性"问题（代码格式、命名习惯）
- 两者结合，效果最好

---

## 延伸阅读

如果对提示词工程感兴趣，我整理了一份更系统的文档：

📚 **[提示词工程完整指南](./PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md)**

包含：
- 10+ 种提示词技术详解（Zero-Shot、Few-Shot、CoT、RAG...）
- 游戏开发实战案例
- 技术原理深度剖析
- 最佳实践与设计模式

---

**2026-01-25**

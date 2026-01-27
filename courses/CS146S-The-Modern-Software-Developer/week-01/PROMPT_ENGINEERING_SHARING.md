# 为什么同样的任务，问法不同结果差这么大？

> 每天都在用 AI 写代码，但有时候效果很理想，有时候却不尽如人意。到底区别在哪里？

---

## 日常场景

最近在用 AI 帮忙写代码，发现一个有趣的现象：

**同一个任务，不同的问法，结果天差地别。**

比如要创建一个装备面板：
- 问法 A：生成的代码缺东少西，还要改半天
- 问法 B：基本可用，小修小改就行
- 问法 C：几乎完美，直接复制粘贴就能用

这三种问法到底有什么区别？为什么效果差这么多？

---

## 三种问法对比

**任务**：创建一个 Cocos Creator 装备面板 `EquipmentMainView`

### 问法 A：简单直接

```
帮我创建一个 EquipmentMainView 面板。
```

**结果**：❌ 基本不能用

- 类名可能忘记加 `$$` 后缀（项目规范）
- 6 个配置文件经常漏掉几个
- 方法名不对，比如写成 `onShow` 而不是 `onViewWillShow$$`
- 要改的地方太多，不如自己写

---

### 问法 B：给点参考

```
帮我创建一个 EquipmentMainView 面板。

参考这些代码：
export class RoleMainView$$ extends BaseView$$ {
    @property({ type: Node })
    protected content$$: Node = null;
}

export class BagMainView$$ extends BaseView$$ {
    @property(Node)
    protected itemList$$: Node = null;
}
```

**结果**：⭐ 还行，但不够好

- ✅ 记住了 `$$` 后缀
- ✅ 代码风格对味了
- ❌ 配置文件还是会漏
- ❌ 框架方法名不对（比如 `viewClass`、`onViewWillShow$$`）
- 需要手动补充和完善

---

### 问法 C：给文档 + 给示例

```
# 项目框架文档

## MVC 架构
- View 基类: BaseView$$
- Controller 基类: BaseViewCtrl$$
- 命名规范: 所有类名、属性名都要加 $$ 后缀

## 配置注册（必须完成）
1. ViewEnum$$ - 添加 View 枚举
2. ViewCtrlEnum$$ - 添加 Controller 枚举
3. ViewCtrlForms$$ - 注册 Controller 类
4. ViewForms$$ - 配置 Prefab 路径
5. MVCForms$$ - 注册 MVC 关系
6. ModuleEnum$$ - 添加模块枚举

## 参考代码
export class BagMainViewCtrl$$ extends BaseViewCtrl$$ {
    protected viewClass: any = BagMainView$$;
    protected override onViewWillShow$$(): void {
        super.onViewWillShow$$();
    }
}

# 任务
创建 Equipment 模块的 EquipmentMainView 面板
```

**结果**：✅ 几乎完美

- ✅ 6 个配置一步不落
- ✅ 方法名全都对（`onViewWillShow$$`、`viewClass` 等）
- ✅ 代码风格完全符合项目
- 几乎不用改，直接复制粘贴就能用

---

## 为什么差别这么大？

### 核心原因：AI 不知道你的项目规范

**问法 A 的问题**：
- AI 只能"猜"你的项目规范
- `$$` 后缀？它不知道
- 6 步配置流程？它也不知道
- 只能根据通用知识生成，大概率不对

**问法 B 的改进**：
- 通过示例，AI 学到了"代码风格"
- 知道要加 `$$` 后缀
- 知道 `@property` 怎么用
- 但还是不知道"有哪些方法可以用"

**问法 C 为什么最好**：
- **文档**告诉 AI "有什么"（方法名、配置项、流程）
- **示例**告诉 AI "怎么写"（代码风格、格式）
- 两者结合，既准确又对味

---

## 技术原理（简单说）

### 问法 A：Zero-Shot（零样本）

**特点**：不提供任何参考

**原理**：AI 用通用知识回答

**局限**：
- 项目特定的规范（如 `$$` 后缀），通用知识里没有
- AI 只能"猜"，猜错很正常

---

### 问法 B：Few-Shot（少样本）

**特点**：给几个示例

**原理**：AI 从示例中学习规律

**效果**：
- ✅ 学到了代码风格（`$$` 后缀、`@property` 用法）
- ❌ 学不到方法签名（`onViewWillShow$$`、`viewClass`）
- ❌ 学不到配置流程（6 步注册）

---

### 问法 C：RAG + Few-Shot

**特点**：给文档 + 给示例

**原理**：
- **文档（RAG）**：告诉 AI "框架有什么方法"
- **示例（Few-Shot）**：告诉 AI "代码怎么写"

**效果**：
- ✅ 知道有哪些方法（从文档）
- ✅ 知道怎么写代码（从示例）
- ✅ 既准确又对味

---

## 实用建议

### 什么时候用什么问法？

| 场景 | 推荐问法 | 原因 |
|-----|---------|------|
| 简单通用问题（如"写个快速排序"） | 问法 A | 不涉及项目规范，通用知识就够了 |
| 统一代码风格 | 问法 B | 只需要学习风格，不需要方法签名 |
| 项目特定任务（如 UI 框架代码） | **问法 C** | 需要知道项目规范 + 框架方法 |

### 如何快速准备"文档 + 示例"？

**1. 文档部分**（只需准备一次）：
```markdown
# 项目框架规范
- 基类：BaseView$$、BaseViewCtrl$$
- 命名：类名和属性名都要加 $$
- 配置：6 步注册流程
```

**2. 示例部分**（用现有代码）：
```typescript
// 直接复制项目中的一个典型例子
export class XXXViewCtrl$$ extends BaseViewCtrl$$ {
    protected viewClass: any = XXXView$$;
}
```

**3. 每次使用**：
```
[粘贴文档]

[粘贴示例]

# 任务
[你的具体需求]
```

---

## 总结

**核心发现**：

1. **AI 不是不知道怎么写代码，而是不知道你的项目规范**
2. **给示例可以解决"风格"问题，但解决不了"准确性"问题**
3. **文档 + 示例，才能既准确又对味**

**记住这个公式**：

```
好结果 = 文档（有什么） + 示例（怎么写） + 清晰任务
```

---

## 想深入了解？

如果对提示词工程感兴趣，我整理了一份更系统的文档：

📚 **[提示词工程完整指南](./PROMPT_ENGINEERING_COMPREHENSIVE_GUIDE.md)**

包含：
- 10+ 种提示词技术详解
- 游戏开发实战案例
- 技术原理深度剖析
- 最佳实践与设计模式

---

**2026-01-27**

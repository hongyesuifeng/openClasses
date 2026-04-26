# 技术原理：AI对齐与安全

> 从"能生成"到"能安全地生成"

## 核心概念

### 1. 对齐问题（Alignment Problem）

定义：确保 AI 系统的行为与人类意图和价值观一致。

核心挑战：
- **奖励规格化（Reward Specification）**: 如何准确定义"好"的行为
- **奖励黑客（Reward Hacking）**: 模型找到奖励函数的漏洞
- **分布外行为**: 训练时未见过的输入可能产生不可预测输出

### 2. RLHF（Reinforcement Learning from Human Feedback）

三阶段流程：

```
阶段1: 监督微调（SFT）
  用人类写的标准答案微调模型

阶段2: 奖励模型（Reward Model）
  训练一个打分模型：输入 (prompt, response) → 输出分数
  训练数据：人类对多个回复的排序

阶段3: 强化学习（PPO）
  用 RM 的分数作为奖励信号
  通过 PPO 算法优化生成策略
```

### 3. Constitutional AI

Anthropic 的创新：让 AI 参与自己的对齐过程。

两阶段：
1. **监督阶段**: 模型根据"宪法"（行为准则）评估和修正自己的回答
2. **RL 阶段**: 用 AI 反馈替代人类反馈进行 RLHF

### 4. DPO（Direct Preference Optimization）

核心洞察：语言模型本身就是隐式的奖励模型。

```
RLHF: SFT → RM → PPO（三步，需要 RM 和 RL）
DPO: 直接用偏好数据优化策略（一步搞定）
```

数学上证明了 DPO 的目标函数等价于 RLHF 的最优解，但不需要显式的奖励模型。

## 对齐方法对比

| 方法 | 复杂度 | 需要RM | 训练稳定性 | 效果 |
|------|--------|--------|-----------|------|
| SFT | 低 | 否 | 高 | 基础 |
| RLHF | 高 | 是 | 中 | 好 |
| RLAIF | 中 | AI生成 | 中 | 好 |
| DPO | 低 | 否 | 高 | 好 |

# 第五讲：大语言模型训练方法

> 对应视频：第六讲、第七讲 - 大型语言模型训练方法「预训练–对齐」/ 后训练与遗忘问题

## 本章概要

本章将介绍大语言模型的训练流程，包括预训练、监督微调、人类反馈强化学习等关键技术。

---

## 1. 训练流程概览

### 1.1 三阶段训练范式

```
大语言模型训练流程
────────────────────────────────────────────────────────

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   预训练      │ → │  监督微调     │ → │  对齐训练     │
│  Pre-training │    │    SFT       │    │  Alignment   │
└──────────────┘    └──────────────┘    └──────────────┘
      │                    │                    │
      ↓                    ↓                    ↓
  海量无标注数据        高质量指令数据        人类偏好数据
  学习语言知识          学习指令遵循          学习人类价值观

  Base Model           SFT Model           Aligned Model
  (基础模型)           (微调模型)          (对齐模型)
```

### 1.2 各阶段目标

| 阶段 | 数据 | 目标 | 产出 |
|------|------|------|------|
| **预训练** | 万亿级 Token | 学习语言、世界知识 | Base Model |
| **SFT** | 数万条指令 | 学习遵循指令 | SFT Model |
| **RLHF/RLAIF** | 人类偏好数据 | 对齐人类价值观 | Aligned Model |

---

## 2. 预训练（Pre-training）

### 2.1 目标

**预训练**：让模型在海量文本上学习语言的基本规律和世界知识。

```
预训练过程
────────────────────────────────────────────────────────

训练数据：
┌─────────────────────────────────────────────────────┐
│ 互联网文本 (CommonCrawl)     ~ 800B tokens          │
│ 书籍和文档                   ~ 100B tokens          │
│ 代码仓库 (GitHub)           ~ 50B tokens           │
│ Wikipedia                   ~ 10B tokens           │
│ 对话数据                     ~ 50B tokens           │
└─────────────────────────────────────────────────────┘

训练任务：下一个词预测
输入: "The quick brown fox"
目标: "jumps"

损失函数: Cross-Entropy Loss
L = -log(P(正确词))
```

### 2.2 数据处理

```
数据处理流水线
────────────────────────────────────────────────────────

原始数据
    │
    ↓
┌─────────────┐
│  过滤       │ ← 移除低质量、重复、有害内容
└─────────────┘
    │
    ↓
┌─────────────┐
│  去重       │ ← 移除重复文档
└─────────────┘
    │
    ↓
┌─────────────┐
│  Tokenize   │ ← 文本转 Token
└─────────────┘
    │
    ↓
┌─────────────┐
│  混合采样    │ ← 按比例混合不同来源
└─────────────┘
    │
    ↓
训练数据
```

### 2.3 训练技巧

```
大规模训练技巧
────────────────────────────────────────────────────────

1. 混合精度训练 (Mixed Precision)
   • FP16/BF16 计算加速
   • 减少显存占用

2. 梯度累积 (Gradient Accumulation)
   • 模拟大 batch size
   • 解决显存限制

3. 分布式训练 (Distributed Training)
   • 数据并行
   • 模型并行
   • 流水线并行

4. 学习率调度
   • Warmup: 学习率从 0 逐渐增加
   • Cosine Decay: 余弦衰减

5. Dropout 和正则化
   • 防止过拟合
```

### 2.4 规模定律（Scaling Laws）

```
规模定律
────────────────────────────────────────────────────────

关键发现：模型性能与三个因素呈幂律关系

Loss ∝ (N)^(-0.076)  × (D)^(-0.095)  × (C)^(-0.050)
        参数量         数据量          计算量

推论：
1. 更大的模型需要更多数据
2. 计算预算的最优分配
3. 模型大小与数据量的平衡

           Loss
             │
             │ ╲
             │  ╲
             │   ╲
             │    ╲───────────
             │                 ╲
             └──────────────────────► 计算量

Chinchilla 定律：
最优训练：参数量 ≈ 数据量 / 20
例：70B 模型 → 1.4T tokens
```

---

## 3. 监督微调（SFT）

### 3.1 目标

**SFT（Supervised Fine-Tuning）**：让模型学会遵循人类指令。

```
SFT 数据格式
────────────────────────────────────────────────────────

{
  "instruction": "将下面的句子翻译成英文",
  "input": "今天天气真好",
  "output": "The weather is really nice today"
}

{
  "instruction": "解释什么是机器学习",
  "input": "",
  "output": "机器学习是人工智能的一个分支..."
}

训练方式：
输入: Instruction + Input
目标: Output
损失: Cross-Entropy Loss
```

### 3.2 指令数据来源

```
指令数据来源
────────────────────────────────────────────────────────

1. 人工标注
   • 众包平台收集
   • 质量高但成本高

2. 现有 NLP 数据集转换
   • 分类 → "这个文本是什么类别？"
   • 问答 → "回答以下问题"

3. Self-Instruct
   • 用强模型生成指令
   • 人工筛选质量

4. 开源数据集
   • Alpaca (52K)
   • Dolly (15K)
   • OpenAssistant
```

### 3.3 SFT 训练技巧

```
SFT 最佳实践
────────────────────────────────────────────────────────

1. 学习率
   • 通常比预训练小 10-100 倍
   • 典型值: 1e-5 到 5e-5

2. Epochs
   • 避免过拟合
   • 通常 2-5 epochs

3. 数据质量 > 数量
   • 高质量 10K > 低质量 100K

4. 多样性
   • 覆盖多种任务类型
   • 避免分布偏差

5. LoRA / QLoRA
   • 参数高效微调
   • 只训练少量参数
```

---

## 4. 人类反馈强化学习（RLHF）

### 4.1 为什么需要 RLHF？

```
SFT 的局限
────────────────────────────────────────────────────────

问题：SFT 模型可能：
• 生成有害内容
• 编造事实（幻觉）
• 不符合人类偏好
• 输出格式不一致

解决：让人类告诉模型什么是"好的回答"
```

### 4.2 RLHF 三步骤

```
RLHF 流程
────────────────────────────────────────────────────────

Step 1: 训练奖励模型 (Reward Model)
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Prompt: "解释量子力学"                             │
│                                                     │
│  Response A: [详细准确的解释]  ← 人类标注：更好      │
│  Response B: [简短模糊的解释]  ← 人类标注：较差      │
│                                                     │
│  训练 RM: 学习预测人类偏好                          │
│                                                     │
└─────────────────────────────────────────────────────┘

Step 2: 使用 PPO 训练策略模型
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Policy Model (待训练)                              │
│       │                                             │
│       ↓                                             │
│  生成 Response                                      │
│       │                                             │
│       ↓                                             │
│  Reward Model 打分                                  │
│       │                                             │
│       ↓                                             │
│  PPO 更新 Policy                                    │
│                                                     │
└─────────────────────────────────────────────────────┘

Step 3: 迭代优化
┌─────────────────────────────────────────────────────┐
│                                                     │
│  收集新偏好数据 → 训练新 RM → PPO 训练 → 重复       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.3 奖励模型训练

```
奖励模型 (Reward Model)
────────────────────────────────────────────────────────

结构：与 LLM 类似，最后一层改为标量输出

训练数据：比较对 (prompt, response_better, response_worse)

损失函数：Bradley-Terry 模型
L = -log(σ(r_better - r_worse))

其中：
• r_better = RM(prompt, response_better)
• r_worse = RM(prompt, response_worse)
• σ = sigmoid 函数

目标：让 RM 对更好的回答给出更高分数
```

### 4.4 PPO 算法

```
PPO (Proximal Policy Optimization)
────────────────────────────────────────────────────────

目标函数：
L = E[min(r(θ) × A, clip(r(θ), 1-ε, 1+ε) × A)]

其中：
• r(θ) = π_θ(a|s) / π_old(a|s)  (重要性采样比)
• A = 优势函数 (来自 RM 的奖励)
• ε = clip 范围 (通常 0.2)

加入 KL 散度惩罚：
L_total = L - β × KL(π_θ || π_ref)

防止策略偏离太远，保持语言能力
```

---

## 5. DPO：直接偏好优化

### 5.1 DPO 原理

```
DPO (Direct Preference Optimization)
────────────────────────────────────────────────────────

核心思想：跳过奖励模型，直接从偏好数据优化

传统 RLHF:
偏好数据 → 奖励模型 → PPO 训练

DPO:
偏好数据 → 直接优化策略

优势：
• 更简单
• 更稳定
• 不需要训练 RM
```

### 5.2 DPO 损失函数

```
DPO 损失
────────────────────────────────────────────────────────

L_DPO = -E[log σ(β × (log(π_θ(y_w|x)/π_ref(y_w|x))
                      - log(π_θ(y_l|x)/π_ref(y_l|x))))]

其中：
• y_w = 更好的回答 (winner)
• y_l = 较差的回答 (loser)
• π_ref = 参考模型 (SFT 模型)
• β = 温度参数

直观理解：
让模型增大好回答的概率，减小坏回答的概率
```

---

## 6. 后训练的其他技术

### 6.1 持续学习与遗忘问题

```
灾难性遗忘 (Catastrophic Forgetting)
────────────────────────────────────────────────────────

问题：学习新任务时忘记旧知识

    ┌─────────────────────────────────────────────────┐
    │                                                 │
    │  原始能力 ──────→ 微调后                        │
    │                                                 │
    │  知识 A ████████ → ███░░░░░░ (部分遗忘)         │
    │  知识 B ████████ → ██░░░░░░░ (严重遗忘)         │
    │  新知识 ░░░░░░░░ → █████████ (学会)             │
    │                                                 │
    └─────────────────────────────────────────────────┘

缓解方法：
• Elastic Weight Consolidation (EWC)
• Rehearsal (复习旧数据)
• Parameter-efficient tuning (LoRA)
```

### 6.2 模型合并

```
模型合并 (Model Merging)
────────────────────────────────────────────────────────

目的：合并多个专家模型的能力

方法：
1. 简单平均
   θ_merge = (θ_1 + θ_2 + ... + θ_n) / n

2. Task Arithmetic
   θ_merge = θ_base + λ₁×τ₁ + λ₂×τ₂ + ...
   其中 τ = θ_task - θ_base

3. TIES-Merging
   • 修剪不重要的参数
   • 解决参数冲突

4. DARE
   • 随机置零增量参数
   • 合并效果更好
```

---

## 7. 实际训练示例

### 7.1 SFT 训练代码示例

```python
# 使用 transformers 进行 SFT
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from trl import SFTTrainer

# 加载基础模型
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-hf")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")

# 准备训练参数
training_args = TrainingArguments(
    output_dir="./sft-model",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    learning_rate=2e-5,
    logging_steps=10,
    save_strategy="epoch"
)

# 训练
trainer = SFTTrainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
    tokenizer=tokenizer,
)

trainer.train()
```

### 7.2 LoRA 微调

```python
# 使用 LoRA 进行高效微调
from peft import LoraConfig, get_peft_model

# LoRA 配置
lora_config = LoraConfig(
    r=16,                    # LoRA 秩
    lora_alpha=32,           # 缩放因子
    target_modules=["q_proj", "v_proj"],  # 应用层
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

# 应用 LoRA
model = get_peft_model(model, lora_config)

# 可训练参数大幅减少
# 原始: 7B 参数
# LoRA: ~20M 参数 (0.3%)
```

---

## 关键要点总结

1. **训练三阶段**：预训练 → SFT → RLHF
2. **预训练**：海量数据，学习语言和世界知识
3. **SFT**：指令数据，学习遵循指令
4. **RLHF**：人类偏好，对齐人类价值观
5. **DPO**：简化版 RLHF，直接从偏好优化
6. **遗忘问题**：持续学习的挑战

---

## 思考题

1. 为什么需要三个阶段的训练，不能一步到位？
2. RLHF 中的奖励模型有什么作用？
3. LoRA 为什么能减少训练参数？

---

## 扩展阅读

- [Training Language Models to Follow Instructions](https://arxiv.org/abs/2203.02155) - InstructGPT 论文
- [Llama 2: Open Foundation and Fine-Tuned Chat Models](https://arxiv.org/abs/2307.09288)
- [Direct Preference Optimization](https://arxiv.org/abs/2305.18290)

---

*下一章：[模型推理过程](03-inference-process.md)*

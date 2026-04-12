# 第十五讲：Model Merging 技术

> 对应视频：第十二讲 - 浅谈神奇的 Model Merging 技术

## 本章概要

本章将介绍模型合并（Model Merging）技术，这是一种将多个模型的能力合并到单一模型的方法。

---

## 1. 什么是 Model Merging？

### 1.1 问题背景

```
多模型困境
────────────────────────────────────────────────────────

场景：你需要多个专业模型
┌─────────────────────────────────────────────────────┐
│                                                     │
│  模型 A: 代码生成专家                               │
│  模型 B: 数学推理专家                               │
│  模型 C: 中文写作专家                               │
│  模型 D: ...                                        │
│                                                     │
│  问题：                                             │
│  • 部署成本高（每个模型都需要显存）                  │
│  • 切换麻烦                                         │
│  • 无法同时利用多个能力                             │
│                                                     │
└─────────────────────────────────────────────────────┘

解决方案：合并多个模型 → 一个全能模型
```

### 1.2 Model Merging 定义

**Model Merging**：将多个训练好的模型合并成一个模型，使其具备所有模型的能力。

```
模型合并示意
────────────────────────────────────────────────────────

模型 A (代码)  ─┐
模型 B (数学)  ─┼─→ 合并算法 ─→ 超级模型 (代码+数学+中文)
模型 C (中文)  ─┘

优势：
• 部署成本低（只需一个模型）
• 无需重新训练
• 能力叠加
```

---

## 2. 核心方法

### 2.1 简单平均 (Simple Averaging)

```
简单平均
────────────────────────────────────────────────────────

公式：
θ_merged = (θ_1 + θ_2 + ... + θ_n) / n

优点：
• 简单直接
• 计算成本低

缺点：
• 可能破坏模型能力
• 不考虑模型间的差异
```

### 2.2 Task Arithmetic

```
Task Arithmetic
────────────────────────────────────────────────────────

核心思想：用"任务向量"来合并模型

任务向量：
τ = θ_finetuned - θ_base

合并公式：
θ_merged = θ_base + λ_1·τ_1 + λ_2·τ_2 + ... + λ_n·τ_n

其中：
• θ_base: 基础模型
• τ_i: 第 i 个任务的向量
• λ_i: 缩放系数

示例：
基础模型: Llama-2-7b
任务向量: code_task = code_model - base_model
         math_task = math_model - base_model

合并: merged = base + 0.5*code_task + 0.5*math_task
```

### 2.3 TIES-Merging

```
TIES-Merging
────────────────────────────────────────────────────────

解决的问题：
• 参数冲突：不同任务向量可能修改同一参数为不同值
• 冗余参数：很多参数修改是噪音

三个步骤：
1. Trim（修剪）
   只保留最重要的 k% 参数变化

2. Elect Sign（选举符号）
   对每个参数，选择最多模型同意的变化方向

3. Disjoint Merge（不相交合并）
   只合并不冲突的参数

效果：比简单平均和 Task Arithmetic 更好
```

### 2.4 DARE (Drop And REscale)

```
DARE
────────────────────────────────────────────────────────

核心思想：随机丢弃大部分参数变化

步骤：
1. 对于任务向量 τ 中的每个参数
   - 以概率 p 将其设为 0（丢弃）
   - 以概率 (1-p) 保留并放大：τ_i / (1-p)

2. 合并处理后的任务向量

为什么有效？
• 大多数参数变化是冗余的
• 保留关键变化即可
• 放大是为了补偿丢弃的效果

推荐丢弃率：p = 0.9（丢弃 90% 的变化！）
```

---

## 3. 方法对比

```
Model Merging 方法对比
────────────────────────────────────────────────────────

方法              复杂度   效果   适用场景
────────────────────────────────────────────────
Simple Averaging   低      中    相似模型
Task Arithmetic    低      中    任务特定模型
TIES-Merging       中      高    多样化任务
DARE              低      高    大规模合并
Mixture of Experts 高     最高   需要路由机制
```

---

## 4. 实践指南

### 4.1 使用 mergekit

```bash
# 安装 mergekit
pip install mergekit

# 创建合并配置
cat > config.yaml << EOF
models:
  - model: meta-llama/Llama-2-7b-hf
    parameters:
      weight: 1.0
  - model: codellama/CodeLlama-7b-hf
    parameters:
      weight: 0.5

merge_method: linear
base_model: meta-llama/Llama-2-7b-hf
EOF

# 执行合并
mergekit-yaml config.yaml ./merged-model

# 测试合并后的模型
python -c "
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained('./merged-model')
tok = AutoTokenizer.from_pretrained('./merged-model')
"
```

### 4.2 TIES-Merging 配置

```yaml
# ties_merge.yaml
models:
  - model: meta-llama/Llama-2-7b-hf
  - model: wizardlm/WizardLM-7b-V1.0
    parameters:
      density: 0.5
      weight: 0.5
  - model: openchat/openchat_3.5
    parameters:
      density: 0.5
      weight: 0.5

merge_method: ties
base_model: meta-llama/Llama-2-7b-hf
parameters:
  normalize: true
```

### 4.3 DARE 配置

```yaml
# dare_merge.yaml
models:
  - model: meta-llama/Llama-2-7b-hf
  - model: codellama/CodeLlama-7b-hf
    parameters:
      weight: 0.8
      density: 0.1  # 保留 10% 参数

merge_method: dare_linear
base_model: meta-llama/Llama-2-7b-hf
```

---

## 5. 高级技巧

### 5.1 层级合并

```
不同层使用不同策略
────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│ 层级        合并策略         原因                   │
├─────────────────────────────────────────────────────┤
│ Embedding   只用基础模型    避免词表冲突            │
│ 浅层 (1-8)  简单平均        通用特征                │
│ 中层 (9-16) TIES-Merging    知识密集                │
│ 深层 (17+)  Task Arithmetic  任务特定               │
│ 输出层      只用基础模型    保持输出一致性          │
└─────────────────────────────────────────────────────┘
```

### 5.2 渐进式合并

```python
# 渐进式合并：逐步增加合并强度
import torch

def progressive_merge(base_model, task_models, steps=10):
    """渐进式合并"""
    merged = base_model.copy()

    for step in range(steps):
        alpha = (step + 1) / steps

        for task_model in task_models:
            for name, param in merged.named_parameters():
                task_param = task_model.state_dict()[name]
                base_param = base_model.state_dict()[name]

                # 渐进式混合
                task_vector = task_param - base_param
                param.data = param.data + alpha * 0.1 * task_vector

        # 评估合并效果
        score = evaluate(merged)
        print(f"Step {step+1}: Score = {score}")

    return merged
```

### 5.3 权重搜索

```python
# 自动搜索最优合并权重
from scipy.optimize import minimize

def search_weights(base_model, task_models, eval_data):
    """搜索最优合并权重"""

    def objective(weights):
        # 构建合并模型
        merged = merge_with_weights(base_model, task_models, weights)

        # 评估
        score = evaluate(merged, eval_data)

        # 返回负分数（最小化）
        return -score

    # 初始权重
    n = len(task_models)
    initial_weights = [1.0 / n] * n

    # 搜索
    result = minimize(
        objective,
        initial_weights,
        method='Nelder-Mead',
        options={'maxiter': 50}
    )

    return result.x
```

---

## 6. 评估合并效果

### 6.1 评估维度

```
评估维度
────────────────────────────────────────────────────────

1. 任务性能
   • 各任务的准确率
   • 与原专家模型的差距

2. 通用能力
   • 通用语言理解
   • 是否保留了基础模型能力

3. 效率
   • 模型大小
   • 推理速度

4. 稳定性
   • 输出一致性
   • 不产生幻觉
```

### 6.2 评估代码

```python
def evaluate_merged_model(model, tokenizer, benchmarks):
    """评估合并后的模型"""
    results = {}

    for benchmark in benchmarks:
        if benchmark == "hellaswag":
            score = eval_hellaswag(model, tokenizer)
        elif benchmark == "mmlu":
            score = eval_mmlu(model, tokenizer)
        elif benchmark == "humaneval":
            score = eval_humaneval(model, tokenizer)
        elif benchmark == "gsm8k":
            score = eval_gsm8k(model, tokenizer)

        results[benchmark] = score

    return results

# 使用示例
results = evaluate_merged_model(
    model,
    tokenizer,
    ["hellaswag", "mmlu", "humaneval", "gsm8k"]
)

for benchmark, score in results.items():
    print(f"{benchmark}: {score:.2f}")
```

---

## 7. 实际案例

### 7.1 OpenChat 模型

```
OpenChat 合并案例
────────────────────────────────────────────────────────

基础模型: Llama-2-7b
合并策略: C-RLFT (Conditional RL Fine-Tuning)

结果:
• 通用对话能力强
• 代码能力好
• 超过单一专家模型
```

### 7.2 Solar 模型

```
Solar 合并案例
────────────────────────────────────────────────────────

方法: depth-upscaling

步骤:
1. 取两个 Llama-2 模型
2. 各取一半层数
3. 拼接成一个更深的模型
4. 继续预训练

结果:
• 10.7B 参数
• 性能接近 Llama-2-13b
• 推理更快
```

---

## 关键要点总结

1. **Model Merging**：合并多个模型的能力到单一模型
2. **Task Arithmetic**：使用任务向量进行合并
3. **TIES-Merging**：解决参数冲突问题
4. **DARE**：随机丢弃大部分参数变化，保留关键信息
5. **工具**：mergekit 是最常用的合并工具

---

## 扩展阅读

- [Editing Models with Task Arithmetic](https://arxiv.org/abs/2212.04089)
- [TIES-Merging](https://arxiv.org/abs/2306.01708)
- [Language Models are Super Mario](https://arxiv.org/abs/2311.03099) - DARE 论文
- [mergekit GitHub](https://github.com/arcee-ai/mergekit)

---

*下一章：[DeepSeek 深度思考原理](03-deepseek-reasoning.md)*

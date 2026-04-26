# 技术原理：开源LLM生态

> 开源是 AI 民主化的基石

## 核心概念

### 1. 开源模型的意义

- **民主化**: 降低使用门槛，不再需要依赖大公司 API
- **可复现**: 研究者可以检查、修改、改进
- **定制化**: 企业可以根据自身需求微调
- **透明度**: 安全审计和偏见检测成为可能

### 2. 数据质量 > 数据数量

LLaMA 的核心发现：用更少但更高质量的数据可以训练出更好的模型。

```
GPT-3: 175B 参数, 300B tokens（数据不足）
LLaMA: 65B 参数, 1.4T tokens（数据充足）
结果: LLaMA-65B 超越 GPT-3
```

### 3. MLA（Multi-head Latent Attention）

DeepSeek-V2 的核心创新：大幅降低推理时的 KV Cache。

```
标准 MHA: KV Cache = 2 × n_layers × n_heads × d_head × seq_len
MLA: 将 KV 压缩到低维潜在空间，推理时只需少量缓存
```

### 4. 细粒度 MoE

DeepSeek 的 MoE 创新：
- 更多但更小的专家（细粒度分割）
- 共享专家：所有 token 都经过的固定专家
- 路由专家：根据输入动态选择的专家

## 开源模型演进

```
2023.02  LLaMA (7B-65B) → 开源 LLM 元年
2023.07  LLaMA 2 (7B-70B) → 商用许可
2023     Mistral 7B → 小模型新标杆
2023     Qwen 系列 → 中文能力领先
2024.01  DeepSeek-V2 → MLA + MoE 创新
2024     LLaMA 3 (8B-70B) → 开源新基准
2024.05  DeepSeek-V3 → FP8 训练
2025.01  DeepSeek-R1 → 开源推理模型
```

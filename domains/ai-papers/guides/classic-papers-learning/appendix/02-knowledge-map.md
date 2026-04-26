# 知识关联图谱

> 论文之间的依赖和影响关系

## 核心依赖图

```
                        ┌──────────────┐
                        │  Transformer  │ (2017) 一切的基石
                        └──────┬───────┘
                               │
              ┌────────────────┼────────────────┐
              ↓                ↓                ↓
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │   BERT   │    │  GPT-2   │    │   ViT    │
        │  (2018)  │    │  (2019)  │    │  (2020)  │
        └──────────┘    └────┬─────┘    └────┬─────┘
                             │               │
                        ┌────┴─────┐   ┌─────┴──────┐
                        │  GPT-3   │   │   CLIP     │
                        │  (2020)  │   │   (2021)   │
                        └────┬─────┘   └─────┬──────┘
                             │               │
              ┌──────────────┼───────────────┤
              ↓              ↓               ↓
        ┌───────────┐  ┌──────────┐   ┌───────────┐
        │Scaling L. │  │InstructGPT│   │DALL-E/SD  │
        │  (2020)   │  │  (2022)  │   │ (2021)    │
        └─────┬─────┘  └────┬─────┘   └─────┬─────┘
              │              │               │
              ↓              ↓               ↓
        ┌───────────┐  ┌──────────┐   ┌───────────┐
        │Chinchilla │  │Const. AI │   │DreamFusion│
        │  (2022)   │  │  (2022)  │   │  (2022)   │
        └─────┬─────┘  └────┬─────┘   └─────┬─────┘
              │              │               │
              ↓              ↓               ↓
        ┌───────────┐  ┌──────────┐   ┌───────────┐
        │  LLaMA    │  │   DPO    │   │   Sora    │
        │  (2023)   │  │  (2023)  │   │  (2024)   │
        └───────────┘  └──────────┘   └───────────┘
```

## 技术流派

### 流派1：自回归语言模型（GPT 路线）
```
Transformer → GPT-2 → GPT-3 → InstructGPT → GPT-4 → o1
                    ↘ LLaMA → DeepSeek-V2 → DeepSeek-R1
```

### 流派2：扩散生成（Diffusion 路线）
```
GAN → Diffusion Beats GANs → Stable Diffusion → Sora
                                          ↘ DreamFusion
U-Net (骨干网络) ─────────────────────→ 所有扩散模型
```

### 流派3：视觉基础模型
```
ResNet → ViT → DeiT
              ↘ CLIP → SAM
              ↘ DINOv2
```

### 流派4：对齐技术
```
RLHF 原始 (2017) → InstructGPT (2022) → ChatGPT
                        ↘ Constitutional AI (2022) → Claude
                        ↘ DPO (2023) → 简化对齐
```

### 流派5：高效训练
```
LoRA (2021) → QLoRA (2023) → 大模型民主化
MoE (2023/Mixtral) → DeepSeek-V2 (细粒度MoE)
FlashAttention (2022) → 所有现代LLM标配
Mamba (2023) → Transformer替代者探索
```

### 流派6：推理与智能
```
CoT (2022) → Self-Consistency → Tree-of-Thought
    ↘ ReAct (2023) → AI Agent
    ↘ o1 (2024) → 测试时计算扩展
    ↘ DeepSeek-R1 (2025) → 开源推理
AlphaGeometry (2024) → 神经符号系统
```

## 跨章节关联

| 关联 | 说明 |
|------|------|
| Transformer → ViT | 同一架构从 NLP 迁移到视觉 |
| ResNet → U-Net → Diffusion | 残差连接→编码器-解码器→扩散骨干 |
| CLIP → DALL-E/SD | CLIP 文本编码器驱动图像生成 |
| GAN → Diffusion | 生成范式从对抗训练到扩散去噪 |
| RLHF → InstructGPT → DPO | 对齐技术的简化演进 |
| Scaling Laws → Chinchilla → LLaMA | 理论→修正→实践 |
| CoT → o1 → DeepSeek-R1 | 推理能力从提示技巧到训练能力 |
| RAG → ReAct → Toolformer | 从知识检索到工具使用的演进 |

---

**创建日期**: 2026-04-19

# AI 经典论文学习领域

> 通过系统阅读 44 篇里程碑论文，建立对现代 AI 技术演进脉络的完整认知

## 领域概况

**学习目标**: 从 Transformer 到大模型时代，通过论文原典理解 AI 技术的核心思想

**当前进度**: 5% 完成（2/44 篇已精读）

**预计时长**: 16 周（每周 6-8 小时）

**难度**: ⭐⭐⭐⭐ (4/5)

**论文数量**: 44 篇（30 篇经典 + 14 篇扩展）

## 学习路径

```
第1章: 基础架构与理论 (6篇)
  Transformer → ResNet → GAN → BERT → GPT-2
    ↓
第2章: 规模与涌现 (4篇)
  Scaling Laws → GPT-3 → Chinchilla → PaLM
    ↓
第3章: 视觉AI革命 (4篇)
  ViT → CLIP → SAM → DeiT
    ↓
第4章: 生成式AI (7篇)
  Diffusion → Stable Diffusion → DALL-E → U-Net → NeRF → DreamFusion → Sora
    ↓
第5章: AI对齐与安全 (5篇)
  RLHF原始 → InstructGPT → Constitutional AI → DPO → LaMDA
    ↓
第6章: 高效训练与架构 (5篇)
  LoRA/QLoRA → MoE → FlashAttention → Mamba → Longformer
    ↓
第7章: 多模态系统 (3篇)
  GPT-4 → Gemini → Gato
    ↓
第8章: 开源LLM生态 (2篇)
  LLaMA → DeepSeek-V2
    ↓
第9章: AI推理能力 (4篇)
  CoT → AlphaGeometry → o1 → DeepSeek-R1
    ↓
第10章: 知识增强与应用 (4篇)
  RAG → Whisper → ReAct → Toolformer
    ↓
    完成！建立完整的 AI 技术认知体系
```

## 章节概览

### 第1章: 基础架构与理论
**论文数**: 6 | **时间跨度**: 2014-2019 | **状态**: 未开始

现代 AI 的一切从这里开始。Transformer 定义了架构范式，ResNet 解决了深度网络训练，GAN 开启了生成式 AI，BERT 和 GPT 系列奠定了预训练方法论。

**核心论文**: Transformer, ResNet, GAN, BERT, GPT-2

---

### 第2章: 规模与涌现
**论文数**: 4 | **时间跨度**: 2020-2022 | **状态**: 未开始

规模是现代 AI 最核心的发现之一。当参数量和数据量增长到临界点，模型会涌现出全新的能力。Scaling Laws 提供了理论框架，GPT-3 验证了假设。

**核心论文**: Scaling Laws, GPT-3, Chinchilla, PaLM

---

### 第3章: 视觉AI革命
**论文数**: 4 | **时间跨度**: 2020-2023 | **状态**: 未开始

从 CNN 到 Transformer，视觉 AI 经历了范式转换。ViT 证明了通用架构的有效性，CLIP 统一了视觉和语言，SAM 开创了视觉基础模型时代。

**核心论文**: ViT, CLIP, SAM, DeiT

---

### 第4章: 生成式AI
**论文数**: 7 | **时间跨度**: 2015-2024 | **状态**: 未开始

从 GAN 到 Diffusion，从 2D 图像到 3D 场景再到视频生成，生成式 AI 的每一步都是范式级别的突破。这一章追踪了从像素到世界模拟器的完整路径。

**核心论文**: Diffusion Models, Stable Diffusion, DALL-E, NeRF, Sora

---

### 第5章: AI对齐与安全
**论文数**: 5 | **时间跨度**: 2017-2023 | **状态**: 未开始

让 AI 系统理解并遵循人类意图，是 AI 安全的核心课题。从 RLHF 的理论框架到 InstructGPT 的工程实践，再到 DPO 的简化方案，这一章记录了对齐技术的演进。

**核心论文**: RLHF, InstructGPT, Constitutional AI, DPO

---

### 第6章: 高效训练与架构
**论文数**: 5 | **时间跨度**: 2021-2023 | **状态**: 未开始

大模型的民主化依赖于训练和推理效率的提升。LoRA 让微调平民化，MoE 用稀疏激活提升容量，FlashAttention 和 Mamba 从底层优化计算。

**核心论文**: LoRA/QLoRA, MoE/Mixtral, FlashAttention, Mamba

---

### 第7章: 多模态系统
**论文数**: 3 | **时间跨度**: 2022-2023 | **状态**: 未开始

单一模态到多模态是 AI 的必然趋势。GPT-4 和 Gemini 代表了两种不同的多模态路线（微调 vs 原生），Gato 则探索了通用智能体。

**核心论文**: GPT-4, Gemini, Gato

---

### 第8章: 开源LLM生态
**论文数**: 2 | **时间跨度**: 2023-2024 | **状态**: 未开始

开源社区彻底改变了 LLM 的格局。LLaMA 催生了整个开源生态，DeepSeek 证明了中国团队在架构创新上的能力。

**核心论文**: LLaMA, DeepSeek-V2

---

### 第9章: AI推理能力
**论文数**: 4 | **时间跨度**: 2022-2025 | **状态**: 未开始

推理能力是通向 AGI 的关键一步。CoT 打开了推理的大门，o1 和 DeepSeek-R1 展示了"慢思考"的潜力，AlphaGeometry 证明了神经符号系统的力量。

**核心论文**: Chain-of-Thought, AlphaGeometry, o1, DeepSeek-R1

---

### 第10章: 知识增强与应用
**论文数**: 4 | **时间跨度**: 2020-2023 | **状态**: 未开始

如何让 AI 系统真正有用？RAG 解决了知识时效性问题，Whisper 统一了语音识别，ReAct 和 Toolformer 让 AI 学会使用工具和行动。

**核心论文**: RAG, Whisper, ReAct, Toolformer

## 技能发展

### 当前技能水平

| 技能 | 当前 | 目标 | 状态 |
|------|------|------|------|
| 论文阅读能力 | 2/5 | 4/5 | 入门 |
| 深度学习基础 | 3/5 | 5/5 | 中级 |
| LLM 原理 | 3/5 | 4/5 | 中级 |
| AI 历史脉络 | 2/5 | 4/5 | 入门 |
| 批判性思维 | 2/5 | 4/5 | 入门 |

### 学习里程碑

- [ ] 理解 Transformer 架构原理
- [ ] 掌握预训练-微调范式
- [ ] 理解 Scaling Laws 的含义
- [ ] 建立视觉 AI 的认知框架
- [ ] 理解生成式模型的技术谱系
- [ ] 掌握 AI 对齐的核心方法
- [ ] 理解高效训练技术的原理
- [ ] 建立多模态 AI 的认知
- [ ] 了解推理能力的技术进展
- [ ] 理解知识增强和应用范式

## 与其他领域的关联

```
AI 论文 (理论基础)
  ├──→ AI Agent (论文中的 Agent 相关研究支撑)
  ├──→ 游戏引擎 (NeRF/DreamFusion/Sora → 游戏资产生成)
  ├──→ 提示工程 (GPT-3/CoT → Prompt 设计)
  └──→ 软件开发 (RAG/Toolformer → AI 辅助开发)
```

## 推荐阅读顺序

### 快速路线（10 篇核心）
Transformer → ResNet → GPT-3 → CLIP → InstructGPT → LoRA → CoT → GPT-4 → LLaMA → DeepSeek-V2

### 完整路线（44 篇系统学习）
按第1章到第10章顺序阅读

### 专题路线
- **LLM 研究者**: Transformer → GPT-2 → Scaling Laws → GPT-3 → InstructGPT → LoRA → GPT-4 → LLaMA
- **视觉 AI**: ViT → CLIP → SAM → Stable Diffusion → DALL-E → NeRF → Sora
- **AI 安全**: RLHF → InstructGPT → Constitutional AI → DPO
- **AI 应用**: RAG → CoT → ReAct → Toolformer

## 学习资源

### 论文原始笔记
- [30 篇论文完整笔记](./papers/ai-papers-full.md)

### 系统学习指南
- [经典论文系统学习](./guides/classic-papers-learning/)

### 学习路线
- [AI 论文个性化学习路线](../../learning-routes/topic-index/ai-papers.md)

---

**领域负责人**: Perry
**创建日期**: 2026-04-19
**最后更新**: 2026-04-19

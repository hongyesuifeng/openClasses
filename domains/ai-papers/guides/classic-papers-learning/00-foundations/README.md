# 第1章：基础架构与理论

> 现代 AI 的一切从这里开始

## 章节概览

本章涵盖 2014-2019 年间奠定现代深度学习基础的 5 篇关键论文。从 Transformer 的注意力机制到 ResNet 的残差连接，从 GAN 的对抗生成到 BERT 和 GPT-2 的预训练范式，这些工作构成了后续所有 AI 进展的技术基石。

## 学习目标

- 理解 Transformer 自注意力机制的原理和优势
- 掌握残差连接为什么能解决深度网络训练问题
- 了解 GAN 的对抗训练思想及其局限性
- 理解 BERT 双向预训练和 GPT-2 自回归预训练的区别
- 建立对"预训练-微调"范式的认知

## 核心论文

| 序号 | 论文 | 年份 | 核心贡献 |
|------|------|------|----------|
| 01 | [Transformer: Attention Is All You Need](./01-transformer.md) | 2017 | 自注意力机制，序列建模新范式 |
| 02 | [ResNet: Deep Residual Learning](./02-resnet.md) | 2015 | 残差连接，解决梯度消失 |
| 03 | [GAN: Generative Adversarial Nets](./03-gan.md) | 2014 | 对抗训练，生成式AI起点 |
| 04 | [BERT: Pre-training of Transformers](./04-bert.md) | 2018 | 双向预训练，NLP新范式 |
| 05 | [GPT-2: Language Models are Unsupervised Multitask Learners](./05-gpt2.md) | 2019 | 零样本学习，自回归预训练 |

## 预计时间

**约 2 周**（每周 3 篇，每篇 2-3 小时）

## 前置知识

- 基础线性代数（矩阵运算、向量空间）
- 基础概率论（条件概率、贝叶斯定理）
- 神经网络基础概念（前向传播、反向传播）

## 章节关联

- **前置**: 无（这是起点）
- **后续**: 第2章（规模与涌现）建立在 Transformer 和 GPT 系列之上

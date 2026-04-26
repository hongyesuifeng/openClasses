# 第5章：AI对齐与安全

> 让 AI 理解并遵循人类意图

## 章节概览

AI 对齐是确保 AI 系统行为符合人类价值观和意图的核心课题。本章从 RLHF 的理论基础到 InstructGPT 的工程实践，从 Constitutional AI 的自我对齐到 DPO 的简化方案，追踪了对齐技术的完整演进。

## 学习目标

- 理解 RLHF 的三阶段训练流程
- 掌握 InstructGPT 的 SFT → RM → PPO 流程
- 了解 Constitutional AI 的自我批判机制
- 理解 DPO 如何简化 RLHF 流程

## 核心论文

| 序号 | 论文 | 年份 | 核心贡献 |
|------|------|------|----------|
| 01 | [Deep RL from Human Preferences](./01-rlhf-original.md) | 2017 | RLHF 理论框架 |
| 02 | [InstructGPT](./02-instructgpt.md) | 2022 | SFT + RM + PPO 工程实现 |
| 03 | [Constitutional AI](./03-constitutional-ai.md) | 2022 | AI 自我反馈对齐 |
| 04 | [DPO](./04-dpo.md) | 2023 | 直接偏好优化 |
| 05 | [LaMDA](./05-lamda.md) | 2022 | 对话系统对齐 |

## 预计时间

**约 2 周**

## 前置知识

- 第1章（Transformer 架构）
- 第2章（大模型训练流程）
- 基础强化学习概念（策略、奖励、价值函数）

## 章节关联

- **前置**: 第2章（理解大模型训练是前提）
- **后续**: 第8章（开源模型的对齐方法）

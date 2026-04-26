# 推荐阅读顺序

> 从基础到前沿，44 篇论文的最优阅读路径

## 核心路线（10 篇必读）

适合时间有限、希望快速建立 AI 技术认知框架的读者。

| 顺序 | 论文 | 章节 | 为什么必读 |
|------|------|------|-----------|
| 1 | Transformer (2017) | 00-foundations | 一切的基石 |
| 2 | ResNet (2015) | 00-foundations | 理解残差连接 |
| 3 | GPT-3 (2020) | 01-scaling | 大模型时代的起点 |
| 4 | CLIP (2021) | 02-vision | 多模态的桥梁 |
| 5 | Stable Diffusion (2021) | 03-generative | 理解扩散模型 |
| 6 | InstructGPT (2022) | 04-alignment | ChatGPT 的技术基础 |
| 7 | LoRA (2021) | 05-efficient | 大模型微调标配 |
| 8 | Chain-of-Thought (2022) | 08-reasoning | 推理能力的觉醒 |
| 9 | GPT-4 (2023) | 06-multimodal | 多模态新高度 |
| 10 | LLaMA (2023) | 07-open-source | 开源 LLM 生态 |

## 完整路线（44 篇系统学习）

按章节顺序阅读，每章内部按编号顺序。

### 第1阶段：打好地基（第1-2章，10篇）

```
01. Transformer (2017)          ← 一切开始的地方
02. ResNet (2015)               ← 深度网络的基石
03. GAN (2014)                  ← 生成式AI的起点
04. BERT (2018)                 ← 双向理解
05. GPT-2 (2019)                ← 零样本学习
06. Scaling Laws (2020)         ← 规模的理论基础
07. GPT-3 (2020)                ← 大模型元年
08. Chinchilla (2022)           ← 数据量的重要性
09. PaLM (2022)                 ← 涌现能力的验证
```

### 第2阶段：视觉与生成（第3-4章，11篇）

```
10. ViT (2020)                  ← 视觉Transformer
11. CLIP (2021)                 ← 视觉-语言对齐
12. SAM (2023)                  ← 视觉基础模型
13. DeiT (2021)                 ← 数据高效训练
14. Diffusion Beats GANs (2021) ← 扩散超越GAN
15. Stable Diffusion (2021)     ← 消费级图像生成
16. DALL-E (2021)               ← 文本到图像
17. U-Net (2015)                ← 编码器-解码器
18. NeRF (2020)                 ← 隐式3D表示
19. DreamFusion (2022)          ← 文本到3D
20. Sora (2024)                 ← 世界模拟器
```

### 第3阶段：对齐与效率（第5-6章，10篇）

```
21. RLHF 原始 (2017)            ← 理论源头
22. InstructGPT (2022)          ← 工程实现
23. Constitutional AI (2022)    ← AI自我对齐
24. DPO (2023)                  ← 简化对齐
25. LaMDA (2022)                ← 对话系统
26. LoRA & QLoRA (2021/2023)    ← 低秩适配
27. MoE / Mixtral (2023)        ← 稀疏激活
28. FlashAttention (2022)       ← IO感知注意力
29. Mamba (2023)                ← 线性复杂度
30. Longformer (2020)           ← 稀疏注意力
```

### 第4阶段：前沿与应用（第7-10章，13篇）

```
31. GPT-4 (2023)                ← 多模态大模型
32. Gemini (2023)               ← 原生多模态
33. Gato (2022)                 ← 通才智能体
34. LLaMA (2023)                ← 开源生态
35. DeepSeek-V2 (2024)          ← 中国开源力量
36. Chain-of-Thought (2022)     ← 思维链
37. AlphaGeometry (2024)        ← 神经符号推理
38. o1 (2024)                   ← 测试时计算
39. DeepSeek-R1 (2025)          ← 开源推理
40. RAG (2020)                  ← 检索增强
41. Whisper (2022)              ← 语音识别
42. ReAct (2023)                ← 推理+行动
43. Toolformer (2023)           ← 工具学习
```

（注：部分章节中合并了论文如 LoRA+QLoRA，实际独立论文约 44 篇）

## 专题路线

### LLM 研究者路线
Transformer → GPT-2 → Scaling Laws → GPT-3 → Chinchilla → InstructGPT → LoRA → GPT-4 → LLaMA → DeepSeek-V2 → o1 → DeepSeek-R1

### 视觉/生成 AI 路线
ResNet → GAN → ViT → CLIP → Diffusion → Stable Diffusion → DALL-E → U-Net → NeRF → DreamFusion → SAM → Sora

### AI 安全与对齐路线
RLHF 原始 → InstructGPT → Constitutional AI → DPO → GPT-4

### AI Agent 路线
CoT → Gato → LaMDA → RAG → ReAct → Toolformer → DeepSeek-R1

---

**创建日期**: 2026-04-19

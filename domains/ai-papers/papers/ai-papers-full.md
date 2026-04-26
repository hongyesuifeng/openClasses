# 机器学习与人工智能经典论文 · 30篇系统学习笔记（2020-2026）

_神经蛙内化版 — 不是抄摘要，是自己的消化_

---

## 学习概览

本文档整理了机器学习与人工智能领域2020-2026年间最具影响力的30篇经典论文，涵盖大语言模型、视觉AI、扩散模型、AI对齐与安全、多模态系统等核心方向。按主题分为15天推送，每天2篇，目标是建立对现代AI技术演进脉络的完整认知。

**当前进度：2/30**

---

## Day 1 · 大模型时代的开启

### 1. GPT-3（2020）— 语言模型是少样本学习者

**论文：** Language Models are Few-Shot Learners
**作者：** Brown et al., OpenAI
**年份：** 2020

**一句话总结：** 1750亿参数的超级语言模型，不需要fine-tuning，只靠提示词就能完成各种任务。

**它解决了什么问题？**

在GPT-3之前，NLP模型做新任务需要：① 收集该任务的标注数据；② 在新数据上Fine-tune模型；③ 部署。这个流程成本极高，且每个任务都要单独训练。GPT-3问了一个根本问题：**规模大到一定程度后，语言模型能不能直接"理解"任务，而不需要专门训练？**

**核心方法：**

GPT-3的核心是**规模涌现（Emergent Ability）**。当模型参数量从几亿扩展到1750亿时，出现了在小模型上完全看不到的能力：

- **上下文学习（In-Context Learning）**：给几个例子，模型就能推断出任务规则，不需要梯度更新
- **思维链能力的雏形**：在某些复杂推理任务上开始出现正确思路
- **零样本任务迁移**：不做任何训练，只靠提示词就能适配全新任务类型

**关键实验数据：**
- 在SuperGLUE上（8个NLP任务基准），从GPT-2的47分提升到71分，超越当时所有微调模型
- 1750亿参数，训练数据约3000亿token
- 训练一次约花费1200万美元

**为什么重要？**

GPT-3是真正意义上的"大模型元年"工作。它证明了：模型的智能水平与参数量存在强相关性，而且这种增长是非线性的——规模越大，涌现出的能力越多。

更重要的是，GPT-3展示了**提示词工程（Prompt Engineering）**的价值：不改模型权重，只改输入格式，就能解锁新能力。这个洞察深刻影响了之后LLM应用的所有形态。

**我的理解：** GPT-3像是一个压缩了人类互联网知识的巨大数据库，规模大到让它获得了某种"泛化能力"。但它也有明显局限——它没有真正的理解能力，只是在做高级的"统计模仿"。这也是后来RLHF和CoT要解决的问题。

---

### 2. ViT — 把Transformer扔进图像（2020）

**论文：** An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale
**作者：** Dosovitskiy et al., Google
**年份：** 2020

**一句话总结：** 把图像切成16×16的小块，每块当一个"词"，用Transformer做图像分类。

**它解决了什么问题？**

在此之前，CNN（卷积神经网络）是计算机视觉的绝对王者，Transformer只在NLP领域称霸。视觉任务被认为需要CNN特有的"局部感受野"——因为像素是网格结构，相邻像素之间有关联，这是CNN天然擅长的。

但ViT证明：**Transformer不需要局部归纳偏置，只要规模够大、数据够多，纯注意力机制在视觉上同样有效。**

**核心方法：**

1. **图像块化（Patch Embedding）**：将224×224的图像切成16×16的小块（Patch），每个patch通过一个线性投影变成一个向量。224÷16=14，14×14=196个patch，相当于196个"词"
2. **添加位置编码**：用可学习的向量或正弦编码，标注每个patch在图像中的位置
3. **标准Transformer Encoder**：和NLP中的Transformer一样处理这些patch序列
4. **分类头**：加上一个[CLS] token，最后用它做分类

**关键设计：ViT需要大量数据**

ViT的致命弱点是需要比CNN多得多的数据才能训练好。这是因为CNN自带局部归纳偏置（相邻像素有关联），而ViT需要从零学习这个知识。Google的解决方案：**在3亿张图像的JFT-300M数据集上预训练**，效果终于超越了CNN。

**为什么重要？**

ViT开启了**视觉Transformer时代**：
- 后来所有的视觉大模型（CLIP、SAM、DINO、Stable Diffusion的视觉编码器）都建立在ViT架构上
- 它证明了Transformer不只是NLP的工具，而是通用架构
- 为多模态模型（同时理解图像和文本）铺平了道路——因为图像和文本现在可以用同一个架构处理

**我的理解：** ViT的核心哲学是把一切 token 化——文本是词，图像是patch，声音是频谱图。只要你能把信息切分成离散的"单元"，Transformer就能处理。这种大一统的思路，是现代AI最重要的思想之一。

---

## Day 2 · 深度学习的基石

### 3. ResNet（2015）— 残差连接：深度学习的里程碑

**论文：** Deep Residual Learning for Image Recognition
**作者：** He et al., Microsoft Research
**年份：** 2015（作为经典补充）

**一句话总结：** 用"残差连接"让深层网络训练不再困难，是现代所有深度网络的基石。

**它解决了什么问题？**

训练深层神经网络有一个根本困难：**梯度消失**。当网络很深时，梯度在反向传播中不断衰减，导致前面的层几乎学不到东西。

传统思路是让每一层直接学习输入到输出的映射 H(x)。但当网络很深时，这个 H(x) 变得非常复杂，学习难度呈指数增长。

**核心方法：**

ResNet的核心洞察是：让每一层只学习**相对于输入的残差（Residual）**：

- 传统：让网络学习 H(x) → y
- ResNet：让网络学习 F(x) = H(x) - x，输出 y = F(x) + x

如果最优映射接近恒等映射（大多数情况下确实如此），那么网络只需要把 F(x) 压到接近0就行了——这比学习全新的映射容易得多。

**直观类比：** 修改一篇文章 vs 保留原文写批注。批注方式让编辑工作简单太多。

**技术细节：**
- 残差块：y = F(x) + x，Add后ReLU
- 梯度可以无阻碍从输出传回输入，彻底解决梯度消失
- 152层ResNet（比之前的VGG深8倍），ImageNet top-5错误率3.57%，首次超越人类水平（5%）

**为什么重要？**

ResNet是深度学习历史上最重要的论文之一：

- 残差连接成为所有现代深度网络的标配（Transformer每个子层都有残差+LayerNorm）
- DenseNet将其扩展为"Dense连接"——每层接收所有前面层的输出
- 奠定了"更深=更强"这条主线，直到今天的大模型

**我的理解：** 残差是"增量学习"思想——每一层只学相对于输入的修正量，而非学全新的映射。这比从头学容易得多。它的哲学影响了Transformer、U-Net，以及几乎所有现代架构设计。

---

### 4. NeRF（2020）— 用神经网络表示3D世界

**论文：** Neural Radiance Fields for View Synthesis
**作者：** Mildenhall et al., UC Berkeley
**年份：** 2020

**一句话总结：** 用一个MLP就能表示一个完整的3D场景，从任意角度渲染出逼真的新视图。

**它解决了什么问题？**

3D重建一直是计算机视觉的核心问题。传统方法（Structure from Motion, Multi-View Stereo）需要复杂的几何管线，而且重建结果往往不完整或有瑕疵。NeRF问了一个新问题：**能不能直接用一个神经网络来表示整个3D场景，然后从这个网络中渲染出新视角的图像？**

**核心方法：**

1. **场景表示**：训练一个MLP，输入3D坐标(x,y,z)和视角方向，输出该点的颜色RGB和密度σ
2. **体积渲染**：用光线投射（Ray Marching）穿过场景，沿光线对采样点积分，得到像素颜色
3. **训练数据**：多视角的已知图像，通过优化MLP参数使渲染结果与真实图像一致

**为什么有效？**

- MLP作为连续函数，自然地表示了3D空间（不需要离散的体素或网格）
- 隐式表示（implicit representation）天然支持任意分辨率渲染
- 密度场使网络自动学习几何结构，不需要显式的深度估计

**影响：** NeRF开启了"神经渲染（Neural Rendering）"这个新方向，后续出现了DreamFusion（文本→3D）、Gaussian Splatting（实时3D渲染）等突破性工作，直接影响了苹果Vision Pro的空间视频、Adobe的3D内容生成等实际应用。

---

## Day 3 · 多模态的萌芽

### 5. CLIP（2021）— 用自然语言监督学习视觉

**论文：** Learning Transferable Visual Models From Natural Language Supervision
**作者：** Radford et al., OpenAI
**年份：** 2021

**一句话总结：** 训练一个视觉编码器，让它学会"图像和文本是相关的"，从而实现真正的零样本图像识别。

**它解决了什么问题？**

传统视觉模型需要大量标注数据（如ImageNet需要1400万张标注图像），而且只能识别训练时定义好的类别。CLIP的核心洞察：**互联网上有数十亿张附带文本描述的图像，这些（图像，文本）配对本身就是极好的训练信号——不需要人工标注！**

**核心方法：**

1. **双塔架构**：视觉Encoder（ViT）和文本Encoder（Transformer）分别处理图像和文本
2. **对比学习**：训练时让配对的图像-文本表示在向量空间中接近，不配对的远离
3. **预训练**：用4亿对（图像，文本）数据进行大规模预训练
4. **零样本分类**：将目标类别文本（如"一张猫的照片"）编码，与图像编码对比，找到最匹配的类别

**为什么重要？**

CLIP彻底改变了视觉模型的训练范式：
- 第一次实现了真正开放词汇的零样本图像识别
- 证明了"文本监督"是大规模视觉学习的高质量信号
- 成为DALL-E、Stable Diffusion等多模态模型的视觉基础
- 开源社区基于CLIP开发了大量应用（图像搜索、风格迁移、物体检测等）

**我的理解：** CLIP的核心贡献是把"视觉"和"语言"放到了同一个向量空间。这意味着机器第一次真正理解了"图像内容"和"语言描述"之间的关系，而不只是标签编号。这是多模态AI的起点。

---

### 6. DALL-E（2021）— 从文本到图像的创造性生成

**论文：** DALL-E: Creating Images from Text
**作者：** Ramesh et al., OpenAI
**年份：** 2021

**一句话总结：** 第一个能够根据任意文本描述生成对应图像的大模型，标志着AIGC时代的开端。

**核心方法：**

DALL-E采用了两阶段方法：
1. **离散变分自编码器（dVAE）**：将图像压缩到离散的token空间（约32×32个token）
2. **自回归Transformer**：将文本token和图像token拼接，用类似GPT的方式生成图像token序列
3. 两阶段级联：文本→中间表示→最终图像

**技术亮点：**
- 零样本图像操控：输入"把苹果放在盘子里"能生成正确图像
- 组合泛化能力：能处理训练时未见过的物体组合
- 展示了惊人的常识推理能力（如"立方体形状的番茄"）

**为什么重要？**

DALL-E是AIGC浪潮的第一波：
- 证明了大规模生成模型在创意任务上的潜力
- 直接催生了DALL-E 2、Stable Diffusion等后续更强大的模型
- 开启了一个全新的内容创作范式

---

## Day 4 · 扩散模型的崛起

### 7. Stable Diffusion / Latent Diffusion（2021）

**论文：** High-Resolution Image Synthesis with Latent Diffusion Models
**作者：** Rombach et al., CompVis
**年份：** 2021

**一句话总结：** 在压缩的"潜空间"而非像素空间做扩散，大幅降低计算成本，让高质量图像生成在消费级GPU上成为可能。

**它解决了什么问题？**

早期的扩散模型直接在像素空间操作，计算成本极高——训练一张高清图像需要数百GB内存。Stable Diffusion的核心洞察：**先用一个变分自编码器把图像压缩到低维"潜空间"，在潜空间里做扩散计算，最后解码回像素空间。** 潜空间维度通常是原图的1/8，内存需求降低64倍。

**为什么重要？**

- 让高质量图像生成在普通RTX显卡上运行成为现实
- 开源模型引爆了全球AI艺术社区
- 成为ControlNet、LoRA等微调技术的基础框架

---

### 8. Diffusion Models Beat GANs（2021）

**论文：** Diffusion Models Beat GANs on Image Synthesis
**作者：** Dhariwal & Nichol, OpenAI
**年份：** 2021

**一句话总结：** OpenAI用大量实验证明扩散模型在图像质量上全面超越GAN，开创了扩散模型在生成领域的主导时代。

**核心贡献：**

GAN（生成对抗网络）虽然生成质量高，但训练不稳定、模式崩溃、难以优化。扩散模型训练更稳定，但生成质量长期不如GAN。这篇论文通过模型架构改进（U-Net骨干+Attention+BigGAN的鉴别器技术）让扩散模型在FID、IS、Precision/Recall等指标上全面超越BigGAN，正式宣告扩散模型成为图像生成的主流范式。

---

## Day 5 · 高效训练与适配

### 9. LoRA（2021）— 低秩适配：大模型微调的平民化

**论文：** LoRA: Low-Rank Adaptation of Large Language Models
**作者：** Hu et al., Microsoft
**年份：** 2021

**一句话总结：** 不需要重新训练整个模型，只需训练少量低秩矩阵就能高效微调大模型，改变了整个LLM微调领域的游戏规则。

**核心方法：**

LoRA的核心假设：大模型在微调过程中，权重矩阵的变化是低秩的（low-rank）。

具体做法：
- 在预训练模型的注意力层旁边添加两个低秩矩阵 A 和 B
- 更新时：W' = W + BA（其中 W 是原始权重，BA 是低秩更新）
- 训练时只更新 A 和 B，冻结 W
- 推理时将更新合并到原始权重，无额外延迟

**实际效果：**
- 可训练参数量减少10000倍，显存减少3倍
- 在LLaMA-7B上，用一张RTX 3090就能微调
- 效果接近全量微调，成为开源LLM社区的标配

**为什么重要？**

LoRA将大模型微调的门槛从"需要A100集群"降低到"一张消费级显卡"。它催生了QLoRA（量化+LoRA）、DoRA、LoRA+等一系列后续工作，至今仍是LLM定制化最重要的技术。

---

### 10. DeiT（2021）— 数据高效的视觉Transformer

**论文：** Training Data-efficient Image Transformers & Distillation
**作者：** Touvron et al., Facebook
**年份：** 2021

**一句话总结：** 用知识蒸馏（Distillation）让ViT在小数据集（ImageNet）上也能训练成功，不需要JFT-300M那样的超大规模数据集。

**核心方法：**

1. 使用RegNet-Y作为教师网络进行蒸馏
2. 训练时不仅让学生网络（ViT）学习真实标签，还学习教师网络的输出（软标签）
3. 证明attention map本身也可以作为蒸馏信号

DeiT让学术界的视觉Transformer研究成为可能，不必依赖Google级别的数据资源。

---

## Day 6 · 推理能力的觉醒

### 11. Chain-of-Thought / CoT（2022）— 思维链：让大模型学会推理

**论文：** Chain-of-Thought Prompting Elicits Reasoning in Large Language Models
**作者：** Wei et al., Google
**年份：** 2022

**一句话总结：** 让大模型在给出最终答案之前，先写出中间推理步骤——这个简单的技巧大幅提升了模型的复杂推理能力。

**它解决了什么问题？**

直接问大模型复杂的数学/逻辑问题，即使是最强的GPT-3也会答错。原因是：语言模型本质上是"下一个词预测"，对于需要多步推理的问题，单次预测无法捕获逻辑链。

**核心方法：**

CoT的核心洞察：**推理过程本身也是文本，只要把推理步骤显式写出来，模型就能学会一步步推理。**

具体做法：
- Few-shot CoT：在提示词中给出几个"问题→推理步骤→答案"的示例
- Zero-shot CoT：简单指令"让我们一步一步思考"（Let's think step by step）就能触发

**为什么有效？**

- 显著提升数学推理（GSM8K从12%→40%）、逻辑推理、代码生成等任务
- 揭示了大模型具有"潜在推理能力"，只是需要合适的激活方式
- 催生了Self-Consistency（多次采样+投票）、Self-Verification（让模型验证自己答案）等后续工作

**我的理解：** CoT本质上是把"思考过程"外化。模型需要思考空间来展示推理链，CoT给了它这个空间。这对游戏开发也有启发——AI NPC的行为逻辑也需要"思考过程"来提升可信度。

---

### 12. LaMDA（2022）— 对话系统的新范式

**论文：** LaMDA: Language Models for Dialog Applications
**作者：** Thoppilan et al., Google
**年份：** 2022

**一句话总结：** Google的对话大模型，核心贡献是将"质量"（Quality）、"真实性"（Groundedness）、"安全性"（Safety）作为独立维度评估对话，并提出用外部工具查询来提升真实性的方法。

**三个核心维度：**
1. **质量**：Sensibleness, Interestingness, Specificity（合理、有趣、具体）
2. **真实性**：响应与已知事实的一致性
3. **安全性**：避免有害输出

同时引入了"微调+外部知识检索"的混合架构，显著降低了LLM"一本正经胡说八道"的问题。

---

## Day 7 · AI对齐的起点

### 13. InstructGPT / RLHF（2022）— 让语言模型服从人类意图

**论文：** Training language models to follow instructions with human feedback
**作者：** Ouyang et al., OpenAI
**年份：** 2022

**一句话总结：** 用人类反馈微调大模型，让它能够理解并遵循人类意图——这是ChatGPT背后的核心技术。

**核心方法（PPO + RM）：**

1. **监督微调（SFT）**：用人类写的"标准答案"微调模型
2. **奖励模型（Reward Model）**：训练一个神经网络，输入（提示，回复），输出一个"人类偏好分数"
3. **强化学习（PPO）**：用RM的反馈作为奖励，通过强化学习优化生成策略

**为什么重要？**

InstructGPT是ChatGPT的技术基础，RLHF成为LLM对齐的标准方法：
- 改变了LLM训练的最后一步范式——从"预测下一个token"变成"最大化人类偏好"
- 深刻影响了后来几乎所有对话模型的训练（ChatGPT、Claude、Gemini等）

**我的理解：** RLHF的本质是用人类偏好作为"软标签"，相当于在大模型上再加一层"价值判断"。这对游戏AI也有意义——AI角色的行为不仅要看"像不像"，还要看"玩家喜不喜欢"。

---

### 14. Gato — 通才智能体的探索（2022）

**论文：** A Generalist Agent
**作者：** Reed et al., DeepMind
**年份：** 2022

**一句话总结：** DeepMind训练了一个能同时玩Atari游戏、控制机械臂、做图像描述的"通才"模型，证明单一模型可以处理多种完全不同类型的任务。

**核心贡献：** 用同一个Transformer架构、同样的训练方法处理完全不同的任务类型（视觉、语言、强化学习、机器人控制），在大多数任务上接近或超越专用模型。Gato是后来DeepMind的Gemini和Generalist Agent路线的重要探索。

---

## Day 8 · 规模的科学

### 15. PaLM（2022）— 5400亿参数的涌现能力

**论文：** PaLM: Scaling Language Modeling with Pathways
**作者：** Google (Chowdhery et al.)
**年份：** 2022

**一句话总结：** Google训练5400亿参数大模型，展示了"涌现能力"（Emergent Ability）是真实存在的——参数量大到一定程度后，能力会突然出现而非线性增长。

**核心贡献：**

- 证明Scaling Law持续有效：更大模型+更多数据=更强能力
- 展示了"思维链推理"在540B规模才出现的能力
- Pathways系统：高效利用6144个TPU，支持跨多个TPU Pod的训练
- 在多项基准上超越GPT-3，包括编程任务

---

### 16. Scaling Laws（2020）— 大模型训练的路线图

**论文：** Scaling Laws for Neural Language Models
**作者：** Kaplan et al., OpenAI
**年份：** 2020

**一句话总结：** OpenAI发现了模型性能与参数量、数据量、算力之间的精确幂律关系，为后来所有大模型训练提供了理论基础。

**核心发现：**

- 模型性能（困惑度）与参数量、数据量、算力呈幂律关系
- 训练令牌数（tokens）与参数量同样重要，通常建议每个参数约20个token
- 当某个维度（如参数量）受限时，增加其他维度（数据）仍然有效

**为什么重要？**

Scaling Laws让大模型训练从"盲人摸象"变成了"有路线图的工程"：
- GPT-4的技术报告虽然没透露细节，但大概率参考了Scaling Laws来估算训练成本和性能
- Chinchilla论文指出GPT-3训练不足，催生了Chinchilla（70B）和LLaMA系列

---

## Day 9 · 语音与3D生成

### 17. Whisper（2022）— 语音识别的新范式

**论文：** Whisper: Robust Speech Recognition via Large-Scale Weak Supervision
**作者：** Radford et al., OpenAI
**年份：** 2022

**一句话总结：** 用大规模弱监督（68万小时带伪标签的音频）训练出一个跨语言、多任务的语音识别模型，在多个基准上接近人类水平。

**核心贡献：**

- 68万小时音频，远超此前最大数据集（SLR 1万小时）
- 不需要人工转录，用伪标签自动生成训练数据
- 多语言支持：支持99种语言的语音识别
- 多任务：语音识别+翻译+语言识别+时间戳

**为什么重要？**

Whisper改变了语音AI的生态：
- 开源版本（whisper.cpp）可以在手机端实时运行
- 成为语音输入、字幕生成、会议记录等应用的基础
- 证明了"弱监督+规模"在语音领域的巨大潜力

---

### 18. DreamFusion（2022）— 文本生成3D

**论文：** DreamFusion: Text-to-3D using Score Distillation Sampling
**作者：** Poole et al., Google
**年份：** 2022

**一句话总结：** 利用预训练2D扩散模型的知识，从文本描述生成3D模型——无需3D训练数据。

**核心方法（SDS Loss）：**

DreamFusion的核心是Score Distillation Sampling（SDS）：
1. 训练一个3D表示（NeRF），渲染出2D图像
2. 用预训练的2D扩散模型评估渲染图像的质量
3. 将扩散模型的梯度反向传播到3D表示，优化它朝向更好的文本对齐

**为什么重要？**

- 第一次实现了无3D数据的文本→3D生成
- 催生了大量后续工作（Zero-1-to-3、One-2-3-45、Gaussian Splatting等）
- 直接影响了3D打印、游戏资产生成、VR/AR内容创作

---

## Day 10 · GPT-4与开源生态

### 19. GPT-4（2023）— 多模态大模型的新高度

**论文：** GPT-4 Technical Report
**作者：** OpenAI
**年份：** 2023

**一句话总结：** OpenAI的多模态大模型，在复杂推理、专业考试（如律师考试、司法考试）中接近或超越人类水平。

**核心贡献：**

- **多模态**：接受图像+文本输入，输出文本
- **复杂推理**：在美国律师考试（Bar Exam）中进入前10%
- **长上下文**：支持32K token上下文窗口
- **可控性**：通过系统提示词可以显著改变模型行为

**为什么重要？**

GPT-4重新定义了"通用人工智能"的参照标准：
- 它是第一代真正意义上的"多模态大模型"
- 在专业领域（法律、医学、编程）展现了令人惊讶的能力
- 加速了整个AI行业的技术竞赛

---

### 20. LLaMA（2023）— 开源大模型的引爆点

**论文：** LLaMA: Open and Efficient Foundation Language Models
**作者：** Touvron et al., Meta
**年份：** 2023

**一句话总结：** Meta开源了一系列参数从7B到65B的高效语言模型，催生了整个开源LLM生态。

**核心贡献：**

- 7B和13B模型可以在消费级显卡上运行（改变了AI民主化的格局）
- 33B和65B模型在多项基准上超越GPT-3（175B）
- 训练数据质量是关键：用更高质量的数据替代盲目扩大规模
- 催生了Alpaca、Vicuna、Mistral、Qwen等一系列开源模型

**为什么重要？**

LLaMA是开源LLM生态的起点：
- 7B模型让"本地运行大模型"成为可能
- 推动了QLoRA等高效微调技术的快速发展

---

## Day 11 · 高效微调革命

### 21. QLoRA（2023）— 4-bit量化微调

**论文：** QLoRA: Efficient Finetuning of Quantized LLMs
**作者：** Dettmers et al.
**年份：** 2023

**一句话总结：** 4-bit量化+LoRA的组合，让在单张消费级GPU上微调65B参数模型成为可能——将大模型民主化推向了极致。

**核心方法：**

1. **NF4量化（Normal Float 4-bit）**：专为神经网络权重分布设计的4位量化格式
2. **双重量化**：对量化常数本身再量化，额外节省内存
3. **分页优化器**：处理内存峰值，动态分配显存

**实际效果：** 65B模型微调从需要8×A100降低到单张24GB显卡。首次证明4-bit量化不会严重损害微调效果。

---

### 22. DPO（2023）— 对齐的简化

**论文：** Direct Preference Optimization: Your Language Model is Secretly a Reward Model
**作者：** Rafailov et al., Stanford
**年份：** 2023

**一句话总结：** 用直接优化替代RLHF，无需训练奖励模型，无需强化学习，效果更好且更稳定。

**核心贡献：**

RLHF需要三个步骤（SFT、RM、PPO），DPO将其简化为一步：
- 直接优化"人类偏好"的分类损失
- 不需要显式的奖励模型
- 不需要KL散度约束（DPO隐式处理）

**为什么重要？**

- 大幅简化了对齐流程，降低了训练复杂度
- 在实验中与PPO/RLHF效果相当或更好
- 已成为InstructGPT之后最重要的对齐技术突破之一

---

## Day 12 · 多模态与高效架构

### 23. Gemini（2023）— 原生多模态

**论文：** Gemini: A Family of Highly Capable Multimodal Models
**作者：** Google DeepMind
**年份：** 2023

**一句话总结：** Google的原生多模态模型，从一开始就用文本、图像、音频、视频共同训练，而非分别训练再融合。

**与GPT-4的关键区别：**

- **原生多模态**：Gemini从预训练阶段就接受多模态输入，而GPT-4是多模态微调
- **原生音频**：Gemini Ultra支持音频理解，GPT-4V只支持图像
- **工具调用**：Gemini API内置代码执行、函数调用等工具能力
- Gemini代表了多模态模型的另一种路线：统一表示而非拼接表示

---

### 24. MoE / Mixtral（2023）— 专家混合架构

**论文：** Mixture of Experts Meets Instruction Tuning
**年份：** 2023

**一句话总结：** 稀疏激活的专家混合架构——每次只激活部分专家网络，大幅提升模型容量同时控制计算成本。

**核心方法：**

- 模型有多个"专家"FFN网络（如8个），但每次只激活其中2个
- 一个Router网络决定对每个输入激活哪些专家
- 等效于：用8倍参数，但只花2倍计算成本

**为什么重要？**

- Mixtral 8×7B：用47B参数但只激活12.9B，效果超越70B密集模型
- GPT-4据传使用MoE架构
- DeepSeek-V2是MoE领域的重要开源作品

---

## Day 13 · 长文本与知识增强

### 25. Longformer（2020）— 长文档处理

**论文：** Longformer: The Long-Document Transformer
**作者：** Beltagy et al.
**年份：** 2020

**一句话总结：** 用稀疏注意力（局部窗口+全局注意力）处理超长文档，使Transformer能从几千词扩展到16K词以上。

**核心方法：**

标准Transformer的注意力是O(n²)，Longformer将其稀疏化：
- **局部窗口**：每个token只与附近k个token计算注意力
- **全局注意力**：特殊token（如[CLS]）与所有token计算注意力
- **膨胀窗口**：每隔d个token计算一次，保持远距离感知

最终复杂度从O(n²)降低到O(n)，可以在32K token长度上训练。

---

### 26. RAG（2020）— 检索增强生成

**论文：** Retrieval-Augmented Generation for Knowledge-Intensive Tasks
**作者：** Lewis et al., Facebook
**年份：** 2020

**一句话总结：** 在生成回答前先检索相关知识，让LLM结合外部知识库回答问题——解决LLM"幻觉"问题的重要方法。

**核心架构：**

1. **检索（Retriever）**：用BERT-based bi-encoder从知识库中检索相关文档
2. **生成（Generator）**：将检索结果与原始问题拼接，用Seq2Seq模型生成回答
3. **端到端训练**：检索器和生成器联合优化

**为什么重要？**

RAG是解决LLM知识过时、幻觉问题的工业标准方案：
- 企业知识库+LLM成为主流架构（腾讯文档、飞书、Notion AI等）
- 与向量数据库（Milvus、Pinecone）结合形成完整技术栈
- 对游戏开发也有价值：AI NPC可以用RAG从游戏世界观数据库中检索信息

---

## Day 14 · AI安全与世界模型

### 27. Constitutional AI（2022）— AI反馈的对齐方法

**论文：** Constitutional AI: Harmlessness from AI Feedback
**作者：** Bai et al., Anthropic
**年份：** 2022

**一句话总结：** Anthropic提出用AI自己生成反馈来训练AI，减少人类标注成本，同时提升安全性。

**核心方法：**

Constitutional AI分两阶段：
1. **RLHF阶段**：用人类偏好微调模型
2. **RLAIF阶段**：让模型根据"宪法"（一套行为准则）自我批判和修正

**为什么重要？**

- 减少了人类标注RLHF所需的大量成本
- Anthropic将Constitutional AI应用于Claude
- 探索了"AI自我对齐"的可行路径

---

### 28. Sora（2024）— 世界模拟器

**论文：** Sora: Video Generation Models as World Simulators
**作者：** OpenAI
**年份：** 2024

**一句话总结：** OpenAI的视频生成模型，能根据文本描述生成最长60秒的逼真视频，展现了对物理世界规律的某种"理解"。

**核心方法：**

- 将视频压缩到时序-空间潜空间（类似ViT的patch化思想）
- 用Diffusion Transformer（DiT）架构生成
- 在大量视频数据上预训练

**为什么重要？**

- 视频生成从"玩具"变成"工具"——可以生成游戏过场动画、电影预览
- "世界模型"（World Model）概念的具象化：Sora不是完美模拟物理，但学会了足够的规律
- 对游戏行业的冲击：AI生成视频→游戏过场、AI生成角色动画

---

## Day 15 · 中国力量与AI推理

### 29. DeepSeek-V2（2024）— 中国开源MoE

**论文：** DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model
**作者：** DeepSeek
**年份：** 2024

**一句话总结：** DeepSeek出品的高效MoE模型，中文能力全球领先，同时开源权重——证明了"中国也能做出顶级开源LLM"。

**核心贡献：**

- **DeepSeekMoE架构**：细粒度专家分割+共享专家策略，进一步提升效率
- **FP8训练**：首次在大模型训练中验证FP8混合精度的可行性
- **MLA（Multi-head Latent Attention）**：大幅降低推理时KV缓存

**为什么重要？**

DeepSeek-V2是中国开源LLM的重要里程碑：
- 中文任务上与GPT-4 Turbo相当
- API价格极具竞争力（0.001元/千token量级）
- 证明了中国团队在大模型领域的创新能力

---

### 30. AlphaGeometry（2024）— AI的几何推理

**论文：** AlphaGeometry: Solving Olympiad Geometry without Human Demonstrations
**作者：** DeepMind
**年份：** 2024

**一句话总结：** DeepMind的AI几何定理证明系统，在国际数学奥林匹克（IMO）几何题上达到金牌水平。

**核心方法：**

AlphaGeometry结合了：
1. **神经符号系统**：用神经网络生成几何构造辅助线
2. **符号推力引擎**：基于DDAR（Deductive Database）进行严格的几何推理

**关键创新：**
- 不需要人类证明范例，从零开始训练
- 生成了1亿条几何定理证明的合成数据

**为什么重要？**

- 首次在IMO几何题上达到与人类金牌选手相当的水平
- 展示了"神经+符号"混合AI的潜力
- 对教育AI（自动解题、自动讲题）有直接应用价值

---

## 学习路线总结

| 阶段 | 核心主题 | 关键技术 |
|------|----------|----------|
| 基础 | Transformer + 残差 | 注意力机制、残差连接 |
| 规模 | GPT-3 / PaLM / Scaling Laws | 涌现能力、规模效应 |
| 视觉 | ViT / CLIP / Stable Diffusion | 多模态对齐、潜空间扩散 |
| 对齐 | InstructGPT / DPO / Constitutional | RLHF、AI反馈、安全性 |
| 高效 | LoRA / QLoRA | 低秩适配、量化 |
| 多模态 | Gemini / DALL-E / Sora | 原生多模态、视频生成 |
| 知识 | RAG / Longformer | 检索增强、长上下文 |
| 推理 | CoT / AlphaGeometry | 思维链、神经符号推理 |

**推荐阅读顺序：** ResNet→Transformer→GPT-3→ViT→CLIP→InstructGPT→LoRA→CoT→GPT-4→LLaMA→DeepSeek-V2

---

_文档更新于：Day 1-15（2026-04-17）_
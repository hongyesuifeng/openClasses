# AI 经典论文个性化学习路线

> 根据你的学习档案和兴趣定制的 AI 论文学习路线

## 学习概况

- **主题**: AI 经典论文（机器学习与人工智能）
- **推荐难度**: ⭐⭐⭐⭐ (4/5)
- **预计时长**: 16 周（每周 6-8 小时）
- **匹配度**: 90%（与你的 AI Agent 和游戏开发兴趣高度相关）
- **学习方式**: 70% 理论阅读 + 30% 实践验证

## 学习目标

1. 建立对现代 AI 技术演进脉络的完整认知
2. 深入理解 Transformer、GPT、Diffusion 等核心架构
3. 掌握 RLHF、DPO 等 AI 对齐方法
4. 理解开源 LLM 生态的技术贡献
5. 能够将论文中的思想应用到实际项目中

## 前置知识检查

### 已具备的知识

- **Python 编程** - 掌握程度: 4/5（高级）
  - 应用场景: Agent 开发、数据处理

- **提示工程** - 掌握程度: 5/5（专家）
  - 相关课程: CS146S, Prompt Engineering Guide
  - 应用场景: LLM 应用开发

- **LLM 基础概念** - 掌握程度: 3/5（中级）
  - 相关课程: CS146S Week 1-2, Hello-Agents
  - 应用场景: API 调用、Agent 开发

- **AI Agent 架构** - 掌握程度: 3/5（中级）
  - 相关课程: CS146S, Hello-Agents
  - 应用场景: Agent 应用开发

### 需要补充的知识

- **线性代数** - 推荐资源: 3Blue1Brown 线代本质
  - 重要性: ⭐⭐⭐⭐⭐
  - 预计学习时间: 1 周（复习）

- **概率论基础** - 推荐资源: 统计学习基础
  - 重要性: ⭐⭐⭐⭐
  - 预计学习时间: 1 周（复习）

- **深度学习基础** - 推荐资源: fast.ai / 吴恩达课程
  - 重要性: ⭐⭐⭐⭐⭐
  - 预计学习时间: 2 周

## 学习路线

### 阶段1: 基础架构 (Week 1-3)

**学习目标**:
- 理解 Transformer 架构的核心思想
- 掌握残差连接、GAN、预训练范式

**核心内容**:
- [ ] Transformer (Attention Is All You Need)
- [ ] ResNet (残差连接)
- [ ] GAN (对抗生成)
- [ ] BERT (双向预训练)
- [ ] GPT-2 (自回归预训练)

**推荐资源**:
1. 论文原典 + 笔记
   - 路径: `domains/ai-papers/guides/classic-papers-learning/00-foundations/`
   - 重点: Transformer 的 Q/K/V 注意力计算
   - 时间投入: 15 小时

2. 可视化辅助
   - Jay Alammar 的 "The Illustrated Transformer"
   - 3Blue1Brown 的 Transformer 可视化

**实践项目**: 用 PyTorch 实现一个简易 Transformer

---

### 阶段2: 规模与视觉 (Week 4-6)

**学习目标**:
- 理解 Scaling Laws 和涌现能力
- 掌握视觉 Transformer 和 CLIP 的原理

**核心内容**:
- [ ] Scaling Laws
- [ ] GPT-3
- [ ] Chinchilla
- [ ] PaLM
- [ ] ViT, CLIP, SAM, DeiT

**推荐资源**:
1. 规模论文
   - 路径: `domains/ai-papers/guides/classic-papers-learning/01-scaling/`
   - 重点: 幂律关系的实际意义
   - 时间投入: 10 小时

2. 视觉论文
   - 路径: `domains/ai-papers/guides/classic-papers-learning/02-vision/`
   - 重点: Patch Embedding 和对比学习
   - 时间投入: 12 小时

**实践项目**: 用 CLIP 实现一个简单的图像搜索

---

### 阶段3: 生成式AI (Week 7-9)

**学习目标**:
- 理解扩散模型的数学原理
- 了解从图像到3D到视频的生成技术路径

**核心内容**:
- [ ] Diffusion Models, Stable Diffusion, DALL-E
- [ ] U-Net, NeRF, DreamFusion, Sora

**推荐资源**:
1. 生成式论文
   - 路径: `domains/ai-papers/guides/classic-papers-learning/03-generative/`
   - 重点: 前向加噪 + 逆向去噪的数学
   - 时间投入: 18 小时

**实践项目**: 用 Stable Diffusion WebUI 体验不同参数的影响

---

### 阶段4: 对齐与效率 (Week 10-12)

**学习目标**:
- 掌握 RLHF/DPO 对齐方法
- 理解 LoRA/MoE/FlashAttention 等高效技术

**核心内容**:
- [ ] RLHF, InstructGPT, Constitutional AI, DPO, LaMDA
- [ ] LoRA/QLoRA, MoE, FlashAttention, Mamba, Longformer

**推荐资源**:
1. 对齐论文
   - 路径: `domains/ai-papers/guides/classic-papers-learning/04-alignment/`
   - 重点: SFT → RM → PPO 流程
   - 时间投入: 15 小时

2. 高效训练论文
   - 路径: `domains/ai-papers/guides/classic-papers-learning/05-efficient/`
   - 重点: LoRA 低秩矩阵的数学直觉
   - 时间投入: 15 小时

**实践项目**: 用 LoRA 微调一个开源 LLM

---

### 阶段5: 前沿与生态 (Week 13-16)

**学习目标**:
- 了解多模态、开源、推理能力的最新进展
- 理解 AI Agent 的技术基础

**核心内容**:
- [ ] GPT-4, Gemini, Gato
- [ ] LLaMA, DeepSeek-V2
- [ ] CoT, AlphaGeometry, o1, DeepSeek-R1
- [ ] RAG, Whisper, ReAct, Toolformer

**推荐资源**:
1. 前沿论文
   - 路径: `domains/ai-papers/guides/classic-papers-learning/06-09章`
   - 重点: CoT、ReAct 与 AI Agent 的关系
   - 时间投入: 25 小时

**实践项目**: 用 RAG + ReAct 构建一个简单的知识问答 Agent

---

## 里程碑检查点

| 里程碑 | 时间 | 完成标准 |
|--------|------|----------|
| 基础架构理解 | Week 3 | 能解释 Transformer 和 ResNet 的核心思想 |
| 规模效应认知 | Week 6 | 能说明 Scaling Laws 的实际意义 |
| 生成模型掌握 | Week 9 | 能解释扩散模型的原理 |
| 对齐技术理解 | Week 12 | 能区分 RLHF 和 DPO 的差异 |
| 全部完成 | Week 16 | 建立完整的 AI 技术认知体系 |

## 与其他学习领域的关联

### 与 AI Agent 领域
- CoT → Agent 推理能力
- ReAct → Agent 行动框架
- Toolformer → Agent 工具使用
- RAG → Agent 知识检索

### 与游戏引擎领域
- NeRF/DreamFusion → 游戏资产生成
- Sora → 游戏过场动画
- GAN/Diffusion → 纹理和材质生成

### 与提示工程领域
- GPT-3 → Prompt Engineering 理论基础
- CoT → 高级提示技术
- InstructGPT → 指令遵循原理

## 学习建议

1. **不要追求一次读懂**: 论文通常需要多次阅读
2. **动手验证**: 对关键概念（如注意力机制）尝试用代码实现
3. **建立连接**: 每读完一篇论文，思考它与之前论文的关系
4. **写笔记**: 用自己的话总结，不要抄摘要
5. **定期回顾**: 每完成一个阶段，回顾整个阶段的知识脉络

---

**创建日期**: 2026-04-19

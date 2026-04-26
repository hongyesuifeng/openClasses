# 技术原理：高效训练与架构

> 更快、更省、更强

## 核心概念

### 1. 参数高效微调（Parameter-Efficient Fine-Tuning）

核心思想：冻结预训练模型的大部分参数，只训练少量额外参数。

**LoRA（Low-Rank Adaptation）**：
```
原始权重更新：ΔW = W' - W（参数量 = d×d）
LoRA 更新：ΔW = B × A（参数量 = d×r + r×d，r << d）

推理时：W' = W + B×A（合并到原始权重，无额外开销）
```

**QLoRA**：在 4-bit 量化模型上做 LoRA
- NF4 量化：专为正态分布权重设计
- 双重量化：量化常数本身也量化
- 分页优化器：处理显存峰值

### 2. 稀疏激活（Sparse Activation）

MoE 的核心思想：模型有多个"专家"，每次只激活少数。

```
输入 → Router → 选择 Top-K 专家 → 执行 → 合并输出

例：8个专家，每次激活2个
总参数：8× 但计算量：约2×
```

### 3. IO 感知计算（IO-Aware Computation）

FlashAttention 的核心洞察：注意力计算的瓶颈不是计算量，而是内存访问。

传统注意力：
- O(N²) 内存（需要存储完整注意力矩阵）
- 多次 HBM↔SRAM 数据搬运

FlashAttention：
- 分块计算（Tiling），避免存储完整注意力矩阵
- 最小化 HBM 访问次数
- 精确注意力（非近似）

### 4. 状态空间模型（State Space Models）

Mamba 的核心思想：用固定大小的状态替代 Transformer 的上下文。

```
Transformer: y = Attention(x, x, x)  ← O(N²) 复杂度
SSM:         连续微分方程离散化        ← O(N) 复杂度

Mamba 创新：选择性扫描（Selective Scan）
- 参数依赖的状态转移（不是固定的）
- 可以选择性地记住或遗忘信息
```

## 效率对比

| 方法 | 优化维度 | 效果 | 适用场景 |
|------|---------|------|---------|
| LoRA | 微调参数量 | 10000× 参数减少 | 定制化微调 |
| QLoRA | 微调显存 | 单卡微调 65B | 极端资源受限 |
| MoE | 激活计算量 | 8× 参数 2× 计算 | 推理效率 |
| FlashAttn | 内存访问 | 2-4× 加速 | 所有注意力模型 |
| Mamba | 序列复杂度 | O(N) vs O(N²) | 超长序列 |

# 第1周: 项目搭建 + 数学库

## 目标

- 初始化 Monorepo 项目结构
- 配置 TypeScript + Vite + pnpm
- 实现核心数学类型

## 任务清单

### 1. 项目初始化

- [ ] 创建 pnpm-workspace.yaml
- [ ] 配置根 package.json
- [ ] 配置 TypeScript (tsconfig.json)
- [ ] 配置 Vite 构建工具

### 2. 数学库实现 (@nova/math)

#### Vector2
- [ ] 创建与初始化
- [ ] 加减乘除运算
- [ ] 点积 (dot)
- [ ] 叉积 (cross) - 返回标量
- [ ] 长度与归一化
- [ ] 距离计算
- [ ] 角度计算
- [ ] 线性插值 (lerp)

#### Vector3
- [ ] 完整的向量运算
- [ ] 叉积 (cross) - 返回 Vector3
- [ ] 与 Vector2 的转换

#### Vector4
- [ ] 基础运算
- [ ] 齐次坐标支持

#### Matrix4x4
- [ ] 单位矩阵
- [ ] 平移、旋转、缩放
- [ ] 矩阵乘法
- [ ] 逆矩阵
- [ ] 转置
- [ ] 视图矩阵 (lookAt)
- [ ] 透视投影
- [ ] 正交投影

#### Quaternion
- [ ] 基础运算
- [ ] 欧拉角转换
- [ ] 球面插值 (slerp)
- [ ] 旋转应用

### 3. 测试

- [ ] 为每个数学类型编写单元测试
- [ ] 确保运算精度

## 学习资源

- 3Blue1Brown 线性代数本质
- GAMES104 Week 1-2
- gl-matrix 源码参考

## 交付物

- `@nova/math` 包
- 完整的单元测试
- 数学类型使用文档

## 验证标准

```typescript
// 示例验证代码
import { Vec2, Vec3, Mat4, Quaternion } from '@nova/math';

const v1 = new Vec2(3, 4);
console.log(v1.length()); // 5

const m = Mat4.identity();
m.translate(10, 0, 0);
m.rotateY(Math.PI / 4);

const q = Quaternion.fromEuler(0, Math.PI, 0);
```

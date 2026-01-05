# Reading 3: AI Native PRD in Action
# AI 原生 PRD 撰写实战

> **Week 3 Reading #3**
> **主题**: 掌握面向 AI Agent 的产品需求文档撰写方法
> **预计阅读时间**: 60-90 分钟

---

## 📚 导读

AI 原生 PRD（Product Requirements Document）是专门为 AI Agent 设计的需求文档。与传统 PRD 不同，它包含所有必要的上下文，让 AI 能够直接理解并执行开发任务。本文将帮助你：

1. **理解 PRD 的演进** - 从传统 PRD 到 AI 原生 PRD
2. **掌握核心结构** - AI 原生 PRD 的八大要素
3. **学习实战技巧** - 具体的撰写方法和模板
4. **实战案例分析** - 完整的 PRD 示例

---

## 🎯 学习目标

阅读完本文后，你应该能够：

- ✅ 理解传统 PRD 与 AI 原生 PRD 的区别
- ✅ 掌握 AI 原生 PRD 的核心结构
- ✅ 能够撰写高质量的 AI 原生 PRD
- ✅ 学会将需求转换为 AI 可理解的格式
- ✅ 掌握 PRD 驱动的 AI 开发流程

---

## 第一部分：PRD 的演进

### 传统 PRD 的问题

#### 场景对比

```markdown
# 传统 PRD 开发流程

Day 1: 产品经理写 PRD
"实现用户评论功能"

Day 2: 开发者阅读 PRD
"需求不够详细..."
- 需要哪些字段？
- 评论权限如何控制？
- 如何处理敏感词？

Day 3: 会议讨论
"补充需求细节..."

Day 4-5: 开发实现
（边开发边确认）

Day 6: 测试发现遗漏
"没有考虑评论审核..."

Day 7: 修改和补充
（返工）

问题:
- 需求不完整
- 沟通成本高
- 开发效率低
- 容易返工
```

```markdown
# AI 原生 PRD 开发流程

Day 1: 产品经理写 AI 原生 PRD
"实现用户评论功能（包含所有细节）"

Day 2-3: AI Agent 实现
@PRD.md @docs/architecture.md
"根据 PRD 实现评论功能"

AI Agent:
1. 分析 PRD
2. 设计数据模型
3. 实现 API
4. 实现 UI
5. 编写测试
6. 生成文档

Day 4: 人工审查
（检查实现是否符合预期）

Day 5: 部署上线

优势:
- 需求完整
- 无需反复沟通
- 快速迭代
- 质量可控
```

### 对比分析

| 维度 | 传统 PRD | AI 原生 PRD |
|------|---------|------------|
| **目标读者** | 人类开发者 | AI Agent |
| **详细程度** | 概念性 | 完全详细 |
| **上下文** | 依赖口头补充 | 包含所有上下文 |
| **可执行性** | 需要解读 | 可直接执行 |
| **维护成本** | 高 | 中 |
| **开发效率** | 低 | 高 |

---

## 第二部分：AI 原生 PRD 的八大要素

### 要素 1: 功能概述

#### 目标

**清晰描述要解决的问题和目标**

```markdown
# 示例: 用户评论功能

## 问题背景
当前博客平台缺乏用户互动功能，读者无法对文章发表评论，
导致用户参与度低，社区活跃度不足。

## 功能目标
实现用户评论系统，允许注册用户对文章发表评论，
提升用户参与度和社区活跃度。

## 成功指标
- 文章评论率达到 5%（评论数/阅读数）
- 用户平均停留时间提升 30%
- 月活跃用户增长 20%
```

#### SMART 原则

```markdown
# 好的目标 vs 差的目标

❌ 差的目标:
"提升用户体验"

问题: 模糊，无法衡量

✅ 好的目标:
"在 3 个月内，将用户平均会话时长从 5 分钟提升到 7 分钟"

符合 SMART:
- Specific（具体）: 会话时长
- Measurable（可衡量）: 5 → 7 分钟
- Achievable（可实现）: 40% 增长合理
- Relevant（相关）: 提升用户体验
- Time-bound（有时限）: 3 个月
```

### 要素 2: 用户故事

#### 目标用户画像

```markdown
# 用户画像

## 画像 1: 评论者 Alice

**基本信息:**
- 年龄: 28 岁
- 职业: 软件工程师
- 技术水平: 高

**使用场景:**
- 阅读技术文章后想分享见解
- 希望与作者和读者讨论
- 需要代码格式化支持

**痛点:**
- 当前无法发表评论
- 无法看到他人评论
- 无法回复讨论

**期望:**
- Markdown 支持
- 代码高亮
- 实时预览

## 画像 2: 博客作者 Bob

**基本信息:**
- 年龄: 35 岁
- 职业: 技术博主
- 技术水平: 中

**使用场景:**
- 需要管理文章评论
- 希望回复读者问题
- 需要审核不当内容

**痛点:**
- 缺少与读者互动渠道
- 无法了解读者反馈

**期望:**
- 评论审核功能
- 评论通知
- 数据统计
```

#### 使用场景

```markdown
# 主要场景

## 场景 1: 发表评论

**前置条件:**
- 用户已登录
- 正在浏览文章详情页

**操作流程:**
1. 滚动到文章底部评论区
2. 在评论输入框输入内容（支持 Markdown）
3. 实时预览评论效果
4. 点击"发布评论"按钮
5. 系统验证内容
6. 评论发布成功
7. 页面更新显示新评论

**后置条件:**
- 评论保存到数据库
- 作者收到通知
- 评论数 +1

**异常处理:**
- 未登录: 跳转到登录页
- 内容为空: 显示错误提示
- 敏感词: 提示修改
- 网络错误: 保存草稿
```

### 要素 3: 功能需求

#### 核心功能

```markdown
# 功能 1: 发表评论

**输入:**
- articleId: 文章 ID（string, required）
- content: 评论内容（string, required, max 5000 字符）
- parentId: 父评论 ID（string, optional, 用于回复）

**处理逻辑:**
1. 验证用户登录状态
2. 验证文章是否存在
3. 验证评论内容:
   - 长度检查（1-5000 字符）
   - 敏感词过滤
   - XSS 防护
4. 如果是回复，验证父评论存在
5. 保存到数据库:
   - id: UUID
   - articleId
   - userId
   - content（Markdown 格式）
   - parentId（可选）
   - status: 'pending' | 'approved' | 'rejected'
   - createdAt
   - updatedAt
6. 异步通知文章作者
7. 返回评论对象

**输出:**
```json
{
  "id": "comment-123",
  "articleId": "article-456",
  "user": {
    "id": "user-789",
    "name": "Alice",
    "avatar": "https://..."
  },
  "content": "Great article!",
  "contentHtml": "<p>Great article!</p>",
  "parentId": null,
  "status": "approved",
  "createdAt": "2025-01-05T10:30:00Z",
  "updatedAt": "2025-01-05T10:30:00Z",
  "replies": [],
  "replyCount": 0
}
```

**约束条件:**
- 性能: 响应时间 < 200ms
- 安全: 防止 SQL 注入、XSS 攻击
- 数据: 内容持久化，99.9% 可用性
```

#### 边界情况

```markdown
# 边界情况处理

## 情况 1: 评论权限
**规则:**
- 仅注册用户可评论
- 被封禁用户不可评论
- 文章作者可删除任何评论

**处理:**
```typescript
if (!user.isAuthenticated) {
  throw new UnauthorizedError('Please login to comment');
}

if (user.isBanned) {
  throw new ForbiddenError('Your account has been banned');
}
```

## 情况 2: 敏感词过滤
**规则:**
- 检测预定义敏感词列表
- 中英文混合检测
- 变体检测（如: $h!t）

**处理:**
```typescript
const sensitiveWords = ['spam', 'abuse', ...];
const containsSensitiveWord = sensitiveWords.some(word =>
  content.toLowerCase().includes(word.toLowerCase())
);

if (containsSensitiveWord) {
  // 自动标记为待审核
  comment.status = 'pending';
}
```

## 情况 3: 评论频率限制
**规则:**
- 每分钟最多 5 条评论
- 每小时最多 20 条评论

**处理:**
```typescript
const recentComments = await Comment.count({
  userId: user.id,
  createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
});

if (recentComments >= 5) {
  throw new RateLimitError('Too many comments, please try again later');
}
```

## 情况 4: 超长评论
**规则:**
- 最大 5000 字符

**处理:**
```typescript
if (content.length > 5000) {
  throw new ValidationError('Comment too long (max 5000 characters)');
}
```

## 情况 5: 回复深度限制
**规则:**
- 最多 3 层嵌套

**处理:**
```typescript
if (parentId) {
  const depth = await getCommentDepth(parentId);
  if (depth >= 3) {
    throw new ValidationError('Maximum reply depth exceeded');
  }
}
```
```

### 要素 4: 技术实现指导

#### 数据模型

```markdown
# 数据模型设计

## Comment 表

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

  -- 内容
  content TEXT NOT NULL,
  content_html TEXT NOT NULL,

  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- 'pending': 待审核
    -- 'approved': 已通过
    -- 'rejected': 已拒绝

  -- 元数据
  ip_address INET,
  user_agent TEXT,

  -- 时间戳
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- 索引
  INDEX idx_article_id (article_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 评论统计
CREATE TABLE comment_stats (
  article_id UUID PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
  comment_count INTEGER NOT NULL DEFAULT 0,
  last_comment_at TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 数据模型说明

**字段解释:**

- `id`: UUID，唯一标识
- `article_id`: 关联文章，级联删除
- `user_id`: 关联用户，级联删除
- `parent_id`: 父评论，用于回复
- `content`: Markdown 原文
- `content_html`: 渲染后的 HTML
- `status`: 审核状态
- `ip_address`: 保留 IP（用于反垃圾）
- `user_agent`: 用户代理

**关系:**
```
User 1:N Comment
Article 1:N Comment
Comment 1:N Comment (self-referential)
```
```

#### API 设计

```markdown
# API 端点设计

## 1. 创建评论

**端点:** `POST /api/articles/:articleId/comments`

**认证:** Required (Bearer Token)

**请求体:**
```json
{
  "content": "Great article! Thanks for sharing.",
  "parentId": "comment-123"  // 可选，回复时提供
}
```

**响应:** 201 Created
```json
{
  "success": true,
  "data": {
    "id": "comment-456",
    "content": "Great article! Thanks for sharing.",
    "contentHtml": "<p>Great article! Thanks for sharing.</p>",
    "user": {
      "id": "user-789",
      "name": "Alice",
      "avatar": "https://cdn.example.com/avatars/789.jpg"
    },
    "parentId": "comment-123",
    "status": "approved",
    "createdAt": "2025-01-05T10:30:00Z",
    "replies": []
  }
}
```

## 2. 获取文章评论

**端点:** `GET /api/articles/:articleId/comments`

**认证:** Optional

**查询参数:**
- `page`: 页码（默认: 1）
- `limit`: 每页数量（默认: 20, 最大: 100）
- `sort`: 排序方式（latest, popular）
- `parentId`: 父评论 ID（获取回复）

**示例:** `GET /api/articles/article-456/comments?page=1&limit=20&sort=latest`

**响应:** 200 OK
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "comment-123",
        "content": "Very helpful!",
        "contentHtml": "<p>Very helpful!</p>",
        "user": {
          "id": "user-789",
          "name": "Alice",
          "avatar": "https://..."
        },
        "status": "approved",
        "createdAt": "2025-01-05T10:00:00Z",
        "updatedAt": "2025-01-05T10:00:00Z",
        "likes": 5,
        "isLiked": false,
        "replies": [
          {
            "id": "comment-124",
            "content": "I agree!",
            "contentHtml": "<p>I agree!</p>",
            "user": {...},
            "status": "approved",
            "createdAt": "2025-01-05T10:05:00Z",
            "likes": 2
          }
        ],
        "replyCount": 1
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

## 3. 删除评论

**端点:** `DELETE /api/comments/:commentId`

**认证:** Required

**权限:**
- 评论作者
- 文章作者
- 管理员

**响应:** 204 No Content

## 4. 审核评论

**端点:** `PATCH /api/comments/:commentId/status`

**认证:** Required (Admin/Author)

**请求体:**
```json
{
  "status": "approved"  // 'approved' | 'rejected'
}
```

**响应:** 200 OK
```

### 要素 5: 交互设计

#### UI 设计

```markdown
# UI 设计规范

## 评论输入区

**位置:** 文章底部

**组件结构:**
```
<CommentInput>
  <UserAvatar />
  <Textarea
    placeholder="写下你的评论..."
    maxLength={5000}
    showCount
  />
  <Toolbar>
    <MarkdownGuide />
    <PreviewToggle />
  </Toolbar>
  <PreviewArea>
    {isPreview && <MarkdownRender content={content} />}
  </PreviewArea>
  <Actions>
    <CancelButton />
    <SubmitButton disabled={!content || submitting}>
      {submitting ? '发布中...' : '发布评论'}
    </SubmitButton>
  </Actions>
</CommentInput>
```

**交互规范:**
1. 输入框自动聚焦
2. 输入时实时字符计数
3. Ctrl/Cmd + Enter 提交
4. 提交中禁用按钮和输入框
5. 提交失败保留内容
6. 支持 Markdown 语法

## 评论列表

**显示规则:**
- 分页加载（每页 20 条）
- 默认按最新排序
- 支持按热门排序
- 回复缩进显示（最多 3 层）

**组件结构:**
```
<CommentList>
  <SortSelector
    options={['latest', 'popular']}
    value={sort}
    onChange={setSort}
  />
  <CommentGroup>
    {comments.map(comment => (
      <CommentItem key={comment.id}>
        <CommentHeader>
          <UserAvatar src={comment.user.avatar} />
          <UserInfo>
            <UserName>{comment.user.name}</UserName>
            <CommentTime>{formatTime(comment.createdAt)}</CommentTime>
          </UserInfo>
          <CommentMenu>
            <ReplyButton />
            <LikeButton />
            {canDelete && <DeleteButton />}
          </CommentMenu>
        </CommentHeader>
        <CommentBody>
          <MarkdownRender>{comment.contentHtml}</MarkdownRender>
        </CommentBody>
        {comment.replies.length > 0 && (
          <CommentReplies>
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} {...reply} isReply />
            ))}
          </CommentReplies>
        )}
      </CommentItem>
    ))}
  </CommentGroup>
  <Pagination {...pagination} />
</CommentList>
```

**视觉规范:**
```
字体:
- 用户名: 14px, medium
- 时间: 12px, regular, gray
- 内容: 15px, regular, leading 1.6

间距:
- 评论间距: 16px
- 内容边距: 12px 0
- 回复缩进: 48px

颜色:
- 背景色: #ffffff
- 边框色: #e5e7eb
- 主色: #3b82f6
- 文本色: #1f2937
- 次要文本: #6b7280
```
```

#### 状态管理

```markdown
# 状态管理设计

## Redux State Structure

```typescript
interface CommentsState {
  // 列表数据
  byArticleId: {
    [articleId: string]: {
      comments: Comment[];
      pagination: Pagination;
      loading: boolean;
      error: string | null;
    };
  };

  // 当前编辑
  editing: {
    articleId: string | null;
    parentId: string | null;
    content: string;
    isPreview: boolean;
    submitting: boolean;
  };

  // UI 状态
  ui: {
    sortBy: 'latest' | 'popular';
    expandedReplies: Set<string>;
  };
}

// Actions
interface CommentsActions {
  // 获取评论
  fetchComments(
    articleId: string,
    page: number,
    sort: 'latest' | 'popular'
  ): Promise<void>;

  // 创建评论
  createComment(
    articleId: string,
    content: string,
    parentId?: string
  ): Promise<Comment>;

  // 删除评论
  deleteComment(commentId: string): Promise<void>;

  // 更新编辑状态
  updateEditing(content: string): void;

  // 切换预览
  togglePreview(): void;

  // 展开/折叠回复
  toggleReplies(commentId: string): void;
}
```

## 数据流

```
用户操作
    ↓
Dispatch Action
    ↓
Reducer 更新 State
    ↓
Selector 计算派生数据
    ↓
Component Re-render
    ↓
UI 更新
```
```

### 要素 6: 数据模型

详细的数据模型已在要素 4 中展示，这里补充关系图：

```markdown
# 数据关系图

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────┐
│   Comment   │
└──────┬──────┘
       │ N
       │
       │ 1
┌──────▼──────┐
│   Article   │
└─────────────┘

Self-referential:
┌─────────────┐
│   Comment   │
└──────┬──────┘
       │ 1
       │ parent
       │ N
┌──────▼──────┐
│   Comment   │ (replies)
└─────────────┘
```
```

### 要素 7: 测试策略

```markdown
# 测试策略

## 单元测试

### 目标覆盖率: 85%+

### Service 层测试

```typescript
describe('CommentService', () => {
  describe('createComment', () => {
    it('should create comment successfully', async () => {
      const comment = await commentService.createComment({
        articleId: 'article-123',
        userId: 'user-456',
        content: 'Test comment'
      });

      expect(comment.id).toBeDefined();
      expect(comment.content).toBe('Test comment');
      expect(comment.status).toBe('pending');
    });

    it('should reject comment exceeding max length', async () => {
      await expect(
        commentService.createComment({
          articleId: 'article-123',
          userId: 'user-456',
          content: 'x'.repeat(5001)
        })
      ).rejects.toThrow('Comment too long');
    });

    it('should filter sensitive words', async () => {
      const comment = await commentService.createComment({
        articleId: 'article-123',
        userId: 'user-456',
        content: 'This is spam content'
      });

      expect(comment.status).toBe('pending');
    });

    it('should enforce rate limit', async () => {
      // Create 5 comments within 1 minute
      const promises = Array(5).fill(null).map(() =>
        commentService.createComment({
          articleId: 'article-123',
          userId: 'user-456',
          content: 'Test'
        })
      );

      await Promise.all(promises);

      // 6th comment should fail
      await expect(
        commentService.createComment({
          articleId: 'article-123',
          userId: 'user-456',
          content: 'Test'
        })
      ).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('deleteComment', () => {
    it('should allow author to delete comment', async () => {
      const comment = await createTestComment({
        userId: 'user-123'
      });

      await commentService.deleteComment(comment.id, 'user-123');

      const deleted = await Comment.findById(comment.id);
      expect(deleted).toBeNull();
    });

    it('should not allow non-author to delete', async () => {
      const comment = await createTestComment({
        userId: 'user-123'
      });

      await expect(
        commentService.deleteComment(comment.id, 'user-456')
      ).rejects.toThrow('Forbidden');
    });
  });
});
```

## 集成测试

```typescript
describe('Comment API Integration', () => {
  describe('POST /api/articles/:articleId/comments', () => {
    it('should create comment', async () => {
      const response = await request(app)
        .post('/api/articles/article-123/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'Great article!'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.content).toBe('Great article!');
      expect(response.body.data.user.id).toBe(userId);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app)
        .post('/api/articles/article-123/comments')
        .send({
          content: 'Test'
        });

      expect(response.status).toBe(401);
    });

    it('should validate content length', async () => {
      const response = await request(app)
        .post('/api/articles/article-123/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          content: 'x'.repeat(5001)
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

## E2E 测试

```typescript
describe('Comment E2E', () => {
  it('should complete comment flow', async () => {
    // 1. 登录
    await page.goto('/login');
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // 2. 导航到文章
    await page.goto('/articles/article-123');

    // 3. 滚动到评论区
    await page.evaluate(() => {
      document.querySelector('.comment-section').scrollIntoView();
    });

    // 4. 输入评论
    await page.fill('textarea[name="content"]', 'Great article!');

    // 5. 提交评论
    await page.click('button[type="submit"]');

    // 6. 验证评论显示
    const comment = await page.waitForSelector('.comment-item');
    const text = await comment.evaluate(el => el.textContent);
    expect(text).toContain('Great article!');
  });
});
```

## 性能测试

```typescript
describe('Performance', () => {
  it('should handle 100 concurrent comments', async () => {
    const start = Date.now();

    await Promise.all(
      Array(100).fill(null).map((_, i) =>
        commentService.createComment({
          articleId: 'article-123',
          userId: `user-${i}`,
          content: `Comment ${i}`
        })
      )
    );

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // < 5s
  });

  it('should load 1000 comments in < 1s', async () => {
    await createTestComments(1000);

    const start = Date.now();
    const comments = await commentService.getComments('article-123', {
      page: 1,
      limit: 100
    });
    const duration = Date.now() - start;

    expect(comments).toHaveLength(100);
    expect(duration).toBeLessThan(1000);
  });
});
```
```

### 要素 8: AI 开发指导

```markdown
# AI Agent 开发指导

## 开发步骤

### Step 1: 分析需求
@README.md @docs/architecture.md @PRD.md
"理解评论功能的整体需求和架构"

### Step 2: 设计数据模型
@src/models/
"基于 PRD 的数据模型设计，创建 Prisma schema"

### Step 3: 实现 Service 层
@src/services/comment.service.ts
"实现评论业务逻辑:
- createComment
- getComments
- deleteComment
- approveComment
- rejectComment

包含:
- 输入验证
- 敏感词过滤
- 频率限制
- 权限检查"

### Step 4: 实现 API 端点
@src/controllers/comment.controller.ts
@src/routes/comment.routes.ts
"实现 REST API 端点:
- POST /api/articles/:articleId/comments
- GET /api/articles/:articleId/comments
- DELETE /api/comments/:id
- PATCH /api/comments/:id/status"

### Step 5: 实现前端组件
@src/frontend/components/comments/
"创建 React 组件:
- CommentInput.tsx
- CommentList.tsx
- CommentItem.tsx
- CommentForm.tsx

使用:
- Material-UI 组件
- React Markdown 渲染
- Redux Toolkit 状态管理"

### Step 6: 实现 Redux 逻辑
@src/frontend/store/slices/commentSlice.ts
"实现评论状态管理:
- fetchComments
- createComment
- deleteComment
- updateEditing"

### Step 7: 编写测试
@tests/unit/comment.service.test.ts
@tests/integration/comment.api.test.ts
"编写单元测试和集成测试，覆盖率 > 85%"

### Step 8: 运行和验证
"运行所有测试，确保通过:
pnpm test

检查覆盖率:
pnpm test:coverage"

### Step 9: 生成文档
@docs/features/comments.md
"生成功能文档，包括:
- 功能概述
- API 使用说明
- 组件使用示例
- 配置说明"

## 验收标准

### 功能验收
- [ ] 用户可以发表评论
- [ ] 评论支持 Markdown
- [ ] 评论支持回复（最多 3 层）
- [ ] 敏感词自动过滤
- [ ] 频率限制生效
- [ ] 文章作者可删除评论
- [ ] 支持评论审核
- [ ] 评论通知发送

### 技术验收
- [ ] 所有测试通过（> 85% 覆盖率）
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] API 响应时间 < 200ms (P95)
- [ ] 前端性能得分 > 90

### 文档验收
- [ ] API 文档完整
- [ ] 组件使用文档完整
- [ ] 代码注释充分
- [ ] README 已更新

## 常见提示词模板

### 创建功能
```
基于 @PRD.md 实现评论功能:
1. 数据模型（Prisma）
2. Service 层业务逻辑
3. API 端点
4. 前端组件
5. 状态管理
6. 测试用例

要求:
- 遵循项目架构
- 符合代码规范
- 完整错误处理
- 85%+ 测试覆盖率
```

### 修复 Bug
```
修复评论功能 Bug:
@error.log @src/services/comment.service.ts

错误信息: [复制完整错误]

复现步骤:
1. [步骤 1]
2. [步骤 2]

请:
1. 分析根本原因
2. 提供修复方案
3. 实施修复
4. 添加预防性测试
5. 验证无回归
```

### 优化性能
```
优化评论列表性能:
@src/services/comment.service.ts @src/frontend/components/CommentList.tsx

当前问题:
- 加载 100 条评论需要 2 秒
- 滚动有卡顿

优化目标:
- 加载时间 < 500ms
- 滚动流畅（60fps）

请:
1. 分析性能瓶颈
2. 提出优化方案
3. 实施优化
4. 性能测试验证
```
```

---

## 第三部分：完整 PRD 示例

### 示例: 用户认证功能

```markdown
# PRD: 用户认证功能

## 1. 功能概述

### 问题
当前系统缺少用户认证机制，无法实现用户管理和个性化功能。

### 目标
实现完整的用户认证系统，包括注册、登录、登出、密码找回等功能。

### 成功指标
- 注册转化率 > 60%（访问注册页 / 完成注册）
- 登录成功率 > 95%
- 平均登录时间 < 2 秒
- 密码找回成功率 > 80%

## 2. 用户故事

### 画像 1: 新用户 Alice
**场景:**
- 首次访问网站
- 希望快速注册账号
- 担心密码安全

**期望:**
- 简单的注册流程
- 密码强度提示
- 邮箱验证

### 画像 2: 回访用户 Bob
**场景:**
- 已注册用户
- 希望快速登录
- 可能忘记密码

**期望:**
- 记住登录状态
- 快速登录（支持社交登录）
- 密码找回功能

## 3. 功能需求

### 3.1 用户注册

**输入:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**验证规则:**
- 邮箱格式：标准 email 格式
- 邮箱唯一：不允许重复注册
- 密码强度：
  - 最少 8 字符
  - 包含大小写字母
  - 包含数字
  - 包含特殊字符
- 姓名：2-50 字符

**处理流程:**
1. 验证输入格式
2. 检查邮箱是否已存在
3. 密码加密（bcrypt, salt rounds: 10）
4. 创建用户记录
5. 生成邮箱验证 token
6. 发送验证邮件
7. 返回用户对象（不含敏感信息）

**输出:**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": false,
    "createdAt": "2025-01-05T10:30:00Z"
  },
  "message": "Registration successful. Please check your email to verify your account."
}
```

### 3.2 用户登录

**输入:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**处理流程:**
1. 验证输入格式
2. 查询用户记录
3. 验证密码
4. 检查账号状态（是否被封禁）
5. 生成 JWT tokens:
   - Access token (15 分钟)
   - Refresh token (7 天)
6. 记录登录日志（IP, 时间）
7. 返回 tokens 和用户信息

**输出:**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": "https://cdn.example.com/avatars/123.jpg"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

### 3.3 刷新 Token

**输入:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**处理流程:**
1. 验证 refresh token
2. 检查 token 是否在黑名单
3. 生成新的 access token
4. （可选）轮换 refresh token
5. 返回新 token

**输出:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

### 3.4 密码找回

**输入:**
```json
{
  "email": "user@example.com"
}
```

**处理流程:**
1. 验证邮箱格式
2. 查询用户（不管是否存在，都返回成功，防止邮箱枚举）
3. 生成重置 token（UUID，有效期 1 小时）
4. 保存到数据库
5. 发送密码重置邮件
6. 返回成功消息

**邮件内容:**
```
Subject: Reset Your Password

Hi John,

We received a request to reset your password. Click the link below to reset it:

https://example.com/reset-password?token=abc123...

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best,
The Team
```

**输出:**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

### 3.5 重置密码

**输入:**
```json
{
  "token": "abc123...",
  "newPassword": "NewSecurePass456!"
}
```

**处理流程:**
1. 验证 token 有效性
2. 检查 token 是否过期
3. 验证新密码强度
4. 更新密码
5. 使 token 失效
6. 使所有现有 refresh tokens 失效
7. 发送密码已更改通知邮件
8. 返回成功消息

**输出:**
```json
{
  "message": "Password has been reset successfully. Please login with your new password."
}
```

## 4. 技术实现

### 数据模型

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  avatar        String?
  isVerified    Boolean   @default(false)
  isBanned      Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sessions      Session[]
  passwordResets PasswordReset[]
  loginLogs     LoginLog[]

  @@index([email])
  @@index([isVerified])
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([refreshToken])
}

model PasswordReset {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@index([expiresAt])
}

model LoginLog {
  id        String   @id @default(uuid())
  userId    String
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}
```

### API 端点

```typescript
// POST /api/auth/register
// POST /api/auth/login
// POST /api/auth/logout
// POST /api/auth/refresh
// POST /api/auth/forgot-password
// POST /api/auth/reset-password
// GET /api/auth/verify-email?token=xxx
```

## 5. 安全考虑

### 密码安全
- 使用 bcrypt 加密（salt rounds: 10）
- 密码强度验证
- 防止常见密码（password, 123456等）

### Token 安全
- Access token 短期有效（15 分钟）
- Refresh token 长期有效（7 天）
- Token 支持撤销（黑名单机制）
- HTTPS 传输

### 防止暴力破解
- 登录失败 5 次后锁定账号 15 分钟
- IP 限流（每分钟 10 次尝试）
- 验证码（3 次失败后）

### 会话管理
- 支持多设备登录
- 可撤销特定设备
- 异常登录检测（IP 变化）

## 6. 测试策略

### 单元测试
- 密码加密验证
- Token 生成和验证
- 邮箱格式验证
- 密码强度检查

### 集成测试
- 注册流程
- 登录流程
- 密码找回流程
- Token 刷新流程

### E2E 测试
- 完整注册流程
- 完整登录流程
- 密码找回流程

### 安全测试
- SQL 注入测试
- XSS 攻击测试
- CSRF 攻击测试
- 暴力破解测试

## 7. AI 开发指导

### 开发顺序
1. 数据模型（Prisma）
2. Service 层（业务逻辑）
3. API 端点（控制器）
4. 前端组件（登录表单、注册表单）
5. 状态管理（Redux）
6. 测试用例

### 关键提示词
```
@PRD.md @docs/architecture.md
实现用户认证功能：
1. 创建 Prisma 数据模型
2. 实现 AuthService（注册、登录、密码找回）
3. 实现 AuthController（REST API）
4. 创建 React 组件（LoginForm, RegisterForm）
5. 实现 Redux 状态管理
6. 编写完整测试（覆盖率 > 85%）

安全要求：
- 密码 bcrypt 加密
- JWT token 认证
- 防止暴力破解
- 邮箱验证
```

## 8. 验收标准

### 功能验收
- [ ] 用户可以注册
- [ ] 邮箱验证流程正常
- [ ] 用户可以登录
- [ ] Token 刷新正常
- [ ] 密码找回流程正常
- [ ] 用户可以登出

### 安全验收
- [ ] 密码加密存储
- [ ] Token 过期机制
- [ ] 防止暴力破解
- [ ] HTTPS 传输
- [ ] SQL 注入防护
- [ ] XSS 防护

### 性能验收
- [ ] 登录响应时间 < 500ms (P95)
- [ ] 注册响应时间 < 1s (P95)
- [ ] 支持并发 100 注册/秒

### 文档验收
- [ ] API 文档完整
- [ ] 安全文档
- [ ] 部署文档
```

---

## 📊 知识检查

### 自我评估

1. **传统 PRD 和 AI 原生 PRD 的核心区别是什么？**

2. **AI 原生 PRD 的八大要素分别是什么？为什么每个都很重要？**

3. **如何将模糊的需求转化为 AI 可理解的详细需求？**

4. **在撰写功能需求时，如何确保完整性？**

5. **如何利用 AI 原生 PRD 驱动开发流程？**

---

## 🎯 实践建议

### PRD 撰写流程

```
Step 1: 需求收集
- 与产品经理讨论
- 收集用户反馈
- 分析竞品

Step 2: 撰写 PRD
- 填写八大要素
- 详细描述功能
- 补充边界情况

Step 3: PRD 评审
- 团队评审
- 识别遗漏
- 完善细节

Step 4: AI 实现
- 提供给 AI Agent
- 监控开发过程
- 验证实现质量

Step 5: 测试验收
- 功能测试
- 安全测试
- 性能测试

Step 6: 文档更新
- 更新 API 文档
- 更新用户手册
- 更新 CHANGELOG
```

### 常见陷阱

```markdown
# ❌ 避免这些错误

1. 需求过于模糊
   "优化性能" → "加载时间从 2s 优化到 < 500ms"

2. 缺少边界情况
   只考虑正常流程，不考虑异常

3. 技术实现不具体
   "使用加密" → "使用 bcrypt，salt rounds: 10"

4. 缺少验收标准
   无法判断是否完成

5. 忽视安全
   没有考虑认证、授权、数据保护

# ✅ 遵循这些原则

1. SMART 目标
2. 完整的用户故事
3. 详细的边界情况
4. 具体的技术方案
5. 明确的验收标准
6. 安全性优先
7. 可测试性
```

---

## 📚 延伸阅读

### 最佳实践

1. [Writing Great PRDs](https://www.productplan.com/learn/how-to-write-a-prd/)
2. [AI-First Development](https://www.anthropic.com/index/claude-code)
3. [User Story Mapping](https://www.atlassian.com/agile/project-management/user-stories)

### 模板资源

1. [PRD Template](https://docs.google.com/document/d/1R5WI2V4n6r3c2dX8kK0M/edit)
2. [API Specification](https://swagger.io/specification/)
3. [User Story Template](https://www.atlassian.com/software/confluence/templates/user-story)

---

**课程总结**: 现在你已经掌握了 AI IDE 的核心技能！下周我们将进入实战阶段，使用这些技能完成一个完整的功能开发。

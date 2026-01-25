# Reading 2: Vercel AI SDK and Multi-stack Development
# Vercel AI SDK 与多栈开发实战

> **Week 8 Reading #2**
> **主题**: 深入掌握 Vercel AI SDK 和多技术栈的 AI 应用开发
> **预计阅读时间**: 60-90 分钟

---

## 📚 导读

Vercel AI SDK 是构建 AI 原生应用的强大工具，它支持多种技术栈，提供了流式响应、工具调用等高级功能。本文全面介绍 Vercel AI SDK 的实战应用，帮助你：

1. **掌握核心** - Vercel AI SDK 的核心功能和 API
2. **多栈支持** - 在不同框架中使用 AI SDK
3. **高级特性** - 流式响应、工具调用、多模态
4. **实战项目** - 构建完整的 AI 应用

---

## 🎯 学习目标

阅读完本文后，你应该能够：

- ✅ 熟练使用 Vercel AI SDK 的核心 API
- ✅ 在多个技术栈中集成 AI 能力
- ✅ 实现流式响应和工具调用
- ✅ 构建生产级别的 AI 应用
- ✅ 部署和优化 AI 应用

---

## 第一部分：Vercel AI SDK 核心概念

### 1. 架构概览

```
┌─────────────────────────────────────────┐
│          应用层 (Framework)              │
│  React / Vue / Svelte / Next.js / Nuxt  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         AI SDK 层                       │
│  - useChat()                            │
│  - useCompletion()                      │
│  - streamText()                         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      AI 模型层 (Provider)               │
│  - OpenAI (GPT-4, GPT-3.5)             │
│  - Anthropic (Claude)                   │
│  - Google (Gemini)                      │
│  - Mistral                              │
└─────────────────────────────────────────┘
```

### 2. 核心组件

```typescript
// 核心组件关系图

AI SDK
├── Hooks (React)
│   ├── useChat()         - 聊天界面
│   ├── useCompletion()   - 文本补全
│   └── useAssistant()    - AI 助手
│
├── API Routes
│   ├── streamText()      - 流式文本
│   ├── streamObject()    - 流式对象
│   └── generateText()    - 生成文本
│
├── Tools
│   ├── Tool Call         - 工具调用
│   └── Function Calling  - 函数调用
│
└── Providers
    ├── openai           - OpenAI
    ├── anthropic        - Anthropic
    ├── google           - Google
    └── mistral          - Mistral AI
```

---

## 第二部分：核心 API 详解

### 1. useChat Hook

#### 基础用法

```typescript
import { useChat } from 'ai/react'

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <div>
      {/* 消息列表 */}
      {messages.map(message => (
        <div key={message.id}>
          <strong>{message.role}:</strong>
          <p>{message.content}</p>
        </div>
      ))}

      {/* 输入表单 */}
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="输入消息..."
        />
        <button type="submit">发送</button>
      </form>
    </div>
  )
}
```

#### 高级配置

```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
  // API 端点
  api: '/api/chat',

  // 初始消息
  initialMessages: [
    {
      id: '1',
      role: 'system',
      content: '你是一个有帮助的助手'
    }
  ],

  // 请求前的回调
  onRequest: async (messages) => {
    console.log('发送消息:', messages)
  },

  // 响应完成的回调
  onResponse: (response) => {
    console.log('响应状态:', response.status)
  },

  // 完成的回调
  onFinish: (message) => {
    console.log('消息完成:', message)
  },

  // 错误处理
  onError: (error) => {
    console.error('聊天错误:', error)
  },

  // 额外的请求头
  headers: {
    'X-Custom-Header': 'value'
  },

  // 额外的请求体
  body: {
    userId: '123'
  }
})
```

### 2. useCompletion Hook

```typescript
import { useCompletion } from 'ai/react'

export default function Completion() {
  const {
    completion,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error
  } = useCompletion({
    api: '/api/completion'
  })

  return (
    <div>
      <textarea
        value={input}
        onChange={handleInputChange}
        placeholder="输入提示词..."
      />

      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? '生成中...' : '生成'}
      </button>

      {error && <div className="error">{error.message}</div>}

      <div className="result">
        <strong>生成结果:</strong>
        <p>{completion}</p>
      </div>
    </div>
  )
}
```

### 3. 服务端 API

#### streamText

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const stream = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    temperature: 0.7,
    maxTokens: 1000,
  })

  return stream.toAIStreamResponse()
}
```

#### generateText

```typescript
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const { text } = await generateText({
    model: openai('gpt-4'),
    prompt,
    temperature: 0.7,
  })

  return Response.json({ text })
}
```

---

## 第三部分：多技术栈支持

### 1. Next.js (React)

#### App Router 集成

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4'),
    messages,
  })

  return result.toDataStreamResponse()
}

// app/page.tsx
'use client'

import { useChat } from 'ai/react'

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()

  return (
    <main>
      {messages.map(m => (
        <div key={m.id}>
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button>Send</button>
      </form>
    </main>
  )
}
```

### 2. Vue (Nuxt)

```vue
<!-- composables/useChat.ts -->
import { useChat as useAiChat } from 'ai/vue'

export function useChat() {
  const { messages, input, handleSubmit, isLoading } = useAiChat({
    api: '/api/chat'
  })

  return {
    messages,
    input,
    handleSubmit,
    isLoading
  }
}

<!-- components/Chat.vue -->
<template>
  <div>
    <div v-for="message in messages" :key="message.id">
      <strong>{{ message.role }}:</strong>
      <p>{{ message.content }}</p>
    </div>

    <form @submit="handleSubmit">
      <input v-model="input" />
      <button :disabled="isLoading">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useChat } from '@/composables/useChat'

const { messages, input, handleSubmit, isLoading } = useChat()
</script>
```

### 3. Svelte (SvelteKit)

```svelte
<!-- routes/api/chat/+server.ts -->
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
  const { messages } = await request.json()

  const stream = await streamText({
    model: openai('gpt-4'),
    messages,
  })

  return new Response(stream.toDataStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
    },
  })
}

<!-- routes/+page.svelte -->
<script lang="ts">
  import { useChat } from 'ai/svelte'

  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/api/chat'
  })
</script>

<main>
  {#each $messages as message}
    <div>
      <strong>{message.role}:</strong>
      <p>{message.content}</p>
    </div>
  {/each}

  <form on:submit={handleSubmit}>
    <input bind:value={$input} />
    <button disabled={$isLoading}>Send</button>
  </form>
</main>
```

### 4. 其他框架

```typescript
// 原生 JavaScript/TypeScript
import { useChat } from 'ai/react'

// 也可以在 Vanilla JS 中使用
```

---

## 第四部分：高级特性

### 1. 工具调用 (Tool Calling)

#### 定义工具

```typescript
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

// 定义工具
const tools = {
  weather: {
    description: '获取天气信息',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: '城市名称'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: '温度单位'
        }
      },
      required: ['location']
    },
    execute: async ({ location, unit = 'celsius' }) => {
      // 调用天气 API
      const response = await fetch(
        `https://api.weather.com/?location=${location}&unit=${unit}`
      )
      return response.json()
    }
  },

  time: {
    description: '获取当前时间',
    parameters: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: '时区，如 Asia/Shanghai'
        }
      }
    },
    execute: async ({ timezone = 'UTC' }) => {
      return new Date().toLocaleString('zh-CN', { timeZone: timezone })
    }
  }
}

// 使用工具
export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4'),
    messages,
    tools,
  })

  return result.toAIStreamResponse()
}
```

### 2. 多模态支持

```typescript
import { openai } from '@ai-sdk/openai'

export async function POST(req: Request) {
  const { prompt, image } = await req.json()

  const result = await generateText({
    model: openai('gpt-4-vision-preview'),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', image: image } // base64 或 URL
        ]
      }
    ]
  })

  return Response.json({ text: result.text })
}
```

### 3. 流式 UI 更新

```typescript
'use client'

import { useChat } from 'ai/react'
import { useState } from 'react'

export default function StreamingChat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat()
  const [streamedContent, setStreamedContent] = useState('')

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          {message.role === 'assistant' && (
            <div>
              <p>{message.content}</p>
              {/* 实时流式更新 */}
              {message.content === streamedContent && (
                <span className="cursor">|</span>
              )}
            </div>
          )}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="输入消息..."
        />
      </form>
    </div>
  )
}
```

---

## 第五部分：实战项目

### 项目: AI 客服助手

#### 功能需求

```markdown
1. 智能对话
   - 上下文记忆
   - 多轮对话
   - 情感理解

2. 知识库集成
   - 产品信息查询
   - 常见问题解答
   - 订单查询

3. 人工转接
   - 自动判断复杂问题
   - 人工客服对接
   - 对话历史同步

4. 多渠道支持
   - Web 聊天
   - 移动应用
   - 社交媒体
```

#### 实现代码

```typescript
// lib/ai-knowledge-base.ts
const knowledgeBase = {
  products: [
    {
      id: '1',
      name: '产品 A',
      description: '...',
      price: 99.99
    }
    // ...
  ],

  faqs: [
    {
      question: '如何退款？',
      answer: '您可以在订单页面申请退款...'
    }
    // ...
  ]
}

// 查找工具
const searchTools = {
  searchProducts: {
    description: '搜索产品信息',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' }
      }
    },
    execute: async ({ query }) => {
      return knowledgeBase.products.filter(p =>
        p.name.includes(query) || p.description.includes(query)
      )
    }
  },

  searchFAQ: {
    description: '搜索常见问题',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' }
      }
    },
    execute: async ({ query }) => {
      return knowledgeBase.faqs.filter(faq =>
        faq.question.includes(query)
      )
    }
  }
}

// app/api/customer-service/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4'),
    system: `你是一个专业的客服助手。
    你可以：
    1. 回答常见问题
    2. 查询产品信息
    3. 协助订单处理
    4. 在必要时转接人工客服`,

    messages,
    tools: searchTools,
  })

  return result.toAIStreamResponse()
}
```

---

## 第六部分：部署和优化

### 1. Vercel 部署

```bash
# 1. 安装依赖
npm install ai @ai-sdk/openai

# 2. 配置环境变量
# .env.local
OPENAI_API_KEY=sk-...

# 3. 部署
vercel

# 或使用 GitHub 集成自动部署
git push origin main
```

### 2. 性能优化

```typescript
// 使用流式响应减少延迟
const stream = await streamText({
  model: openai('gpt-4'),
  messages,
  // 减少最大 token 数
  maxTokens: 500,
  // 降低温度以加快响应
  temperature: 0.5,
})

// 使用缓存
const cached = await cache.get(`chat:${userId}`)
if (cached) {
  return Response.json(cached)
}

// 使用 Edge Runtime
export const runtime = 'edge'
```

---

## 📊 知识检查

1. **Vercel AI SDK 的核心组件有哪些？**

2. **如何在不同技术栈中使用 AI SDK？**

3. **如何实现工具调用？**

4. **如何优化 AI 应用的性能？**

---

## 📚 延伸阅读

1. [Vercel AI SDK 文档](https://sdk.vercel.ai)
2. [Next.js AI 文档](https://nextjs.org/docs/app/building-your-application/configuring/ai)
3. [AI Recipes](https://sdk.vercel.ai/docs/ai-sdk/ui/recipes)

---

**课程总结**: Vercel AI SDK 是构建现代 AI 应用的强大工具。通过掌握其核心 API 和多技术栈支持，你可以快速构建生产级别的 AI 应用。

**下一步**: 构建你自己的 AI 应用！

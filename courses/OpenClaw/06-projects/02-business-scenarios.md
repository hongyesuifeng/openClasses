# 第十九讲：实战项目 - 企业场景应用

> 项目实战：企业级 OpenClaw 应用

## 项目目标

本章将介绍 OpenClaw 在企业场景中的应用，包括智能客服、工作流自动化、知识库等。

---

## 1. 企业应用概述

### 1.1 典型场景

```
企业 AI 应用场景
────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────┐
│                                                     │
│  智能客服                                           │
│  • 7×24 小时自动应答                               │
│  • 多渠道接入（飞书、钉钉、微信）                   │
│  • 工单自动创建                                    │
│                                                     │
│  工作流自动化                                       │
│  • 审批流程                                        │
│  • 报表生成                                        │
│  • 数据同步                                        │
│                                                     │
│  知识管理                                           │
│  • 企业知识库                                      │
│  • 文档问答                                        │
│  • 智能搜索                                        │
│                                                     │
│  运维助手                                           │
│  • 监控告警                                        │
│  • 故障诊断                                        │
│  • 自动修复                                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 1.2 企业版架构

```
企业版架构
────────────────────────────────────────────────────────

                    ┌─────────────┐
                    │   负载均衡   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │OpenClaw │       │OpenClaw │       │OpenClaw │
   │ Node 1  │       │ Node 2  │       │ Node 3  │
   └─────────┘       └─────────┘       └─────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ↓                  ↓                  ↓
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │PostgreSQL│      │ Redis   │       │Milvus   │
   │ 主数据库 │      │ 缓存    │       │向量存储  │
   └─────────┘       └─────────┘       └─────────┘
```

---

## 2. 智能客服系统

### 2.1 系统设计

```
智能客服流程
────────────────────────────────────────────────────────

用户消息
    │
    ↓
┌─────────────────┐
│ 意图识别        │
│ • 咨询/投诉/建议│
│ • 订单/售后    │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
简单问题   复杂问题
    │         │
    ↓         ↓
┌─────────┐ ┌─────────┐
│知识库    │ │人工客服  │
│自动回答  │ │转接     │
└─────────┘ └─────────┘
    │
    ↓
┌─────────┐
│满意度   │
│调查     │
└─────────┘
```

### 2.2 客服 Skill

```markdown
# skills/customer_service/SKILL.md

# 智能客服

## 描述
处理客户咨询、投诉、建议等

## 触发条件
当用户：
- 咨询产品/服务问题
- 提交投诉或建议
- 查询订单状态
- 申请售后服务

## 输入参数

### intent
- 类型: string
- 枚举: [inquiry, complaint, suggestion, order_query, after_sale]
- 描述: 意图类型

### content
- 类型: string
- 描述: 用户消息内容

### user_id
- 类型: string
- 描述: 用户标识

### order_id
- 类型: string
- 描述: 订单号（可选）

## 执行
```bash
python ${SKILL_DIR}/customer_service.py \
  --intent "${intent}" \
  --content "${content}" \
  --user-id "${user_id}" \
  --order-id "${order_id:-}" \
  --db "${OPENCLAW_DIR}/data/db/customer_service.db"
```

## 知识库
使用向量数据库存储产品知识、常见问题等
```

### 2.3 知识库集成

```python
# skills/customer_service/knowledge_base.py

from typing import List
import chromadb

class KnowledgeBase:
    """企业知识库"""

    def __init__(self, persist_dir: str):
        self.client = chromadb.PersistentClient(path=persist_dir)
        self.collection = self.client.get_or_create_collection(
            name="knowledge",
            metadata={"hnsw:space": "cosine"}
        )

    def add_document(self, doc_id: str, content: str, metadata: dict = None):
        """添加文档"""
        self.collection.add(
            ids=[doc_id],
            documents=[content],
            metadatas=[metadata] if metadata else None
        )

    def search(self, query: str, n_results: int = 5) -> List[dict]:
        """搜索相关文档"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )

        return [
            {
                "id": results["ids"][0][i],
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i] if results["metadatas"] else None
            }
            for i in range(len(results["ids"][0]))
        ]

    def import_from_files(self, directory: str):
        """从文件导入知识"""
        import os
        for filename in os.listdir(directory):
            if filename.endswith(".md") or filename.endswith(".txt"):
                filepath = os.path.join(directory, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                self.add_document(
                    doc_id=filename,
                    content=content,
                    metadata={"source": filename}
                )
```

---

## 3. 工作流自动化

### 3.1 审批流程

```markdown
# skills/workflow/SKILL.md

# 审批流程

## 描述
处理企业内部审批流程

## 触发条件
当用户：
- 提交审批申请
- 查询审批状态
- 审批/拒绝申请

## 输入参数

### action
- 类型: string
- 枚举: [submit, query, approve, reject]

### workflow_type
- 类型: string
- 枚举: [leave, expense, purchase, contract]
- 描述: 审批类型

### data
- 类型: object
- 描述: 审批数据

## 执行
```bash
python ${SKILL_DIR}/workflow.py \
  --action "${action}" \
  --type "${workflow_type}" \
  --data '${data}' \
  --db "${OPENCLAW_DIR}/data/db/workflow.db"
```
```

### 3.2 工作流引擎

```python
# skills/workflow/engine.py

from enum import Enum
from typing import List, Dict, Optional
import json

class WorkflowStatus(Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class WorkflowEngine:
    """工作流引擎"""

    def __init__(self):
        # 定义审批流程
        self.flows = {
            "leave": [
                {"role": "manager", "required": True},
                {"role": "hr", "required": False}
            ],
            "expense": [
                {"role": "manager", "required": True, "max_amount": 10000},
                {"role": "finance", "required": True, "min_amount": 10000}
            ]
        }

    def submit(self, workflow_type: str, data: dict, applicant: str) -> dict:
        """提交审批"""
        flow = self.flows.get(workflow_type)
        if not flow:
            return {"success": False, "error": "未知的审批类型"}

        # 创建审批实例
        instance = {
            "type": workflow_type,
            "data": data,
            "applicant": applicant,
            "status": WorkflowStatus.PENDING.value,
            "current_step": 0,
            "approvals": [],
            "created_at": datetime.now().isoformat()
        }

        # 保存并通知审批人
        instance_id = self._save_instance(instance)
        self._notify_approvers(instance_id, flow[0]["role"])

        return {"success": True, "instance_id": instance_id}

    def approve(self, instance_id: str, approver: str, comment: str = "") -> dict:
        """审批通过"""
        instance = self._get_instance(instance_id)
        flow = self.flows[instance["type"]]

        # 记录审批
        instance["approvals"].append({
            "approver": approver,
            "action": "approve",
            "comment": comment,
            "time": datetime.now().isoformat()
        })

        # 更新步骤
        instance["current_step"] += 1

        # 检查是否完成
        if instance["current_step"] >= len(flow):
            instance["status"] = WorkflowStatus.APPROVED.value
            self._notify_applicant(instance, "approved")
        else:
            # 通知下一审批人
            self._notify_approvers(instance_id, flow[instance["current_step"]]["role"])

        self._save_instance(instance)
        return {"success": True, "status": instance["status"]}

    def reject(self, instance_id: str, approver: str, reason: str) -> dict:
        """审批拒绝"""
        instance = self._get_instance(instance_id)

        instance["approvals"].append({
            "approver": approver,
            "action": "reject",
            "reason": reason,
            "time": datetime.now().isoformat()
        })

        instance["status"] = WorkflowStatus.REJECTED.value
        self._save_instance(instance)
        self._notify_applicant(instance, "rejected")

        return {"success": True, "status": "rejected"}
```

---

## 4. 企业知识库

### 4.1 文档问答系统

```python
# skills/doc_qa/SKILL.md

# 文档问答

## 描述
基于企业文档的智能问答

## 触发条件
当用户询问：
- 公司政策
- 产品文档
- 技术规范
- 操作指南

## 执行
结合 RAG 技术，从企业文档中检索答案
```

### 4.2 RAG 实现

```python
# skills/doc_qa/rag.py

from typing import List
import chromadb
from openai import OpenAI

class DocumentQA:
    """文档问答系统"""

    def __init__(self, chroma_path: str, openai_key: str):
        self.chroma = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.chroma.get_or_create_collection("docs")
        self.llm = OpenAI(api_key=openai_key)

    def query(self, question: str, n_contexts: int = 3) -> str:
        """问答"""
        # 1. 检索相关文档
        results = self.collection.query(
            query_texts=[question],
            n_results=n_contexts
        )

        contexts = results["documents"][0]

        # 2. 构建 prompt
        prompt = f"""
基于以下文档内容回答问题。如果文档中没有相关信息，请说"我不知道"。

文档内容：
{chr(10).join(contexts)}

问题：{question}

回答：
"""

        # 3. 调用 LLM
        response = self.llm.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content

    def add_document(self, doc_id: str, content: str, metadata: dict = None):
        """添加文档"""
        # 分块
        chunks = self._split_text(content)

        for i, chunk in enumerate(chunks):
            self.collection.add(
                ids=[f"{doc_id}_{i}"],
                documents=[chunk],
                metadatas=[{**(metadata or {}), "chunk": i, "doc_id": doc_id}]
            )

    def _split_text(self, text: str, chunk_size: int = 500) -> List[str]:
        """文本分块"""
        words = text.split()
        chunks = []

        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)

        return chunks
```

---

## 5. 运维助手

### 5.1 监控告警

```markdown
# skills/ops/SKILL.md

# 运维助手

## 描述
协助运维工作，包括监控、告警、故障诊断

## 触发条件
- 接收告警通知
- 用户询问系统状态
- 故障排查请求

## 功能
• 服务状态查询
• 日志分析
• 告警聚合
• 自动修复建议
```

### 5.2 告警处理

```python
# skills/ops/alert_handler.py

import json
from typing import Dict, List

class AlertHandler:
    """告警处理器"""

    def __init__(self, llm_client):
        self.llm = llm_client
        self.alert_history = []

    async def handle_alert(self, alert: Dict) -> Dict:
        """处理告警"""
        # 1. 记录告警
        self.alert_history.append(alert)

        # 2. 聚合相似告警
        similar = self._find_similar_alerts(alert)

        # 3. 分析根因
        analysis = await self._analyze_root_cause(alert, similar)

        # 4. 生成修复建议
        suggestions = await self._generate_suggestions(analysis)

        return {
            "alert": alert,
            "similar_count": len(similar),
            "analysis": analysis,
            "suggestions": suggestions
        }

    async def _analyze_root_cause(self, alert: Dict, similar: List[Dict]) -> str:
        """分析根因"""
        prompt = f"""
分析以下告警的根本原因：

当前告警：
{json.dumps(alert, indent=2)}

历史相似告警：
{json.dumps(similar[-5:], indent=2)}

请分析可能的根本原因：
"""
        response = await self.llm.generate(prompt)
        return response

    async def _generate_suggestions(self, analysis: str) -> List[str]:
        """生成修复建议"""
        prompt = f"""
基于以下分析，给出具体的修复建议：

{analysis}

请列出 3-5 条具体的修复步骤：
"""
        response = await self.llm.generate(prompt)
        return response.strip().split("\n")
```

---

## 6. 部署与运维

### 6.1 容器化部署

```dockerfile
# Dockerfile

FROM node:18-alpine

WORKDIR /app

# 安装 Python
RUN apk add --no-cache python3 py3-pip

# 复制项目文件
COPY package*.json ./
COPY skills ./skills
COPY config ./config

# 安装依赖
RUN npm install
RUN pip3 install -r skills/requirements.txt

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
```

```yaml
# docker-compose.yaml

version: '3.8'

services:
  openclaw:
    build: .
    ports:
      - "3000:3000"
    environment:
      - LLM_PROVIDER=deepseek
      - DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
    volumes:
      - ./data:/app/data
    depends_on:
      - postgres
      - redis
      - milvus

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=openclaw
      - POSTGRES_PASSWORD=secret
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

  milvus:
    image: milvusdb/milvus:latest
    ports:
      - "19530:19530"
    volumes:
      - milvusdata:/var/lib/milvus

volumes:
  pgdata:
  redisdata:
  milvusdata:
```

### 6.2 监控与日志

```yaml
# 监控配置
monitoring:
  enabled: true
  metrics:
    - name: request_count
      type: counter
    - name: response_time
      type: histogram
    - name: error_rate
      type: gauge

  alerts:
    - name: high_error_rate
      condition: error_rate > 0.05
      action: notify

logging:
  level: info
  format: json
  output:
    - file: /var/log/openclaw/app.log
    - elasticsearch:
        host: es.example.com
        index: openclaw-logs
```

---

## 关键要点总结

1. **智能客服**：意图识别 + 知识库 + 工单系统
2. **工作流**：可配置的审批流程引擎
3. **知识库**：RAG 技术实现文档问答
4. **运维助手**：告警聚合 + 根因分析 + 修复建议
5. **企业部署**：容器化 + 高可用 + 监控告警

---

*下一部分：[资源汇总](../resources/references.md)*

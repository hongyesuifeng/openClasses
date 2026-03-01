# Research Agent 实现方案

## 一、方案概述

本方案基于课程第14章《研究代理》，设计一个完整的Research Agent，通过HTML方式展现和交互。

### 技术栈选择
- **LLM后端**: Ollama本地模型 (免费开源)
- **搜索API**: DuckDuckGo (免费无需API Key)
- **前端**: 纯HTML + JavaScript (单页应用)
- **后端**: Python + Flask

---

## 二、文件结构

```
opencodeImplement/
├── backend/
│   ├── app.py                    # Flask主应用
│   ├── config.py                 # 配置文件
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── research_agent.py    # 研究代理核心
│   │   ├── query_generator.py   # 查询生成模块
│   │   ├── search_engine.py     # 搜索引擎模块
│   │   ├── document_analyzer.py # 文档分析模块
│   │   ├── knowledge_integrator.py # 知识整合模块
│   │   └── report_generator.py  # 报告生成模块
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── search_tool.py       # 搜索工具
│   │   └── llm_tool.py          # LLM调用工具
│   └── models/
│       ├── __init__.py
│       └── data_models.py       # 数据模型
├── frontend/
│   ├── index.html                # 主页面
│   ├── css/
│   │   └── style.css             # 样式文件
│   └── js/
│       ├── app.js                # 前端逻辑
│       └── components.js         # UI组件
├── requirements.txt              # Python依赖
└── README.md                     # 使用说明
```

---

## 三、分步实现计划

### 阶段1: 基础框架
- 项目结构、数据模型、LLM调用、搜索工具

### 阶段2: 信息检索模块
- 查询生成器、多源检索、结果排序筛选

### 阶段3: 内容分析模块
- 文档解析、信息提取、摘要生成、多文档对比

### 阶段4: 知识整合模块
- 实体对齐、关系提取、矛盾检测、知识图谱

### 阶段5: 报告生成模块
- 结构化撰写、引用管理、可视化

### 阶段6: 整合与前端
- 主Agent整合、HTML界面、实时交互

---

## 四、课程核心知识点总结

通过本实现，你将掌握：
1. Agent核心架构 (感知→思考→行动)
2. 信息检索 (查询生成、多源检索、结果排序)
3. 内容分析 (文档解析、信息抽取、摘要生成)
4. 知识整合 (实体对齐、关系抽取、知识图谱)
5. 报告生成 (结构化撰写、引用管理、可视化)
6. 开发实践 (工具调用、多模块协作)

---

## 五、启动与运行

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动Ollama
ollama serve && ollama pull llama2

# 3. 启动后端
cd backend && python app.py

# 4. 访问 http://localhost:5000
```

---

*本方案基于课程第14章《研究代理》设计*

# Research Agent - 智能研究助手

基于课程第14章《研究代理》实现的完整Agent，通过HTML方式展现和交互。

## 项目结构

```
opencodeImplement/
├── backend/
│   ├── app.py                    # Flask主应用
│   ├── config.py                 # 配置文件
│   ├── agents/
│   │   ├── research_agent.py    # 研究代理核心
│   │   ├── query_generator.py   # 查询生成模块
│   │   ├── search_engine.py      # 搜索引擎模块
│   │   ├── document_analyzer.py  # 文档分析模块
│   │   ├── knowledge_integrator.py # 知识整合模块
│   │   └── report_generator.py   # 报告生成模块
│   ├── tools/
│   │   ├── llm_tool.py           # LLM调用工具
│   │   └── search_tool.py         # 搜索工具
│   └── models/
│       └── data_models.py        # 数据模型
├── frontend/
│   ├── index.html                # 主页面
│   ├── css/style.css             # 样式文件
│   └── js/app.js                 # 前端逻辑
├── requirements.txt              # Python依赖
└── IMPLEMENTATION_PLAN.md        # 实现方案
```

## 环境要求

- Python 3.8+
- Ollama (本地运行LLM)
- 现代浏览器 (Chrome/Firefox/Edge)

## 安装步骤

### 1. 安装Python依赖

```bash
cd opencodeImplement
pip install -r requirements.txt
```

### 2. 安装并启动Ollama

```bash
# 安装Ollama (参考: https://ollama.ai)
# 启动Ollama服务
ollama serve

# 下载模型 (推荐llama2或mistral)
ollama pull llama2
```

### 3. 启动后端服务

```bash
cd backend
python app.py
```

### 4. 访问应用

打开浏览器访问: http://localhost:5000

## 使用方法

1. **输入研究主题** - 在输入框中输入想研究的主题
2. **开始研究** - 点击按钮或按回车
3. **查看结果** - 查看生成的研究报告、信息来源和知识图谱

## 课程核心知识点

通过本实现掌握：

1. **信息检索** - 查询生成、多源检索、结果排序
2. **内容分析** - 文档解析、信息抽取、摘要生成  
3. **知识整合** - 实体对齐、关系提取、知识图谱
4. **报告生成** - 结构化撰写、引用管理、可视化

## 技术栈

- **LLM**: Ollama (本地模型)
- **搜索**: DuckDuckGo
- **前端**: HTML + JavaScript
- **后端**: Python + Flask

## 注意事项

- 首次启动可能需要等待LLM模型加载
- 研究过程需要几分钟时间完成
- 确保Ollama服务正常运行

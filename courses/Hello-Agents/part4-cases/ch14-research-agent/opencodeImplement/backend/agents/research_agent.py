from typing import List, Callable, Optional
from backend.tools.llm_tool import LLMTool
from backend.tools.search_tool import SearchTool
from backend.models.data_models import ResearchResult, ResearchReport
from backend.agents.query_generator import QueryGenerator
from backend.agents.search_engine import SearchEngine
from backend.agents.document_analyzer import DocumentAnalyzer
from backend.agents.knowledge_integrator import KnowledgeIntegrator
from backend.agents.report_generator import ReportGenerator

class ResearchAgent:
    def __init__(self, llm: LLMTool = None, search_tool: SearchTool = None):
        self.llm = llm or LLMTool()
        self.search_tool = search_tool or SearchTool()
        
        self.query_generator = QueryGenerator(self.llm)
        self.search_engine = SearchEngine(self.search_tool)
        self.document_analyzer = DocumentAnalyzer(self.llm)
        self.knowledge_integrator = KnowledgeIntegrator(self.llm)
        self.report_generator = ReportGenerator(self.llm)
    
    def research(self, topic: str, progress_callback: Callable[[str, float], None] = None) -> ResearchResult:
        result = ResearchResult(
            query=self.query_generator.generate(topic),
            status="running"
        )
        
        try:
            progress_callback("正在生成查询...", 10)
            result.messages.append(f"生成查询: {result.query.original}")
            
            progress_callback("正在搜索信息...", 30)
            result.search_results = self.search_engine.search(result.query)
            result.messages.append(f"找到 {len(result.search_results)} 条搜索结果")
            
            progress_callback("正在分析文档...", 50)
            result.documents = self.document_analyzer.analyze(result.search_results)
            result.messages.append(f"分析了 {len(result.documents)} 篇文档")
            
            progress_callback("正在整合知识...", 70)
            kg = self.knowledge_integrator.integrate(result.documents)
            result.messages.append(f"提取了 {len(kg.entities)} 个实体, {len(kg.relations)} 个关系")
            
            progress_callback("正在生成报告...", 90)
            result.report = self.report_generator.generate(
                topic=topic,
                documents=result.documents,
                search_results=result.search_results,
                knowledge_graph=kg
            )
            result.messages.append("研究报告生成完成")
            
            result.status = "completed"
            progress_callback("研究完成!", 100)
            
        except Exception as e:
            result.status = "failed"
            result.messages.append(f"错误: {str(e)}")
            progress_callback(f"错误: {str(e)}", 0)
        
        return result
    
    def is_available(self) -> bool:
        return self.llm.is_available() and self.search_tool.is_available()

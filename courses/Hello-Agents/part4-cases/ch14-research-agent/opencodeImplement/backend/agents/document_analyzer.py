from typing import List, Dict
from backend.tools.llm_tool import LLMTool
from backend.models.data_models import Document, SearchResult

class DocumentAnalyzer:
    def __init__(self, llm: LLMTool = None):
        self.llm = llm or LLMTool()
    
    def analyze(self, results: List[SearchResult]) -> List[Document]:
        documents = []
        
        for r in results:
            doc = Document(
                title=r.title,
                url=r.url,
                content=r.snippet,
                snippet=r.snippet,
                source=r.source,
                published_date=r.published_date
            )
            
            doc = self._extract_info(doc)
            doc = self._generate_summary(doc)
            documents.append(doc)
        
        return documents
    
    def _extract_info(self, doc: Document) -> Document:
        prompt = f"""分析以下文档，提取关键信息：
文档标题: {doc.title}
文档来源: {doc.source}
文档内容: {doc.content}

请提取：
1. 研究问题 - 这篇文档研究什么问题？
2. 研究方法 - 使用了什么方法？
3. 主要发现/结论 - 有什么发现？

回答格式：
研究问题：xxx
研究方法：xxx
主要发现：xxx
"""
        
        response = self.llm.generate(prompt)
        
        try:
            info = {}
            for line in response.split('\n'):
                if '研究问题' in line:
                    info['research_question'] = line.split('：', 1)[-1].strip()
                elif '研究方法' in line:
                    info['methodology'] = line.split('：', 1)[-1].strip()
                elif '主要发现' in line or '发现' in line:
                    info['key_findings'] = line.split('：', 1)[-1].strip()
            if info:
                doc.key_info = info
        except:
            pass
        
        return doc
    
    def _generate_summary(self, doc: Document) -> Document:
        prompt = f"""请用100字左右概括以下文档的主旨，要求简洁准确：

标题: {doc.title}
内容: {doc.content[:500]}

请用中文回答："""
        
        doc.summary = self.llm.generate(prompt).strip()[:150]
        return doc
    
    def compare(self, documents: List[Document]) -> Dict:
        prompt = """比较以下文档，识别共同主题和差异点：

"""
        for i, doc in enumerate(documents[:5]):
            prompt += f"文档{i+1}: {doc.title}\n  内容: {doc.content[:200]}\n"
        
        prompt += "\n请分析：\n1. 这些文档的共同主题是什么？\n2. 有什么差异？\n"
        
        response = self.llm.generate(prompt)
        
        try:
            return {"analysis": response, "common_themes": [], "differences": []}
        except:
            return {"common_themes": [], "differences": []}

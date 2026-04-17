from typing import List
from backend.tools.llm_tool import LLMTool
from backend.models.data_models import Document, KnowledgeGraph, Entity, Relation

class KnowledgeIntegrator:
    def __init__(self, llm: LLMTool = None):
        self.llm = llm or LLMTool()
    
    def integrate(self, documents: List[Document]) -> KnowledgeGraph:
        entities = self._extract_entities(documents)
        
        if not entities:
            entities = self._fallback_entities(documents)
        
        relations = self._extract_relations_from_docs(documents)
        
        return KnowledgeGraph(
            entities=entities,
            relations=relations
        )
    
    def _extract_entities(self, documents: List[Document]) -> List[Entity]:
        entities = []
        entity_names = set()
        
        for doc in documents:
            title = doc.title.lower()
            content = doc.content.lower()
            
            if "machine learning" in content or "ml" in title:
                if "机器学习" not in entity_names:
                    entities.append(Entity(name="机器学习", type="核心技术", aliases=["ML", "Machine Learning"]))
                    entity_names.add("机器学习")
            
            if "deep learning" in content or "neural" in title:
                if "深度学习" not in entity_names:
                    entities.append(Entity(name="深度学习", type="核心技术", aliases=["DL", "Deep Learning"]))
                    entity_names.add("深度学习")
            
            if "nlp" in title or "natural language" in content:
                if "自然语言处理" not in entity_names:
                    entities.append(Entity(name="自然语言处理", type="应用领域", aliases=["NLP"]))
                    entity_names.add("自然语言处理")
            
            if "computer vision" in content or "image" in title:
                if "计算机视觉" not in entity_names:
                    entities.append(Entity(name="计算机视觉", type="应用领域", aliases=["CV"]))
                    entity_names.add("计算机视觉")
            
            if "reinforcement" in content:
                if "强化学习" not in entity_names:
                    entities.append(Entity(name="强化学习", type="技术方向", aliases=["RL"]))
                    entity_names.add("强化学习")
            
            if "transformer" in content or "attention" in title:
                if "Transformer" not in entity_names:
                    entities.append(Entity(name="Transformer", type="模型架构"))
                    entity_names.add("Transformer")
            
            if "gpt" in title or "llm" in title or "language model" in content:
                if "大语言模型" not in entity_names:
                    entities.append(Entity(name="大语言模型", type="技术方向", aliases=["LLM", "GPT"]))
                    entity_names.add("大语言模型")
        
        return entities[:15]
    
    def _fallback_entities(self, documents: List[Document]) -> List[Entity]:
        entities = []
        topics = set()
        
        for doc in documents:
            if doc.source == "arXiv":
                topics.add("学术研究")
            elif doc.source == "GitHub":
                topics.add("开源项目")
        
        for topic in topics:
            entities.append(Entity(name=topic, type="类别"))
        
        return entities

    def _extract_relations_from_docs(self, documents: List[Document]) -> List[Relation]:
        relations = []
        
        content_all = " ".join([d.content.lower() for d in documents])
        
        if "machine learning" in content_all or "deep learning" in content_all:
            relations.append(Relation("深度学习", "属于", "机器学习", 0.9))
        
        if "neural network" in content_all or "deep learning" in content_all:
            relations.append(Relation("神经网络", "属于", "深度学习", 0.8))
        
        if "transformer" in content_all:
            relations.append(Relation("Transformer", "推动", "大语言模型", 0.9))
        
        if "nlp" in content_all or "language" in content_all:
            relations.append(Relation("自然语言处理", "属于", "人工智能", 0.8))
        
        if "computer vision" in content_all or "image" in content_all:
            relations.append(Relation("计算机视觉", "属于", "人工智能", 0.8))
        
        if "reinforcement" in content_all:
            relations.append(Relation("强化学习", "属于", "机器学习", 0.8))
        
        relations.append(Relation("机器学习", "属于", "人工智能", 0.9))
        relations.append(Relation("深度学习", "支撑", "人工智能", 0.9))
        relations.append(Relation("算法", "实现", "模型", 0.7))
        relations.append(Relation("模型", "应用于", "场景", 0.7))
        
        return relations[:15]
    
    def detect_contradictions(self, documents: List[Document]) -> List[dict]:
        return []

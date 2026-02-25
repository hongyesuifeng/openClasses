from typing import List
from backend.models.data_models import Query

class QueryGenerator:
    def __init__(self):
        pass
    
    def generate(self, topic: str) -> Query:
        keywords = self._extract_keywords(topic)
        expanded = self._expand_queries(topic, keywords)
        
        return Query(
            original=topic,
            keywords=keywords,
            expanded=expanded
        )
    
    def _extract_keywords(self, topic: str) -> List[str]:
        words = topic.replace('的', ' ').replace('在', ' ').replace('与', ' ').replace('和', ' ').split()
        keywords = [w.strip() for w in words if len(w.strip()) > 1]
        return keywords[:10] if keywords else [topic]
    
    def _expand_queries(self, topic: str, keywords: List[str]) -> List[str]:
        queries = [topic]
        
        for kw in keywords[:5]:
            queries.append(kw)
            queries.append(f"{topic} {kw}")
        
        queries.extend([
            f"{topic} overview",
            f"{topic} latest research",
            f"{topic} applications",
            f"{topic} challenges"
        ])
        
        return list(set(queries))[:15]

from typing import List
from backend.tools.search_tool import SearchTool
from backend.models.data_models import SearchResult, Query

class SearchEngine:
    def __init__(self, search_tool: SearchTool = None):
        self.search_tool = search_tool or SearchTool()
    
    def search(self, query: Query, max_results: int = None) -> List[SearchResult]:
        results = []
        all_queries = [query.original] + query.expanded[:5]
        
        for q in all_queries:
            if len(results) >= 50:
                break
            results.extend(self.search_tool.search(q, 20))
        
        return self._rank_results(results)
    
    def _rank_results(self, results: List[SearchResult]) -> List[SearchResult]:
        for r in results:
            score = 1.0
            if r.source in ["arXiv", "PubMed", "Wikipedia"]:
                score *= 1.5
            if r.source == "GitHub":
                score *= 1.3
            if r.published_date:
                score *= 1.2
            r.score = score
        
        seen = set()
        unique_results = []
        for r in results:
            if r.title not in seen:
                seen.add(r.title)
                unique_results.append(r)
        
        return sorted(unique_results, key=lambda x: x.score, reverse=True)[:60]

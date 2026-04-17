from typing import List
import requests
import xml.etree.ElementTree as ET
from backend.models.data_models import SearchResult
from backend.config import Config

try:
    from duckduckgo_search import DDGS
    DDGS_AVAILABLE = True
except ImportError:
    DDGS_AVAILABLE = False

class SearchTool:
    def __init__(self, max_results: int = None):
        self.max_results = max_results or Config.SEARCH_MAX_RESULTS
        self._is_available = None
    
    def search(self, query: str, max_results: int = None) -> List[SearchResult]:
        limit = max_results or self.max_results
        results = []
        
        results.extend(self._search_arxiv(query, limit))
        
        if len(results) < limit:
            results.extend(self._search_github(query, limit - len(results)))
        
        if len(results) < limit and DDGS_AVAILABLE:
            results.extend(self._search_duckduckgo(query, limit - len(results)))
        
        return results[:limit]
    
    def _search_duckduckgo(self, query: str, max_results: int) -> List[SearchResult]:
        results = []
        if max_results <= 0:
            return results
        try:
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=max_results):
                    results.append(SearchResult(
                        title=r.get('title', ''),
                        url=r.get('href', ''),
                        snippet=r.get('body', ''),
                        source="Web",
                        published_date=None
                    ))
        except Exception as e:
            print(f"DuckDuckGo搜索错误: {e}")
        return results
    
    def _search_arxiv(self, query: str, max_results: int) -> List[SearchResult]:
        results = []
        try:
            url = "http://export.arxiv.org/api/query"
            params = {
                "search_query": f"all:{query}",
                "max_results": min(max_results, 20),
                "sortBy": "relevance"
            }
            response = requests.get(url, params=params, timeout=20)
            
            root = ET.fromstring(response.content)
            
            for entry in root.findall('.//{http://www.w3.org/2005/Atom}entry'):
                try:
                    title_el = entry.find('{http://www.w3.org/2005/Atom}title')
                    summary_el = entry.find('{http://www.w3.org/2005/Atom}summary')
                    link_el = entry.find('{http://www.w3.org/2005/Atom}id')
                    
                    title = title_el.text.replace('\n', ' ').strip() if title_el is not None else "No title"
                    summary = summary_el.text[:500].strip() if summary_el is not None else "No summary"
                    link = link_el.text if link_el is not None else ""
                    
                    results.append(SearchResult(
                        title=title[:150],
                        url=link,
                        snippet=summary,
                        source="arXiv",
                        published_date=None
                    ))
                except:
                    continue
        except Exception as e:
            print(f"arXiv搜索错误: {e}")
        return results
    
    def _search_github(self, query: str, max_results: int) -> List[SearchResult]:
        results = []
        if max_results <= 0:
            return results
        try:
            url = "https://api.github.com/search/repositories"
            params = {
                "q": query,
                "per_page": min(max_results, 20),
                "sort": "stars"
            }
            response = requests.get(url, params=params, timeout=15, 
                                    headers={"Accept": "application/vnd.github.v3+json"})
            
            if response.status_code == 200:
                data = response.json()
                for item in data.get("items", [])[:max_results]:
                    title = item.get("full_name", "")
                    desc = item.get("description", "") or "No description"
                    url_link = item.get("html_url", "")
                    date = item.get("created_at", "").split("T")[0] if item.get("created_at") else None
                    stars = item.get("stargazers_count", 0)
                    lang = item.get("language", "")
                    
                    snippet = f"⭐ {stars} stars | {lang} | {desc[:100]}"
                    
                    results.append(SearchResult(
                        title=title,
                        url=url_link,
                        snippet=snippet,
                        source="GitHub",
                        published_date=date
                    ))
        except Exception as e:
            print(f"GitHub搜索错误: {e}")
        return results
    
    def is_available(self) -> bool:
        if self._is_available is not None:
            return self._is_available
        try:
            self._search_arxiv("test", 1)
            self._is_available = True
        except:
            self._is_available = False
        return self._is_available

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime

@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    source: str
    published_date: Optional[str] = None
    score: float = 0.0
    summary: str = ""

@dataclass
class Document:
    title: str
    url: str
    content: str
    snippet: str
    source: str
    published_date: Optional[str] = None
    entities: List[str] = field(default_factory=list)
    key_info: Dict[str, str] = field(default_factory=dict)
    summary: str = ""

@dataclass
class Query:
    original: str
    expanded: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)

@dataclass
class Entity:
    name: str
    type: str
    aliases: List[str] = field(default_factory=list)
    properties: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Relation:
    source: str
    target: str
    type: str
    confidence: float = 1.0

@dataclass
class KnowledgeGraph:
    entities: List[Entity] = field(default_factory=list)
    relations: List[Relation] = field(default_factory=list)

@dataclass
class ResearchReport:
    topic: str
    abstract: str
    background: str
    methodology: str
    findings: List[str]
    discussion: str
    conclusions: List[str]
    references: List[SearchResult]
    knowledge_graph: Optional[KnowledgeGraph] = None
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class ResearchResult:
    query: Query
    search_results: List[SearchResult] = field(default_factory=list)
    documents: List[Document] = field(default_factory=list)
    report: Optional[ResearchReport] = None
    status: str = "pending"
    progress: float = 0.0
    messages: List[str] = field(default_factory=list)

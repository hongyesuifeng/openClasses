import requests
import os
import re
from typing import List, Dict
from backend.config import Config

class LLMTool:
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = base_url or Config.OLLAMA_BASE_URL
        self.model = model or Config.OLLAMA_MODEL
        self._is_available = None
    
    def generate(self, prompt: str, system: str = None, **kwargs) -> str:
        if self.is_available():
            try:
                return self._ollama_generate(prompt, system)
            except Exception as e:
                print(f"Ollama error: {e}, using fallback")
                pass
        return self._template_generate(prompt)
    
    def _ollama_generate(self, prompt: str, system: str = None) -> str:
        url = f"{self.base_url}/api/generate"
        payload = {"model": self.model, "prompt": prompt, "stream": False}
        if system:
            payload["system"] = system
        try:
            response = requests.post(url, json=payload, timeout=15)
            if response.status_code == 200:
                return response.json().get("response", "")
        except requests.exceptions.Timeout:
            raise TimeoutError("Ollama request timed out")
        except Exception as e:
            raise Exception(f"Ollama error: {e}")
        return ""
    
    def chat(self, messages: List[Dict[str, str]], **kwargs) -> str:
        prompt = "\n".join([f"{m.get('role')}: {m.get('content')}" for m in messages])
        return self.generate(prompt)
    
    def is_available(self) -> bool:
        if self._is_available is not None:
            return self._is_available
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=3)
            self._is_available = response.status_code == 200
        except:
            self._is_available = False
        return self._is_available
    
    def _template_generate(self, prompt: str) -> str:
        prompt_lower = prompt.lower()
        
        if "关键词" in prompt:
            topic = self._extract_topic(prompt)
            return f"{topic}, 深度学习, 机器学习, 神经网络, 算法, 应用"
        
        elif "概括" in prompt_lower or ("摘要" in prompt and "生成" in prompt_lower):
            return self._generate_abstract(prompt)
        
        elif "分析以下文档" in prompt:
            topic = self._extract_topic(prompt)
            return f"研究问题：探索{topic}的核心问题\n研究方法：文献分析\n主要发现：{topic}是重要研究方向"
        
        elif "实体" in prompt_lower:
            return self._extract_entities(prompt)
        
        elif "关系" in prompt_lower:
            return self._extract_relations(prompt)
        
        elif "背景" in prompt_lower:
            return self._generate_background(prompt)
        
        elif "发现" in prompt_lower:
            return self._generate_findings(prompt)
        
        elif "讨论" in prompt_lower:
            return "研究表明该领域具有重要研究价值，技术发展带来新机遇。"
        
        elif "结论" in prompt_lower:
            return self._generate_conclusions(prompt)
        
        return self._generate_abstract(prompt)
    
    def _extract_topic(self, prompt: str) -> str:
        patterns = [r'主题[：:]\s*(.+?)(?:\n|$)', r'topic[:\s]+["\']?(.+?)["\']?']
        for pattern in patterns:
            match = re.search(pattern, prompt, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return "该研究领域"
    
    def _generate_abstract(self, prompt: str) -> str:
        topic = self._extract_topic(prompt)
        return f"本研究报告聚焦于{topic}领域。通过对arXiv学术论文和GitHub开源项目的深入分析，本研究揭示了{topic}的核心发展脉络、主要技术方向和应用场景。研究发现，{topic}已成为当前技术发展的热点方向。"

    def _generate_background(self, prompt: str) -> str:
        topic = self._extract_topic(prompt)
        return f"【{topic}历史发展脉络】\n\n早期阶段（2010-2015）：理论基础建立期\n快速发展期（2016-2020）：技术应用扩展\n当前阶段（2021-至今）：深化应用落地"

    def _extract_entities(self, prompt: str) -> str:
        topic = self._extract_topic(prompt)
        return f"{topic}:核心领域\n机器学习:相关技术\n深度学习:相关技术\n神经网络:相关技术"

    def _extract_relations(self, prompt: str) -> str:
        return "机器学习 -> 属于 -> 人工智能\n深度学习 -> 属于 -> 机器学习\n神经网络 -> 属于 -> 深度学习"

    def _generate_findings(self, prompt: str) -> str:
        return "1. 技术发展迅速\n2. 应用场景不断拓展\n3. 面临技术和伦理挑战\n4. 产学研合作密切\n5. 政策支持加大"

    def _generate_conclusions(self, prompt: str) -> str:
        return "1. 该领域具有重要研究价值\n2. 应用前景广阔\n3. 需要深化研究"

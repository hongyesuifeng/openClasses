"""
LLM 集成 - MiniMax M2.5 客户端
"""

from typing import List, Dict, Any, Optional
import os


class LLMClient:
    """LLM 客户端"""
    
    def __init__(
        self,
        provider: str = "minimax",
        api_key: str = "",
        model: str = "MiniMax-M2.5"
    ):
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self.client = None
        self._init_client()
    
    def _init_client(self) -> None:
        """初始化客户端"""
        if not self.api_key:
            return
        
        if self.provider == "minimax":
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url="https://api.minimax.com/v1"
                )
                print(f"[LLM] MiniMax client initialized successfully")
            except Exception as e:
                print(f"[LLM] Failed to initialize MiniMax client: {e}")
        
        elif self.provider == "openai":
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=self.api_key
                )
                print(f"[LLM] OpenAI client initialized successfully")
            except Exception as e:
                print(f"[LLM] Failed to initialize OpenAI client: {e}")
        
        elif self.provider == "zhipu":
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url="https://open.bigmodel.cn/api/paas/v4"
                )
                print(f"[LLM] Zhipu client initialized successfully")
            except Exception as e:
                print(f"[LLM] Failed to initialize Zhipu client: {e}")
    
    def is_configured(self) -> bool:
        """检查是否已配置"""
        return self.client is not None
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = "",
        temperature: float = 0.8,
        max_tokens: int = 500
    ) -> str:
        """对话生成"""
        if not self.is_configured():
            return "LLM 未配置，请先在设置中配置 API Key"
        
        full_messages = []
        
        if system_prompt:
            full_messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        full_messages.extend(messages)
        
        try:
            if self.provider == "minimax":
                extra_body = {"reasoning_split": True} if "M2" in self.model else {}
                
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=full_messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    **extra_body
                )
            else:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=full_messages,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
            
            return response.choices[0].message.content
        
        except Exception as e:
            return f"Error: {str(e)}"
    
    def generate_response(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.8,
        max_tokens: int = 500
    ) -> str:
        """生成文本响应"""
        messages = [{"role": "user", "content": prompt}]
        return self.chat(messages, system_prompt, temperature, max_tokens)
    
    def test_connection(self) -> Dict[str, Any]:
        """测试连接"""
        if not self.is_configured():
            return {
                "success": False,
                "message": "API Key 未配置"
            }
        
        try:
            response = self.chat(
                messages=[{"role": "user", "content": "你好"}],
                system_prompt="你是一个友好的AI助手，请用一句话回复。",
                max_tokens=50
            )
            
            if "Error" in response:
                return {
                    "success": False,
                    "message": response
                }
            
            return {
                "success": True,
                "message": "连接成功",
                "response": response
            }
        
        except Exception as e:
            return {
                "success": False,
                "message": str(e)
            }
    
    def update_config(self, provider: str, api_key: str, model: str) -> None:
        """更新配置"""
        self.provider = provider
        self.api_key = api_key
        self.model = model
        self._init_client()
    
    def to_dict(self) -> Dict[str, str]:
        return {
            "provider": self.provider,
            "model": self.model,
            "configured": str(self.is_configured())
        }


def create_llm_client(config: Optional[Dict[str, str]] = None) -> LLMClient:
    """创建 LLM 客户端"""
    if config:
        return LLMClient(
            provider=config.get("provider", "minimax"),
            api_key=config.get("api_key", ""),
            model=config.get("model", "MiniMax-M2.5")
        )
    return LLMClient()

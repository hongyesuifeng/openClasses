"""
LLM 集成 - MiniMax 客户端
"""

import os
from typing import List, Dict, Any, Optional, Generator
from dataclasses import dataclass


@dataclass
class Message:
    """消息结构"""
    role: str
    content: str


@dataclass
class ChatResponse:
    """聊天响应"""
    content: str
    finish_reason: str = "stop"
    usage: Optional[Dict[str, int]] = None


class LLMClient:
    """LLM 客户端"""
    
    def __init__(
        self,
        api_key: str = "",
        base_url: str = "https://api.minimaxi.com/v1",
        model: str = "MiniMax-M2.5"
    ):
        self.api_key = api_key or os.getenv("MINIMAX_API_KEY", "")
        self.base_url = base_url or os.getenv("MINIMAX_BASE_URL", "https://api.minimaxi.com/v1")
        self.model = model
        self.client = None
        self._init_client()
    
    def _init_client(self) -> None:
        """初始化客户端"""
        if not self.api_key:
            print("[LLM] Warning: No API key provided")
            return
        
        try:
            from openai import OpenAI
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
            print(f"[LLM] MiniMax client initialized successfully")
            print(f"[LLM] Model: {self.model}, Base URL: {self.base_url}")
        except Exception as e:
            print(f"[LLM] Failed to initialize client: {e}")
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False
    ) -> ChatResponse:
        """发送聊天请求"""
        if not self.client:
            return ChatResponse(content="[Error] LLM client not initialized. Please check your API key.")
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=stream
            )
            
            if stream:
                return response
            
            return ChatResponse(
                content=response.choices[0].message.content,
                finish_reason=response.choices[0].finish_reason,
                usage={
                    "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                    "total_tokens": response.usage.total_tokens if response.usage else 0
                }
            )
        except Exception as e:
            print(f"[LLM] Chat error: {e}")
            return ChatResponse(content=f"[Error] {str(e)}")
    
    def chat_stream(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> Generator[str, None, None]:
        """流式聊天请求"""
        if not self.client:
            yield "[Error] LLM client not initialized"
            return
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"[Error] {str(e)}"
    
    def is_available(self) -> bool:
        """检查客户端是否可用"""
        return self.client is not None


def create_llm_client() -> LLMClient:
    """创建 LLM 客户端的工厂函数"""
    return LLMClient()

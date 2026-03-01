"""
Game Dev Town - LLM 服务
MiniMax API (Anthropic 兼容模式) 集成
"""
import httpx
import re
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

from app.config import settings


def remove_think_tags(content: str) -> str:
    """Remove thinking process tags from LLM output"""
    # Remove <think>...</think> tags and their content (supports multiline)
    content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL)
    # Clean up extra blank lines
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    return content.strip()


@dataclass
class LLMResponse:
    """LLM 响应"""
    content: str
    model: str
    usage: Dict[str, int]
    finish_reason: str


class LLMService:
    """
    MiniMax LLM 服务
    使用 Anthropic 兼容模式
    """

    def __init__(self):
        self.api_key = settings.llm.api_key
        self.base_url = settings.llm.base_url
        self.model = settings.llm.model
        self.max_tokens = settings.llm.max_tokens
        self.temperature = settings.llm.temperature

        # 验证配置
        if not self.api_key:
            print("警告: 未设置 MINIMAX_API_KEY，LLM 服务将使用降级模式")

    def _build_headers(self) -> Dict[str, str]:
        """构建请求头"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "X-API-Key": self.api_key,
        }

    def _build_anthropic_request(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """构建 Anthropic 格式的请求"""
        messages = []

        # 添加历史消息
        if conversation_history:
            messages.extend(conversation_history)

        # 添加当前用户消息
        messages.append({
            "role": "user",
            "content": user_message,
        })

        return {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "system": system_prompt,
            "messages": messages,
        }

    async def generate(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
    ) -> str:
        """生成回复 - 使用 OpenAI 兼容格式（MiniMax 支持）"""
        if not self.api_key:
            return self._fallback_generate(user_message)

        try:
            # 构建 OpenAI 兼容格式的消息
            messages = []

            # 添加历史消息
            if conversation_history:
                messages.extend(conversation_history)

            # 添加当前用户消息
            messages.append({
                "role": "user",
                "content": user_message,
            })

            request_body = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "messages": messages,
            }

            # MiniMax 支持在 messages 中添加 system 角色
            if system_prompt:
                messages.insert(0, {
                    "role": "system",
                    "content": system_prompt,
                })

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._build_headers(),
                    json=request_body,
                )

                if response.status_code == 200:
                    data = response.json()
                    # OpenAI 格式响应
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        return remove_think_tags(content)
                    return ""
                else:
                    print(f"LLM API 错误: {response.status_code} - {response.text}")
                    return self._fallback_generate(user_message)

        except Exception as e:
            print(f"LLM 请求失败: {e}")
            return self._fallback_generate(user_message)

    async def generate_stream(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict]] = None,
    ):
        """流式生成回复"""
        if not self.api_key:
            yield self._fallback_generate(user_message)
            return

        request_body = self._build_anthropic_request(
            system_prompt=system_prompt,
            user_message=user_message,
            conversation_history=conversation_history,
        )
        request_body["stream"] = True

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/messages",
                    headers=self._build_headers(),
                    json=request_body,
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            yield line[6:]  # 移除 "data: " 前缀

        except Exception as e:
            print(f"LLM 流式请求失败: {e}")
            yield self._fallback_generate(user_message)

    def _fallback_generate(self, prompt: str) -> str:
        """降级生成（无 API 时使用）"""
        # 基于关键词返回预设回复
        fallback_responses = {
            "进度": "作为团队成员，我认为当前进度符合预期，需要继续保持。",
            "问题": "这个问题需要进一步讨论，我建议我们集思广益找出解决方案。",
            "建议": "我的建议是先进行小范围测试，验证方案可行性后再推广。",
            "设计": "从设计角度来说，我们需要平衡美观和功能性。",
            "技术": "技术实现上是可行的，但需要评估工作量和风险。",
        }

        for keyword, response in fallback_responses.items():
            if keyword in prompt:
                return response

        return "好的，我了解了。让我从我的专业角度来分析这个问题。"

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> str:
        """聊天补全（OpenAI 兼容格式）"""
        if not self.api_key:
            return self._fallback_generate(messages[-1].get("content", ""))

        try:
            request_body = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "temperature": self.temperature,
                "messages": messages,
            }

            if system_prompt:
                request_body["system"] = system_prompt

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._build_headers(),
                    json=request_body,
                )

                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        return remove_think_tags(content)
                    return ""
                else:
                    print(f"Chat completion 错误: {response.status_code}")
                    return self._fallback_generate(messages[-1].get("content", ""))

        except Exception as e:
            print(f"Chat completion 失败: {e}")
            return self._fallback_generate(messages[-1].get("content", ""))

    def is_available(self) -> bool:
        """检查服务是否可用"""
        return bool(self.api_key)


# 全局 LLM 服务实例
llm_service = LLMService()

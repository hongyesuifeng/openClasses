from __future__ import annotations

import os
import re
import logging
from typing import List
import json
from typing import Any
from ollama import chat
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator

load_dotenv()

# 配置日志
logger = logging.getLogger(__name__)

BULLET_PREFIX_PATTERN = re.compile(r"^\s*([-*•]|\d+\.)\s+")
KEYWORD_PREFIXES = (
    "todo:",
    "action:",
    "next:",
)


def _is_action_line(line: str) -> bool:
    stripped = line.strip().lower()
    if not stripped:
        return False
    if BULLET_PREFIX_PATTERN.match(stripped):
        return True
    if any(stripped.startswith(prefix) for prefix in KEYWORD_PREFIXES):
        return True
    if "[ ]" in stripped or "[todo]" in stripped:
        return True
    return False


def extract_action_items(text: str) -> List[str]:
    lines = text.splitlines()
    extracted: List[str] = []
    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue
        if _is_action_line(line):
            cleaned = BULLET_PREFIX_PATTERN.sub("", line)
            cleaned = cleaned.strip()
            # Trim common checkbox markers
            cleaned = cleaned.removeprefix("[ ]").strip()
            cleaned = cleaned.removeprefix("[todo]").strip()
            extracted.append(cleaned)
    # Fallback: if nothing matched, heuristically split into sentences and pick imperative-like ones
    if not extracted:
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        for sentence in sentences:
            s = sentence.strip()
            if not s:
                continue
            if _looks_imperative(s):
                extracted.append(s)
    # Deduplicate while preserving order
    seen: set[str] = set()
    unique: List[str] = []
    for item in extracted:
        lowered = item.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        unique.append(item)
    return unique


def _looks_imperative(sentence: str) -> bool:
    words = re.findall(r"[A-Za-z']+", sentence)
    if not words:
        return False
    first = words[0]
    # Crude heuristic: treat these as imperative starters
    imperative_starters = {
        "add",
        "create",
        "implement",
        "fix",
        "update",
        "write",
        "check",
        "verify",
        "refactor",
        "document",
        "design",
        "investigate",
    }
    return first.lower() in imperative_starters


# ==================== LLM 基于的行动项提取 ====================

# LLM 提取提示词
EXTRACTION_PROMPT = """你是一位从会议笔记和非正式文本中提取可执行任务的专家。

从以下文本中提取所有行动项。行动项是：
- 需要完成的具体任务
- 通常以祈使句表达（以动词开头）
- 可能以项目符号、编号列表或嵌入在叙述中出现
- 应简洁且可执行

指导原则：
- 仅返回清晰、可执行的项
- 移除项目符号、复选框和格式标记
- 尽可能保留原始措辞
- 每个项应该是单个完整的任务
- 如果没有找到行动项，返回空列表

待分析文本：
{text}

以 JSON 字符串数组形式返回你的响应。"""


class ActionItemList(BaseModel):
    """LLM 结构化输出 schema - 用于验证提取的行动项列表"""

    items: List[str] = Field(
        description="从文本中提取的行动项列表",
        min_length=0
    )

    @field_validator('items')
    @classmethod
    def validate_items(cls, v):
        """确保所有项都是非空字符串"""
        return [item.strip() for item in v if item.strip()]


def extract_action_items_llm(
    text: str,
    model: str = "llama3.1:8b",
    temperature: float = 0.0,
    timeout: int = 30
) -> List[str]:
    """
    使用 LLM 结构化输出从文本中提取行动项。

    Args:
        text: 要提取行动项的输入文本
        model: Ollama 模型名称（默认：llama3.2）
        temperature: 采样温度（0.0 用于确定性输出）
        timeout: 请求超时时间（秒）

    Returns:
        提取的行动项字符串列表

    Raises:
        ValueError: 如果文本为空
        ConnectionError: 如果 Ollama 服务不可用
        TimeoutError: 如果 LLM 请求超时
        RuntimeError: 其他 LLM 处理错误
    """
    # 输入验证 - 空文本返回空列表
    if not text or not text.strip():
        return []

    try:
        # 准备提示词
        prompt = EXTRACTION_PROMPT.format(text=text.strip())

        # 调用 Ollama 结构化输出
        response = chat(
            model=model,
            messages=[{'role': 'user', 'content': prompt}],
            format=ActionItemList.model_json_schema(),
            options={'temperature': temperature}
        )

        # 解析和验证响应
        action_list = ActionItemList.model_validate_json(response.message.content)
        logger.info(f"LLM 成功提取 {len(action_list.items)} 个行动项")
        return action_list.items

    except ValueError as e:
        logger.error(f"解析 LLM 响应失败: {e}")
        raise RuntimeError(f"解析 LLM 响应失败: {e}")
    except ConnectionError as e:
        logger.error(f"无法连接到 Ollama 服务: {e}")
        raise ConnectionError(
            "无法连接到 Ollama 服务。请确保 Ollama 正在运行（使用 'ollama serve'）"
        )
    except TimeoutError:
        logger.error(f"LLM 请求超过 {timeout} 秒超时")
        raise TimeoutError(f"LLM 请求超过 {timeout} 秒超时")
    except Exception as e:
        logger.error(f"LLM 提取失败: {e}")
        raise RuntimeError(f"LLM 提取失败: {e}")

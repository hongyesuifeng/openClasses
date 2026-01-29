"""
API 请求和响应模式定义

使用 Pydantic 定义清晰的 API 契约，提供类型验证和自动文档生成。
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, field_validator


# ==================== 请求模式 ====================

class ExtractRequest(BaseModel):
    """行动项提取请求"""
    text: str = Field(..., min_length=1, description="要提取行动项的文本")
    save_note: bool = Field(default=True, description="是否保存原文为笔记")
    method: Literal["heuristic", "llm"] = Field(
        default="heuristic",
        description="提取方法：heuristic(启发式) 或 llm(大语言模型)"
    )

    @field_validator('text')
    @classmethod
    def text_must_not_be_empty(cls, v: str) -> str:
        """验证文本不为空"""
        if not v or not v.strip():
            raise ValueError("text cannot be empty")
        return v.strip()


class CreateNoteRequest(BaseModel):
    """创建笔记请求"""
    content: str = Field(..., min_length=1, description="笔记内容")

    @field_validator('content')
    @classmethod
    def content_must_not_be_empty(cls, v: str) -> str:
        """验证内容不为空"""
        if not v or not v.strip():
            raise ValueError("content cannot be empty")
        return v.strip()


class MarkDoneRequest(BaseModel):
    """标记完成状态请求"""
    done: bool = Field(..., description="完成状态")


# ==================== 响应模式 ====================

class ActionItemResponse(BaseModel):
    """行动项响应"""
    id: int = Field(..., description="行动项 ID")
    note_id: Optional[int] = Field(None, description="关联的笔记 ID")
    text: str = Field(..., description="行动项内容")
    done: bool = Field(..., description="是否已完成")
    created_at: str = Field(..., description="创建时间")


class NoteResponse(BaseModel):
    """笔记响应"""
    id: int = Field(..., description="笔记 ID")
    content: str = Field(..., description="笔记内容")
    created_at: str = Field(..., description="创建时间")


class ExtractResponse(BaseModel):
    """提取响应"""
    note_id: Optional[int] = Field(None, description="保存的笔记 ID（如果 save_note=True）")
    items: List[ActionItemResponse] = Field(default_factory=list, description="提取的行动项列表")


class MessageResponse(BaseModel):
    """通用消息响应"""
    message: str = Field(..., description="响应消息")


# ==================== 数据库模型（内部使用）====================

class NoteModel(BaseModel):
    """笔记数据模型"""
    id: Optional[int] = None
    content: str
    created_at: Optional[str] = None


class ActionItemModel(BaseModel):
    """行动项数据模型"""
    id: Optional[int] = None
    note_id: Optional[int] = None
    text: str
    done: bool = False
    created_at: Optional[str] = None

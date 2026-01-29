"""
行动项相关路由

提供行动项提取、列表和状态管理的 API 端点。
"""
from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status

from .. import db
from ..services.extract import extract_action_items
from ..schemas import (
    ExtractRequest,
    ExtractResponse,
    ActionItemResponse,
    MarkDoneRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/action-items", tags=["action-items"])


@router.post("/extract", response_model=ExtractResponse, status_code=status.HTTP_200_OK)
def extract(payload: ExtractRequest) -> ExtractResponse:
    """
    提取行动项

    支持两种提取方法：
    - **heuristic**: 启发式规则提取（默认，快速）
    - **llm**: 大语言模型智能提取（更准确但较慢）

    Args:
        payload: 提取请求，包含文本、保存选项和提取方法

    Returns:
        提取响应，包含笔记 ID（如果保存）和行动项列表

    Raises:
        HTTPException: 当 LLM 服务不可用时
    """
    text = payload.text

    # 保存笔记（如果请求）
    note_id: Optional[int] = None
    if payload.save_note:
        note_id = db.insert_note(text)
        logger.info(f"笔记已保存，ID: {note_id}")

    # 根据方法选择提取函数
    try:
        if payload.method == "llm":
            from ..services.extract import extract_action_items_llm
            logger.info(f"使用 LLM 方法提取行动项，文本长度: {len(text)}")
            items = extract_action_items_llm(text)
        else:
            logger.info(f"使用启发式方法提取行动项，文本长度: {len(text)}")
            items = extract_action_items(text)
    except ConnectionError as e:
        logger.error(f"LLM 服务连接失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LLM 服务不可用，请确保 Ollama 正在运行"
        )
    except Exception as e:
        logger.error(f"提取失败: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"提取失败: {str(e)}"
        )

    # 插入行动项到数据库
    ids = db.insert_action_items(items, note_id=note_id)

    # 构建响应
    item_responses = [
        ActionItemResponse(
            id=item_id,
            note_id=note_id,
            text=item_text,
            done=False,
            created_at=""
        )
        for item_id, item_text in zip(ids, items)
    ]

    return ExtractResponse(note_id=note_id, items=item_responses)


@router.get("", response_model=List[ActionItemResponse])
def list_all(note_id: Optional[int] = None) -> List[ActionItemResponse]:
    """
    列出行动项

    Args:
        note_id: 可选，过滤特定笔记的行动项

    Returns:
        行动项列表
    """
    rows = db.list_action_items(note_id=note_id)
    return [
        ActionItemResponse(
            id=r["id"],
            note_id=r["note_id"],
            text=r["text"],
            done=bool(r["done"]),
            created_at=r["created_at"],
        )
        for r in rows
    ]


@router.post("/{action_item_id}/done")
def mark_done(action_item_id: int, payload: MarkDoneRequest) -> ActionItemResponse:
    """
    标记行动项完成状态

    Args:
        action_item_id: 行动项 ID
        payload: 包含完成状态的请求

    Returns:
        更新后的行动项

    Raises:
        HTTPException: 当行动项不存在时
    """
    # 验证行动项存在
    item = db.get_action_item(action_item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"行动项 ID {action_item_id} 不存在"
        )

    # 更新完成状态
    db.mark_action_item_done(action_item_id, payload.done)
    logger.info(f"行动项 {action_item_id} 完成状态更新为: {payload.done}")

    # 返回更新后的行动项
    return ActionItemResponse(
        id=item["id"],
        note_id=item["note_id"],
        text=item["text"],
        done=payload.done,
        created_at=item["created_at"],
    )

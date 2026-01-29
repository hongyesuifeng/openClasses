"""
笔记相关路由

提供笔记创建和查询的 API 端点。
"""
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException, status

from .. import db
from ..schemas import CreateNoteRequest, NoteResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(payload: CreateNoteRequest) -> NoteResponse:
    """
    创建新笔记

    Args:
        payload: 包含笔记内容的请求

    Returns:
        创建的笔记
    """
    note_id = db.insert_note(payload.content)
    note = db.get_note(note_id)
    logger.info(f"笔记已创建，ID: {note_id}")

    return NoteResponse(
        id=note["id"],
        content=note["content"],
        created_at=note["created_at"],
    )


@router.get("/{note_id}", response_model=NoteResponse)
def get_single_note(note_id: int) -> NoteResponse:
    """
    获取单个笔记

    Args:
        note_id: 笔记 ID

    Returns:
        笔记数据

    Raises:
        HTTPException: 当笔记不存在时
    """
    row = db.get_note(note_id)
    if row is None:
        logger.warning(f"笔记 ID {note_id} 不存在")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"笔记 ID {note_id} 不存在"
        )
    return NoteResponse(id=row["id"], content=row["content"], created_at=row["created_at"])


@router.get("", response_model=List[NoteResponse])
def list_notes() -> List[NoteResponse]:
    """
    列出所有笔记

    Returns:
        笔记列表，按创建时间倒序排列
    """
    rows = db.list_notes()
    return [
        NoteResponse(id=row["id"], content=row["content"], created_at=row["created_at"])
        for row in rows
    ]

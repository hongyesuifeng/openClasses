"""
FastAPI 应用主入口

初始化应用、配置路由和中间件。
"""
from __future__ import annotations

import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.requests import Request

from . import db
from .config import config
from .routers import action_items, notes

# 配置日志
logging.basicConfig(
    level=config.LOG_LEVEL,
    format=config.LOG_FORMAT,
)
logger = logging.getLogger(__name__)

# 初始化数据库
db.init_db()
logger.info("数据库初始化完成")

# 创建应用
app = FastAPI(
    title=config.API_TITLE,
    version=config.API_VERSION,
    description="从笔记中智能提取行动项的 API 服务",
)


# 全局异常处理
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """HTTP 异常处理器"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": exc.status_code,
            "detail": exc.detail,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """通用异常处理器"""
    logger.error(f"未处理的异常: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "detail": "内部服务器错误",
        },
    )


# 根路由 - 返回前端页面
@app.get("/", response_class=HTMLResponse)
def index() -> str:
    """返回前端 HTML 页面"""
    html_path = Path(__file__).resolve().parents[1] / "frontend" / "index.html"
    return html_path.read_text(encoding="utf-8")


# 健康检查端点
@app.get("/health")
def health_check():
    """健康检查端点"""
    return {
        "status": "healthy",
        "service": config.API_TITLE,
        "version": config.API_VERSION,
    }


# 注册路由
app.include_router(notes.router)
app.include_router(action_items.router)

# 挂载静态文件
static_dir = Path(__file__).resolve().parents[1] / "frontend"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

logger.info("应用启动完成")

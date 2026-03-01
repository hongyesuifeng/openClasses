"""
Game Dev Town - FastAPI 主入口
"""
import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.api.routes import router as api_router
from app.api.websocket import websocket_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时
    print(f"🎮 Game Dev Town 启动中...")
    print(f"📝 项目: {settings.game.name}")
    print(f"🤖 LLM 模型: {settings.llm.model}")
    print(f"🌐 服务地址: http://{settings.server.host}:{settings.server.port}")

    yield

    # 关闭时
    print("👋 Game Dev Town 关闭中...")


# 创建 FastAPI 应用
app = FastAPI(
    title="Game Dev Town API",
    description="游戏小镇 - AI Agent 协作开发游戏演示",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router, prefix="/api")
app.include_router(websocket_router, prefix="/ws")

# 挂载静态文件
frontend_path = Path(__file__).parent.parent.parent / "frontend"
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path)), name="static")


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Welcome to Game Dev Town API",
        "docs": "/docs",
        "game": settings.game.name,
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "model": settings.llm.model}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.server.host,
        port=settings.server.port,
        reload=settings.server.debug,
    )

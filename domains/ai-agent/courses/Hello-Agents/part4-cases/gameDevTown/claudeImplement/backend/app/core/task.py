"""
Game Dev Town - 任务系统
管理项目任务和进度
"""
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import uuid


class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"       # 待处理
    IN_PROGRESS = "in_progress"  # 进行中
    BLOCKED = "blocked"       # 阻塞
    REVIEW = "review"         # 审核中
    COMPLETED = "completed"   # 已完成
    CANCELLED = "cancelled"   # 已取消


class TaskPriority(Enum):
    """任务优先级"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class Task:
    """任务定义"""
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str = ""
    description: str = ""
    assignee: str = ""  # Agent 角色
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    dependencies: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    progress: int = 0  # 0-100
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "assignee": self.assignee,
            "status": self.status.value,
            "priority": self.priority.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "dependencies": self.dependencies,
            "tags": self.tags,
            "progress": self.progress,
            "metadata": self.metadata,
        }


class TaskSystem:
    """
    项目任务管理系统
    """

    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.task_history: List[Dict[str, Any]] = []

    def create_task(
        self,
        title: str,
        description: str,
        assignee: str,
        priority: TaskPriority = TaskPriority.MEDIUM,
        tags: Optional[List[str]] = None,
        dependencies: Optional[List[str]] = None,
    ) -> Task:
        """创建新任务"""
        task = Task(
            title=title,
            description=description,
            assignee=assignee,
            priority=priority,
            tags=tags or [],
            dependencies=dependencies or [],
        )
        self.tasks[task.id] = task
        self._log_task_change(task, "created")
        return task

    def update_task(
        self,
        task_id: str,
        status: Optional[TaskStatus] = None,
        progress: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Task]:
        """更新任务"""
        if task_id not in self.tasks:
            return None

        task = self.tasks[task_id]
        task.updated_at = datetime.now()

        if status:
            task.status = status
        if progress is not None:
            task.progress = min(100, max(0, progress))
        if metadata:
            task.metadata.update(metadata)

        self._log_task_change(task, "updated")
        return task

    def get_task(self, task_id: str) -> Optional[Task]:
        """获取任务"""
        return self.tasks.get(task_id)

    def get_tasks_by_assignee(self, assignee: str) -> List[Task]:
        """获取指定负责人的任务"""
        return [t for t in self.tasks.values() if t.assignee == assignee]

    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        """获取指定状态的任务"""
        return [t for t in self.tasks.values() if t.status == status]

    def get_pending_tasks(self) -> List[Task]:
        """获取待处理任务"""
        return self.get_tasks_by_status(TaskStatus.PENDING)

    def get_active_tasks(self) -> List[Task]:
        """获取进行中的任务"""
        return self.get_tasks_by_status(TaskStatus.IN_PROGRESS)

    def get_blocked_tasks(self) -> List[Task]:
        """获取阻塞的任务"""
        return self.get_tasks_by_status(TaskStatus.BLOCKED)

    def check_dependencies(self, task_id: str) -> Tuple[bool, List[str]]:
        """检查任务依赖是否满足"""
        task = self.tasks.get(task_id)
        if not task:
            return False, ["任务不存在"]

        unmet = []
        for dep_id in task.dependencies:
            dep_task = self.tasks.get(dep_id)
            if not dep_task or dep_task.status != TaskStatus.COMPLETED:
                unmet.append(dep_id)

        return len(unmet) == 0, unmet

    def get_project_progress(self) -> Dict[str, Any]:
        """获取项目整体进度"""
        if not self.tasks:
            return {"total": 0, "completed": 0, "progress": 0}

        total = len(self.tasks)
        completed = len([t for t in self.tasks.values() if t.status == TaskStatus.COMPLETED])
        avg_progress = sum(t.progress for t in self.tasks.values()) / total

        return {
            "total": total,
            "completed": completed,
            "in_progress": len(self.get_active_tasks()),
            "blocked": len(self.get_blocked_tasks()),
            "progress": round(avg_progress, 1),
            "completion_rate": round(completed / total * 100, 1) if total > 0 else 0,
        }

    def get_tasks_summary(self) -> Dict[str, Any]:
        """获取任务摘要"""
        by_status = {}
        for status in TaskStatus:
            by_status[status.value] = len(self.get_tasks_by_status(status))

        by_assignee = {}
        for task in self.tasks.values():
            if task.assignee not in by_assignee:
                by_assignee[task.assignee] = 0
            by_assignee[task.assignee] += 1

        return {
            "by_status": by_status,
            "by_assignee": by_assignee,
            "progress": self.get_project_progress(),
        }

    def _log_task_change(self, task: Task, action: str) -> None:
        """记录任务变更"""
        self.task_history.append({
            "task_id": task.id,
            "action": action,
            "timestamp": datetime.now().isoformat(),
            "status": task.status.value,
            "progress": task.progress,
        })

    def export_tasks(self) -> List[Dict[str, Any]]:
        """导出所有任务"""
        return [t.to_dict() for t in self.tasks.values()]

    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "tasks": self.export_tasks(),
            "summary": self.get_tasks_summary(),
        }

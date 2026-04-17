"""
任务系统 - Task System
负责创建、管理和追踪任务
"""

import time
import uuid
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class TaskStatus(Enum):
    """任务状态"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class TaskPriority(Enum):
    """任务优先级"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class Task:
    """任务"""
    id: str
    title: str
    description: str
    assignee: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    due_date: Optional[float] = None
    dependencies: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    progress: int = 0


class TaskSystem:
    """任务系统"""
    
    def __init__(self):
        self.tasks: Dict[str, Task] = {}
        self.task_counter = 0
    
    def create_task(
        self,
        title: str,
        description: str,
        assignee: Optional[str] = None,
        priority: TaskPriority = TaskPriority.MEDIUM,
        due_date: Optional[float] = None,
        dependencies: Optional[List[str]] = None,
        tags: Optional[List[str]] = None
    ) -> Task:
        """创建任务"""
        task_id = f"task_{uuid.uuid4().hex[:8]}"
        self.task_counter += 1
        
        task = Task(
            id=task_id,
            title=title,
            description=description,
            assignee=assignee,
            priority=priority,
            due_date=due_date,
            dependencies=dependencies or [],
            tags=tags or []
        )
        
        self.tasks[task_id] = task
        return task
    
    def get_task(self, task_id: str) -> Optional[Task]:
        """获取任务"""
        return self.tasks.get(task_id)
    
    def update_status(self, task_id: str, status: TaskStatus) -> Optional[Task]:
        """更新任务状态"""
        task = self.tasks.get(task_id)
        if task:
            task.status = status
            task.updated_at = time.time()
            if status == TaskStatus.COMPLETED:
                task.progress = 100
        return task
    
    def update_progress(self, task_id: str, progress: int) -> Optional[Task]:
        """更新任务进度"""
        task = self.tasks.get(task_id)
        if task:
            task.progress = min(100, max(0, progress))
            task.updated_at = time.time()
            if task.progress == 100:
                task.status = TaskStatus.COMPLETED
        return task
    
    def assign_task(self, task_id: str, assignee: str) -> Optional[Task]:
        """分配任务"""
        task = self.tasks.get(task_id)
        if task:
            task.assignee = assignee
            task.updated_at = time.time()
        return task
    
    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        """按状态获取任务"""
        return [t for t in self.tasks.values() if t.status == status]
    
    def get_tasks_by_assignee(self, assignee: str) -> List[Task]:
        """按负责人获取任务"""
        return [t for t in self.tasks.values() if t.assignee == assignee]
    
    def get_all_tasks(self) -> List[Task]:
        """获取所有任务"""
        return list(self.tasks.values())
    
    def get_task_summary(self) -> Dict[str, Any]:
        """获取任务摘要"""
        tasks = self.tasks.values()
        return {
            "total": len(tasks),
            "pending": len([t for t in tasks if t.status == TaskStatus.PENDING]),
            "in_progress": len([t for t in tasks if t.status == TaskStatus.IN_PROGRESS]),
            "completed": len([t for t in tasks if t.status == TaskStatus.COMPLETED]),
            "blocked": len([t for t in tasks if t.status == TaskStatus.BLOCKED]),
            "by_priority": {
                "critical": len([t for t in tasks if t.priority == TaskPriority.CRITICAL]),
                "high": len([t for t in tasks if t.priority == TaskPriority.HIGH]),
                "medium": len([t for t in tasks if t.priority == TaskPriority.MEDIUM]),
                "low": len([t for t in tasks if t.priority == TaskPriority.LOW])
            }
        }
    
    def can_start_task(self, task_id: str) -> bool:
        """检查任务是否可以开始（依赖是否完成）"""
        task = self.tasks.get(task_id)
        if not task:
            return False
        
        for dep_id in task.dependencies:
            dep_task = self.tasks.get(dep_id)
            if not dep_task or dep_task.status != TaskStatus.COMPLETED:
                return False
        return True
    
    def delete_task(self, task_id: str) -> bool:
        """删除任务"""
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False
    
    def export_tasks(self) -> List[Dict[str, Any]]:
        """导出任务数据"""
        return [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "assignee": t.assignee,
                "status": t.status.value,
                "priority": t.priority.value,
                "created_at": t.created_at,
                "updated_at": t.updated_at,
                "due_date": t.due_date,
                "dependencies": t.dependencies,
                "tags": t.tags,
                "progress": t.progress
            }
            for t in self.tasks.values()
        ]

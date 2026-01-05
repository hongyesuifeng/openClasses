# Reading 1: Observability's Three Pillars and AI Applications
# 可观测性三大支柱与 AI 应用

> **Week 9 Reading #1**
> **主题**: 深入理解可观测性的三大支柱及其在 AI 应用中的实践
> **预计阅读时间**: 75-90 分钟

---

## 📚 导读

在现代软件系统中，"可观测性" (Observability) 已经超越了传统的"监控" (Monitoring) 概念。特别是在 AI 驱动的应用中，我们需要更深入地理解系统行为。本文全面介绍可观测性的三大支柱——Metrics、Logs、Traces——以及如何利用 AI 技术提升可观测性能力，帮助你：

1. **理解核心概念** - 可观测性的三大支柱及其区别
2. **掌握工具栈** - Prometheus、Grafana、OpenTelemetry 等工具
3. **应用 AI 技术** - 使用 AI 进行异常检测和根因分析
4. **实践落地** - 在 AI 应用中实施完整的可观测性方案

---

## 🎯 学习目标

阅读完本文后，你应该能够：

- ✅ 理解可观测性的三大支柱及其各自的价值
- ✅ 掌握 RED 和 USE 方法论
- ✅ 实施结构化日志和分布式追踪
- ✅ 使用 AI 进行异常检测和根因分析
- ✅ 构建完整的可观测性平台

---

## 第一部分：可观测性基础

### 1. 什么是可观测性？

#### 定义

**可观测性 (Observability)**: 通过系统的外部输出（指标、日志、追踪）来推断系统内部状态的能力。

#### 与监控的区别

```python
# 监控 (Monitoring)
# 主动检查预定义的指标
class Monitoring:
    def __init__(self):
        self.metrics = ["cpu_usage", "memory_usage", "response_time"]

    def check(self):
        """检查预定义的指标是否超过阈值"""
        for metric in self.metrics:
            value = self.get_metric(metric)
            if value > self.get_threshold(metric):
                self.alert(f"{metric} exceeds threshold")

# 可观测性 (Observability)
# 通过数据理解系统内部状态
class Observability:
    def __init__(self):
        self.metrics = Metrics()    # 指标
        self.logs = Logs()           # 日志
        self.traces = Traces()       # 追踪

    def understand(self):
        """理解系统为什么会这样"""
        # 三大支柱结合，推断系统状态
        context = self.correlate(
            metrics=self.metrics.get_all(),
            logs=self.logs.search(),
            traces=self.traces.get_flow()
        )
        return self.analyze(context)
```

#### 核心价值

```
可观测性的价值:

1. 快速定位问题
   - 从"系统出错了"
   - 到"哪个服务、哪个接口、哪个逻辑出错了"

2. 理解系统行为
   - 不仅是"出问题了"
   - 而是"为什么会出问题"

3. 数据驱动决策
   - 不是靠猜测
   - 而是靠数据

4. 预防性维护
   - 不是被动响应
   - 而是主动预防
```

---

## 第二部分：三大支柱详解

### 1. Metrics (指标)

#### 定义

**Metrics**: 数值型的时间序列数据，表示系统在某个时间点的状态。

#### 关键特征

- **数值型**: 可以用数字表示
- **时间序列**: 随时间变化
- **聚合性**: 可以聚合（求和、平均等）
- **实时性**: 反映当前状态

#### 核心方法

##### RED 方法

```python
# RED 方法 - 适用于请求驱动的系统（如 Web 服务）
class REDMetrics:
    """
    Rate: 请求率 - 每秒请求数
    Errors: 错误率 - 失败请求的百分比
    Duration: 持续时间 - 请求处理时间
    """

    def __init__(self):
        self.rate = Rate()        # Requests per second
        self.errors = Errors()    # Error rate
        self.duration = Duration() # Response time

    def record_request(self, duration: float, success: bool):
        """记录一次请求"""
        self.rate.increment()
        if not success:
            self.errors.increment()
        self.duration.record(duration)

    def get_health(self) -> dict:
        """评估系统健康状态"""
        return {
            "requests_per_second": self.rate.get(),
            "error_rate": self.errors.get_rate(),
            "p50_latency": self.duration.percentile(50),
            "p95_latency": self.duration.percentile(95),
            "p99_latency": self.duration.percentile(99),
        }

# 使用示例
metrics = REDMetrics()

# 记录请求
start = time.time()
try:
    response = process_request()
    success = True
except Exception as e:
    success = False
finally:
    duration = time.time() - start
    metrics.record_request(duration, success)

# 获取健康状态
health = metrics.get_health()
print(f"QPS: {health['requests_per_second']}")
print(f"Error Rate: {health['error_rate']}")
print(f"P95 Latency: {health['p95_latency']}ms")
```

##### USE 方法

```python
# USE 方法 - 适用于资源驱动的系统（如数据库、缓存）
class USEMetrics:
    """
    Utilization: 使用率 - 资源使用百分比
    Saturation: 饱和度 - 资源有多忙
    Errors: 错误 - 资源错误计数
    """

    def __init__(self):
        self.utilization = {}  # 资源使用率
        self.saturation = {}   # 资源饱和度
        self.errors = {}       # 错误计数

    def record_cpu(self, used_percent: float, load_avg: float):
        """记录 CPU 指标"""
        self.utilization["cpu"] = used_percent
        self.saturation["cpu"] = load_avg

    def record_memory(self, used_gb: float, total_gb: float):
        """记录内存指标"""
        self.utilization["memory"] = (used_gb / total_gb) * 100

    def record_disk(self, used_gb: float, total_gb: float, io_wait: float):
        """记录磁盘指标"""
        self.utilization["disk"] = (used_gb / total_gb) * 100
        self.saturation["disk_io"] = io_wait

    def get_status(self) -> dict:
        """获取资源状态"""
        return {
            "cpu_utilization": self.utilization.get("cpu", 0),
            "cpu_saturation": self.saturation.get("cpu", 0),
            "memory_utilization": self.utilization.get("memory", 0),
            "disk_utilization": self.utilization.get("disk", 0),
            "disk_io_saturation": self.saturation.get("disk_io", 0),
        }

# 使用示例
use_metrics = USEMetrics()

# 监控资源
import psutil

use_metrics.record_cpu(
    used_percent=psutil.cpu_percent(),
    load_avg=psutil.getloadavg()[0]
)

use_metrics.record_memory(
    used_gb=psutil.virtual_memory().used / (1024**3),
    total_gb=psutil.virtual_memory().total / (1024**3)
)

status = use_metrics.get_status()
```

#### Prometheus 实战

```python
# Prometheus 客户端使用
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# 定义指标
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint']
)

active_connections = Gauge(
    'active_connections',
    'Number of active connections'
)

# 中间件使用
from functools import wraps
import time

def track_requests(func):
    """追踪请求的装饰器"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()

        # 增加活跃连接
        active_connections.inc()

        try:
            result = func(*args, **kwargs)
            status = "success"
            return result
        except Exception as e:
            status = "error"
            raise
        finally:
            # 记录请求
            duration = time.time() - start
            http_request_duration.labels(
                method="POST",
                endpoint="/api/chat",
            ).observe(duration)

            http_requests_total.labels(
                method="POST",
                endpoint="/api/chat",
                status=status
            ).inc()

            # 减少活跃连接
            active_connections.dec()

    return wrapper

# 启动 Prometheus 服务器
start_http_server(8000)

# 使用示例
@track_requests
def process_chat_request(message: str) -> str:
    """处理聊天请求"""
    # 业务逻辑
    return "AI response"
```

---

### 2. Logs (日志)

#### 定义

**Logs**: 离散的事件记录，包含时间戳和上下文信息。

#### 结构化日志

```python
# 传统日志 vs 结构化日志

# ❌ 传统日志（难以解析和查询）
print(f"User {user_id} logged in at {time.now()}")
print(f"ERROR: Database connection failed for user {user_id}")

# ✅ 结构化日志（易于解析和查询）
import structlog
import logging

# 配置 structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

# 使用结构化日志
logger = structlog.get_logger()

# 记录事件
logger.info(
    "user_login",
    user_id=123,
    ip_address="192.168.1.1",
    user_agent="Mozilla/5.0...",
    timestamp="2024-01-15T10:30:00Z"
)

# 输出（JSON 格式）:
{
  "event": "user_login",
  "user_id": 123,
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "logger": "__main__"
}

# 错误日志
logger.error(
    "database_error",
    error_type="ConnectionError",
    user_id=123,
    query="SELECT * FROM users WHERE id = 123",
    retry_attempt=1,
    max_retries=3,
    stack_trace="..."  # 自动添加
)
```

#### 日志级别和最佳实践

```python
# 日志级别使用指南
logger = structlog.get_logger()

# DEBUG: 详细的诊断信息
logger.debug(
    "ai_model_inference",
    model="gpt-4",
    input_tokens=150,
    max_tokens=1000,
    temperature=0.7,
    reasoning="选择了较低的 temperature 以保证稳定性"
)

# INFO: 一般的信息事件
logger.info(
    "request_completed",
    endpoint="/api/chat",
    method="POST",
    status_code=200,
    duration_ms=245,
    user_id=123
)

# WARNING: 警告事件（不影响功能但需要注意）
logger.warning(
    "high_response_time",
    endpoint="/api/chat",
    duration_ms=1500,
    threshold_ms=1000,
    impact="用户体验可能受影响"
)

# ERROR: 错误事件（功能失败但可以恢复）
logger.error(
    "ai_api_error",
    error_type="RateLimitError",
    endpoint="/api/chat",
    retry_after=60,
    user_id=123,
    action="切换到备用模型"
)

# CRITICAL: 严重错误（系统无法继续运行）
logger.critical(
    "database_connection_lost",
    error_type="ConnectionTimeout",
    retry_attempts=5,
    impact="所有数据库操作失败",
    action="需要立即人工介入"
)
```

#### 上下文信息

```python
# 添加请求上下文
from contextvars import ContextVar

request_context = ContextVar('request_context')

def log_with_context(**kwargs):
    """记录带有上下文的日志"""
    ctx = request_context.get({})
    logger.info(**kwargs, **ctx)

# 中间件：设置请求上下文
@app.middleware("http")
async def add_request_context(request: Request, call_next):
    """为每个请求添加上下文"""
    request_id = str(uuid.uuid4())

    # 设置上下文
    request_context.set({
        "request_id": request_id,
        "user_id": request.headers.get("X-User-ID"),
        "ip_address": request.client.host,
        "user_agent": request.headers.get("User-Agent"),
    })

    # 记录请求开始
    logger.info(
        "request_started",
        request_id=request_id,
        method=request.method,
        path=request.url.path
    )

    # 处理请求
    try:
        response = await call_next(request)
        logger.info(
            "request_completed",
            request_id=request_id,
            status_code=response.status_code
        )
        return response
    except Exception as e:
        logger.error(
            "request_failed",
            request_id=request_id,
            error=str(e),
            error_type=type(e).__name__
        )
        raise

# 在任何地方使用上下文日志
def some_function():
    log_with_context(
        event="ai_inference",
        model="gpt-4",
        # request_context 自动添加
    )
    # 输出会包含:
    # - event, model
    # - request_id, user_id, ip_address, user_agent
```

---

### 3. Traces (追踪)

#### 定义

**Traces**: 请求在分布式系统中的完整路径，展示请求如何流经多个服务。

#### 核心概念

```python
# Trace 的层次结构
"""
Trace (追踪)
  └── Span (跨度) - 单个服务的操作
        ├── Span ID - 唯一标识
        ├── Parent Span ID - 父 Span ID
        ├── Operation Name - 操作名称
        ├── Start Time - 开始时间
        ├── Duration - 持续时间
        └── Tags - 标签（元数据）
"""

# 示例：用户请求的完整追踪
"""
Trace: user_request_12345

┌─────────────────────────────────────────────────────────────┐
│ API Gateway (Span 1)                                        │
│ Duration: 1500ms                                            │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │ Auth Service (Span 2)                │                  │
│  │ Duration: 200ms                      │                  │
│  │ Parent: Span 1                       │                  │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  ┌──────────────────────────────────────┐                  │
│  │ AI Chat Service (Span 3)             │                  │
│  │ Duration: 1200ms                     │                  │
│  │ Parent: Span 1                       │                  │
│  │                                      │                  │
│  │  ┌────────────────────────────┐     │                  │
│  │  │ Database Query (Span 4)    │     │                  │
│  │  │ Duration: 150ms            │     │                  │
│  │  │ Parent: Span 3             │     │                  │
│  │  └────────────────────────────┘     │                  │
│  │                                      │                  │
│  │  ┌────────────────────────────┐     │                  │
│  │  │ OpenAI API Call (Span 5)   │     │                  │
│  │  │ Duration: 900ms            │     │                  │
│  │  │ Parent: Span 3             │     │                  │
│  │  └────────────────────────────┘     │                  │
│  │                                      │                  │
│  │  ┌────────────────────────────┐     │                  │
│  │  │ Cache Write (Span 6)       │     │                  │
│  │  │ Duration: 50ms             │     │                  │
│  │  │ Parent: Span 3             │     │                  │
│  │  └────────────────────────────┘     │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘

Total Duration: 1500ms
Bottleneck: OpenAI API Call (900ms, 60% of total time)
"""
```

#### OpenTelemetry 实现

```python
# OpenTelemetry 分布式追踪
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.resources import Resource

# 配置资源（服务信息）
resource = Resource(attributes={
    "service.name": "ai-chat-service",
    "service.version": "1.0.0",
    "deployment.environment": "production"
})

# 配置 Tracer
trace.set_tracer_provider(TracerProvider(resource=resource))
tracer = trace.get_tracer(__name__)

# 配置导出器（发送到 Jaeger）
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

jaeger_exporter = JaegerExporter(
    agent_host_name="localhost",
    agent_port=6831,
)

span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# 使用 Tracer
def process_chat_request(user_id: str, message: str) -> str:
    """处理聊天请求（带追踪）"""

    # 创建根 Span
    with tracer.start_as_current_span(
        "process_chat_request",
        attributes={
            "user.id": user_id,
            "message.length": len(message),
        }
    ) as parent_span:
        try:
            # Span 1: 验证用户
            with tracer.start_as_current_span("validate_user") as span:
                is_valid = validate_user(user_id)
                span.set_attribute("user.valid", is_valid)

                if not is_valid:
                    span.set_status(Status(StatusCode.ERROR))
                    raise ValueError("Invalid user")

            # Span 2: 获取历史消息
            with tracer.start_as_current_span("fetch_history") as span:
                history = fetch_chat_history(user_id)
                span.set_attribute("history.count", len(history))

            # Span 3: 调用 OpenAI API
            with tracer.start_as_current_span(
                "openai_api_call",
                attributes={
                    "model": "gpt-4",
                    "input.tokens": count_tokens(message + str(history))
                }
            ) as span:
                response = call_openai_api(message, history)

                # 记录响应详情
                span.set_attribute("output.tokens", response.usage.total_tokens)
                span.set_attribute("response.time", response.response_time)

            # Span 4: 保存到数据库
            with tracer.start_as_current_span("save_conversation") as span:
                save_conversation(user_id, message, response.text)

            return response.text

        except Exception as e:
            # 记录异常
            parent_span.record_exception(e)
            parent_span.set_status(Status(StatusCode.ERROR, str(e)))
            raise

# 追踪数据库查询
def fetch_chat_history(user_id: str) -> list:
    """获取聊天历史（带追踪）"""
    with tracer.start_as_current_span("db.query") as span:
        span.set_attribute("db.system", "postgresql")
        span.set_attribute("db.name", "chat_history")
        span.set_attribute("db.operation", "SELECT")

        start = time.time()
        try:
            result = db.execute(
                "SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10",
                user_id
            )
            duration = time.time() - start

            span.set_attribute("db.row_count", len(result))
            span.set_attribute("db.duration_ms", duration * 1000)

            return result
        except Exception as e:
            span.set_status(Status(StatusCode.ERROR))
            raise
```

---

## 第三部分：AI 在可观测性中的应用

### 1. 异常检测

#### Isolation Forest 算法

```python
# 使用机器学习检测指标异常
from sklearn.ensemble import IsolationForest
import numpy as np

class MetricsAnomalyDetector:
    """指标异常检测器"""

    def __init__(self, contamination=0.1):
        """
        contamination: 异常比例（预期有多少数据是异常的）
        """
        self.model = IsolationForest(
            contamination=contamination,
            random_state=42
        )
        self.is_trained = False

    def train(self, normal_metrics: list):
        """训练模型（使用正常数据）"""
        # normal_metrics 格式: [
        #     [cpu_usage, memory_usage, response_time, error_rate],
        #     ...
        # ]
        X = np.array(normal_metrics)
        self.model.fit(X)
        self.is_trained = True

    def detect(self, current_metrics: list) -> dict:
        """检测当前指标是否异常"""
        if not self.is_trained:
            return {"anomaly": False, "reason": "Model not trained"}

        X = np.array([current_metrics])
        prediction = self.model.predict(X)[0]  # 1=正常, -1=异常
        score = self.model.score_samples(X)[0]  # 异常分数

        is_anomaly = prediction == -1

        return {
            "anomaly": is_anomaly,
            "score": float(score),
            "metrics": current_metrics,
            "timestamp": time.time()
        }

# 使用示例
detector = MetricsAnomalyDetector(contamination=0.05)

# 收集正常数据训练模型
normal_data = [
    [45.2, 62.1, 120.5, 0.01],  # [cpu, memory, response_time, error_rate]
    [48.1, 65.3, 115.2, 0.00],
    [52.3, 68.9, 125.8, 0.02],
    # ... 更多正常数据
]
detector.train(normal_data)

# 实时检测
def monitor_system():
    """监控系统并检测异常"""
    while True:
        # 获取当前指标
        current = [
            get_cpu_usage(),
            get_memory_usage(),
            get_response_time(),
            get_error_rate()
        ]

        # 检测异常
        result = detector.detect(current)

        if result["anomaly"]:
            logger.critical(
                "anomaly_detected",
                score=result["score"],
                metrics=result["metrics"],
                alert="System behavior is abnormal!"
            )
            # 触发告警

        time.sleep(60)  # 每分钟检测一次

monitor_system()
```

#### 时间序列异常检测

```python
# 使用统计方法检测时间序列异常
import pandas as pd
from scipy import stats

class TimeSeriesAnomalyDetector:
    """时间序列异常检测器"""

    def __init__(self, window_size=100, threshold=3):
        """
        window_size: 滑动窗口大小
        threshold: 标准差阈值倍数
        """
        self.window_size = window_size
        self.threshold = threshold
        self.history = []

    def detect(self, value: float, timestamp: float) -> dict:
        """检测新值是否异常"""
        # 添加到历史
        self.history.append((timestamp, value))

        # 保持窗口大小
        if len(self.history) > self.window_size:
            self.history.pop(0)

        # 如果数据不足，无法检测
        if len(self.history) < self.window_size:
            return {"anomaly": False, "reason": "Insufficient data"}

        # 计算统计量
        values = [v for _, v in self.history]
        mean = np.mean(values)
        std = np.std(values)

        # 计算当前值的 Z-score
        z_score = abs((value - mean) / std) if std > 0 else 0

        # 判断是否异常
        is_anomaly = z_score > self.threshold

        return {
            "anomaly": is_anomaly,
            "z_score": z_score,
            "value": value,
            "mean": mean,
            "std": std,
            "timestamp": timestamp,
            "severity": "HIGH" if z_score > self.threshold * 1.5 else "MEDIUM"
        }

# 使用示例
detector = TimeSeriesAnomalyDetector(window_size=100, threshold=3)

# 监控响应时间
def monitor_response_time():
    """监控 API 响应时间"""
    while True:
        # 测量响应时间
        start = time.time()
        try:
            response = make_request()
            response_time = (time.time() - start) * 1000  # 毫秒
        except Exception as e:
            response_time = 5000  # 超时

        # 检测异常
        result = detector.detect(response_time, time.time())

        if result["anomaly"]:
            logger.warning(
                "response_time_anomaly",
                current=result["value"],
                expected=f"{result['mean']:.2f}±{result['std']:.2f}",
                z_score=result["z_score"],
                severity=result["severity"]
            )

            # 如果严重异常，触发告警
            if result["severity"] == "HIGH":
                send_alert(f"High response time: {result['value']:.2f}ms")

        time.sleep(10)  # 每 10 秒检测一次
```

---

### 2. 日志分析

#### 使用 LLM 分析错误日志

```python
# 使用 LLM 进行智能日志分析
import openai

class LogAnalyzer:
    """智能日志分析器"""

    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)

    def analyze_error(self, error_log: str, context: dict = None) -> dict:
        """分析错误日志"""

        prompt = f"""
分析以下错误日志，提供：
1. 错误类型
2. 可能的根本原因
3. 建议的修复方案
4. 严重程度评估（CRITICAL/HIGH/MEDIUM/LOW）

错误日志：
```
{error_log}
```

{f'上下文信息：{context}' if context else ''}

请以 JSON 格式返回，格式如下：
{{
    "error_type": "...",
    "root_cause": "...",
    "suggested_fix": "...",
    "severity": "...",
    "confidence": 0.0-1.0
}}
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "你是一个专业的软件工程师和系统管理员，擅长分析错误日志。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # 降低随机性
            )

            result = json.loads(response.choices[0].message.content)

            logger.info(
                "log_analysis_completed",
                error_type=result["error_type"],
                severity=result["severity"],
                confidence=result["confidence"]
            )

            return result

        except Exception as e:
            logger.error("log_analysis_failed", error=str(e))
            return {
                "error_type": "Unknown",
                "root_cause": "Analysis failed",
                "suggested_fix": "Manual review required",
                "severity": "MEDIUM",
                "confidence": 0.0
            }

# 使用示例
analyzer = LogAnalyzer(api_key=os.getenv("OPENAI_API_KEY"))

# 分析错误
error_log = """
Traceback (most recent call last):
  File "/app/main.py", line 45, in process_request
    response = openai.ChatCompletion.create(...)
  File "/app/venv/lib/python3.9/site-packages/openai/api_resources/chat/completion.py", line 25, in create
    response, _, api_key = requestor.request(...)
  File "/app/venv/lib/python3.9/site-packages/openai/api_requestor.py", line 298, in request
    raise error_type(err, resp)
openai.error.RateLimitError: Rate limit reached for requests

The above exception was the direct cause of the following exception:

...
"""

analysis = analyzer.analyze_error(
    error_log,
    context={
        "service": "ai-chat-service",
        "endpoint": "/api/chat",
        "recent_traffic": "500 requests/min",
    }
)

print(f"Error Type: {analysis['error_type']}")
print(f"Root Cause: {analysis['root_cause']}")
print(f"Suggested Fix: {analysis['suggested_fix']}")
print(f"Severity: {analysis['severity']}")
```

#### 日志模式识别

```python
# 自动识别日志模式
import re
from collections import defaultdict, Counter

class LogPatternAnalyzer:
    """日志模式分析器"""

    def __init__(self):
        self.patterns = defaultdict(int)
        self.templates = {}

    def extract_template(self, log_message: str) -> str:
        """提取日志模板（将变量替换为占位符）"""
        # 替换数字
        template = re.sub(r'\d+', '<NUM>', log_message)
        # 替换 UUID
        template = re.sub(
            r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
            '<UUID>',
            template
        )
        # 替换邮箱
        template = re.sub(r'\S+@\S+', '<EMAIL>', template)
        # 替换 URL
        template = re.sub(r'https?://\S+', '<URL>', template)
        # 替换文件路径
        template = re.sub(r'/[\w/.-]+', '<PATH>', template)
        # 替换 IP 地址
        template = re.sub(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', '<IP>', template)

        return template

    def add_log(self, log_message: str):
        """添加日志并更新模式统计"""
        template = self.extract_template(log_message)
        self.patterns[template] += 1

        # 保存示例
        if template not in self.templates:
            self.templates[template] = log_message

    def get_top_patterns(self, n=10) -> list:
        """获取最常见的 N 个模式"""
        sorted_patterns = sorted(
            self.patterns.items(),
            key=lambda x: x[1],
            reverse=True
        )

        return [
            {
                "template": template,
                "count": count,
                "example": self.templates[template]
            }
            for template, count in sorted_patterns[:n]
        ]

# 使用示例
analyzer = LogPatternAnalyzer()

# 分析日志流
log_lines = [
    "User 12345 logged in from 192.168.1.1",
    "User 67890 logged in from 192.168.1.2",
    "Request 550e8400-e29b-41d4-a716-446655440000 failed with status 500",
    "Request 6ba7b810-9dad-11d1-80b4-00c04fd430c8 failed with status 500",
    "Database connection to db.example.com:5432 timed out",
    "Database connection to db.example.com:5432 timed out",
    "API call to https://api.openai.com/v1/chat/completions failed",
]

for log in log_lines:
    analyzer.add_log(log)

# 获取常见模式
patterns = analyzer.get_top_patterns(5)

for i, pattern in enumerate(patterns, 1):
    print(f"\nPattern #{i} (Count: {pattern['count']})")
    print(f"Template: {pattern['template']}")
    print(f"Example: {pattern['example']}")

# 输出:
# Pattern #1 (Count: 3)
# Template: User <NUM> logged in from <IP>
# Example: User 12345 logged in from 192.168.1.1
#
# Pattern #2 (Count: 2)
# Template: Database connection to <PATH>:<NUM> timed out
# Example: Database connection to db.example.com:5432 timed out
```

---

### 3. Trace 分析

#### 性能瓶颈识别

```python
# 分析追踪数据，识别性能瓶颈
class TraceAnalyzer:
    """追踪分析器"""

    def __init__(self):
        self.traces = []

    def add_trace(self, trace_data: dict):
        """添加追踪数据"""
        self.traces.append(trace_data)

    def analyze_bottlenecks(self) -> list:
        """分析性能瓶颈"""
        bottlenecks = []

        for trace in self.traces:
            # 分析每个 Span
            for span in trace["spans"]:
                duration = span["duration_ms"]

                # 如果持续时间超过阈值，视为瓶颈
                if duration > 500:  # 500ms
                    bottlenecks.append({
                        "trace_id": trace["trace_id"],
                        "span_name": span["name"],
                        "duration_ms": duration,
                        "percentage_of_total": (duration / trace["total_duration"]) * 100,
                        "service": span.get("service", "unknown"),
                        "attributes": span.get("attributes", {})
                    })

        # 按持续时间排序
        bottlenecks.sort(key=lambda x: x["duration_ms"], reverse=True)
        return bottlenecks

    def get_slowest_operations(self, n=10) -> list:
        """获取最慢的 N 个操作"""
        all_spans = []

        for trace in self.traces:
            for span in trace["spans"]:
                all_spans.append({
                    "operation": span["name"],
                    "duration_ms": span["duration_ms"],
                    "service": span.get("service", "unknown"),
                    "trace_id": trace["trace_id"]
                })

        # 排序并返回前 N 个
        all_spans.sort(key=lambda x: x["duration_ms"], reverse=True)
        return all_spans[:n]

# 使用示例
analyzer = TraceAnalyzer()

# 添加追踪数据
analyzer.add_trace({
    "trace_id": "trace-123",
    "total_duration": 1500,
    "spans": [
        {
            "name": "api_gateway",
            "duration_ms": 1500,
            "service": "api-gateway"
        },
        {
            "name": "auth_service",
            "duration_ms": 200,
            "service": "auth-service"
        },
        {
            "name": "openai_api_call",
            "duration_ms": 900,
            "service": "ai-service",
            "attributes": {
                "model": "gpt-4",
                "input_tokens": 150,
                "output_tokens": 300
            }
        },
        {
            "name": "db_query",
            "duration_ms": 350,
            "service": "ai-service"
        }
    ]
})

# 分析瓶颈
bottlenecks = analyzer.analyze_bottlenecks()

print("Performance Bottlenecks:")
for i, bottleneck in enumerate(bottlenecks, 1):
    print(f"\n{i}. {bottleneck['span_name']}")
    print(f"   Duration: {bottleneck['duration_ms']}ms")
    print(f"   Percentage: {bottleneck['percentage_of_total']:.1f}%")
    print(f"   Service: {bottleneck['service']}")

# 输出:
# Performance Bottlenecks:
#
# 1. openai_api_call
#    Duration: 900ms
#    Percentage: 60.0%
#    Service: ai-service
#
# 2. db_query
#    Duration: 350ms
#    Percentage: 23.3%
#    Service: ai-service
```

---

## 📊 知识检查

### 自我评估问题

1. **可观测性的三大支柱是什么？它们各自的作用是什么？**

2. **RED 方法和 USE 方法分别适用于什么场景？**

3. **如何使用结构化日志提升日志查询和分析效率？**

4. **分布式追踪如何帮助识别性能瓶颈？**

5. **如何使用机器学习检测指标异常？**

6. **LLM 如何帮助分析错误日志？**

---

## 📚 延伸阅读

### 资源

1. [Google SRE Book - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
2. [OpenTelemetry Documentation](https://opentelemetry.io/docs)
3. [Prometheus Best Practices](https://prometheus.io/docs/practices/)

### 工具

1. **Prometheus**: 开源监控系统
2. **Grafana**: 可视化仪表板
3. **Jaeger**: 分布式追踪平台
4. **Loki**: 日志聚合系统

---

**下一阅读**: [自动化事件响应与自愈合系统](./02-automated-incident-response-and-self-healing.md)

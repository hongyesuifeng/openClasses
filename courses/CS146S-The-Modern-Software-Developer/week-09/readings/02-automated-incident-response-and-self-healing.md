# Reading 2: Automated Incident Response and Self-Healing Systems
# 自动化事件响应与自愈合系统

> **Week 9 Reading #2**
> **主题**: 掌握 AI 驱动的自动化事件响应和自愈合系统设计
> **预计阅读时间**: 75-90 分钟

---

## 📚 导读

传统的事件响应是"发现问题 → 人工诊断 → 手动修复"的漫长过程。在 AI 时代，我们可以构建自愈合系统，实现"检测 → 分析 → 修复 → 验证"的全自动化流程。本文全面介绍自动化事件响应的完整体系，帮助你：

1. **理解流程** - 事件响应的五个阶段
2. **设计系统** - 自愈合系统的架构设计
3. **实现自动化** - AI 驱动的决策和执行
4. **实践落地** - 真实场景的完整实现

---

## 🎯 学习目标

阅读完本文后，你应该能够：

- ✅ 理解事件响应的完整生命周期
- ✅ 设计自愈合系统的架构
- ✅ 实现 AI 驱动的自动化修复
- ✅ 构建安全的自动化事件响应平台
- ✅ 在生产环境中实施自愈合能力

---

## 第一部分：自动化事件响应的五个阶段

### 完整流程图

```python
"""
自动化事件响应的五阶段流程:

┌─────────────────────────────────────────────────────────────┐
│ 阶段 1: 检测 (Detect)                                       │
│ - 监控系统和应用                                            │
│ - 识别异常和故障                                            │
│ - 评估影响范围                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 阶段 2: 分类 (Classify)                                     │
│ - 确定事件类型                                              │
│ - 评估严重程度 (CRITICAL/HIGH/MEDIUM/LOW)                   │
│ - 判断影响范围和优先级                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 阶段 3: 决策 (Decide)                                       │
│ - AI 分析根本原因                                            │
│ - 评估修复方案                                              │
│ - 选择最佳策略                                              │
│ - 验证安全性                                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 阶段 4: 执行 (Execute)                                      │
│ - 执行自动化修复                                            │
│ - 协调多个服务                                              │
│ - 应用配置变更                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 阶段 5: 验证 (Verify)                                       │
│ - 确认问题已解决                                            │
│ - 验证系统健康度                                            │
│ - 记录事件和处理过程                                         │
└─────────────────────────────────────────────────────────────┘
"""

class AutomatedIncidentResponse:
    """自动化事件响应系统"""

    def __init__(self):
        self.detector = AnomalyDetector()      # 阶段 1
        self.classifier = EventClassifier()    # 阶段 2
        self.decider = AIDecisionEngine()      # 阶段 3
        self.executor = AutomationExecutor()   # 阶段 4
        self.verifier = HealthVerifier()       # 阶段 5

    def handle_incident(self, event: dict) -> dict:
        """处理事件（完整流程）"""

        # 阶段 1: 检测
        detection = self.detector.detect(event)
        if not detection["is_anomaly"]:
            return {"action": "none", "reason": "Not an anomaly"}

        # 阶段 2: 分类
        classification = self.classifier.classify(event, detection)

        # 阶段 3: 决策
        decision = self.decider.decide(event, classification)

        if decision["confidence"] < 0.8:
            # 置信度低，需要人工介入
            return {
                "action": "human_intervention",
                "reason": "Low confidence",
                "decision": decision
            }

        # 阶段 4: 执行
        execution = self.executor.execute(decision)

        # 阶段 5: 验证
        verification = self.verifier.verify(event, execution)

        return {
            "action": "auto_remediated",
            "detection": detection,
            "classification": classification,
            "decision": decision,
            "execution": execution,
            "verification": verification
        }
```

---

## 第二部分：阶段详解

### 阶段 1: 检测 (Detect)

#### 异常检测实现

```python
class AnomalyDetector:
    """异常检测器"""

    def __init__(self):
        self.metrics_history = []
        self.anomaly_thresholds = {
            "error_rate": 0.05,        # 错误率 > 5%
            "latency_p95": 1000,       # P95 延迟 > 1s
            "cpu_usage": 90,           # CPU 使用率 > 90%
            "memory_usage": 85,        # 内存使用率 > 85%
        }

    def detect(self, event: dict) -> dict:
        """检测事件是否异常"""

        metrics = event.get("metrics", {})
        anomalies = []

        # 检查错误率
        if "error_rate" in metrics:
            error_rate = metrics["error_rate"]
            if error_rate > self.anomaly_thresholds["error_rate"]:
                anomalies.append({
                    "metric": "error_rate",
                    "value": error_rate,
                    "threshold": self.anomaly_thresholds["error_rate"],
                    "severity": "HIGH" if error_rate > 0.1 else "MEDIUM"
                })

        # 检查延迟
        if "latency_p95" in metrics:
            latency_p95 = metrics["latency_p95"]
            if latency_p95 > self.anomaly_thresholds["latency_p95"]:
                anomalies.append({
                    "metric": "latency_p95",
                    "value": latency_p95,
                    "threshold": self.anomaly_thresholds["latency_p95"],
                    "severity": "HIGH" if latency_p95 > 2000 else "MEDIUM"
                })

        # 检查资源使用
        for resource in ["cpu_usage", "memory_usage"]:
            if resource in metrics:
                value = metrics[resource]
                if value > self.anomaly_thresholds[resource]:
                    anomalies.append({
                        "metric": resource,
                        "value": value,
                        "threshold": self.anomaly_thresholds[resource],
                        "severity": "HIGH" if value > 95 else "MEDIUM"
                    })

        # 判断是否异常
        is_anomaly = len(anomalies) > 0

        return {
            "is_anomaly": is_anomaly,
            "anomalies": anomalies,
            "timestamp": time.time()
        }

# 使用示例
detector = AnomalyDetector()

event = {
    "service": "ai-chat-service",
    "metrics": {
        "error_rate": 0.12,      # 12% 错误率（异常）
        "latency_p95": 850,      # 850ms 延迟（正常）
        "cpu_usage": 92,         # 92% CPU（异常）
        "memory_usage": 78,      # 78% 内存（正常）
    }
}

detection = detector.detect(event)

if detection["is_anomaly"]:
    print(f"发现异常！")
    for anomaly in detection["anomalies"]:
        print(f"  - {anomaly['metric']}: {anomaly['value']} (阈值: {anomaly['threshold']})")
        print(f"    严重程度: {anomaly['severity']}")
```

---

### 阶段 2: 分类 (Classify)

#### 事件分类器

```python
class EventClassifier:
    """事件分类器"""

    def __init__(self):
        self.event_types = {
            "high_error_rate": "error_rate > 0.1",
            "high_latency": "latency_p95 > 1000ms",
            "resource_exhaustion": "cpu_usage > 90% or memory_usage > 85%",
            "service_down": "health_check == false",
            "api_rate_limit": "error_type == 'RateLimitError'",
            "database_connection": "error_type == 'ConnectionError'",
        }

        self.severity_matrix = {
            ("high_error_rate", True): "CRITICAL",     # 高错误率 + 影响用户 = CRITICAL
            ("high_error_rate", False): "HIGH",        # 高错误率 + 不影响用户 = HIGH
            ("high_latency", True): "HIGH",            # 高延迟 + 影响用户 = HIGH
            ("high_latency", False): "MEDIUM",         # 高延迟 + 不影响用户 = MEDIUM
            ("resource_exhaustion", True): "HIGH",     # 资源耗尽 + 影响用户 = HIGH
            ("service_down", True): "CRITICAL",        # 服务宕机 = CRITICAL
            ("api_rate_limit", True): "MEDIUM",        # API 限流 = MEDIUM
        }

    def classify(self, event: dict, detection: dict) -> dict:
        """分类事件"""

        anomalies = detection["anomalies"]
        affects_users = event.get("affects_users", True)

        # 确定事件类型
        event_type = self._determine_event_type(anomalies, event)

        # 确定严重程度
        severity = self._determine_severity(event_type, affects_users)

        # 确定影响范围
        impact = self._assess_impact(event, detection)

        # 确定优先级
        priority = self._calculate_priority(severity, impact)

        return {
            "event_type": event_type,
            "severity": severity,
            "impact": impact,
            "priority": priority,
            "affects_users": affects_users,
            "requires_immediate_action": severity in ["CRITICAL", "HIGH"],
        }

    def _determine_event_type(self, anomalies: list, event: dict) -> str:
        """确定事件类型"""

        # 检查特定错误类型
        if "error_type" in event:
            error_type = event["error_type"]
            if error_type == "RateLimitError":
                return "api_rate_limit"
            elif error_type == "ConnectionError":
                return "database_connection"

        # 基于异常指标判断
        for anomaly in anomalies:
            metric = anomaly["metric"]
            if metric == "error_rate":
                return "high_error_rate"
            elif metric == "latency_p95":
                return "high_latency"
            elif metric in ["cpu_usage", "memory_usage"]:
                return "resource_exhaustion"

        # 检查服务健康状态
        if event.get("health_check") == False:
            return "service_down"

        return "unknown"

    def _determine_severity(self, event_type: str, affects_users: bool) -> str:
        """确定严重程度"""
        key = (event_type, affects_users)
        return self.severity_matrix.get(key, "MEDIUM")

    def _assess_impact(self, event: dict, detection: dict) -> dict:
        """评估影响范围"""

        service = event.get("service", "unknown")
        affected_users = event.get("affected_users_count", 0)

        # 估算业务影响
        if affected_users > 1000:
            business_impact = "HIGH"
        elif affected_users > 100:
            business_impact = "MEDIUM"
        else:
            business_impact = "LOW"

        return {
            "service": service,
            "affected_users": affected_users,
            "business_impact": business_impact,
            "estimated_revenue_loss": self._estimate_revenue_loss(event),
        }

    def _estimate_revenue_loss(self, event: dict) -> float:
        """估算收入损失（示例）"""
        # 这里可以使用更复杂的模型
        affected_users = event.get("affected_users_count", 0)
        downtime_hours = event.get("downtime_hours", 0)
        avg_revenue_per_user_per_hour = 0.1  # 示例值

        return affected_users * downtime_hours * avg_revenue_per_user_per_hour

    def _calculate_priority(self, severity: str, impact: dict) -> int:
        """计算优先级（1-10，10 最高）"""

        base_priority = {
            "CRITICAL": 9,
            "HIGH": 7,
            "MEDIUM": 5,
            "LOW": 3,
        }[severity]

        business_impact = impact["business_impact"]
        if business_impact == "HIGH":
            base_priority = min(10, base_priority + 1)
        elif business_impact == "LOW":
            base_priority = max(1, base_priority - 1)

        return base_priority

# 使用示例
classifier = EventClassifier()

classification = classifier.classify(event, detection)

print(f"事件类型: {classification['event_type']}")
print(f"严重程度: {classification['severity']}")
print(f"影响范围: {classification['impact']}")
print(f"优先级: {classification['priority']}/10")
print(f"需要立即行动: {classification['requires_immediate_action']}")
```

---

### 阶段 3: 决策 (Decide)

#### AI 决策引擎

```python
class AIDecisionEngine:
    """AI 决策引擎"""

    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.remediation_strategies = {
            "high_error_rate": [
                "restart_service",
                "rollback_deployment",
                "scale_up",
            ],
            "high_latency": [
                "scale_up",
                "optimize_database",
                "enable_caching",
            ],
            "resource_exhaustion": [
                "scale_up",
                "restart_service",
                "cleanup_resources",
            ],
            "api_rate_limit": [
                "implement_exponential_backoff",
                "switch_to_backup_provider",
                "enable_caching",
            ],
            "database_connection": [
                "restart_database",
                "switch_to_standby",
                "enable_connection_pooling",
            ],
        }

    def decide(self, event: dict, classification: dict) -> dict:
        """AI 驱动的决策"""

        # 获取可能的策略
        event_type = classification["event_type"]
        possible_strategies = self.remediation_strategies.get(event_type, [])

        # 构建决策 Prompt
        prompt = self._build_decision_prompt(event, classification, possible_strategies)

        # 调用 AI
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的 SRE 工程师，负责决策事件响应策略。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.2,  # 低温度，减少随机性
                response_format={"type": "json_object"}
            )

            decision = json.loads(response.choices[0].message.content)

            # 验证决策安全性
            safety_check = self._safety_check(decision, event)

            return {
                "strategy": decision["strategy"],
                "reasoning": decision["reasoning"],
                "steps": decision["steps"],
                "estimated_success_rate": decision.get("estimated_success_rate", 0.8),
                "confidence": decision.get("confidence", 0.8),
                "safety_check": safety_check,
            }

        except Exception as e:
            logger.error("ai_decision_failed", error=str(e))
            # 降级到规则引擎
            return self._rule_based_decision(event, classification)

    def _build_decision_prompt(self, event: dict, classification: dict, strategies: list) -> str:
        """构建决策 Prompt"""

        return f"""
分析以下事件，推荐最佳的修复策略：

事件信息：
- 服务: {event.get('service', 'unknown')}
- 事件类型: {classification['event_type']}
- 严重程度: {classification['severity']}
- 影响用户: {classification['affects_users']}
- 受影响用户数: {classification['impact']['affected_users']}

可用的修复策略：
{json.dumps(strategies, ensure_ascii=False)}

当前状态：
- 错误率: {event.get('metrics', {}).get('error_rate', 'N/A')}
- P95 延迟: {event.get('metrics', {}).get('latency_p95', 'N/A')}ms
- CPU 使用率: {event.get('metrics', {}).get('cpu_usage', 'N/A')}%
- 内存使用率: {event.get('metrics', {}).get('memory_usage', 'N/A')}%

请提供：
1. 推荐的策略（从上述策略中选择一个）
2. 理由（为什么选择这个策略）
3. 执行步骤（详细的执行步骤）
4. 预估成功率（0-1）
5. 置信度（0-1）

以 JSON 格式返回：
{{
    "strategy": "策略名称",
    "reasoning": "理由",
    "steps": ["步骤1", "步骤2", ...],
    "estimated_success_rate": 0.9,
    "confidence": 0.85
}}
"""

    def _safety_check(self, decision: dict, event: dict) -> dict:
        """安全检查"""

        checks = []

        # 检查 1: 是否会影响其他服务
        strategy = decision["strategy"]
        if strategy in ["scale_up", "restart_service"]:
            checks.append({
                "check": "impact_on_other_services",
                "status": "safe" if event.get("can_scale_safely", True) else "risky",
                "reason": "需要检查资源可用性"
            })

        # 检查 2: 是否会导致数据丢失
        if strategy == "rollback_deployment":
            checks.append({
                "check": "data_loss_risk",
                "status": "safe",
                "reason": "回滚不会导致数据丢失"
            })

        # 检查 3: 是否可以回滚
        checks.append({
            "check": "rollback_possible",
            "status": "safe",
            "reason": "所有操作都可以回滚"
        })

        # 综合判断
        all_safe = all(c["status"] == "safe" for c in checks)

        return {
            "overall_status": "safe" if all_safe else "risky",
            "checks": checks,
            "can_proceed": all_safe
        }

    def _rule_based_decision(self, event: dict, classification: dict) -> dict:
        """基于规则的决策（降级方案）"""

        event_type = classification["event_type"]
        severity = classification["severity"]

        # 简单的规则引擎
        if event_type == "high_error_rate" and severity == "CRITICAL":
            strategy = "rollback_deployment"
            reasoning = "严重错误率，立即回滚到上一个稳定版本"
        elif event_type == "resource_exhaustion":
            strategy = "scale_up"
            reasoning = "资源耗尽，扩容以增加容量"
        elif event_type == "api_rate_limit":
            strategy = "implement_exponential_backoff"
            reasoning = "API 限流，实施指数退避"
        else:
            strategy = "restart_service"
            reasoning = "默认策略：重启服务"

        return {
            "strategy": strategy,
            "reasoning": reasoning,
            "steps": ["执行 " + strategy],
            "estimated_success_rate": 0.7,
            "confidence": 0.7,
            "safety_check": {"overall_status": "safe", "can_proceed": True},
            "decision_method": "rule_based"
        }

# 使用示例
decider = AIDecisionEngine(api_key=os.getenv("OPENAI_API_KEY"))

decision = decider.decide(event, classification)

print(f"推荐策略: {decision['strategy']}")
print(f"理由: {decision['reasoning']}")
print(f"执行步骤: {decision['steps']}")
print(f"预估成功率: {decision['estimated_success_rate']}")
print(f"置信度: {decision['confidence']}")
print(f"安全检查: {decision['safety_check']['overall_status']}")
```

---

### 阶段 4: 执行 (Execute)

#### 自动化执行器

```python
class AutomationExecutor:
    """自动化执行器"""

    def __init__(self):
        self.kubernetes_client = self._init_kubernetes()
        self.remediation_scripts = {
            "restart_service": self.restart_service,
            "scale_up": self.scale_up,
            "rollback_deployment": self.rollback_deployment,
            "implement_exponential_backoff": self.implement_exponential_backoff,
            "switch_to_backup_provider": self.switch_to_backup_provider,
        }

    def execute(self, decision: dict) -> dict:
        """执行修复策略"""

        strategy = decision["strategy"]
        steps = decision.get("steps", [])

        execution_log = []

        try:
            # 记录执行开始
            execution_log.append({
                "step": 0,
                "action": "start",
                "message": f"开始执行策略: {strategy}",
                "timestamp": time.time()
            })

            # 执行策略
            if strategy in self.remediation_scripts:
                result = self.remediation_scripts[strategy]()
                execution_log.append({
                    "step": 1,
                    "action": "execute",
                    "message": f"执行 {strategy}",
                    "result": result,
                    "timestamp": time.time()
                })
            else:
                raise ValueError(f"Unknown strategy: {strategy}")

            # 执行额外步骤
            for i, step in enumerate(steps, start=2):
                execution_log.append({
                    "step": i,
                    "action": "additional_step",
                    "message": step,
                    "timestamp": time.time()
                })

            return {
                "status": "success",
                "strategy": strategy,
                "execution_log": execution_log,
                "duration": time.time() - execution_log[0]["timestamp"]
            }

        except Exception as e:
            logger.error("execution_failed", strategy=strategy, error=str(e))
            return {
                "status": "failed",
                "strategy": strategy,
                "error": str(e),
                "execution_log": execution_log
            }

    def restart_service(self) -> dict:
        """重启服务"""

        # 使用 Kubernetes API 重启 Pod
        namespace = "default"
        deployment = "ai-chat-service"

        # 执行滚动重启
        self.kubernetes_client.patch_namespaced_deployment(
            name=deployment,
            namespace=namespace,
            body={
                "spec": {
                    "template": {
                        "metadata": {
                            "annotations": {
                                "kubectl.kubernetes.io/restartedAt": time.time()
                            }
                        }
                    }
                }
            }
        )

        return {
            "action": "restart_service",
            "deployment": deployment,
            "namespace": namespace
        }

    def scale_up(self) -> dict:
        """扩容"""

        namespace = "default"
        deployment = "ai-chat-service"

        # 获取当前副本数
        current_deployment = self.kubernetes_client.read_namespaced_deployment(
            name=deployment,
            namespace=namespace
        )
        current_replicas = current_deployment.spec.replicas

        # 增加副本数
        new_replicas = current_replicas + 2

        self.kubernetes_client.patch_namespaced_deployment_scale(
            name=deployment,
            namespace=namespace,
            body={"spec": {"replicas": new_replicas}}
        )

        return {
            "action": "scale_up",
            "from_replicas": current_replicas,
            "to_replicas": new_replicas
        }

    def rollback_deployment(self) -> dict:
        """回滚部署"""

        namespace = "default"
        deployment = "ai-chat-service"

        # 获取上一个版本
        # 实际实现中，应该从部署历史中选择

        # 执行回滚
        self.kubernetes_client.rollback_deployment(
            name=deployment,
            namespace=namespace
        )

        return {
            "action": "rollback_deployment",
            "deployment": deployment
        }

    def implement_exponential_backoff(self) -> dict:
        """实施指数退避"""

        # 更新配置
        config = {
            "retry": {
                "max_attempts": 5,
                "initial_delay": 1000,  # 1秒
                "max_delay": 60000,     # 60秒
                "exponential_base": 2   # 指数增长
            }
        }

        # 更新服务配置（示例）
        # 实际实现中，可能需要更新配置中心或环境变量

        return {
            "action": "implement_exponential_backoff",
            "config": config
        }

    def _init_kubernetes(self):
        """初始化 Kubernetes 客户端"""
        from kubernetes import client, config

        try:
            config.load_incluster_config()
        except:
            config.load_kube_config()

        return client.AppsV1Api()

# 使用示例
executor = AutomationExecutor()

execution = executor.execute(decision)

print(f"执行状态: {execution['status']}")
print(f"执行时长: {execution['duration']:.2f}秒")

for log in execution['execution_log']:
    print(f"  [{log['step']}] {log['message']}")
```

---

### 阶段 5: 验证 (Verify)

#### 健康验证器

```python
class HealthVerifier:
    """健康验证器"""

    def __init__(self):
        self.verification_checks = {
            "error_rate": self._verify_error_rate,
            "latency": self._verify_latency,
            "resource_usage": self._verify_resource_usage,
            "service_health": self._verify_service_health,
        }

    def verify(self, original_event: dict, execution: dict) -> dict:
        """验证修复是否成功"""

        if execution["status"] != "success":
            return {
                "verification_status": "failed",
                "reason": "Execution failed"
            }

        verification_results = {}

        # 执行所有验证检查
        for check_name, check_func in self.verification_checks.items():
            try:
                result = check_func(original_event)
                verification_results[check_name] = result
            except Exception as e:
                verification_results[check_name] = {
                    "status": "error",
                    "error": str(e)
                }

        # 综合判断
        all_passed = all(
            r.get("status") == "passed"
            for r in verification_results.values()
        )

        return {
            "verification_status": "passed" if all_passed else "failed",
            "checks": verification_results,
            "timestamp": time.time()
        }

    def _verify_error_rate(self, event: dict) -> dict:
        """验证错误率是否恢复正常"""

        original_error_rate = event.get("metrics", {}).get("error_rate", 0)
        threshold = 0.05  # 5%

        # 获取当前错误率（实际实现中应该查询监控系统）
        current_error_rate = self._get_current_error_rate()

        passed = current_error_rate < threshold

        return {
            "status": "passed" if passed else "failed",
            "metric": "error_rate",
            "original": original_error_rate,
            "current": current_error_rate,
            "threshold": threshold,
            "improvement": original_error_rate - current_error_rate
        }

    def _verify_latency(self, event: dict) -> dict:
        """验证延迟是否恢复正常"""

        original_latency = event.get("metrics", {}).get("latency_p95", 0)
        threshold = 1000  # 1000ms

        # 获取当前延迟
        current_latency = self._get_current_latency()

        passed = current_latency < threshold

        return {
            "status": "passed" if passed else "failed",
            "metric": "latency_p95",
            "original": original_latency,
            "current": current_latency,
            "threshold": threshold,
            "improvement": original_latency - current_latency
        }

    def _verify_resource_usage(self, event: dict) -> dict:
        """验证资源使用是否正常"""

        # 获取当前资源使用
        current_cpu = self._get_current_cpu_usage()
        current_memory = self._get_current_memory_usage()

        cpu_passed = current_cpu < 90
        memory_passed = current_memory < 85

        return {
            "status": "passed" if cpu_passed and memory_passed else "failed",
            "cpu": {
                "current": current_cpu,
                "status": "passed" if cpu_passed else "failed"
            },
            "memory": {
                "current": current_memory,
                "status": "passed" if memory_passed else "failed"
            }
        }

    def _verify_service_health(self, event: dict) -> dict:
        """验证服务健康状态"""

        service = event.get("service", "unknown")

        # 执行健康检查
        health_check_passed = self._perform_health_check(service)

        return {
            "status": "passed" if health_check_passed else "failed",
            "service": service,
            "health_check": health_check_passed
        }

    def _get_current_error_rate(self) -> float:
        """获取当前错误率（模拟）"""
        # 实际实现中，应该查询 Prometheus 或其他监控系统
        return 0.02

    def _get_current_latency(self) -> float:
        """获取当前延迟（模拟）"""
        # 实际实现中，应该查询 Prometheus 或其他监控系统
        return 450.0

    def _get_current_cpu_usage(self) -> float:
        """获取当前 CPU 使用率（模拟）"""
        return 65.0

    def _get_current_memory_usage(self) -> float:
        """获取当前内存使用率（模拟）"""
        return 72.0

    def _perform_health_check(self, service: str) -> bool:
        """执行健康检查"""
        # 实际实现中，应该调用服务的健康检查端点
        return True

# 使用示例
verifier = HealthVerifier()

verification = verifier.verify(event, execution)

print(f"验证状态: {verification['verification_status']}")

for check_name, result in verification['checks'].items():
    print(f"  {check_name}: {result['status']}")
```

---

## 第三部分：完整的自愈合系统

### 系统架构

```python
class SelfHealingSystem:
    """完整的自愈合系统"""

    def __init__(self):
        # 五个阶段
        self.detector = AnomalyDetector()
        self.classifier = EventClassifier()
        self.decider = AIDecisionEngine(api_key=os.getenv("OPENAI_API_KEY"))
        self.executor = AutomationExecutor()
        self.verifier = HealthVerifier()

        # 事件存储
        self.events_db = EventDatabase()

        # 告警系统
        self.alerting = AlertingSystem()

    def run(self):
        """运行自愈合系统（持续监控）"""

        logger.info("self_healing_system_started")

        while True:
            try:
                # 获取最新指标
                metrics = self._collect_metrics()

                # 构建事件
                event = {
                    "service": "ai-chat-service",
                    "metrics": metrics,
                    "timestamp": time.time()
                }

                # 处理事件
                result = self.handle_event(event)

                # 记录结果
                self.events_db.save(event, result)

                # 如果需要人工介入，发送告警
                if result.get("action") == "human_intervention":
                    self.alerting.send_alert(event, result)

                # 等待下一次检查
                time.sleep(60)  # 每分钟检查一次

            except Exception as e:
                logger.error("self_healing_loop_error", error=str(e))
                time.sleep(60)

    def handle_event(self, event: dict) -> dict:
        """处理单个事件"""

        logger.info("handling_event", event_id=event.get("event_id"))

        # 阶段 1: 检测
        detection = self.detector.detect(event)

        if not detection["is_anomaly"]:
            return {"action": "none", "reason": "No anomaly detected"}

        logger.warning(
            "anomaly_detected",
            anomalies=len(detection["anomalies"])
        )

        # 阶段 2: 分类
        classification = self.classifier.classify(event, detection)

        logger.info(
            "event_classified",
            type=classification["event_type"],
            severity=classification["severity"]
        )

        # 阶段 3: 决策
        decision = self.decider.decide(event, classification)

        logger.info(
            "decision_made",
            strategy=decision["strategy"],
            confidence=decision["confidence"]
        )

        # 置信度检查
        if decision["confidence"] < 0.8:
            logger.warning(
                "low_confidence",
                confidence=decision["confidence"],
                action="human_intervention_required"
            )
            return {
                "action": "human_intervention",
                "reason": "Low confidence",
                "decision": decision
            }

        # 安全检查
        if not decision["safety_check"]["can_proceed"]:
            logger.warning(
                "safety_check_failed",
                status=decision["safety_check"]["overall_status"]
            )
            return {
                "action": "human_intervention",
                "reason": "Safety check failed",
                "decision": decision
            }

        # 阶段 4: 执行
        execution = self.executor.execute(decision)

        logger.info(
            "execution_completed",
            status=execution["status"],
            duration=execution.get("duration", 0)
        )

        # 阶段 5: 验证
        verification = self.verifier.verify(event, execution)

        logger.info(
            "verification_completed",
            status=verification["verification_status"]
        )

        # 如果验证失败，记录并告警
        if verification["verification_status"] != "passed":
            logger.critical(
                "verification_failed",
                checks=verification["checks"]
            )
            self.alerting.send_alert(event, {
                "action": "auto_remediation_failed",
                "verification": verification
            })

        return {
            "action": "auto_remediated",
            "detection": detection,
            "classification": classification,
            "decision": decision,
            "execution": execution,
            "verification": verification
        }

    def _collect_metrics(self) -> dict:
        """收集指标（实际实现中应从 Prometheus 等系统获取）"""
        # 模拟数据
        return {
            "error_rate": 0.08,
            "latency_p95": 1200,
            "cpu_usage": 88,
            "memory_usage": 78,
        }

# 启动自愈合系统
if __name__ == "__main__":
    system = SelfHealingSystem()
    system.run()
```

---

## 📊 知识检查

### 自我评估问题

1. **自动化事件响应的五个阶段是什么？**

2. **如何确定事件的严重程度和优先级？**

3. **AI 决策引擎如何选择最佳修复策略？**

4. **为什么需要安全检查？哪些操作需要特别谨慎？**

5. **如何验证自动化修复是否成功？**

6. **在什么情况下应该选择人工介入而不是自动化修复？**

---

## 📚 延伸阅读

### 资源

1. [Google SRE Book - Incident Management](https://sre.google/sre-book/incident-management/)
2. [AWS Auto Scaling](https://aws.amazon.com/autoscaling/)
3. [Kubernetes Self-Healing](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

### 案例研究

1. **Netflix Chaos Engineering**: 混沌工程实践
2. **Google SRE**: 站点可靠性工程
3. **Resolve 平台**: AI 驱动的运维自动化

---

**Week 9 结语**: 通过本周的学习，你已经掌握了构建自愈合系统的完整技术栈。下一周，我们将探讨 AI 软件工程的未来，展望开发者角色的演变和未来十年的发展趋势。

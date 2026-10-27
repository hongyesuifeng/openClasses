# 本地学习服务

在仓库根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File domains/game-engine/experiments/web3d-learning/tools/run.ps1 start
powershell -NoProfile -ExecutionPolicy Bypass -File domains/game-engine/experiments/web3d-learning/tools/run.ps1 status
powershell -NoProfile -ExecutionPolicy Bypass -File domains/game-engine/experiments/web3d-learning/tools/run.ps1 stop
```

`start` 构建当前代码，然后在后台隐藏启动预览；命令结束后仍可访问 <http://127.0.0.1:5173>。重复启动会复用同项目、同构建的健康实例。代码有修改时先 `stop`，再 `start`，避免在已运行的页面下替换构建目录。`dev`、`test`、`build` 和 `preview` 保留原用法；需要热更新开发时先停止此预览，再使用 `dev`。

运行记录、构建日志与预览日志保存在 `tools/.local/`，由同目录忽略规则排除提交。构建有 120 秒上限，服务就绪和停止也有有限检查；失败信息显示日志路径。此入口不安装全局服务、不设置开机启动，也不保证进程永久运行。

`status` 同时核对已登记进程的 PID、创建时间、Node 路径、项目路径和随机实例标识，以及端口归属、HTML 类型、静态构建标识和可解析课程 JSON。它证明服务响应符合当前构建，不能代替浏览器内 Worker、作答和草稿恢复验收。源码变化会明确提示需要重建。

`stop` 仅停止身份全部匹配的本项目实例。陌生端口占用、重复使用的 PID、损坏记录均不会授权停止其它进程；应先按提示确认占用来源。不要直接按端口批量终止进程。草稿仍保存在浏览器同一地址的本地存储中，服务重启不会主动删除它。

管理逻辑的边界测试随现有 `test` 命令执行，覆盖冷启动、重复启动、陌生占用、陈旧 PID、构建失败、构建期间修改、内容不健康和就绪失败。真实后台驻留及浏览器作答验证需在本次交付记录中另行注明。

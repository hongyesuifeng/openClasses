# slayDemo 学习资料与项目复盘

slayDemo《甜心迷宫》用于研究卡牌构筑玩法、数据驱动架构和 AI 协作游戏开发。实际项目已迁移到 [cocosProjects 独立仓库](https://github.com/hongyesuifeng/cocosProjects)，openClasses 保留学习资料、实验结论和历史记录。

## 学习入口

- [项目全程复盘](docs/project-retrospective.md)：架构选择、AI 协作、UI 还原瓶颈与引擎迁移。
- [资料索引](docs/README.md)：玩法设计、技术原理、学习笔记和历史实施记录。
- [卡牌设计](docs/design/02-card-design.md)与[战斗系统](docs/tech/02-battle-system-tech.md)：核心玩法及实现思路。
- [JSON 数据源决策](docs/adr/0001-use-json-as-source-data.md)：数据格式与验证的选择依据。
- [UI 还原复盘](docs/tech/17-ui-restoration-lessons.md)：视觉资源、结构化布局和验证方法。

## 工程归属

实际游戏开发、功能整合和资源维护在 cocosProjects 中进行。当前仓库保留其子模块引用 `domains/game-engine/cocosProjects`，用于定位相关项目；子模块是否在本机检出不代表迁移完成度。

2026 年 10 月 8 日将旧 Godot 运行工程、提交钩子、任务续跑状态和两个动画资源压缩包移出了学习目录。可恢复的本地副本位于仓库根目录 `.tmp/slaydemo-godot-2026-10-08/`，包含源码、场景、测试、插件、美术资源和生成缓存，已加入 Git 忽略。原有设计、技术、学习、美术说明和复盘文档继续保留。

## 历史资料使用方式

文档中的 `client/slay-demo/`、`res://` 路径、测试命令、开发计划和完成度属于当时的 Godot 实验记录。阅读时关注原理与结论；实际项目状态以 cocosProjects 为准。

清理前的受版本管理文件保存在提交 `8c117e59` 中。需要重新研究原实现时，可在 openClasses 根目录按需恢复旧工程：

```powershell
git restore --source=8c117e59 --worktree -- domains/game-engine/godotProjects/slayDemo/client
```

动画压缩包也可从同一提交的 `docs/animation-requirements/` 路径恢复。生成缓存不作为学习成果保留。

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Steam 讨论区数据分析 - 用户洞察报告
基于爬取的吸血鬼幸存者讨论数据进行深度分析
"""

import json
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
import csv

class DiscussionAnalyzer:
    """讨论数据分析器"""

    def __init__(self, json_file):
        self.json_file = Path(json_file)
        self.data = self.load_data()

        # 情感词典（简单版本）
        self.positive_words = {
            'good', 'great', 'awesome', 'excellent', 'amazing', 'love', 'best',
            'fun', 'addictive', 'perfect', 'enjoy', 'recommend', 'worth',
            'happy', 'thanks', 'thank', 'helpful', 'nice', 'cool', 'fantastic',
            '好', '棒', '赞', '优秀', '完美', '喜欢', '爱', '推荐', '值得',
            '好玩', '上瘾', '开心', '感谢', '棒极了', '优秀', '厉害'
        }

        self.negative_words = {
            'bad', 'worst', 'terrible', 'hate', 'boring', 'bug', 'broken',
            'fix', 'issue', 'problem', 'crash', 'lag', 'slow', 'error',
            'fail', 'disappointed', 'waste', 'poor', 'trash', 'garbage',
            '差', '烂', '垃圾', ' bug', '崩溃', '卡顿', '问题', '错误',
            '失望', '浪费', '失败', '修复', '不行', '难过', '讨厌'
        }

        # 需求相关关键词
        self.demand_keywords = {
            'feature': ['new', 'add', 'want', 'need', 'hope', 'wish', 'suggest',
                       '功能', '新增', '想要', '需要', '希望', '建议', '期待'],
            'balance': ['nerf', 'buff', 'balance', 'strong', 'weak', 'overpowered',
                       '平衡', '削弱', '增强', '太强', '太弱'],
            'content': ['more', 'dlc', 'update', 'character', 'weapon', 'map',
                       '内容', '角色', '武器', '地图', '更新', '扩展'],
            'technical': ['controller', 'support', 'linux', 'mac', 'mobile',
                         'controller support', 'crash', 'bug', 'fix',
                         '手柄', '支持', '崩溃', '修复', '兼容'],
            'language': ['english', 'chinese', 'translation', 'language',
                        '英文', '中文', '翻译', '语言', '本地化']
        }

        # 游戏特定关键词
        self.game_keywords = {
            'character': ['character', 'hero', 'survivor', 'unlock', 'evolution',
                         '角色', '英雄', '解锁', '进化'],
            'weapon': ['weapon', 'evolution', 'combo', 'build',
                      '武器', '进化', '组合', '构建'],
            'mechanics': ['cooldown', 'armor', 'luck', 'growth', 'magnet',
                         'area', 'speed', 'duration', 'amount', 'reroll',
                         '冷却', '护甲', '幸运', '成长', '磁铁', '范围'],
            'gamemode': ['co-op', 'multiplayer', 'pvp', 'endless', 'challenge',
                        'coop', '多人', '合作', '模式']
        }

    def load_data(self):
        """加载JSON数据"""
        with open(self.json_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    def extract_keywords(self, text):
        """提取关键词"""
        if not text:
            return []

        # 转换为小写
        text = text.lower()

        # 提取单词
        words = re.findall(r'\b[a-z]{3,}\b', text)

        # 过滤常见词
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all',
                     'can', 'her', 'was', 'one', 'our', 'out', 'with', 'this',
                     'that', 'from', 'they', 'will', 'have', 'been', 'more',
                     'when', 'into', 'some', 'than', 'them', 'very', 'just',
                     'what', 'which', 'their', 'about', 'would', 'could',
                     'should', 'does', 'were', 'being', 'after', 'before'}

        keywords = [w for w in words if w not in stop_words]
        return keywords

    def analyze_sentiment(self, text):
        """分析情感倾向"""
        if not text:
            return 'neutral', 0

        text_lower = text.lower()

        positive_count = sum(1 for word in self.positive_words if word in text_lower)
        negative_count = sum(1 for word in self.negative_words if word in text_lower)

        if positive_count > negative_count:
            return 'positive', positive_count - negative_count
        elif negative_count > positive_count:
            return 'negative', negative_count - positive_count
        else:
            return 'neutral', 0

    def categorize_discussion(self, title):
        """对讨论进行分类"""
        title_lower = title.lower()

        categories = []

        # 检查各类需求
        for category, keywords in self.demand_keywords.items():
            if any(keyword in title_lower for keyword in keywords):
                categories.append(category)

        # 检查游戏相关
        for category, keywords in self.game_keywords.items():
            if any(keyword in title_lower for keyword in keywords):
                categories.append(category)

        return categories if categories else ['general']

    def generate_report(self):
        """生成完整的分析报告"""
        report = {
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'total_discussions': len(self.data),
            'sections': defaultdict(int),
            'sentiment': defaultdict(int),
            'categories': defaultdict(int),
            'top_keywords': Counter(),
            'user_demands': defaultdict(list),
            'pain_points': [],
            'feature_requests': [],
            'top_discussions': [],
            'insights': []
        }

        # 分析每条讨论
        for discussion in self.data:
            title = discussion.get('title', '')
            replies = int(discussion.get('replies', '0') or '0')
            section = discussion.get('section', 'unknown')

            # 板块统计
            report['sections'][section] += 1

            # 提取关键词
            keywords = self.extract_keywords(title)
            report['top_keywords'].update(keywords)

            # 情感分析
            sentiment, score = self.analyze_sentiment(title)
            report['sentiment'][sentiment] += 1

            # 分类讨论
            categories = self.categorize_discussion(title)
            for cat in categories:
                report['categories'][cat] += 1

            # 高关注度讨论（回复数>=3）
            if replies >= 3:
                report['top_discussions'].append({
                    'title': title,
                    'replies': replies,
                    'url': discussion.get('url', ''),
                    'sentiment': sentiment
                })

        # 整理痛点
        report['pain_points'] = self.identify_pain_points()

        # 整理需求
        report['user_demands'] = self.analyze_user_demands()

        # 生成洞察
        report['insights'] = self.generate_insights(report)

        return report

    def identify_pain_points(self):
        """识别用户痛点"""
        pain_points = {
            '技术问题': [],
            '游戏平衡': [],
            '内容缺失': [],
            '体验问题': []
        }

        for discussion in self.data:
            title = discussion.get('title', '').lower()
            replies = int(discussion.get('replies', '0') or '0')

            # 技术问题
            if any(word in title for word in ['crash', 'bug', 'fix', 'error', 'not working',
                                              '崩溃', 'bug', '错误', '无法', '不工作']):
                pain_points['技术问题'].append({
                    'title': discussion.get('title', ''),
                    'replies': replies
                })

            # 平衡问题
            elif any(word in title for word in ['nerf', 'buff', 'balance', 'strong', 'weak',
                                                '平衡', '削弱', '增强']):
                pain_points['游戏平衡'].append({
                    'title': discussion.get('title', ''),
                    'replies': replies
                })

            # 内容需求
            elif any(word in title for word in ['need', 'want', 'more', 'add', 'missing',
                                                '需要', '想要', '更多', '新增']):
                pain_points['内容缺失'].append({
                    'title': discussion.get('title', ''),
                    'replies': replies
                })

            # 体验问题
            elif any(word in title for word in ['boring', 'slow', 'lag', 'difficult',
                                                '无聊', '卡顿', '难', '麻烦']):
                pain_points['体验问题'].append({
                    'title': discussion.get('title', ''),
                    'replies': replies
                })

        return pain_points

    def analyze_user_demands(self):
        """分析用户需求"""
        demands = {
            '功能需求': [],
            '内容需求': [],
            '优化需求': [],
            '平台支持': []
        }

        for discussion in self.data:
            title = discussion.get('title', '')
            title_lower = title.lower()
            replies = int(discussion.get('replies', '0') or '0')

            # 功能需求
            if any(word in title_lower for word in ['add', 'new feature', 'implement',
                                                    'feature', '功能', '新增']):
                demands['功能需求'].append(title)

            # 内容需求
            elif any(word in title_lower for word in ['more character', 'more weapon',
                                                      'dlc', 'content', 'new map',
                                                      '角色', '武器', '内容']):
                demands['内容需求'].append(title)

            # 优化需求
            elif any(word in title_lower for word in ['optimize', 'improve', 'better',
                                                      'balance', '优化', '改进', '平衡']):
                demands['优化需求'].append(title)

            # 平台支持
            elif any(word in title_lower for word in ['controller', 'support', 'linux',
                                                      'mac', 'mobile', '手柄', '支持']):
                demands['平台支持'].append(title)

        return demands

    def generate_insights(self, report):
        """生成用户洞察"""
        insights = []

        # 情感洞察
        total = sum(report['sentiment'].values())
        positive_ratio = report['sentiment']['positive'] / total if total > 0 else 0

        if positive_ratio > 0.6:
            insights.append({
                'type': '情感倾向',
                'content': f'用户整体情感偏正面，正面讨论占比 {positive_ratio:.1%}，说明游戏整体体验良好'
            })
        elif positive_ratio < 0.4:
            insights.append({
                'type': '情感倾向',
                'content': f'用户负面情绪较多（{1-positive_ratio:.1%}），需要关注用户反馈中的问题'
            })

        # 高频关键词洞察
        top_words = report['top_keywords'].most_common(10)
        if top_words:
            insights.append({
                'type': '关注焦点',
                'content': f'用户最关注的话题：{", ".join([w[0] for w in top_words[:5]])}'
            })

        # 痛点洞察
        pain_summary = {k: len(v) for k, v in report['pain_points'].items()}
        main_pain = max(pain_summary, key=pain_summary.get)
        if pain_summary[main_pain] > 0:
            insights.append({
                'type': '主要痛点',
                'content': f'用户最头疼的问题是"{main_pain}"，相关讨论 {pain_summary[main_pain]} 条'
            })

        # 需求洞察
        demand_summary = {k: len(v) for k, v in report['user_demands'].items()}
        top_demand = max(demand_summary, key=demand_summary.get)
        if demand_summary[top_demand] > 0:
            insights.append({
                'type': '核心需求',
                'content': f'用户最迫切的需求是"{top_demand}"，相关讨论 {demand_summary[top_demand]} 条'
            })

        # 热门讨论洞察
        if report['top_discussions']:
            hot_topics = sorted(report['top_discussions'],
                              key=lambda x: x['replies'], reverse=True)[:3]
            insights.append({
                'type': '热点话题',
                'content': f'最受关注的讨论：{hot_topics[0]["title"][:40]}... ({hot_topics[0]["replies"]} 回复)'
            })

        return insights

    def print_report(self, report):
        """打印格式化的分析报告"""
        print("\n" + "="*70)
        print(" "*15 + "吸血鬼幸存者 - 用户洞察分析报告")
        print("="*70)

        print(f"\n📊 数据概览")
        print(f"   分析时间: {report['timestamp']}")
        print(f"   总讨论数: {report['total_discussions']} 条")

        print(f"\n📈 板块分布")
        for section, count in sorted(report['sections'].items(),
                                    key=lambda x: x[1], reverse=True):
            ratio = count / report['total_discussions'] * 100
            bar = '█' * int(ratio / 2)
            print(f"   {section:12s}: {count:3d} 条 {bar} {ratio:.1f}%")

        print(f"\n💭 情感分析")
        total = sum(report['sentiment'].values())
        for sentiment, count in report['sentiment'].items():
            ratio = count / total * 100 if total > 0 else 0
            emoji = {'positive': '😊', 'negative': '😞', 'neutral': '😐'}
            print(f"   {emoji.get(sentiment, '❓')} {sentiment:8s}: {count:3d} 条 ({ratio:.1f}%)")

        print(f"\n🔍 高频关键词 (Top 15)")
        for word, count in report['top_keywords'].most_common(15):
            print(f"   {word:15s}: {count:3d} 次")

        print(f"\n📂 讨论分类")
        for category, count in sorted(report['categories'].items(),
                                     key=lambda x: x[1], reverse=True)[:10]:
            print(f"   {category:15s}: {count:3d} 条")

        print(f"\n😣 用户痛点分析")
        for pain_type, issues in report['pain_points'].items():
            if issues:
                print(f"\n   【{pain_type}】({len(issues)} 条)")
                for issue in sorted(issues, key=lambda x: x['replies'], reverse=True)[:3]:
                    print(f"      - {issue['title'][:50]}... ({issue['replies']} 回复)")

        print(f"\n💡 用户需求分析")
        for demand_type, titles in report['user_demands'].items():
            if titles:
                print(f"\n   【{demand_type}】({len(titles)} 条)")
                for title in titles[:3]:
                    print(f"      - {title[:50]}...")

        print(f"\n🎯 核心洞察")
        for i, insight in enumerate(report['insights'], 1):
            print(f"\n   {i}. 【{insight['type']}】")
            print(f"      {insight['content']}")

        print(f"\n🔥 高关注度讨论 (回复数≥5)")
        hot_topics = sorted(report['top_discussions'],
                          key=lambda x: x['replies'], reverse=True)
        hot_topics = [t for t in hot_topics if t['replies'] >= 5][:10]
        for topic in hot_topics:
            emoji = {'positive': '😊', 'negative': '😞', 'neutral': '😐'}
            print(f"\n   [{emoji.get(topic['sentiment'], '❓')}] {topic['replies']} 回复")
            print(f"   {topic['title']}")
            print(f"   链接: {topic['url']}")

        print("\n" + "="*70)

    def save_report(self, report, output_file='user_insights_report.json'):
        """保存报告到文件"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"\n✓ 详细报告已保存到: {output_file}")

    def export_to_markdown(self, report, output_file='user_insights_report.md'):
        """导出为 Markdown 格式"""
        md_content = f"""# 吸血鬼幸存者 - 用户洞察分析报告

**生成时间**: {report['timestamp']}
**分析讨论数**: {report['total_discussions']} 条

---

## 📊 数据概览

- **总讨论数**: {report['total_discussions']} 条
- **分析板块**: {len(report['sections'])} 个

### 板块分布

| 板块 | 讨论数 | 占比 |
|------|--------|------|
"""

        total = report['total_discussions']
        for section, count in sorted(report['sections'].items(),
                                    key=lambda x: x[1], reverse=True):
            ratio = count / total * 100
            md_content += f"| {section} | {count} | {ratio:.1f}% |\n"

        md_content += f"""
---

## 💭 情感分析

| 情感倾向 | 讨论数 | 占比 |
|----------|--------|------|
"""

        for sentiment, count in report['sentiment'].items():
            ratio = count / total * 100 if total > 0 else 0
            emoji = {'positive': '😊', 'negative': '😞', 'neutral': '😐'}
            md_content += f"| {emoji.get(sentiment, '')} {sentiment} | {count} | {ratio:.1f}% |\n"

        md_content += f"""
---

## 🔍 高频关键词

| 排名 | 关键词 | 出现次数 |
|------|--------|----------|
"""

        for i, (word, count) in enumerate(report['top_keywords'].most_common(20), 1):
            md_content += f"| {i} | {word} | {count} |\n"

        md_content += """
---

## 😣 用户痛点分析

"""

        for pain_type, issues in report['pain_points'].items():
            if issues:
                md_content += f"### {pain_type} ({len(issues)} 条)\n\n"
                for issue in sorted(issues, key=lambda x: x['replies'], reverse=True)[:5]:
                    md_content += f"- **{issue['title']}** ({issue['replies']} 回复)\n"

        md_content += """
---

## 💡 用户需求分析

"""

        for demand_type, titles in report['user_demands'].items():
            if titles:
                md_content += f"### {demand_type} ({len(titles)} 条)\n\n"
                for title in titles[:5]:
                    md_content += f"- {title}\n"

        md_content += """
---

## 🎯 核心洞察

"""

        for i, insight in enumerate(report['insights'], 1):
            md_content += f"{i}. **{insight['type']}**: {insight['content']}\n\n"

        md_content += """
---

## 🔥 高关注度讨论

"""

        hot_topics = sorted(report['top_discussions'],
                          key=lambda x: x['replies'], reverse=True)[:15]
        for topic in hot_topics:
            emoji = {'positive': '😊', 'negative': '😞', 'neutral': '😐'}
            md_content += f"""
### [{topic['replies']} 回复] {topic['title']}

- **情感**: {emoji.get(topic['sentiment'], '❓')} {topic['sentiment']}
- **链接**: {topic['url']}

"""

        md_content += f"""
---

*本报告由 Steam 讨论区数据分析工具自动生成*
"""

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(md_content)
        print(f"✓ Markdown 报告已保存到: {output_file}")

def main():
    """主函数"""
    # 查找最新的数据文件
    steam_data_dir = Path('steam_data')
    json_files = list(steam_data_dir.glob('vampire_survivors_discussions_*.json'))

    if not json_files:
        print("错误: 未找到数据文件")
        print("请先运行 steam_discussions_scraper.py 爬取数据")
        return

    # 使用最新的文件
    latest_file = max(json_files, key=lambda p: p.stat().st_mtime)
    print(f"正在分析数据文件: {latest_file}")

    # 创建分析器
    analyzer = DiscussionAnalyzer(latest_file)

    # 生成报告
    report = analyzer.generate_report()

    # 打印报告
    analyzer.print_report(report)

    # 保存报告
    analyzer.save_report(report, 'steam_data/user_insights_report.json')
    analyzer.export_to_markdown(report, 'steam_data/user_insights_report.md')

if __name__ == "__main__":
    main()

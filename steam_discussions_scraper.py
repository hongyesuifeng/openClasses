#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Steam 游戏讨论区爬虫
用于爬取吸血鬼幸存者 (Vampire Survivors) 的所有讨论内容
"""

import requests
from bs4 import BeautifulSoup
import time
import csv
import json
from datetime import datetime
from pathlib import Path

class SteamDiscussionScraper:
    """Steam 讨论区爬虫类"""

    def __init__(self, app_id, output_dir="steam_data"):
        self.app_id = app_id
        self.base_url = f"https://steamcommunity.com/app/{app_id}/discussions/"
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        }

        # 讨论区所有板块
        self.sections = {
            '': '一般讨论',
            'trading': '交易',
            'events': '活动',
            'announcements': '公告'
        }

    def get_discussion_list(self, section='', max_pages=10):
        """获取讨论列表"""
        discussions = []
        section_name = self.sections.get(section, '一般讨论')

        print(f"\n{'='*60}")
        print(f"正在抓取板块: {section_name}")
        print(f"{'='*60}")

        for page in range(1, max_pages + 1):
            url = self.base_url + section
            params = {'p': page} if page > 1 else {}

            try:
                print(f"  正在获取第 {page} 页...")
                response = requests.get(url, params=params, headers=self.headers, timeout=30)
                response.raise_for_status()

                soup = BeautifulSoup(response.text, 'html.parser')

                # 查找讨论条目 - 使用正确的类名 forum_topic
                forum_topics = soup.find_all('div', class_='forum_topic')

                if not forum_topics:
                    # 检查是否还有更多内容
                    if page > 1:
                        print(f"  ✓ 第 {page} 页: 没有更多内容")
                        break
                    else:
                        # 第一页也没找到，可能真的没有讨论
                        print(f"  ✗ 第 {page} 页: 未找到讨论")
                        break

                page_count = 0
                for topic in forum_topics:
                    try:
                        # 标题 - forum_topic_name 是 div
                        title_elem = topic.find('div', class_='forum_topic_name')
                        if not title_elem:
                            continue

                        # 获取标题文本（去掉标签如PINNED）
                        title_text = title_elem.get_text(separator=' ', strip=True)

                        # URL 在 forum_topic_overlay 的 a 标签中
                        link_elem = topic.find('a', class_='forum_topic_overlay')
                        if not link_elem:
                            continue

                        topic_url = link_elem.get('href', '')
                        # 从URL中提取讨论ID
                        if topic_url:
                            parts = topic_url.rstrip('/').split('/')
                            topic_id = parts[-1] if parts else ''
                        else:
                            topic_id = ''

                        # 作者信息 - 在 forum_topic_op 中
                        author_elem = topic.find('div', class_='forum_topic_op')
                        author = author_elem.get_text(strip=True) if author_elem else '未知'

                        # 回复数 - 在 forum_topic_reply_count 中
                        replies_elem = topic.find('div', class_='forum_topic_reply_count')
                        if replies_elem:
                            # 移除图片标签，只保留数字
                            reply_text = replies_elem.get_text(strip=True)
                        else:
                            reply_text = '0'

                        # 最后更新时间
                        time_elem = topic.find('div', class_='forum_topic_lastpost')
                        last_post = time_elem.get_text(strip=True) if time_elem else ''

                        discussion = {
                            'topic_id': topic_id,
                            'title': title_text,
                            'url': topic_url if topic_url.startswith('http') else 'https://steamcommunity.com' + topic_url,
                            'author': author,
                            'replies': reply_text,
                            'last_post': last_post,
                            'section': section_name,
                            'section_code': section if section else 'general'
                        }

                        discussions.append(discussion)
                        page_count += 1

                    except Exception as e:
                        print(f"    警告: 解析单个讨论时出错 - {e}")
                        continue

                print(f"  ✓ 第 {page} 页: 获取到 {page_count} 条讨论")

                # 礼貌性延迟
                time.sleep(1.5)

            except requests.RequestException as e:
                print(f"  ✗ 网络请求失败: {e}")
                break
            except Exception as e:
                print(f"  ✗ 未知错误: {e}")
                break

        print(f"\n板块 '{section_name}' 共获取 {len(discussions)} 条讨论")
        return discussions

    def get_discussion_detail(self, discussion_url):
        """获取单个讨论的详细内容"""
        try:
            response = requests.get(discussion_url, headers=self.headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # 获取楼主内容
            original_post = soup.find('div', class_='forumtopic_originalpost')
            content = ""
            if original_post:
                content_div = original_post.find('div', class_='content')
                if content_div:
                    # 获取纯文本
                    content = content_div.get_text(separator='\n', strip=True)

            # 获取回复
            replies = []
            comment_area = soup.find('div', id='CommentArea')
            if comment_area:
                comments = comment_area.find_all('div', class_='comment_comment')
                for comment in comments:
                    author_elem = comment.find('a', class_='comment_author')
                    content_elem = comment.find('div', class_='comment_content')

                    if author_elem and content_elem:
                        reply = {
                            'author': author_elem.text.strip(),
                            'content': content_elem.get_text(separator='\n', strip=True)
                        }
                        replies.append(reply)

            return {
                'content': content,
                'replies': replies,
                'reply_count': len(replies)
            }

        except Exception as e:
            print(f"    获取讨论详情失败: {e}")
            return {'content': '', 'replies': [], 'reply_count': 0}

    def scrape_all_discussions(self, max_pages_per_section=5, fetch_details=False):
        """爬取所有讨论"""
        all_discussions = []

        # 遍历所有板块
        for section_code, section_name in self.sections.items():
            discussions = self.get_discussion_list(section_code, max_pages=max_pages_per_section)
            all_discussions.extend(discussions)

        print(f"\n{'='*60}")
        print(f"总计获取 {len(all_discussions)} 条讨论")
        print(f"{'='*60}")

        return all_discussions

    def save_to_csv(self, discussions, filename=None):
        """保存到CSV文件"""
        if not discussions:
            print("没有数据可保存")
            return

        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = self.output_dir / f"vampire_survivors_discussions_{timestamp}.csv"

        # 确定字段
        fieldnames = ['topic_id', 'title', 'url', 'author', 'replies',
                     'last_post', 'section', 'section_code']

        with open(filename, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(discussions)

        print(f"\n✓ 数据已保存到: {filename}")
        return filename

    def save_to_json(self, discussions, filename=None):
        """保存到JSON文件"""
        if not discussions:
            print("没有数据可保存")
            return

        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = self.output_dir / f"vampire_survivors_discussions_{timestamp}.json"

        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(discussions, f, ensure_ascii=False, indent=2)

        print(f"✓ 数据已保存到: {filename}")
        return filename

def main():
    """主函数"""
    # 吸血鬼幸存者的 App ID
    APP_ID = "1794680"

    print("="*60)
    print("Steam 讨论区爬虫 - 吸血鬼幸存者")
    print("="*60)

    # 创建爬虫实例
    scraper = SteamDiscussionScraper(APP_ID)

    # 爬取所有讨论（每个板块最多10页）
    discussions = scraper.scrape_all_discussions(max_pages_per_section=10)

    # 保存数据
    if discussions:
        csv_file = scraper.save_to_csv(discussions)
        json_file = scraper.save_to_json(discussions)

        print(f"\n{'='*60}")
        print(f"爬取完成!")
        print(f"总计: {len(discussions)} 条讨论")
        print(f"CSV 文件: {csv_file}")
        print(f"JSON 文件: {json_file}")
        print(f"{'='*60}")

        # 统计信息
        section_stats = {}
        for d in discussions:
            section = d['section']
            section_stats[section] = section_stats.get(section, 0) + 1

        print(f"\n各板块统计:")
        for section, count in section_stats.items():
            print(f"  {section}: {count} 条")

if __name__ == "__main__":
    main()

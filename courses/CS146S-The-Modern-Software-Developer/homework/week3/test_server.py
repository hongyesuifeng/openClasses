#!/usr/bin/env python3
"""
测试脚本 - 验证 GitHub MCP 服务器的工具功能

这个脚本直接测试 GitHub API 客户端和工具函数，
无需通过 MCP 协议连接。
"""
import asyncio
import sys
import os

# 添加父目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from server.main import GitHubClient, get_repository_info, get_repository_issues


async def test_github_client():
    """测试 GitHub API 客户端"""
    print("=" * 60)
    print("测试 1: GitHub API 客户端连接")
    print("=" * 60)

    try:
        async with GitHubClient() as client:
            # 测试获取一个公开仓库
            print("\n正在获取 microsoft/vscode 仓库信息...")
            data = await client.get("/repos/microsoft/vscode")
            print(f"✅ 成功获取仓库: {data.get('full_name')}")
            print(f"   描述: {data.get('description')}")
            print(f"   Stars: {data.get('stargazers_count'):,}")
            return True
    except Exception as e:
        print(f"❌ 失败: {e}")
        return False


async def test_get_repository_info():
    """测试获取仓库信息工具"""
    print("\n" + "=" * 60)
    print("测试 2: get_repository_info 工具")
    print("=" * 60)

    try:
        async with GitHubClient() as client:
            print("\n正在测试 facebook/react 仓库...")
            result = await get_repository_info(
                client,
                {"owner": "facebook", "repo": "react"}
            )
            print("✅ 工具调用成功")
            print("\n输出预览:")
            print(result[0].text[:300] + "...")
            return True
    except Exception as e:
        print(f"❌ 失败: {e}")
        return False


async def test_get_repository_issues():
    """测试获取 Issues 工具"""
    print("\n" + "=" * 60)
    print("测试 3: get_repository_issues 工具")
    print("=" * 60)

    try:
        async with GitHubClient() as client:
            print("\n正在获取 rust-lang/rust 的开放 Issues (limit=3)...")
            result = await get_repository_issues(
                client,
                {"owner": "rust-lang", "repo": "rust", "state": "open", "limit": 3}
            )
            print("✅ 工具调用成功")
            print("\n输出预览:")
            print(result[0].text[:400] + "...")
            return True
    except Exception as e:
        print(f"❌ 失败: {e}")
        return False


async def test_error_handling():
    """测试错误处理"""
    print("\n" + "=" * 60)
    print("测试 4: 错误处理")
    print("=" * 60)

    try:
        async with GitHubClient() as client:
            # 测试不存在的仓库
            print("\n正在测试不存在的仓库...")
            try:
                await get_repository_info(
                    client,
                    {"owner": "nonexistent", "repo": "repository-12345"}
                )
                print("❌ 应该抛出错误但没有")
                return False
            except ValueError as e:
                print(f"✅ 正确捕获错误: {e}")
                return True
    except Exception as e:
        print(f"❌ 意外错误: {e}")
        return False


async def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("GitHub MCP 服务器测试套件")
    print("=" * 60)

    results = []

    # 运行测试
    results.append(await test_github_client())
    results.append(await test_get_repository_info())
    results.append(await test_get_repository_issues())
    results.append(await test_error_handling())

    # 总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"通过: {passed}/{total}")
    print(f"失败: {total - passed}/{total}")

    if passed == total:
        print("\n✅ 所有测试通过！服务器已准备就绪。")
        return 0
    else:
        print("\n❌ 部分测试失败，请检查错误。")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

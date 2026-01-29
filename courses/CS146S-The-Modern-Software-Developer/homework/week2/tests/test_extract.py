import os
import pytest

from ..app.services.extract import extract_action_items, extract_action_items_llm


def test_extract_bullets_and_checkboxes():
    text = """
    Notes from meeting:
    - [ ] Set up database
    * implement API extract endpoint
    1. Write tests
    Some narrative sentence.
    """.strip()

    items = extract_action_items(text)
    assert "Set up database" in items
    assert "implement API extract endpoint" in items
    assert "Write tests" in items


# ==================== LLM 提取函数测试 ====================

class TestExtractActionItemsLLM:
    """测试 extract_action_items_llm() 函数"""

    def test_extract_bullets_and_checkboxes_llm(self):
        """测试 LLM 提取项目符号和复选框格式"""
        text = """
        Notes from meeting:
        - [ ] Set up database
        * implement API extract endpoint
        1. Write tests
        Some narrative sentence.
        """.strip()

        items = extract_action_items_llm(text)
        assert len(items) >= 3
        assert any("database" in item.lower() for item in items)
        assert any("api" in item.lower() or "endpoint" in item.lower() for item in items)
        assert any("test" in item.lower() for item in items)

    def test_extract_keyword_prefixes_llm(self):
        """测试 LLM 提取带关键字前缀的行"""
        text = """
        TODO: Fix the authentication bug
        ACTION: Update the documentation
        NEXT: Deploy to production
        Some random note.
        """.strip()

        items = extract_action_items_llm(text)
        assert len(items) >= 3
        assert any("authentication" in item.lower() or "bug" in item.lower() for item in items)
        assert any("documentation" in item.lower() or "document" in item.lower() for item in items)
        assert any("deploy" in item.lower() or "production" in item.lower() for item in items)

    def test_extract_imperative_sentences_llm(self):
        """测试 LLM 提取叙述性文本中的祈使句"""
        text = """
        We need to implement the new feature.
        Create a new API endpoint for user registration.
        Update the documentation by Friday.
        This is just a narrative sentence with no tasks.
        """.strip()

        items = extract_action_items_llm(text)
        assert len(items) >= 2
        assert any("implement" in item.lower() or "feature" in item.lower() for item in items)
        assert any("api" in item.lower() or "endpoint" in item.lower() for item in items)

    def test_empty_text_llm(self):
        """测试 LLM 处理空输入"""
        assert extract_action_items_llm("") == []
        assert extract_action_items_llm("   ") == []
        assert extract_action_items_llm("\n\n") == []

    def test_no_action_items_llm(self):
        """测试 LLM 处理无行动项的文本"""
        text = "This is just a narrative sentence with no actionable tasks."
        items = extract_action_items_llm(text)
        assert isinstance(items, list)

    def test_mixed_format_llm(self):
        """测试 LLM 处理混合格式"""
        text = """
        TODO: Fix the bug
        - Update tests
        We should refactor the code base.
        Create a new README file.
        """.strip()

        items = extract_action_items_llm(text)
        assert len(items) > 0
        # 应该提取到多个行动项
        assert len(items) >= 2

    def test_deduplication_llm(self):
        """测试 LLM 处理重复项"""
        text = """
        - Write tests
        * Write tests
        1. Write tests
        """.strip()

        items = extract_action_items_llm(text)
        # LLM 可能会去重，但至少应该返回一些结果
        assert len(items) > 0

    def test_chinese_text_llm(self):
        """测试 LLM 处理中文文本"""
        text = """
        会议记录：
        - [ ] 设置数据库
        * 实现 API 接口
        1. 编写测试代码
        """.strip()

        items = extract_action_items_llm(text)
        assert len(items) >= 3
        assert any("数据库" in item or "database" in item.lower() for item in items)
        assert any("api" in item.lower() or "接口" in item for item in items)
        assert any("测试" in item or "test" in item.lower() for item in items)

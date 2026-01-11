# Week 1 — 提示词技术

你将通过编写提示词来完成特定任务，练习多种提示词技术。每个任务的说明都位于其对应源文件的开头。

## 安装
确保你已完成顶层 `README.md` 中描述的安装步骤。

## Ollama 安装
我们将使用一个名为 [Ollama](https://ollama.com/) 的工具，在你的本地机器上运行各种最先进的 LLM。使用以下任一方法：

- macOS (Homebrew):
  ```bash
  brew install --cask ollama
  ollama serve
  ```

- Linux (推荐):
  ```bash
  curl -fsSL https://ollama.com/install.sh | sh
  ```

- Windows:
  从 [ollama.com/download](https://ollama.com/download) 下载并运行安装程序。

验证安装:
```bash
ollama -v
```

在运行测试脚本之前，确保已拉取以下模型。你只需执行一次（除非你后来删除了这些模型）：
```bash
ollama run mistral-nemo:12b
ollama run llama3.1:8b
```

## 技术和源文件
- K-shot 提示 — `week1/k_shot_prompting.py`
- 思维链 — `week1/chain_of_thought.py`
- 工具调用 — `week1/tool_calling.py`
- 自我一致性提示 — `week1/self_consistency_prompting.py`
- RAG (检索增强生成) — `week1/rag.py`
- 反思 — `week1/reflexion.py`

## 交付成果
- 阅读每个文件中的任务描述。
- 设计并运行提示词（查找代码中所有标记为 `TODO` 的位置）。这应该是你唯一需要修改的内容（即不要修改模型）。
- 迭代改进结果，直到测试脚本通过。
- 保存每种技术的最终提示词和输出。
- 确保在你的提交中包含每种提示词技术文件的完整代码。***仔细检查所有 `TODO` 都已解决。***

## 评分标准（总分 60 分）
- 6 种不同提示词技术中，每种完成的技术 10 分

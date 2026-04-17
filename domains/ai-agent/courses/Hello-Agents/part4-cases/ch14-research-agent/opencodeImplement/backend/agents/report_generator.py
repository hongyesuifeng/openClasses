from typing import List
from backend.tools.llm_tool import LLMTool
from backend.models.data_models import Document, ResearchReport, SearchResult, KnowledgeGraph

class ReportGenerator:
    def __init__(self, llm: LLMTool | None = None):
        self.llm = llm if llm else LLMTool()
    
    def generate(self, topic: str, documents: List[Document], 
                 search_results: List[SearchResult], 
                 knowledge_graph: KnowledgeGraph | None = None) -> ResearchReport:
        
        arxiv_docs = [d for d in documents if d.source == "arXiv"]
        github_docs = [d for d in documents if d.source == "GitHub"]
        web_docs = [d for d in documents if d.source == "Web"]
        youtube_docs = [d for d in documents if d.source == "YouTube"]
        paperwithcode_docs = [d for d in documents if d.source == "Papers With Code"]
        
        all_sources = {
            "学术论文(arXiv)": arxiv_docs,
            "开源项目(GitHub)": github_docs,
            "网络资料": web_docs,
            "视频资源(YouTube)": youtube_docs,
            "论文代码(Papers With Code)": paperwithcode_docs
        }
        
        summary = self._generate_comprehensive_summary(topic, all_sources)
        background = self._generate_detailed_background(topic, all_sources)
        methodology = self._generate_detailed_methodology(topic, all_sources)
        findings = self._generate_detailed_findings(topic, all_sources)
        discussion = self._generate_detailed_discussion(topic, all_sources)
        conclusions = self._generate_conclusions(topic, all_sources)
        
        references = self._generate_references_with_summaries(topic, search_results)
        
        return ResearchReport(
            topic=topic,
            abstract=summary,
            background=background,
            methodology=methodology,
            findings=findings,
            discussion=discussion,
            conclusions=conclusions,
            references=references,
            knowledge_graph=None
        )
    
    def _generate_comprehensive_summary(self, topic: str, all_sources: dict) -> str:
        has_data = any(docs for docs in all_sources.values())
        if not has_data:
            return f"暂无{topic}相关研究数据"
        
        prompt = f"""请为"{topic}"生成一份详尽的中文研究综述摘要（800字以上），要求：
1. 详细阐述该领域的研究意义和重要性，包括学术价值和实际应用价值
2. 全面总结当前主要研究方向和技术进展，涵盖各个分支领域
3. 深入分析该领域面临的主要挑战和存在的问题
4. 展望未来5-10年的发展趋势和潜在突破
5. 介绍相关的代表性研究成果和关键里程碑

请用流畅的中文撰写，分为5-6个段落3-，每段至少4句话，不要使用列表格式。
"""
        content_parts = [f"本报告对{topic}领域进行了全面、深入的文献调研和分析。\n\n"]
        
        for source_name, docs in all_sources.items():
            if docs:
                if "学术论文" in source_name:
                    paper_titles = "\n".join([f"- {d.title[:80]}" for d in docs[:10]])
                    prompt += f"\n\n主要参考学术论文：\n{paper_titles}"
                elif "开源项目" in source_name:
                    proj_names = "\n".join([f"- {d.title}" for d in docs[:8]])
                    prompt += f"\n\n相关开源项目：\n{proj_names}"
                elif "视频" in source_name:
                    video_titles = "\n".join([f"- {d.title[:60]}" for d in docs[:5]])
                    prompt += f"\n\n视频教程资源：\n{video_titles}"
                elif "论文代码" in source_name:
                    pwc_titles = "\n".join([f"- {d.title[:60]}" for d in docs[:5]])
                    prompt += f"\n\nPapers With Code资源：\n{pwc_titles}"
                else:
                    web_info = "\n".join([f"- {d.title[:60]}" for d in docs[:8]])
                    prompt += f"\n\n网络参考资料：\n{web_info}"
        
        llm_summary = self.llm.generate(prompt)
        content_parts.append(llm_summary)
        
        source_summary = "\n\n**数据来源统计**：本报告综合分析了"
        stats = []
        if all_sources.get("学术论文(arXiv)"):
            stats.append(f"{len(all_sources['学术论文(arXiv)'])}篇学术论文")
        if all_sources.get("开源项目(GitHub)"):
            stats.append(f"{len(all_sources['开源项目(GitHub)'])}个开源项目")
        if all_sources.get("网络资料"):
            stats.append(f"{len(all_sources['网络资料'])}篇网络资料")
        if all_sources.get("视频资源(YouTube)"):
            stats.append(f"{len(all_sources['视频资源(YouTube)'])}个视频资源")
        if all_sources.get("论文代码(Papers With Code)"):
            stats.append(f"{len(all_sources['论文代码(Papers With Code)'])}个论文代码资源")
        source_summary += "、".join(stats) + "。"
        content_parts.append(source_summary)
        
        return "".join(content_parts)
    
    def _generate_detailed_background(self, topic: str, all_sources: dict) -> str:
        prompt = f"""请详细介绍"{topic}"领域的历史发展脉络和背景知识，要求：
1. 该领域的起源和发展历程，包括早期研究和关键突破
2. 重要的里程碑事件和技术突破，及其对领域的深远影响
3. 推动该领域发展的主要驱动因素，包括理论驱动和应用驱动
4. 目前在学术和产业界的地位，以及与其他领域的交叉融合
5. 国内外研究现状和主要研究机构的分布

请用详细的中文撰写，分段说明，每个部分至少4-5句话，要有具体的事例和数据支持。
"""
        arxiv_docs = all_sources.get("学术论文(arXiv)", [])
        web_docs = all_sources.get("网络资料", [])
        
        if arxiv_docs:
            prompt += f"\n\n参考论文主题：\n" + "\n".join([f"- {d.title[:60]}" for d in arxiv_docs[:8]])
        
        bg = self.llm.generate(prompt)
        
        doc_count = len(arxiv_docs) + len(web_docs)
        
        result = f"""# {topic} 研究背景与发展历程

## 领域概述

{bg}

## 研究现状概览

本研究共分析了{len(arxiv_docs) if arxiv_docs else 0}篇学术论文、{len(web_docs) if web_docs else 0}篇网络资料，全面梳理了{topic}领域的研究进展和应用现状。通过对多源数据的综合分析，我们能够更全面地了解该领域的发展脉络和未来趋势。

"""
        return result
    
    def _generate_detailed_methodology(self, topic: str, all_sources: dict) -> str:
        content_parts = [f"# {topic} 当前研究方法与技术路线\n\n"]
        
        arxiv_docs = all_sources.get("学术论文(arXiv)", [])
        github_docs = all_sources.get("开源项目(GitHub)", [])
        web_docs = all_sources.get("网络资料", [])
        pwc_docs = all_sources.get("论文代码(Papers With Code)", [])
        
        content_parts.append("## 学术研究方法\n\n")
        
        if arxiv_docs:
            content_parts.append("### 论文研究方法分析\n\n")
            content_parts.append("以下是本领域主要论文的研究方法概述：\n\n")
            for i, doc in enumerate(arxiv_docs[:10], 1):
                title = doc.title[:80]
                summary = doc.summary or doc.content[:200]
                content_parts.append(f"**{i}. {title}**\n")
                content_parts.append(f"   研究摘要：{summary}\n\n")
        else:
            content_parts.append("暂无学术论文数据\n\n")
        
        content_parts.append("## 开源项目与技术实现\n\n")
        
        if github_docs:
            content_parts.append("### 热门开源项目\n\n")
            content_parts.append("以下是该领域最具影响力的开源项目：\n\n")
            for i, doc in enumerate(github_docs[:10], 1):
                content_parts.append(f"**{i}. {doc.title}**\n")
                content_parts.append(f"   项目描述：{doc.snippet[:150]}\n\n")
        
        if pwc_docs:
            content_parts.append("## 论文代码实现 (Papers With Code)\n\n")
            content_parts.append("以下是与论文配套的开源代码资源：\n\n")
            for i, doc in enumerate(pwc_docs[:8], 1):
                content_parts.append(f"**{i}. {doc.title}**\n")
                content_parts.append(f"   描述：{doc.snippet[:120]}\n\n")
        
        if web_docs:
            content_parts.append("## 网络资源与技术博客\n\n")
            content_parts.append("以下是该领域重要的网络参考资料：\n\n")
            for i, doc in enumerate(web_docs[:8], 1):
                content_parts.append(f"**{i}. {doc.title}**\n")
                content_parts.append(f"   内容概要：{doc.snippet[:150]}\n\n")
        
        return "".join(content_parts)
    
    def _generate_detailed_findings(self, topic: str, all_sources: dict) -> List[str]:
        arxiv_docs = all_sources.get("学术论文(arXiv)", [])
        web_docs = all_sources.get("网络资料", [])
        
        prompt = f"""请深入分析"{topic}"领域的主要研究发现和技术成果，要求：
1. 列出8-12个最重要的研究发现和技术突破
2. 每个发现用3-4句话详细说明，包括技术细节、实现方法和应用价值
3. 区分理论贡献和工程实践成果
4. 指出哪些发现具有里程碑意义

请用中文回答，使用以下格式：
- 每个发现用完整的段落描述，不要只用一句话
"""
        
        if arxiv_docs:
            prompt += "\n\n主要参考论文：\n" + "\n".join([f"- {d.title[:70]}" for d in arxiv_docs[:10]])
        
        if web_docs:
            prompt += "\n\n网络参考资料：\n" + "\n".join([f"- {d.title[:50]}" for d in web_docs[:5]])
        
        llm_findings = self.llm.generate(prompt)
        
        findings = []
        for line in llm_findings.split('\n'):
            line = line.strip()
            if line and not line.startswith('#'):
                if len(line) > 20:
                    findings.append(line)
        
        if not findings or len(findings) < 5:
            findings = [
                f"1. **{topic}技术框架**：构建了完整的理论体系和技术路线，为后续研究提供了坚实的基础架构",
                f"2. **核心算法优化**：提出了多项创新性算法，在效率和准确性方面取得了显著提升",
                f"3. **应用场景拓展**：在多个实际应用场景中验证了技术的可行性并取得了良好效果",
                f"4. **性能提升**：通过技术改进实现了显著的性能提升，包括计算效率和资源利用率",
                f"5. **实践经验总结**：积累了丰富的工程实践经验和最佳实践，为产业发展提供了重要参考",
                f"6. **跨领域融合**：与其他技术领域的交叉融合产生了新的研究方向和应用机会",
                f"7. **工具和平台发展**：出现了多个重要的工具和平台，降低了技术应用的门槛",
                f"8. **标准和规范制定**：逐步建立了行业标准和规范，促进了技术的规范化发展"
            ]
        
        return findings[:12]
    
    def _generate_detailed_discussion(self, topic: str, all_sources: dict) -> str:
        arxiv_docs = all_sources.get("学术论文(arXiv)", [])
        web_docs = all_sources.get("网络资料", [])
        
        prompt = f"""请深入分析"{topic}"领域的未来发展趋势和面临的挑战，要求：
1. 详细讨论当前技术的主要局限性和存在的问题（至少3个方面）
2. 分析未来5-10年的研究方向和发展趋势（至少4个方向）
3. 预测可能的技术突破和产业变革
4. 提出该领域发展需要的支持条件和政策建议
5. 分析对相关行业和社会的影响

请用详细的中文撰写，分段说明，每个部分至少4-5句话，要有深度分析。
"""
        
        if arxiv_docs:
            prompt += "\n\n参考论文：\n" + "\n".join([f"- {d.title[:60]}" for d in arxiv_docs[:8]])
        
        if web_docs:
            prompt += "\n\n网络资料：\n" + "\n".join([f"- {d.title[:50]}" for d in web_docs[:5]])
        
        discussion = self.llm.generate(prompt)
        
        result = f"""# {topic} 未来发展趋势与挑战分析

{discussion}

## 综合分析

综合上述分析，{topic}领域正处于快速发展阶段，未来发展潜力巨大。从技术演进趋势来看，该领域正在向更高效、更智能、更普惠的方向发展。从产业应用角度来看，技术的成熟度不断提高，应用场景持续拓展。建议相关研究人员和从业者密切关注技术前沿动态，加强产学研深度合作，共同推动技术创新和产业化落地。

"""
        return result
    
    def _generate_conclusions(self, topic: str, all_sources: dict) -> List[str]:
        arxiv_docs = all_sources.get("学术论文(arXiv)", [])
        web_docs = all_sources.get("网络资料", [])
        
        prompt = f"""请为"{topic}"领域生成全面的研究结论，要求：
1. 总结该领域的主要研究贡献和成就（至少3点）
2. 详细指出当前研究的主要发现和成果（至少4点）
3. 提出对未来研究的建议和展望（至少3点）
4. 分析该领域对学术和产业的贡献与价值
5. 用8-10个要点概括，每个要点3-4句话

请用中文回答，每点都要有充分的论述。
"""
        
        if arxiv_docs:
            prompt += "\n\n参考论文：\n" + "\n".join([f"- {d.title[:60]}" for d in arxiv_docs[:8]])
        
        if web_docs:
            prompt += "\n\n网络资料：\n" + "\n".join([f"- {d.title[:50]}" for d in web_docs[:5]])
        
        conclusions = self.llm.generate(prompt)
        
        result = []
        for line in conclusions.split('\n'):
            line = line.strip()
            if line and len(line) > 15:
                result.append(line)
        
        if not result or len(result) < 4:
            result = [
                f"1. {topic}是一个具有重要研究价值和应用前景的前沿领域，对学术发展和产业升级都有重要意义",
                f"2. 当前研究已取得显著进展，在理论基础、算法设计和应用实践等方面都有重要突破",
                f"3. 技术的成熟度不断提高，已经开始在多个实际场景中得到应用验证",
                f"4. 未来研究应重点关注算法效率提升、实际应用落地和产业化推广等方向",
                f"5. 需要加强跨学科合作，推动理论研究与实践应用的深度结合",
                f"6. 产学研合作机制有待完善，需要建立更有效的成果转化渠道",
                f"7. 人才培养和团队建设是推动该领域持续发展的关键因素",
                f"8. 国际合作与交流对于跟踪前沿技术和提升研究水平具有重要作用"
            ]
        
        return result[:10]
    
    def _generate_references_with_summaries(self, topic: str, 
                                            search_results: List[SearchResult]) -> List[SearchResult]:
        references = []
        
        unique_sources = {}
        for r in search_results:
            key = r.url if r.url else r.title
            if key not in unique_sources:
                unique_sources[key] = r
        
        all_results = list(unique_sources.values())
        
        for i, r in enumerate(all_results[:25], 1):
            source_type = r.source if r.source else "未知来源"
            
            prompt = f"""请为以下参考资料生成一个详细的中文小结（80-120字）：
标题：{r.title}
来源类型：{source_type}
内容摘要：{r.snippet[:300]}

要求：
1. 小结要概括该资料的主要内容和核心观点
2. 说明该资料的来源背景和可信度
3. 指出该资料的研究价值或应用价值
4. 使用流畅的中文，不要使用列表格式

请直接输出小结内容，不要添加标题。
"""
            summary = self.llm.generate(prompt).strip()
            
            if not summary or len(summary) < 30:
                summary = f"该资料来自{source_type}，主要内容涉及{r.title}。经分析，该资料对了解{topic}领域具有重要参考价值，建议进一步阅读原文获取详细信息。"
            
            r.summary = summary
            references.append(r)
        
        return references
    
    def to_html(self, report: ResearchReport) -> str:
        html = f"""
        <div class="report">
            <h1>{report.topic}</h1>
            <div class="abstract">{report.abstract}</div>
            <div class="background">{report.background}</div>
            <div class="current">{report.methodology}</div>
            <div class="challenges"><ul>{"".join(f"<li>{f}</li>" for f in report.findings)}</ul></div>
            <div class="future">{report.discussion}</div>
        </div>
        """
        return html

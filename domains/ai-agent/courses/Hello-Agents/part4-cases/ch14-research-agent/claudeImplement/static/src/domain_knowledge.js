/**
 * 领域知识库 - 提供详细的主题知识用于生成高质量研究报告
 */

export const DomainKnowledge = {
    '人工智能': {
        keywords: ['人工智能', 'ai', 'artificial intelligence', '智能', 'ai技术'],
        history: [
            { year: '1950', event: '图灵提出图灵测试，奠定AI理论基础' },
            { year: '1956', event: '达特茅斯会议，"人工智能"术语正式诞生' },
            { year: '1966', event: 'ELIZA聊天程序诞生，早期自然语言处理' },
            { year: '1980', event: '专家系统兴起，第一次AI商业化浪潮' },
            { year: '1997', event: '深蓝击败国际象棋世界冠军卡斯帕罗夫' },
            { year: '2006', event: 'Hinton提出深度置信网络，深度学习复兴' },
            { year: '2012', event: 'AlexNet赢得ImageNet竞赛，深度学习爆发' },
            { year: '2016', event: 'AlphaGo击败围棋世界冠军李世石' },
            { year: '2017', event: 'Transformer架构提出，NLP进入新纪元' },
            { year: '2020', event: 'GPT-3发布，大规模语言模型时代开启' },
            { year: '2022', event: 'ChatGPT发布，引发全球AI热潮' },
            { year: '2023', event: 'GPT-4发布，多模态大模型成为主流' }
        ],
        concepts: [
            { name: '机器学习', desc: '让计算机从数据中学习规律，无需显式编程' },
            { name: '深度学习', desc: '使用多层神经网络进行特征学习和模式识别' },
            { name: '自然语言处理', desc: '让计算机理解、生成和处理人类语言' },
            { name: '计算机视觉', desc: '让计算机理解和处理图像、视频信息' },
            { name: '强化学习', desc: '通过与环境交互学习最优策略' },
            { name: '大语言模型', desc: '基于Transformer的超大规模语言模型' }
        ],
        applications: [
            { field: '医疗健康', cases: '疾病诊断、药物研发、医学影像分析' },
            { field: '金融服务', cases: '风险评估、欺诈检测、智能投顾' },
            { field: '智能制造', cases: '质量控制、预测性维护、供应链优化' },
            { field: '交通出行', cases: '自动驾驶、智能交通管理、物流优化' },
            { field: '教育培训', cases: '个性化学习、智能辅导、教育评估' }
        ],
        challenges: [
            '数据隐私与安全问题',
            '算法偏见与公平性',
            '模型可解释性不足',
            '计算资源消耗巨大',
            '通用人工智能尚未实现'
        ],
        trends: [
            '多模态AI融合发展',
            'AI Agent智能体应用',
            '边缘AI部署普及',
            'AI伦理与治理完善',
            'AGI通用人工智能探索'
        ]
    },

    '机器学习': {
        keywords: ['机器学习', 'machine learning', 'ml', '学习算法', '数据挖掘'],
        history: [
            { year: '1943', event: 'McCulloch和Pitts提出第一个神经网络模型' },
            { year: '1950', event: '图灵提出"计算机械和智能"' },
            { year: '1959', event: 'Arthur Samuel定义"机器学习"概念' },
            { year: '1963', event: 'Morgan和Samuel开发checkers程序' },
            { year: '1986', event: '反向传播算法重新被发现和应用' },
            { year: '1995', event: '支持向量机(SVM)算法提出' },
            { year: '1997', event: '随机森林算法提出' },
            { year: '2001', event: 'Boosting算法广泛应用' },
            { year: '2012', event: '深度学习在ImageNet取得突破' },
            { year: '2014', event: 'GAN生成对抗网络提出' },
            { year: '2017', event: 'Transformer架构革新NLP' },
            { year: '2020', event: '自监督学习成为研究热点' }
        ],
        concepts: [
            { name: '监督学习', desc: '使用标注数据训练模型进行预测' },
            { name: '无监督学习', desc: '从未标注数据中发现隐藏模式' },
            { name: '半监督学习', desc: '结合少量标注和大量未标注数据' },
            { name: '强化学习', desc: '通过环境反馈学习最优策略' },
            { name: '迁移学习', desc: '将已学知识迁移到新任务' },
            { name: '联邦学习', desc: '分布式隐私保护的协作学习' }
        ],
        applications: [
            { field: '推荐系统', cases: '电商推荐、内容推荐、广告投放' },
            { field: '图像识别', cases: '人脸识别、物体检测、医学影像' },
            { field: '语音处理', cases: '语音识别、语音合成、声纹识别' },
            { field: '自然语言', cases: '文本分类、情感分析、机器翻译' },
            { field: '预测分析', cases: '销售预测、风险预测、需求预测' }
        ],
        challenges: [
            '数据质量和标注成本',
            '模型泛化能力',
            '过拟合与欠拟合',
            '特征工程复杂性',
            '实时性要求'
        ],
        trends: [
            'AutoML自动化机器学习',
            '小样本学习',
            '可解释机器学习',
            '边缘机器学习',
            '绿色机器学习'
        ]
    },

    'AI编程': {
        keywords: ['ai编程', 'ai编程', 'ai辅助编程', 'copilot', '代码生成'],
        history: [
            { year: '2015', event: 'GitHub引入代码搜索和智能提示' },
            { year: '2017', event: 'TabNine基于GPT-2的代码补全' },
            { year: '2020', event: 'OpenAI发布Codex代码生成模型' },
            { year: '2021', event: 'GitHub Copilot技术预览发布' },
            { year: '2021', event: 'Amazon CodeWhisperer发布' },
            { year: '2022', event: 'ChatGPT支持代码生成和解释' },
            { year: '2022', event: 'GitHub Copilot正式发布' },
            { year: '2023', event: 'GPT-4增强代码理解和生成能力' },
            { year: '2023', event: 'Claude支持大规模代码分析' },
            { year: '2023', event: 'CodeLlama开源代码模型发布' },
            { year: '2024', event: 'Devin AI软件工程师发布' },
            { year: '2024', event: 'Claude 3.5 Sonnet代码能力大幅提升' }
        ],
        concepts: [
            { name: '代码补全', desc: '基于上下文预测和补全代码片段' },
            { name: '代码生成', desc: '根据自然语言描述生成完整代码' },
            { name: '代码解释', desc: '解释代码逻辑和功能' },
            { name: '代码重构', desc: '优化代码结构和质量' },
            { name: 'Bug检测', desc: '自动发现代码中的潜在问题' },
            { name: '测试生成', desc: '自动生成单元测试代码' }
        ],
        applications: [
            { field: 'IDE集成', cases: 'VSCode、JetBrains等IDE插件' },
            { field: '代码审查', cases: '自动代码审查、安全漏洞检测' },
            { field: '文档生成', cases: '自动生成代码文档和注释' },
            { field: '代码转换', cases: '不同编程语言之间的代码转换' },
            { field: '学习辅助', cases: '编程学习、代码示例生成' }
        ],
        challenges: [
            '生成代码的正确性和安全性',
            '代码版权和法律问题',
            '对程序员工作的影响',
            '代码质量和可维护性',
            '过度依赖导致技能退化'
        ],
        trends: [
            'AI Agent自主编程',
            '多文件代码理解',
            '代码与设计联动',
            '个性化代码风格',
            '企业级代码安全'
        ]
    },

    '游戏客户端开发': {
        keywords: ['游戏客户端', '游戏开发', 'game client', '游戏前端', '游戏程序'],
        history: [
            { year: '1972', event: 'Pong游戏诞生，电子游戏时代开启' },
            { year: '1980', event: 'Pac-Man发布，街机游戏黄金时代' },
            { year: '1985', event: '超级马里奥发布，奠定平台游戏基础' },
            { year: '1993', event: 'Doom发布，3D游戏时代开启' },
            { year: '1996', event: 'Quake推出，网络多人游戏兴起' },
            { year: '2000', event: 'PS2发布，游戏主机进入新时代' },
            { year: '2004', event: 'DirectX 9.0c，游戏图形技术成熟' },
            { year: '2008', event: 'App Store发布，手游市场爆发' },
            { year: '2013', event: 'Unity成为主流游戏引擎' },
            { year: '2017', event: 'Fortnite引领大逃杀游戏风潮' },
            { year: '2020', event: '次世代主机PS5/Xbox发布' },
            { year: '2023', event: '虚幻引擎5游戏大量发布' }
        ],
        concepts: [
            { name: '渲染管线', desc: '图形从数据到屏幕的处理流程' },
            { name: '物理引擎', desc: '模拟真实物理效果的系统' },
            { name: '网络同步', desc: '多人游戏状态同步技术' },
            { name: '资源管理', desc: '游戏资源的加载、缓存和释放' },
            { name: 'UI系统', desc: '游戏界面和用户交互系统' },
            { name: '音频系统', desc: '游戏音效和音乐播放管理' }
        ],
        applications: [
            { field: '手机游戏', cases: 'iOS/Android原生和跨平台游戏' },
            { field: 'PC游戏', cases: 'Windows/Mac客户端游戏' },
            { field: '主机游戏', cases: 'PlayStation/Xbox/Switch游戏' },
            { field: '网页游戏', cases: 'WebGL和Canvas网页游戏' },
            { field: 'VR/AR游戏', cases: '虚拟现实和增强现实游戏' }
        ],
        challenges: [
            '多平台适配和兼容性',
            '性能优化和帧率稳定',
            '网络延迟和同步问题',
            '安全性反外挂',
            '版本更新和热更新'
        ],
        trends: [
            '云游戏技术发展',
            'AI辅助游戏开发',
            '跨平台解决方案',
            '光线追踪普及',
            '实时渲染技术进步'
        ]
    },

    '游戏引擎': {
        keywords: ['游戏引擎', 'game engine', 'unity', 'unreal', '游戏框架'],
        history: [
            { year: '1988', event: 'id Software成立，早期游戏引擎雏形' },
            { year: '1993', event: 'Doom引擎发布，模块化设计' },
            { year: '1996', event: 'Quake引擎，真3D渲染' },
            { year: '1998', event: 'Unreal Engine 1发布' },
            { year: '2000', event: 'RenderWare成为主流中间件' },
            { year: '2004', event: 'Source引擎发布(Half-Life 2)' },
            { year: '2005', event: 'Unity Technologies成立' },
            { year: '2008', event: 'CryEngine 3发布' },
            { year: '2012', event: 'Unreal Engine 4发布' },
            { year: '2014', event: 'Unity 5发布，引擎民主化' },
            { year: '2020', event: 'Unreal Engine 5公布' },
            { year: '2022', event: 'Unreal Engine 5正式发布，Nanite和Lumen技术' }
        ],
        concepts: [
            { name: '渲染引擎', desc: '负责图形渲染的核心模块' },
            { name: '物理引擎', desc: '处理碰撞检测和物理模拟' },
            { name: '音频引擎', desc: '音效播放和空间音频处理' },
            { name: '脚本系统', desc: '游戏逻辑编程支持' },
            { name: '编辑器', desc: '可视化游戏开发工具' },
            { name: '资源管理', desc: '资产导入、管理和优化' }
        ],
        applications: [
            { field: '游戏开发', cases: '各类游戏开发的核心工具' },
            { field: '影视制作', cases: '虚拟制片、实时渲染' },
            { field: '建筑可视化', cases: '建筑效果图、虚拟漫游' },
            { field: '培训仿真', cases: '军事、医疗、驾驶模拟' },
            { field: '元宇宙', cases: '虚拟世界、数字孪生' }
        ],
        challenges: [
            '学习曲线陡峭',
            '性能与画质的平衡',
            '跨平台兼容性',
            '授权和费用问题',
            '技术更新迭代快'
        ],
        trends: [
            '云游戏引擎',
            'AI驱动的内容生成',
            '实时全局光照',
            '无代码/低代码开发',
            '开放世界技术'
        ]
    },

    '软件架构': {
        keywords: ['软件架构', 'software architecture', '架构设计', '系统架构', '架构模式'],
        history: [
            { year: '1968', event: '软件工程概念提出' },
            { year: '1970', event: '结构化编程成为主流' },
            { year: '1992', event: '分层架构模式普及' },
            { year: '1994', event: 'GOF设计模式书籍出版' },
            { year: '1996', event: 'CORBA和分布式架构兴起' },
            { year: '2000', event: 'J2EE和EJB企业级架构' },
            { year: '2003', event: 'SOA面向服务架构' },
            { year: '2010', event: '微服务架构概念提出' },
            { year: '2014', event: 'Docker容器化技术流行' },
            { year: '2015', event: 'Kubernetes成为容器编排标准' },
            { year: '2018', event: 'Serverless架构兴起' },
            { year: '2020', event: '云原生架构成为主流' }
        ],
        concepts: [
            { name: '分层架构', desc: '系统按功能分层，如MVC模式' },
            { name: '微服务', desc: '将应用拆分为独立的小服务' },
            { name: '事件驱动', desc: '通过事件进行组件间通信' },
            { name: '领域驱动', desc: '以业务领域为核心的设计方法' },
            { name: 'CQRS', desc: '命令查询职责分离' },
            { name: '六边形架构', desc: '端口和适配器的架构模式' }
        ],
        applications: [
            { field: '企业应用', cases: 'ERP、CRM、OA系统架构' },
            { field: '互联网应用', cases: '电商、社交、内容平台' },
            { field: '金融系统', cases: '支付、交易、风控系统' },
            { field: '物联网', cases: '设备管理、数据处理平台' },
            { field: '大数据', cases: '数据采集、处理、分析平台' }
        ],
        challenges: [
            '系统复杂度管理',
            '技术选型决策',
            '性能与可扩展性平衡',
            '团队协作和沟通',
            '遗留系统改造'
        ],
        trends: [
            '云原生架构',
            '服务网格(Service Mesh)',
            '边缘计算架构',
            '低代码平台',
            'AI辅助架构设计'
        ]
    }
};

/**
 * 根据主题获取领域知识
 */
export function getDomainKnowledge(topic) {
    const lowerTopic = topic.toLowerCase();

    for (const [key, value] of Object.entries(DomainKnowledge)) {
        if (lowerTopic.includes(key.toLowerCase()) ||
            value.keywords.some(k => lowerTopic.includes(k.toLowerCase()))) {
            return { name: key, ...value };
        }
    }

    return null;
}

/**
 * 生成历史发展脉络内容
 */
export function generateHistorySection(domain) {
    if (!domain || !domain.history) {
        return '暂无历史发展信息';
    }

    let content = '## 历史发展脉络\n\n';
    content += '### 发展时间线\n\n';

    // 按时代分组
    const eras = [
        { name: '萌芽期', start: 1950, end: 1980 },
        { name: '发展期', start: 1980, end: 2000 },
        { name: '成熟期', start: 2000, end: 2015 },
        { name: '爆发期', start: 2015, end: 2025 }
    ];

    eras.forEach(era => {
        const events = domain.history.filter(e => {
            const year = parseInt(e.year);
            return year >= era.start && year < era.end;
        });

        if (events.length > 0) {
            content += `**${era.name} (${era.start}-${era.end})**\n\n`;
            events.forEach(e => {
                content += `- **${e.year}年**: ${e.event}\n`;
            });
            content += '\n';
        }
    });

    return content;
}

/**
 * 生成技术原理内容
 */
export function generateConceptsSection(domain) {
    if (!domain || !domain.concepts) {
        return '暂无技术原理信息';
    }

    let content = '## 核心技术原理\n\n';

    domain.concepts.forEach(c => {
        content += `### ${c.name}\n\n${c.desc}\n\n`;
    });

    return content;
}

/**
 * 生成应用场景内容
 */
export function generateApplicationsSection(domain) {
    if (!domain || !domain.applications) {
        return '暂无应用场景信息';
    }

    let content = '## 主要应用场景\n\n';

    domain.applications.forEach(app => {
        content += `### ${app.field}\n\n${app.cases}\n\n`;
    });

    return content;
}

/**
 * 生成未来发展趋势内容
 */
export function generateTrendsSection(domain) {
    if (!domain || !domain.trends) {
        return '暂无发展趋势信息';
    }

    let content = '## 未来发展趋势\n\n';

    domain.trends.forEach((trend, index) => {
        content += `${index + 1}. ${trend}\n`;
    });

    content += '\n### 面临的挑战\n\n';

    if (domain.challenges) {
        domain.challenges.forEach((challenge, index) => {
            content += `${index + 1}. ${challenge}\n`;
        });
    }

    return content;
}

export default DomainKnowledge;

/**
 * 完整功能测试脚本
 * 测试研究代理系统的完整工作流程
 */

import { ResearchOrchestrator } from './src/orchestrator.js';

async function runCompleteTest() {
    console.log('🧪 开始完整功能测试...\n');
    console.log('='.repeat(60));

    const results = {
        framework: false,
        orchestrator: false,
        research: false,
        errors: []
    };

    // 测试1: 创建Orchestrator
    try {
        console.log('\n📋 测试1: 创建研究编排器');
        const orchestrator = new ResearchOrchestrator({
            llmConfig: { delay: 500 }
        });
        console.log('  ✓ Orchestrator创建成功');

        // 获取系统状态
        const status = orchestrator.getStatus();
        console.log('  ✓ 系统状态:', JSON.stringify(status.agents, null, 2));

        results.orchestrator = true;
        results.framework = true;
    } catch (error) {
        console.log('  ✗ 错误:', error.message);
        results.errors.push({ test: 'orchestrator', error: error.message });
    }

    // 测试2: 执行完整研究流程
    try {
        console.log('\n📋 测试2: 执行完整研究流程');
        console.log('  研究主题: "人工智能在医疗诊断中的应用"');
        console.log('  预计耗时: ~30秒');

        const orchestrator = new ResearchOrchestrator({
            llmConfig: { delay: 500 }
        });

        // 监听进度
        const steps = [];
        orchestrator.onProgress((type, data) => {
            if (!steps.includes(type)) {
                steps.push(type);
                console.log(`  ➤ ${type}: ${JSON.stringify(data).substring(0, 60)}...`);
            }
        });

        // 执行研究
        const researchResult = await orchestrator.conductResearch('人工智能在医疗诊断中的应用', {
            parallelAnalyzers: 2,
            search: { maxIterations: 2, resultsPerQuery: 5 }
        });

        if (researchResult.success) {
            console.log('\n  ✓ 研究成功完成！');
            console.log('  ✓ 来源数量:', researchResult.sources?.length || researchResult.metadata?.sourcesCount);
            console.log('  ✓ 分析数量:', researchResult.analyses?.length);
            console.log('  ✓ 报告标题:', researchResult.report?.title);
            console.log('  ✓ 质量评分:', researchResult.evaluation?.overallScore);
            console.log('  ✓ 耗时:', Math.round((researchResult.metadata?.duration || 0) / 1000), '秒');

            results.research = true;
        } else {
            console.log('  ✗ 研究失败:', researchResult.error);
            results.errors.push({ test: 'research', error: researchResult.error });
        }
    } catch (error) {
        console.log('  ✗ 错误:', error.message);
        console.log('  ✗ 堆栈:', error.stack);
        results.errors.push({ test: 'research', error: error.message, stack: error.stack });
    }

    // 输出测试总结
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试总结:');
    console.log(`  Agent框架: ${results.framework ? '✅ 通过' : '❌ 失败'}`);
    console.log(`  Orchestrator: ${results.orchestrator ? '✅ 通过' : '❌ 失败'}`);
    console.log(`  研究流程: ${results.research ? '✅ 通过' : '❌ 失败'}`);
    console.log('='.repeat(60));

    if (results.errors.length > 0) {
        console.log('\n❌ 错误详情:');
        results.errors.forEach((err, i) => {
            console.log(`\n  [${i + 1}] ${err.test}:`);
            console.log(`      ${err.error}`);
            if (err.stack) {
                console.log(`      堆栈: ${err.stack.split('\n').slice(0, 3).join('\n      ')}`);
            }
        });
    }

    if (results.framework && results.orchestrator && results.research) {
        console.log('\n🎉 所有测试通过！系统运行正常！');
        console.log('\n✨ 可以在浏览器中访问: http://localhost:5050');
        console.log('   输入研究主题并点击"开始研究"按钮即可使用。');
        return true;
    } else {
        console.log('\n❌ 部分测试失败，请检查错误信息。');
        return false;
    }
}

// 运行测试
runCompleteTest().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
});

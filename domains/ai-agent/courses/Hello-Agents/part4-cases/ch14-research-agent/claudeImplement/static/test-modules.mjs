/**
 * 模块验证测试脚本
 * 在Node.js环境中验证所有模块是否可以正确导入
 */

// 模拟浏览器环境
global.self = global;
global.window = global;

async function testModules() {
    console.log('🔍 开始测试模块加载...\n');

    const results = {
        passed: 0,
        failed: 0,
        errors: []
    };

    // 测试agent_framework.js
    try {
        console.log('测试: agent_framework.js');
        const framework = await import('./src/framework/agent_framework.js');
        console.log('  ✓ 导出:', Object.keys(framework));
        results.passed++;
    } catch (error) {
        console.log('  ✗ 错误:', error.message);
        results.failed++;
        results.errors.push({ module: 'agent_framework.js', error: error.message });
    }

    // 测试planner_agent.js
    try {
        console.log('\n测试: planner_agent.js');
        const planner = await import('./src/agents/planner_agent.js');
        console.log('  ✓ 导出:', Object.keys(planner));
        results.passed++;
    } catch (error) {
        console.log('  ✗ 错误:', error.message);
        results.failed++;
        results.errors.push({ module: 'planner_agent.js', error: error.message });
    }

    // 测试searcher_agent.js
    try {
        console.log('\n测试: searcher_agent.js');
        const searcher = await import('./src/agents/searcher_agent.js');
        console.log('  ✓ 导出:', Object.keys(searcher));
        results.passed++;
    } catch (error) {
        console.log('  ✗ 错误:', error.message);
        results.failed++;
        results.errors.push({ module: 'searcher_agent.js', error: error.message });
    }

    // 测试analyzer_agent.js
    try {
        console.log('\n测试: analyzer_agent.js');
        const analyzer = await import('./src/agents/analyzer_agent.js');
        console.log('  ✓ 导出:', Object.keys(analyzer));
        results.passed++;
    } catch (error) {
        console.log('  ✗ 错误:', error.message);
        results.failed++;
        results.errors.push({ module: 'analyzer_agent.js', error: error.message });
    }

    // 测试synthesizer_agent.js
    try {
        console.log('\n测试: synthesizer_agent.js');
        const synthesizer = await import('./src/agents/synthesizer_agent.js');
        console.log('  ✓ 导出:', Object.keys(synthesizer));
        results.passed++;
    } catch (error) {
        console.log('  ✗ 错误:', error.message);
        results.failed++;
        results.errors.push({ module: 'synthesizer_agent.js', error: error.message });
    }

    // 测试evaluator_agent.js
    try {
        console.log('\n测试: evaluator_agent.js');
        const evaluator = await import('./src/agents/evaluator_agent.js');
        console.log('  ✓ 导出:', Object.keys(evaluator));
        results.passed++;
    } catch (error) {
        console.log('  ✗ 错误:', error.message);
        results.failed++;
        results.errors.push({ module: 'evaluator_agent.js', error: error.message });
    }

    // 测试orchestrator.js
    try {
        console.log('\n测试: orchestrator.js');
        const orchestrator = await import('./src/orchestrator.js');
        console.log('  ✓ 导出:', Object.keys(orchestrator));
        results.passed++;
    } catch (error) {
        console.log('  ✗ 错误:', error.message);
        results.failed++;
        results.errors.push({ module: 'orchestrator.js', error: error.message });
    }

    // 输出总结
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试结果总结:');
    console.log(`  通过: ${results.passed}`);
    console.log(`  失败: ${results.failed}`);
    console.log(`  总计: ${results.passed + results.failed}`);
    console.log('='.repeat(50));

    if (results.errors.length > 0) {
        console.log('\n❌ 错误详情:');
        results.errors.forEach(err => {
            console.log(`  ${err.module}: ${err.error}`);
        });
    }

    if (results.failed === 0) {
        console.log('\n✅ 所有模块加载测试通过！');
        console.log('\n🚀 系统已就绪，可以访问: http://localhost:5050');
    } else {
        console.log('\n❌ 部分模块加载失败，请检查错误信息。');
    }
}

testModules().catch(console.error);

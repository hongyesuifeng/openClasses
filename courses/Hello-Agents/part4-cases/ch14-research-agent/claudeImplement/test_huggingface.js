/**
 * HuggingFace API 测试脚本 (Node.js版本)
 * 测试API Token是否有效，并测试"AI编程"主题的研究输出
 */

const https = require('https');

const API_TOKEN = process.env.HUGGINGFACE_TOKEN || 'YOUR_HUGGINGFACE_TOKEN_HERE';
const MODEL_ID = 'Qwen/Qwen2.5-7B-Instruct';
const API_URL = `api-inference.huggingface.co`;
const API_PATH = `/models/${MODEL_ID}/v1/chat/completions`;

function makeRequest(payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);

        const options = {
            hostname: API_URL,
            port: 443,
            path: API_PATH,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        console.log('🔗 发送请求到:', `https://${API_URL}${API_PATH}`);

        const req = https.request(options, (res) => {
            let responseData = '';

            console.log('📡 HTTP状态码:', res.statusCode);

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                console.log('📦 响应数据长度:', responseData.length);

                try {
                    const result = JSON.parse(responseData);
                    if (res.statusCode === 200) {
                        resolve(result);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData.substring(0, 500)}`));
                    }
                } catch (e) {
                    reject(new Error(`解析失败: ${responseData.substring(0, 500)}\n原始错误: ${e.message}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ 请求错误:', error.message);
            console.error('错误堆栈:', error.stack);
            reject(error);
        });

        req.on('timeout', () => {
            console.error('❌ 请求超时');
            req.destroy();
            reject(new Error('请求超时'));
        });

        req.setTimeout(30000); // 30秒超时
        req.write(data);
        req.end();
    });
}

async function testAPI() {
    console.log('🧪 测试HuggingFace API...\n');
    console.log('📝 测试1: AI编程研究计划生成');
    console.log('模型:', MODEL_ID);
    console.log('Token:', API_TOKEN.substring(0, 15) + '...\n');

    const testPrompt = `你是研究代理系统中的规划Agent。请为以下研究主题制定研究计划：

研究主题: AI编程

请输出一个清晰的执行计划，包含5-7个具体步骤。`;

    try {
        const startTime = Date.now();

        const payload = {
            model: MODEL_ID,
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的研究助手，擅长信息检索、文献分析和知识整合。请用中文回答，提供详细、准确、结构化的内容。'
                },
                {
                    role: 'user',
                    content: testPrompt
                }
            ],
            max_tokens: 2048,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true
        };

        const data = await makeRequest(payload);
        const duration = Date.now() - startTime;
        const result = data.choices[0].message.content;

        console.log('✅ API调用成功!');
        console.log('⏱️ 响应时间:', duration, 'ms');
        console.log('📦 Token使用:', data.usage ?
            `输入${data.usage.prompt_tokens} + 输出${data.usage.completion_tokens} = 总计${data.usage.total_tokens}` :
            'N/A');
        console.log('\n📄 模型输出:');
        console.log('═'.repeat(80));
        console.log(result);
        console.log('═'.repeat(80));

        // 测试2: 搜索查询生成
        console.log('\n\n📝 测试2: 搜索查询生成');
        const searchPayload = {
            model: MODEL_ID,
            messages: [
                {
                    role: 'system',
                    content: '你是研究代理系统中的搜索Agent，负责生成高质量的搜索查询。返回JSON格式。'
                },
                {
                    role: 'user',
                    content: `请为"AI编程"这个研究主题生成5个搜索查询，用于信息检索。
每个查询包含query（搜索关键词）、source（来源类型：academic/web/news）、reason（原因）。
返回JSON格式：{"queries": [...]}`
                }
            ],
            max_tokens: 1024,
            temperature: 0.7
        };

        const searchData = await makeRequest(searchPayload);
        console.log('✅ 搜索查询生成成功!');
        console.log('📄 模型输出:');
        console.log('═'.repeat(80));
        console.log(searchData.choices[0].message.content);
        console.log('═'.repeat(80));

        // 测试3: 内容分析
        console.log('\n\n📝 测试3: AI编程领域分析');
        const analysisPayload = {
            model: MODEL_ID,
            messages: [
                {
                    role: 'system',
                    content: '你是研究代理系统中的分析Agent，擅长深度分析技术领域的发展。请从以下维度分析：1.历史发展 2.当前挑战 3.未来趋势'
                },
                {
                    role: 'user',
                    content: '请分析"AI编程"领域的发展历程、当前挑战和未来趋势。'
                }
            ],
            max_tokens: 2048,
            temperature: 0.7
        };

        const analysisData = await makeRequest(analysisPayload);
        console.log('✅ 内容分析成功!');
        console.log('📄 模型输出:');
        console.log('═'.repeat(80));
        console.log(analysisData.choices[0].message.content);
        console.log('═'.repeat(80));

        console.log('\n\n✅ 所有测试完成! HuggingFace API工作正常。');
        console.log('\n📋 配置信息:');
        console.log('   模型:', MODEL_ID);
        console.log('   Token:', API_TOKEN.substring(0, 15) + '...');
        console.log('   状态: ✅ 有效\n');

        console.log('🎉 可以在浏览器中使用了！');
        console.log('📌 访问 http://localhost:5050');
        console.log('📌 点击右上角"⚙️ API配置"');
        console.log('📌 输入Token:', API_TOKEN);
        console.log('📌 保存后即可开始研究');

        return true;

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.log('\n可能的原因:');
        console.log('1. Token无效或已过期');
        console.log('2. 网络连接问题');
        console.log('3. API服务暂时不可用');
        console.log('4. 模型正在加载中（第一次调用需要等待）');
        return false;
    }
}

// 运行测试
testAPI().then(success => {
    process.exit(success ? 0 : 1);
});

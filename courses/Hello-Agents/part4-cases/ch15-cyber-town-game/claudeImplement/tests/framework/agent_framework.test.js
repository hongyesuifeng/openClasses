/**
 * Agent 框架测试
 * 测试 src/framework/agent_framework.js 的核心类
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { Message, MessageBus, ToolRegistry, MemorySystem, BaseAgent } from '../../src/framework/agent_framework.js';

describe('Agent Framework', () => {

  // ============ Message 类测试 ============
  describe('Message', () => {
    test('应该正确创建消息并生成 ID', () => {
      const msg = new Message('Alice', 'Bob', 'text', 'Hello');

      expect(msg.id).toBeDefined();
      expect(msg.id).toMatch(/^msg_/);
      expect(msg.sender).toBe('Alice');
      expect(msg.receiver).toBe('Bob');
      expect(msg.type).toBe('text');
      expect(msg.content).toBe('Hello');
      expect(msg.timestamp).toBeDefined();
    });

    test('应该正确处理元数据', () => {
      const metadata = { priority: 'high', tags: ['urgent'] };
      const msg = new Message('Alice', 'Bob', 'action', 'move', metadata);

      expect(msg.metadata).toEqual(metadata);
    });

    test('每次创建消息应该生成不同的 ID', () => {
      const msg1 = new Message('A', 'B', 'text', 'test1');
      const msg2 = new Message('A', 'B', 'text', 'test2');

      expect(msg1.id).not.toBe(msg2.id);
    });
  });

  // ============ MessageBus 类测试 ============
  describe('MessageBus', () => {
    let bus;

    beforeEach(() => {
      bus = new MessageBus();
    });

    test('应该正确初始化', () => {
      expect(bus.subscribers).toBeInstanceOf(Map);
      expect(bus.messageHistory).toEqual([]);
      expect(bus.maxHistory).toBe(1000);
    });

    test('应该正确订阅消息', () => {
      const callback = jest.fn();
      bus.subscribe('Alice', callback);

      expect(bus.subscribers.has('Alice')).toBe(true);
      expect(bus.subscribers.get('Alice').has(callback)).toBe(true);
    });

    test('应该正确取消订阅', () => {
      const callback = jest.fn();
      bus.subscribe('Alice', callback);
      bus.unsubscribe('Alice', callback);

      expect(bus.subscribers.get('Alice').has(callback)).toBe(false);
    });

    test('应该正确发送点对点消息', () => {
      const callback = jest.fn();
      bus.subscribe('Bob', callback);

      const msg = bus.send('Alice', 'Bob', 'text', 'Hello');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        sender: 'Alice',
        receiver: 'Bob',
        content: 'Hello'
      }));
      expect(msg.sender).toBe('Alice');
      expect(msg.receiver).toBe('Bob');
    });

    test('应该正确广播消息', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      bus.subscribe('Alice', callback1);
      bus.subscribe('Bob', callback2);
      bus.subscribe('Charlie', callback3);

      const results = bus.broadcast('Alice', 'event', 'announcement');

      // Alice 不应该收到自己的广播
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
      expect(results.length).toBe(2);
    });

    test('应该正确记录消息历史', () => {
      bus.subscribe('Bob', jest.fn());
      bus.send('Alice', 'Bob', 'text', 'Hello');
      bus.send('Alice', 'Bob', 'text', 'World');

      expect(bus.messageHistory.length).toBe(2);
    });

    test('应该限制历史记录数量', () => {
      bus.maxHistory = 5;
      bus.subscribe('Bob', jest.fn());

      for (let i = 0; i < 10; i++) {
        bus.send('Alice', 'Bob', 'text', `Message ${i}`);
      }

      expect(bus.messageHistory.length).toBe(5);
    });

    test('应该正确获取消息历史', () => {
      bus.subscribe('Bob', jest.fn());
      bus.subscribe('Charlie', jest.fn());

      bus.send('Alice', 'Bob', 'text', 'To Bob');
      bus.send('Alice', 'Charlie', 'text', 'To Charlie');
      bus.send('Bob', 'Alice', 'text', 'Reply');

      const aliceHistory = bus.getHistory('Alice', 10);
      expect(aliceHistory.length).toBe(3);

      const bobHistory = bus.getHistory('Bob', 10);
      expect(bobHistory.length).toBe(2);
    });

    test('应该正确清空历史', () => {
      bus.subscribe('Bob', jest.fn());
      bus.send('Alice', 'Bob', 'text', 'Hello');
      bus.clearHistory();

      expect(bus.messageHistory).toEqual([]);
    });

    test('回调错误不应该中断其他回调', () => {
      const errorCallback = () => { throw new Error('Test error'); };
      const normalCallback = jest.fn();

      bus.subscribe('Bob', errorCallback);
      bus.subscribe('Bob', normalCallback);

      // 应该不会抛出错误
      expect(() => bus.send('Alice', 'Bob', 'text', 'Hello')).not.toThrow();
    });
  });

  // ============ ToolRegistry 类测试 ============
  describe('ToolRegistry', () => {
    let registry;

    beforeEach(() => {
      registry = new ToolRegistry();
    });

    test('应该正确初始化', () => {
      expect(registry.tools).toBeInstanceOf(Map);
    });

    test('应该正确注册工具', () => {
      const tool = {
        name: 'test_tool',
        description: 'A test tool',
        parameters: { type: 'object' },
        execute: async () => 'result'
      };

      registry.register(tool);

      expect(registry.tools.has('test_tool')).toBe(true);
    });

    test('注册工具必须有 name 和 execute', () => {
      expect(() => registry.register({})).toThrow('Tool must have name and execute function');
      expect(() => registry.register({ name: 'test' })).toThrow('Tool must have name and execute function');
    });

    test('应该正确执行工具', async () => {
      registry.register({
        name: 'echo',
        description: 'Echo tool',
        execute: async (params) => params.message
      });

      const result = await registry.execute('echo', { message: 'hello' });

      expect(result.success).toBe(true);
      expect(result.result).toBe('hello');
      expect(result.tool).toBe('echo');
    });

    test('执行不存在的工具应该返回错误', async () => {
      const result = await registry.execute('nonexistent', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Tool not found');
    });

    test('工具执行错误应该被捕获', async () => {
      registry.register({
        name: 'failing',
        description: 'Always fails',
        execute: async () => { throw new Error('Tool error'); }
      });

      const result = await registry.execute('failing', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tool error');
    });

    test('应该正确批量注册工具', () => {
      const tools = [
        { name: 'tool1', description: 'Tool 1', execute: async () => 1 },
        { name: 'tool2', description: 'Tool 2', execute: async () => 2 }
      ];

      registry.registerAll(tools);

      expect(registry.tools.size).toBe(2);
    });

    test('应该正确获取工具描述', () => {
      registry.register({
        name: 'test',
        description: 'Test description',
        parameters: { type: 'object', required: ['input'] },
        execute: async () => null
      });

      const desc = registry.getToolDescription('test');

      expect(desc.name).toBe('test');
      expect(desc.description).toBe('Test description');
      expect(desc.parameters).toBeDefined();
    });

    test('获取不存在工具的描述应该返回 null', () => {
      expect(registry.getToolDescription('nonexistent')).toBeNull();
    });

    test('应该正确列出所有工具', () => {
      registry.register({
        name: 'tool1',
        description: 'Tool 1',
        parameters: {},
        execute: async () => null
      });
      registry.register({
        name: 'tool2',
        description: 'Tool 2',
        parameters: {},
        execute: async () => null
      });

      const tools = registry.listTools();

      expect(tools.length).toBe(2);
      expect(tools[0].name).toBeDefined();
      expect(tools[0].description).toBeDefined();
    });

    test('应该正确生成工具列表字符串', () => {
      registry.register({
        name: 'test',
        description: 'A test tool',
        parameters: { required: ['input'] },
        execute: async () => null
      });

      const str = registry.getToolListString();

      expect(str).toContain('test');
      expect(str).toContain('A test tool');
    });
  });

  // ============ MemorySystem 类测试 ============
  describe('MemorySystem', () => {
    let memory;

    beforeEach(() => {
      memory = new MemorySystem({
        shortTermLimit: 10,
        longTermLimit: 20,
        decayRate: 0.1
      });
    });

    test('应该正确初始化', () => {
      expect(memory.shortTermMemory).toEqual([]);
      expect(memory.longTermMemory).toEqual([]);
      expect(memory.semanticMemory).toBeInstanceOf(Map);
      expect(memory.shortTermLimit).toBe(10);
      expect(memory.longTermLimit).toBe(20);
      expect(memory.decayRate).toBe(0.1);
    });

    test('应该正确添加短期记忆', () => {
      memory.addShortTerm('Test memory', { type: 'test' });

      expect(memory.shortTermMemory.length).toBe(1);
      expect(memory.shortTermMemory[0].content).toBe('Test memory');
      expect(memory.shortTermMemory[0].metadata).toEqual({ type: 'test' });
      expect(memory.shortTermMemory[0].timestamp).toBeDefined();
    });

    test('应该限制短期记忆数量', () => {
      for (let i = 0; i < 15; i++) {
        memory.addShortTerm(`Memory ${i}`);
      }

      expect(memory.shortTermMemory.length).toBe(10);
    });

    test('应该正确添加长期记忆', () => {
      memory.addLongTerm('Important event', 0.8, { category: 'milestone' });

      expect(memory.longTermMemory.length).toBe(1);
      expect(memory.longTermMemory[0].content).toBe('Important event');
      expect(memory.longTermMemory[0].importance).toBe(0.8);
      expect(memory.longTermMemory[0].accessCount).toBe(0);
    });

    test('应该限制长期记忆数量', () => {
      for (let i = 0; i < 25; i++) {
        memory.addLongTerm(`Event ${i}`, 0.5);
      }

      expect(memory.longTermMemory.length).toBe(20);
    });

    test('应该正确添加语义记忆', () => {
      memory.addSemantic('Alice', { friend_of: 'Bob', works_at: 'office' });

      expect(memory.semanticMemory.has('Alice')).toBe(true);
      const node = memory.semanticMemory.get('Alice');
      expect(node.relations.friend_of).toBe('Bob');
      expect(node.relations.works_at).toBe('office');
    });

    test('应该更新现有语义记忆', () => {
      memory.addSemantic('Alice', { friend_of: 'Bob' });
      memory.addSemantic('Alice', { works_at: 'cafe' });

      const node = memory.semanticMemory.get('Alice');
      expect(node.relations.friend_of).toBe('Bob');
      expect(node.relations.works_at).toBe('cafe');
    });

    test('应该正确检索短期记忆', () => {
      for (let i = 0; i < 5; i++) {
        memory.addShortTerm(`Memory ${i}`);
      }

      const recent = memory.retrieveShortTerm(3);

      expect(recent.length).toBe(3);
      expect(recent[0].content).toBe('Memory 2');
      expect(recent[2].content).toBe('Memory 4');
    });

    test('应该正确检索长期记忆（无查询）', () => {
      memory.addLongTerm('Event A', 0.9);
      memory.addLongTerm('Event B', 0.5);

      const memories = memory.retrieveLongTerm(null, 10);

      expect(memories.length).toBe(2);
      // 高重要性的应该排在前面
      expect(memories[0].content).toBe('Event A');
    });

    test('应该正确检索长期记忆（有查询）', () => {
      memory.addLongTerm('Alice went to the park', 0.8);
      memory.addLongTerm('Bob stayed home', 0.8);
      memory.addLongTerm('Alice met Charlie', 0.7);

      const memories = memory.retrieveLongTerm('alice', 10);

      expect(memories.length).toBe(2);
      memories.forEach(m => {
        expect(m.content.toLowerCase()).toContain('alice');
      });
    });

    test('长期记忆应该正确衰减', (done => {
      // 添加一个高重要性记忆
      memory.addLongTerm('Old memory', 1.0);

      // 等待一小段时间
      setTimeout(() => {
        const memories = memory.retrieveLongTerm(null, 10);
        // 衰减后的重要性应该小于原始重要性
        expect(memories[0].currentImportance).toBeLessThan(1.0);
        expect(memories[0].currentImportance).toBeGreaterThan(0);
        done();
      }, 100);
    }));

    test('检索长期记忆应该增加访问计数', () => {
      memory.addLongTerm('Test event', 0.8);
      memory.retrieveLongTerm(null, 10);

      expect(memory.longTermMemory[0].accessCount).toBe(1);
    });

    test('应该正确检索语义记忆', () => {
      memory.addSemantic('Alice', { friend_of: 'Bob' });

      const node = memory.retrieveSemantic('Alice');

      expect(node).toBeDefined();
      expect(node.relations.friend_of).toBe('Bob');
    });

    test('应该正确获取上下文', () => {
      memory.addShortTerm('Recent event');
      memory.addLongTerm('Important event', 0.9);

      const context = memory.getContext(6);

      expect(context.recent).toBeDefined();
      expect(context.relevant).toBeDefined();
      expect(context.recent.length).toBeGreaterThan(0);
    });

    test('应该正确清空记忆', () => {
      memory.addShortTerm('Test');
      memory.addLongTerm('Important', 0.9);
      memory.addSemantic('Alice', {});

      memory.clear();

      expect(memory.shortTermMemory).toEqual([]);
      expect(memory.longTermMemory).toEqual([]);
      expect(memory.semanticMemory.size).toBe(0);
    });

    test('应该正确导出记忆', () => {
      memory.addShortTerm('Test short');
      memory.addLongTerm('Test long', 0.8);
      memory.addSemantic('Alice', { friend: 'Bob' });

      const exported = memory.export();

      expect(exported.shortTerm).toBeDefined();
      expect(exported.longTerm).toBeDefined();
      expect(exported.semantic).toBeDefined();
      expect(exported.shortTerm.length).toBe(1);
      expect(exported.longTerm.length).toBe(1);
    });

    test('应该正确导入记忆', () => {
      const data = {
        shortTerm: [{ content: 'Imported short', timestamp: Date.now(), metadata: {} }],
        longTerm: [{ content: 'Imported long', importance: 0.9, timestamp: Date.now(), createdAt: Date.now(), metadata: {}, accessCount: 0 }],
        semantic: [['Alice', { name: 'Alice', relations: {}, createdAt: Date.now() }]]
      };

      memory.import(data);

      expect(memory.shortTermMemory.length).toBe(1);
      expect(memory.longTermMemory.length).toBe(1);
      expect(memory.semanticMemory.size).toBe(1);
    });
  });

  // ============ BaseAgent 类测试 ============
  describe('BaseAgent', () => {
    let agent;
    let mockMessageBus;

    beforeEach(() => {
      mockMessageBus = {
        subscribe: jest.fn(),
        send: jest.fn(),
        broadcast: jest.fn()
      };

      agent = new BaseAgent({
        name: 'TestAgent',
        messageBus: mockMessageBus
      });
    });

    test('应该正确初始化', () => {
      expect(agent.name).toBe('TestAgent');
      expect(agent.status).toBe('idle');
      expect(agent.currentTask).toBeNull();
    });

    test('应该自动订阅消息总线', () => {
      expect(mockMessageBus.subscribe).toHaveBeenCalledWith('TestAgent', expect.any(Function));
    });

    test('应该正确发送消息', () => {
      agent.sendMessage('OtherAgent', 'text', 'Hello');

      expect(mockMessageBus.send).toHaveBeenCalledWith('TestAgent', 'OtherAgent', 'text', 'Hello', {});
    });

    test('应该正确广播消息', () => {
      agent.broadcast('event', 'Announcement');

      expect(mockMessageBus.broadcast).toHaveBeenCalledWith('TestAgent', 'event', 'Announcement', {});
    });

    test('应该正确接收消息', async () => {
      const msg = { sender: 'Other', content: 'Test', type: 'text' };
      await agent.receiveMessage(msg);

      const recentMemory = agent.memory.retrieveShortTerm(1);
      expect(recentMemory.length).toBe(1);
      expect(recentMemory[0].content).toBe('Test');
    });

    test('应该正确构建上下文', () => {
      const context = agent.buildContext();

      expect(context.memory).toBeDefined();
      expect(context.status).toBe('idle');
      expect(context.tools).toBeDefined();
    });

    test('应该正确设置进度回调', () => {
      const callback = jest.fn();
      agent.setProgressCallback(callback);
      agent.emitProgress('thought', 'thinking...');

      expect(callback).toHaveBeenCalledWith('thought', 'thinking...');
    });

    test('应该正确获取状态', () => {
      const state = agent.getState();

      expect(state.name).toBe('TestAgent');
      expect(state.status).toBe('idle');
      expect(state.memory).toBeDefined();
      expect(state.tools).toBeDefined();
    });

    test('应该正确解析行动', () => {
      const action = agent.parseAction('Action: move({"target": "park"})');

      expect(action).not.toBeNull();
      expect(action.tool).toBe('move');
      expect(action.params).toEqual({ target: 'park' });
    });

    test('解析无效行动应该返回 null', () => {
      const action = agent.parseAction('This is not an action');

      expect(action).toBeNull();
    });

    test('应该正确检测最终答案', () => {
      expect(agent.isFinalAnswer('Final answer: 42')).toBe(true);
      expect(agent.isFinalAnswer('Answer: something')).toBe(true);
      expect(agent.isFinalAnswer('完成了')).toBe(true);
      expect(agent.isFinalAnswer('Still thinking...')).toBe(false);
    });

    test('应该正确提取最终答案', () => {
      expect(agent.extractFinalAnswer('Final answer: 42')).toBe('42');
      expect(agent.extractFinalAnswer('Answer: hello world')).toBe('hello world');
    });

    test('ReAct 循环应该正常工作', async () => {
      // 注册一个简单的工具
      agent.tools.register({
        name: 'test',
        description: 'Test tool',
        execute: async () => 'done'
      });

      // 设置进度回调来检查过程
      const progressSpy = jest.fn();
      agent.setProgressCallback(progressSpy);

      // 模拟思考过程返回最终答案
      const originalThink = agent.think.bind(agent);
      agent.think = async () => 'Final answer: completed';

      const result = await agent.reactLoop('test query', 3);

      expect(result).toBe('completed');
      expect(agent.status).toBe('done');
    });

    test('ReAct 循环应该正确处理行动', async () => {
      agent.tools.register({
        name: 'echo',
        description: 'Echo tool',
        execute: async (params) => params.input
      });

      let thinkCount = 0;
      agent.think = async () => {
        thinkCount++;
        if (thinkCount === 1) {
          return 'Action: echo({"input": "hello"})';
        }
        return 'Final answer: done';
      };

      const result = await agent.reactLoop('test', 5);

      expect(result).toBe('done');
    });
  });
});

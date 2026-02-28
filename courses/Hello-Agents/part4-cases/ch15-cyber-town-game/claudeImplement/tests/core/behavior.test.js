/**
 * 行为系统测试
 * 测试 src/core/behavior.js 的 BehaviorSystem 类
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { BehaviorSystem, BehaviorType, BEHAVIORS, ReActStep, BehaviorDecision } from '../../src/core/behavior.js';
import { CharacterAgent } from '../../src/core/character.js';

describe('BehaviorSystem', () => {
  let behaviorSystem;
  let character;

  beforeEach(() => {
    behaviorSystem = new BehaviorSystem();
    character = new CharacterAgent({
      id: 'test_char',
      name: 'Alice',
      location: 'home',
      personality: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5
      }
    });
  });

  // ============ 初始化测试 ============
  describe('初始化', () => {
    test('应该正确初始化', () => {
      expect(behaviorSystem.tools).toBeDefined();
      expect(behaviorSystem.decisionHistory).toEqual([]);
      expect(behaviorSystem.maxHistory).toBe(100);
    });

    test('应该注册所有行为作为工具', () => {
      const tools = behaviorSystem.tools.listTools();
      const toolNames = tools.map(t => t.name);

      expect(toolNames).toContain('move');
      expect(toolNames).toContain('eat');
      expect(toolNames).toContain('rest');
      expect(toolNames).toContain('socialize');
      expect(toolNames).toContain('work');
      expect(toolNames).toContain('explore');
    });
  });

  // ============ ReActStep 测试 ============
  describe('ReActStep', () => {
    test('应该正确创建思考步骤', () => {
      const step = new ReActStep('thought', '我在思考...');

      expect(step.type).toBe('thought');
      expect(step.content).toBe('我在思考...');
      expect(step.timestamp).toBeDefined();
    });

    test('应该正确创建行动步骤', () => {
      const step = new ReActStep('action', { tool: 'move', target: 'park' });

      expect(step.type).toBe('action');
      expect(step.content).toEqual({ tool: 'move', target: 'park' });
    });

    test('应该正确创建观察步骤', () => {
      const step = new ReActStep('observation', { feasible: true });

      expect(step.type).toBe('observation');
      expect(step.content).toEqual({ feasible: true });
    });
  });

  // ============ BehaviorDecision 测试 ============
  describe('BehaviorDecision', () => {
    test('应该正确创建决策', () => {
      const decision = new BehaviorDecision('eat', 'restaurant', '我饿了');

      expect(decision.behavior).toBe('eat');
      expect(decision.target).toBe('restaurant');
      expect(decision.reason).toBe('我饿了');
      expect(decision.timestamp).toBeDefined();
    });

    test('应该允许空目标', () => {
      const decision = new BehaviorDecision('idle', null, '无事可做');

      expect(decision.behavior).toBe('idle');
      expect(decision.target).toBeNull();
    });
  });

  // ============ generateThought 测试 ============
  describe('generateThought', () => {
    test('应该生成包含角色信息的思考', () => {
      const worldState = { time: { timeOfDay: 'morning' } };
      const thought = behaviorSystem.generateThought(character, worldState);

      expect(thought).toContain('Alice');
      expect(thought).toContain('home');
    });

    test('应该包含当前状态信息', () => {
      const worldState = { time: { timeOfDay: 'morning' } };
      const thought = behaviorSystem.generateThought(character, worldState);

      expect(thought).toContain('心情');
      expect(thought).toContain('能量');
      expect(thought).toContain('饥饿');
    });

    test('应该包含紧急需求', () => {
      character.state.hunger = 0.9;
      const worldState = { time: { timeOfDay: 'morning' } };
      const thought = behaviorSystem.generateThought(character, worldState);

      expect(thought).toContain('紧迫');
    });

    test('应该包含当前目标', () => {
      character.addGoal({ description: '完成工作', priority: 0.8 });
      const worldState = { time: { timeOfDay: 'morning' } };
      const thought = behaviorSystem.generateThought(character, worldState);

      expect(thought).toContain('完成工作');
    });
  });

  // ============ selectAction 测试 ============
  describe('selectAction', () => {
    test('紧急需求应该优先处理', () => {
      character.state.hunger = 0.9;
      const worldState = { time: { timeOfDay: 'morning' } };
      const thought = '';
      const action = behaviorSystem.selectAction(character, worldState, thought);

      expect(action.behavior).toBe('eat');
    });

    test('低能量应该选择休息', () => {
      character.state.energy = 0.1;
      const worldState = { time: { timeOfDay: 'morning' } };
      const thought = '';
      const action = behaviorSystem.selectAction(character, worldState, thought);

      expect(action.behavior).toBe('rest');
    });

    test('高社交需求应该选择社交', () => {
      character.state.social = 0.9;
      const worldState = { time: { timeOfDay: 'afternoon' } };
      const thought = '';
      const action = behaviorSystem.selectAction(character, worldState, thought);

      expect(action.behavior).toBe('socialize');
    });

    test('早晨 + 高尽责性应该倾向于工作', () => {
      character.personality.conscientiousness = 0.9;
      const worldState = { time: { timeOfDay: 'morning' } };
      const thought = '';
      const action = behaviorSystem.selectAction(character, worldState, thought);

      expect(action.behavior).toBe('work');
    });

    test('高外向性 + 附近有人应该社交', () => {
      character.personality.extraversion = 0.9;
      character.location = 'park';
      const worldState = {
        time: { timeOfDay: 'afternoon' },
        characters: [
          { id: 'other', name: 'Bob', location: 'park' }
        ]
      };
      const thought = '';

      // 多次运行测试概率性行为
      let socialSelected = false;
      for (let i = 0; i < 20; i++) {
        const action = behaviorSystem.selectAction(character, worldState, thought);
        if (action.behavior === 'socialize') {
          socialSelected = true;
          break;
        }
      }

      expect(socialSelected).toBe(true);
    });
  });

  // ============ observeAction 测试 ============
  describe('observeAction', () => {
    test('应该验证有效行为', () => {
      const action = { behavior: 'rest', target: 'home' };
      character.state.energy = 0.5;
      character.location = 'home';
      const worldState = {};

      const observation = behaviorSystem.observeAction(character, action, worldState);

      expect(observation.feasible).toBe(true);
    });

    test('应该检测未知行为', () => {
      const action = { behavior: 'unknown', target: null };
      const worldState = {};

      const observation = behaviorSystem.observeAction(character, action, worldState);

      expect(observation.feasible).toBe(false);
      expect(observation.reason).toContain('未知行为');
    });

    test('应该检测能量不足', () => {
      const action = { behavior: 'work', target: 'office' };
      character.state.energy = 0.1; // 工作需要 0.3
      character.location = 'office';
      const worldState = {};

      const observation = behaviorSystem.observeAction(character, action, worldState);

      expect(observation.feasible).toBe(false);
      expect(observation.reason).toContain('能量不足');
    });

    test('应该检测地点要求（需要移动）', () => {
      const action = { behavior: 'work', target: 'office' };
      character.state.energy = 0.5;
      character.location = 'home';
      const worldState = {};

      const observation = behaviorSystem.observeAction(character, action, worldState);

      expect(observation.feasible).toBe(true);
      expect(observation.requiresMove).toBe(true);
    });
  });

  // ============ selectAlternative 测试 ============
  describe('selectAlternative', () => {
    test('需要移动时应该选择移动', () => {
      const action = behaviorSystem.selectAlternative(character, {}, '需要先前往office');

      expect(action.behavior).toBe('move');
      expect(action.target).toBe('office');
    });

    test('能量不足时应该选择休息', () => {
      const action = behaviorSystem.selectAlternative(character, {}, '能量不足');

      expect(action.behavior).toBe('rest');
      expect(action.target).toBe('home');
    });

    test('其他情况应该选择 idle', () => {
      const action = behaviorSystem.selectAlternative(character, {}, '未知原因');

      expect(action.behavior).toBe('idle');
    });
  });

  // ============ executeBehavior 测试 ============
  describe('executeBehavior', () => {
    test('应该正确执行进食行为', async () => {
      const decision = new BehaviorDecision('eat', 'restaurant');
      const initialHunger = character.state.hunger;

      const result = await behaviorSystem.executeBehavior(character, decision, {});

      expect(result.success).toBe(true);
      expect(character.state.hunger).toBeLessThan(initialHunger);
      expect(character.currentActivity).toBe('eat');
    });

    test('应该正确执行休息行为', async () => {
      const decision = new BehaviorDecision('rest', 'home');
      character.state.energy = 0.3;
      const initialEnergy = character.state.energy;

      const result = await behaviorSystem.executeBehavior(character, decision, {});

      expect(result.success).toBe(true);
      expect(character.state.energy).toBeGreaterThan(initialEnergy);
    });

    test('未知行为应该返回错误', async () => {
      const decision = new BehaviorDecision('unknown', null);

      const result = await behaviorSystem.executeBehavior(character, decision, {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('未知行为');
    });

    test('效果应该被限制在有效范围内', async () => {
      const decision = new BehaviorDecision('rest', 'home');
      character.state.energy = 0.99;

      await behaviorSystem.executeBehavior(character, decision, {});

      expect(character.state.energy).toBeLessThanOrEqual(1);
    });
  });

  // ============ decide 完整流程测试 ============
  describe('decide (ReAct 循环)', () => {
    test('应该返回完整的决策结果', async () => {
      const worldState = {
        time: { timeOfDay: 'morning' },
        characters: [],
        locations: [{ name: 'home' }, { name: 'office' }]
      };

      const decision = await behaviorSystem.decide(character, worldState);

      expect(decision).toBeInstanceOf(BehaviorDecision);
      expect(decision.behavior).toBeDefined();
      expect(decision.timestamp).toBeDefined();
    });

    test('应该记录决策历史', async () => {
      const worldState = {
        time: { timeOfDay: 'morning' },
        characters: [],
        locations: []
      };

      await behaviorSystem.decide(character, worldState);

      expect(behaviorSystem.decisionHistory.length).toBe(1);
      expect(behaviorSystem.decisionHistory[0].characterId).toBe('test_char');
    });

    test('行为不可行时应该选择替代行为', async () => {
      character.state.energy = 0.05; // 能量太低无法执行大多数行为
      const worldState = {
        time: { timeOfDay: 'morning' },
        characters: [],
        locations: []
      };

      const decision = await behaviorSystem.decide(character, worldState);

      // 应该选择休息或者 idle
      expect(['rest', 'idle']).toContain(decision.behavior);
    });

    test('应该限制决策历史长度', async () => {
      behaviorSystem.maxHistory = 5;
      const worldState = {
        time: { timeOfDay: 'morning' },
        characters: [],
        locations: []
      };

      for (let i = 0; i < 10; i++) {
        await behaviorSystem.decide(character, worldState);
      }

      expect(behaviorSystem.decisionHistory.length).toBe(5);
    });
  });

  // ============ 辅助方法测试 ============
  describe('辅助方法', () => {
    test('getRandomLocation 应该返回不同的地点', () => {
      const worldState = {
        locations: [
          { name: 'home' },
          { name: 'park' },
          { name: 'office' }
        ]
      };

      const location = behaviorSystem.getRandomLocation(worldState, 'home');

      expect(location).not.toBe('home');
    });

    test('getRandomLocation 在没有其他地点时返回当前地点', () => {
      const worldState = {
        locations: [{ name: 'home' }]
      };

      const location = behaviorSystem.getRandomLocation(worldState, 'home');

      expect(location).toBe('home');
    });

    test('extractLocation 应该正确提取地点', () => {
      expect(behaviorSystem.extractLocation('需要先前往office')).toBe('office');
      expect(behaviorSystem.extractLocation('去park吧')).toBe('park');
      expect(behaviorSystem.extractLocation('未知文本')).toBe('home');
    });

    test('formatValue 应该正确格式化值', () => {
      expect(behaviorSystem.formatValue(0.5)).toBe('良好');
      expect(behaviorSystem.formatValue(-0.5)).toBe('不佳');
      expect(behaviorSystem.formatValue(0)).toBe('一般');
    });

    test('formatPercent 应该正确格式化百分比', () => {
      expect(behaviorSystem.formatPercent(0.5)).toBe('50%');
      expect(behaviorSystem.formatPercent(0.75)).toBe('75%');
      expect(behaviorSystem.formatPercent(1)).toBe('100%');
    });

    test('getDecisionHistory 应该返回指定角色的历史', async () => {
      const worldState = { time: { timeOfDay: 'morning' }, characters: [], locations: [] };
      const char2 = new CharacterAgent({ id: 'char2', name: 'Bob', location: 'home' });

      await behaviorSystem.decide(character, worldState);
      await behaviorSystem.decide(character, worldState);
      await behaviorSystem.decide(char2, worldState);

      const history = behaviorSystem.getDecisionHistory('test_char');

      expect(history.length).toBe(2);
    });
  });

  // ============ BehaviorType 常量测试 ============
  describe('BehaviorType', () => {
    test('应该定义所有行为类型', () => {
      expect(BehaviorType.MOVE).toBe('move');
      expect(BehaviorType.EAT).toBe('eat');
      expect(BehaviorType.REST).toBe('rest');
      expect(BehaviorType.SOCIALIZE).toBe('socialize');
      expect(BehaviorType.WORK).toBe('work');
      expect(BehaviorType.EXPLORE).toBe('explore');
      expect(BehaviorType.INTERACT).toBe('interact');
      expect(BehaviorType.IDLE).toBe('idle');
    });
  });

  // ============ BEHAVIORS 配置测试 ============
  describe('BEHAVIORS 配置', () => {
    test('每个行为应该有必要属性', () => {
      Object.entries(BEHAVIORS).forEach(([key, behavior]) => {
        expect(behavior.type).toBeDefined();
        expect(behavior.name).toBeDefined();
        expect(behavior.description).toBeDefined();
        expect(behavior.effects).toBeDefined();
        expect(behavior.duration).toBeDefined();
      });
    });

    test('move 行为应该消耗能量', () => {
      expect(BEHAVIORS.move.effects.energy).toBeLessThan(0);
    });

    test('eat 行为应该减少饥饿', () => {
      expect(BEHAVIORS.eat.effects.hunger).toBeLessThan(0);
    });

    test('rest 行为应该恢复能量', () => {
      expect(BEHAVIORS.rest.effects.energy).toBeGreaterThan(0);
    });

    test('某些行为应该有地点要求', () => {
      expect(BEHAVIORS.eat.requirements.location).toBeDefined();
      expect(BEHAVIORS.work.requirements.location).toBeDefined();
    });
  });
});

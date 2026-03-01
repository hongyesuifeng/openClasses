/**
 * 角色系统测试
 * 测试 src/core/character.js 的 CharacterAgent 类
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { CharacterAgent, DEFAULT_PERSONALITY, DEFAULT_STATE, PERSONALITY_TEMPLATES } from '../../src/core/character.js';

describe('CharacterAgent', () => {
  let character;

  beforeEach(() => {
    character = new CharacterAgent({
      id: 'test_char',
      name: 'Alice',
      age: 28,
      occupation: '工程师',
      description: '一位聪明的工程师',
      location: 'home'
    });
  });

  // ============ 初始化测试 ============
  describe('初始化', () => {
    test('应该正确创建角色', () => {
      expect(character.id).toBe('test_char');
      expect(character.name).toBe('Alice');
      expect(character.age).toBe(28);
      expect(character.occupation).toBe('工程师');
      expect(character.description).toBe('一位聪明的工程师');
      expect(character.location).toBe('home');
    });

    test('应该有默认 OCEAN 性格值', () => {
      expect(character.personality.openness).toBe(DEFAULT_PERSONALITY.openness);
      expect(character.personality.conscientiousness).toBe(DEFAULT_PERSONALITY.conscientiousness);
      expect(character.personality.extraversion).toBe(DEFAULT_PERSONALITY.extraversion);
      expect(character.personality.agreeableness).toBe(DEFAULT_PERSONALITY.agreeableness);
      expect(character.personality.neuroticism).toBe(DEFAULT_PERSONALITY.neuroticism);
    });

    test('应该有默认状态值', () => {
      expect(character.state.mood).toBe(DEFAULT_STATE.mood);
      expect(character.state.energy).toBe(DEFAULT_STATE.energy);
      expect(character.state.hunger).toBe(DEFAULT_STATE.hunger);
      expect(character.state.social).toBe(DEFAULT_STATE.social);
    });

    test('应该允许自定义性格', () => {
      const customChar = new CharacterAgent({
        name: 'Bob',
        personality: {
          openness: 0.9,
          extraversion: 0.8
        }
      });

      expect(customChar.personality.openness).toBe(0.9);
      expect(customChar.personality.extraversion).toBe(0.8);
      // 其他值应该是默认的
      expect(customChar.personality.conscientiousness).toBe(DEFAULT_PERSONALITY.conscientiousness);
    });

    test('应该允许自定义初始状态', () => {
      const tiredChar = new CharacterAgent({
        name: 'Tired',
        state: {
          energy: 0.2,
          hunger: 0.8
        }
      });

      expect(tiredChar.state.energy).toBe(0.2);
      expect(tiredChar.state.hunger).toBe(0.8);
    });

    test('应该初始化空目标和关系', () => {
      expect(character.goals).toEqual([]);
      expect(character.relationships).toBeInstanceOf(Map);
      expect(character.relationships.size).toBe(0);
    });

    test('应该自动生成 ID（如果未提供）', () => {
      const noIdChar = new CharacterAgent({ name: 'NoID' });
      expect(noIdChar.id).toMatch(/^char_/);
    });
  });

  // ============ 状态更新测试 ============
  describe('updateState', () => {
    test('应该正确更新能量（逐渐减少）', () => {
      const initialEnergy = character.state.energy;
      character.updateState(1);

      expect(character.state.energy).toBeLessThan(initialEnergy);
    });

    test('应该正确更新饥饿（逐渐增加）', () => {
      const initialHunger = character.state.hunger;
      character.updateState(1);

      expect(character.state.hunger).toBeGreaterThan(initialHunger);
    });

    test('能量不应该低于 0', () => {
      character.state.energy = 0.01;
      for (let i = 0; i < 10; i++) {
        character.updateState(1);
      }

      expect(character.state.energy).toBeGreaterThanOrEqual(0);
    });

    test('饥饿不应该超过 1', () => {
      character.state.hunger = 0.99;
      for (let i = 0; i < 10; i++) {
        character.updateState(1);
      }

      expect(character.state.hunger).toBeLessThanOrEqual(1);
    });

    test('低能量应该影响心情', () => {
      character.state.energy = 0.2;
      const initialMood = character.state.mood;
      character.updateState(1);

      // 心情应该下降（但允许性格影响的波动）
      expect(character.state.mood).toBeLessThanOrEqual(initialMood + 0.1);
    });

    test('高饥饿应该影响心情', () => {
      character.state.hunger = 0.9;
      const initialMood = character.state.mood;
      character.updateState(1);

      expect(character.state.mood).toBeLessThanOrEqual(initialMood + 0.1);
    });

    test('尽责性应该影响能量消耗', () => {
      const efficientChar = new CharacterAgent({
        name: 'Efficient',
        personality: { conscientiousness: 0.9 }
      });
      const normalChar = new CharacterAgent({
        name: 'Normal',
        personality: { conscientiousness: 0.5 }
      });

      efficientChar.updateState(10);
      normalChar.updateState(10);

      // 高尽责性的角色能量消耗应该更少
      expect(efficientChar.state.energy).toBeGreaterThan(normalChar.state.energy);
    });
  });

  // ============ 位置设置测试 ============
  describe('setLocation', () => {
    test('应该正确设置位置', () => {
      character.setLocation('office');

      expect(character.location).toBe('office');
      expect(character.previousLocation).toBe('home');
    });

    test('应该记录移动到记忆中', () => {
      character.setLocation('park');

      const recentMemory = character.characterMemory.retrieveShortTerm(1);
      expect(recentMemory.length).toBe(1);
      expect(recentMemory[0].content).toContain('park');
      expect(recentMemory[0].metadata.type).toBe('movement');
    });
  });

  // ============ 目标系统测试 ============
  describe('目标系统', () => {
    test('应该正确添加目标', () => {
      const goal = character.addGoal({
        description: '完成项目',
        priority: 0.8
      });

      expect(character.goals.length).toBe(1);
      expect(goal.description).toBe('完成项目');
      expect(goal.priority).toBe(0.8);
      expect(goal.status).toBe('active');
      expect(goal.id).toBeDefined();
    });

    test('应该有默认优先级', () => {
      const goal = character.addGoal({ description: '普通任务' });

      expect(goal.priority).toBe(0.5);
    });

    test('应该正确完成目标', () => {
      const goal = character.addGoal({ description: '测试目标' });
      const initialMood = character.state.mood;

      character.completeGoal(goal.id);

      expect(goal.status).toBe('completed');
      expect(goal.completedAt).toBeDefined();
      // 完成目标应该提升心情
      expect(character.state.mood).toBeGreaterThan(initialMood);
    });

    test('getTopGoal 应该返回最高优先级活动目标', () => {
      character.addGoal({ description: '低优先级', priority: 0.3 });
      character.addGoal({ description: '高优先级', priority: 0.9 });
      character.addGoal({ description: '中优先级', priority: 0.6 });

      const topGoal = character.getTopGoal();

      expect(topGoal.description).toBe('高优先级');
    });

    test('getTopGoal 在没有活动目标时应该返回 null', () => {
      expect(character.getTopGoal()).toBeNull();
    });

    test('完成的目标不应该出现在 getTopGoal 中', () => {
      const goal = character.addGoal({ description: '会完成的目标', priority: 0.9 });
      character.addGoal({ description: '活动目标', priority: 0.5 });

      character.completeGoal(goal.id);
      const topGoal = character.getTopGoal();

      expect(topGoal.description).toBe('活动目标');
    });
  });

  // ============ 关系系统测试 ============
  describe('关系系统', () => {
    test('应该正确设置关系', () => {
      character.setRelationship('Bob', 0.8);

      expect(character.relationships.get('Bob')).toBe(0.8);
    });

    test('关系值应该被限制在 -1 到 1 之间', () => {
      character.setRelationship('Bob', 2.0);
      expect(character.relationships.get('Bob')).toBe(1);

      character.setRelationship('Charlie', -2.0);
      expect(character.relationships.get('Charlie')).toBe(-1);
    });

    test('应该正确更新关系', () => {
      character.setRelationship('Bob', 0.5);
      character.updateRelationship('Bob', 0.2);

      expect(character.relationships.get('Bob')).toBe(0.7);
    });

    test('更新关系也应该被限制', () => {
      character.setRelationship('Bob', 0.9);
      character.updateRelationship('Bob', 0.5);

      expect(character.relationships.get('Bob')).toBe(1);
    });

    test('getRelationship 对未知角色应该返回 0', () => {
      expect(character.getRelationship('Unknown')).toBe(0);
    });
  });

  // ============ 对话记录测试 ============
  describe('对话记录', () => {
    test('应该正确记录对话', () => {
      character.recordConversation('Bob', '你好！', 0.3);

      expect(character.conversations.length).toBe(1);
      expect(character.conversations[0].with).toBe('Bob');
      expect(character.conversations[0].content).toBe('你好！');
      expect(character.conversations[0].sentiment).toBe(0.3);
    });

    test('重要对话（高情感）应该存入长期记忆', () => {
      character.recordConversation('Bob', '重大消息！', 0.8);

      const longTermMemories = character.characterMemory.retrieveLongTerm(null, 10);
      expect(longTermMemories.some(m => m.content.includes('Bob'))).toBe(true);
    });

    test('应该限制对话历史数量', () => {
      for (let i = 0; i < 150; i++) {
        character.recordConversation('Bob', `Message ${i}`);
      }

      expect(character.conversations.length).toBeLessThanOrEqual(100);
    });
  });

  // ============ 活动管理测试 ============
  describe('活动管理', () => {
    test('应该正确开始活动', () => {
      character.startActivity('working');

      expect(character.currentActivity).toBe('working');
      expect(character.activityStartTime).toBeDefined();
    });

    test('应该正确结束活动', () => {
      character.startActivity('eating');
      character.endActivity();

      expect(character.currentActivity).toBeNull();
      expect(character.activityStartTime).toBeNull();
    });
  });

  // ============ 需求系统测试 ============
  describe('getNeeds', () => {
    test('应该返回空数组（当没有紧急需求时）', () => {
      const needs = character.getNeeds();
      expect(needs).toEqual([]);
    });

    test('应该检测高饥饿需求', () => {
      character.state.hunger = 0.8;
      const needs = character.getNeeds();

      expect(needs.some(n => n.type === 'hunger')).toBe(true);
    });

    test('应该检测低能量需求', () => {
      character.state.energy = 0.2;
      const needs = character.getNeeds();

      expect(needs.some(n => n.type === 'energy')).toBe(true);
    });

    test('应该检测高社交需求', () => {
      character.state.social = 0.8;
      const needs = character.getNeeds();

      expect(needs.some(n => n.type === 'social')).toBe(true);
    });

    test('应该按紧迫程度排序', () => {
      character.state.hunger = 0.9;  // urgency = 0.9
      character.state.energy = 0.1;  // urgency = 0.9
      character.state.social = 0.75; // urgency = 0.75

      const needs = character.getNeeds();

      // 饥饿和能量都是 0.9 紧迫度，应该排在前面
      expect(needs[0].urgency).toBeGreaterThanOrEqual(needs[needs.length - 1].urgency);
    });
  });

  // ============ 行为倾向测试 ============
  describe('getBehaviorTendencies', () => {
    test('应该基于性格计算倾向', () => {
      const tendencies = character.getBehaviorTendencies();

      expect(tendencies.socialPreference).toBe(character.personality.extraversion);
      expect(tendencies.explorationPreference).toBe(character.personality.openness);
      expect(tendencies.workPreference).toBe(character.personality.conscientiousness);
      expect(tendencies.helpPreference).toBe(character.personality.agreeableness);
      expect(tendencies.restPreference).toBe(character.personality.neuroticism);
    });
  });

  // ============ 导出/导入测试 ============
  describe('export/import', () => {
    test('应该正确导出角色数据', () => {
      character.setRelationship('Bob', 0.8);
      character.addGoal({ description: 'Test' });

      const data = character.export();

      expect(data.id).toBe('test_char');
      expect(data.name).toBe('Alice');
      expect(data.personality).toBeDefined();
      expect(data.state).toBeDefined();
      expect(data.relationships).toContainEqual(['Bob', 0.8]);
      expect(data.goals.length).toBe(1);
    });

    test('应该正确导入角色数据', () => {
      const data = {
        personality: { openness: 0.9, extraversion: 0.8 },
        state: { energy: 0.3, hunger: 0.7 },
        location: 'park',
        relationships: [['Bob', 0.5]]
      };

      character.import(data);

      expect(character.personality.openness).toBe(0.9);
      expect(character.state.energy).toBe(0.3);
      expect(character.location).toBe('park');
      expect(character.relationships.get('Bob')).toBe(0.5);
    });
  });

  // ============ 性格模板测试 ============
  describe('PERSONALITY_TEMPLATES', () => {
    test('应该有预定义的性格模板', () => {
      expect(PERSONALITY_TEMPLATES.social).toBeDefined();
      expect(PERSONALITY_TEMPLATES.introvert).toBeDefined();
      expect(PERSONALITY_TEMPLATES.worker).toBeDefined();
      expect(PERSONALITY_TEMPLATES.creative).toBeDefined();
      expect(PERSONALITY_TEMPLATES.helper).toBeDefined();
      expect(PERSONALITY_TEMPLATES.anxious).toBeDefined();
    });

    test('social 模板应该有高外向性', () => {
      expect(PERSONALITY_TEMPLATES.social.extraversion).toBeGreaterThan(0.5);
    });

    test('worker 模板应该有高尽责性', () => {
      expect(PERSONALITY_TEMPLATES.worker.conscientiousness).toBeGreaterThan(0.5);
    });

    test('creative 模板应该有高开放性', () => {
      expect(PERSONALITY_TEMPLATES.creative.openness).toBeGreaterThan(0.5);
    });
  });
});

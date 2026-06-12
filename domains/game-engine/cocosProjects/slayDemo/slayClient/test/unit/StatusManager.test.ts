// test/unit/StatusManager.test.ts - StatusManager 单元测试
import { StatusManager } from '../../assets/scripts/battle/StatusManager';

describe('StatusManager', () => {
  let sm: StatusManager;

  beforeEach(() => { sm = new StatusManager(); });

  test('applyStatus 设置层数', () => {
    sm.applyStatus('poison', 3);
    expect(sm.getStacks('poison')).toBe(3);
    expect(sm.hasStatus('poison')).toBe(true);
  });

  test('applyStatus 0层移除状态', () => {
    sm.applyStatus('poison', 3);
    sm.applyStatus('poison', 0);
    expect(sm.hasStatus('poison')).toBe(false);
  });

  test('tickTurnStart 中毒造成伤害并层数-1', () => {
    sm.applyStatus('poison', 3);
    const result = sm.tickTurnStart();
    expect(result.poison_damage).toBe(3);
    expect(sm.getStacks('poison')).toBe(2);
  });

  test('tickTurnStart 中毒1层后消失', () => {
    sm.applyStatus('poison', 1);
    sm.tickTurnStart();
    expect(sm.hasStatus('poison')).toBe(false);
  });

  test('tickTurnEnd 易伤层数递减', () => {
    sm.applyStatus('vulnerable', 2);
    sm.tickTurnEnd();
    expect(sm.getStacks('vulnerable')).toBe(1);
  });

  test('calculateDamage 攻击方：力量加成', () => {
    sm.applyStatus('strength', 2);
    const result = sm.calculateDamage(5, true);
    expect(result).toBe(7);
  });

  test('calculateDamage 攻击方：无力减伤25%', () => {
    sm.applyStatus('weak', 1);
    const result = sm.calculateDamage(8, true);
    expect(result).toBe(6); // floor(8 * 0.75)
  });

  test('calculateDamage 防守方：易伤增伤50%', () => {
    sm.applyStatus('vulnerable', 1);
    const result = sm.calculateDamage(6, false);
    expect(result).toBe(9); // ceil(6 * 1.5)
  });

  test('calculateBlock 敏捷加成', () => {
    sm.applyStatus('dexterity', 2);
    expect(sm.calculateBlock(5)).toBe(7);
  });

  test('calculateBlock 虚弱减少格挡25%', () => {
    sm.applyStatus('frail', 1);
    expect(sm.calculateBlock(8)).toBe(6); // floor(8 * 0.75)
  });

  test('onHit 荆棘反弹', () => {
    sm.applyStatus('thorns', 2);
    expect(sm.onHit()).toBe(2);
  });

  test('tickTurnEnd 仪式每回合增加力量', () => {
    sm.applyStatus('ritual', 2);
    const result = sm.tickTurnEnd();
    expect(result.strength_gain).toBe(2);
    expect(sm.getStacks('strength')).toBe(2);
  });

  test('tickTurnEnd 金属化提供格挡', () => {
    sm.applyStatus('metallicize', 3);
    const result = sm.tickTurnEnd();
    expect(result.block_gain).toBe(3);
  });

  test('barricade：hasStatus 可检测', () => {
    sm.applyStatus('barricade', 1);
    expect(sm.hasStatus('barricade')).toBe(true);
  });

  test('getSnapshot 返回所有状态', () => {
    sm.applyStatus('poison', 2);
    sm.applyStatus('strength', 1);
    const snap = sm.getSnapshot();
    expect(snap.length).toBe(2);
    expect(snap.find(s => s.id === 'poison')!.stacks).toBe(2);
  });
});

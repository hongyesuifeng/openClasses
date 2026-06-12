// test/unit/DataLoader.test.ts - DataLoader 单元测试
import { DataLoader } from '../../assets/scripts/autoload/DataLoader';
import * as fs from 'fs';
import * as path from 'path';

function loadJson(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../../assets/data', filename), 'utf-8'));
}

describe('DataLoader', () => {
  let dl: DataLoader;

  beforeEach(() => {
    (DataLoader as any)._instance = null;
    dl = DataLoader.getInstance();
    dl.loadAll({
      cards: loadJson('cards.json'),
      enemies: loadJson('enemies.json'),
      encounters: loadJson('encounters.json'),
      rewards: loadJson('rewards.json'),
      relics: loadJson('relics.json'),
      potions: loadJson('potions.json'),
      runs: loadJson('run_v1.json'),
    });
  });

  test('validate_all 通过所有数据', () => {
    const errors = dl.validateAll();
    expect(errors).toHaveLength(0);
  });

  test('getCard 返回正确卡牌', () => {
    const card = dl.getCard('strike');
    expect(card).not.toBeNull();
    expect(card!.name).toBe('魔法弹');
    expect(card!.cost).toBe(1);
    expect(card!.effects[0].type).toBe('damage');
  });

  test('getCard 返回深拷贝', () => {
    const c1 = dl.getCard('strike')!;
    const c2 = dl.getCard('strike')!;
    c1.name = 'modified';
    expect(c2.name).toBe('魔法弹');
  });

  test('createCardInstance 自增 instance_id', () => {
    const i1 = dl.createCardInstance('strike')!;
    const i2 = dl.createCardInstance('strike')!;
    expect(i2.instance_id).toBe(i1.instance_id + 1);
  });

  test('resolveCardInstance 升级后返回升级属性', () => {
    const inst = dl.createCardInstance('strike')!;
    inst.is_upgraded = true;
    const card = dl.resolveCardInstance(inst)!;
    expect(card.name).toBe('魔法弹+');
    expect(card.effects[0].value).toBe(9);
  });

  test('getEnemy 返回敌人数据', () => {
    const enemies = loadJson('enemies.json').enemies;
    const firstId = enemies[0].id;
    const enemy = dl.getEnemy(firstId);
    expect(enemy).not.toBeNull();
    expect(enemy!.max_hp).toBeGreaterThan(0);
  });

  test('getAllCards 返回所有卡牌', () => {
    const cards = dl.getAllCards();
    expect(cards.length).toBeGreaterThan(0);
  });
});

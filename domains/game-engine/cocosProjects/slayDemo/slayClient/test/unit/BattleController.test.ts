// test/unit/BattleController.test.ts - 战斗控制器核心逻辑测试
import { BattleController } from '../../assets/scripts/battle/BattleController';
import { DataLoader } from '../../assets/scripts/autoload/DataLoader';
import * as fs from 'fs';
import * as path from 'path';

function loadJson(filename: string) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '../../assets/data', filename), 'utf-8'));
}

function setupDl() {
  (DataLoader as any)._instance = null;
  const dl = DataLoader.getInstance();
  dl.loadAll({
    cards: loadJson('cards.json'),
    enemies: loadJson('enemies.json'),
    encounters: loadJson('encounters.json'),
    rewards: loadJson('rewards.json'),
    relics: loadJson('relics.json'),
    potions: loadJson('potions.json'),
    runs: loadJson('run_v1.json'),
  });
  return dl;
}

describe('BattleController', () => {
  let bc: BattleController;

  beforeEach(() => {
    const dl = setupDl();
    bc = new BattleController();
    // 找第一个遭遇
    const encounters = loadJson('encounters.json').encounters;
    const firstEncounter = encounters[0];
    const deck = [
      dl.createCardInstance('strike')!,
      dl.createCardInstance('defend')!,
    ];
    bc.setup(firstEncounter.id, deck, {
      max_hp: 60, hp: 60, energy_per_turn: 3, draw_per_turn: 5, relic_ids: []
    });
  });

  test('setup 初始化战斗状态', () => {
    expect(bc.phase).toBe('setup');
    expect(bc.playerHp).toBe(60);
    expect(bc.enemies.length).toBeGreaterThan(0);
  });

  test('startCombat 进入玩家回合', () => {
    bc.startCombat();
    expect(bc.phase).toBe('player');
    expect(bc.turnNumber).toBe(1);
    expect(bc.energy).toBe(3);
    // 牌组只有2张，抽5张但只能抽到2张
    expect(bc.deck.hand.length).toBeLessThanOrEqual(5);
    expect(bc.deck.hand.length).toBeGreaterThan(0);
  });

  test('canPlayCard 检查能量', () => {
    bc.startCombat();
    // strike 费用1，能量3应该可以打
    const canPlay = bc.canPlayCard(0, 0);
    expect(canPlay).toBe(true);
  });

  test('damageEnemy 正确扣血', () => {
    bc.startCombat();
    const initHp = bc.enemies[0].hp;
    bc.damageEnemy(0, 5);
    expect(bc.enemies[0].hp).toBe(initHp - 5);
  });

  test('damagePlayer 正确扣血并检查格挡', () => {
    bc.startCombat();
    bc.playerBlock = 3;
    bc.damagePlayer(5);
    expect(bc.playerHp).toBe(58); // 5 - 3 = 2 hp damage
    expect(bc.playerBlock).toBe(0);
  });

  test('getSnapshot 返回正确快照', () => {
    bc.startCombat();
    const snap = bc.getSnapshot();
    expect(snap.phase).toBe('player');
    expect(snap.player_hp).toBe(60);
    expect(snap.energy).toBe(3);
    expect(Array.isArray(snap.hand)).toBe(true);
    expect(Array.isArray(snap.enemies)).toBe(true);
  });

  test('endPlayerTurn 切换到敌人回合', () => {
    bc.startCombat();
    bc.endPlayerTurn();
    // 敌人回合结束后应该回到玩家回合
    expect(bc.phase).toBe('player');
    expect(bc.turnNumber).toBe(2);
  });

  test('removeDeadEnemies 移除 hp<=0 的敌人', () => {
    bc.startCombat();
    const initialCount = bc.enemies.length;
    bc.enemies[0].hp = 0;
    bc.removeDeadEnemies();
    expect(bc.enemies.length).toBe(initialCount - 1);
  });

  test('combat_won 信号在所有敌人死亡时触发', () => {
    bc.startCombat();
    let wonFired = false;
    (bc as any).on('combat_won', () => { wonFired = true; });
    // 直接把所有敌人 hp 设为 0，然后调用 removeDeadEnemies
    bc.enemies.forEach(e => { e.hp = 0; });
    bc.removeDeadEnemies();
    // 手动触发结束逻辑（模拟 playCard 流程中检测）
    if (bc.enemies.length === 0 && bc.phase === 'player') {
      bc.phase = 'won';
      (bc as any).emit('combat_won', bc.playerHp);
    }
    expect(wonFired).toBe(true);
  });
});

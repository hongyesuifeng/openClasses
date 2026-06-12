// EffectRunner.ts - 对应 Godot effect_runner.gd
// 静态效果执行器，负责将卡牌/敌人效果应用到战斗状态

import { CardEffect } from '../autoload/DataLoader';
import { BattleController } from './BattleController';
import { StatusManager } from './StatusManager';

export class EffectRunner {
  static applyEffects(
    effects: CardEffect[],
    battle: BattleController,
    source: 'player' | 'enemy',
    targetIndex = -1,
    actingEnemyIndex = -1
  ): any[] {
    const results: any[] = [];
    for (const effect of effects) {
      const repeat = Math.max(1, (effect as any).repeat ?? 1);
      for (let i = 0; i < repeat; i++) {
        const result = EffectRunner._applyOne(effect, battle, source, targetIndex, actingEnemyIndex);
        if (result) results.push(result);
      }
    }
    return results;
  }

  private static _applyOne(
    effect: CardEffect,
    battle: BattleController,
    source: 'player' | 'enemy',
    targetIndex: number,
    actingEnemyIndex: number
  ): any {
    switch (effect.type) {
      case 'damage':      return EffectRunner._applyDamage(effect, battle, source, targetIndex, actingEnemyIndex);
      case 'block':       return EffectRunner._applyBlock(effect, battle, source, targetIndex, actingEnemyIndex);
      case 'draw':        battle.drawCards(effect.value ?? 0); return { type: 'draw', value: effect.value };
      case 'gain_strength': return EffectRunner._applyStrength(effect, battle, source, targetIndex, actingEnemyIndex);
      case 'apply_status':  return EffectRunner._applyStatus(effect, battle, source, targetIndex, actingEnemyIndex);
      case 'gain_barricade': return EffectRunner._applyBarricade(battle, source);
      case 'heal':        return EffectRunner._applyHeal(effect, battle, source, targetIndex, actingEnemyIndex);
      case 'multi_damage':  return EffectRunner._applyMultiDamage(effect, battle, source, targetIndex, actingEnemyIndex);
      case 'aoe_damage':    return EffectRunner._applyAoeDamage(effect, battle, source, actingEnemyIndex);
      case 'gain_energy':   return EffectRunner._applyGainEnergy(effect, battle, source);
      case 'exhaust':       return EffectRunner._applyExhaust(effect, battle, source);
      case 'summon':        return EffectRunner._applySummon(effect, battle, actingEnemyIndex);
      case 'lose_hp':       return EffectRunner._applyLoseHp(effect, battle, source, actingEnemyIndex);
      default:              return null;
    }
  }

  private static _applyDamage(
    effect: CardEffect, battle: BattleController,
    source: 'player' | 'enemy', targetIndex: number, actingEnemyIndex: number
  ): any {
    let amount = effect.value ?? 0;
    if (source === 'player') {
      amount = battle.playerStatus.calculateDamage(amount, true);
      if (targetIndex >= 0 && targetIndex < battle.enemies.length) {
        const sm = battle.enemies[targetIndex].status_manager as StatusManager;
        if (sm) amount = sm.calculateDamage(amount, false);
      }
      return battle.damageEnemy(targetIndex, amount);
    } else {
      if (actingEnemyIndex >= 0 && actingEnemyIndex < battle.enemies.length) {
        const sm = battle.enemies[actingEnemyIndex].status_manager as StatusManager;
        if (sm) amount = sm.calculateDamage(amount, true);
      }
      amount = battle.playerStatus.calculateDamage(amount, false);
      return battle.damagePlayer(amount);
    }
  }

  private static _applyBlock(
    effect: CardEffect, battle: BattleController,
    source: 'player' | 'enemy', _targetIndex: number, actingEnemyIndex: number
  ): any {
    let amount = effect.value ?? 0;
    if (source === 'player' || (effect.target === 'self' && actingEnemyIndex < 0)) {
      amount = battle.playerStatus.calculateBlock(amount);
      battle.playerBlock += amount;
      battle.emitCombatEvent({ type: 'block_gained', target: 'player', value: amount });
      return { type: 'player_block', value: amount, base: effect.value };
    }
    if (actingEnemyIndex >= 0) {
      const enemy = battle.enemies[actingEnemyIndex];
      const sm = enemy.status_manager as StatusManager;
      if (sm) amount = sm.calculateBlock(amount);
      enemy.block = (enemy.block ?? 0) + amount;
      battle.emitCombatEvent({ type: 'block_gained', target: 'enemy', enemy_index: actingEnemyIndex, value: amount });
      return { type: 'enemy_block', enemy_index: actingEnemyIndex, value: amount };
    }
    return null;
  }

  private static _applyStrength(
    effect: CardEffect, battle: BattleController,
    source: 'player' | 'enemy', _targetIndex: number, actingEnemyIndex: number
  ): any {
    const amount = effect.value ?? 0;
    if (source === 'player' || actingEnemyIndex < 0) {
      const cur = battle.playerStatus.getStacks('strength');
      battle.playerStatus.applyStatus('strength', cur + amount);
      return { type: 'player_strength', value: amount };
    }
    const enemy = battle.enemies[actingEnemyIndex];
    const sm = enemy.status_manager as StatusManager;
    if (sm) sm.applyStatus('strength', sm.getStacks('strength') + amount);
    return { type: 'enemy_strength', enemy_index: actingEnemyIndex, value: amount };
  }

  private static _applyStatus(
    effect: CardEffect, battle: BattleController,
    source: 'player' | 'enemy', targetIndex: number, actingEnemyIndex: number
  ): any {
    const statusId = (effect as any).status_id ?? '';
    const stacks = effect.value ?? 1;
    const effectTarget = effect.target ?? '';

    if (statusId === 'strength') return EffectRunner._applyStrength(effect, battle, source, targetIndex, actingEnemyIndex);

    if (effectTarget === 'all_enemies' && source === 'player') {
      battle.enemies.forEach((enemy, i) => {
        if (enemy.hp <= 0) return;
        const sm = enemy.status_manager as StatusManager;
        if (sm) sm.applyStatus(statusId, stacks);
        battle.emitCombatEvent({ type: 'status_applied', status_id: statusId, target: 'enemy', target_index: i, stacks });
      });
      return { type: 'apply_status', target: 'all_enemies', status_id: statusId, stacks };
    }

    if (source === 'player') {
      if (effectTarget === 'self') {
        battle.playerStatus.applyStatus(statusId, stacks);
        battle.emitCombatEvent({ type: 'status_applied', status_id: statusId, target: 'player', stacks });
        return { type: 'apply_status', target: 'player', status_id: statusId, stacks };
      }
      if (targetIndex >= 0 && targetIndex < battle.enemies.length) {
        const sm = battle.enemies[targetIndex].status_manager as StatusManager;
        if (sm) sm.applyStatus(statusId, stacks);
        battle.emitCombatEvent({ type: 'status_applied', status_id: statusId, target: 'enemy', target_index: targetIndex, stacks });
        return { type: 'apply_status', target: 'enemy', target_index: targetIndex, status_id: statusId, stacks };
      }
    } else {
      if (effectTarget === 'player') {
        battle.playerStatus.applyStatus(statusId, stacks);
        battle.emitCombatEvent({ type: 'status_applied', status_id: statusId, target: 'player', stacks });
        return { type: 'apply_status', target: 'player', status_id: statusId, stacks };
      }
    }
    return null;
  }

  private static _applyBarricade(battle: BattleController, source: 'player' | 'enemy'): any {
    if (source !== 'player') return null;
    battle.playerStatus.applyStatus('barricade', 1);
    return { type: 'gain_barricade', value: 1 };
  }

  private static _applyHeal(
    effect: CardEffect, battle: BattleController,
    source: 'player' | 'enemy', _targetIndex: number, actingEnemyIndex: number
  ): any {
    const amount = effect.value ?? 0;
    if (source === 'player') {
      const oldHp = battle.playerHp;
      battle.playerHp = Math.min(battle.playerMaxHp, battle.playerHp + amount);
      const actual = battle.playerHp - oldHp;
      if (actual > 0) battle.emitCombatEvent({ type: 'heal', target: 'player', value: actual });
      return { type: 'heal', target: 'player', value: actual };
    } else if (actingEnemyIndex >= 0 && actingEnemyIndex < battle.enemies.length) {
      const enemy = battle.enemies[actingEnemyIndex];
      const oldHp = enemy.hp;
      enemy.hp = Math.min(enemy.max_hp, enemy.hp + amount);
      const actual = enemy.hp - oldHp;
      if (actual > 0) battle.emitCombatEvent({ type: 'heal', target: 'enemy', enemy_index: actingEnemyIndex, value: actual });
      return { type: 'heal', target: 'enemy', enemy_index: actingEnemyIndex, value: actual };
    }
    return null;
  }

  private static _applyMultiDamage(
    effect: CardEffect, battle: BattleController,
    source: 'player' | 'enemy', targetIndex: number, actingEnemyIndex: number
  ): any {
    const hits = (effect as any).hits ?? 2;
    let total = 0;
    for (let i = 0; i < hits; i++) {
      const r = EffectRunner._applyDamage({ type: 'damage', value: effect.value }, battle, source, targetIndex, actingEnemyIndex);
      total += r?.value ?? 0;
    }
    return { type: 'multi_damage', hits, total_damage: total };
  }

  private static _applyAoeDamage(
    effect: CardEffect, battle: BattleController,
    source: 'player' | 'enemy', actingEnemyIndex: number
  ): any {
    const results: any[] = [];
    for (let i = 0; i < battle.enemies.length; i++) {
      if (battle.enemies[i].hp > 0) {
        const r = EffectRunner._applyDamage({ type: 'damage', value: effect.value }, battle, source, i, actingEnemyIndex);
        results.push(r);
      }
    }
    battle.removeDeadEnemies();
    return { type: 'aoe_damage', base_damage: effect.value, hits: results.length };
  }

  private static _applyGainEnergy(effect: CardEffect, battle: BattleController, source: 'player' | 'enemy'): any {
    if (source !== 'player') return null;
    battle.energy += effect.value ?? 0;
    return { type: 'gain_energy', value: effect.value };
  }

  private static _applyExhaust(effect: CardEffect, battle: BattleController, source: 'player' | 'enemy'): any {
    if (source !== 'player') return null;
    const target = effect.target ?? 'current_card';

    if (target === 'non_attack_hand') {
      const dl = battle.getDataLoader();
      let exhausted = 0;
      for (let i = battle.deck.hand.length - 1; i >= 0; i--) {
        const resolved = dl?.resolveCardInstance(battle.deck.hand[i]);
        if (resolved?.type === 'attack') continue;
        const removed = battle.deck.takeFromHand(i);
        if (removed) { battle.deck.exhaust(removed); exhausted++; }
      }
      return { type: 'exhaust', target: 'non_attack_hand', value: exhausted };
    }
    if (target === 'all_hand') {
      let exhausted = 0;
      while (battle.deck.hand.length > 0) {
        const removed = battle.deck.takeFromHand(0);
        if (removed) { battle.deck.exhaust(removed); exhausted++; }
      }
      return { type: 'exhaust', target: 'all_hand', value: exhausted };
    }
    return { type: 'exhaust', target: 'current_card', source };
  }

  private static _applySummon(effect: CardEffect, battle: BattleController, _actingEnemyIndex: number): any {
    const enemyId = (effect as any).enemy_id ?? '';
    const count = (effect as any).count ?? 1;
    if (!enemyId) return null;
    const dl = battle.getDataLoader();
    const enemyData = dl?.getEnemy(enemyId);
    if (!enemyData) return null;
    const summoned: string[] = [];
    const { EnemyAI } = require('./EnemyAI');
    const { StatusManager } = require('./StatusManager');
    for (let i = 0; i < count; i++) {
      const newEnemy = EnemyAI.initializeEnemy(enemyData);
      newEnemy.status_manager = new StatusManager();
      newEnemy.summoned_this_turn = true;
      battle.enemies.push(newEnemy);
      summoned.push(newEnemy.name);
    }
    return { type: 'summon', enemy_id: enemyId, count, summoned };
  }

  private static _applyLoseHp(
    effect: CardEffect, battle: BattleController,
    source: 'player' | 'enemy', actingEnemyIndex: number
  ): any {
    const amount = effect.value ?? 0;
    if (source === 'player') {
      battle.playerHp = Math.max(0, battle.playerHp - amount);
      return { type: 'lose_hp', target: 'player', value: amount };
    } else if (actingEnemyIndex >= 0 && actingEnemyIndex < battle.enemies.length) {
      const enemy = battle.enemies[actingEnemyIndex];
      enemy.hp = Math.max(0, enemy.hp - amount);
      return { type: 'lose_hp', target: 'enemy', enemy_index: actingEnemyIndex, value: amount };
    }
    return null;
  }
}

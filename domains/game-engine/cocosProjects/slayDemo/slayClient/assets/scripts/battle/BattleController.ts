// BattleController.ts - 对应 Godot battle_controller.gd
// 战斗核心状态机：setup → start_combat → player_turn ↔ enemy_turn → won/lost

// 不依赖 cc 引擎的轻量事件发射器
class EventTarget {
  private _listeners: Map<string, Function[]> = new Map();
  emit(event: string, ...args: any[]): void {
    (this._listeners.get(event) ?? []).forEach(cb => cb(...args));
  }
  on(event: string, cb: Function): void {
    if (!this._listeners.has(event)) this._listeners.set(event, []);
    this._listeners.get(event)!.push(cb);
  }
  off(event: string, cb: Function): void {
    const arr = this._listeners.get(event);
    if (arr) { const i = arr.indexOf(cb); if (i >= 0) arr.splice(i, 1); }
  }
}
import { CardInstance, DataLoader } from '../autoload/DataLoader';
import { DeckRuntime } from './DeckRuntime';
import { EffectRunner } from './EffectRunner';
import { EnemyAI, EnemyInstance } from './EnemyAI';
import { StatusManager } from './StatusManager';

export interface BattleSnapshot {
  phase: string;
  turn_number: number;
  player_hp: number;
  player_max_hp: number;
  player_block: number;
  player_strength: number;
  player_statuses: any[];
  energy: number;
  energy_per_turn: number;
  hand: any[];
  piles: any;
  enemies: any[];
}

export class BattleController extends EventTarget {
  encounterId = '';
  playerMaxHp = 60;
  playerHp = 60;
  playerBlock = 0;
  energy = 0;
  energyPerTurn = 3;
  drawPerTurn = 5;
  turnNumber = 0;
  phase = 'setup';
  enemies: EnemyInstance[] = [];
  relicIds: string[] = [];
  deck = new DeckRuntime();
  playerStatus = new StatusManager();
  currentCardVfxType = 'slash';

  private _dataLoader: DataLoader | null = null;

  setup(encounterId: string, masterDeck: CardInstance[], playerState: any): void {
    this._dataLoader = DataLoader.getInstance();
    this.encounterId = encounterId;
    this.playerMaxHp = playerState.max_hp ?? 60;
    this.playerHp = playerState.hp ?? this.playerMaxHp;
    this.energyPerTurn = playerState.energy_per_turn ?? 3;
    this.drawPerTurn = playerState.draw_per_turn ?? 5;
    this.relicIds = [...(playerState.relic_ids ?? [])];
    this.playerBlock = 0;
    this.turnNumber = 0;
    this.phase = 'setup';
    this.enemies = [];
    this.playerStatus = new StatusManager();
    this.deck.setup(masterDeck);

    const dl = this._dataLoader;
    // 遗物加成：抽牌数
    const drawBonus = this._getRelicEffectTotal('draw_per_turn');
    if (drawBonus > 0) this.drawPerTurn += drawBonus;

    const encounter = dl?.getEncounter(encounterId);
    for (const enemyId of (encounter?.enemy_ids ?? [])) {
      const enemyData = dl?.getEnemy(enemyId);
      if (!enemyData) continue;
      const enemy = EnemyAI.initializeEnemy(enemyData);
      enemy.status_manager = new StatusManager();
      this.enemies.push(enemy);
    }

    // philosopher_stone：所有敌人开局获得1层力量
    if (this.relicIds.includes('philosopher_stone')) {
      for (const enemy of this.enemies) {
        (enemy.status_manager as StatusManager)?.applyStatus('strength', 1);
      }
    }
  }

  startCombat(): void {
    this.startPlayerTurn();
  }

  startPlayerTurn(): void {
    if (this.phase === 'won' || this.phase === 'lost') return;
    this.turnNumber++;
    this.phase = 'player';
    this.energy = this.energyPerTurn;
    if (this.turnNumber === 1) this.energy += this._getRelicEffectTotal('first_turn_energy');
    if (!this.playerStatus.hasStatus('barricade')) this.playerBlock = 0;
    if (this.turnNumber === 1) {
      const startBlock = this._getRelicEffectTotal('battle_start_block');
      if (startBlock > 0) this.playerBlock += startBlock;
    }

    // 回合开始：中毒/回复
    const tick = this.playerStatus.tickTurnStart();
    if (tick.poison_damage > 0) {
      this.playerHp = Math.max(0, this.playerHp - tick.poison_damage);
      if (this.playerHp <= 0) {
        this.phase = 'lost';
        this._emitState();
        this.emit('combat_lost');
        return;
      }
    }
    if (tick.regeneration_heal > 0) {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + tick.regeneration_heal);
    }

    this.drawCards(this.drawPerTurn);
    this._emitState();
  }

  drawCards(count: number): void {
    this.deck.draw(count);
  }

  canPlayCard(handIndex: number, targetIndex = -1): boolean {
    if (this.phase !== 'player') return false;
    if (handIndex < 0 || handIndex >= this.deck.hand.length) return false;
    const dl = this._dataLoader;
    const card = dl?.resolveCardInstance(this.deck.hand[handIndex]);
    if (!card) return false;
    if (card.cost > this.energy) return false;
    if (card.target === 'single_enemy' && !this._isValidEnemyTarget(targetIndex)) return false;
    return true;
  }

  playCard(handIndex: number, targetIndex = -1): boolean {
    if (!this.canPlayCard(handIndex, targetIndex)) {
      this._emitState();
      return false;
    }

    const cardInstance = this.deck.takeFromHand(handIndex)!;
    const dl = this._dataLoader!;
    const card = dl.resolveCardInstance(cardInstance)!;
    this.energy -= card.cost;

    // 根据 tag 决定特效类型
    this.currentCardVfxType = 'slash';
    for (const tag of (card.tags ?? [])) {
      if (tag === 'poison') { this.currentCardVfxType = 'poison'; break; }
      if (tag === 'fire') { this.currentCardVfxType = 'fire'; break; }
      if (tag === 'magic') { this.currentCardVfxType = 'magic'; break; }
    }

    const effectResults = EffectRunner.applyEffects(card.effects, this, 'player', targetIndex);
    this.currentCardVfxType = 'slash';

    const shouldExhaust = effectResults.some(
      r => r?.type === 'exhaust' && (r.target ?? 'current_card') === 'current_card'
    );
    if (shouldExhaust) this.deck.exhaust(cardInstance);
    else this.deck.discard(cardInstance);

    this.removeDeadEnemies();
    if (this.enemies.length === 0) {
      this.phase = 'won';
      this._emitState();
      this.emit('combat_won', this.playerHp);
      return true;
    }
    this._emitState();
    return true;
  }

  endPlayerTurn(): void {
    if (this.phase !== 'player') return;

    // 回合结束触发：减益递减、金属化
    const endResult = this.playerStatus.tickTurnEnd();
    if (endResult.block_gain > 0) {
      this.playerBlock += endResult.block_gain;
      this.emitCombatEvent({ type: 'block_gained', target: 'player', value: endResult.block_gain });
    }

    this.deck.discardHand();
    this.phase = 'enemy';
    this._emitState();

    for (let i = 0; i < this.enemies.length; i++) {
      if (this.playerHp <= 0) break;
      const enemy = this.enemies[i];
      if (enemy.hp <= 0) continue;

      // 敌人回合开始：中毒/回复
      const sm = enemy.status_manager as StatusManager;
      if (sm) {
        const tick = sm.tickTurnStart();
        if (tick.poison_damage > 0) {
          enemy.hp = Math.max(0, enemy.hp - tick.poison_damage);
        }
        if (tick.regeneration_heal > 0) {
          enemy.hp = Math.min(enemy.max_hp, enemy.hp + tick.regeneration_heal);
        }
      }
      if (enemy.hp <= 0) continue;

      const action = EnemyAI.currentAction(enemy);
      if (action) {
        EffectRunner.applyEffects(action.effects ?? [], this, 'enemy', -1, i);
      }
      EnemyAI.advanceIntent(enemy);

      // 敌人回合结束
      if (sm) sm.tickTurnEnd();
    }

    this.removeDeadEnemies();

    if (this.playerHp <= 0) {
      this.playerHp = 0;
      this.phase = 'lost';
      this._emitState();
      this.emit('combat_lost');
      return;
    }
    if (this.enemies.length === 0) {
      this.phase = 'won';
      this._emitState();
      this.emit('combat_won', this.playerHp);
      return;
    }
    this.startPlayerTurn();
  }

  damageEnemy(targetIndex: number, amount: number): any {
    if (!this._isValidEnemyTarget(targetIndex)) return null;
    const enemy = this.enemies[targetIndex];
    const block = enemy.block ?? 0;
    const blocked = Math.min(block, amount);
    const hpDmg = Math.max(0, amount - blocked);
    enemy.block = block - blocked;
    enemy.hp = Math.max(0, enemy.hp - hpDmg);
    this.emitCombatEvent({ type: 'enemy_damage', enemy_index: targetIndex, value: hpDmg, blocked, vfx_type: this.currentCardVfxType });

    // 荆棘反弹
    const sm = enemy.status_manager as StatusManager;
    if (sm) {
      const reflected = sm.onHit();
      if (reflected > 0) {
        this.playerHp = Math.max(0, this.playerHp - reflected);
        this.emitCombatEvent({ type: 'player_damage', value: reflected, blocked: 0 });
      }
    }
    return { type: 'damage_enemy', enemy_index: targetIndex, value: hpDmg, blocked };
  }

  damagePlayer(amount: number): any {
    const blocked = Math.min(this.playerBlock, amount);
    const hpDmg = Math.max(0, amount - blocked);
    this.playerBlock -= blocked;
    this.playerHp = Math.max(0, this.playerHp - hpDmg);
    this.emitCombatEvent({ type: 'player_damage', value: hpDmg, blocked });
    return { type: 'damage_player', value: hpDmg, blocked };
  }

  getSnapshot(): BattleSnapshot {
    const dl = this._dataLoader;
    const hand = this.deck.hand.map(inst => {
      const card = dl?.resolveCardInstance(inst) ?? {};
      return { ...card, instance_id: inst.instance_id };
    });
    const enemies = this.enemies.map(enemy => {
      const sm = enemy.status_manager as StatusManager;
      return { ...enemy, statuses: sm ? sm.getSnapshot() : [] };
    });
    return {
      phase: this.phase,
      turn_number: this.turnNumber,
      player_hp: this.playerHp,
      player_max_hp: this.playerMaxHp,
      player_block: this.playerBlock,
      player_strength: this.playerStatus.getStacks('strength'),
      player_statuses: this.playerStatus.getSnapshot(),
      energy: this.energy,
      energy_per_turn: this.energyPerTurn,
      hand,
      piles: this.deck.getCounts(),
      enemies,
    };
  }

  emitCombatEvent(event: any): void {
    this.emit('combat_event', event);
  }

  removeDeadEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (this.enemies[i].hp <= 0) {
        this.emitCombatEvent({ type: 'enemy_died', enemy_index: i, name: this.enemies[i].name });
        this.enemies.splice(i, 1);
      }
    }
  }

  getDataLoader(): DataLoader | null {
    return this._dataLoader;
  }

  private _isValidEnemyTarget(targetIndex: number): boolean {
    return targetIndex >= 0 && targetIndex < this.enemies.length && this.enemies[targetIndex].hp > 0;
  }

  private _emitState(): void {
    this.emit('state_changed', this.getSnapshot());
  }

  private _getRelicEffectTotal(effectType: string): number {
    const dl = this._dataLoader;
    if (!dl) return 0;
    return this.relicIds.reduce((sum, relicId) => {
      const relic = dl.getRelic(relicId);
      if (!relic) return sum;
      return sum + relic.effects.filter(e => e.type === effectType).reduce((s, e) => s + e.value, 0);
    }, 0);
  }
}

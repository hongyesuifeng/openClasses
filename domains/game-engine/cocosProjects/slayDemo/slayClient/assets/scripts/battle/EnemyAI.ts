// EnemyAI.ts - 对应 Godot enemy_ai.gd
// 敌人行动选择：支持权重池、条件分支、阶段切换、Boss阶段等模式

import { EnemyData, EnemyAction } from '../autoload/DataLoader';

export interface EnemyIntent {
  id: string;
  name: string;
  type: string;
  value: number;
  base_value: number;
}

export interface EnemyInstance {
  id: string;
  name: string;
  enemy_type: string;
  art_key: string;
  max_hp: number;
  hp: number;
  block: number;
  strength: number;
  actions: EnemyAction[];
  phases: any[];
  current_phase_index: number;
  action_history: string[];
  action_index: number;
  turn_count: number;
  intent: EnemyIntent | null;
  last_selected_action_id?: string;
  phase_transition?: any;
  status_manager?: any; // 引用 StatusManager 实例
  [key: string]: any;
}

export class EnemyAI {
  static initializeEnemy(enemyData: EnemyData): EnemyInstance {
    const actions: EnemyAction[] = JSON.parse(JSON.stringify(enemyData.actions ?? []));
    const phases: any[] = JSON.parse(JSON.stringify(enemyData.phases ?? []));

    const instance: EnemyInstance = {
      id: enemyData.id,
      name: enemyData.name,
      enemy_type: enemyData.enemy_type ?? 'normal',
      art_key: enemyData.art_key ?? 'enemy_slime',
      max_hp: enemyData.max_hp,
      hp: enemyData.max_hp,
      block: 0,
      strength: 0,
      actions,
      phases,
      current_phase_index: 0,
      action_history: [],
      action_index: 0,
      turn_count: 0,
      intent: null,
    };

    if (phases.length > 0) {
      instance.intent = EnemyAI._intentFromPhase(phases[0], instance);
    } else if (actions.length > 0) {
      instance.intent = EnemyAI._intentFromAction(actions[0], instance);
    }
    return instance;
  }

  static advanceIntent(enemy: EnemyInstance, battleState: any = {}): void {
    enemy.turn_count++;
    if (enemy.phases.length > 0) EnemyAI._checkPhaseTransition(enemy, battleState);
    if (enemy.phases.length > 0) EnemyAI._selectActionFromPhase(enemy, battleState);
    else if (enemy.actions.length > 0) EnemyAI._selectActionFromActions(enemy);
    EnemyAI._recordActionHistory(enemy);
  }

  static currentAction(enemy: EnemyInstance): EnemyAction | null {
    const intent = enemy.intent;
    if (!intent) return null;
    const actionId = intent.id;

    if (enemy.phases.length > 0) {
      const phase = enemy.phases[enemy.current_phase_index];
      const found = phase?.actions?.find((a: EnemyAction) => a.id === actionId);
      if (found) return JSON.parse(JSON.stringify(found));
    }
    const found = enemy.actions.find(a => a.id === actionId);
    if (found) return JSON.parse(JSON.stringify(found));
    return intent as unknown as EnemyAction;
  }

  private static _selectActionFromActions(enemy: EnemyInstance): void {
    const actions = enemy.actions;
    if (!actions.length) { enemy.intent = null; return; }
    let idx = enemy.action_index;
    const rule = (actions[idx] as any).next_action_rule ?? 'loop';
    switch (rule) {
      case 'next': idx = Math.min(idx + 1, actions.length - 1); break;
      case 'repeat': break;
      default: idx = (idx + 1) % actions.length;
    }
    enemy.action_index = idx;
    enemy.intent = EnemyAI._intentFromAction(actions[idx], enemy);
  }

  private static _selectActionFromPhase(enemy: EnemyInstance, battleState: any): void {
    const phase = enemy.phases[enemy.current_phase_index];
    if (!phase) return;
    const phaseActions: EnemyAction[] = phase.actions ?? [];
    if (!phaseActions.length) return;
    const mode = phase.selection_mode ?? 'loop';
    switch (mode) {
      case 'weighted_pool': EnemyAI._selectWeightedAction(enemy, phaseActions, battleState); break;
      case 'conditional': EnemyAI._selectConditionalAction(enemy, phaseActions, battleState); break;
      default: EnemyAI._selectLoopAction(enemy, phaseActions);
    }
  }

  private static _selectWeightedAction(enemy: EnemyInstance, actions: EnemyAction[], battleState: any): void {
    let valid = EnemyAI._filterValidActions(actions, enemy, battleState);
    if (!valid.length) valid = actions;
    const total = valid.reduce((sum, a) => sum + ((a as any).weight ?? 50), 0);
    let roll = Math.floor(Math.random() * total);
    for (const action of valid) {
      roll -= ((action as any).weight ?? 50);
      if (roll < 0) {
        enemy.intent = EnemyAI._intentFromAction(action, enemy);
        enemy.last_selected_action_id = action.id;
        return;
      }
    }
    enemy.intent = EnemyAI._intentFromAction(valid[0], enemy);
  }

  private static _selectConditionalAction(enemy: EnemyInstance, actions: EnemyAction[], battleState: any): void {
    for (const action of actions) {
      if (EnemyAI._checkActionConditions(action, enemy, battleState)) {
        enemy.intent = EnemyAI._intentFromAction(action, enemy);
        enemy.last_selected_action_id = action.id;
        return;
      }
    }
    const fallback = actions.find(a => !(a as any).conditions);
    if (fallback) { enemy.intent = EnemyAI._intentFromAction(fallback, enemy); return; }
    if (actions.length) enemy.intent = EnemyAI._intentFromAction(actions[0], enemy);
  }

  private static _selectLoopAction(enemy: EnemyInstance, actions: EnemyAction[]): void {
    const idx = ((enemy.action_index ?? 0) + 1) % actions.length;
    enemy.action_index = idx;
    enemy.intent = EnemyAI._intentFromAction(actions[idx], enemy);
  }

  private static _filterValidActions(actions: EnemyAction[], enemy: EnemyInstance, battleState: any): EnemyAction[] {
    return actions.filter(action => {
      const cooldown = (action as any).cooldown ?? 0;
      if (cooldown > 0 && EnemyAI._isActionOnCooldown(enemy, action.id, cooldown)) return false;
      return EnemyAI._checkActionConditions(action, enemy, battleState);
    });
  }

  private static _isActionOnCooldown(enemy: EnemyInstance, actionId: string, cooldown: number): boolean {
    const history = enemy.action_history;
    const check = Math.min(cooldown, history.length);
    for (let i = 0; i < check; i++) {
      if (history[i] === actionId) return true;
    }
    return false;
  }

  private static _checkActionConditions(action: EnemyAction, enemy: EnemyInstance, battleState: any): boolean {
    const conditions: any[] = (action as any).conditions ?? [];
    if (!conditions.length) return true;
    return conditions.every(c => EnemyAI._evaluateCondition(c, enemy, battleState));
  }

  private static _evaluateCondition(condition: any, enemy: EnemyInstance, battleState: any): boolean {
    const type = condition.type ?? '';
    switch (type) {
      case 'player_hp_below': {
        const ratio = (battleState.player_hp ?? 100) / (battleState.player_max_hp ?? 100);
        return ratio < condition.value;
      }
      case 'player_hp_above': {
        const ratio = (battleState.player_hp ?? 100) / (battleState.player_max_hp ?? 100);
        return ratio > condition.value;
      }
      case 'self_hp_below':
        return enemy.hp / enemy.max_hp < condition.value;
      case 'self_hp_above':
        return enemy.hp / enemy.max_hp > condition.value;
      case 'turn_above':
        return enemy.turn_count > condition.value;
      case 'has_status':
        return enemy.strength > 0; // 简化实现
      default:
        return true;
    }
  }

  private static _checkPhaseTransition(enemy: EnemyInstance, battleState: any): void {
    const phases = enemy.phases;
    for (let i = phases.length - 1; i >= 0; i--) {
      if (EnemyAI._checkPhaseTrigger(phases[i], enemy, battleState)) {
        if (i !== enemy.current_phase_index) {
          EnemyAI._triggerPhaseTransition(enemy, enemy.current_phase_index, i, phases[i]);
        }
        return;
      }
    }
  }

  private static _checkPhaseTrigger(phase: any, enemy: EnemyInstance, _battleState: any): boolean {
    const trigger = phase.trigger ?? '';
    if (!trigger) return true;
    const ratio = enemy.hp / enemy.max_hp;
    if (trigger === 'hp_above_50%') return ratio >= 0.5;
    if (trigger === 'hp_below_50%') return ratio < 0.5;
    if (trigger === 'hp_above_30%') return ratio >= 0.3;
    if (trigger === 'hp_below_30%') return ratio < 0.3;
    if (trigger === 'hp_below_40%') return ratio < 0.4;
    return true;
  }

  private static _triggerPhaseTransition(enemy: EnemyInstance, oldIdx: number, newIdx: number, newPhase: any): void {
    enemy.current_phase_index = newIdx;
    enemy.action_index = 0;
    for (const effect of (newPhase.phase_effects ?? [])) {
      if (effect.type === 'gain_strength') enemy.strength = (enemy.strength ?? 0) + (effect.value ?? 0);
      if (effect.type === 'heal') enemy.hp = Math.min(enemy.max_hp, enemy.hp + (effect.value ?? 0));
    }
    enemy.phase_transition = { from: oldIdx, to: newIdx, phase_name: newPhase.name ?? '' };
  }

  private static _recordActionHistory(enemy: EnemyInstance): void {
    const id = enemy.last_selected_action_id ?? '';
    if (id) {
      enemy.action_history.unshift(id);
      if (enemy.action_history.length > 10) enemy.action_history.length = 10;
    }
  }

  private static _intentFromAction(action: EnemyAction, enemy: EnemyInstance): EnemyIntent {
    const intentType = (action as any).intent_type ?? 'unknown';
    const baseValue = (action as any).intent_value ?? 0;
    const finalValue = intentType === 'attack' ? Math.max(0, baseValue + (enemy.strength ?? 0)) : baseValue;
    return { id: action.id, name: action.name, type: intentType, value: finalValue, base_value: baseValue };
  }

  private static _intentFromPhase(phase: any, enemy: EnemyInstance): EnemyIntent | null {
    const actions: EnemyAction[] = phase.actions ?? [];
    if (!actions.length) return null;
    return EnemyAI._intentFromAction(actions[0], enemy);
  }

  static hasPhaseTransition(enemy: EnemyInstance): boolean {
    return !!(enemy.phase_transition && Object.keys(enemy.phase_transition).length > 0);
  }

  static popPhaseTransition(enemy: EnemyInstance): any {
    const t = enemy.phase_transition;
    enemy.phase_transition = {};
    return t;
  }
}

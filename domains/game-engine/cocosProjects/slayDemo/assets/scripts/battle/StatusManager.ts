// StatusManager.ts - 对应 Godot status_manager.gd
// 管理战斗中的状态效果（11种状态：strength/dexterity/vulnerable/weak/frail/poison/thorns/regeneration/barricade/ritual/metallicize）

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

interface StatusDef {
  is_debuff: boolean;
  is_permanent: boolean;
  trigger: 'none' | 'turn_start' | 'turn_end' | 'on_hit';
  affects: string;
}

const STATUS_DEFS: Record<string, StatusDef> = {
  strength:    { is_debuff: false, is_permanent: true,  trigger: 'none',      affects: 'damage' },
  dexterity:   { is_debuff: false, is_permanent: true,  trigger: 'none',      affects: 'block' },
  vulnerable:  { is_debuff: true,  is_permanent: false, trigger: 'turn_end',  affects: 'damage_taken' },
  weak:        { is_debuff: true,  is_permanent: false, trigger: 'turn_end',  affects: 'damage_dealt' },
  frail:       { is_debuff: true,  is_permanent: false, trigger: 'turn_end',  affects: 'block' },
  poison:      { is_debuff: true,  is_permanent: false, trigger: 'turn_start',affects: 'hp' },
  thorns:      { is_debuff: false, is_permanent: false, trigger: 'on_hit',    affects: 'reflect' },
  regeneration:{ is_debuff: false, is_permanent: false, trigger: 'turn_start',affects: 'hp' },
  barricade:   { is_debuff: false, is_permanent: true,  trigger: 'none',      affects: 'block_retention' },
  ritual:      { is_debuff: false, is_permanent: true,  trigger: 'turn_end',  affects: 'strength_gain' },
  metallicize: { is_debuff: false, is_permanent: true,  trigger: 'turn_end',  affects: 'block_gain' },
};

export interface StatusSnapshot {
  id: string;
  stacks: number;
  is_debuff: boolean;
}

export class StatusManager extends EventTarget {
  private statuses: Map<string, number> = new Map();

  applyStatus(statusId: string, stacks: number): void {
    if (!STATUS_DEFS[statusId]) {
      console.warn(`StatusManager: unknown status '${statusId}'`);
      return;
    }
    if (stacks <= 0) {
      this.removeStatus(statusId);
      return;
    }
    const old = this.getStacks(statusId);
    this.statuses.set(statusId, stacks);
    if (old !== stacks) this.emit('status_changed', statusId, stacks);
  }

  removeStatus(statusId: string): void {
    if (this.statuses.has(statusId)) {
      this.statuses.delete(statusId);
      this.emit('status_changed', statusId, 0);
    }
  }

  getStacks(statusId: string): number {
    return this.statuses.get(statusId) ?? 0;
  }

  hasStatus(statusId: string): boolean {
    return (this.statuses.get(statusId) ?? 0) > 0;
  }

  getAllStatuses(): Record<string, number> {
    const result: Record<string, number> = {};
    this.statuses.forEach((v, k) => { result[k] = v; });
    return result;
  }

  // 回合开始触发：中毒伤害、生命回复
  tickTurnStart(): { poison_damage: number; regeneration_heal: number } {
    const result = { poison_damage: 0, regeneration_heal: 0 };

    if (this.hasStatus('poison')) {
      const stacks = this.getStacks('poison');
      result.poison_damage = stacks;
      this.emit('poison_damage', stacks);
      this._decrementStatus('poison');
    }
    if (this.hasStatus('regeneration')) {
      const stacks = this.getStacks('regeneration');
      result.regeneration_heal = stacks;
      this.emit('regeneration_heal', stacks);
      this._decrementStatus('regeneration');
    }
    return result;
  }

  // 回合结束触发：减益递减，仪式/金属化触发
  tickTurnEnd(): { strength_gain: number; block_gain: number } {
    const result = { strength_gain: 0, block_gain: 0 };
    for (const sid of ['vulnerable', 'weak', 'frail']) {
      if (this.hasStatus(sid)) this._decrementStatus(sid);
    }
    if (this.hasStatus('ritual')) {
      const gain = this.getStacks('ritual');
      result.strength_gain = gain;
      this.applyStatus('strength', this.getStacks('strength') + gain);
    }
    if (this.hasStatus('metallicize')) {
      result.block_gain = this.getStacks('metallicize');
    }
    return result;
  }

  // 计算最终伤害（攻击方or防守方视角）
  calculateDamage(baseDamage: number, isAttacker: boolean): number {
    let dmg = baseDamage;
    if (isAttacker) {
      dmg += this.getStacks('strength');
      if (this.hasStatus('weak')) dmg = Math.max(1, Math.floor(dmg * 0.75));
    } else {
      if (this.hasStatus('vulnerable')) dmg = Math.ceil(dmg * 1.5);
    }
    return Math.max(0, dmg);
  }

  // 计算最终格挡
  calculateBlock(baseBlock: number): number {
    let block = baseBlock + this.getStacks('dexterity');
    if (this.hasStatus('frail')) block = Math.floor(block * 0.75);
    return Math.max(0, block);
  }

  // 被攻击时触发荆棘
  onHit(): number {
    if (this.hasStatus('thorns')) {
      const dmg = this.getStacks('thorns');
      this.emit('thorns_damage', dmg);
      return dmg;
    }
    return 0;
  }

  getSnapshot(): StatusSnapshot[] {
    const result: StatusSnapshot[] = [];
    this.statuses.forEach((stacks, id) => {
      if (stacks > 0 && STATUS_DEFS[id])
        result.push({ id, stacks, is_debuff: STATUS_DEFS[id].is_debuff });
    });
    return result;
  }

  private _decrementStatus(statusId: string): void {
    const current = this.getStacks(statusId);
    if (current <= 1) this.removeStatus(statusId);
    else {
      this.statuses.set(statusId, current - 1);
      this.emit('status_changed', statusId, current - 1);
    }
  }
}

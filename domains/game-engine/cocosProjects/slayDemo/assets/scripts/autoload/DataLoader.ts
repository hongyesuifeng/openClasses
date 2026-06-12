// DataLoader.ts - 对应 Godot data_loader.gd
// 负责加载和验证所有 JSON 数据，提供卡牌/敌人/遭遇等查询接口

export interface CardEffect {
  type: string;
  value?: number;
  target?: string;
  status_id?: string;
  hits?: number;
  repeat?: number;
  enemy_id?: string;
  count?: number;
}

export interface CardUpgrade {
  name?: string;
  description?: string;
  cost?: number;
  effects?: CardEffect[];
}

export interface CardData {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  cost: number;
  target: string;
  tags?: string[];
  art_key?: string;
  effects: CardEffect[];
  upgrade?: CardUpgrade;
}

export interface CardInstance {
  instance_id: number;
  card_id: string;
  is_upgraded: boolean;
}

export interface EnemyAction {
  id: string;
  name: string;
  intent_type: string;
  intent_value?: number;
  effects: CardEffect[];
  weight?: number;
  min_uses?: number;
  max_uses?: number;
  condition?: string;
}

export interface EnemyPhase {
  hp_threshold?: number;
  hp_threshold_type?: string;
  actions: EnemyAction[];
  selection_mode?: string;
}

export interface EnemyData {
  id: string;
  name: string;
  enemy_type: string;
  max_hp: number;
  art_key?: string;
  tags?: string[];
  actions?: EnemyAction[];
  phases?: EnemyPhase[];
  selection_mode?: string;
}

export interface EncounterData {
  id: string;
  encounter_type: string;
  enemy_ids: string[];
  reward_profile_id?: string;
  gold_reward?: { min: number; max: number };
}

export interface RewardProfile {
  id: string;
  card_choices: number;
  card_pool?: string;
  rarity_weights?: Record<string, number>;
}

export interface RelicEffect {
  type: string;
  value: number;
}

export interface RelicData {
  id: string;
  name: string;
  description: string;
  rarity: string;
  effects: RelicEffect[];
  art_key?: string;
}

export interface PotionData {
  id: string;
  name: string;
  description: string;
  rarity: string;
  effects: CardEffect[];
  art_key?: string;
}

export interface MapNode {
  id: string;
  floor: number;
  type: string;
  next_nodes: string[];
  encounter_id?: string;
  reward_profile_id?: string;
  heal_percent?: number;
  gold?: number;
  is_final?: boolean;
  title?: string;
  description?: string;
  choices?: EventChoice[];
}

export interface EventChoice {
  label: string;
  description: string;
  effects: EventEffect[];
}

export interface EventEffect {
  type: string;
  value?: number;
  card_id?: string;
  to_card_id?: string;
  requires_selection?: boolean;
}

export interface RunConfig {
  id: string;
  start_deck: string[];
  start_relics?: string[];
  player: {
    max_hp: number;
    gold: number;
    energy_per_turn: number;
    draw_per_turn: number;
  };
  nodes?: MapNode[];
  map_nodes?: MapNode[];
}

const CARD_TYPES = ['attack', 'skill', 'power', 'status'];
const CARD_RARITIES = ['starter', 'common', 'uncommon', 'rare', 'special'];
const CARD_TARGETS = ['self', 'single_enemy', 'all_enemies', 'none'];
const ENCOUNTER_TYPES = ['normal', 'elite', 'boss'];
const RUN_NODE_TYPES = ['battle', 'reward', 'rest', 'shop', 'chest', 'event', 'result'];
const EFFECT_TYPES = ['damage', 'block', 'draw', 'apply_status', 'gain_strength', 'gain_barricade', 'heal', 'multi_damage', 'aoe_damage', 'gain_energy', 'exhaust', 'summon', 'lose_hp'];
const RELIC_RARITIES = ['common', 'uncommon', 'rare', 'boss', 'starter'];
const RELIC_EFFECT_TYPES = ['battle_start_block', 'first_turn_energy', 'max_hp', 'card_gain_heal', 'battle_win_gold', 'draw_per_turn'];
const POTION_RARITIES = ['common', 'uncommon', 'rare'];
const POTION_EFFECT_TYPES = ['heal', 'block', 'apply_status', 'draw', 'gain_energy', 'gain_strength', 'damage', 'aoe_damage'];
const EVENT_EFFECT_TYPES = ['lose_hp', 'gain_gold', 'remove_card', 'upgrade_card', 'gain_card', 'transform_card'];

export class DataLoader {
  private static _instance: DataLoader | null = null;

  static getInstance(): DataLoader {
    if (!DataLoader._instance) DataLoader._instance = new DataLoader();
    return DataLoader._instance;
  }

  private _cards: Map<string, CardData> = new Map();
  private _enemies: Map<string, EnemyData> = new Map();
  private _encounters: Map<string, EncounterData> = new Map();
  private _rewardProfiles: Map<string, RewardProfile> = new Map();
  private _relics: Map<string, RelicData> = new Map();
  private _potions: Map<string, PotionData> = new Map();
  private _runs: Map<string, RunConfig> = new Map();
  private _loaded = false;
  private _nextCardInstanceId = 1;

  loadAll(rawData: {
    cards: any;
    enemies: any;
    encounters: any;
    rewards: any;
    relics: any;
    potions: any;
    runs: any;
  }): void {
    this._cards = this._loadCollection(rawData.cards, 'cards');
    this._enemies = this._loadCollection(rawData.enemies, 'enemies');
    this._encounters = this._loadCollection(rawData.encounters, 'encounters');
    this._rewardProfiles = this._loadCollection(rawData.rewards, 'reward_profiles');
    this._relics = this._loadCollection(rawData.relics, 'relics');
    this._potions = this._loadCollection(rawData.potions, 'potions');
    this._runs = this._loadCollection(rawData.runs, 'runs');
    this._loaded = true;
  }

  clearCache(): void {
    this._cards.clear();
    this._enemies.clear();
    this._encounters.clear();
    this._rewardProfiles.clear();
    this._relics.clear();
    this._potions.clear();
    this._runs.clear();
    this._loaded = false;
    this._nextCardInstanceId = 1;
  }

  validateAll(): string[] {
    const errors: string[] = [];
    this._validateCards(errors);
    this._validateEnemies(errors);
    this._validateEncounters(errors);
    this._validateRewards(errors);
    this._validateRelics(errors);
    this._validatePotions(errors);
    this._validateRuns(errors);
    return errors;
  }

  getCard(id: string): CardData | null {
    return this._cards.get(id) ? JSON.parse(JSON.stringify(this._cards.get(id))) : null;
  }

  getEnemy(id: string): EnemyData | null {
    return this._enemies.get(id) ? JSON.parse(JSON.stringify(this._enemies.get(id))) : null;
  }

  getEncounter(id: string): EncounterData | null {
    return this._encounters.get(id) ? JSON.parse(JSON.stringify(this._encounters.get(id))) : null;
  }

  getRewardProfile(id: string): RewardProfile | null {
    return this._rewardProfiles.get(id) ? JSON.parse(JSON.stringify(this._rewardProfiles.get(id))) : null;
  }

  getRelic(id: string): RelicData | null {
    return this._relics.get(id) ? JSON.parse(JSON.stringify(this._relics.get(id))) : null;
  }

  getPotion(id: string): PotionData | null {
    return this._potions.get(id) ? JSON.parse(JSON.stringify(this._potions.get(id))) : null;
  }

  getRunConfig(id: string): RunConfig | null {
    return this._runs.get(id) ? JSON.parse(JSON.stringify(this._runs.get(id))) : null;
  }

  getAllCards(): CardData[] {
    return Array.from(this._cards.values()).map(c => JSON.parse(JSON.stringify(c)));
  }

  getAllRelics(): RelicData[] {
    return Array.from(this._relics.values()).map(r => JSON.parse(JSON.stringify(r)));
  }

  getAllPotions(): PotionData[] {
    return Array.from(this._potions.values()).map(p => JSON.parse(JSON.stringify(p)));
  }

  getNextInstanceId(): number {
    return this._nextCardInstanceId;
  }

  restoreInstanceIdCounter(nextId: number): void {
    this._nextCardInstanceId = Math.max(nextId, 1);
  }

  createCardInstance(cardId: string): CardInstance | null {
    if (!this._cards.has(cardId)) {
      console.error(`DataLoader: unknown card id '${cardId}'`);
      return null;
    }
    const instance: CardInstance = {
      instance_id: this._nextCardInstanceId++,
      card_id: cardId,
      is_upgraded: false,
    };
    return instance;
  }

  resolveCardInstance(cardInstance: CardInstance): CardData | null {
    const card = this.getCard(cardInstance.card_id);
    if (!card) return null;
    if (cardInstance.is_upgraded && card.upgrade) {
      const u = card.upgrade;
      if (u.name) card.name = u.name;
      if (u.description) card.description = u.description;
      if (u.cost !== undefined) card.cost = u.cost;
      if (u.effects) card.effects = JSON.parse(JSON.stringify(u.effects));
    }
    return card;
  }

  private _loadCollection<T extends { id: string }>(root: any, key: string): Map<string, T> {
    const map = new Map<string, T>();
    if (!root || !Array.isArray(root[key])) return map;
    for (let i = 0; i < root[key].length; i++) {
      const entry = root[key][i];
      if (!entry || typeof entry !== 'object') { console.error(`DataLoader: ${key}[${i}] is not an object`); continue; }
      const id = entry.id;
      if (!id) { console.error(`DataLoader: ${key}[${i}] has no id`); continue; }
      if (map.has(id)) { console.error(`DataLoader: duplicate id '${id}' in ${key}`); continue; }
      map.set(id, JSON.parse(JSON.stringify(entry)));
    }
    return map;
  }

  // ─── 验证方法 ────────────────────────────────────────────────
  private _validateCards(errors: string[]): void {
    this._cards.forEach((card, id) => {
      this._requireString(card, 'id', 'card', id, errors);
      this._requireString(card, 'name', 'card', id, errors);
      this._requireString(card, 'description', 'card', id, errors);
      this._requireString(card, 'type', 'card', id, errors);
      this._requireString(card, 'rarity', 'card', id, errors);
      this._requireInt(card, 'cost', 'card', id, errors);
      this._requireString(card, 'target', 'card', id, errors);
      this._requireArray(card, 'effects', 'card', id, errors);
      this._enumValue(card, 'type', CARD_TYPES, 'card', id, errors);
      this._enumValue(card, 'rarity', CARD_RARITIES, 'card', id, errors);
      this._enumValue(card, 'target', CARD_TARGETS, 'card', id, errors);
      this._validateEffects(card.effects, `card:${id}`, errors);
    });
  }

  private _validateEnemies(errors: string[]): void {
    this._enemies.forEach((enemy, id) => {
      this._requireString(enemy, 'id', 'enemy', id, errors);
      this._requireString(enemy, 'name', 'enemy', id, errors);
      this._requireInt(enemy, 'max_hp', 'enemy', id, errors);
      const hasActions = Array.isArray(enemy.actions) && enemy.actions.length > 0;
      const hasPhases = Array.isArray(enemy.phases) && enemy.phases.length > 0;
      if (!hasActions && !hasPhases) errors.push(`enemy:${id} must define actions or phases`);
      if (hasActions) this._validateEnemyActions(id, enemy.actions!, errors);
      if (hasPhases) enemy.phases!.forEach((p, pi) => this._validateEnemyActions(`${id}.phase[${pi}]`, p.actions, errors));
    });
  }

  private _validateEnemyActions(ownerId: string, actions: EnemyAction[], errors: string[]): void {
    actions.forEach((action, ai) => {
      this._requireString(action as any, 'id', 'enemy_action', `${ownerId}[${ai}]`, errors);
      this._requireArray(action as any, 'effects', 'enemy_action', `${ownerId}[${ai}]`, errors);
      this._validateEffects(action.effects, `enemy:${ownerId} action:${ai}`, errors);
    });
  }

  private _validateEncounters(errors: string[]): void {
    this._encounters.forEach((enc, id) => {
      this._requireString(enc, 'id', 'encounter', id, errors);
      this._requireString(enc, 'encounter_type', 'encounter', id, errors);
      this._requireArray(enc, 'enemy_ids', 'encounter', id, errors);
      this._enumValue(enc, 'encounter_type', ENCOUNTER_TYPES, 'encounter', id, errors);
      enc.enemy_ids.forEach(eid => {
        if (!this._enemies.has(eid)) errors.push(`encounter:${id} references missing enemy '${eid}'`);
      });
      if (enc.reward_profile_id && !this._rewardProfiles.has(enc.reward_profile_id))
        errors.push(`encounter:${id} references missing reward profile '${enc.reward_profile_id}'`);
    });
  }

  private _validateRewards(errors: string[]): void {
    this._rewardProfiles.forEach((rp, id) => {
      this._requireString(rp, 'id', 'reward_profile', id, errors);
      this._requireInt(rp, 'card_choices', 'reward_profile', id, errors);
    });
  }

  private _validateRelics(errors: string[]): void {
    this._relics.forEach((relic, id) => {
      this._requireString(relic, 'id', 'relic', id, errors);
      this._requireString(relic, 'name', 'relic', id, errors);
      this._requireString(relic, 'description', 'relic', id, errors);
      this._requireString(relic, 'rarity', 'relic', id, errors);
      this._requireArray(relic, 'effects', 'relic', id, errors);
      this._enumValue(relic, 'rarity', RELIC_RARITIES, 'relic', id, errors);
      relic.effects.forEach((e, ei) => {
        this._requireString(e as any, 'type', 'relic_effect', `${id}[${ei}]`, errors);
        this._requireInt(e as any, 'value', 'relic_effect', `${id}[${ei}]`, errors);
        this._enumValue(e as any, 'type', RELIC_EFFECT_TYPES, 'relic_effect', `${id}[${ei}]`, errors);
      });
    });
  }

  private _validatePotions(errors: string[]): void {
    this._potions.forEach((potion, id) => {
      this._requireString(potion, 'id', 'potion', id, errors);
      this._requireString(potion, 'name', 'potion', id, errors);
      this._requireString(potion, 'description', 'potion', id, errors);
      this._requireString(potion, 'rarity', 'potion', id, errors);
      this._requireArray(potion, 'effects', 'potion', id, errors);
      this._enumValue(potion, 'rarity', POTION_RARITIES, 'potion', id, errors);
      potion.effects.forEach((e, ei) => {
        this._requireString(e as any, 'type', 'potion_effect', `${id}[${ei}]`, errors);
        this._enumValue(e as any, 'type', POTION_EFFECT_TYPES, 'potion_effect', `${id}[${ei}]`, errors);
      });
    });
  }

  private _validateRuns(errors: string[]): void {
    this._runs.forEach((run, id) => {
      this._requireString(run, 'id', 'run', id, errors);
      this._requireArray(run, 'start_deck', 'run', id, errors);
      if (!run.nodes && !run.map_nodes) errors.push(`run:${id} must define nodes or map_nodes`);
      run.start_deck.forEach(cid => {
        if (!this._cards.has(cid)) errors.push(`run:${id} start_deck references missing card '${cid}'`);
      });
      (run.start_relics ?? []).forEach(rid => {
        if (!this._relics.has(rid)) errors.push(`run:${id} start_relics references missing relic '${rid}'`);
      });
    });
  }

  private _validateEffects(effects: CardEffect[], ownerLabel: string, errors: string[]): void {
    if (!Array.isArray(effects)) { errors.push(`${ownerLabel} effects must be an array`); return; }
    effects.forEach((e, i) => {
      this._requireString(e as any, 'type', 'effect', `${ownerLabel}[${i}]`, errors);
      this._enumValue(e as any, 'type', EFFECT_TYPES, 'effect', `${ownerLabel}[${i}]`, errors);
    });
  }

  private _requireString(data: any, key: string, kind: string, id: string, errors: string[]): void {
    if (!data[key] || typeof data[key] !== 'string' || data[key] === '')
      errors.push(`${kind}:${id} missing string field '${key}'`);
  }

  private _requireInt(data: any, key: string, kind: string, id: string, errors: string[]): void {
    if (data[key] === undefined || data[key] === null || typeof data[key] !== 'number')
      errors.push(`${kind}:${id} missing numeric field '${key}'`);
  }

  private _requireArray(data: any, key: string, kind: string, id: string, errors: string[]): void {
    if (!Array.isArray(data[key]))
      errors.push(`${kind}:${id} missing array field '${key}'`);
  }

  private _enumValue(data: any, key: string, allowed: string[], kind: string, id: string, errors: string[]): void {
    if (data[key] !== undefined && !allowed.includes(data[key]))
      errors.push(`${kind}:${id} has invalid ${key} '${data[key]}'`);
  }
}

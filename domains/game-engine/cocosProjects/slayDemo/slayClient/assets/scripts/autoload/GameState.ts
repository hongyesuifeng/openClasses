// GameState.ts - 对应 Godot game_state.gd
// 全局游戏运行时状态，作为 Cocos 跨场景持久单例使用

import { CardInstance, MapNode } from './DataLoader';
import { DataLoader } from './DataLoader';

export interface OwnedPotion {
  id: string;
}

export interface PendingReward {
  id: string;
  type: string;
  reward_profile_id?: string;
}

const MAX_POTION_SLOTS = 2;

export class GameState {
  private static _instance: GameState | null = null;

  static getInstance(): GameState {
    if (!GameState._instance) GameState._instance = new GameState();
    return GameState._instance;
  }

  currentPhase = 'boot';
  currentNodeIndex = 0;
  playerMaxHp = 60;
  playerHp = 60;
  playerGold = 0;
  energyPerTurn = 3;
  drawPerTurn = 5;
  cardRemovalCount = 0;
  masterDeck: CardInstance[] = [];
  ownedRelicIds: string[] = [];
  ownedPotions: OwnedPotion[] = [];
  runNodes: MapNode[] = [];
  mapNodes: MapNode[] = [];
  completedMapNodeIds: string[] = [];
  availableMapNodeIds: string[] = [];
  currentMapNodeId = '';
  pendingMapReward: Partial<PendingReward> = {};
  pendingRelicReward: any = {};
  pendingPotionReward: any = {};
  battleWins = 0;
  isRunWon = false;
  isRunFinished = false;

  startNewRun(runConfig: any): void {
    const player = runConfig.player ?? {};
    this.playerMaxHp = player.max_hp ?? 60;
    this.playerHp = this.playerMaxHp;
    this.playerGold = player.gold ?? 0;
    this.energyPerTurn = player.energy_per_turn ?? 3;
    this.drawPerTurn = player.draw_per_turn ?? 5;
    this.currentNodeIndex = 0;
    this.battleWins = 0;
    this.isRunWon = false;
    this.isRunFinished = false;
    this.currentPhase = 'run';
    this.cardRemovalCount = 0;
    this.runNodes = JSON.parse(JSON.stringify(runConfig.nodes ?? []));
    this.mapNodes = JSON.parse(JSON.stringify(runConfig.map_nodes ?? []));
    this.completedMapNodeIds = [];
    this.availableMapNodeIds = [];
    this.currentMapNodeId = '';
    this.pendingMapReward = {};
    this.pendingRelicReward = {};
    this.pendingPotionReward = {};
    this.masterDeck = [];
    this.ownedRelicIds = [];
    this.ownedPotions = [];

    const dl = DataLoader.getInstance();
    for (const cardId of (runConfig.start_deck ?? [])) {
      const inst = dl.createCardInstance(cardId);
      if (inst) this.masterDeck.push(inst);
    }
    for (const relicId of (runConfig.start_relics ?? [])) {
      this.addRelic(relicId);
    }
    if (this.hasMap()) this._unlockStartingMapNodes();
  }

  getCurrentNode(): MapNode | null {
    if (this.hasMap()) {
      if (Object.keys(this.pendingMapReward).length > 0)
        return JSON.parse(JSON.stringify(this.pendingMapReward)) as MapNode;
      if (!this.currentMapNodeId) return null;
      return this.getMapNode(this.currentMapNodeId);
    }
    if (this.currentNodeIndex < 0 || this.currentNodeIndex >= this.runNodes.length) return null;
    return JSON.parse(JSON.stringify(this.runNodes[this.currentNodeIndex]));
  }

  advanceNode(): void {
    this.currentNodeIndex++;
  }

  hasMap(): boolean {
    return this.mapNodes.length > 0;
  }

  getMapNode(nodeId: string): MapNode | null {
    const node = this.mapNodes.find(n => n.id === nodeId);
    return node ? JSON.parse(JSON.stringify(node)) : null;
  }

  getAvailableMapNodes(): MapNode[] {
    return this.availableMapNodeIds
      .map(id => this.getMapNode(id))
      .filter((n): n is MapNode => n !== null);
  }

  getAllMapNodes(): MapNode[] {
    return JSON.parse(JSON.stringify(this.mapNodes));
  }

  canSelectMapNode(nodeId: string): boolean {
    return this.availableMapNodeIds.includes(nodeId) && !this.completedMapNodeIds.includes(nodeId);
  }

  selectMapNode(nodeId: string): boolean {
    if (!this.canSelectMapNode(nodeId)) return false;
    const selected = this.getMapNode(nodeId);
    if (!selected) return false;
    const selectedFloor = selected.floor;
    // 移除同层的其他可用节点
    this.availableMapNodeIds = this.availableMapNodeIds.filter(id => {
      const n = this.getMapNode(id);
      return !n || n.floor !== selectedFloor;
    });
    this.currentMapNodeId = nodeId;
    return true;
  }

  prepareMapReward(rewardProfileId: string): void {
    if (!rewardProfileId) return;
    this.pendingMapReward = {
      id: `${this.currentMapNodeId}_reward`,
      type: 'reward',
      reward_profile_id: rewardProfileId,
    };
  }

  hasPendingMapReward(): boolean {
    return Object.keys(this.pendingMapReward).length > 0;
  }

  completeCurrentMapNode(): void {
    this.pendingMapReward = {};
    if (!this.currentMapNodeId) return;

    if (!this.completedMapNodeIds.includes(this.currentMapNodeId))
      this.completedMapNodeIds.push(this.currentMapNodeId);

    const node = this.getMapNode(this.currentMapNodeId);
    if (node) {
      for (const nextId of (node.next_nodes ?? [])) {
        if (!this.availableMapNodeIds.includes(nextId) && !this.completedMapNodeIds.includes(nextId))
          this.availableMapNodeIds.push(nextId);
      }
    }
    this.currentMapNodeId = '';
  }

  currentMapNodeIsFinal(): boolean {
    const node = this.getMapNode(this.currentMapNodeId);
    if (!node) return false;
    return !!(node.is_final) || (node.next_nodes?.length === 0);
  }

  addCardToDeck(cardId: string): void {
    const dl = DataLoader.getInstance();
    const inst = dl.createCardInstance(cardId);
    if (inst) this.masterDeck.push(inst);
  }

  addRelic(relicId: string): boolean {
    if (!relicId || this.ownedRelicIds.includes(relicId)) return false;
    const dl = DataLoader.getInstance();
    const relic = dl.getRelic(relicId);
    if (!relic) return false;
    this.ownedRelicIds.push(relicId);
    const maxHpBonus = relic.effects.filter(e => e.type === 'max_hp').reduce((sum, e) => sum + e.value, 0);
    if (maxHpBonus > 0) {
      this.playerMaxHp += maxHpBonus;
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + maxHpBonus);
    }
    return true;
  }

  setPendingRelicReward(relic: any): void { this.pendingRelicReward = JSON.parse(JSON.stringify(relic)); }
  consumePendingRelicReward(): any {
    const r = JSON.parse(JSON.stringify(this.pendingRelicReward));
    this.pendingRelicReward = {};
    return r;
  }
  hasPendingRelicReward(): boolean { return Object.keys(this.pendingRelicReward).length > 0; }

  consumePendingPotionReward(): any {
    const p = JSON.parse(JSON.stringify(this.pendingPotionReward));
    this.pendingPotionReward = {};
    return p;
  }
  hasPendingPotionReward(): boolean { return Object.keys(this.pendingPotionReward).length > 0; }

  getOwnedRelics(): any[] {
    const dl = DataLoader.getInstance();
    return this.ownedRelicIds.map(id => dl.getRelic(id)).filter(Boolean);
  }

  removeCardByInstanceId(instanceId: number): boolean {
    const idx = this.masterDeck.findIndex(c => c.instance_id === instanceId);
    if (idx < 0) return false;
    this.masterDeck.splice(idx, 1);
    return true;
  }

  addGold(amount: number): void { this.playerGold = Math.max(0, this.playerGold + amount); }
  spendGold(amount: number): boolean {
    if (amount < 0 || this.playerGold < amount) return false;
    this.playerGold -= amount;
    return true;
  }

  recordBattleWin(): void { this.battleWins++; }
  applyPostBattleHp(hp: number): void { this.playerHp = Math.max(0, Math.min(hp, this.playerMaxHp)); }
  healPlayer(amount: number): void { this.playerHp = Math.max(0, Math.min(this.playerHp + amount, this.playerMaxHp)); }
  healPlayerPercent(percent: number): void { this.healPlayer(Math.ceil(this.playerMaxHp * percent)); }
  incrementRemovalCount(): void { this.cardRemovalCount++; }

  finishRun(won: boolean): void {
    this.isRunWon = won;
    this.isRunFinished = true;
    this.currentPhase = 'result';
  }

  getResultSummary() {
    return {
      won: this.isRunWon,
      battle_wins: this.battleWins,
      deck_size: this.masterDeck.length,
      gold: this.playerGold,
      player_hp: this.playerHp,
      player_max_hp: this.playerMaxHp,
      relic_count: this.ownedRelicIds.length,
      relic_ids: [...this.ownedRelicIds],
      completed_map_nodes: this.completedMapNodeIds.length,
      master_deck: JSON.parse(JSON.stringify(this.masterDeck)),
      potions_held: this.ownedPotions.length,
    };
  }

  // ─── 药水槽位 ────────────────────────────────────────────────
  canAddPotion(): boolean { return this.ownedPotions.length < MAX_POTION_SLOTS; }
  addPotion(potionId: string): boolean {
    if (!this.canAddPotion()) return false;
    this.ownedPotions.push({ id: potionId });
    return true;
  }
  removePotionAt(slot: number): boolean {
    if (slot < 0 || slot >= this.ownedPotions.length) return false;
    this.ownedPotions.splice(slot, 1);
    return true;
  }
  getPotionAt(slot: number): OwnedPotion | null {
    return this.ownedPotions[slot] ? { ...this.ownedPotions[slot] } : null;
  }

  private _unlockStartingMapNodes(): void {
    const lowestFloor = Math.min(...this.mapNodes.map(n => n.floor));
    for (const node of this.mapNodes) {
      if (node.floor === lowestFloor) this.availableMapNodeIds.push(node.id);
    }
  }
}

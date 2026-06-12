// RunController.ts - 对应 Godot run_controller.gd
// 游戏运行流程总控制器，负责场景跳转决策和各阶段完成处理

import { DataLoader } from './DataLoader';
import { GameState } from './GameState';
import { SaveService } from './SaveService';
import { SceneRouter } from './SceneRouter';
import { MapGenerator } from '../map/MapGenerator';
import { RelicService } from '../services/RelicService';
import { PotionService } from '../services/PotionService';

export class RunController {
  private static _instance: RunController | null = null;

  static getInstance(): RunController {
    if (!RunController._instance) RunController._instance = new RunController();
    return RunController._instance;
  }

  useGeneratedMap = true;

  startNewRun(): void {
    const dl = DataLoader.getInstance();
    const gs = GameState.getInstance();
    const sr = SceneRouter.getInstance();

    SaveService.deleteSave();
    const runConfig = this.useGeneratedMap
      ? MapGenerator.generateMap(0, 9)
      : dl.getRunConfig('v1_fixed_run');

    if (!runConfig) { console.error('RunController: no run config found'); return; }
    gs.startNewRun(runConfig);

    if (gs.hasMap()) sr.goTo('map');
    else this.enterCurrentNode();
  }

  resumeRun(): void {
    const save = SaveService.loadSave();
    if (!save) { this.startNewRun(); return; }

    const dl = DataLoader.getInstance();
    const gs = GameState.getInstance();
    SaveService.restore(save, gs, dl);

    if (!gs.hasMap()) { this.enterCurrentNode(); return; }
    if (this._isWaitingForMapSelection(gs)) {
      this._verifyAndRepairMapSelectionState(gs);
      SceneRouter.getInstance().goTo('map');
      return;
    }
    this.enterCurrentNode();
  }

  selectMapNode(nodeId: string): void {
    const gs = GameState.getInstance();
    if (!gs.selectMapNode(nodeId)) {
      console.error(`RunController: map node '${nodeId}' is not selectable`);
      return;
    }
    this.enterCurrentNode();
  }

  enterCurrentNode(): void {
    const gs = GameState.getInstance();
    const sr = SceneRouter.getInstance();
    const node = gs.getCurrentNode();

    if (!node) {
      gs.finishRun(true);
      sr.goTo('result');
      return;
    }

    switch (node.type) {
      case 'battle': sr.goTo('battle'); break;
      case 'reward': sr.goTo('reward'); break;
      case 'rest': sr.goTo('rest'); break;
      case 'shop': sr.goTo('shop'); break;
      case 'chest': sr.goTo('chest'); break;
      case 'event': sr.goTo('event'); break;
      case 'result':
        gs.finishRun(true);
        sr.goTo('result');
        break;
      default:
        console.error(`RunController: unsupported node type '${node.type}'`);
    }
  }

  getCurrentEncounterId(): string {
    return GameState.getInstance().getCurrentNode()?.encounter_id ?? '';
  }

  getCurrentRewardProfileId(): string {
    const gs = GameState.getInstance();
    const dl = DataLoader.getInstance();
    const node = gs.getCurrentNode();
    if (node?.reward_profile_id) return node.reward_profile_id;
    const enc = dl.getEncounter(node?.encounter_id ?? '');
    return enc?.reward_profile_id ?? '';
  }

  onBattleWon(remainingHp: number): void {
    const gs = GameState.getInstance();
    const sr = SceneRouter.getInstance();
    gs.applyPostBattleHp(remainingHp);
    gs.recordBattleWin();
    this._grantBattleGoldReward();
    this._applyBattleWinRelics();
    this._grantEliteRelicIfNeeded();
    this._grantPotionIfNeeded();

    if (gs.hasMap()) {
      if (gs.currentMapNodeIsFinal()) {
        gs.completeCurrentMapNode();
        gs.finishRun(true);
        SaveService.deleteSave();
        sr.goTo('result');
        return;
      }
      const rewardProfileId = this.getCurrentRewardProfileId();
      gs.prepareMapReward(rewardProfileId);
      this._autosave();
      this.enterCurrentNode();
      return;
    }
    gs.advanceNode();
    this._autosave();
    this.enterCurrentNode();
  }

  onBattleLost(): void {
    const gs = GameState.getInstance();
    gs.finishRun(false);
    SaveService.deleteSave();
    SceneRouter.getInstance().goTo('result');
  }

  completeReward(cardId = ''): void {
    const gs = GameState.getInstance();
    const sr = SceneRouter.getInstance();
    if (cardId) gs.addCardToDeck(cardId);
    if (gs.hasMap() && gs.hasPendingMapReward()) {
      gs.completeCurrentMapNode();
      this._autosave();
      sr.goTo('map');
      return;
    }
    gs.advanceNode();
    this._autosave();
    this.enterCurrentNode();
  }

  getCurrentRestHealPercent(): number {
    return GameState.getInstance().getCurrentNode()?.heal_percent ?? 0.3;
  }

  completeRest(): void {
    const gs = GameState.getInstance();
    if (gs.hasMap()) {
      gs.completeCurrentMapNode();
      this._autosave();
      SceneRouter.getInstance().goTo('map');
      return;
    }
    gs.advanceNode();
    this._autosave();
    this.enterCurrentNode();
  }

  completeShop(): void {
    const gs = GameState.getInstance();
    if (gs.hasMap()) {
      gs.completeCurrentMapNode();
      this._autosave();
      SceneRouter.getInstance().goTo('map');
      return;
    }
    gs.advanceNode();
    this._autosave();
    this.enterCurrentNode();
  }

  completeChest(): void {
    const gs = GameState.getInstance();
    if (gs.hasMap()) {
      gs.completeCurrentMapNode();
      this._autosave();
      SceneRouter.getInstance().goTo('map');
      return;
    }
    gs.advanceNode();
    this._autosave();
    this.enterCurrentNode();
  }

  completeEvent(): void {
    const gs = GameState.getInstance();
    if (gs.hasMap()) {
      gs.completeCurrentMapNode();
      this._autosave();
      SceneRouter.getInstance().goTo('map');
      return;
    }
    gs.advanceNode();
    this._autosave();
    this.enterCurrentNode();
  }

  private _grantBattleGoldReward(): void {
    const gs = GameState.getInstance();
    const dl = DataLoader.getInstance();
    const enc = dl.getEncounter(this.getCurrentEncounterId());
    if (!enc?.gold_reward) return;
    const { min = 0, max = 0 } = enc.gold_reward;
    if (max <= 0) return;
    const floorBonus = gs.hasMap() ? Math.floor((gs.getCurrentNode()?.floor ?? 1) * 1.5) : 0;
    const baseGold = Math.floor(Math.random() * (max - min + 1)) + min;
    gs.addGold(baseGold + floorBonus);
  }

  private _applyBattleWinRelics(): void {
    const gs = GameState.getInstance();
    const dl = DataLoader.getInstance();
    const bonus = RelicService.getEffectTotal(gs.ownedRelicIds, dl, 'battle_win_gold');
    if (bonus > 0) gs.addGold(bonus);
  }

  private _grantEliteRelicIfNeeded(): void {
    const gs = GameState.getInstance();
    const dl = DataLoader.getInstance();
    const enc = dl.getEncounter(this.getCurrentEncounterId());
    if (enc?.encounter_type !== 'elite') return;
    const relic = RelicService.chooseRelicReward(gs.ownedRelicIds, dl);
    if (relic) gs.setPendingRelicReward(relic);
  }

  private _grantPotionIfNeeded(): void {
    const gs = GameState.getInstance();
    const dl = DataLoader.getInstance();
    const enc = dl.getEncounter(this.getCurrentEncounterId());
    if (enc?.encounter_type !== 'elite' && enc?.encounter_type !== 'boss') return;
    const potion = PotionService.choosePotionReward(dl);
    if (potion) gs.pendingPotionReward = potion;
  }

  private _autosave(): void {
    const gs = GameState.getInstance();
    const dl = DataLoader.getInstance();
    SaveService.save(gs, dl);
  }

  private _isWaitingForMapSelection(gs: GameState): boolean {
    return gs.hasMap() && !gs.currentMapNodeId;
  }

  private _verifyAndRepairMapSelectionState(gs: GameState): void {
    if (gs.availableMapNodeIds.length > 0) return;
    this._recalculateAvailableNodes(gs);
    if (!gs.availableMapNodeIds.length) {
      gs.finishRun(true);
      SaveService.deleteSave();
      SceneRouter.getInstance().goTo('result');
    }
  }

  private _recalculateAvailableNodes(gs: GameState): void {
    gs.availableMapNodeIds = [];
    if (!gs.completedMapNodeIds.length) {
      const lowest = Math.min(...gs.mapNodes.map(n => n.floor));
      for (const node of gs.mapNodes) {
        if (node.floor === lowest) gs.availableMapNodeIds.push(node.id);
      }
      return;
    }
    for (const completedId of gs.completedMapNodeIds) {
      const node = gs.getMapNode(completedId);
      if (!node) continue;
      for (const nextId of (node.next_nodes ?? [])) {
        if (!gs.completedMapNodeIds.includes(nextId) && !gs.availableMapNodeIds.includes(nextId))
          gs.availableMapNodeIds.push(nextId);
      }
    }
  }
}

// SaveService.ts - 对应 Godot save_service.gd
// 使用 localStorage 存储游戏存档

import { GameState } from './GameState';
import { DataLoader } from './DataLoader';

const SAVE_KEY = 'slay_demo_save_v1';

export interface SaveData {
  version: number;
  game_state: {
    currentPhase: string;
    currentNodeIndex: number;
    playerMaxHp: number;
    playerHp: number;
    playerGold: number;
    energyPerTurn: number;
    drawPerTurn: number;
    cardRemovalCount: number;
    masterDeck: any[];
    ownedRelicIds: string[];
    ownedPotions: any[];
    runNodes: any[];
    mapNodes: any[];
    completedMapNodeIds: string[];
    availableMapNodeIds: string[];
    currentMapNodeId: string;
    pendingMapReward: any;
    pendingRelicReward: any;
    pendingPotionReward: any;
    battleWins: number;
    isRunWon: boolean;
    isRunFinished: boolean;
  };
  next_card_instance_id: number;
}

export class SaveService {
  static hasSave(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw !== null;
    } catch {
      return false;
    }
  }

  static save(gs: GameState, dl: DataLoader): void {
    const data: SaveData = {
      version: 1,
      game_state: {
        currentPhase: gs.currentPhase,
        currentNodeIndex: gs.currentNodeIndex,
        playerMaxHp: gs.playerMaxHp,
        playerHp: gs.playerHp,
        playerGold: gs.playerGold,
        energyPerTurn: gs.energyPerTurn,
        drawPerTurn: gs.drawPerTurn,
        cardRemovalCount: gs.cardRemovalCount,
        masterDeck: JSON.parse(JSON.stringify(gs.masterDeck)),
        ownedRelicIds: [...gs.ownedRelicIds],
        ownedPotions: JSON.parse(JSON.stringify(gs.ownedPotions)),
        runNodes: JSON.parse(JSON.stringify(gs.runNodes)),
        mapNodes: JSON.parse(JSON.stringify(gs.mapNodes)),
        completedMapNodeIds: [...gs.completedMapNodeIds],
        availableMapNodeIds: [...gs.availableMapNodeIds],
        currentMapNodeId: gs.currentMapNodeId,
        pendingMapReward: JSON.parse(JSON.stringify(gs.pendingMapReward)),
        pendingRelicReward: JSON.parse(JSON.stringify(gs.pendingRelicReward)),
        pendingPotionReward: JSON.parse(JSON.stringify(gs.pendingPotionReward)),
        battleWins: gs.battleWins,
        isRunWon: gs.isRunWon,
        isRunFinished: gs.isRunFinished,
      },
      next_card_instance_id: dl.getNextInstanceId(),
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('SaveService: failed to save', e);
    }
  }

  static loadSave(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as SaveData;
    } catch {
      return null;
    }
  }

  static deleteSave(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.error('SaveService: failed to delete save', e);
    }
  }

  static restore(saveData: SaveData, gs: GameState, dl: DataLoader): void {
    const s = saveData.game_state;
    gs.currentPhase = s.currentPhase;
    gs.currentNodeIndex = s.currentNodeIndex;
    gs.playerMaxHp = s.playerMaxHp;
    gs.playerHp = s.playerHp;
    gs.playerGold = s.playerGold;
    gs.energyPerTurn = s.energyPerTurn;
    gs.drawPerTurn = s.drawPerTurn;
    gs.cardRemovalCount = s.cardRemovalCount;
    gs.masterDeck = JSON.parse(JSON.stringify(s.masterDeck));
    gs.ownedRelicIds = [...s.ownedRelicIds];
    gs.ownedPotions = JSON.parse(JSON.stringify(s.ownedPotions));
    gs.runNodes = JSON.parse(JSON.stringify(s.runNodes));
    gs.mapNodes = JSON.parse(JSON.stringify(s.mapNodes));
    gs.completedMapNodeIds = [...s.completedMapNodeIds];
    gs.availableMapNodeIds = [...s.availableMapNodeIds];
    gs.currentMapNodeId = s.currentMapNodeId;
    gs.pendingMapReward = JSON.parse(JSON.stringify(s.pendingMapReward));
    gs.pendingRelicReward = JSON.parse(JSON.stringify(s.pendingRelicReward));
    gs.pendingPotionReward = JSON.parse(JSON.stringify(s.pendingPotionReward));
    gs.battleWins = s.battleWins;
    gs.isRunWon = s.isRunWon;
    gs.isRunFinished = s.isRunFinished;
    dl.restoreInstanceIdCounter(saveData.next_card_instance_id);
  }
}

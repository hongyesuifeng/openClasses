// PotionService.ts - 对应 Godot potion_service.gd
import { DataLoader, PotionData } from '../autoload/DataLoader';
import { GameState } from '../autoload/GameState';
import { BattleController } from '../battle/BattleController';
import { EffectRunner } from '../battle/EffectRunner';

export class PotionService {
  static choosePotionReward(dataLoader: DataLoader): PotionData | null {
    const all = dataLoader.getAllPotions();
    const common = all.filter(p => p.rarity === 'common').map(p => p.id);
    const uncommon = all.filter(p => p.rarity === 'uncommon').map(p => p.id);
    const rare = all.filter(p => p.rarity === 'rare').map(p => p.id);

    const roll = Math.random();
    let pool: string[];
    if (roll < 0.50 && common.length) pool = common;
    else if (roll < 0.85 && uncommon.length) pool = uncommon;
    else if (rare.length) pool = rare;
    else pool = all.map(p => p.id);

    if (!pool.length) return null;
    const chosenId = pool[Math.floor(Math.random() * pool.length)];
    return dataLoader.getPotion(chosenId);
  }

  static usePotion(slot: number, gs: GameState, battle: BattleController, dataLoader: DataLoader): boolean {
    const entry = gs.getPotionAt(slot);
    if (!entry) return false;
    const potion = dataLoader.getPotion(entry.id);
    if (!potion) return false;
    EffectRunner.applyEffects(potion.effects, battle, 'player', -1, -1);
    gs.removePotionAt(slot);
    return true;
  }
}

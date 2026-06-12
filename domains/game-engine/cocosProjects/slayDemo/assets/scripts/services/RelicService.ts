// RelicService.ts - 对应 Godot relic_service.gd
import { DataLoader, RelicData } from '../autoload/DataLoader';

export class RelicService {
  static getEffectTotal(relicIds: string[], dataLoader: DataLoader, effectType: string): number {
    return relicIds.reduce((total, relicId) => {
      const relic = dataLoader.getRelic(relicId);
      if (!relic) return total;
      return total + relic.effects.filter(e => e.type === effectType).reduce((s, e) => s + e.value, 0);
    }, 0);
  }

  static chooseRelicReward(ownedRelicIds: string[], dataLoader: DataLoader): RelicData | null {
    const candidates = dataLoader.getAllRelics().filter(r => !ownedRelicIds.includes(r.id));
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      const score = (r: RelicData) => ({ common: 0, uncommon: 1, rare: 2 } as any)[r.rarity] ?? 3;
      const diff = score(a) - score(b);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });
    return candidates[0];
  }
}

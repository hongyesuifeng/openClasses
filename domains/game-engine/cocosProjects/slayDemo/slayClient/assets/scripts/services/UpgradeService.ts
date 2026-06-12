// UpgradeService.ts - 对应 Godot upgrade_service.gd
import { DataLoader, CardInstance } from '../autoload/DataLoader';

export class UpgradeService {
  static upgradeCardInstance(cardInstance: CardInstance, dataLoader: DataLoader): boolean {
    if (cardInstance.is_upgraded) return false;
    const card = dataLoader.getCard(cardInstance.card_id);
    if (!card?.upgrade) return false;
    cardInstance.is_upgraded = true;
    return true;
  }

  static getUpgradeableCards(masterDeck: CardInstance[], dataLoader: DataLoader): CardInstance[] {
    return masterDeck.filter(inst => {
      if (inst.is_upgraded) return false;
      const card = dataLoader.getCard(inst.card_id);
      return !!card?.upgrade;
    });
  }

  static pickRandomUpgradeable(masterDeck: CardInstance[], dataLoader: DataLoader): CardInstance | null {
    const upgradeable = UpgradeService.getUpgradeableCards(masterDeck, dataLoader);
    if (!upgradeable.length) return null;
    return upgradeable[Math.floor(Math.random() * upgradeable.length)];
  }
}

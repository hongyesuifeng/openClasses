// RewardService.ts - 对应 Godot reward_service.gd
import { DataLoader, CardData, CardInstance } from '../autoload/DataLoader';

export class RewardService {
  static generateCardChoices(profileId: string, ownedDeck: CardInstance[], dataLoader: DataLoader): CardData[] {
    const profile = dataLoader.getRewardProfile(profileId);
    const choiceCount = profile?.card_choices ?? 3;
    const candidates = dataLoader.getAllCards().filter(c => c.rarity !== 'starter');
    candidates.sort((a, b) => {
      const sa = RewardService._scoreCard(a, ownedDeck);
      const sb = RewardService._scoreCard(b, ownedDeck);
      return sb !== sa ? sb - sa : a.id.localeCompare(b.id);
    });
    const choices: CardData[] = [];
    const seen = new Set<string>();
    for (const card of candidates) {
      if (seen.has(card.id)) continue;
      seen.add(card.id);
      choices.push(card);
      if (choices.length >= choiceCount) break;
    }
    return choices;
  }

  private static _scoreCard(card: CardData, ownedDeck: CardInstance[]): number {
    let score = 10;
    if (card.rarity === 'uncommon') score += 3;
    else if (card.rarity === 'rare') score += 6;
    const ownedCount = ownedDeck.filter(inst => inst.card_id === card.id).length;
    return score - ownedCount;
  }
}

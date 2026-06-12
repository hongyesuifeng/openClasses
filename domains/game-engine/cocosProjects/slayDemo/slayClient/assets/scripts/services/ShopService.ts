// ShopService.ts - 对应 Godot shop_service.gd
import { DataLoader, CardData, CardInstance } from '../autoload/DataLoader';
import { GameState } from '../autoload/GameState';
import { RelicService } from './RelicService';
import { PotionService } from './PotionService';

const REMOVE_CARD_BASE_PRICE = 75;
const CARD_SLOTS = 3;
const RELIC_BASE_PRICE = 150;

export interface CardOffer {
  card: CardData;
  price: number;
}

export interface RelicOffer {
  relic: any;
  price: number;
  sold: boolean;
}

export interface PotionOffer {
  potion: any;
  price: number;
  sold: boolean;
}

export class ShopService {
  static generateCardOffers(ownedDeck: CardInstance[], dataLoader: DataLoader, slots = CARD_SLOTS, floorIndex = 0): CardOffer[] {
    const candidates = dataLoader.getAllCards().filter(c => c.rarity !== 'starter');
    candidates.sort((a, b) => {
      const sa = ShopService._scoreCard(a, ownedDeck), sb = ShopService._scoreCard(b, ownedDeck);
      return sb !== sa ? sb - sa : a.id.localeCompare(b.id);
    });
    const offers: CardOffer[] = [];
    const seen = new Set<string>();
    for (const card of candidates) {
      if (seen.has(card.id)) continue;
      seen.add(card.id);
      offers.push({ card, price: ShopService.priceForCard(card, floorIndex) });
      if (offers.length >= slots) break;
    }
    return offers;
  }

  static priceForCard(card: CardData, floorIndex = 0): number {
    const base = card.rarity === 'uncommon' ? 85 : card.rarity === 'rare' ? 140 : 55;
    return base + floorIndex * 3;
  }

  static removeCardPrice(removalCount = 0): number {
    return REMOVE_CARD_BASE_PRICE + Math.max(0, removalCount) * 25;
  }

  static buyCard(gs: GameState, cardId: string, price: number): boolean {
    if (!cardId || !gs.spendGold(price)) return false;
    gs.addCardToDeck(cardId);
    return true;
  }

  static removeCard(gs: GameState, instanceId: number, price: number): boolean {
    if (instanceId <= 0 || !gs.spendGold(price)) return false;
    if (gs.removeCardByInstanceId(instanceId)) { gs.incrementRemovalCount(); return true; }
    gs.addGold(price);
    return false;
  }

  static generateRelicOffer(ownedRelicIds: string[], dataLoader: DataLoader, floorIndex = 0): RelicOffer | null {
    const relic = RelicService.chooseRelicReward(ownedRelicIds, dataLoader);
    if (!relic) return null;
    return { relic, price: ShopService.priceForRelic(relic, floorIndex), sold: false };
  }

  static priceForRelic(relic: any, floorIndex = 0): number {
    const base = relic.rarity === 'uncommon' ? 200 : relic.rarity === 'rare' ? 300 : RELIC_BASE_PRICE;
    return base + floorIndex * 5;
  }

  static buyRelic(gs: GameState, relicId: string, price: number): boolean {
    if (!relicId || !gs.spendGold(price)) return false;
    return gs.addRelic(relicId);
  }

  static generatePotionOffer(dataLoader: DataLoader, floorIndex = 0): PotionOffer | null {
    const potion = PotionService.choosePotionReward(dataLoader);
    if (!potion) return null;
    return { potion, price: ShopService.priceForPotion(potion, floorIndex), sold: false };
  }

  static priceForPotion(potion: any, floorIndex = 0): number {
    const base = potion.rarity === 'uncommon' ? 80 : potion.rarity === 'rare' ? 120 : 50;
    return base + floorIndex * 2;
  }

  static buyPotion(gs: GameState, potionId: string, price: number): boolean {
    if (!potionId || !gs.canAddPotion() || !gs.spendGold(price)) return false;
    return gs.addPotion(potionId);
  }

  private static _scoreCard(card: CardData, ownedDeck: CardInstance[]): number {
    let score = 10;
    if (card.rarity === 'uncommon') score += 3;
    else if (card.rarity === 'rare') score += 6;
    return score - ownedDeck.filter(inst => inst.card_id === card.id).length;
  }
}

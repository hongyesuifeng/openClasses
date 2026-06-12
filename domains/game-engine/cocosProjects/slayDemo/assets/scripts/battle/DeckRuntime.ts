// DeckRuntime.ts - 对应 Godot deck_runtime.gd
// 管理战斗中的牌堆（手牌、抽牌堆、弃牌堆、消耗堆）

import { CardInstance } from '../autoload/DataLoader';

export interface PileCounts {
  draw: number;
  hand: number;
  discard: number;
  exhaust: number;
}

export class DeckRuntime {
  drawPile: CardInstance[] = [];
  hand: CardInstance[] = [];
  discardPile: CardInstance[] = [];
  exhaustPile: CardInstance[] = [];
  private _fixedSeed = -1;

  setup(masterDeck: CardInstance[]): void {
    this.drawPile = JSON.parse(JSON.stringify(masterDeck));
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
    this._shuffleDrawPile();
  }

  setSeed(seed: number): void {
    this._fixedSeed = seed;
  }

  draw(count: number): CardInstance[] {
    const drawn: CardInstance[] = [];
    for (let i = 0; i < count; i++) {
      if (this.drawPile.length === 0) this._refillDrawPile();
      if (this.drawPile.length === 0) break;
      const card = this.drawPile.pop()!;
      this.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }

  takeFromHand(index: number): CardInstance | null {
    if (index < 0 || index >= this.hand.length) return null;
    return this.hand.splice(index, 1)[0];
  }

  discard(card: CardInstance): void {
    if (card) this.discardPile.push(card);
  }

  exhaust(card: CardInstance): void {
    if (card) this.exhaustPile.push(card);
  }

  discardHand(): void {
    const keep: CardInstance[] = [];
    while (this.hand.length > 0) {
      const card = this.hand.pop()!;
      const tags: string[] = (card as any).tags ?? [];
      const hasRetain = tags.includes('retain');
      if (hasRetain && !(card as any)._retain_used) {
        (card as any)._retain_used = true;
        keep.push(card);
        continue;
      }
      delete (card as any)._retain_used;
      this.discardPile.push(card);
    }
    this.hand.push(...keep);
  }

  getCounts(): PileCounts {
    return {
      draw: this.drawPile.length,
      hand: this.hand.length,
      discard: this.discardPile.length,
      exhaust: this.exhaustPile.length,
    };
  }

  private _refillDrawPile(): void {
    if (this.discardPile.length === 0) return;
    this.drawPile = JSON.parse(JSON.stringify(this.discardPile));
    this.discardPile = [];
    this._shuffleDrawPile();
  }

  private _shuffleDrawPile(): void {
    // Fisher-Yates shuffle
    for (let i = this.drawPile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
    }
  }
}

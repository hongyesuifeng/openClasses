// test/unit/DeckRuntime.test.ts
import { DeckRuntime } from '../../assets/scripts/battle/DeckRuntime';

function makeCards(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    instance_id: i + 1,
    card_id: `card_${i}`,
    is_upgraded: false,
  }));
}

describe('DeckRuntime', () => {
  let deck: DeckRuntime;

  beforeEach(() => { deck = new DeckRuntime(); });

  test('setup 初始化：手牌空，所有牌在抽牌堆', () => {
    deck.setup(makeCards(5));
    expect(deck.hand.length).toBe(0);
    expect(deck.drawPile.length).toBe(5);
  });

  test('draw 从抽牌堆移动到手牌', () => {
    deck.setup(makeCards(5));
    const drawn = deck.draw(3);
    expect(drawn.length).toBe(3);
    expect(deck.hand.length).toBe(3);
    expect(deck.drawPile.length).toBe(2);
  });

  test('draw 抽牌堆耗尽时从弃牌堆洗牌', () => {
    deck.setup(makeCards(3));
    deck.draw(3); // 抽完
    // 弃掉手牌
    deck.discardHand();
    expect(deck.discardPile.length).toBe(3);
    // 再次抽牌应洗回弃牌堆
    deck.draw(2);
    expect(deck.hand.length).toBe(2);
  });

  test('takeFromHand 从手牌移除并返回', () => {
    deck.setup(makeCards(3));
    deck.draw(3);
    const card = deck.takeFromHand(0);
    expect(card).not.toBeNull();
    expect(deck.hand.length).toBe(2);
  });

  test('discard 将牌加入弃牌堆', () => {
    deck.setup(makeCards(2));
    deck.draw(1);
    const card = deck.takeFromHand(0)!;
    deck.discard(card);
    expect(deck.discardPile.length).toBe(1);
  });

  test('exhaust 将牌加入消耗堆', () => {
    deck.setup(makeCards(2));
    deck.draw(1);
    const card = deck.takeFromHand(0)!;
    deck.exhaust(card);
    expect(deck.exhaustPile.length).toBe(1);
    expect(deck.discardPile.length).toBe(0);
  });

  test('discardHand 将所有手牌移到弃牌堆', () => {
    deck.setup(makeCards(5));
    deck.draw(5);
    deck.discardHand();
    expect(deck.hand.length).toBe(0);
    expect(deck.discardPile.length).toBe(5);
  });

  test('getCounts 返回正确数量', () => {
    deck.setup(makeCards(5));
    deck.draw(2);
    const counts = deck.getCounts();
    expect(counts.hand).toBe(2);
    expect(counts.draw).toBe(3);
    expect(counts.discard).toBe(0);
    expect(counts.exhaust).toBe(0);
  });
});

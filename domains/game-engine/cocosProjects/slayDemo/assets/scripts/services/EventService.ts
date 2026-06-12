// EventService.ts - 对应 Godot event_service.gd
// 处理地图事件节点的选择效果

import { DataLoader, CardInstance, EventChoice } from '../autoload/DataLoader';
import { GameState } from '../autoload/GameState';

export interface EventResult {
  messages: string[];
  needs_card_selection: boolean;
  selection_type: 'remove' | 'upgrade' | 'transform' | '';
  selection_filter: string;
  pending_effects: any[];
  transform_card_id: string;
}

export class EventService {
  static resolveChoice(choice: EventChoice, gs: GameState, dl: DataLoader): EventResult {
    const result: EventResult = {
      messages: [],
      needs_card_selection: false,
      selection_type: '',
      selection_filter: '',
      pending_effects: [],
      transform_card_id: '',
    };
    for (const effect of (choice.effects ?? [])) {
      const msg = EventService._resolveSingleEffect(effect, gs, dl, result);
      if (msg) result.messages.push(msg);
    }
    return result;
  }

  private static _resolveSingleEffect(effect: any, gs: GameState, dl: DataLoader, result: EventResult): string {
    switch (effect.type) {
      case 'lose_hp': {
        const amount = effect.value ?? 0;
        gs.playerHp = Math.max(0, gs.playerHp - amount);
        return `失去 ${amount} 点生命`;
      }
      case 'gain_gold': {
        const amount = effect.value ?? 0;
        gs.addGold(amount);
        return `${amount >= 0 ? '获得' : '失去'} ${Math.abs(amount)} 金币`;
      }
      case 'remove_card': {
        const cardId = effect.card_id ?? '';
        if (effect.requires_selection || !cardId) {
          result.needs_card_selection = true;
          result.selection_type = 'remove';
          result.selection_filter = cardId;
          result.pending_effects.push(effect);
          return '';
        }
        return EventService._removeFirstCard(gs, dl, cardId);
      }
      case 'upgrade_card': {
        const cardId = effect.card_id ?? '';
        if (effect.requires_selection || !cardId) {
          result.needs_card_selection = true;
          result.selection_type = 'upgrade';
          result.selection_filter = cardId;
          result.pending_effects.push(effect);
          return '';
        }
        return EventService._upgradeFirstCard(gs, dl, cardId);
      }
      case 'transform_card': {
        const fromId = effect.from_card_id ?? '';
        const toId = effect.to_card_id ?? '';
        if (effect.requires_selection || !fromId) {
          result.needs_card_selection = true;
          result.selection_type = 'transform';
          result.selection_filter = fromId;
          result.transform_card_id = toId;
          result.pending_effects.push(effect);
          return '';
        }
        const removed = EventService._removeFirstCard(gs, dl, fromId);
        if (!removed) return '没有可变换的卡牌';
        gs.addCardToDeck(toId);
        const toCard = dl.getCard(toId);
        return `${removed} 变换为 ${toCard?.name ?? toId}`;
      }
      case 'gain_card': {
        const cardId = effect.card_id ?? '';
        const card = dl.getCard(cardId);
        if (!card) return '没有获得卡牌';
        gs.addCardToDeck(cardId);
        return `获得 ${card.name}`;
      }
      default:
        return '';
    }
  }

  static applyCardSelection(
    selectionType: string, selectedInstanceId: number,
    gs: GameState, dl: DataLoader,
    pendingEffects: any[], transformCardId = ''
  ): string {
    switch (selectionType) {
      case 'remove':
        return EventService._removeCardByInstanceId(selectedInstanceId, gs, dl);
      case 'upgrade':
        return EventService._upgradeCardByInstanceId(selectedInstanceId, gs, dl);
      case 'transform': {
        const removed = EventService._removeCardByInstanceId(selectedInstanceId, gs, dl);
        if (!removed) return '变换失败';
        gs.addCardToDeck(transformCardId);
        const toCard = dl.getCard(transformCardId);
        return `${removed} 变换为 ${toCard?.name ?? transformCardId}`;
      }
      default:
        return '未知操作';
    }
  }

  static getSelectableCards(gs: GameState, dl: DataLoader, selectionType: string, filter: string): CardInstance[] {
    return gs.masterDeck.filter(inst => {
      if (filter && inst.card_id !== filter) return false;
      if (selectionType === 'upgrade') {
        if (inst.is_upgraded) return false;
        const card = dl.resolveCardInstance(inst);
        return card?.upgrade !== undefined;
      }
      return true;
    });
  }

  private static _removeFirstCard(gs: GameState, dl: DataLoader, cardId: string): string {
    const inst = gs.masterDeck.find(c => !cardId || c.card_id === cardId);
    if (!inst) return '';
    const card = dl.resolveCardInstance(inst);
    gs.removeCardByInstanceId(inst.instance_id);
    return card?.name ?? cardId;
  }

  private static _upgradeFirstCard(gs: GameState, dl: DataLoader, cardId: string): string {
    const inst = gs.masterDeck.find(c => !c.is_upgraded && (!cardId || c.card_id === cardId));
    if (!inst) return '';
    const card = dl.resolveCardInstance(inst);
    if (!card?.upgrade) return '';
    inst.is_upgraded = true;
    return `${card.name} 已升级`;
  }

  private static _removeCardByInstanceId(instanceId: number, gs: GameState, dl: DataLoader): string {
    const inst = gs.masterDeck.find(c => c.instance_id === instanceId);
    if (!inst) return '';
    const card = dl.resolveCardInstance(inst);
    gs.removeCardByInstanceId(instanceId);
    return `移除 ${card?.name ?? ''}`;
  }

  private static _upgradeCardByInstanceId(instanceId: number, gs: GameState, dl: DataLoader): string {
    const inst = gs.masterDeck.find(c => c.instance_id === instanceId);
    if (!inst) return '';
    if (inst.is_upgraded) return '这张牌已经升级过了';
    const card = dl.resolveCardInstance(inst);
    if (!card?.upgrade) return '这张牌无法升级';
    inst.is_upgraded = true;
    return `${card.name} 已升级`;
  }
}

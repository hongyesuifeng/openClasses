// MapGenerator.ts - 对应 Godot map_generator.gd
// 使用 DAG 算法生成随机地图，支持多种节点类型

import { MapNode, EventChoice } from '../autoload/DataLoader';

const MIN_NODES_PER_FLOOR = 2;
const MAX_NODES_PER_FLOOR = 4;

export interface GeneratedMapConfig {
  id: string;
  start_deck: string[];
  start_relics: string[];
  player: {
    max_hp: number;
    gold: number;
    energy_per_turn: number;
    draw_per_turn: number;
  };
  map_nodes: MapNode[];
}

export class MapGenerator {
  static generateMap(seed = 0, floors = 10): GeneratedMapConfig {
    const mapData = MapGenerator._createEmptyMap(floors);
    MapGenerator._populateNodes(mapData);
    MapGenerator._connectNodes(mapData);
    MapGenerator._assignRoomTypes(mapData);
    return MapGenerator._toMapConfig(mapData);
  }

  private static _createEmptyMap(floors: number): any {
    const mapData: any = { floors, nodes: [], floor_nodes: {} };
    for (let i = 0; i < floors; i++) mapData.floor_nodes[i] = [];
    return mapData;
  }

  private static _populateNodes(mapData: any): void {
    const { floors, nodes, floor_nodes } = mapData;
    for (let floor = 0; floor < floors; floor++) {
      const count = MapGenerator._getNodesCount(floor, floors);
      for (let i = 0; i < count; i++) {
        const nodeId = `map_${floor + 1}_${String.fromCharCode(97 + i)}`;
        const nodeIdx = nodes.length;
        nodes.push({ id: nodeId, floor: floor + 1, type: 'battle', next_nodes: [] });
        floor_nodes[floor].push(nodeIdx);
      }
    }
  }

  private static _getNodesCount(floor: number, total: number): number {
    if (floor === 0 || floor === total - 1 || floor === total - 2) return 1;
    return MapGenerator._randRange(MIN_NODES_PER_FLOOR, MAX_NODES_PER_FLOOR);
  }

  private static _connectNodes(mapData: any): void {
    const { floors, nodes, floor_nodes } = mapData;
    for (let f = 0; f < floors - 1; f++) {
      const cur: number[] = floor_nodes[f];
      const next: number[] = floor_nodes[f + 1];
      if (!cur.length || !next.length) continue;

      for (const nodeIdx of cur) {
        const selNext = MapGenerator._selectNextNodes(next, nodes);
        for (const nIdx of selNext) nodes[nodeIdx].next_nodes.push(nodes[nIdx].id);
      }
      // 确保下一层每个节点至少有一个入口
      for (const nextIdx of next) {
        const nextNode = nodes[nextIdx];
        const hasIncoming = cur.some(idx => nodes[idx].next_nodes.includes(nextNode.id));
        if (!hasIncoming) {
          const upstream = cur[Math.floor(Math.random() * cur.length)];
          nodes[upstream].next_nodes.push(nextNode.id);
        }
      }
    }
  }

  private static _selectNextNodes(nextFloor: number[], _nodes: any[]): number[] {
    const count = MapGenerator._randRange(1, Math.min(2, nextFloor.length));
    const shuffled = [...nextFloor].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private static _assignRoomTypes(mapData: any): void {
    const { floors, nodes, floor_nodes } = mapData;

    // 第一层：固定普通战斗
    const firstNodes: number[] = floor_nodes[0];
    if (firstNodes.length) {
      nodes[firstNodes[0]].type = 'battle';
      nodes[firstNodes[0]].encounter_id = 'v1_normal_01';
    }
    // 最后一层：Boss
    const lastNodes: number[] = floor_nodes[floors - 1];
    if (lastNodes.length) {
      const boss = nodes[lastNodes[0]];
      boss.type = 'battle';
      boss.is_final = true;
      boss.encounter_id = MapGenerator._randomBossEncounter();
    }
    // 倒数第二层：休息点
    if (floors >= 2) {
      const restNodes: number[] = floor_nodes[floors - 2];
      if (restNodes.length) {
        nodes[restNodes[0]].type = 'rest';
        nodes[restNodes[0]].heal_percent = 0.3;
      }
    }

    let shopPlaced = false, eliteCount = 0, eventCount = 0, chestCount = 0;
    for (let f = 1; f < floors - 2; f++) {
      for (const nodeIdx of floor_nodes[f]) {
        const node = nodes[nodeIdx];
        const roll = Math.random();
        if (!shopPlaced && f >= 3 && roll < 0.15) {
          node.type = 'shop';
          shopPlaced = true;
        } else if (f >= 5 && eliteCount < 2 && roll < 0.2) {
          node.type = 'battle';
          node.encounter_id = MapGenerator._randomEliteEncounter();
          eliteCount++;
        } else if (eventCount < 3 && roll < 0.25) {
          node.type = 'event';
          MapGenerator._assignRandomEvent(node);
          eventCount++;
        } else if (chestCount < 2 && f >= 2 && roll < 0.15) {
          node.type = 'chest';
          node.gold = MapGenerator._randRange(30, 60);
          chestCount++;
        } else {
          node.type = 'battle';
          MapGenerator._assignRandomEncounter(node, f);
        }
      }
    }
  }

  private static _assignRandomEvent(node: any): void {
    const events: any[] = [
      {
        title: '破损祭坛',
        description: '一座古老祭坛仍在发光。你可以付出一点代价，换取继续前进的优势。',
        choices: [
          { label: '献血换金币', description: '失去 6 点生命，获得 75 金币。', effects: [{ type: 'lose_hp', value: 6 }, { type: 'gain_gold', value: 75 }] },
          { label: '净化牌组', description: '失去 5 点生命，选择一张卡牌移除。', effects: [{ type: 'lose_hp', value: 5 }, { type: 'remove_card', requires_selection: true }] },
          { label: '祭坛祝福', description: '选择一张卡牌进行升级。', effects: [{ type: 'upgrade_card', requires_selection: true }] },
        ],
      },
      {
        title: '流浪商人',
        description: '一个神秘的商人在路边摆摊。他看起来很急切地想要成交。',
        choices: [
          { label: '购买神秘卡牌', description: '花费 50 金币，获得一张卡牌。', effects: [{ type: 'gain_gold', value: -50 }, { type: 'gain_card', card_id: 'cleave' }] },
          { label: '出售生命精华', description: '失去 8 点生命，获得 100 金币。', effects: [{ type: 'lose_hp', value: 8 }, { type: 'gain_gold', value: 100 }] },
          { label: '离开', description: '不进行交易。', effects: [] },
        ],
      },
      {
        title: '远古图书馆',
        description: '你在废墟中发现了一座保存完好的图书馆。',
        choices: [
          { label: '研读武技', description: '选择一张卡牌进行升级。', effects: [{ type: 'upgrade_card', requires_selection: true }] },
          { label: '寻找财宝', description: '获得 50 金币，但失去 3 点生命。', effects: [{ type: 'gain_gold', value: 50 }, { type: 'lose_hp', value: 3 }] },
          { label: '撕毁典籍', description: '移除一张卡牌，获得 30 金币。', effects: [{ type: 'remove_card', requires_selection: true }, { type: 'gain_gold', value: 30 }] },
        ],
      },
      {
        title: '神秘泉水',
        description: '一眼散发着奇异光芒的泉水。',
        choices: [
          { label: '饮用泉水', description: '恢复 15 点生命。', effects: [{ type: 'lose_hp', value: -15 }] },
          { label: '装瓶带走', description: '获得 50 金币。', effects: [{ type: 'gain_gold', value: 50 }] },
          { label: '洗炼卡牌', description: '选择一张卡牌移除，获得新卡牌。', effects: [{ type: 'transform_card', requires_selection: true, to_card_id: 'cleave' }] },
        ],
      },
    ];
    const selected = events[Math.floor(Math.random() * events.length)];
    Object.assign(node, selected);
  }

  private static _assignRandomEncounter(node: any, floor: number): void {
    let pool: string[];
    if (floor <= 3) pool = ['v1_normal_01', 'v1_normal_02', 'v1_normal_04'];
    else if (floor <= 6) pool = ['v1_normal_03', 'v1_normal_05', 'v1_normal_06', 'v1_normal_08'];
    else pool = ['v1_normal_07', 'v1_normal_09', 'v1_normal_10'];
    node.encounter_id = pool[Math.floor(Math.random() * pool.length)];
  }

  private static _randomEliteEncounter(): string {
    const pool = ['v1_elite_01', 'v1_elite_02', 'v1_elite_03', 'v1_elite_04'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private static _randomBossEncounter(): string {
    const pool = ['v1_boss_01', 'v1_boss_02', 'v1_boss_03'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private static _toMapConfig(mapData: any): GeneratedMapConfig {
    return {
      id: 'generated_map_run',
      start_deck: ['strike', 'strike', 'strike', 'defend', 'defend', 'bash'],
      start_relics: ['burning_blood'],
      player: { max_hp: 80, gold: 120, energy_per_turn: 3, draw_per_turn: 5 },
      map_nodes: mapData.nodes,
    };
  }

  private static _randRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

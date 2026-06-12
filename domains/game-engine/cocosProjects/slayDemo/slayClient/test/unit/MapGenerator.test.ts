// test/unit/MapGenerator.test.ts
import { MapGenerator } from '../../assets/scripts/map/MapGenerator';

describe('MapGenerator', () => {
  test('generate_map 返回有效配置', () => {
    const config = MapGenerator.generateMap(0, 9);
    expect(config.map_nodes.length).toBeGreaterThan(0);
    expect(config.start_deck.length).toBeGreaterThan(0);
  });

  test('第一层节点类型为 battle', () => {
    const config = MapGenerator.generateMap(0, 9);
    const floor1 = config.map_nodes.filter(n => n.floor === 1);
    expect(floor1.length).toBe(1);
    expect(floor1[0].type).toBe('battle');
    expect(floor1[0].encounter_id).toBe('v1_normal_01');
  });

  test('最后一层节点为 boss（is_final = true）', () => {
    const config = MapGenerator.generateMap(0, 9);
    const lastFloor = Math.max(...config.map_nodes.map(n => n.floor));
    const bossNodes = config.map_nodes.filter(n => n.floor === lastFloor);
    expect(bossNodes[0].is_final).toBe(true);
  });

  test('每个节点有唯一 id', () => {
    const config = MapGenerator.generateMap(0, 9);
    const ids = config.map_nodes.map(n => n.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test('next_nodes 引用的节点都存在', () => {
    const config = MapGenerator.generateMap(0, 9);
    const nodeIds = new Set(config.map_nodes.map(n => n.id));
    for (const node of config.map_nodes) {
      for (const nextId of node.next_nodes) {
        expect(nodeIds.has(nextId)).toBe(true);
      }
    }
  });

  test('从第一层可到达最后一层（BFS）', () => {
    const config = MapGenerator.generateMap(0, 9);
    const nodeMap = new Map(config.map_nodes.map(n => [n.id, n]));
    const lastFloor = Math.max(...config.map_nodes.map(n => n.floor));
    const lastNodeId = config.map_nodes.find(n => n.floor === lastFloor)!.id;
    const floor1NodeId = config.map_nodes.find(n => n.floor === 1)!.id;

    const visited = new Set<string>();
    const queue = [floor1NodeId];
    while (queue.length) {
      const cur = queue.shift()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const nid of (nodeMap.get(cur)?.next_nodes ?? [])) {
        if (!visited.has(nid)) queue.push(nid);
      }
    }
    expect(visited.has(lastNodeId)).toBe(true);
  });
});

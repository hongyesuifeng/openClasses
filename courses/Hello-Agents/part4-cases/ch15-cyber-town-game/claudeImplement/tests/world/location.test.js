/**
 * 地点系统测试
 * 测试 src/world/location.js 的 LocationSystem 和 Location 类
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  LocationSystem,
  Location,
  LocationType,
  DEFAULT_LOCATIONS,
  DEFAULT_CONNECTIONS,
  getRecommendedLocation
} from '../../src/world/location.js';

describe('Location', () => {
  let location;

  beforeEach(() => {
    location = new Location({
      id: 'test_loc',
      name: '测试地点',
      type: LocationType.PUBLIC,
      icon: '📍',
      description: '一个测试用的地点',
      position: { x: 100, y: 200 },
      allowedActivities: ['relax', 'socialize'],
      energyRecovery: 0.1,
      socialModifier: 0.5
    });
  });

  // ============ 初始化测试 ============
  describe('初始化', () => {
    test('应该正确创建地点', () => {
      expect(location.id).toBe('test_loc');
      expect(location.name).toBe('测试地点');
      expect(location.type).toBe(LocationType.PUBLIC);
      expect(location.icon).toBe('📍');
      expect(location.description).toBe('一个测试用的地点');
      expect(location.position).toEqual({ x: 100, y: 200 });
    });

    test('应该有默认值', () => {
      const defaultLoc = new Location({});

      expect(defaultLoc.id).toBeDefined();
      expect(defaultLoc.name).toBe('未知地点');
      expect(defaultLoc.type).toBe(LocationType.PUBLIC);
      expect(defaultLoc.icon).toBe('📍');
    });

    test('应该初始化角色集合', () => {
      expect(location.characters).toBeInstanceOf(Set);
      expect(location.characters.size).toBe(0);
    });

    test('应该有默认容量', () => {
      expect(location.capacity).toBe(10);
    });

    test('应该默认开放', () => {
      expect(location.isOpen).toBe(true);
    });
  });

  // ============ 开放检查测试 ============
  describe('checkOpen', () => {
    test('开放地点应该返回 true', () => {
      expect(location.checkOpen(10)).toBe(true);
    });

    test('关闭地点应该返回 false', () => {
      location.isOpen = false;
      expect(location.checkOpen(10)).toBe(false);
    });

    test('应该检查营业时间', () => {
      location.openHours = { start: 9, end: 18 };

      expect(location.checkOpen(10)).toBe(true);
      expect(location.checkOpen(8)).toBe(false);
      expect(location.checkOpen(20)).toBe(false);
    });
  });

  // ============ 角色进出测试 ============
  describe('角色进出', () => {
    test('enterCharacter 应该添加角色', () => {
      const result = location.enterCharacter('char1');

      expect(result).toBe(true);
      expect(location.characters.has('char1')).toBe(true);
    });

    test('容量满时应该拒绝进入', () => {
      location.capacity = 2;
      location.enterCharacter('char1');
      location.enterCharacter('char2');
      const result = location.enterCharacter('char3');

      expect(result).toBe(false);
      expect(location.characters.size).toBe(2);
    });

    test('leaveCharacter 应该移除角色', () => {
      location.enterCharacter('char1');
      const result = location.leaveCharacter('char1');

      expect(result).toBe(true);
      expect(location.characters.has('char1')).toBe(false);
    });

    test('离开不存在的角色应该返回 false', () => {
      const result = location.leaveCharacter('nonexistent');
      expect(result).toBe(false);
    });

    test('getCharacters 应该返回角色数组', () => {
      location.enterCharacter('char1');
      location.enterCharacter('char2');

      const characters = location.getCharacters();

      expect(characters).toContain('char1');
      expect(characters).toContain('char2');
      expect(characters.length).toBe(2);
    });
  });

  // ============ 导出测试 ============
  describe('export', () => {
    test('应该正确导出地点数据', () => {
      location.enterCharacter('char1');
      const data = location.export();

      expect(data.id).toBe('test_loc');
      expect(data.name).toBe('测试地点');
      expect(data.characters).toContain('char1');
    });
  });
});

describe('LocationSystem', () => {
  let locationSystem;

  beforeEach(() => {
    locationSystem = new LocationSystem();
  });

  // ============ 初始化测试 ============
  describe('初始化', () => {
    test('应该正确初始化', () => {
      expect(locationSystem.locations).toBeInstanceOf(Map);
      expect(locationSystem.connections).toBeInstanceOf(Map);
      expect(locationSystem.characterLocations).toBeInstanceOf(Map);
    });

    test('应该加载默认地点', () => {
      expect(locationSystem.locations.size).toBeGreaterThan(0);

      // 检查一些默认地点
      expect(locationSystem.getLocation('home')).toBeDefined();
      expect(locationSystem.getLocation('office')).toBeDefined();
      expect(locationSystem.getLocation('park')).toBeDefined();
    });

    test('应该加载默认连接', () => {
      // home 应该连接到 shop 和 cafe
      const homeConnections = locationSystem.getConnectedLocations('home');
      expect(homeConnections.length).toBeGreaterThan(0);
    });
  });

  // ============ 地点管理测试 ============
  describe('地点管理', () => {
    test('addLocation 应该添加新地点', () => {
      const loc = locationSystem.addLocation({
        id: 'custom_loc',
        name: '自定义地点',
        type: LocationType.PUBLIC
      });

      expect(loc).toBeInstanceOf(Location);
      expect(locationSystem.getLocation('custom_loc')).toBe(loc);
    });

    test('getLocation 应该返回 null（当地点不存在时）', () => {
      expect(locationSystem.getLocation('nonexistent')).toBeNull();
    });

    test('getAllLocations 应该返回所有地点', () => {
      const locations = locationSystem.getAllLocations();

      expect(locations.length).toBeGreaterThan(0);
      expect(locations[0]).toBeInstanceOf(Location);
    });
  });

  // ============ 连接管理测试 ============
  describe('连接管理', () => {
    test('addConnection 应该添加双向连接', () => {
      locationSystem.addLocation({ id: 'loc_a', name: 'A' });
      locationSystem.addLocation({ id: 'loc_b', name: 'B' });

      locationSystem.addConnection('loc_a', 'loc_b', 2);

      const fromA = locationSystem.getConnectedLocations('loc_a');
      const fromB = locationSystem.getConnectedLocations('loc_b');

      expect(fromA.length).toBe(1);
      expect(fromA[0].location.id).toBe('loc_b');
      expect(fromA[0].distance).toBe(2);

      expect(fromB.length).toBe(1);
      expect(fromB[0].location.id).toBe('loc_a');
    });

    test('getConnectedLocations 应该返回空数组（当没有连接时）', () => {
      locationSystem.addLocation({ id: 'isolated', name: '孤岛' });
      const connections = locationSystem.getConnectedLocations('isolated');

      expect(connections).toEqual([]);
    });
  });

  // ============ 角色移动测试 ============
  describe('角色移动', () => {
    test('moveCharacter 应该正确移动角色', () => {
      locationSystem.moveCharacter('char1', 'home');

      expect(locationSystem.getCharacterLocation('char1').id).toBe('home');
      expect(locationSystem.getCharactersAt('home')).toContain('char1');
    });

    test('moveCharacter 应该离开原地点', () => {
      locationSystem.moveCharacter('char1', 'home');
      locationSystem.moveCharacter('char1', 'park');

      expect(locationSystem.getCharacterLocation('char1').id).toBe('park');
      expect(locationSystem.getCharactersAt('home')).not.toContain('char1');
      expect(locationSystem.getCharactersAt('park')).toContain('char1');
    });

    test('moveCharacter 到不存在的地点应该失败', () => {
      const result = locationSystem.moveCharacter('char1', 'nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });

    test('getCharacterLocation 应该返回 null（当角色没有位置时）', () => {
      expect(locationSystem.getCharacterLocation('unknown')).toBeNull();
    });
  });

  // ============ 路径查找测试 ============
  describe('路径查找', () => {
    test('findPath 相同地点应该返回单元素数组', () => {
      const path = locationSystem.findPath('home', 'home');

      expect(path).toEqual(['home']);
    });

    test('findPath 应该找到直接连接的路径', () => {
      // home 连接到 shop
      const path = locationSystem.findPath('home', 'shop');

      expect(path).toBeDefined();
      expect(path.length).toBe(2);
      expect(path[0]).toBe('home');
      expect(path[1]).toBe('shop');
    });

    test('findPath 应该找到间接连接的路径', () => {
      // home -> shop -> park
      const path = locationSystem.findPath('home', 'park');

      expect(path).toBeDefined();
      expect(path.length).toBeGreaterThan(1);
      expect(path[0]).toBe('home');
      expect(path[path.length - 1]).toBe('park');
    });

    test('findPath 无路径时应该返回 null', () => {
      locationSystem.addLocation({ id: 'isolated', name: '孤岛' });
      const path = locationSystem.findPath('home', 'isolated');

      expect(path).toBeNull();
    });

    test('getDistance 应该返回正确的距离', () => {
      const distance = locationSystem.getDistance('home', 'shop');
      expect(distance).toBe(1);
    });

    test('getDistance 无路径时应该返回 Infinity', () => {
      locationSystem.addLocation({ id: 'isolated', name: '孤岛' });
      const distance = locationSystem.getDistance('home', 'isolated');

      expect(distance).toBe(Infinity);
    });
  });

  // ============ 地点查找测试 ============
  describe('地点查找', () => {
    test('findNearestByType 应该找到最近的指定类型地点', () => {
      const nearest = locationSystem.findNearestByType('home', LocationType.COMMERCIAL);

      expect(nearest).toBeDefined();
      expect(nearest.type).toBe(LocationType.COMMERCIAL);
    });

    test('findNearestByType 无匹配时应该返回 null', () => {
      // 创建一个没有工作地点的场景
      const customSystem = new LocationSystem({ config: {} });
      customSystem.locations.clear();
      customSystem.connections.clear();
      customSystem.addLocation({ id: 'home', name: 'Home', type: LocationType.HOME });

      const nearest = customSystem.findNearestByType('home', LocationType.WORK);
      expect(nearest).toBeNull();
    });

    test('getMostSocialLocation 应该返回角色最多的地点', () => {
      // 添加一些角色
      locationSystem.moveCharacter('char1', 'park');
      locationSystem.moveCharacter('char2', 'park');
      locationSystem.moveCharacter('char3', 'home');

      const mostSocial = locationSystem.getMostSocialLocation();

      expect(mostSocial.id).toBe('park');
      expect(mostSocial.characters.size).toBe(2);
    });
  });

  // ============ 地图数据测试 ============
  describe('地图数据', () => {
    test('getMapData 应该返回正确的节点和边', () => {
      const mapData = locationSystem.getMapData();

      expect(mapData.nodes).toBeDefined();
      expect(mapData.edges).toBeDefined();
      expect(mapData.nodes.length).toBeGreaterThan(0);
      expect(mapData.edges.length).toBeGreaterThan(0);
    });

    test('节点应该包含必要信息', () => {
      const mapData = locationSystem.getMapData();
      const homeNode = mapData.nodes.find(n => n.id === 'home');

      expect(homeNode.name).toBeDefined();
      expect(homeNode.icon).toBeDefined();
      expect(homeNode.position).toBeDefined();
      expect(homeNode.characterCount).toBeDefined();
    });
  });

  // ============ 导出/导入测试 ============
  describe('export/import', () => {
    test('应该正确导出状态', () => {
      locationSystem.moveCharacter('char1', 'home');
      const data = locationSystem.export();

      expect(data.locations).toBeDefined();
      expect(data.characterLocations).toBeDefined();
      expect(data.characterLocations['char1']).toBe('home');
    });

    test('应该正确导入状态', () => {
      const data = {
        characterLocations: {
          char1: 'park',
          char2: 'office'
        }
      };

      locationSystem.import(data);

      expect(locationSystem.getCharacterLocation('char1').id).toBe('park');
      expect(locationSystem.getCharacterLocation('char2').id).toBe('office');
    });
  });
});

// ============ 常量和配置测试 ============
describe('常量和配置', () => {
  test('LocationType 应该定义所有类型', () => {
    expect(LocationType.HOME).toBe('home');
    expect(LocationType.WORK).toBe('work');
    expect(LocationType.SOCIAL).toBe('social');
    expect(LocationType.COMMERCIAL).toBe('commercial');
    expect(LocationType.PUBLIC).toBe('public');
    expect(LocationType.NATURE).toBe('nature');
  });

  test('DEFAULT_LOCATIONS 应该有有效的配置', () => {
    DEFAULT_LOCATIONS.forEach(loc => {
      expect(loc.id).toBeDefined();
      expect(loc.name).toBeDefined();
      expect(loc.type).toBeDefined();
      expect(loc.position).toBeDefined();
      expect(loc.position.x).toBeDefined();
      expect(loc.position.y).toBeDefined();
    });
  });

  test('DEFAULT_CONNECTIONS 应该有有效的配置', () => {
    DEFAULT_CONNECTIONS.forEach(conn => {
      expect(conn.from).toBeDefined();
      expect(conn.to).toBeDefined();
      expect(conn.distance).toBeDefined();
    });
  });
});

// ============ 工具函数测试 ============
describe('getRecommendedLocation', () => {
  let locationSystem;

  beforeEach(() => {
    locationSystem = new LocationSystem();
  });

  test('饥饿需求应该推荐商业区', () => {
    const need = { type: 'hunger' };
    const recommended = getRecommendedLocation(need, locationSystem, 'home');

    expect(recommended).toBeDefined();
    expect(recommended.type).toBe(LocationType.COMMERCIAL);
  });

  test('能量需求应该推荐家', () => {
    const need = { type: 'energy' };
    const recommended = getRecommendedLocation(need, locationSystem, 'office');

    expect(recommended).toBeDefined();
    expect(recommended.type).toBe(LocationType.HOME);
  });

  test('社交需求应该推荐最多人的地方', () => {
    locationSystem.moveCharacter('char1', 'park');
    locationSystem.moveCharacter('char2', 'park');

    const need = { type: 'social' };
    const recommended = getRecommendedLocation(need, locationSystem, 'home');

    expect(recommended).toBeDefined();
    expect(recommended.id).toBe('park');
  });

  test('未知需求应该返回 null', () => {
    const need = { type: 'unknown' };
    const recommended = getRecommendedLocation(need, locationSystem, 'home');

    expect(recommended).toBeNull();
  });
});

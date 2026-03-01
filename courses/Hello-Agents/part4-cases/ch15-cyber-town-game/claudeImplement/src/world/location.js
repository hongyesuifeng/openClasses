/**
 * 地点系统 - LocationSystem
 *
 * 管理游戏世界的空间结构：
 * 1. 地点定义与属性
 * 2. 地点间连接关系
 * 3. 角色位置管理
 *
 * 知识点映射：
 * - 第15章：虚拟世界空间管理
 */

/**
 * 地点类型
 */
const LocationType = {
    HOME: 'home',
    WORK: 'work',
    SOCIAL: 'social',
    COMMERCIAL: 'commercial',
    PUBLIC: 'public',
    NATURE: 'nature'
};

/**
 * 默认地点配置
 */
const DEFAULT_LOCATIONS = [
    {
        id: 'home',
        name: '家',
        type: LocationType.HOME,
        icon: '🏠',
        description: '温馨的家，可以休息和恢复',
        position: { x: 100, y: 150 },
        allowedActivities: ['rest', 'sleep', 'eat', 'relax'],
        energyRecovery: 0.3,
        socialModifier: 0
    },
    {
        id: 'office',
        name: '办公室',
        type: LocationType.WORK,
        icon: '🏢',
        description: '工作的地方',
        position: { x: 300, y: 100 },
        allowedActivities: ['work', 'meet'],
        energyRecovery: -0.1,
        socialModifier: 0.3
    },
    {
        id: 'park',
        name: '公园',
        type: LocationType.NATURE,
        icon: '🌳',
        description: '美丽的公园，适合散步和社交',
        position: { x: 500, y: 200 },
        allowedActivities: ['relax', 'socialize', 'exercise'],
        energyRecovery: 0.1,
        socialModifier: 0.5
    },
    {
        id: 'restaurant',
        name: '餐厅',
        type: LocationType.COMMERCIAL,
        icon: '🏪',
        description: '美味的食物等你来',
        position: { x: 200, y: 250 },
        allowedActivities: ['eat', 'socialize'],
        energyRecovery: 0.2,
        socialModifier: 0.4
    },
    {
        id: 'tavern',
        name: '酒馆',
        type: LocationType.SOCIAL,
        icon: '🍺',
        description: '热闹的酒馆，社交的好地方',
        position: { x: 400, y: 300 },
        allowedActivities: ['drink', 'socialize', 'relax'],
        energyRecovery: 0,
        socialModifier: 0.7
    },
    {
        id: 'square',
        name: '广场',
        type: LocationType.PUBLIC,
        icon: '🏛️',
        description: '城镇中心广场',
        position: { x: 350, y: 200 },
        allowedActivities: ['socialize', 'explore', 'relax'],
        energyRecovery: 0.05,
        socialModifier: 0.6
    },
    {
        id: 'cafe',
        name: '咖啡馆',
        type: LocationType.COMMERCIAL,
        icon: '☕',
        description: '安静的咖啡馆',
        position: { x: 150, y: 300 },
        allowedActivities: ['eat', 'socialize', 'work'],
        energyRecovery: 0.15,
        socialModifier: 0.4
    },
    {
        id: 'shop',
        name: '商店',
        type: LocationType.COMMERCIAL,
        icon: '🛒',
        description: '各种物品应有尽有',
        position: { x: 250, y: 180 },
        allowedActivities: ['shop', 'explore'],
        energyRecovery: 0,
        socialModifier: 0.2
    }
];

/**
 * 默认连接关系
 */
const DEFAULT_CONNECTIONS = [
    { from: 'home', to: 'shop', distance: 1 },
    { from: 'shop', to: 'park', distance: 1 },
    { from: 'shop', to: 'office', distance: 1 },
    { from: 'office', to: 'tavern', distance: 1 },
    { from: 'tavern', to: 'square', distance: 1 },
    { from: 'park', to: 'square', distance: 1 },
    { from: 'home', to: 'cafe', distance: 1 },
    { from: 'cafe', to: 'restaurant', distance: 1 },
    { from: 'restaurant', to: 'square', distance: 1 }
];

/**
 * 地点类
 */
class Location {
    constructor(config) {
        this.id = config.id || 'loc_' + Date.now();
        this.name = config.name || '未知地点';
        this.type = config.type || LocationType.PUBLIC;
        this.icon = config.icon || '📍';
        this.description = config.description || '';
        this.position = config.position || { x: 0, y: 0 };
        this.allowedActivities = config.allowedActivities || [];
        this.energyRecovery = config.energyRecovery || 0;
        this.socialModifier = config.socialModifier || 0;

        // 当前在地点的角色
        this.characters = new Set();

        // 地点属性
        this.capacity = config.capacity || 10;
        this.isOpen = config.isOpen !== undefined ? config.isOpen : true;
        this.openHours = config.openHours || { start: 0, end: 24 };
    }

    /**
     * 检查是否开放
     */
    checkOpen(currentHour) {
        if (!this.isOpen) return false;
        return currentHour >= this.openHours.start && currentHour < this.openHours.end;
    }

    /**
     * 角色进入
     */
    enterCharacter(characterId) {
        if (this.characters.size >= this.capacity) {
            return false;
        }
        this.characters.add(characterId);
        return true;
    }

    /**
     * 角色离开
     */
    leaveCharacter(characterId) {
        return this.characters.delete(characterId);
    }

    /**
     * 获取在地点的角色列表
     */
    getCharacters() {
        return Array.from(this.characters);
    }

    /**
     * 导出
     */
    export() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            icon: this.icon,
            description: this.description,
            position: this.position,
            characters: Array.from(this.characters)
        };
    }
}

/**
 * 地点系统
 */
class LocationSystem {
    constructor(config = {}) {
        // 地点映射
        this.locations = new Map();

        // 连接关系（邻接表）
        this.connections = new Map();

        // 初始化默认地点
        this.initDefaultLocations();

        // 角色位置映射
        this.characterLocations = new Map();
    }

    /**
     * 初始化默认地点
     */
    initDefaultLocations() {
        // 添加默认地点
        DEFAULT_LOCATIONS.forEach(loc => {
            this.addLocation(loc);
        });

        // 添加默认连接
        DEFAULT_CONNECTIONS.forEach(conn => {
            this.addConnection(conn.from, conn.to, conn.distance);
        });
    }

    /**
     * 添加地点
     */
    addLocation(config) {
        const location = new Location(config);
        this.locations.set(location.id, location);
        return location;
    }

    /**
     * 获取地点
     */
    getLocation(locationId) {
        return this.locations.get(locationId) || null;
    }

    /**
     * 获取所有地点
     */
    getAllLocations() {
        return Array.from(this.locations.values());
    }

    /**
     * 添加连接
     */
    addConnection(from, to, distance = 1) {
        if (!this.connections.has(from)) {
            this.connections.set(from, new Map());
        }
        this.connections.get(from).set(to, distance);

        // 双向连接
        if (!this.connections.has(to)) {
            this.connections.set(to, new Map());
        }
        this.connections.get(to).set(from, distance);
    }

    /**
     * 获取相邻地点
     */
    getConnectedLocations(locationId) {
        const connected = this.connections.get(locationId);
        if (!connected) return [];

        return Array.from(connected.entries()).map(([id, distance]) => ({
            location: this.getLocation(id),
            distance
        }));
    }

    /**
     * 移动角色
     */
    moveCharacter(characterId, toLocationId) {
        const fromLocation = this.getCharacterLocation(characterId);
        const toLocation = this.getLocation(toLocationId);

        if (!toLocation) {
            return { success: false, error: '目标地点不存在' };
        }

        // 离开原地点
        if (fromLocation) {
            fromLocation.leaveCharacter(characterId);
        }

        // 进入新地点
        const entered = toLocation.enterCharacter(characterId);
        if (!entered) {
            return { success: false, error: '地点已满' };
        }

        // 更新映射
        this.characterLocations.set(characterId, toLocationId);

        return {
            success: true,
            from: fromLocation?.name || '未知',
            to: toLocation.name
        };
    }

    /**
     * 获取角色当前位置
     */
    getCharacterLocation(characterId) {
        const locationId = this.characterLocations.get(characterId);
        return locationId ? this.getLocation(locationId) : null;
    }

    /**
     * 获取某地点的所有角色
     */
    getCharactersAt(locationId) {
        const location = this.getLocation(locationId);
        return location ? location.getCharacters() : [];
    }

    /**
     * 寻找路径（BFS）
     */
    findPath(fromId, toId) {
        if (fromId === toId) return [fromId];

        const visited = new Set();
        const queue = [[fromId, [fromId]]];
        visited.add(fromId);

        while (queue.length > 0) {
            const [current, path] = queue.shift();
            const neighbors = this.getConnectedLocations(current);

            for (const { location } of neighbors) {
                if (location.id === toId) {
                    return [...path, location.id];
                }

                if (!visited.has(location.id)) {
                    visited.add(location.id);
                    queue.push([location.id, [...path, location.id]]);
                }
            }
        }

        return null; // 没有找到路径
    }

    /**
     * 计算移动距离
     */
    getDistance(fromId, toId) {
        const path = this.findPath(fromId, toId);
        return path ? path.length - 1 : Infinity;
    }

    /**
     * 查找最近的指定类型地点
     */
    findNearestByType(fromLocationId, locationType) {
        const locations = Array.from(this.locations.values())
            .filter(loc => loc.type === locationType);

        let nearest = null;
        let minDistance = Infinity;

        for (const loc of locations) {
            const distance = this.getDistance(fromLocationId, loc.id);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = loc;
            }
        }

        return nearest;
    }

    /**
     * 获取社交活跃的地点（角色最多的）
     */
    getMostSocialLocation() {
        let bestLocation = null;
        let maxCharacters = 0;

        this.locations.forEach(loc => {
            const count = loc.characters.size;
            if (count > maxCharacters) {
                maxCharacters = count;
                bestLocation = loc;
            }
        });

        return bestLocation;
    }

    /**
     * 获取地图数据（用于渲染）
     */
    getMapData() {
        const nodes = [];
        const edges = [];

        this.locations.forEach(loc => {
            nodes.push({
                id: loc.id,
                name: loc.name,
                icon: loc.icon,
                position: loc.position,
                characterCount: loc.characters.size
            });
        });

        this.connections.forEach((neighbors, fromId) => {
            neighbors.forEach((distance, toId) => {
                // 避免重复边
                if (fromId < toId) {
                    edges.push({
                        from: fromId,
                        to: toId,
                        distance
                    });
                }
            });
        });

        return { nodes, edges };
    }

    /**
     * 导出状态
     */
    export() {
        const locations = {};
        this.locations.forEach((loc, id) => {
            locations[id] = loc.export();
        });

        return {
            locations,
            characterLocations: Object.fromEntries(this.characterLocations)
        };
    }

    /**
     * 导入状态
     */
    import(data) {
        if (data.characterLocations) {
            this.characterLocations = new Map(Object.entries(data.characterLocations));
        }
    }
}

/**
 * 根据需求获取推荐地点
 */
function getRecommendedLocation(need, locationSystem, currentLocation) {
    switch (need.type) {
        case 'hunger':
            return locationSystem.findNearestByType(currentLocation, LocationType.COMMERCIAL);
        case 'energy':
            return locationSystem.findNearestByType(currentLocation, LocationType.HOME);
        case 'social':
            return locationSystem.getMostSocialLocation();
        default:
            return null;
    }
}

export {
    LocationSystem,
    Location,
    LocationType,
    DEFAULT_LOCATIONS,
    DEFAULT_CONNECTIONS,
    getRecommendedLocation
};

/**
 * ECS World - 实体和系统的容器
 */

import { Entity, QueryOptions } from './types.js';
import { ComponentType } from './component.js';
import { Query } from './query.js';
import { System } from './system.js';

export class World {
  // 实体管理
  private entities: Set<Entity> = new Set();
  private nextEntityId: Entity = 0;
  private freeEntityIds: Entity[] = [];

  // 组件管理
  private components: ComponentType[] = [];

  // 查询管理
  private queries: Query[] = [];

  // 系统管理
  private systems: System[] = [];

  // 事件
  onEntityCreated: ((entity: Entity) => void) | null = null;
  onEntityDestroyed: ((entity: Entity) => void) | null = null;

  // ========== 实体管理 ==========

  /**
   * 创建实体
   */
  createEntity(): Entity {
    let entity: Entity;

    if (this.freeEntityIds.length > 0) {
      entity = this.freeEntityIds.pop()!;
    } else {
      entity = this.nextEntityId++;
    }

    this.entities.add(entity);
    this.onEntityCreated?.(entity);

    return entity;
  }

  /**
   * 销毁实体
   */
  destroyEntity(entity: Entity): void {
    if (!this.entities.has(entity)) return;

    // 移除所有组件
    for (const component of this.components) {
      if (component.has(entity)) {
        component.remove(entity);
      }
    }

    // 更新查询
    for (const query of this.queries) {
      query.onEntityDestroyed(entity);
    }

    this.entities.delete(entity);
    this.freeEntityIds.push(entity);

    this.onEntityDestroyed?.(entity);
  }

  /**
   * 检查实体是否存在
   */
  hasEntity(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  /**
   * 获取所有实体
   */
  getEntities(): Entity[] {
    return Array.from(this.entities);
  }

  /**
   * 实体数量
   */
  get entityCount(): number {
    return this.entities.size;
  }

  // ========== 组件管理 ==========

  /**
   * 添加组件到实体
   */
  addComponent<T extends ComponentSchema>(
    entity: Entity,
    componentType: ComponentType<T>,
    values?: Partial<{ [K in keyof T]: number }>
  ): void {
    componentType.add(entity, values);

    // 更新查询
    for (const query of this.queries) {
      query.onComponentAdded(entity);
    }
  }

  /**
   * 移除组件
   */
  removeComponent(entity: Entity, componentType: ComponentType): void {
    componentType.remove(entity);

    // 更新查询
    for (const query of this.queries) {
      query.onComponentRemoved(entity);
    }
  }

  /**
   * 检查实体是否有组件
   */
  hasComponent(entity: Entity, componentType: ComponentType): boolean {
    return componentType.has(entity);
  }

  /**
   * 获取组件数据
   */
  getComponent<T extends ComponentSchema>(
    entity: Entity,
    componentType: ComponentType<T>
  ): { [K in keyof T]: number } | undefined {
    return componentType.get(entity);
  }

  /**
   * 注册组件类型
   */
  registerComponent(componentType: ComponentType): void {
    this.components.push(componentType);
  }

  // ========== 查询管理 ==========

  /**
   * 创建查询
   */
  createQuery(options: QueryOptions): Query {
    const query = new Query(this, options);

    // 初始化查询
    for (const entity of this.entities) {
      if (query.matches(entity)) {
        (query as any).entities.add(entity);
      }
    }

    this.queries.push(query);
    return query;
  }

  // ========== 系统管理 ==========

  /**
   * 添加系统
   */
  addSystem(system: System): void {
    system.init(this);
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 移除系统
   */
  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      system.destroy?.();
      this.systems.splice(index, 1);
    }
  }

  /**
   * 获取系统
   */
  getSystem<T extends System>(type: new (...args: any[]) => T): T | undefined {
    return this.systems.find(s => s instanceof type) as T | undefined;
  }

  // ========== 更新 ==========

  /**
   * 更新所有系统
   */
  update(dt: number): void {
    for (const system of this.systems) {
      if (system.enabled) {
        system.update(dt);
      }
    }
  }

  /**
   * 固定时间步长更新
   */
  fixedUpdate(dt: number): void {
    for (const system of this.systems) {
      if (system.enabled && system.fixedUpdate) {
        system.fixedUpdate(dt);
      }
    }
  }

  // ========== 清理 ==========

  /**
   * 清空所有实体
   */
  clearEntities(): void {
    for (const entity of Array.from(this.entities)) {
      this.destroyEntity(entity);
    }
  }

  /**
   * 销毁世界
   */
  destroy(): void {
    // 销毁所有系统
    for (const system of this.systems) {
      system.destroy?.();
    }

    this.clearEntities();
    this.systems = [];
    this.queries = [];
    this.components = [];
  }
}

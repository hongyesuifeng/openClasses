/**
 * 查询系统
 */

import { Entity, QueryOptions } from './types.js';
import { ComponentType } from './component.js';

export class Query {
  private entities: Set<Entity> = new Set();
  private world: any; // World 类型

  private allComponents: ComponentType[] = [];
  private anyComponents: ComponentType[] = [];
  private noneComponents: ComponentType[] = [];

  constructor(world: any, options: QueryOptions) {
    this.world = world;

    this.allComponents = options.all || [];
    this.anyComponents = options.any || [];
    this.noneComponents = options.none || [];
  }

  /**
   * 检查实体是否匹配查询
   */
  matches(entity: Entity): boolean {
    // all: 所有组件都必须存在
    for (const component of this.allComponents) {
      if (!component.has(entity)) return false;
    }

    // none: 所有组件都不能存在
    for (const component of this.noneComponents) {
      if (component.has(entity)) return false;
    }

    // any: 至少有一个组件存在 (如果指定了)
    if (this.anyComponents.length > 0) {
      let hasAny = false;
      for (const component of this.anyComponents) {
        if (component.has(entity)) {
          hasAny = true;
          break;
        }
      }
      if (!hasAny) return false;
    }

    return true;
  }

  /**
   * 当组件添加到实体时调用
   */
  onComponentAdded(entity: Entity): void {
    if (this.matches(entity)) {
      this.entities.add(entity);
    } else {
      this.entities.delete(entity);
    }
  }

  /**
   * 当组件从实体移除时调用
   */
  onComponentRemoved(entity: Entity): void {
    if (!this.matches(entity)) {
      this.entities.delete(entity);
    }
  }

  /**
   * 当实体销毁时调用
   */
  onEntityDestroyed(entity: Entity): void {
    this.entities.delete(entity);
  }

  /**
   * 获取所有匹配的实体
   */
  getEntities(): Entity[] {
    return Array.from(this.entities);
  }

  /**
   * 迭代器
   */
  [Symbol.iterator](): Iterator<Entity> {
    return this.entities[Symbol.iterator]();
  }

  /**
   * 实体数量
   */
  get count(): number {
    return this.entities.size;
  }

  /**
   * 遍历实体
   */
  forEach(callback: (entity: Entity) => void): void {
    for (const entity of this.entities) {
      callback(entity);
    }
  }
}

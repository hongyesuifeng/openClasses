/**
 * 组件定义和管理
 */

import { Entity, ComponentType, ComponentSchema, ComponentStorage, TypeToArray } from './types.js';

// 组件类型标记
export const Types = {
  i8: ComponentType.I8,
  u8: ComponentType.U8,
  i16: ComponentType.I16,
  u16: ComponentType.U16,
  i32: ComponentType.I32,
  u32: ComponentType.U32,
  f32: ComponentType.F32,
  f64: ComponentType.F64,
};

// 创建 TypedArray
function createTypedArray(type: ComponentType, size: number): TypedArray {
  switch (type) {
    case ComponentType.I8: return new Int8Array(size);
    case ComponentType.U8: return new Uint8Array(size);
    case ComponentType.I16: return new Int16Array(size);
    case ComponentType.U16: return new Uint16Array(size);
    case ComponentType.I32: return new Int32Array(size);
    case ComponentType.U32: return new Uint32Array(size);
    case ComponentType.F32: return new Float32Array(size);
    case ComponentType.F64: return new Float64Array(size);
  }
}

// 组件定义
export interface ComponentType<T extends ComponentSchema = ComponentSchema> {
  id: number;
  schema: T;
  storage: ComponentStorage<T>;
  entities: Set<Entity>;

  add(entity: Entity, values?: Partial<{ [K in keyof T]: number }>): void;
  remove(entity: Entity): void;
  has(entity: Entity): boolean;
  get(entity: Entity): { [K in keyof T]: number } | undefined;
}

// 组件 ID 计数器
let componentIdCounter = 0;

// 最大实体数
const MAX_ENTITIES = 100000;

/**
 * 定义组件
 */
export function defineComponent<T extends ComponentSchema>(schema: T): ComponentType<T> {
  const id = componentIdCounter++;

  // 创建 SoA 存储
  const storage = {} as ComponentStorage<T>;
  for (const key in schema) {
    storage[key] = createTypedArray(schema[key], MAX_ENTITIES) as TypeToArray<T[typeof key]>;
  }

  const componentType: ComponentType<T> = {
    id,
    schema,
    storage,
    entities: new Set(),

    add(entity, values) {
      if (values) {
        for (const key in values) {
          if (key in storage) {
            storage[key][entity] = values[key] as any;
          }
        }
      }
      this.entities.add(entity);
    },

    remove(entity) {
      this.entities.delete(entity);
    },

    has(entity) {
      return this.entities.has(entity);
    },

    get(entity) {
      if (!this.has(entity)) return undefined;

      const result = {} as { [K in keyof T]: number };
      for (const key in storage) {
        result[key] = storage[key][entity] as number;
      }
      return result;
    },
  };

  return componentType;
}

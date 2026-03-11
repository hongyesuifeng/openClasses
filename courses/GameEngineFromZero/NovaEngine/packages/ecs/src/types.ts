/**
 * ECS 类型定义
 */

// 实体就是一个数字 ID
export type Entity = number;

// 组件数据类型
export enum ComponentType {
  I8 = 'i8',
  U8 = 'u8',
  I16 = 'i16',
  U16 = 'u16',
  I32 = 'i32',
  U32 = 'u32',
  F32 = 'f32',
  F64 = 'f64',
}

// 类型到 TypedArray 的映射
export type TypeToArray<T extends ComponentType> = T extends ComponentType.I8
  ? Int8Array
  : T extends ComponentType.U8
  ? Uint8Array
  : T extends ComponentType.I16
  ? Int16Array
  : T extends ComponentType.U16
  ? Uint16Array
  : T extends ComponentType.I32
  ? Int32Array
  : T extends ComponentType.U32
  ? Uint32Array
  : T extends ComponentType.F32
  ? Float32Array
  : Float64Array;

// 组件 Schema
export type ComponentSchema = Record<string, ComponentType>;

// 组件存储
export type ComponentStorage<T extends ComponentSchema> = {
  [K in keyof T]: TypeToArray<T[K]>;
};

// 查询选项
export interface QueryOptions {
  all?: any[];   // 必须有所有组件
  any?: any[];   // 至少有一个组件
  none?: any[];  // 不能有任何组件
}

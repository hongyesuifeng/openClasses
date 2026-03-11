/**
 * NovaEngine
 * A TypeScript game engine built from scratch
 */

// Re-export all packages
export * from '@nova/core';
export * from '@nova/math';
export * from '@nova/ecs';
export * from '@nova/render';
export * from '@nova/scene';
export * from '@nova/physics2d';
export * from '@nova/input';
export * from '@nova/audio';
export * from '@nova/animation';
export * from '@nova/resource';

// Engine class
export { Engine } from './engine.js';
export type { EngineConfig } from './engine.js';

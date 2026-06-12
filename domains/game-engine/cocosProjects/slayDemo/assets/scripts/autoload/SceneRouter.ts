// SceneRouter.ts - 对应 Godot scene_router.gd
// 负责场景切换，在 Cocos 中通过 director.loadScene 实现，带淡入淡出效果

// 在 Cocos Creator 环境中用 director，在测试/Node 环境中用 stub
let _director: { loadScene: (name: string, cb?: Function) => void };
try {
  _director = require('cc').director;
} catch {
  _director = { loadScene: (name: string, cb?: Function) => { cb?.(); } };
}

export type SceneKey = 'main_menu' | 'map' | 'battle' | 'reward' | 'rest' | 'shop' | 'chest' | 'event' | 'result';

const SCENE_NAMES: Record<SceneKey, string> = {
  main_menu: 'MainMenuScene',
  map: 'MapScene',
  battle: 'BattleScene',
  reward: 'RewardScene',
  rest: 'RestScene',
  shop: 'ShopScene',
  chest: 'ChestScene',
  event: 'EventScene',
  result: 'ResultScene',
};

export class SceneRouter {
  private static _instance: SceneRouter | null = null;

  static getInstance(): SceneRouter {
    if (!SceneRouter._instance) SceneRouter._instance = new SceneRouter();
    return SceneRouter._instance;
  }

  private _isSwitching = false;

  isSwitching(): boolean {
    return this._isSwitching;
  }

  goTo(sceneKey: SceneKey): void {
    if (this._isSwitching) return;
    const sceneName = SCENE_NAMES[sceneKey];
    if (!sceneName) {
      console.error(`SceneRouter: unknown scene key '${sceneKey}'`);
      return;
    }
    this._isSwitching = true;
    _director.loadScene(sceneName, () => {
      this._isSwitching = false;
    });
  }
}

# 音频系统设计 (@nova/audio)

## 概述

音频系统基于 Web Audio API，提供音效播放、背景音乐、音量控制和空间音频功能。

## 设计目标

1. **高性能**: 支持多声道同时播放
2. **分类管理**: 音效/音乐分类控制
3. **内存友好**: 音效池化复用
4. **空间音频**: 支持 2D/3D 定位音效

## 核心类型

### AudioManager - 音频管理器

```typescript
// audio-manager.ts
export class AudioManager {
  private context: AudioContext;
  private masterGain: GainNode;
  private sfxGain: GainNode;
  private musicGain: GainNode;

  private sounds: Map<string, Sound> = new Map();
  private music: Music | null = null;
  private soundPool: Map<string, SoundInstance[]> = new Map();

  constructor() {
    this.context = new AudioContext();

    // 创建主增益节点
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);

    // 创建分类增益节点
    this.sfxGain = this.context.createGain();
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.context.createGain();
    this.musicGain.connect(this.masterGain);
  }

  // 音量控制
  get masterVolume(): number {
    return this.masterGain.gain.value;
  }

  set masterVolume(value: number) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, value));
  }

  get sfxVolume(): number {
    return this.sfxGain.gain.value;
  }

  set sfxVolume(value: number) {
    this.sfxGain.gain.value = Math.max(0, Math.min(1, value));
  }

  get musicVolume(): number {
    return this.musicGain.gain.value;
  }

  set musicVolume(value: number) {
    this.musicGain.gain.value = Math.max(0, Math.min(1, value));
  }

  // 加载音效
  async loadSound(id: string, url: string): Promise<Sound> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

    const sound = new Sound(this.context, audioBuffer);
    this.sounds.set(id, sound);

    return sound;
  }

  // 播放音效
  play(id: string, options: PlayOptions = {}): SoundInstance | null {
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`Sound not found: ${id}`);
      return null;
    }

    // 从池中获取或创建新实例
    let instance = this.getFromPool(id);
    if (!instance) {
      instance = sound.createInstance();
    }

    // 配置并播放
    instance.setVolume(options.volume ?? 1);
    instance.setLoop(options.loop ?? false);
    instance.setPlaybackRate(options.playbackRate ?? 1);
    instance.setOutput(this.sfxGain);
    instance.play();

    return instance;
  }

  // 停止音效
  stop(id: string): void {
    // 停止所有该 ID 的实例
    const instances = this.soundPool.get(id) || [];
    for (const instance of instances) {
      if (instance.isPlaying) {
        instance.stop();
      }
    }
  }

  // 播放音乐
  async playMusic(url: string, options: MusicOptions = {}): Promise<void> {
    // 停止当前音乐
    if (this.music) {
      this.music.stop();
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

    this.music = new Music(this.context, audioBuffer);
    this.music.setVolume(options.volume ?? 1);
    this.music.setLoop(options.loop ?? true);
    this.music.setFadeTime(options.fadeTime ?? 1);
    this.music.setOutput(this.musicGain);
    this.music.play();
  }

  stopMusic(fadeTime: number = 1): void {
    if (this.music) {
      this.music.fadeOut(fadeTime);
      this.music = null;
    }
  }

  // 音效池
  private getFromPool(id: string): SoundInstance | null {
    const pool = this.soundPool.get(id);
    if (!pool) return null;

    for (const instance of pool) {
      if (!instance.isPlaying) {
        return instance;
      }
    }
    return null;
  }

  // 预热音效池
  warmupPool(id: string, count: number): void {
    const sound = this.sounds.get(id);
    if (!sound) return;

    if (!this.soundPool.has(id)) {
      this.soundPool.set(id, []);
    }

    const pool = this.soundPool.get(id)!;
    for (let i = pool.length; i < count; i++) {
      pool.push(sound.createInstance());
    }
  }

  // 恢复音频上下文 (用户交互后调用)
  resume(): void {
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  // 暂停所有
  pauseAll(): void {
    this.context.suspend();
  }

  // 恢复所有
  resumeAll(): void {
    this.context.resume();
  }

  // 销毁
  destroy(): void {
    this.context.close();
    this.sounds.clear();
    this.soundPool.clear();
  }
}

export interface PlayOptions {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
  position?: Vec2;
}

export interface MusicOptions {
  volume?: number;
  loop?: boolean;
  fadeTime?: number;
}
```

### Sound - 音效资源

```typescript
// sound.ts
export class Sound {
  private context: AudioContext;
  private buffer: AudioBuffer;

  constructor(context: AudioContext, buffer: AudioBuffer) {
    this.context = context;
    this.buffer = buffer;
  }

  get duration(): number {
    return this.buffer.duration;
  }

  createInstance(): SoundInstance {
    return new SoundInstance(this.context, this.buffer);
  }

  // 单次播放 (简单场景)
  playOnce(gainNode: GainNode, volume: number = 1): void {
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;

    const gain = this.context.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(gainNode);

    source.start(0);
  }
}
```

### SoundInstance - 音效实例

```typescript
// sound-instance.ts
export class SoundInstance {
  private context: AudioContext;
  private buffer: AudioBuffer;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private outputNode: AudioNode;

  private _isPlaying: boolean = false;
  private _volume: number = 1;
  private _loop: boolean = false;
  private _playbackRate: number = 1;
  private startTime: number = 0;
  private pauseTime: number = 0;

  constructor(context: AudioContext, buffer: AudioBuffer) {
    this.context = context;
    this.buffer = buffer;
    this.gainNode = context.createGain();
    this.outputNode = this.gainNode;
  }

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get volume(): number {
    return this._volume;
  }

  get currentTime(): number {
    if (!this._isPlaying) return this.pauseTime;
    return (this.context.currentTime - this.startTime) % this.buffer.duration;
  }

  setVolume(value: number): this {
    this._volume = Math.max(0, Math.min(1, value));
    this.gainNode.gain.value = this._volume;
    return this;
  }

  setLoop(loop: boolean): this {
    this._loop = loop;
    if (this.source) {
      this.source.loop = loop;
    }
    return this;
  }

  setPlaybackRate(rate: number): this {
    this._playbackRate = rate;
    if (this.source) {
      this.source.playbackRate.value = rate;
    }
    return this;
  }

  setOutput(node: AudioNode): this {
    this.gainNode.disconnect();
    this.gainNode.connect(node);
    this.outputNode = node;
    return this;
  }

  play(offset: number = 0): void {
    if (this._isPlaying) return;

    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = this._loop;
    this.source.playbackRate.value = this._playbackRate;
    this.source.onended = () => {
      this._isPlaying = false;
    };

    this.source.connect(this.gainNode);
    this.source.start(0, offset);

    this.startTime = this.context.currentTime - offset;
    this._isPlaying = true;
  }

  pause(): void {
    if (!this._isPlaying) return;

    this.pauseTime = this.currentTime;
    this.stop();
  }

  resume(): void {
    if (this._isPlaying) return;
    this.play(this.pauseTime);
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    this._isPlaying = false;
    this.pauseTime = 0;
  }

  // 淡入
  fadeIn(duration: number): void {
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      this._volume,
      this.context.currentTime + duration
    );
  }

  // 淡出
  fadeOut(duration: number): void {
    this.gainNode.gain.setValueAtTime(this._volume, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);

    setTimeout(() => this.stop(), duration * 1000);
  }
}
```

### Music - 背景音乐

```typescript
// music.ts
export class Music {
  private context: AudioContext;
  private buffer: AudioBuffer;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;

  private _isPlaying: boolean = false;
  private _volume: number = 1;
  private _loop: boolean = true;
  private _fadeTime: number = 1;

  constructor(context: AudioContext, buffer: AudioBuffer) {
    this.context = context;
    this.buffer = buffer;
    this.gainNode = context.createGain();
  }

  setVolume(volume: number): this {
    this._volume = Math.max(0, Math.min(1, volume));
    this.gainNode.gain.value = this._volume;
    return this;
  }

  setLoop(loop: boolean): this {
    this._loop = loop;
    return this;
  }

  setFadeTime(time: number): this {
    this._fadeTime = time;
    return this;
  }

  setOutput(node: AudioNode): this {
    this.gainNode.disconnect();
    this.gainNode.connect(node);
    return this;
  }

  play(): void {
    if (this._isPlaying) return;

    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = this._loop;

    this.source.connect(this.gainNode);

    // 淡入
    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(
      this._volume,
      this.context.currentTime + this._fadeTime
    );

    this.source.start(0);
    this._isPlaying = true;
  }

  stop(): void {
    if (this.source) {
      this.source.stop();
      this.source.disconnect();
      this.source = null;
    }
    this._isPlaying = false;
  }

  fadeOut(duration: number = this._fadeTime): void {
    this.gainNode.gain.setValueAtTime(this._volume, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);

    setTimeout(() => this.stop(), duration * 1000);
  }

  crossfadeTo(newBuffer: AudioBuffer, duration: number = 1): void {
    // 淡出当前音乐
    this.fadeOut(duration);

    // 创建新音乐
    setTimeout(() => {
      this.buffer = newBuffer;
      this.play();
    }, duration * 1000);
  }
}
```

## 空间音频

### SpatialAudio - 2D 空间音频

```typescript
// spatial-audio.ts
export class SpatialAudio {
  private context: AudioContext;
  private listener: AudioListener;
  private panner: PannerNode;
  private gainNode: GainNode;

  // 2D 设置
  private maxDistance: number = 1000;
  private refDistance: number = 100;
  private rolloffFactor: number = 1;

  constructor(context: AudioContext) {
    this.context = context;
    this.listener = context.listener;
    this.panner = context.createPanner();
    this.gainNode = context.createGain();

    // 配置 panner
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.maxDistance = this.maxDistance;
    this.panner.refDistance = this.refDistance;
    this.panner.rolloffFactor = this.rolloffFactor;

    this.panner.connect(this.gainNode);
  }

  setOutput(node: AudioNode): this {
    this.gainNode.disconnect();
    this.gainNode.connect(node);
    return this;
  }

  // 设置听者位置
  setListenerPosition(x: number, y: number): void {
    this.listener.positionX.value = x;
    this.listener.positionY.value = y;
    this.listener.positionZ.value = 0;
  }

  // 设置听者朝向
  setListenerOrientation(forwardX: number, forwardY: number): void {
    this.listener.forwardX.value = forwardX;
    this.listener.forwardY.value = forwardY;
    this.listener.forwardZ.value = 0;
  }

  // 设置音源位置
  setSourcePosition(x: number, y: number): void {
    this.panner.positionX.value = x;
    this.panner.positionY.value = y;
    this.panner.positionZ.value = 0;
  }

  // 连接音源
  connect(source: AudioNode): void {
    source.connect(this.panner);
  }

  // 计算音量衰减
  calculateVolume(listenerPos: Vec2, sourcePos: Vec2): number {
    const distance = listenerPos.distance(sourcePos);
    if (distance <= this.refDistance) return 1;
    if (distance >= this.maxDistance) return 0;

    return this.refDistance / (this.refDistance +
           this.rolloffFactor * (distance - this.refDistance));
  }
}

// 在 AudioManager 中添加
class AudioManager {
  // ... 其他代码

  // 播放空间音效
  playSpatial(id: string, position: Vec2, options: PlayOptions = {}): SoundInstance | null {
    const sound = this.sounds.get(id);
    if (!sound) return null;

    const instance = sound.createInstance();

    // 创建空间音频
    const spatial = new SpatialAudio(this.context);
    spatial.setListenerPosition(this.listenerPosition.x, this.listenerPosition.y);
    spatial.setSourcePosition(position.x, position.y);
    spatial.setOutput(this.sfxGain);

    instance.setOutput(spatial as any);
    instance.setVolume(options.volume ?? 1);
    instance.play();

    return instance;
  }

  private listenerPosition: Vec2 = new Vec2();

  setListenerPosition(x: number, y: number): void {
    this.listenerPosition.set(x, y);
  }
}
```

## 音效生成

### SoundGenerator - 程序化音效

```typescript
// sound-generator.ts
export class SoundGenerator {
  private context: AudioContext;

  constructor(context: AudioContext) {
    this.context = context;
  }

  // 生成蜂鸣声
  generateBeep(frequency: number = 440, duration: number = 0.1): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      data[i] = Math.sin(2 * Math.PI * frequency * t);
    }

    return buffer;
  }

  // 生成噪音
  generateNoise(duration: number = 0.1, type: 'white' | 'pink' = 'white'): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else {
      // 粉红噪音 (简化)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }

    return buffer;
  }

  // 生成爆炸音效
  generateExplosion(duration: number = 0.5): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const noise = Math.random() * 2 - 1;
      const envelope = Math.exp(-t * 10);
      data[i] = noise * envelope;
    }

    return buffer;
  }

  // 生成跳跃音效
  generateJump(): AudioBuffer {
    const sampleRate = this.context.sampleRate;
    const duration = 0.15;
    const length = sampleRate * duration;
    const buffer = this.context.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const freq = 200 + t * 2000; // 频率上升
      data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - t / duration);
    }

    return buffer;
  }
}
```

## 使用示例

```typescript
import { AudioManager } from '@nova/audio';

class Game {
  private audio: AudioManager;

  async init() {
    this.audio = new AudioManager();

    // 预加载音效
    await Promise.all([
      this.audio.loadSound('jump', '/assets/sounds/jump.wav'),
      this.audio.loadSound('shoot', '/assets/sounds/shoot.wav'),
      this.audio.loadSound('explosion', '/assets/sounds/explosion.wav'),
    ]);

    // 预热音效池
    this.audio.warmupPool('shoot', 10);

    // 播放背景音乐
    await this.audio.playMusic('/assets/music/bgm.mp3', {
      volume: 0.5,
      fadeTime: 2
    });
  }

  onPlayerJump() {
    this.audio.play('jump', { volume: 0.8 });
  }

  onPlayerShoot(position: Vec2) {
    // 空间音效
    this.audio.playSpatial('shoot', position);
  }

  onEnemyDestroy(position: Vec2) {
    this.audio.playSpatial('explosion', position, { volume: 1.2 });
  }

  // 音量控制 UI
  setMasterVolume(value: number) {
    this.audio.masterVolume = value;
  }

  setSFXVolume(value: number) {
    this.audio.sfxVolume = value;
  }

  setMusicVolume(value: number) {
    this.audio.musicVolume = value;
  }
}
```

## 参考资源

- [MDN - Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Web Audio API 规范](https://webaudio.github.io/web-audio-api/)
- [Howler.js](https://github.com/goldfire/howler.js) - 音频库参考

# 音频系统

音频系统负责游戏中所有声音的播放、暂停和控制。它通过 PAL 平台抽象层实现跨平台音频播放。

## 目录

- [架构概述](#架构概述)
- [AudioClip 音频资源](#audioclip-音频资源)
- [AudioSource 音频源](#audiosource-音频源)
- [PAL 音频实现](#pal-音频实现)
- [技术原理](#技术原理)

---

## 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                    音频系统架构                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │            AudioSource (组件层)                   │   │
│  │  play() · pause() · stop() · volume · loop       │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │ 引用                              │
│                       ▼                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │            AudioClip (资源层)                      │   │
│  │  duration · sampleRate · channels                  │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │ 播放                             │
│                       ▼                                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │              PAL 音频层                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │   Web    │  │  Native  │  │ Minigame │       │   │
│  │  │WebAudio  │  │  OpenAL  │  │  WX Audio│       │   │
│  │  │  API     │  │  /ALSA   │  │  API     │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 核心文件

| 文件 | 路径 | 说明 |
|------|------|------|
| 音频资源 | `cocos/audio/audio-clip.ts` | AudioClip |
| 音频源 | `cocos/audio/audio-source.ts` | AudioSource |
| 音频管理 | `cocos/audio/audio-manager.ts` | AudioManager |
| PAL Web | `pal/audio/web/` | Web 平台音频 |
| PAL Native | `pal/audio/native/` | 原生平台音频 |
| PAL Minigame | `pal/audio/minigame/` | 小游戏平台 |

---

## AudioClip 音频资源

`AudioClip` 是音频数据容器，代表一段音频文件。

```typescript
// cocos/audio/audio-clip.ts

export class AudioClip extends Asset {
    duration: number;          // 音频时长（秒）
    sampleRate: number;        // 采样率（Hz）
    channels: number;          // 声道数（1=单声道, 2=立体声）

    // 原始音频数据（WebAudio 使用）
    _nativeAsset: AudioBuffer | HTMLAudioElement;
}
```

### 支持的音频格式

| 格式 | 说明 | 适用场景 |
|------|------|----------|
| `.mp3` | 有损压缩 | 背景音乐（体积小） |
| `.ogg` | 开源压缩 | Web 平台首选 |
| `.wav` | 无压缩 | 短音效（延迟低） |
| `.m4a` | AAC 编码 | iOS 兼容 |

---

## AudioSource 音频源

`AudioSource` 是音频播放组件，挂载到节点上控制音频播放。

### 核心 API

```typescript
// cocos/audio/audio-source.ts

export class AudioSource extends Component {
    clip: AudioClip;              // 当前音频资源
    loop: boolean;                // 是否循环
    volume: number;               // 音量 (0~1)
    pitch: number;                // 音调 (0.5~2.0)
    time: number;                 // 当前播放时间
    duration: number;             // 音频时长
    playing: boolean;             // 是否正在播放

    // ─── 播放控制 ───
    play(): void;                 // 播放
    pause(): void;                // 暂停
    stop(): void;                 // 停止（回到起点）
    playOneShot(clip, volume): void;  // 播放一次性音效

    // ─── 状态 ───
    get currentTime(): number;
    set currentTime(time: number);
}
```

### play vs playOneShot

| 特性 | play() | playOneShot() |
|------|--------|--------------|
| 替换当前音频 | 是 | 否 |
| 可叠加多个 | 否 | 是 |
| 适用 | 背景音乐 | 音效（射击、爆炸） |

```typescript
// 背景音乐（循环播放）
audioSource.clip = bgmClip;
audioSource.loop = true;
audioSource.play();

// 音效叠加（不中断背景音乐）
audioSource.playOneShot(shootClip, 1.0);
audioSource.playOneShot(explosionClip, 0.8);
```

---

## PAL 音频实现

PAL（Platform Abstraction Layer）为不同平台提供统一的音频接口。

### Web 平台

使用浏览器 Web Audio API：

```
AudioContext
    ├── AudioBufferSourceNode   ─── 播放音频数据
    ├── GainNode                ─── 音量控制
    ├── BiquadFilterNode        ─── 音效滤波
    └── destination             ─── 输出到扬声器
```

### 原生平台

使用 OpenAL（Open Audio Library）或平台原生 API：

```
ALDevice (音频设备)
    └── ALContext (音频上下文)
        ├── ALSource (音频源)
        └── ALBuffer (音频缓冲)
```

### 小游戏平台

使用微信小游戏 Audio API：

```
wx.createInnerAudioContext()
    ├── src      ─── 音频路径
    ├── volume   ─── 音量
    ├── loop     ─── 循环
    └── play/stop/pause
```

---

## 技术原理

### 1. 3D 空间音频

AudioSource 可以模拟 3D 空间中的声音衰减：

```
听者 (AudioListener) ─── 通常绑定到相机
    │
    │ 距离 d
    │
    ▼
音源 (AudioSource) ─── 绑定到发声物体

音量衰减模型:
  volume = 1 / (1 + rolloffFactor × (distance - referenceDistance))

  referenceDistance: 不衰减的距离
  rolloffFactor: 衰减速度
  maxDistance: 最大可听距离
```

### 2. 音频资源管理

```
加载流程:
  AssetManager.load("audio/bgm.mp3", AudioClip)
      │
      ├── Web: 解码为 AudioBuffer
      ├── Native: 加载原始数据
      └── Minigame: 下载到临时目录

播放时:
  Web: 创建 AudioBufferSourceNode → 连接 GainNode → 播放
  Native: 创建 ALSource → 绑定 ALBuffer → 播放
```

---

## 下一步

完成音频系统的学习后，继续学习 [04-输入系统](./04-input-system.md)。

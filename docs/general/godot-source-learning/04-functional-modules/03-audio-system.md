# 音频系统

Godot 的音频系统以 **AudioServer** 为核心，采用总线（Bus）架构管理音频混合和效果处理。音频系统支持 2D、3D 空间音频，提供多种效果器，并通过驱动层抽象跨平台音频输出。

---

## 目录

1. [音频系统架构](#1-音频系统架构)
2. [AudioServer](#2-audioserver)
3. [音频流与播放器](#3-音频流与播放器)
4. [音频总线与效果](#4-音频总线与效果)
5. [空间音频](#5-空间音频)
6. [音频驱动](#6-音频驱动)
7. [源码导航](#7-源码导航)

---

## 1. 音频系统架构

```
音频系统分层架构：

  ┌──────────────────────────────────────────────────────────┐
  │                   场景节点层 (Scene Nodes)                 │
  │                                                          │
  │  AudioStreamPlayer     （全局音频，如背景音乐）              │
  │  AudioStreamPlayer2D   （2D 位置音频，如 2D 音效）          │
  │  AudioStreamPlayer3D   （3D 空间音频，如 3D 音效）          │
  │  AudioListener2D       （2D 听者位置）                      │
  │  AudioListener3D       （3D 听者位置）                      │
  └────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────┐
  │                  AudioServer (核心层)                      │
  │                                                          │
  │  音频流注册 → 总线路由 → 效果处理 → 混音 → 输出驱动         │
  │                                                          │
  │  定义在: servers/audio_server.h                           │
  └────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
  ┌──────────────────────────────────────────────────────────┐
  │                  音频驱动层 (Audio Drivers)                 │
  │                                                          │
  │  WASAPI (Windows) | PulseAudio (Linux) | CoreAudio (macOS)│
  │  ALSA (Linux 备选) | Android Audio | iOS Audio | Dummy    │
  │                                                          │
  │  定义在: drivers/alsaudio/ drivers/coreaudio/ ...         │
  └──────────────────────────────────────────────────────────┘
```

---

## 2. AudioServer

`AudioServer`（`servers/audio_server.h`）是音频系统的单例管理器。

### 2.1 核心数据结构

```cpp
// servers/audio_server.h（简化）

class AudioServer : public Object {
    GDCLASS(AudioServer, Object);

    // 混音参数
    int mix_rate = 44100;                // 采样率
    SpeakerConfiguration speaker_mode;    // 声道配置（立体声/5.1/7.1）
    float channel_disable_threshold_db;   // 静音阈值
    int channel_disable_frames;           // 静音检测帧数

    // 音频总线
    Vector<Bus *> buses;                  // 总线数组

    struct Bus {
        StringName name;                  // 总线名称
        bool active = true;               // 是否活跃
        bool solo = false;                // 独奏
        bool mute = false;                // 静音
        float volume_db = 0.0;            // 音量 (dB)
        float pitch_scale = 1.0;          // 变调
        int send = -1;                    // 输出目标总线索引
        Vector<AudioEffect *> effects;    // 效果链
        Vector<AudioFrame> buffer;        // 混音缓冲区
    };

    // 音频流 voices
    // 每个 AudioStreamPlayer 在 Server 中对应一个 voice
    Vector<AudioStreamPlayback *> active_playbacks;
};
```

### 2.2 混音流程

```
AudioServer::mix_and_process() 混音流程：

  每帧（由音频线程驱动）：

  ┌──────────────────────────────────────────────────────┐
  │  1. 清空所有总线缓冲区                                  │
  │                                                      │
  │  2. 对每个活跃的 AudioStreamPlayback:                   │
  │     ├── playback->mix(buffer, frame_count)            │
  │     │   → 解码/读取 PCM 数据                           │
  │     │   → 填入临时缓冲区                               │
  │     │                                                │
  │     ├── 应用 volume 和 pitch_scale                    │
  │     ├── 累加到目标总线的缓冲区                          │
  │     └── 检测静音（低于阈值 → 自动禁用）                  │
  │                                                      │
  │  3. 处理总线效果链（从叶子总线到根总线）                   │
  │     for bus in buses (按依赖顺序):                     │
  │       ├── for effect in bus.effects:                  │
  │       │     effect->process(bus.buffer, frame_count)  │
  │       │                                              │
  │       ├── 应用 bus volume_db                          │
  │       └── 将缓冲区混入 send 目标总线                    │
  │                                                      │
  │  4. Master Bus 输出 → 驱动输出                          │
  │     driver->write_output(master_buffer)               │
  └──────────────────────────────────────────────────────┘

  音频帧结构：
  struct AudioFrame {
      float left;    // 左声道
      float right;   // 右声道
  };
```

---

## 3. 音频流与播放器

### 3.1 AudioStream 类层次

```
AudioStream 类层次：

  AudioStream (基类, scene/resources/audio_stream.h)
  │   ├── instantiate_playback() → AudioStreamPlayback*
  │   ├── get_length() → float
  │   └── 是 Resource 子类
  │
  ├── AudioStreamWAV           - WAV 音频文件
  │   ├── format: FORMAT_8_BIT / 16_BIT / IMA_ADPCM
  │   ├── data: PackedByteArray  (原始 PCM 数据)
  │   ├── mix_rate: int
  │   └── stereo: bool
  │
  ├── AudioStreamOggVorbis     - OGG Vorbis 音频
  │   ├── 内部使用 stb_vorbis 解码
  │   └── 支持流式播放（seek + 循环）
  │
  ├── AudioStreamMP3           - MP3 音频
  │   └── 使用 minimp3 解码
  │
  ├── AudioStreamGenerator     - 程序化音频生成
  │   └── 用户通过 push_buffer() 提供 PCM 数据
  │
  ├── AudioStreamMicrophone    - 麦克风输入
  │
  ├── AudioStreamRandomizer    - 随机音频选择器
  │   ├── pools[]: 音频池
  │   └── 随机/顺序播放策略
  │
  └── AudioStreamPlayback (播放实例)
      ├── mix(ptr, rate, frames)  // 核心：混音到输出缓冲区
      ├── play(), stop(), seek()
      └── 每个播放器创建一个实例
```

### 3.2 播放器类型

```
三种播放器对比：

  ┌────────────────────┬──────────────┬──────────────┬──────────────┐
  │      特性           │ Player       │ Player2D     │ Player3D     │
  ├────────────────────┼──────────────┼──────────────┼──────────────┤
  │  空间化             │ 无           │ 2D 距离衰减  │ 3D 完整空间化 │
  │  位置               │ 全局         │ 全局位置      │ 3D 世界位置  │
  │  多普勒             │ 无           │ 无           │ 有           │
  │  衰减模型           │ 无           │ 距离衰减      │ 多种模型      │
  │  典型用途           │ 背景音乐     │ UI 音效       │ 3D 环境音效  │
  │  总线路由           │ 可选总线     │ 可选总线      │ 可选总线      │
  │  多实例             │ 支持         │ 支持         │ 支持         │
  └────────────────────┴──────────────┴──────────────┴──────────────┘

  播放器生命周期：
  AudioStreamPlayer
    │
    ├── _ready()
    │   └── 向 AudioServer 注册 voice
    │
    ├── play()
    │   ├── stream->instantiate_playback() → playback
    │   ├── playback->play()
    │   └── AudioServer::start_playback(voice, playback, bus)
    │
    ├── _process()（AudioStreamPlayer3D）
    │   ├── 获取 Camera3D / AudioListener3D 位置
    │   ├── 计算 3D 衰减、多普勒
    │   ├── 应用空间化矩阵
    │   └── 更新 playback 参数
    │
    └── stop()
        ├── playback->stop()
        └── AudioServer::stop_playback(voice)
```

---

## 4. 音频总线与效果

### 4.1 总线路由

```
音频总线路由图：

  ┌───────────────────────────────────────────────────────────┐
  │                        AudioServer                        │
  │                                                           │
  │  Bus[0] "Master" (固定存在)                                │
  │  ├── Volume: 0 dB                                        │
  │  ├── Effects: [Limiter]                                  │
  │  └── Send: → 输出设备                                     │
  │          ▲                                                │
  │          │                                                │
  │  Bus[1] "Music"                                          │
  │  ├── Volume: -6 dB                                       │
  │  ├── Effects: [Chorus, Reverb]                           │
  │  └── Send: → Bus[0] "Master"                             │
  │          ▲                                                │
  │          │                                                │
  │  Bus[2] "SFX"                                            │
  │  ├── Volume: 0 dB                                        │
  │  ├── Effects: [EQ, Compressor]                           │
  │  └── Send: → Bus[0] "Master"                             │
  │          ▲                                                │
  │          │                                                │
  │  Bus[3] "Ambient"                                        │
  │  ├── Volume: -3 dB                                       │
  │  ├── Effects: [LowPass, Reverb]                          │
  │  └── Send: → Bus[0] "Master"                             │
  │          ▲                                                │
  │          │                                                │
  │  Bus[4] "Record"  (录音用)                                │
  │  └── Send: → Bus[0] "Master"                             │
  │                                                           │
  │  音频流输入:                                               │
  │  Player_Music ──► Bus "Music"                            │
  │  Player_SFX1  ──► Bus "SFX"                              │
  │  Player_Ambient ──► Bus "Ambient"                        │
  └───────────────────────────────────────────────────────────┘

  Send 规则：
  • 每个 Bus 只能发送到一个目标 Bus
  • 形成有向无环图（DAG），不允许循环
  • Master 是根节点，直接输出到音频驱动
```

### 4.2 音频效果类层次

```
AudioEffect 类层次：

  AudioEffect (基类)
  │   ├── instantiate() → AudioEffectInstance*
  │   └── 效果是 Resource（可保存/加载）
  │
  ├── AudioEffectAmplify         - 增益
  ├── AudioEffectReverb          - 混响
  │   ├── pre/late gain, room size, damping
  │   └── 基于 Freeverb 算法
  ├── AudioEffectChorus          - 合唱
  ├── AudioEffectDelay           - 延迟/回声
  ├── AudioEffectCompressor      - 压缩器
  │   ├── threshold, ratio, attack, release
  │   └── 动态范围压缩
  ├── AudioEffectLimiter         - 限幅器
  ├── AudioEffectEQ              - 均衡器基类
  │   ├── AudioEffectEQ6         - 6 频段
  │   ├── AudioEffectEQ10        - 10 频段
  │   └── AudioEffectEQ21        - 21 频段
  ├── AudioEffectFilter          - 滤波器基类
  │   ├── AudioEffectLowPassFilter   - 低通
  │   ├── AudioEffectHighPassFilter  - 高通
  │   ├── AudioEffectBandPassFilter  - 带通
  │   └── AudioEffectNotchFilter     - 陷波
  ├── AudioEffectDistortion      - 失真
  ├── AudioEffectStereoEnhance   - 立体声增强
  ├── AudioEffectPanner          - 声像控制
  ├── AudioEffectPhaser          - 相位器
  ├── AudioEffectPitchShift      - 变调
  ├── AudioEffectSpectrumAnalyzer - 频谱分析
  └── AudioEffectRecord          - 录音

  效果实例处理流程：
  AudioEffectInstance::process(AudioFrame *buffer, int frames)
    │
    ├── 读取输入 buffer（来自总线混音结果）
    ├── 应用 DSP 算法处理每一帧
    └── 写回 buffer（就地处理或写到输出缓冲）
```

---

## 5. 空间音频

### 5.1 AudioStreamPlayer3D 空间化

```
AudioStreamPlayer3D 空间化流程：

  每帧更新：

  1. 获取听者 (Listener) 信息
     ├── Camera3D / AudioListener3D 的全局变换
     └── 听者位置和朝向

  2. 计算声源到听者的空间关系
     ├── distance = source_pos.distance_to(listener_pos)
     ├── direction = (source_pos - listener_pos).normalized()
     └── relative_velocity = source_vel - listener_vel

  3. 距离衰减
     ├── 选择衰减模型 (AttenuationModel):
     │   ├── INVERSE:     gain = attenuation / (attenuation + distance)
     │   │                gain = max(gain, db_to_linear(max_db))
     │   ├── LINEAR:      gain = 1.0 - (distance / max_distance)
     │   │                gain = max(gain, 0.0)
     │   └── EXPONENTIAL: gain = pow(distance / min_distance, -exponent)
     │
     └── 应用 attenuation_filter_cutoff (高频随距离衰减)

  4. 多普勒效应
     ├── Doppler tracking 模式:
     │   ├── DOPPLER_TRACKING_DISABLED  - 不追踪
     │   ├── DOPPLER_TRACKING_IDLE_STEP - 在 idle 时步追踪
     │   └── DOPPLER_TRACKING_PHYSICS_STEP - 在物理步追踪
     │
     └── pitch_scale *= doppler_factor
         基于相对速度计算频率偏移

  5. 声像 (Panning)
     ├── 将 3D 方向投影到听者的局部坐标系
     ├── 计算左右声道的增益
     └── 生成 AudioFrame { left_gain, right_gain }

  6. 应用到 AudioServer voice
     ├── 设置 volume_db（衰减后）
     ├── 设置 pitch_scale（多普勒后）
     └── 设置 panning
```

---

## 6. 音频驱动

```
音频驱动架构：

  AudioDriver (基类, drivers/audio_driver.h)
  │   ├── start() → int           // 启动驱动
  │   ├── stop()                  // 停止
  │   ├── write_output(buffer)    // 写入音频数据
  │   └── audio_thread_func()     // 音频线程入口
  │
  ├── AudioDriverWASAPI (Windows)
  │   └── 使用 Windows Audio Session API
  │
  ├── AudioDriverPulseAudio (Linux)
  │   └── 使用 PulseAudio / PipeWire (兼容)
  │
  ├── AudioDriverALSA (Linux 备选)
  │   └── 直接使用 ALSA (Advanced Linux Sound Architecture)
  │
  ├── AudioDriverCoreAudio (macOS/iOS)
  │   └── 使用 CoreAudio / AudioUnit
  │
  ├── AudioDriverAndroid (Android)
  │   └── 使用 OpenSL ES / AAudio
  │
  └── AudioDriverDummy (无输出)
      └── 用于 headless 模式和测试

  音频线程模型：
  ┌─────────────────────────────────────────────────────┐
  │                                                     │
  │  主线程                  音频线程 (实时)               │
  │  │                      │                           │
  │  ├── 更新场景节点         │                           │
  │  ├── 设置播放参数 ───────►├── AudioServer::mix()      │
  │  │   (线程安全队列)       │   ├── 处理所有播放器       │
  │  │                      │   ├── 混音到总线           │
  │  │                      │   ├── 应用效果链           │
  │  │                      │   └── 写入输出缓冲区       │
  │  │                      │                           │
  │  │                      └── 驱动回调 → 输出设备       │
  │                                                     │
  │  注意：音频线程是实时线程，不能有锁、内存分配等阻塞操作    │
  │  参数传递通过无锁队列实现                                │
  └─────────────────────────────────────────────────────┘
```

---

## 7. 源码导航

### 关键文件一览

| 文件 | 路径 | 说明 |
|------|------|------|
| AudioServer | `servers/audio_server.h/cpp` | 音频服务器核心 |
| AudioStream | `scene/resources/audio_stream.h` | 音频流基类 |
| AudioStreamWAV | `scene/resources/audio_stream_wav.h` | WAV 格式 |
| AudioStreamOggVorbis | `modules/vorbis/audio_stream_ogg_vorbis.h` | OGG 格式 |
| AudioStreamMP3 | `modules/minimp3/audio_stream_mp3.h` | MP3 格式 |
| AudioStreamPlayer | `scene/audio/audio_stream_player.h` | 全局播放器 |
| AudioStreamPlayer2D | `scene/audio/audio_stream_player_2d.h` | 2D 播放器 |
| AudioStreamPlayer3D | `scene/audio/audio_stream_player_3d.h` | 3D 播放器 |
| AudioEffect | `scene/resources/audio_effect.h` | 效果基类 |
| AudioEffectReverb | `scene/resources/audio_effect_reverb.h` | 混响效果 |
| AudioBus | `servers/audio_server.h` (Bus struct) | 总线定义 |
| AudioDriver | `drivers/audio_driver.h` | 驱动基类 |
| AudioDriverWASAPI | `drivers/wasapi/audio_driver_wasapi.h` | Windows 驱动 |
| AudioDriverPulseAudio | `drivers/pulseaudio/audio_driver_pulseaudio.h` | Linux 驱动 |
| AudioDriverCoreAudio | `drivers/coreaudio/audio_driver_coreaudio.h` | macOS 驱动 |

### 推荐阅读顺序

```
1. servers/audio_server.h
   → 理解 AudioServer 的整体架构，总线结构

2. servers/audio_server.cpp
   → 跟踪 mix_and_process() 方法

3. scene/resources/audio_stream.h
   → 理解音频流基类接口

4. scene/audio/audio_stream_player.h
   → 理解播放器如何与 AudioServer 交互

5. scene/audio/audio_stream_player_3d.h
   → 理解 3D 空间化的实现

6. scene/resources/audio_effect.h
   → 理解效果系统接口

7. drivers/audio_driver.h
   → 理解驱动抽象层
```

---

## 下一步

- [04-输入系统](./04-input-system.md) - 深入了解输入事件传播
- [返回目录](./README.md)

# 第8周: 动画系统

> **学习目标**: 学习角色动画和骨骼动画
>
> **时间安排**: 2026-04-15 ~ 2026-04-22
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 骨骼动画原理
- [ ] 骨骼层次结构
- [ ] 关节和骨骼
- [ ] 蒙皮算法
- [ ] 矩阵调色板

### 2. 动画数据
- [ ] 动画片段（Animation Clip）
- [ ] 关键帧
- [ ] 插值方法
- [ ] 动画压缩

### 3. 动画混合
- [ ] 线性插值（LERP）
- [ ] 球面插值（SLERP）
- [ ] 动画混合树
- [ ] Additive Animation

### 4. 动画状态机
- [ ] 状态定义
- [ ] 转换条件
- [ ] 混合空间（Blend Space）
- [ ] 状态过渡

### 5. 实践任务
- [ ] 导入带动画的模型
- [ ] 播放动画片段
- [ ] 配置动画混合
- [ ] 创建简单状态机

---

## 核心知识点

### 骨骼结构

```cpp
// 骨骼
struct Bone {
    std::string name;
    int parent_index = -1;           // 父骨骼索引
    vec3 position{0, 0, 0};          // 局部位置
    quat rotation{1, 0, 0, 0};       // 局部旋转（四元数）
    vec3 scale{1, 1, 1};             // 局部缩放

    mat4 inverse_bind_pose;          // 逆绑定姿态矩阵（用于蒙皮）
};

// 骨架
class Skeleton {
public:
    void addBone(const Bone& bone) {
        m_bones.push_back(bone);
        m_bone_map[bone.name] = m_bones.size() - 1;
    }

    int getBoneIndex(const std::string& name) const {
        auto it = m_bone_map.find(name);
        return it != m_bone_map.end() ? it->second : -1;
    }

    const Bone& getBone(int index) const {
        return m_bones[index];
    }

    size_t getBoneCount() const {
        return m_bones.size();
    }

    // 计算骨骼的世界变换矩阵
    std::vector<mat4> calculateBoneMatrices() const {
        std::vector<mat4> bone_matrices(m_bones.size());

        for (size_t i = 0; i < m_bones.size(); i++) {
            const Bone& bone = m_bones[i];

            // 计算局部变换矩阵
            mat4 local_matrix = translate(bone.position) *
                               toMat4(bone.rotation) *
                               scale(bone.scale);

            // 如果有父骨骼，乘以父骨骼的矩阵
            if (bone.parent_index >= 0) {
                bone_matrices[i] = bone_matrices[bone.parent_index] * local_matrix;
            } else {
                bone_matrices[i] = local_matrix;
            }
        }

        return bone_matrices;
    }

private:
    std::vector<Bone> m_bones;
    std::unordered_map<std::string, int> m_bone_map;
};
```

### 动画片段

```cpp
// 关键帧
struct BoneKeyFrame {
    float time;
    vec3 position;
    quat rotation;
    vec3 scale;
};

// 骨骼动画轨道
struct BoneTrack {
    int bone_index;
    std::vector<BoneKeyFrame> keyframes;
};

// 动画片段
class AnimationClip {
public:
    AnimationClip(std::string name, float duration)
        : m_name(name), m_duration(duration) {}

    void addBoneTrack(const BoneTrack& track) {
        m_bone_tracks.push_back(track);
    }

    // 采样动画（在给定时间获取骨骼姿态）
    std::vector<mat4> sample(float time, const Skeleton& skeleton) const {
        // 循环播放
        time = fmod(time, m_duration);

        std::vector<mat4> bone_matrices(skeleton.getBoneCount());

        for (const auto& track : m_bone_tracks) {
            // 查找当前时间的前后关键帧
            const BoneKeyFrame* prev_key = nullptr;
            const BoneKeyFrame* next_key = nullptr;

            for (const auto& keyframe : track.keyframes) {
                if (keyframe.time <= time) {
                    prev_key = &keyframe;
                } else {
                    next_key = &keyframe;
                    break;
                }
            }

            // 插值计算
            vec3 position, scale;
            quat rotation;

            if (prev_key && next_key) {
                float t = (time - prev_key->time) / (next_key->time - prev_key->time);
                position = mix(prev_key->position, next_key->position, t);
                rotation = slerp(prev_key->rotation, next_key->rotation, t);
                scale = mix(prev_key->scale, next_key->scale, t);
            } else if (prev_key) {
                position = prev_key->position;
                rotation = prev_key->rotation;
                scale = prev_key->scale;
            } else if (next_key) {
                position = next_key->position;
                rotation = next_key->rotation;
                scale = next_key->scale;
            } else {
                position = vec3(0);
                rotation = quat(1, 0, 0, 0);
                scale = vec3(1);
            }

            // 计算最终矩阵
            mat4 local_matrix = translate(position) * toMat4(rotation) * scale(scale);
            bone_matrices[track.bone_index] = local_matrix;
        }

        return bone_matrices;
    }

    float getDuration() const { return m_duration; }
    const std::string& getName() const { return m_name; }

private:
    std::string m_name;
    float m_duration;
    std::vector<BoneTrack> m_bone_tracks;
};
```

### 蒙皮（Skinning）

```cpp
// 顶点权重
struct VertexWeight {
    int bone_index;
    float weight;
};

// 顶点骨骼数据
struct VertexBoneData {
    std::array<VertexWeight, 4> weights;  // 最多4个骨骼影响一个顶点
    int num_weights = 0;

    void addWeight(int bone_index, float weight) {
        if (num_weights < 4) {
            weights[num_weights] = {bone_index, weight};
            num_weights++;
        }
    }

    void normalize() {
        float total = 0;
        for (int i = 0; i < num_weights; i++) {
            total += weights[i].weight;
        }
        for (int i = 0; i < num_weights; i++) {
            weights[i].weight /= total;
        }
    }
};

// 蒙皮网格
class SkinnedMesh {
public:
    SkinnedMesh(const std::vector<vec3>& positions,
                const std::vector<VertexBoneData>& bone_data,
                const std::vector<uint32_t>& indices)
        : m_positions(positions), m_bone_data(bone_data), m_indices(indices) {}

    // 计算蒙皮后的顶点位置
    std::vector<vec3> skinVertices(const std::vector<mat4>& bone_matrices) const {
        std::vector<vec3> skinned_positions(m_positions.size());

        for (size_t i = 0; i < m_positions.size(); i++) {
            vec3 skinned_pos(0);

            for (int j = 0; j < m_bone_data[i].num_weights; j++) {
                const auto& weight = m_bone_data[i].weights[j];
                const mat4& bone_matrix = bone_matrices[weight.bone_index];

                // 应用骨骼矩阵
                vec4 pos = bone_matrix * vec4(m_positions[i], 1.0f);
                skinned_pos += vec3(pos) * weight.weight;
            }

            skinned_positions[i] = skinned_pos;
        }

        return skinned_positions;
    }

    // 上传蒙皮后的数据到GPU
    void uploadToGPU(const std::vector<mat4>& bone_matrices) {
        auto skinned_positions = skinVertices(bone_matrices);
        auto skinned_normals = skinNormals(bone_matrices);

        // 更新顶点缓冲
        m_vertex_buffer->updateData(skinned_positions.data(),
                                    skinned_positions.size() * sizeof(vec3), 0);
    }

private:
    std::vector<vec3> m_positions;
    std::vector<VertexBoneData> m_bone_data;
    std::vector<uint32_t> m_indices;
    std::shared_ptr<Buffer> m_vertex_buffer;

    std::vector<vec3> skinNormals(const std::vector<mat4>& bone_matrices) const {
        // 类似顶点蒙皮，但对法线使用3x3矩阵（忽略平移）
        // ...
    }
};
```

### 动画混合

```cpp
// 动画混合器
class AnimationMixer {
public:
    // 混合两个动画
    static std::vector<mat4> blend(
        const std::vector<mat4>& pose_a,
        const std::vector<mat4>& pose_b,
        float alpha)  // 0 = 全A, 1 = 全B
    {
        std::vector<mat4> blended(pose_a.size());

        for (size_t i = 0; i < pose_a.size(); i++) {
            // 提取TRS
            vec3 pos_a, scale_a;
            quat rot_a;
            decompose(pose_a[i], pos_a, rot_a, scale_a);

            vec3 pos_b, scale_b;
            quat rot_b;
            decompose(pose_b[i], pos_b, rot_b, scale_b);

            // 插值
            vec3 pos = mix(pos_a, pos_b, alpha);
            quat rot = slerp(rot_a, rot_b, alpha);
            vec3 scale = mix(scale_a, scale_b, alpha);

            // 重组矩阵
            blended[i] = translate(pos) * toMat4(rot) * scale(scale);
        }

        return blended;
    }

    // Additive动画混合
    static std::vector<mat4> blendAdditive(
        const std::vector<mat4>& base_pose,
        const std::vector<mat4>& additive_pose)
    {
        std::vector<mat4> result(base_pose.size());

        for (size_t i = 0; i < base_pose.size(); i++) {
            vec3 base_pos, base_scale;
            quat base_rot;
            decompose(base_pose[i], base_pos, base_rot, base_scale);

            vec3 add_pos, add_scale;
            quat add_rot;
            decompose(additive_pose[i], add_pos, add_rot, add_scale);

            // Additive: 加上偏移
            vec3 pos = base_pos + add_pos;
            quat rot = base_rot * add_rot;
            vec3 scale = base_scale * add_scale;

            result[i] = translate(pos) * toMat4(rot) * scale(scale);
        }

        return result;
    }

private:
    static void decompose(const mat4& m, vec3& pos, quat& rot, vec3& scale) {
        // 提取平移
        pos = vec3(m[3]);

        // 提取缩放
        scale.x = length(vec3(m[0]));
        scale.y = length(vec3(m[1]));
        scale.z = length(vec3(m[2]));

        // 提取旋转
        mat3 rot_mat;
        rot_mat[0] = vec3(m[0]) / scale.x;
        rot_mat[1] = vec3(m[1]) / scale.y;
        rot_mat[2] = vec3(m[2]) / scale.z;
        rot = quat_cast(rot_mat);
    }
};
```

### 动画状态机

```cpp
// 动画状态
class AnimationState {
public:
    AnimationState(std::string name, std::shared_ptr<AnimationClip> clip)
        : m_name(name), m_clip(clip) {}

    void update(float delta_time) {
        m_time += delta_time * m_speed;
        if (m_time > m_clip->getDuration()) {
            if (m_looping) {
                m_time = fmod(m_time, m_clip->getDuration());
            } else {
                m_time = m_clip->getDuration();
                m_finished = true;
            }
        }
    }

    std::vector<mat4> getPose(const Skeleton& skeleton) const {
        return m_clip->sample(m_time, skeleton);
    }

    void setLooping(bool loop) { m_looping = loop; }
    void setSpeed(float speed) { m_speed = speed; }
    bool isFinished() const { return m_finished; }

private:
    std::string m_name;
    std::shared_ptr<AnimationClip> m_clip;
    float m_time = 0;
    float m_speed = 1.0f;
    bool m_looping = true;
    bool m_finished = false;
};

// 状态转换
class StateTransition {
public:
    std::string target_state;
    float duration;
    std::function<bool()> condition;

    bool canTransition() const {
        return condition();
    }
};

// 动画状态机
class AnimationStateMachine {
public:
    void addState(std::shared_ptr<AnimationState> state) {
        m_states[state->getName()] = state;
        if (!m_current_state) {
            m_current_state = state;
        }
    }

    void addTransition(const std::string& from_state,
                      const std::string& to_state,
                      float duration,
                      std::function<bool()> condition) {
        auto transition = std::make_shared<StateTransition>();
        transition->target_state = to_state;
        transition->duration = duration;
        transition->condition = condition;

        m_transitions[from_state].push_back(transition);
    }

    void update(float delta_time, const Skeleton& skeleton) {
        // 检查状态转换
        if (m_current_state && !m_is_transitioning) {
            for (auto& transition : m_transitions[m_current_state->getName()]) {
                if (transition->canTransition()) {
                    startTransition(transition->target_state, transition->duration);
                    break;
                }
            }
        }

        // 更新状态
        if (m_current_state) {
            m_current_state->update(delta_time);
        }

        // 更新过渡
        if (m_is_transitioning) {
            m_transition_time += delta_time;
            float t = m_transition_time / m_transition_duration;

            if (t >= 1.0f) {
                // 过渡完成
                m_current_state = m_next_state;
                m_next_state.reset();
                m_is_transitioning = false;
            } else {
                // 混合两个状态
                if (m_next_state) {
                    m_next_state->update(delta_time);
                }
            }
        }
    }

    std::vector<mat4> getCurrentPose(const Skeleton& skeleton) {
        if (!m_is_transitioning || !m_next_state) {
            return m_current_state->getPose(skeleton);
        }

        // 混合两个状态
        auto pose_a = m_current_state->getPose(skeleton);
        auto pose_b = m_next_state->getPose(skeleton);
        float t = m_transition_time / m_transition_duration;

        return AnimationMixer::blend(pose_a, pose_b, t);
    }

private:
    void startTransition(const std::string& target_state_name, float duration) {
        m_next_state = m_states[target_state_name];
        m_transition_duration = duration;
        m_transition_time = 0;
        m_is_transitioning = true;
    }

    std::unordered_map<std::string, std::shared_ptr<AnimationState>> m_states;
    std::shared_ptr<AnimationState> m_current_state;
    std::shared_ptr<AnimationState> m_next_state;

    std::unordered_map<std::string, std::vector<std::shared_ptr<StateTransition>>> m_transitions;

    bool m_is_transitioning = false;
    float m_transition_time = 0;
    float m_transition_duration = 0;
};
```

---

## 关键目录

```
runtime/function/animation/
├── animation_system.h       # 动画系统主类
├── skeleton.h               # 骨架定义
├── animation_clip.h         # 动画片段
├── animation_mixer.h        # 动画混合器
├── animation_state_machine.h # 动画状态机
└── skinning.h               # 蒙皮算法
```

---

## 实践任务

### 任务1: 导入带动画的模型

```cpp
// 加载带动画的GLTF模型
tinygltf::Model model;
LoadGLTF(model, "character.gltf");

// 提取骨架
auto skeleton = extractSkeleton(model);

// 提取动画
std::vector<std::shared_ptr<AnimationClip>> animations;
for (auto& gltf_anim : model.animations) {
    auto anim_clip = extractAnimationClip(gltf_anim, skeleton);
    animations.push_back(anim_clip);
}

// 创建蒙皮网格
auto skinned_mesh = extractSkinnedMesh(model);
```

### 任务2: 播放动画

```cpp
// 动画组件
class AnimationComponent {
public:
    void play(const std::string& anim_name) {
        if (auto* clip = getAnimationClip(anim_name)) {
            m_current_clip = clip;
            m_time = 0;
        }
    }

    void update(float delta_time) {
        if (!m_current_clip) return;

        m_time += delta_time * m_speed;

        // 采样动画
        m_current_pose = m_current_clip->sample(m_time, *m_skeleton);

        // 蒙皮
        m_skinned_mesh->uploadToGPU(m_current_pose);
    }

private:
    Skeleton* m_skeleton;
    SkinnedMesh* m_skinned_mesh;
    AnimationClip* m_current_clip = nullptr;
    float m_time = 0;
    float m_speed = 1.0f;
    std::vector<mat4> m_current_pose;
};
```

### 任务3: 创建状态机

```cpp
// 创建角色动画状态机
auto state_machine = std::make_shared<AnimationStateMachine>();

// 添加状态
auto idle_state = std::make_shared<AnimationState>("Idle", idle_clip);
idle_state->setLooping(true);
state_machine->addState(idle_state);

auto run_state = std::make_shared<AnimationState>("Run", run_clip);
run_state->setLooping(true);
state_machine->addState(run_state);

auto jump_state = std::make_shared<AnimationState>("Jump", jump_clip);
jump_state->setLooping(false);
state_machine->addState(jump_state);

// 添加转换
state_machine->addTransition("Idle", "Run", 0.2f, []() {
    return isMoving();
});

state_machine->addTransition("Run", "Idle", 0.2f, []() {
    return !isMoving();
});

state_machine->addTransition("Idle", "Jump", 0.1f, []() {
    return isJumpPressed();
});

state_machine->addTransition("Jump", "Idle", 0.1f, []() {
    return isOnGround();
});
```

---

## 验证标准

- [ ] 理解骨骼动画原理
  - [ ] 知道骨骼层次结构
  - [ ] 理解蒙皮算法
  - [ ] 能计算矩阵调色板

- [ ] 掌握动画混合
  - [ ] 能实现LERP/SLERP
  - [ ] 理解动画混合树
  - [ ] 能使用Additive动画

- [ ] 理解状态机
  - [ ] 能设计状态转换
  - [ ] 知道如何平滑过渡

- [ ] 实践完成
  - [ ] 导入动画模型
  - [ ] 播放动画
  - [ ] 配置混合

---

## 下周预告

第9周: 资源管理系统 - 资源加载、缓存与热更新

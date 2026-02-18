# 第12周: 编辑器架构

> **学习目标**: 理解游戏引擎编辑器的设计
>
> **时间安排**: 2026-05-17 ~ 2026-05-24
> **学习时长**: 每天3-4小时

---

## 本周学习重点

### 1. 编辑器架构
- [ ] 编辑器-运行时分离
- [ ] 反射系统应用
- [ ] 序列化系统
- [ ] 撤销/重做系统

### 2. 编辑器工具
- [ ] 资源浏览器
- [ ] 属性编辑器
- [ ] 场景层级
- [ ] 菜单和工具栏

### 3. 实践任务
- [ ] 熟悉编辑器界面
- [ ] 使用各编辑工具
- [ ] 理解编辑器-运行时通信

---

## 核心知识点

### 编辑器架构

```cpp
// 编辑器核心
class EditorCore {
public:
    void initialize() {
        // 初始化编辑器UI系统
        m_ui_system = std::make_unique<EditorUISystem>();

        // 创建面板
        createPanels();

        // 创建菜单
        createMenus();
    }

    void update() {
        // 更新各个面板
        for (auto& panel : m_panels) {
            panel->update();
        }

        // 渲染编辑器UI
        m_ui_system->render();
    }

    void shutdown() {
        m_panels.clear();
        m_ui_system.reset();
    }

private:
    void createPanels() {
        // 资源浏览器
        auto asset_browser = std::make_unique<AssetBrowserPanel>();
        asset_browser->setRootPath("assets/");
        m_panels.push_back(std::move(asset_browser));

        // 属性编辑器
        auto property_editor = std::make_unique<PropertyEditorPanel>();
        m_panels.push_back(std::move(property_editor));

        // 场景层级
        auto scene_hierarchy = std::make_unique<SceneHierarchyPanel>();
        scene_hierarchy->setWorld(m_world);
        m_panels.push_back(std::move(scene_hierarchy));

        // 控制台
        auto console = std::make_unique<ConsolePanel>();
        m_panels.push_back(std::move(console));

        // 性能分析器
        auto profiler = std::make_unique<ProfilerPanel>();
        m_panels.push_back(std::move(profiler));
    }

    void createMenus() {
        // 文件菜单
        auto file_menu = m_ui_system->addMenu("File");
        file_menu->addItem("New Scene", [this]() { newScene(); });
        file_menu->addItem("Open Scene", [this]() { openScene(); });
        file_menu->addItem("Save Scene", [this]() { saveScene(); });
        file_menu->addItem("Exit", [this]() { shutdown(); });

        // 编辑菜单
        auto edit_menu = m_ui_system->addMenu("Edit");
        edit_menu->addItem("Undo", [this]() { undo(); }, "Ctrl+Z");
        edit_menu->addItem("Redo", [this]() { redo(); }, "Ctrl+Y");
        edit_menu->addItem("Copy", [this]() { copy(); }, "Ctrl+C");
        edit_menu->addItem("Paste", [this]() { paste(); }, "Ctrl+V");
    }

    std::unique_ptr<EditorUISystem> m_ui_system;
    std::vector<std::unique_ptr<EditorPanel>> m_panels;
    World* m_world = nullptr;
};
```

### 编辑器面板

```cpp
// 面板基类
class EditorPanel {
public:
    EditorPanel(std::string name) : m_name(name) {}

    virtual ~EditorPanel() = default;

    virtual void update() {}
    virtual void render() = 0;

    const std::string& getName() const {
        return m_name;
    }

    void setVisible(bool visible) {
        m_visible = visible;
    }

    bool isVisible() const {
        return m_visible;
    }

protected:
    std::string m_name;
    bool m_visible = true;
};

// 场景层级面板
class SceneHierarchyPanel : public EditorPanel {
public:
    SceneHierarchyPanel() : EditorPanel("Hierarchy") {}

    void setWorld(World* world) {
        m_world = world;
    }

    void render() override {
        if (ImGui::Begin(m_name.c_str(), &m_visible)) {
            // 根节点
            if (m_world) {
                drawEntityTree(m_world->getRootEntity());
            }
        }
        ImGui::End();
    }

private:
    void drawEntityTree(Entity entity) {
        ImGuiTreeNodeFlags flags = ImGuiTreeNodeFlags_OpenOnArrow;
        if (entity == m_selected_entity) {
            flags |= ImGuiTreeNodeFlags_Selected;
        }

        // 检查是否有子节点
        bool has_children = entity.getChildren().size() > 0;
        if (!has_children) {
            flags |= ImGuiTreeNodeFlags_Leaf | ImGuiTreeNodeFlags_NoTreePushOnOpen;
        }

        bool node_open = ImGui::TreeNodeEx(entity.getName().c_str(), flags);

        // 选择处理
        if (ImGui::IsItemClicked()) {
            m_selected_entity = entity;
        }

        // 右键菜单
        if (ImGui::BeginPopupContextItem()) {
            if (ImGui::MenuItem("Add Child")) {
                entity.createChild("New Entity");
            }
            if (ImGui::MenuItem("Delete")) {
                entity.destroy();
            }
            ImGui::EndPopup();
        }

        // 递归绘制子节点
        if (has_children && node_open) {
            for (auto& child : entity.getChildren()) {
                drawEntityTree(child);
            }
            ImGui::TreePop();
        }
    }

    World* m_world = nullptr;
    Entity m_selected_entity;
};

// 属性编辑器面板
class PropertyEditorPanel : public EditorPanel {
public:
    PropertyEditorPanel() : EditorPanel("Inspector") {}

    void setSelectedEntity(Entity entity) {
        m_selected_entity = entity;
    }

    void render() override {
        if (ImGui::Begin(m_name.c_str(), &m_visible)) {
            if (m_selected_entity.isValid()) {
                // 名称
                char name_buffer[256];
                strcpy(name_buffer, m_selected_entity.getName().c_str());
                if (ImGui::InputText("Name", name_buffer, sizeof(name_buffer))) {
                    m_selected_entity.setName(name_buffer);
                }

                ImGui::Separator();

                // 组件列表
                drawComponents();

                ImGui::Separator();

                // 添加组件按钮
                if (ImGui::Button("Add Component")) {
                    ImGui::OpenPopup("AddComponentPopup");
                }

                if (ImGui::BeginPopup("AddComponentPopup")) {
                    if (ImGui::MenuItem("Transform")) {
                        m_selected_entity.addComponent<TransformComponent>();
                    }
                    if (ImGui::MenuItem("Mesh")) {
                        m_selected_entity.addComponent<MeshComponent>();
                    }
                    if (ImGui::MenuItem("Light")) {
                        m_selected_entity.addComponent<LightComponent>();
                    }
                    ImGui::EndPopup();
                }
            }
        }
        ImGui::End();
    }

private:
    void drawComponents() {
        // Transform组件
        if (auto* transform = m_selected_entity.getComponent<TransformComponent>()) {
            if (ImGui::CollapsingHeader("Transform", ImGuiTreeNodeFlags_DefaultOpen)) {
                vec3 pos = transform->getPosition();
                if (ImGui::DragFloat3("Position", &pos.x, 0.01f)) {
                    transform->setPosition(pos);
                }

                vec3 rotation = degrees(eulerAngles(transform->getRotation()));
                if (ImGui::DragFloat3("Rotation", &rotation.x, 1.0f)) {
                    transform->setRotation(radians(rotation));
                }

                vec3 scale = transform->getScale();
                if (ImGui::DragFloat3("Scale", &scale.x, 0.01f)) {
                    transform->setScale(scale);
                }
            }
        }

        // Mesh组件
        if (auto* mesh = m_selected_entity.getComponent<MeshComponent>()) {
            if (ImGui::CollapsingHeader("Mesh")) {
                // 显示网格信息
                ImGui::Text("Vertices: %d", mesh->getVertexCount());
                ImGui::Text("Triangles: %d", mesh->getTriangleCount());

                // 材质选择
                if (ImGui::BeginCombo("Material", mesh->getMaterial()->getName().c_str())) {
                    for (auto& material : MaterialManager::instance().getAllMaterials()) {
                        bool is_selected = (material == mesh->getMaterial());
                        if (ImGui::Selectable(material->getName().c_str(), is_selected)) {
                            mesh->setMaterial(material);
                        }
                    }
                    ImGui::EndCombo();
                }
            }
        }

        // Light组件
        if (auto* light = m_selected_entity.getComponent<LightComponent>()) {
            if (ImGui::CollapsingHeader("Light")) {
                // 光照类型
                int type = static_cast<int>(light->getType());
                const char* types[] = {"Directional", "Point", "Spot"};
                if (ImGui::Combo("Type", &type, types, 3)) {
                    light->setType(static_cast<LightComponent::Type>(type));
                }

                // 颜色
                vec3 color = light->getColor();
                if (ImGui::ColorEdit3("Color", &color.x)) {
                    light->setColor(color);
                }

                // 强度
                float intensity = light->getIntensity();
                if (ImGui::DragFloat("Intensity", &intensity, 0.1f, 0.0f, 10.0f)) {
                    light->setIntensity(intensity);
                }
            }
        }
    }

    Entity m_selected_entity;
};

// 资源浏览器面板
class AssetBrowserPanel : public EditorPanel {
public:
    AssetBrowserPanel() : EditorPanel("Asset Browser") {
        m_current_path = "assets/";
    }

    void setRootPath(const std::string& path) {
        m_root_path = path;
        m_current_path = path;
    }

    void render() override {
        if (ImGui::Begin(m_name.c_str(), &m_visible)) {
            // 路径导航
            drawBreadcrumb();

            ImGui::Separator();

            // 文件列表
            drawFileList();

            ImGui::Separator();

            // 预览窗口
            drawPreview();
        }
        ImGui::End();
    }

private:
    void drawBreadcrumb() {
        // 显示当前路径
        ImGui::Text("Path: %s", m_current_path.c_str());

        // 上级目录按钮
        if (m_current_path != m_root_path) {
            if (ImGui::Button("Up")) {
                goToParentDirectory();
            }
            ImGui::SameLine();
        }
    }

    void drawFileList() {
        // 列出目录和文件
        for (const auto& entry : std::filesystem::directory_iterator(m_current_path)) {
            std::string filename = entry.path().filename().string();
            bool is_directory = entry.is_directory();

            ImGui::PushID(filename.c_str());

            // 图标
            ImGui::Text(is_directory ? "[DIR]" : "[FILE]");
            ImGui::SameLine();

            // 名称
            if (ImGui::Selectable(filename.c_str(), false,
                                 ImGuiSelectableFlags_AllowDoubleClick)) {
                if (is_directory && ImGui::IsMouseDoubleClicked(0)) {
                    m_current_path = entry.path().string();
                } else if (!is_directory && ImGui::IsMouseDoubleClicked(0)) {
                    openAsset(entry.path().string());
                }
            }

            ImGui::PopID();
        }
    }

    void drawPreview() {
        if (m_selected_asset.empty()) {
            ImGui::Text("No asset selected");
            return;
        }

        ImGui::Text("Preview: %s", m_selected_asset.c_str());

        // 根据类型显示预览
        std::string ext = std::filesystem::path(m_selected_asset).extension().string();

        if (ext == ".png" || ext == ".jpg") {
            // 显示纹理预览
            if (auto* texture = ResourceManager::instance().load<TextureResource>(m_selected_asset)) {
                ImGui::Image((ImTextureID)texture->getTextureID(), ImVec2(200, 200));
            }
        } else if (ext == ".mat") {
            // 显示材质属性
            if (auto* material = ResourceManager::instance().load<MaterialResource>(m_selected_asset)) {
                ImGui::Text("Shader: %s", material->getShader()->getName().c_str());
                // ... 更多属性
            }
        }
    }

    void goToParentDirectory() {
        m_current_path = std::filesystem::path(m_current_path).parent_path().string();
    }

    void openAsset(const std::string& path) {
        m_selected_asset = path;
    }

    std::string m_root_path;
    std::string m_current_path;
    std::string m_selected_asset;
};
```

### 撤销/重做系统

```cpp
// 命令基类
class ICommand {
public:
    virtual ~ICommand() = default;

    virtual void execute() = 0;
    virtual void undo() = 0;
    virtual bool canMergeWith(const ICommand* other) const {
        return false;
    }

    virtual void mergeWith(const ICommand* other) {}
};

// 移动实体命令
class MoveEntityCommand : public ICommand {
public:
    MoveEntityCommand(Entity entity, const vec3& new_position)
        : m_entity(entity), m_new_position(new_position) {
        m_old_position = entity.getPosition();
    }

    void execute() override {
        m_entity.setPosition(m_new_position);
    }

    void undo() override {
        m_entity.setPosition(m_old_position);
    }

    bool canMergeWith(const ICommand* other) const override {
        const auto* other_move = dynamic_cast<const MoveEntityCommand*>(other);
        return other_move && other_move->m_entity == m_entity;
    }

    void mergeWith(const ICommand* other) override {
        const auto* other_move = static_cast<const MoveEntityCommand*>(other);
        m_new_position = other_move->m_new_position;
    }

private:
    Entity m_entity;
    vec3 m_old_position;
    vec3 m_new_position;
};

// 删除实体命令
class DeleteEntityCommand : public ICommand {
public:
    DeleteEntityCommand(World* world, Entity entity)
        : m_world(world), m_entity(entity) {}

    void execute() override {
        // 保存实体数据用于撤销
        serializeEntity();

        m_entity.destroy();
    }

    void undo() override {
        // 反序列化恢复实体
        deserializeEntity();
    }

private:
    World* m_world;
    Entity m_entity;
    nlohmann::json m_entity_data;

    void serializeEntity() {
        // 序列化实体到JSON
        m_entity_data = serializeEntity(m_entity);
    }

    void deserializeEntity() {
        // 从JSON恢复实体
        m_entity = deserializeEntity(m_world, m_entity_data);
    }
};

// 命令管理器（撤销/重做）
class CommandManager {
public:
    static CommandManager& instance() {
        static CommandManager inst;
        return inst;
    }

    void execute(std::unique_ptr<ICommand> command) {
        // 尝试与上一个命令合并
        if (!m_undo_stack.empty()) {
            auto& last_command = m_undo_stack.back();
            if (last_command->canMergeWith(command.get())) {
                last_command->mergeWith(command.get());
                // 重新执行合并后的命令
                last_command->execute();
                return;
            }
        }

        // 执行新命令
        command->execute();
        m_undo_stack.push_back(std::move(command));

        // 清空redo栈
        m_redo_stack.clear();

        // 限制栈大小
        if (m_undo_stack.size() > m_max_undo_levels) {
            m_undo_stack.pop_front();
        }
    }

    void undo() {
        if (m_undo_stack.empty()) return;

        auto& command = m_undo_stack.back();
        command->undo();

        m_redo_stack.push_back(std::move(command));
        m_undo_stack.pop_back();
    }

    void redo() {
        if (m_redo_stack.empty()) return;

        auto& command = m_redo_stack.back();
        command->execute();

        m_undo_stack.push_back(std::move(command));
        m_redo_stack.pop_back();
    }

private:
    CommandManager() : m_max_undo_levels(50) {}

    std::deque<std::unique_ptr<ICommand>> m_undo_stack;
    std::deque<std::unique_ptr<ICommand>> m_redo_stack;
    size_t m_max_undo_levels;
};

// 使用示例
void moveEntity(Entity entity, const vec3& position) {
    auto command = std::make_unique<MoveEntityCommand>(entity, position);
    CommandManager::instance().execute(std::move(command));
}

void undo() {
    CommandManager::instance().undo();
}

void redo() {
    CommandManager::instance().redo();
}
```

---

## 关键目录

```
editor/
├── editor_core.h
├── editor_ui.h
├── panels/
│   ├── asset_browser.h
│   ├── property_editor.h
│   ├── scene_hierarchy.h
│   ├── console.h
│   └── profiler.h
└── commands/
    ├── command.h
    ├── entity_commands.h
    └── command_manager.h
```

---

## 实践任务

### 任务1: 熟悉编辑器界面

- 运行PiccoloEditor
- 浏览各个面板
- 创建简单场景

### 任务2: 使用编辑工具

- 使用Gizmo移动物体
- 旋转和缩放
- 添加/删除对象

---

## 下周预告

第13周: 粒子系统与特效

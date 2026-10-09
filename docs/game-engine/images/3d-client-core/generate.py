"""Render the original teaching diagrams beside this file with Pillow."""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
FONT = "C:/Windows/Fonts/msyh.ttc"
BOLD = "C:/Windows/Fonts/msyhbd.ttc"
INK, MUTED, BORDER = "#182A3A", "#506477", "#D9E3EB"
BLUE, TEAL, PURPLE, AMBER, ROSE, SLATE = (
    "#2563EB", "#0F766E", "#7C3AED", "#B45309", "#BE123C", "#334155"
)


class Diagram:
    def __init__(self, title, subtitle, color, height=920):
        self.image = Image.new("RGB", (1600, height), "#F7FAFC")
        self.draw = ImageDraw.Draw(self.image)
        self.height, self.color = height, color
        self.text(64, 46, title, 44, bold=True)
        self.text(66, 111, subtitle, 27, color=MUTED)
        self.draw.line((64, 151, 1536, 151), fill=BORDER, width=2)

    def text(self, x, y, value, size=28, color=INK, bold=False, center=False, limit=None):
        font = ImageFont.truetype(BOLD if bold else FONT, size)
        anchor = "mm" if center else "la"
        box = self.draw.textbbox((x, y), value, font=font, anchor=anchor)
        assert box[0] >= 0 and box[1] >= 0 and box[2] <= 1600 and box[3] <= self.height, (value, box)
        if limit is not None:
            assert box[2] - box[0] <= limit, (value, box[2] - box[0], limit)
        self.draw.text((x, y), value, font=font, fill=color, anchor=anchor)

    def panel(self, x, y, w, h, title=None):
        self.draw.rounded_rectangle((x, y, x+w, y+h), radius=20, fill="#FFFFFF", outline=BORDER, width=2)
        if title:
            self.text(x+24, y+22, title, 31, bold=True, limit=w-48)

    def box(self, x, y, w, h, lines, color=None, fill="#FFFFFF", size=29):
        color = color or self.color
        self.draw.rounded_rectangle((x, y, x+w, y+h), radius=16, fill=fill, outline=color, width=2)
        lines = lines.split("\n")
        for i, line in enumerate(lines):
            self.text(x+w/2, y+h/2+(i-(len(lines)-1)/2)*38, line,
                      size, bold=i == 0, center=True, limit=w-24)

    def arrow(self, points, color=None, width=4, label=None, label_at=None):
        color = color or self.color
        self.draw.line(points, fill=color, width=width, joint="curve")
        a, b = points[-2:]
        angle = math.atan2(b[1]-a[1], b[0]-a[0])
        back = [(b[0]-16*math.cos(angle+s), b[1]-16*math.sin(angle+s)) for s in (-0.45, 0.45)]
        self.draw.polygon([b, *back], fill=color)
        if label:
            self.text(*label_at, label, 24, color=color, center=True)

    def dot(self, x, y, r=7, color=None):
        self.draw.ellipse((x-r, y-r, x+r, y+r), fill=color or self.color)

    def footer(self, line):
        self.text(64, self.height-62, line, 25, color=MUTED, limit=1470)

    def save(self, name):
        self.image.save(OUT / name, optimize=True)


def overview():
    d = Diagram("3D 客户端：六个核心问题", "箭头表示数据依赖；阅读从场景与空间开始。", BLUE, 900)
    cards = [
        (64, 200, BLUE, "01 对象怎样组成？", "场景 · 对象 · 组件 · 帧循环"),
        (574, 200, TEAL, "02 对象怎样运动？", "向量 · 变换 · 输入 · 碰撞"),
        (1084, 200, PURPLE, "03 怎样变成像素？", "相机 · 投影 · 光栅化 · 着色"),
        (64, 540, AMBER, "04 角色怎样动画？", "模型 · 骨骼 · 剪辑 · 混合"),
        (574, 540, ROSE, "05 玩法怎样反馈？", "规则 · 状态 · 事件 · 表现"),
        (1084, 540, SLATE, "06 怎样稳定流畅？", "资源生命周期 · CPU / GPU"),
    ]
    for x, y, c, title, sub in cards:
        d.box(x, y, 450, 170, title+"\n"+sub, c, size=29)
    d.arrow([(514, 285), (574, 285)], TEAL)
    d.arrow([(1024, 285), (1084, 285)], PURPLE)
    d.arrow([(289, 540), (289, 370)], AMBER, label="资源与姿态", label_at=(392, 458))
    d.arrow([(799, 540), (799, 435), (500, 435), (500, 370)], ROSE)
    d.text(685, 410, "规则改变对象状态", 24, color=ROSE, center=True)
    d.arrow([(1309, 540), (1309, 370)], SLATE, label="观察成本", label_at=(1406, 454))
    d.box(64, 758, 1470, 65, "输入与时间 → 状态变化 → 画面反馈 → 玩家继续操作", BLUE, "#EFF6FF", 29)
    d.footer("读图时抓住三件事：输入是什么，中间数据怎样变，最后能观察到什么。")
    d.save("00-knowledge-map.png")


def scene():
    d = Diagram("01 场景与时间：状态怎样变成画面", "对象保存数据；更新改变状态；渲染器绘制当前状态。", BLUE, 940)
    d.box(64, 210, 295, 105, "Geometry\n形状：顶点与三角形")
    d.box(64, 365, 295, 105, "Material\n表面：颜色与纹理")
    d.box(460, 285, 295, 160, "Mesh\n形状 + 材质\n位置 / 旋转 / 缩放")
    d.arrow([(359, 262), (408, 262), (408, 338), (460, 338)])
    d.arrow([(359, 418), (408, 418), (408, 393), (460, 393)])
    d.box(850, 285, 235, 160, "Scene\n组织对象")
    d.arrow([(755, 365), (850, 365)])
    d.box(1180, 205, 340, 105, "Camera\n观察位置与投影")
    d.box(1180, 355, 340, 145, "Renderer\nScene + Camera\n绘制到 Canvas")
    d.arrow([(1085, 365), (1180, 420)])
    d.arrow([(1350, 310), (1350, 355)])
    d.panel(64, 570, 1470, 255, "每次帧回调")
    d.box(90, 640, 355, 110, "帧间隔 Δt\n毫秒换成秒", size=28)
    d.box(605, 640, 425, 110, "角度增量 = 角速度 × Δt\n暂停：模拟步长为 0", size=27)
    d.box(1190, 640, 320, 110, "更新后渲染\n再请求下一帧", size=28)
    d.arrow([(445, 695), (605, 695)])
    d.arrow([(1030, 695), (1190, 695)])
    d.text(816, 785, "例：45 度／秒 × 2 秒 = 90 度（累计模拟时间）", 27, center=True)
    d.footer("Cocos 对照：Node 保存变换，Component 表达行为，Director 组织更新与绘制。")
    d.save("01-scene-and-time.png")


def space():
    d = Diagram("02 空间与运动：位置、方向和变换", "先标明坐标空间，再计算；点的位置与向量的方向有不同意义。", TEAL, 940)
    d.panel(64, 200, 680, 595, "两个点 → 位移 → 距离与方向")
    d.arrow([(150, 660), (685, 660)], SLATE, width=3)
    d.arrow([(150, 660), (150, 280)], SLATE, width=3)
    d.text(697, 641, "X", 24)
    d.text(130, 254, "Y", 24)
    a, b = (210, 540), (390, 300)  # Origin (150,660), 60 px per unit on both axes.
    d.draw.line((210, 540, 390, 540, 390, 300), fill=BORDER, width=3)
    d.arrow([a, b], TEAL, width=6)
    d.dot(*a); d.dot(*b)
    d.text(165, 575, "A (1, 2, 0)", 26)
    d.text(435, 285, "B (4, 6, 0)", 26)
    d.text(460, 502, "d = B − A", 28, color=TEAL, bold=True)
    d.text(308, 547, "Δx = 3", 25)
    d.text(410, 413, "Δy = 4", 25)
    d.text(95, 686, "位移 (3,4,0)   长度 5", 30, bold=True)
    d.text(95, 737, "单位方向 (0.6,0.8,0)；零向量没有单位方向", 25, limit=620)
    d.panel(800, 200, 734, 595, "局部坐标 → 世界坐标")
    d.box(960, 290, 415, 80, "局部点 p = (1,0,0)", size=29)
    d.arrow([(1167, 370), (1167, 410)])
    d.box(960, 410, 415, 105, "绕 Y 轴转 +90°\n得到 (0,0,−1)", size=29)
    d.arrow([(1167, 515), (1167, 555)])
    d.box(960, 555, 415, 105, "沿 X 轴平移 2\n世界点 (2,0,−1)", size=29)
    d.text(1167, 711, "父节点变换 T × R：右侧先作用", 27, center=True)
    d.text(1167, 758, "换成 R × T，结果是 (0,0,−3)", 27, center=True)
    d.text(65, 827, "点积看方向关系；叉积得到垂直方向。射线拾取与完整物理碰撞职责不同。", 26)
    d.footer("Cocos 对照：Vec3 / Mat4 / Quat 与 Node 变换。右侧例子采用 Three.js 右手旋转约定。")
    d.save("02-space-and-motion.png")


def pixels():
    d = Diagram("03 相机与渲染：一个点怎样到达屏幕", "坐标转换决定位置；光栅化确定覆盖；着色与深度决定可见结果。", PURPLE, 1060)
    steps = ["局部坐标", "世界坐标", "观察坐标", "裁剪坐标\nx y z w", "NDC\n除以 w", "屏幕位置"]
    labels = ["模型", "观察", "投影", "透视除法", "视口"]
    for i, step in enumerate(steps):
        x = 64+i*250
        d.box(x, 205, 220, 100, step, size=28)
        if i < 5:
            d.arrow([(x+220, 255), (x+250, 255)], width=3)
            d.text(x+235, 327, labels[i], 22, center=True)
    d.panel(64, 390, 690, 355, "投影：三维点到二维位置")
    camera = (130, 610)
    d.dot(*camera, 12)
    for p in [(635, 540), (680, 615), (635, 690)]:
        d.draw.line([camera, p], fill="#BDB1DB", width=2)
    d.draw.line((360, 510, 360, 700), fill=PURPLE, width=4)
    top_y = 610 + (540-610)*(360-130)/(635-130)
    bottom_y = 610 + (690-610)*(360-130)/(635-130)
    d.draw.line((360, top_y, 360, bottom_y), fill=AMBER, width=10)
    d.draw.polygon([(635, 540), (680, 615), (635, 690)], fill="#ECE4FA", outline=PURPLE, width=3)
    d.text(88, 662, "相机", 25)
    d.text(283, 470, "成像平面", 25)
    d.text(548, 470, "三维三角形", 25)
    d.text(206, 711, "橙色段是投影范围（侧视示意）", 24)
    d.panel(805, 390, 730, 355, "光栅化：哪些采样点被三角形覆盖？")
    gx, gy, cell = 865, 472, 43
    triangle = [(gx+43, gy+35), (gx+550, gy+195), (gx+128, gy+250)]
    d.draw.polygon(triangle, fill="#F0E9FB")
    for i in range(14):
        d.draw.line((gx+i*cell, gy, gx+i*cell, gy+258), fill=BORDER, width=1)
    for j in range(7):
        d.draw.line((gx, gy+j*cell, gx+559, gy+j*cell), fill=BORDER, width=1)
    def inside(p):
        signs = []
        for i, a in enumerate(triangle):
            b = triangle[(i+1) % 3]
            signs.append((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))
        return all(v >= 0 for v in signs) or all(v <= 0 for v in signs)
    for i in range(13):
        for j in range(6):
            p = (gx+(i+0.5)*cell, gy+(j+0.5)*cell)
            d.dot(*p, 4, PURPLE if inside(p) else "#CFD8E0")
    d.draw.line(triangle+[triangle[0]], fill=PURPLE, width=4)
    stages = ["顶点着色器\n变换顶点", "光栅化\n产生片元", "片元着色器\n计算颜色", "深度测试 / 混合\n写入渲染目标"]
    for i, label in enumerate(stages):
        x = 64+i*380
        d.box(x, 805, 330, 115, label, size=28)
        if i < 3: d.arrow([(x+330, 862), (x+380, 862)])
    d.text(64, 953, "不透明绘制的简化图；深度测试可能提前，透明绘制还需考虑排序与混合。", 25)
    d.footer("Cocos 对照：Camera / Mat4 决定坐标，Effect / Material 定义着色，GFX 与管线组织绘制。")
    d.save("03-camera-to-pixels.png")


def animation():
    d = Diagram("04 模型与动画：姿态怎样改变顶点", "模型是数据；动画改变属性；骨骼案例通过蒙皮改变顶点。", AMBER, 960)
    labels = ["模型几何\n顶点 · 索引", "UV 坐标\n决定怎样采样纹理", "法线\n参与光照计算", "骨骼 + 权重\n决定顶点受谁影响"]
    for i, label in enumerate(labels): d.box(64+380*i, 205, 330, 110, label, size=27)
    d.panel(64, 375, 650, 325, "蒙皮：一个顶点可受多根骨骼影响")
    joints = [(165, 620), (300, 475), (445, 590)]
    d.draw.line(joints, fill=AMBER, width=10)
    for p in joints: d.dot(*p, 13, AMBER)
    vertex = (565, 478)
    d.dot(*vertex, 10, PURPLE)
    d.arrow([joints[1], vertex], AMBER, width=2)
    d.arrow([joints[2], vertex], AMBER, width=2)
    d.text(404, 436, "权重 0.7", 24, color=AMBER)
    d.text(503, 587, "权重 0.3", 24, color=AMBER)
    d.text(515, 504, "顶点", 24)
    d.text(92, 646, "权重示意；实际变换还包含绑定姿态矩阵。", 24)
    d.panel(770, 375, 765, 325, "骨骼动画的数据流")
    for i, label in enumerate(["Clip\n关键帧数据", "播放与混合\n时间 / 权重", "骨骼姿态\n蒙皮变形"]):
        x = 795+i*245
        d.box(x, 495, 215, 125, label, size=27)
        if i < 2: d.arrow([(x+215, 558), (x+245, 558)], width=3)
    d.box(64, 760, 325, 105, "Idle 待机", AMBER)
    d.box(600, 760, 325, 105, "Run 移动", AMBER)
    d.box(1208, 760, 325, 105, "Attack 攻击", AMBER)
    d.arrow([(389, 812), (600, 812)], label="移动输入", label_at=(493, 744))
    d.arrow([(925, 812), (1208, 812)], label="攻击请求", label_at=(1066, 744))
    d.footer("Cocos 对照：Mesh / AnimationClip / SkeletalAnimation / Animation Graph；图下方为状态转移示例。")
    d.save("04-assets-and-animation.png")


def gameplay():
    d = Diagram("05 规则与表现：一次攻击怎样产生反馈", "规则更新事实状态；事件把结果交给动画、特效、镜头和 UI。", ROSE, 930)
    d.box(64, 235, 260, 155, "输入 / 请求\n攻击目标")
    d.box(415, 205, 335, 240, "规则校验\n目标 · 距离\n命中窗口 · 去重\n取消 / 死亡边界", size=28)
    d.box(865, 235, 280, 180, "改变状态\n生命 · Buff\n成长 · 死亡")
    d.box(1240, 235, 295, 155, "结果事件\n命中 / 受伤 / 死亡")
    d.arrow([(324, 313), (415, 313)])
    d.arrow([(750, 313), (865, 313)], label="通过", label_at=(805, 274))
    d.arrow([(1145, 313), (1240, 313)])
    d.box(415, 575, 335, 125, "拒绝或取消\n记录具体原因")
    d.arrow([(582, 445), (582, 575)], label="未通过", label_at=(650, 508))
    d.box(900, 575, 290, 125, "动画 / VFX\n展示反馈")
    d.box(1240, 575, 295, 125, "镜头 / 音效 / UI\n展示反馈", size=27)
    d.arrow([(1387, 390), (1387, 575)])
    d.arrow([(1387, 470), (1045, 470), (1045, 575)])
    d.box(64, 755, 1470, 90, "示例：一次合法命中 → 生命 100 变 80 → 发出一次受伤事件 → 多种表现响应", ROSE, "#FFF1F4", 27)
    d.footer("Cocos 对照：规则模块 + Component / 事件；动画时序可参与命中窗口，伤害数值由规则决定。")
    d.save("05-rules-and-feedback.png")


def resources():
    d = Diagram("06 资源与性能：先找成本，再选择优化", "资源要说明归属；性能要在相同条件下观察 CPU、GPU 与内存。", SLATE, 970)
    labels = ["加载资源", "创建对象", "使用 / 共享", "退出实验"]
    for i, label in enumerate(labels):
        x = 64+i*380
        d.box(x, 205, 330, 105, label)
        if i < 3: d.arrow([(x+330, 258), (x+380, 258)])
    d.box(1000, 375, 535, 105, "检查资源归属与剩余使用者", SLATE, size=29)
    d.arrow([(1369, 310), (1369, 375)])
    d.box(660, 530, 390, 85, "共享且仍在使用 → 保留", TEAL, size=27)
    d.box(1110, 530, 425, 85, "自有且不再使用 → 释放", SLATE, size=27)
    d.arrow([(1080, 480), (1080, 505), (855, 505), (855, 530)], TEAL)
    d.arrow([(1375, 480), (1375, 530)])
    d.box(64, 675, 460, 165, "CPU\n逻辑 · 物理 · 提交绘制\n观察：哪些工作占用时间？", BLUE, size=27)
    d.box(570, 675, 460, 165, "GPU\n顶点 · 片元 · 纹理\n观察：几何还是像素成本？", PURPLE, size=27)
    d.box(1075, 675, 460, 165, "内存 / 生命周期\n缓存 · 引用 · 分配与释放\n观察：资源是否持续增长？", SLATE, size=27)
    d.text(64, 872, "CPU 与 GPU 的工作可能重叠；Draw Call / FPS / 资源数量都不能单独说明瓶颈。", 25)
    d.footer("Cocos 对照：AssetManager / Asset 引用 / Profiler；优化前后固定设备、分辨率、场景与采样方式。")
    d.save("06-resources-and-cost.png")


if __name__ == "__main__":
    for build in (overview, scene, space, pixels, animation, gameplay, resources):
        build()
    print("Rendered 7 original teaching diagrams.")

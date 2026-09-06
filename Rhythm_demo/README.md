# ⚡ Neon Beat Leap (3D 霓虹街机节奏音游)

[![Build & Static Ready](https://img.shields.io/badge/Vite-5.4+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r170-000000?style=flat&logo=three.js&logoColor=white)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-100%25_Procedural-00f0ff?style=flat)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Cloudflare Pages Ready](https://img.shields.io/badge/Cloudflare_Pages-Ready-F38020?style=flat&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)

一款基于 **Three.js** 3D 渲染引擎与 **Web Audio API** 原生音频时钟打造的赛博霓虹风格音乐节奏游戏。

**100% 纯代码实时生成音乐**：完全不依赖任何外部 MP3 音频文件或版权素材，依靠原生 Web Audio 振荡器、滤波器与包络实时演算合成 4 首不同曲风的原创电音关卡。打开页面，即开即玩！

---

## 🎵 4 大原创电音关卡 (Arcade Stages)

| 关卡 | 关卡名称 | 风格 (Genre) | 曲速 (BPM) | 难度星级 | 体验定位 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **STAGE 01** | **Neon Breeze (霓虹慢步)** | Chillwave / Lo-Fi | **80 BPM** | ★☆☆☆ | 慢速放松，宽容判定窗口，单键 Space 轻松踩点 |
| **STAGE 02** | **Cyber Pulse (赛博脉冲)** | Electro House | **112 BPM** | ★★☆☆ | 四四拍强劲重低音，连击律动感十足，沉浸式蹦迪 |
| **STAGE 03** | **Starlight Leap (星芒跳跃)** | Future Bass | **136 BPM** | ★★★☆ | 晶莹切分琶音与清澈音色，旋律与节拍共鸣 |
| **STAGE 04** | **Overdrive Rush (极速过载)** | Cyber Speedcore | **160 BPM** | ★★★★ | 极速下落与极限手速考验，冲击 S+ 终极评级！ |

---

## 🎮 玩法操作与规则

### 1. 单键纯享模式 (推荐新手与休闲玩家)
- **按键**：敲击 **空格键 (Space)** 或手机屏幕中央按钮。
- **规则**：在小球随节拍落下触底跳板的瞬间敲击空格键，即可连击打出 PERFECT！

### 2. 多键全色块模式 (硬核音游玩家)
| 动作 | 键盘按键 (PC) | 触屏操作 (Mobile) | 对应声学元素 |
| :--- | :--- | :--- | :--- |
| **青色 (CYAN)** | 按 `D` 或 `1` | 点击屏幕底部第 1 个青色方块 | 深度重低音底鼓 (Kick "咚") |
| **粉色 (PINK)** | 按 `F` 或 `2` | 点击屏幕底部第 2 个粉色方块 | 脆爽军鼓 (Snare "啪") |
| **黄色 (YELLOW)** | 按 `J` 或 `3` | 点击屏幕底部第 3 个黄色方块 | 金属开镲 (Hi-Hat "嚓") |
| **紫色 (PURPLE)** | 按 `K` 或 `4` | 点击屏幕底部第 4 个紫色方块 | 高音水晶主音 (Lead "叮") |

- **判定窗口**：
  - **PERFECT** ($\pm 100\text{ms}$)：获得满分与连击加成。
  - **GOOD** ($\pm 220\text{ms}$)：获得基础分与连击。
  - **MISS**：未按或超时未按，连击中断。

---

## ✨ 核心亮点

1. **100% 纯代码程序化音频合成 (零外部音频依赖)**：
   - 彻底免去繁琐的 MP3 下载、拖拽、BPM 测速与 Offset 调教，**纯代码实时生成 4 首电音**。
   - 绝无版权风险，整个游戏构建产物不到 **550 KB**，秒级极速打开！
2. **真实乐器打击演奏感 (Interactive Keysound)**：
   - **单键纯享模式**：每次踩准节拍不仅有扎实的鼓点底音，还会随着曲目音阶演奏出宛如 Fender Rhodes 电钢琴与马林巴的动听旋律主音，每一次连击都在行云流水般“弹奏”主旋律！
   - **多键全模式**：4 键分别对应专属真实乐器——**808 饱满重低音底鼓 (Cyan)**、**录音室脆爽军鼓 (Pink)**、**金属明亮开镲 (Yellow)** 与 **天籁水晶音叉 (Purple)**。
   - **分级音效反馈**：PERFECT 判定额外叠加高频谐波光泽 (Sparkle Shimmer)，听感晶莹通透。
3. **全方位打磨的次级交互音效**：
   - **柔和木质闷响 (Soft Muted Knock)**：彻底取代原有刺耳锯齿蜂鸣器的 Miss 惩罚音，保护耳膜且不破坏背景音乐律动。
   - **Combo 里程碑和弦 (Milestone Chime)**：连击达到 10、25、50、100+ 时触发阶梯式晶莹庆贺和弦。
   - **通关凯旋号角 (Stage Clear Fanfare)**：根据最终评价（S+/S/A/B）奏响华丽的大三和弦琶音。
   - **UI 微触感点击 (Tactile Click)**：关卡切换与难度选择带有机械键盘般的清脆微点击反馈。
4. **毫秒级绝对声画同步**：
   - 音频完全由 Web Audio API 硬件时钟 `ctx.currentTime` 驱动，小球抛物线跳跃、跳板发光与鼓点节拍完全 100% 锁死，零延迟、零漂移。
5. **即时试听与街机选关系统**：
   - 启动面板可随时点击“试听 (Preview)”各关卡旋律片段，随时随地开启一局。
6. **高保真 3D 霓虹视觉**：
   - 纵深透视赛道、平滑镜头跟随、小球挤压拉伸（Squash & Stretch）物理形变、触地冲击波与动态火花。
7. **极简部署**：
   - 纯静态 Web 应用，支持一键部署到 GitHub Pages、Cloudflare Pages、Vercel 等任意静态托管平台。

---

## 🚀 本地开发与运行

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务器 (默认端口 3000)
npm run dev

# 3. 生产环境打包与预览 (默认端口 4173)
npm run build
npm run preview
```

# 🎮 My AI Games (AI 趣味小游戏游乐场)

> 一个由 **AI 协同驱动开发** 的轻量级 Web 独立小游戏合集项目。  
> 旨在探索 AI 在纯前端游戏逻辑、现代视觉动效（Glassmorphism / 粒子物理）与程序化音频合成上的实践可能。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20Browser-success.svg)]()
[![Author](https://img.shields.io/badge/Author-jsbrzdf-orange.svg)](https://github.com/jsbrzdf)

---

## 🕹️ 游戏目录 (Game Catalog)

| 游戏名称 | 目录路径 | 核心特色 / 视觉与音效亮点 | 状态 |
| :--- | :--- | :--- | :---: |
| 🧊 **Glass Tetris (毛玻璃俄罗斯方块)** | [`Tetris_demo/`](./Tetris_demo/) | 毛玻璃拟态美学、Web Audio 程序化音效、碎片爆炸粒子物理系统、零依赖开发服务 | ✅ 已完成 |
| ⚡ **Neon Beat Leap (3D 霓虹节奏音游)** | [`Rhythm_demo/`](./Rhythm_demo/) | Three.js 赛博空间、100% 程序化电音实时合成（4首原创关卡）、空格/四色块双操作模式、动态粒子律动 | ✅ 已完成 |
| 🚀 **Next Game** | *待定* | 规划中（如：贪吃蛇 / 2048 / 经典打砖块 / 弹幕射击等） | 💡 筹备中 |

---

## 🚀 快速开始与本地预览

本项目支持**统一游戏大厅**（推荐，全量体验）或**单游戏独立运行**：

### 🌟 方式一：启动统一游戏大厅 (Game Hub Portal - 推荐)
一次性编译音游并组装全站，在浏览器中畅玩完整的极客游戏游乐场：

```bash
# 1. 自动执行依赖编译与大厅聚合打包 (产物输出至 ./dist)
npm run build

# 2. 启动零外部依赖的极速预览服务
npm start
```
启动后在浏览器打开 `http://localhost:3000` 即可沉浸式访问游戏大厅，点击卡片自由切换各款小游戏，游戏内随时可通过「🏠 返回大厅」无缝回退。

---

### 🕹️ 方式二：单游戏独立运行

#### 1. Glass Tetris (毛玻璃俄罗斯方块)
内置**零外部依赖**的轻量 Node.js 服务器，亦可直接双击 `index.html` 游玩：

```bash
cd Tetris_demo
npm start
# 访问 http://localhost:5173
```

#### 2. Neon Beat Leap (3D 霓虹节奏音游)
基于现代前端构建工具 Vite 与 Three.js 构建：

```bash
cd Rhythm_demo
npm install
npm run dev
# 访问 http://localhost:5173 或 Vite 提示端口
```

---

## 🌐 Cloudflare Pages 一体化部署

本项目已预置好 Cloudflare Pages 统一部署配置（见 [`wrangler.json`](./wrangler.json)）。

若你在 Cloudflare Pages 后台关联了本 GitHub 仓库，仅需在构建设置中配置：
- **Build command (构建命令)**: `npm run build`
- **Build output directory (输出目录)**: `dist`

每次推送代码至 `main` 分支，Cloudflare 将自动触发全量构建，一键发布包含**游戏大厅**、`/tetris/` 和 `/rhythm/` 的完整站点！

---

## 🧊 现有游戏展示：Glass Tetris

### 游戏亮点
- **极简拟态美学**：采用现代化 Glassmorphism（毛玻璃质感、流动渐变阴影与磨砂透明度）。
- **零素材音频合成**：基于浏览器原生 **Web Audio API**，纯代码动态生成旋转、下落、消行与 Game Over 各种音效，无需加载外部 MP3/WAV 资源。
- **物理粒子特效**：方块消除时触发定制 Canvas 玻璃碎片飞溅与重力阻尼模拟。
- **核心玩法机制**：支持方块暂存（Hold）、硬降（Hard Drop）、Ghost 投影辅助线、等级与动态递增下落速度。

### 操作按键说明
| 按键 | 功能 |
| :--- | :--- |
| `←` / `→` 或 `A` / `D` | 左右移动方块 |
| `↓` / `S` | 软降（加速下落） |
| `↑` / `W` | 顺时针旋转方块 |
| `Space (空格键)` | 硬降（瞬降触底） |
| `C` 或 `Shift` | 暂存方块 (Hold) |
| `P` 或 `Esc` | 暂停 / 继续游戏 |

---

## ⚡ 现有游戏展示：Neon Beat Leap (Rhythm_demo)

### 游戏亮点
- **沉浸式 3D 赛博空间**：基于 Three.js 构建立体发光轨道、根据节拍起伏的跳跃小球与飞溅的霓虹冲击波。
- **100% 原生纯代码电音合成**：零外部 MP3/WAV 素材，通过原生 Web Audio API 实时演算合成 4 大原创电音关卡（Chillwave / Electro House / Future Bass / Cyber Speedcore）。
- **双维度操作模式**：
  - **休闲单键模式**：只需敲击 `Space (空格键)` 或点击屏幕中央，随下落节拍起跳。
  - **硬核四色键位模式**：键盘 `D`、`F`、`J`、`K`（或触屏四色按键）对应底鼓、军鼓、踩镲与高音主音，享受敲键快感。
- **自适应与触屏支持**：支持 PC 键盘与手机触控交互，视觉效果随连击动态绽放。

---

## 📂 仓库结构与扩展规范

本项目遵循每个小游戏独立成包、互不干扰的模块化设计：

```text
my-ai-games/
├── .gitignore          # 全局 Git 忽略规则
├── LICENSE             # MIT 开源许可证
├── README.md           # 游乐场主索引与说明
├── wrangler.json       # Cloudflare Pages 部署配置
├── Tetris_demo/        # 俄罗斯方块 (纯原生+零依赖服务)
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── server.js
│   └── package.json
├── Rhythm_demo/        # 3D 霓虹节奏音游 (Vite + Three.js)
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
└── <Next_Game>/        # 后续小游戏（按此规范独立建包）
```

---

## 📌 免责声明 (Disclaimer)

1. **非商业与学习交流**：本项目仅供技术探索、编程练习与 AI 辅助开发实验，不用于任何商业盈利目的。
2. **商标与版权说明**：“Tetris” 以及俄罗斯方块相关概念为 The Tetris Company, Inc. 的受保护商标与知识产权。本项目为个人非官方的独立实验实现。
3. **AI 协同说明**：本项目核心架构、代码与部分动效设计方案在 AI 辅助协助下完成。

---

## 📄 开源协议

本项目采用 [MIT License](./LICENSE) 协议授权开源，详情请参阅 [LICENSE](./LICENSE) 文件。

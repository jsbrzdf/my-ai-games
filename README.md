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
| 🚀 **Next Game 1** | *待定* | 规划中（如：贪吃蛇 / 2048 / 经典打砖块 / 弹幕射击等） | 💡 筹备中 |
| 🎲 **Next Game 2** | *待定* | 规划中 | 💡 筹备中 |

---

## 🚀 快速开始

本项目的小游戏均为纯前端轻量化设计，提供两种运行方式：

### 方式一：直接浏览器打开（最快捷）
无需安装任何依赖，直接使用现代浏览器（Chrome / Edge / Firefox / Safari）双击打开对应游戏目录下的 `index.html` 即可开始游玩。

### 方式二：本地服务启动（体验更佳）
以 **Glass Tetris** 为例，内置了**零外部依赖**的轻量 Node.js 服务器：

```bash
# 1. 进入游戏目录
cd Tetris_demo

# 2. 启动服务（内置零依赖 server.js）
npm start
# 或者直接: node server.js
```

终端将输出本地访问地址（默认端口为 `http://localhost:5173`），在浏览器中打开即可。

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
| `↓` 或 `S` | 软降（加速下落） |
| `↑` 或 `W` | 顺时针旋转方块 |
| `Space (空格键)` | 硬降（瞬降触底） |
| `C` 或 `Shift` | 暂存方块 (Hold) |
| `P` 或 `Esc` | 暂停 / 继续游戏 |

---

## 📂 仓库结构与扩展规范

后续新增小游戏时，建议遵循统一的独立模块化结构：

```text
my-ai-games/
├── LICENSE             # MIT 开源许可证
├── README.md           # 游乐场主索引与说明
├── Tetris_demo/        # 俄罗斯方块独立游戏目录
│   ├── index.html      # 页面入口
│   ├── css/            # 样式文件 (Glassmorphism 动效)
│   ├── js/             # 游戏核心引擎与音频逻辑
│   ├── assets/         # 静态资源
│   ├── server.js       # 零依赖本地轻量服务
│   └── package.json    # 启动脚本与元信息
└── <Next_Game>/        # 后续小游戏（按此结构独立建包）
```

---

## 📌 免责声明 (Disclaimer)

1. **非商业与学习交流**：本项目仅供技术探索、编程练习与 AI 辅助开发实验，不用于任何商业盈利目的。
2. **商标与版权说明**：“Tetris” 以及俄罗斯方块相关概念为 The Tetris Company, Inc. 的受保护商标与知识产权。本项目为个人非官方的独立实验实现。
3. **AI 协同说明**：本项目核心架构、代码与部分动效设计方案在 AI 辅助协助下完成。

---

## 📄 开源协议

本项目采用 [MIT License](./LICENSE) 协议授权开源，详情请参阅 [LICENSE](./LICENSE) 文件。

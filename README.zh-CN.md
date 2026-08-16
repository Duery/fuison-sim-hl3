# fusionsimulator.io

一个完全在浏览器中运行的实时托卡马克等离子体模拟器。
fusionsimulator.io 将 Rust 物理引擎（编译为 WebAssembly）与
React/TypeScript 前端相结合，提供用于探索托卡马克等离子体行为的交互式控制室体验。

## 功能特性

- **四台托卡马克装置：** DIII-D、JET、ITER 和 CENTAUR（概念性负三角变形装置），
  各装置具有特定的几何结构、加热系统和工程限制
- **每台装置三种放电预设：** H 模、L 模和密度极限方案，具有真实的波形编程
- **实时物理：** 0D 功率平衡输运、解析 Grad-Shafranov 平衡、tanh 台座剖面、
  ELM 动力学和破裂建模
- **交互式控制室：** 2D 平衡截面、19 通道时间迹线查看器、等离子体参数仪表盘
  和 3D 托卡马克端口视图
- **射击规划器：** 编辑放电参数（Ip、加热功率、密度、整形）并运行自定义方案
- **聚变诊断：** 计算聚变功率/Q、中子速率、偏滤器热通量及表面温度建模
- **放电后分析：** 时间擦洗、径向剖面查看器（含合成汤姆孙散射）

## 物理模型

该模拟器实现了聚变文献中经过同行评审的物理模型：

| 模型 | 参考文献 |
|-------|-----------|
| MHD 平衡 | Cerfon-Freidberg 解析 Grad-Shafranov（PoP 2010） |
| 能量约束 | IPB98(y,2) 定标（ITER Physics Basis, NF 1999） |
| L-H 转换 | Martin 功率阈值定标（JPCS 2008） |
| Beta 极限 | Troyon 归一化 beta 极限（PPCF 1984） |
| 密度极限 | Greenwald 极限（PPCF 2002） |
| 聚变反应率 | Bosch-Hale 参数化（NF 1992） |
| 偏滤器热通量 | Eich SOL 宽度定标（NF 2013） |
| 径向剖面 | OMFIT tanh 台座参数化 |

完整的引用和公式请参见应用内的"参考文献"页面。

> **免责声明：** fusionsimulator.io 使用 0D 定标律和解析近似。
> 它是一个教学和可视化工具，不是预测性输运程序。

## 快速开始

### 前置条件

- [Rust](https://rustup.rs/)（stable 工具链）
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)（`cargo install wasm-pack`）
- [Node.js](https://nodejs.org/) 18+ 及 npm

### 快速启动

```bash
# 克隆仓库
git clone <repo-url>
cd fusion-sim

# 完整构建（WASM 引擎 + 前端）
./build.sh

# 托管构建好的应用
cd web && npx vite preview
```

### 开发

```bash
# 构建 WASM 模块
wasm-pack build crates/tok-sym-core \
  --target web \
  --out-dir ../../web/src/wasm \
  --features wasm \
  -- --no-default-features

# 启动前端开发服务器（支持热重载）
cd web
npm install
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

### 运行测试

```bash
# Rust 物理引擎测试
cargo test -p tok-sym-core

# TypeScript 类型检查
cd web && npx tsc -b

# 代码检查
cd web && npm run lint
```

### 生成 Rust API 文档

```bash
cargo doc -p tok-sym-core --no-deps --open
```

这将在浏览器中打开物理引擎的自动生成 API 文档。
所有公共类型和函数都带有 rustdoc 注释说明。

## 项目结构

```
fusion-sim/
├── crates/tok-sym-core/   Rust 物理引擎（约 5,500 行）
│   └── src/
│       ├── equilibrium.rs   Cerfon-Freidberg Grad-Shafranov 求解器
│       ├── transport.rs     0D 功率平衡（IPB98、L-H、ELM）
│       ├── profiles.rs      Tanh 台座径向剖面
│       ├── devices.rs       DIII-D、JET、ITER、CENTAUR 定义
│       ├── disruption.rs    破裂风险与动力学
│       ├── diagnostics.rs   合成诊断信号
│       ├── contour.rs       Marching squares 等值线提取
│       ├── simulation.rs    顶层协调器
│       └── wasm_api.rs      WASM-bindgen API 表面
│
├── web/                   React 前端（约 11,600 行）
│   └── src/
│       ├── lib/             共享库（WASM 初始化、hooks、物理）
│       ├── components/      UI 组件（canvas、面板、3D 视图）
│       ├── pages/           路由页面（DeviceSelect、ControlRoom 等）
│       └── wasm/            生成的 WASM 输出
│
├── build.sh               完整构建脚本
└── ARCHITECTURE.md        全面的架构指南
```

有关每个模块、函数和组件的详细文档，请参阅 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 技术栈

- **物理引擎：** Rust，通过 wasm-pack 编译为 WebAssembly
- **前端：** React 19、TypeScript 5.9、Vite 7.3
- **样式：** Tailwind CSS 4.2
- **3D 渲染：** Three.js 及自定义 GLSL 着色器
- **2D 渲染：** HTML Canvas API
- **路由：** React Router v7

## 架构概览

```
┌─────────────────────────────────────────────────┐
│                  Browser                         │
│                                                  │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │  Rust/WASM   │───▶│  React/TypeScript      │  │
│  │  Physics     │JSON│                        │  │
│  │  Engine      │◀───│  useSimulation hook    │  │
│  │              │    │    │                    │  │
│  │ • Equilibrium│    │    ├─ EquilibriumCanvas │  │
│  │ • Transport  │    │    ├─ StatusPanel       │  │
│  │ • Profiles   │    │    ├─ UnifiedTracePanel │  │
│  │ • Disruption │    │    ├─ PortView (3D)     │  │
│  │ • Contours   │    │    └─ ShotPlanner       │  │
│  └──────────────┘    └────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

所有物理计算都在 WASM 模块中运行。TypeScript 层负责渲染、
用户交互以及一些仅用于显示的派生计算（通过 Bosch-Hale 和 Eich
定标计算聚变 Q、偏滤器热通量）。

## 许可证

MIT 许可证。详情参见 [LICENSE](LICENSE)。

## 致谢

由 Daniel Burgess 和 Columbia Fusion Research Center 开发。

版权所有 2026 Daniel Burgess。保留所有权利。

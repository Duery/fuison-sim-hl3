# fusionsimulator.io 架构指南

fusionsimulator.io 代码库的全面参考。本文档涵盖项目中的每个目录、文件、模块和主要函数。

**代码库规模：** 约 5,500 行 Rust + 约 11,600 行 TypeScript/React

---

## 目录

1. [项目概览](#项目概览)
2. [仓库结构](#仓库结构)
3. [构建系统](#构建系统)
4. [Rust 物理引擎](#rust-物理引擎)
   - [equilibrium.rs — Grad-Shafranov 求解器](#equilibriumrs--grad-shafranov-求解器)
   - [transport.rs — 0D 功率平衡](#transportrs--0d-功率平衡)
   - [profiles.rs — 径向剖面模型](#profilesrs--径向剖面模型)
   - [devices.rs — 托卡马克定义](#devicesrs--托卡马克定义)
   - [disruption.rs — 破裂模型](#disruptionrs--破裂模型)
   - [diagnostics.rs — 合成诊断](#diagnosticsrs--合成诊断)
   - [contour.rs — 磁通面提取](#contourrs--磁通面提取)
   - [simulation.rs — 协调器](#simulationrs--协调器)
   - [wasm_api.rs — WASM 边界](#wasm_apirs--wasm-边界)
5. [WASM 边界层](#wasm-边界层)
6. [TypeScript 库层](#typescript-库层)
   - [wasm.ts — WASM 初始化](#wasmts--wasm-初始化)
   - [types.ts — 接口定义](#typests--接口定义)
   - [useSimulation.ts — 核心 React Hook](#usesimulationts--核心-react-hook)
   - [fusionPhysics.ts — 客户端物理](#fusionphysicsts--客户端物理)
   - [profileUtils.ts — 剖面后处理](#profileutilsts--剖面后处理)
   - [targetTraces.ts — 目标迹线计算](#targettracests--目标迹线计算)
   - [settingsContext.tsx — 应用设置](#settingscontexttsx--应用设置)
7. [React 组件](#react-组件)
   - [EquilibriumCanvas — 2D 截面](#equilibriumcanvas--2d-截面)
   - [StatusPanel — 参数仪表盘](#statuspanel--参数仪表盘)
   - [UnifiedTracePanel — 时间迹线](#unifiedtracepanel--时间迹线)
   - [ShotPlanner — 放电编辑器](#shotplanner--放电编辑器)
   - [ProfilePanel — 径向剖面](#profilepanel--径向剖面)
   - [PortView (3D) — 托卡马克可视化](#portview-3d--托卡马克可视化)
   - [支持组件](#支持组件)
8. [页面与路由](#页面与路由)
9. [数据流](#数据流)
10. [物理模型参考](#物理模型参考)

---

## 项目概览

fusionsimulator.io 是一个交互式实时托卡马克等离子体模拟器，完全在浏览器中运行。编译为 WebAssembly 的 Rust 物理引擎计算等离子体平衡、输运、剖面和破裂物理。React/TypeScript 前端渲染 2D 截面、时间迹线、径向剖面、3D 端口视图和完整的控制室界面。

共建模了四台托卡马克装置：**DIII-D**、**JET**、**ITER** 和 **CENTAUR**（概念性负三角变形装置），每台都有特定于装置的几何结构、加热限制和壁轮廓。每台装置提供三种放电预设：**H 模**、**L 模** 和 **密度极限**。

该模拟器使用 0D（体积平均）功率平衡和解析平衡重建，使其速度足以在浏览器中以每秒 200 个物理步长运行，同时捕获托卡马克运行的基本物理。

---

## 仓库结构

```
fusion-sim/
├── Cargo.toml                  # 工作区根（成员：crates/tok-sym-core）
├── Cargo.lock
├── build.sh                    # 完整构建脚本（WASM + 前端）
├── README.md                   # 项目 README
├── ARCHITECTURE.md             # 本文件
├── LICENSE                     # MIT 许可证
├── PLAN.md                     # 原始开发计划
│
├── crates/
│   └── tok-sym-core/           # Rust 物理引擎 crate
│       ├── Cargo.toml          # Crate 配置（cdylib + rlib，wasm feature）
│       └── src/
│           ├── lib.rs          # 模块声明
│           ├── equilibrium.rs  # Cerfon-Freidberg Grad-Shafranov 求解器
│           ├── transport.rs    # 0D 功率平衡模型
│           ├── profiles.rs     # Tanh 台座径向剖面
│           ├── devices.rs      # DIII-D, JET, ITER, CENTAUR 定义
│           ├── disruption.rs   # 破裂风险与动力学
│           ├── diagnostics.rs  # 合成诊断信号
│           ├── contour.rs      # Marching squares 等值线提取
│           ├── simulation.rs   # 顶层协调器 + DischargeProgram
│           └── wasm_api.rs     # wasm-bindgen API 表面
│
└── web/                        # 前端应用
    ├── package.json            # 依赖（React 19、Three.js、Vite 7）
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    │
    └── src/
        ├── main.tsx            # 入口点（WASM 初始化 → React 挂载）
        ├── App.tsx             # 路由器（4 条路由）
        ├── index.css           # Tailwind CSS 4.2 导入
        │
        ├── lib/                # 共享 TypeScript 库
        │   ├── wasm.ts         # WASM 单例 + 设备/预设包装器
        │   ├── types.ts        # TypeScript 接口（Snapshot、TracePoint 等）
        │   ├── useSimulation.ts # 核心模拟 React hook
        │   ├── fusionPhysics.ts # Bosch-Hale 反应率、聚变 Q、偏滤器热通量
        │   ├── profileUtils.ts  # 汤姆孙散射噪声、剖面后处理
        │   ├── targetTraces.ts  # 目标迹线叠加计算
        │   ├── settingsContext.tsx # 主题 + 单位上下文提供器
        │   ├── diiid-geometry.ts  # DIII-D CAD 限制器多边形（约 400 点）
        │   ├── jet-geometry.ts    # JET CAD 限制器多边形
        │   └── iter-geometry.ts   # ITER CAD 限制器多边形
        │
        ├── components/         # React UI 组件
        │   ├── EquilibriumCanvas.tsx  # 2D 极向截面（Canvas API）
        │   ├── StatusPanel.tsx        # 参数仪表盘 + 子面板
        │   ├── UnifiedTracePanel.tsx  # 时间迹线查看器（19 通道）
        │   ├── ShotPlanner.tsx        # 放电参数编辑器
        │   ├── ProfilePanel.tsx       # Te/ne/压强剖面查看器
        │   ├── DisruptionGauge.tsx    # 垂直破裂风险仪表
        │   ├── InfoPopup.tsx          # 可复用信息弹窗
        │   ├── infoContent.tsx        # 物理说明内容
        │   ├── SettingsDropdown.tsx   # 设置菜单（主题、单位）
        │   ├── TutorialOverlay.tsx    # 交互式教程系统
        │   ├── TimeTraces.tsx         # 旧版迹线组件
        │   ├── PortView.old.tsx       # 旧版 3D 视图
        │   │
        │   └── portview/             # 3D 托卡马克可视化（Three.js）
        │       ├── index.tsx         # 主要 PortView 组件
        │       ├── camera.ts         # 相机设置 + 动画
        │       ├── config.ts         # 每设备 3D 配置
        │       ├── geometry.ts       # 壁 + 端口网格生成
        │       ├── wallMaterial.ts   # 自定义壁着色器材质
        │       ├── plasma.ts         # 等离子体体积渲染
        │       ├── glow.ts           # 偏滤器打击点辉光
        │       ├── postprocessing.ts # Bloom + 色调映射管线
        │       ├── types.ts          # 3D 工具类型 + 环向变换
        │       └── shaders/          # GLSL 着色器文件
        │
        ├── pages/              # 路由级页面组件
        │   ├── DeviceSelect.tsx       # 落地页 — 设备卡片
        │   ├── ProgramDischarge.tsx   # 运行前波形审查
        │   ├── ControlRoom.tsx        # 主模拟控制室
        │   └── Bibliography.tsx       # 物理参考文献 + 引用
        │
        └── wasm/               # WASM 构建输出（由 wasm-pack 生成）
            ├── tok_sym_core.js
            ├── tok_sym_core_bg.wasm
            └── tok_sym_core.d.ts
```

---

## 构建系统

### 前置条件

- **Rust**（stable）并安装 `wasm-pack`
- **Node.js**（18+）及 npm

### 构建命令

```bash
# 完整构建（WASM + 前端）
./build.sh

# 仅 WASM
wasm-pack build crates/tok-sym-core \
  --target web \
  --out-dir ../../web/src/wasm \
  --features wasm \
  -- --no-default-features

# 前端开发服务器
cd web && npm run dev

# 前端生产构建
cd web && npm run build

# 运行 Rust 测试
cargo test -p tok-sym-core

# 生成 Rust API 文档
cargo doc -p tok-sym-core --no-deps --open
```

### 构建管线

1. `wasm-pack` 使用 `wasm` feature 标志将 `tok-sym-core` 编译为 WASM
2. 输出落在 `web/src/wasm/`（JS 绑定 + `.wasm` 二进制）
3. Vite 打包前端，将 WASM 模块作为 ES 模块导入
4. WASM 模块在 React 挂载前异步初始化

### Cargo 工作区

根 `Cargo.toml` 定义了一个工作区，含一个成员 crate。`tok-sym-core`
crate 同时构建为 `cdylib`（用于 WASM）和 `rlib`（用于原生测试）。Release
profile 使用 `opt-level = 3` 和 LTO 以获得最大 WASM 性能。

---

## Rust 物理引擎

### lib.rs — 模块声明

```
crates/tok-sym-core/src/lib.rs (11 行)
```

声明所有物理模块。`wasm_api` 模块使用 `#[cfg(feature = "wasm")]`
条件编译，使 crate 可在不依赖 wasm-bindgen 的情况下用于原生 Rust 环境。

模块：`devices`、`equilibrium`、`contour`、`profiles`、`transport`、
`disruption`、`simulation`、`diagnostics`、`wasm_api`（feature 门控）。

---

### equilibrium.rs — Grad-Shafranov 求解器

```
crates/tok-sym-core/src/equilibrium.rs (1,060 行)
```

实现 **Cerfon-Freidberg 解析 Grad-Shafranov 平衡求解器**
（[A. Cerfon & J. Freidberg, PoP 17, 032502, 2010](https://doi.org/10.1063/1.3328818)）。

#### 关键类型

| 类型 | 描述 |
|------|-------------|
| `ShapeParams` | 等离子体形状参数：epsilon（反纵横比）、kappa（拉长比）、delta（三角变形）、a_param、config、x_point_alpha、squareness |
| `MagneticConfig` | 枚举：`LowerSingleNull`、`UpperSingleNull`、`DoubleNull` |
| `CerfonEquilibrium` | 解状态：12 个系数、轴位置、轴/边界处的 psi 值 |

#### 物理

求解器将极向磁通函数展开为：

```
psi(R,Z) = psi_particular + sum(c_i * psi_i, i=1..12)
```

其中 `psi_particular` 是特解，`psi_i` 是满足 Grad-Shafranov 方程的 12 个齐次基函数。基函数是归一化坐标 `(x, y)` 中的多项式/三角组合，其中 `x = (R - R0) / (epsilon * R0)`、`y = Z / (epsilon * R0)`。

12 个系数由边界条件确定：
- **下单零（LSN）：** X 点在中平面下方，来自等离子体边界形状和零条件的 12 个约束
- **上单零（USN）：** LSN 的镜像
- **双零（DN）：** 两个 X 点，对称约束

组装 12x12 线性系统，并通过带部分主元的高斯消元求解。

#### 关键函数

| 函数 | 描述 |
|----------|-------------|
| `psi_1()` .. `psi_12()` | Cerfon-Freidberg 展开的 12 个基函数 |
| `assemble_lsn()` | 为下单零构建 12x12 约束矩阵 |
| `assemble_usn()` | 为上单零构建约束矩阵 |
| `assemble_dn()` | 为双零构建约束矩阵 |
| `gauss_solve()` | 带部分主元的 12x12 高斯消元 |
| `CerfonEquilibrium::solve()` | 主求解器入口 |
| `CerfonEquilibrium::from_device()` | 从 `Device` 结构构造 |
| `CerfonEquilibrium::psi()` | 计算任意 (R, Z) 处的 psi |
| `CerfonEquilibrium::psi_normalized()` | 返回归一化到 [0, 1] 的 psi（轴到边界） |
| `CerfonEquilibrium::psi_grid()` | 在 2D 网格上计算 psi 用于等值线提取 |
| `CerfonEquilibrium::update()` | 使用新形状参数重新求解 |
| `CerfonEquilibrium::axis_physical()` | 返回磁轴位置（米） |
| `CerfonEquilibrium::x_point_physical()` | 返回 X 点位置（米） |
| `CerfonEquilibrium::grid_bounds()` | 返回用于可视化的 (R, Z) 网格边界 |

#### 测试（7 个测试）

验证轴位置、psi 归一化、网格计算以及三种磁位形的配置特定行为。

---

### transport.rs — 0D 功率平衡

```
crates/tok-sym-core/src/transport.rs (591 行)
```

实现**零维（体积平均）功率平衡输运模型**，包含 L-H 转换、ELM 动力学和破裂耦合。

#### 关键类型

| 类型 | 描述 |
|------|-------------|
| `TransportModel` | 完整输运状态：Ip、ne、Te、Wth、tau_e、q95、beta_n、f_gw、h98、li、vloop、radiation、confinement mode、impurity fraction、ELM state |
| `ProgramValues` | 从放电程序波形插值得到的当前执行器值 |

#### 物理模型

每次 `step(dt)` 调用推进等离子体状态：

1. **密度演化：** 以约 50ms 时间常数向目标 ne 弛豫
2. **杂质跟踪：** 氖份额从气体注入演化，并有 ELM 冲刷
3. **安全因子 q95：** 由 Ip、Bt、R0、a、kappa 计算，带形状修正
4. **Greenwald 份额：** f_GW = ne / n_GW，其中 n_GW = Ip / (pi * a^2)
5. **欧姆加热：** Spitzer 电阻率，带 Zeff 修正
6. **辐射损失：** 轫致辐射 + 本征杂质辐射（P_external 的份额）+ 氖注入
7. **L-H 转换：** Martin 2008 功率阈值定标 P_LH ~ ne^0.78 * Bt^0.77 * S^0.98
8. **能量约束：** IPB98(y,2)，带三角变形修正、DT 同位素增强（1.10×）、装置特定约束因子（例如 JET 1.35×）和 NT 边缘模式（h=0.65）
9. **功率平衡：** dW/dt = P_heat - W/tau_E - P_rad，带 alpha 自加热反馈
10. **ELM 模型：** I 型（大型、周期）、II 型（草状、高整形）、QCE（准连续排热），通过 xorshift PRNG 随机定时
11. **温度：** 从 W_th 以峰化因子 2.5 推导：Te0 = (W_th / (3*ne*V*0.016)) * 2.5
12. **Beta 极限：** beta_N 钳制到 Troyon 极限（beta_N,max = 2.8 * I_N）

#### 关键函数

| 函数 | 描述 |
|----------|-------------|
| `TransportModel::new()` | 初始化冷等离子体状态 |
| `TransportModel::step()` | 将状态推进 dt 秒 |
| `ipb98y2()` | IPB98(y,2) 约束定标律 |
| `martin_lh_power()` | Martin 2008 L-H 功率阈值 |
| `spitzer_resistivity()` | Spitzer 电阻率，带新经典修正 |

#### 测试（5 个测试）

验证 H 模转换、ELM 触发、Greenwald 极限行为、能量约束定标和功率平衡守恒。

---

### profiles.rs — 径向剖面模型

```
crates/tok-sym-core/src/profiles.rs (700 行)
```

实现电子温度 Te(rho)、电子密度 ne(rho) 和派生压强的 **OMFIT tanh 台座径向剖面参数化**。

#### 关键类型

| 类型 | 描述 |
|------|-------------|
| `ProfileParams` | 7 参数 tanh 台座：edge、ped、core、expin、expout、widthp、xphalf |
| `Profiles` | 以 `PROFILE_NPTS=51` 个点的固定数组包含 Te 和 ne 剖面 |

#### 物理

径向剖面使用 OMFIT 的修正 tanh 参数化：

```
f(x) = (edge + ped)/2 + (ped - edge)/2 * mtanh(alpha, x)
```

其中 `mtanh` 包含多项式芯部贡献（expin、expout 项）。这捕获了 H 模等离子体特有的陡峭台座结构。

剖面根据 0D 输运状态更新，并进行物理驱动的平滑和能量归一化：
- **台座：** 100ms 平滑时间常数，高度取决于三角变形
- **芯部：** 150ms 平滑时间常数
- **ELM 崩溃：** 台座崩溃份额 = 1.5× 全局能量损失（I 型），1.2×（II 型）
- **能量归一化：** Te_core 缩放使剖面积分 W 与 0D W_th 匹配（台座保留，因为它受 MHD 稳定性限制）
- **NT 边缘：** 小型气球模限制台座（Te_ped ≈ Te0 的 12%）

#### 关键函数

| 函数 | 描述 |
|----------|-------------|
| `tanh_profile()` | 在 51 个径向点计算修正 tanh 剖面 |
| `diiid_te_params()`、`iter_te_params()`、`jet_te_params()` | 装置特定 Te 剖面形状 |
| `diiid_ne_params()`、`iter_ne_params()`、`jet_ne_params()` | 装置特定 ne 剖面形状 |
| `Profiles::new()` | 创建平坦（冷）剖面 |
| `Profiles::update_from_0d()` | 将 0D 输运状态映射到径向剖面（包括依赖 delta 的台座） |
| `Profiles::normalize_to_energy()` | 重新缩放 Te_core 使剖面积分 W 与 0D W_th 匹配 |
| `compute_li()` | 从 Spitzer 电导率剖面计算内部电感 li |

#### 测试（10 个测试）

验证剖面形状、台座宽度、ELM 崩溃响应、li 计算和装置特定参数加载。

---

### devices.rs — 托卡马克定义

```
crates/tok-sym-core/src/devices.rs (356 行)
```

定义三台受支持的托卡马克装置及其工程参数和壁几何。

#### 关键类型

| 类型 | 描述 |
|------|-------------|
| `Device` | 完整装置规格：R0、a、bt_max、ip_max、kappa、delta、volume、surface_area、z0、wall_outline、config、impurity_elm、p_lh_factor |
| `MagneticConfig` | 从 equilibrium 重新导出：LSN、USN、DN |
| `ImpurityElmParams` | ELM 冲刷参数：base_fraction、flush_rate、recovery_rate |

#### 装置

| 装置 | R0 (m) | a (m) | Bt,max (T) | Ip,max (MA) | 说明 |
|--------|--------|-------|------------|-------------|-------|
| DIII-D | 1.67 | 0.56 | 2.2 | 2.0 | 手工壁轮廓，默认 LSN |
| JET | 2.85 | 0.80 | 3.86 | 4.8 | 手工壁轮廓，默认 LSN |
| ITER | 6.0 | 1.7 | 5.3 | 15.0 | 参数化壁（z0=0.35m 偏移），p_lh_factor=0.35 |

每台装置都包含 `wall_outline` — 一个定义第一壁/限制器几何的 (R, Z) 点多边形，用于可视化和打击点检测。

#### 关键函数

| 函数 | 描述 |
|----------|-------------|
| `Device::diiid()` | DIII-D 装置构造器 |
| `Device::jet()` | JET 装置构造器 |
| `Device::iter()` | ITER 装置构造器 |
| `Device::iter_wall()` | 从参数公式生成 ITER 壁 |
| `Device::by_id()` | 按字符串 ID 查找装置 |

---

### disruption.rs — 破裂模型

```
crates/tok-sym-core/src/disruption.rs (439 行)
```

建模**破裂风险评估和多阶段破裂动力学**。

#### 关键类型

| 类型 | 描述 |
|------|-------------|
| `DisruptionPhase` | 枚举：`Precursor`、`ThermalQuench`、`CurrentQuench`、`Complete` |
| `DisruptionModel` | 跟踪破裂阶段、时序和风险因素的状态机 |

#### 物理

**风险评估** 对四个稳定性指标使用 sigmoid 函数：
- **Greenwald 份额** f_GW：密度极限（风险在 f_GW ~ 0.85 以上上升）
- **归一化 beta** beta_N：Troyon 极限（风险随 beta_N 接近极限而上升）
- **安全因子** q95：扭曲极限（风险随 q95 降至约 2 以下而上升）
- **辐射份额** P_rad/P_in：辐射崩塌（风险在约 0.8 以上上升）

组合风险通过 xorshift PRNG 触发随机破裂发生。

**破裂动力学** 经过四个阶段：
1. **前兆**（50-100ms）：增长的 MHD 振荡
2. **热猝灭**（1-2ms）：快速能量损失，Te 崩溃至约 10-50 eV
3. **电流猝灭**（5-50ms）：Ip 通过 L/R 时间常数衰减，在开始时出现电流尖峰（Hiro 电流）
4. **完成**：终止状态

#### 关键函数

| 函数 | 描述 |
|----------|-------------|
| `DisruptionModel::new()` | 在稳定状态创建模型 |
| `DisruptionModel::step()` | 将破裂状态推进 dt |
| `DisruptionModel::risk()` | 返回组合破裂风险 [0, 1] |
| `DisruptionModel::risk_factors()` | 返回各个风险分量 |
| `sigmoid()` | 用于风险映射的平滑 sigmoid |
| `xorshift()` | 快速伪随机数生成器 |

---

### diagnostics.rs — 合成诊断

```
crates/tok-sym-core/src/diagnostics.rs (218 行)
```

生成**模拟真实托卡马克测量的合成诊断信号**。

#### 关键类型

| 类型 | 描述 |
|------|-------------|
| `DiagnosticSignals` | 14 个模拟诊断通道 |
| `NoiseGen` | 带 xorshift PRNG 的 Box-Muller 高斯噪声生成器 |

#### 诊断通道

Ip_measured、ne_line、te_ece、d_alpha、neutron_rate、bolometer、mirnov、
soft_xray、brem_vis、interferometer、mse_angle、ece_2nd、reflectometer、
z_eff_vis。

每个通道使用 Box-Muller 变换施加物理真实水平的测量噪声（1-10%，取决于诊断类型）用于高斯噪声。

---

### contour.rs — 磁通面提取

```
crates/tok-sym-core/src/contour.rs (637 行)
```

实现 **marching squares 算法**，从平衡求解器计算的 2D psi 网格中提取等值线。

#### 关键函数

| 函数 | 描述 |
|----------|-------------|
| `extract_contours()` | 在 2D 网格上的通用 marching squares |
| `extract_flux_surfaces()` | 从 psi 网格提取 N 条均匀间隔的磁通面 |
| `extract_separatrix()` | 提取分界磁面等值线（psi = psi_boundary），对双零拓扑特殊处理（返回所有链段用于偏滤器支腿） |
| `ContourPoint` | 等值线上的 (R, Z) 点 |
| `Contour` | 形成一条磁通面的点集合 |

marching squares 实现处理所有 16 种单元情况，包括使用中心值消歧的模糊鞍点情况（情况 5/10）。等值线链跨单元边界连接以产生连续曲线。

---

### simulation.rs — 协调器

```
crates/tok-sym-core/src/simulation.rs (1,266 行)
```

将所有物理模块绑定到连贯时间步进模拟中的**顶层协调器**。

#### 关键类型

| 类型 | 描述 |
|------|-------------|
| `DischargeProgram` | 完整放电规格：10 个波形通道（Ip、Bt、ne_target、P_NBI、P_ECH、P_ICH、kappa、delta、d2_puff、neon_puff）+ 持续时间 + config_override |
| `WaveformPoint` | `[f64; 2]` —（时间，值）对 |
| `SimulationSnapshot` | 完整状态转储：所有输运变量、平衡几何（分界磁面、磁通面、轴、X 点）、剖面、诊断、破裂状态 |
| `Simulation` | 主模拟结构：Device + TransportModel + Profiles + CerfonEquilibrium + DisruptionModel + DiagnosticSignals + DischargeProgram |

#### 放电预设

由 `DischargeProgram` 工厂方法构造的每台装置三个内置预设：

| 预设 | 描述 |
|--------|-------------|
| `hmode_preset()` | 标准 H 模：Ip 爬升 → NBI → L-H 转换 → H 模平顶 → 下降 |
| `lmode_preset()` | L 模：欧姆 + 适度 NBI，保持 L 模约束 |
| `density_limit_preset()` | 过度充气射击，突破 Greenwald 极限 |

预设将其波形缩放到每台装置的工程极限（Ip_max、Bt_max 等）。

#### 关键函数

| 函数 | 描述 |
|----------|-------------|
| `Simulation::new()` | 从装置 ID 和预设创建模拟 |
| `Simulation::from_program()` | 从自定义程序 JSON 创建模拟 |
| `Simulation::step()` | 推进一个时间步：插值波形 → 输运步进 → 平衡更新 → 剖面更新 → 等值线提取 → 诊断 |
| `Simulation::snapshot()` | 返回完整状态作为 `SimulationSnapshot` |
| `Simulation::is_finished()` | 当模拟时间超过程序持续时间时返回 true |
| `interp_waveform()` | 在时间 t 的波形线性插值 |
| `DischargeProgram::to_json()` | 为 WASM 边界序列化程序 |

---

### wasm_api.rs — WASM 边界

```
crates/tok-sym-core/src/wasm_api.rs (186 行)
```

定义 JavaScript/TypeScript 前端调用的 **wasm-bindgen API 表面**。

#### 导出类型

| 类型 | 描述 |
|------|-------------|
| `SimHandle` | 围绕 `Simulation` 的不透明包装器，暴露给 JS |

#### 导出函数

| 函数 | 签名 | 描述 |
|----------|-----------|-------------|
| `SimHandle::new()` | `(device_id: &str, preset: &str) -> SimHandle` | 从预设创建模拟 |
| `SimHandle::from_program()` | `(device_id: &str, json: &str) -> SimHandle` | 从自定义程序 JSON 创建 |
| `SimHandle::step()` | `(dt: f64)` | 推进一个时间步 |
| `SimHandle::snapshot_json()` | `() -> String` | 返回完整快照作为 JSON 字符串 |
| `SimHandle::wall_json()` | `() -> String` | 返回壁几何作为 JSON |
| `SimHandle::program_json()` | `() -> String` | 返回放电程序作为 JSON |
| `SimHandle::is_finished()` | `() -> bool` | 检查模拟是否完成 |
| `get_devices_json()` | `() -> String` | 将设备列表作为 JSON 数组列出 |
| `get_preset_json()` | `(device_id: &str, preset: &str) -> String` | 获取预设波形作为 JSON |

**重要设计决策：** 所有复杂数据以 JSON 字符串跨 WASM 边界传递。这避免了结构化数据的共享内存/类型化数组复杂性，并保持 API 简单。JSON 序列化开销与物理计算相比可忽略不计（约 0.1ms 序列化 vs 约 2ms 物理计算）。

---

## WASM 边界层

WASM 边界是 Rust 和 TypeScript 之间的关键接口。数据仅通过 JSON 字符串流动：

```
┌─────────────────────────────────────┐
│    TypeScript (browser)             │
│                                     │
│ SimHandle.step(dt)                  │ → void 调用，无数据
│ SimHandle.snapshot_json()           │ → JSON 字符串（每次快照约 5KB）
│ get_devices_json()                  │ → JSON 字符串（设备列表）
│ get_preset_json(dev, preset)        │ → JSON 字符串（波形）
│                                     │
└──────────────┬──────────────────────┘
               │ wasm-bindgen (JSON 字符串)
┌──────────────┴──────────────────────┐
│    Rust / WASM                      │
│                                     │
│ Simulation::step()                  │ 物理计算
│ serde_json::to_string()             │ 序列化快照
│                                     │
└─────────────────────────────────────┘
```

`SimHandle` 每次放电创建一次并复用。每个动画帧，TypeScript 侧调用 `step()` 多次（通常每帧 3 个子步，DT=0.005s），然后调用一次 `snapshot_json()` 获取显示状态。

---

## TypeScript 库层

### wasm.ts — WASM 初始化

```
web/src/lib/wasm.ts (99 行)
```

使用**单例初始化模式**管理 WASM 模块生命周期。

| 函数 | 描述 |
|----------|-------------|
| `initWasm()` | 加载并初始化 WASM 模块（启动时调用一次） |
| `isWasmReady()` | 成功初始化后返回 true |
| `getDevices()` | 从 WASM 返回 `Device` 对象数组 |
| `getDevice(id)` | 按 ID 返回单个设备 |
| `getPreset(deviceId, presetId)` | 返回带所有波形的 `DischargeProgram` |

同时重新导出 WASM 模块中的 `SimHandle` 供直接使用。

### types.ts — 接口定义

```
web/src/lib/types.ts (136 行)
```

镜像跨 WASM 边界 Rust 结构的 TypeScript 接口。

| 接口 | 字段 | 描述 |
|-----------|--------|-----------|
| `Contour` | points, is_closed | 磁通面等值线 |
| `DiagnosticSignals` | 14 个通道 | 合成诊断测量 |
| `SimStatus` | finished, time, duration | 模拟进度 |
| `Snapshot` | 约 92 个字段 | 完整等离子体状态（输运、平衡、剖面、诊断、破裂） |
| `TracePoint` | 约 21 个字段 | 用于历史图的单时间序列数据点 |
| `ProfileFrame` | time, te, ne, pressure | 某一瞬时的径向剖面 |
| `ProcessedProfile` | points[], rho[], thomson[] | 带合成汤姆孙散射的后处理剖面 |

### useSimulation.ts — 核心 React Hook

```
web/src/lib/useSimulation.ts (376 行)
```

ControlRoom 页面使用的**中央模拟管理 hook**。

#### 常量

| 常量 | 值 | 描述 |
|-----------|-------|-------------|
| `DT` | 0.005 | 物理时间步（5ms） |
| `MAX_TRACE_HISTORY` | 30,000 | 最大存储迹线点数 |
| `MAX_SNAPSHOT_HISTORY` | 2,000 | 最大存储完整快照数（用于擦洗） |

#### 状态（`SimState`）

跟踪：`snapshot`（最新）、`displaySnapshot`（当前显示 — 实时或擦洗）、`history`（迹线点数组）、`snapshotHistory`（用于时间擦洗的完整快照）、`running`、`wallJson`、`programJson`、`scrubTime`、`finished`、`processedProfiles`、`profileTeMax/profileNeMax/profilePMax`（全局轴限制）。

#### 控制（`SimControls`）

| 控制 | 描述 |
|---------|-------------|
| `start()` | 开始/恢复动画循环 |
| `pause()` | 停止动画循环 |
| `reset()` | 从当前预设重新创建 SimHandle |
| `switchPreset(device, preset)` | 切换设备和/或预设 |
| `runProgram(device, json)` | 从 Shot Planner 运行自定义程序 |
| `setScrubTime(t \| null)` | 擦洗到历史时间（或 null 返回实时） |
| `setSpeed(multiplier)` | 调整模拟速度（0.5x 到 2x） |

#### 动画循环

每次 `requestAnimationFrame` 滴答：
1. 计算每帧 `BASE_STEPS * speed` 个子步
2. 为每个子步调用 `simHandle.step(DT)`
3. 跨子步跟踪峰值 D-alpha（用于 ELM 捕获）
4. 捕获快照 JSON 并解析
5. 将迹线点附加到历史
6. 每约 50ms 存储完整快照用于擦洗
7. 完成时：处理剖面（汤姆孙散射），冻结显示

### fusionPhysics.ts — 客户端物理

```
web/src/lib/fusionPhysics.ts (369 行)
```

在 TypeScript 而非 WASM 中运行的**客户端聚变物理计算**，主要用于仅显示的派生量。

#### Bosch-Hale 反应率

实现 DT 和 DD 聚变反应率的 Bosch-Hale 参数化（NF 32, 611, 1992 的表 IV）。使用带 Gamow 能量的 7 系数有理函数拟合。

| 函数 | 描述 |
|----------|-------------|
| `boschHaleReactivity(T_keV, 'DT')` | DT 反应率 <sigma*v>，单位 m^3/s |
| `boschHaleReactivity(T_keV, 'DD_he3')` | DD→He3 分支反应率 |
| `boschHaleReactivity(T_keV, 'DD_T')` | DD→T 分支反应率 |

#### 聚变功率与 Q

| 函数 | 描述 |
|----------|-------------|
| `computeFusion(profiles, R0, a, kappa)` | 在 51 点剖面上的体积加权积分。返回 P_fus、P_alpha、neutron_rate、Q_plasma |

使用圆柱壳体积元 dV = 2*pi*R * 2*pi*r*dr * kappa，带环向几何的正确 Jacobian。

#### 偏滤器热通量

| 函数 | 描述 |
|----------|-------------|
| `computeDivertorHeatFlux(Psol, Bt, Ip, R0, ...)` | SOL 功率宽度的 Eich 定标 + 1D 热模型 |

计算：lambda_q（Eich 定标约 1.35/B_pol^0.9 mm）、通量展开（f_x=8）、峰值热通量、脱靶因子（f_GW 上的 sigmoid）、钨或碳的表面温度（1D 稳态热模型）。

### profileUtils.ts — 剖面后处理

```
web/src/lib/profileUtils.ts (124 行)
```

后处理径向剖面以添加**合成汤姆孙散射**诊断可视化。

| 常量 | 值 | 描述 |
|-----------|-------|-------------|
| `THOMSON_POINTS` | 45 | 合成汤姆孙散射通道数 |

| 函数 | 描述 |
|----------|-------------|
| `processProfileFrames()` | 为每个剖面帧生成汤姆孙散射点，具有非均匀径向分布（通过 r^0.6 边缘加权）、剖面相关噪声 |

使用 xorshift PRNG 和 Box-Muller 变换生成可复现的高斯噪声。

### targetTraces.ts — 目标迹线计算

```
web/src/lib/targetTraces.ts (134 行)
```

计算叠加在时间迹线图上的**目标/参考迹线**，显示放电程序的指令内容。

| 函数 | 描述 |
|----------|-------------|
| `interpWaveform(waveform, t)` | 在时间 t 的波形线性插值 |
| `ipb98y2(Ip, Bt, ne, ...)` | 用于目标 beta_N 估计的 IPB98(y,2) 定标律 |
| `computeTargetTraces(program, device)` | 在 100 个时间点计算 Ip 目标和 beta_N 目标 |

### settingsContext.tsx — 应用设置

```
web/src/lib/settingsContext.tsx (54 行)
```

提供**主题**（`classic` | `modern`）和**单位**（`metric` | `imperial`）设置的 React 上下文，带 localStorage 持久化。

---

## React 组件

### EquilibriumCanvas — 2D 截面

```
web/src/components/EquilibriumCanvas.tsx (382 行)
```

基于 Canvas API 的托卡马克极向截面渲染器。

**绘制内容：**
- 壁轮廓（来自装置几何或 CAD 限制器数据）
- 磁通面（从暖芯部到冷边缘的颜色映射）
- 分界磁面（带辉光效果的黄色）
- 磁轴（橙色十字准线标记）
- X 点（红色 X 标记）
- 带自适应刻度间距的 R/Z 坐标轴

处理断开的等值线环（例如双零 SOL 支腿），带跳跃检测。使用 `ResizeObserver` 实现响应式 canvas 尺寸。

---

### StatusPanel — 参数仪表盘

```
web/src/components/StatusPanel.tsx (620 行)
```

控制室中的主要**等离子体参数显示面板**，包含多个子面板。

#### 子面板

| 子面板 | 描述 |
|-----------|-------------|
| 模式徽章 | 显示 L 模 / H 模 / 破裂，带颜色编码 |
| 参数网格 | 12 个关键参数（Ip、Te0、ne、Wth、q95、beta_N、f_GW、H98、li、Vloop、Bt、tau_E），带警告/危险颜色阈值 |
| `PowerBalance` | 输入 vs 输出功率列，带比例条形图 |
| `QDisplay` | 聚变 Q 因子，带 EMA 平滑以稳定显示 |
| `NeutronDiagnostic` | 8 段信号条，对数刻度映射 |
| `DivertorLoading` | 热通量条 + 钨表面温度、再结晶警告 |
| `DisruptionRisk` | 引用 `DisruptionGauge` 的风险条 |
| 剖面切换 | 放电完成后切换到 `ProfilePanel` |

---

### UnifiedTracePanel — 时间迹线

```
web/src/components/UnifiedTracePanel.tsx
```

显示**19 个可配置时间迹线通道**，基于 canvas 渲染。

#### 可用迹线

Ip、beta_N、li、D_alpha、q95、H98、f_GW、ne_bar、ne_ped、Te0、Te_ped、
ne_line、Wth、Pin、Prad、Ploss、Vloop、f_imp、disruption_risk。

**默认集合：** Ip、beta_N、li、D_alpha。

功能：
- 通过下拉菜单选择迹线通道
- 目标迹线叠加（来自放电程序）
- 时间擦洗（点击/拖动擦洗历史）
- D-alpha 迹线上的 ELM 标记
- Y 轴自动缩放
- 所有迹线间同步时间光标

---

### ShotPlanner — 放电编辑器

```
web/src/components/ShotPlanner.tsx (394 行)
```

用于在运行前或运行中编辑放电参数的**滑出式抽屉**。

#### 可编辑参数

| 参数 | 单位 | 范围 |
|-----------|------|-----------|
| Ip 平顶 | MA | 0.1 - 20 |
| NBI 功率 | MW | 0 - 40 |
| ECH 功率 | MW | 0 - 20 |
| 密度目标 | 10^20 m^-3 | 0.1 - 3.0 |
| D2 气体注入 | 10^20/s | 0 - 10 |
| 氖注入 | 10^20/s | 0 - 2.0 |
| 拉长比 kappa | - | 1.0 - 2.2 |
| 三角变形 delta | - | 0.0 - 0.8 |

每个参数显示**迷你波形图**预览。规划器将基础预设的波形形状缩放到用户的目标准值，保留爬升/平顶/下降结构。

还支持：持续时间覆盖（带每装置限制）、磁位形选择器（仅 DIII-D：LSN、DN、USN）和基础预设切换。

状态**提升到 ControlRoom**，以便在抽屉开合间持久化。

---

### ProfilePanel — 径向剖面

```
web/src/components/ProfilePanel.tsx (274 行)
```

为电子温度 Te(rho)、电子密度 ne(rho) 和压强 P(rho) 径向剖面显示**并排 canvas 磁贴**。

功能：
- 带标记轴的网格线
- 剖面曲线渲染
- 汤姆孙散射叠加（带误差条的合成测量点）
- H 模 / L 模徽章
- 全局轴最大值，用于跨时间的一致缩放

---

### PortView (3D) — 托卡马克可视化

```
web/src/components/portview/ (8 个文件 + 着色器)
```

通过诊断端口窗口看到的托卡马克**基于 Three.js 的 3D 可视化**。

#### 子模块

| 文件 | 描述 |
|------|-------------|
| `index.tsx` | 主 React 组件、Three.js 场景生命周期、快照驱动更新 |
| `camera.ts` | 带装置特定 FOV 和角度的相机定位 |
| `config.ts` | 每装置配置（端口几何、不透明度/功率/辉光缩放） |
| `geometry.ts` | 从限制器多边形生成程序化壁网格 + 端口圆柱（环向旋转） |
| `wallMaterial.ts` | 自定义 GLSL 着色器：金属壁，带打击点照明 |
| `plasma.ts` | 等离子体体积渲染（来自分界磁面的半透明环向壳） |
| `glow.ts` | 偏滤器打击点辉光效果（带加法混合的公告板精灵） |
| `postprocessing.ts` | Bloom 通道 + 色调映射管线 |
| `types.ts` | `toroidal(R, Z, phi)` 坐标变换 + 工具类型 |

3D 视图显示：
- 环向壁段（限制器几何绕环旋转）
- 半透明等离子体体积（来自分界磁面形状）
- 偏滤器打击点辉光（从分界磁面-壁交点计算）
- H 模辉光平滑淡入/淡出，淡出期间打击位置冻结
- ELM 闪光（短暂清除颜色变化）
- 端口窗口框架

---

### 支持组件

| 组件 | 文件 | 描述 |
|-----------|------|-------------|
| `DisruptionGauge` | `DisruptionGauge.tsx` (100 行) | 带刻度标记的垂直条形仪表、颜色编码风险、单个风险因素行 |
| `InfoPopup` | `InfoPopup.tsx` (131 行) | 带视口钳制、外部点击关闭、Escape 键、大小调整处理的可复用弹窗 |
| `infoContent` | `infoContent.tsx` | 用于整个 UI 信息弹窗的物理说明内容 |
| `SettingsDropdown` | `SettingsDropdown.tsx` | 设置齿轮菜单：主题切换、单位切换、教程启动、参考文献链接 |
| `TutorialOverlay` | `TutorialOverlay.tsx` | 突出显示 UI 区域的多步交互式教程 |

---

## 页面与路由

```
App.tsx 路由：
  /                    → DeviceSelect
  /program/:deviceId   → ProgramDischarge
  /run/:deviceId       → ControlRoom
  /bibliography        → Bibliography
```

### DeviceSelect

带 DIII-D、JET、ITER 和 CENTAUR 卡片的落地页。每张卡片显示装置参数（R0、a、Bt、Ip）并链接到 ProgramDischarge 页面。

### ProgramDischarge

用于审查放电波形的运行前页面。为每台装置提供三种预设方案，带所有波形通道的迷你波形可视化。"运行放电"按钮导航到 ControlRoom。

### ControlRoom

主模拟页面。功能：
- **顶栏：** 装置选择器、预设选择器（按钮组）、播放控制（开始/暂停/重置）、速度选择器（0.5x-2x）、Shot Planner 切换
- **主网格：** 2x3 CSS 网格，EquilibriumCanvas（左上）、UnifiedTracePanel（右上，跨 2 列）、StatusPanel（左下，跨 2 列）、PortView（右下）
- **进度条：** 显示模拟时间进度的底部栏
- **Shot Planner：** 滑出式抽屉（固定右侧面板，z-50）
- **教程：** 由 URL 参数或设置触发的可选覆盖层

### Bibliography

全面的物理参考页面，含 23 个分类物理部分和 12 个同行评审参考文献。包括 DOI 链接、关于 0D 近似的免责声明以及 Columbia Fusion Research Center 的致谢。

---

## 数据流

```
                            ┌─────────────────────┐
                            │    DischargeProgram  │
                            │ (10 waveforms + duration)│
                            └──────────┬──────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────┐
│                   Simulation::step(dt)           │
│                                                 │
│ 1. interp_waveform() → ProgramValues            │
│ 2. TransportModel::step(dt, program_values)     │
│    ├── density evolution                        │
│    ├── power balance (ohmic + NBI + ECH - rad - transport)│
│    ├── L-H transition check                     │
│    ├── ELM model                                │
│    └── beta, q95, H98 computation               │
│ 3. Profiles::update_from_0d(transport_state)    │
│ 4. CerfonEquilibrium::update(kappa, delta, config)│
│ 5. extract_flux_surfaces(psi_grid)              │
│ 6. extract_separatrix(psi_grid)                 │
│ 7. DisruptionModel::step(risk_factors)          │
│ 8. DiagnosticSignals::update(state)             │
│                                                 │
└────────────────────────┬────────────────────────┘
                         │
                         ▼ snapshot_json()
              ┌──────────────────────┐
              │ JSON string          │ (~5KB per snapshot)
              │ across WASM          │
              └──────────┬───────────┘
                         │
                         ▼ JSON.parse()
              ┌────────────────────────────────────┐
              │         useSimulation hook         │
              │                                    │
              │ • Stores snapshot in React state   │
              │ • Appends TracePoint to history[]  │
              │ • Stores full snapshot for scrubbing│
              │ • Runs fusionPhysics.ts (Q, divertor)│
              │ • Post-processes profiles (Thomson) │
              │                                    │
              └───┬──────┬──────┬──────┬───────────┘
                  ▼      ▼      ▼      ▼
          EquilibriumCanvas  StatusPanel  UnifiedTrace   PortView
          (flux surfaces,    (parameters, (time traces,  (3D wall,
           separatrix,        power,       scrubbing)     plasma,
           wall, axis)        Q, divertor)                glow)
```

---

## 物理模型参考

完整引用和公式请参见应用中的[参考文献](/bibliography)页面。

| 模型 | 参考文献 | 使用位置 |
|-------|-----------|---------|
| Grad-Shafranov 平衡 | Cerfon & Freidberg, PoP 17, 2010 | `equilibrium.rs` |
| IPB98(y,2) 约束定标 | ITER Physics Basis, NF 39, 1999 | `transport.rs`, `targetTraces.ts` |
| Martin L-H 功率阈值 | Martin et al., J. Phys. Conf. Ser. 123, 2008 | `transport.rs` |
| Troyon beta 极限 | Troyon et al., PPCF 26, 1984 | `transport.rs` |
| Greenwald 密度极限 | Greenwald, PPCF 44, 2002 | `transport.rs`, `disruption.rs` |
| Tanh 台座剖面 | OMFIT 框架 | `profiles.rs` |
| Bosch-Hale 聚变反应率 | Bosch & Hale, NF 32, 1992 | `fusionPhysics.ts` |
| Eich 偏滤器热通量 | Eich et al., NF 53, 2013 | `fusionPhysics.ts` |
| Spitzer 电阻率 | Spitzer, Physics of Fully Ionized Gases, 1962 | `transport.rs`, `profiles.rs` |
| ELM 分类 | Zohm, PPCF 38, 1996 | `transport.rs` |
| Hiro 电流（破裂） | Boozer, PoP 19, 2012 | `disruption.rs` |
| 偏滤器设计 | Pitts et al., NME 12, 2017 | `fusionPhysics.ts` |

---

*本文档随代码库持续维护。最后更新：2026 年 3 月。*

*fusionsimulator.io 由 Daniel Burgess 和 Columbia Fusion Research Center 开发。*

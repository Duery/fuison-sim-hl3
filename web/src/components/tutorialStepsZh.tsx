export interface TutorialStepZh {
  target: string | null
  title: string
  content: React.ReactNode
  placement: 'right' | 'left' | 'center' | 'bottom-right' | 'bottom-left'
}

export const ZH_STEPS: TutorialStepZh[] = [
  {
    target: null,
    title: '欢迎进入聚变模拟器',
    placement: 'center',
    content: (
      <>
        <p>
          这里是托卡马克的<b>模拟控制室</b>。托卡马克利用强磁场约束环形高温等离子体，
          让氢同位素发生聚变反应。
        </p>
        <p className="mt-2">
          每次模拟称为一次<b>放电</b>或一炮。你可以设定等离子体电流、密度、加热功率和形状，
          然后实时观察磁平衡、诊断信号、稳定性和功率平衡如何响应。
        </p>
        <p className="mt-2 text-gray-400 text-[10px]">接下来会依次介绍控制室中的主要区域。</p>
      </>
    ),
  },
  {
    target: '[data-tutorial="equilibrium"]',
    title: '磁平衡截面',
    placement: 'right',
    content: (
      <>
        <p>这是托卡马克的极向截面，相当于把环形装置沿竖直方向切开观察。</p>
        <p className="mt-2 text-cyan-300 font-semibold text-[11px]">磁通面与分离面</p>
        <p>
          彩色闭合曲线是磁通面；最外层闭合磁通面称为分离面。X 点附近的开放磁力线把逃逸粒子和热流
          引向偏滤器靶板。等离子体的伸长率 κ 和三角度 δ 会影响约束与稳定性。
        </p>
        <p className="mt-2">
          HL-3 的壁轮廓采用 2m 工程绘图数据，不再使用光滑的参数化 D 形近似。
        </p>
      </>
    ),
  },
  {
    target: '[data-tutorial="traces"]',
    title: '时间迹线',
    placement: 'bottom-left',
    content: (
      <>
        <p>该面板像真实控制室中的示波器一样，连续显示关键参数随放电时间的变化。</p>
        <p className="mt-2">
          虚线表示预设目标，实线表示模拟得到的等离子体响应。放电结束后，可在图上拖动时间位置，
          回看任意时刻的平衡和诊断状态。
        </p>
      </>
    ),
  },
  {
    target: '[data-tutorial="status"]',
    title: '等离子体状态与功率平衡',
    placement: 'bottom-right',
    content: (
      <>
        <p>
          这里汇总 Iₚ、Bₜ、中心电子温度、线平均密度、储能和能量约束时间，并显示加热、辐射与输运损失。
        </p>
        <p className="mt-2">
          q₉₅、βN 和 Greenwald 分数反映离运行极限还有多远。风险升高时应降低激进的电流、密度或加热设定。
        </p>
        <p className="mt-2">
          中子率和 Q<sub>plasma</sub> 用于观察聚变性能；小型 D-D 装置的 Q 很低属于正常现象。
        </p>
      </>
    ),
  },
  {
    target: '[data-tutorial="status"]',
    title: '偏滤器热负荷',
    placement: 'bottom-right',
    content: (
      <>
        <p>
          穿过分离面的功率沿刮削层流向偏滤器，形成很窄的高热流带。面板显示峰值热流、脱靶程度和靶板表面温度。
        </p>
        <p className="mt-2">
          钨在约 1200–1300°C 以上会发生重结晶。可通过降低输入功率、杂质注入促进辐射冷却，或调整磁位形来减轻负荷。
        </p>
      </>
    ),
  },
  {
    target: '[data-tutorial="portview"]',
    title: '三维端口视图',
    placement: 'left',
    content: (
      <>
        <p>这是透过诊断端口观察真空室内部的三维示意，类似实验中的可见光或红外相机视角。</p>
        <p className="mt-2">
          中央发光区域表示等离子体，底部结构表示偏滤器；颜色和亮度用于定性呈现等离子体与壁面热负荷状态。
        </p>
      </>
    ),
  },
  {
    target: null,
    title: '开始你的放电实验',
    placement: 'center',
    content: (
      <>
        <p className="text-cyan-300 font-semibold">尝试同时做到：</p>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>避免破裂，不让储能在毫秒时间内倾泻到壁面；</li>
          <li>控制 ELM 及偏滤器热负荷；</li>
          <li>提高温度、密度和约束性能，同时不越过稳定性极限；</li>
          <li>比较不同装置、场景和自定义波形产生的响应。</li>
        </ul>
        <div className="mt-3 rounded border border-gray-700/50 bg-gray-800/60 p-2">
          <p className="font-semibold text-cyan-300">建议</p>
          <p className="mt-1">先从 DIII-D 或 HL-3 的标准场景开始，再逐步尝试高场和大型装置。</p>
        </div>
      </>
    ),
  },
]

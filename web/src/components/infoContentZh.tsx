import type { ReactNode } from 'react'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-3">
      <h4 className="mb-1 font-semibold text-cyan-300">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}

export const equilibriumInfo = (
  <>
    <Section title="Grad–Shafranov 平衡">
      <p>
        轴对称托卡马克中，等离子体压强梯度与磁力必须平衡。极向磁通 ψ 的等值线构成嵌套磁通面；
        最外层闭合磁通面称为 LCFS 或分离面。
      </p>
      <p>
        本模拟器采用 Cerfon–Freidberg 解析解，在 Solov&apos;ev 假设下用形状约束快速求解，不等同于
        实验中利用磁探针、磁通环等测量反演得到的 EFIT 平衡。
      </p>
    </Section>
    <Section title="图中元素">
      <p>磁轴位于磁通极值处；X 点是极向磁场为零的位置；开放磁力线从 X 点区域延伸到偏滤器靶板。</p>
      <p>HL-3 的第一壁采用 2m 工程轮廓。动态等离子体边界仍由解析平衡模型计算。</p>
    </Section>
  </>
)

const traceDescriptions: Record<string, string> = {
  ip: '等离子体环向电流，产生约束所需的极向磁场。',
  beta_n: '归一化比压，衡量等离子体压强相对磁场强度与电流的水平。',
  li: '内感，反映电流剖面的尖峰程度。',
  d_alpha: '氘 Balmer-α 边缘辐射，常用于观察再循环、L–H 转换与 ELM。',
  q95: '95% 极向磁通面处的安全因子，过低会接近外扭曲模极限。',
  h98: '能量约束相对 IPB98(y,2) 定标的比例。',
  f_gw: '线平均密度相对 Greenwald 密度极限的比例。',
  ne: '线平均电子密度；这是沿干涉仪弦线得到的平均量，不是局域点密度。',
  te0: '磁轴附近的中心电子温度。真实实验可由 ECE 或 Thomson 散射约束。',
  w_th: '等离子体总热储能。',
  p_input: '欧姆及辅助加热输入功率。',
  p_rad: '总辐射功率，包含轫致辐射和杂质线辐射。',
  p_fus: '由 D–D 或 D–T 反应产生的总聚变功率。',
  p_loss: '穿过分离面进入刮削层的输运损失功率。',
  v_loop: '驱动等离子体电流的环电压。',
  impurity_fraction: '杂质离子相对主燃料离子的比例。',
  disruption_risk: '基于多个运行极限构造的定性破裂风险指标。',
}

export function traceInfoContent(traces: { key: string; base: string; sub: string; unit: string; color: string }[]) {
  return (
    <>
      <p className="mb-2">时间迹线显示一次放电中关键等离子体参数的演化。各迹线按模拟时间步更新。</p>
      {traces.map((trace) => (
        <div key={trace.key} className="mb-2 border-l-2 pl-2" style={{ borderColor: trace.color }}>
          <div className="font-semibold text-gray-200">
            {trace.base}<sub>{trace.sub}</sub>
            {trace.unit && <span className="ml-1 font-normal text-gray-500">[{trace.unit}]</span>}
          </div>
          <p className="mt-0.5 text-[10px] leading-relaxed text-gray-400">
            {traceDescriptions[trace.key] ?? '模拟诊断或派生状态量。'}
          </p>
        </div>
      ))}
    </>
  )
}

export const plasmaParamsInfo = (
  <>
    <Section title="核心状态量">
      <p><b>Iₚ</b> 是等离子体电流，<b>Bₜ</b> 是外部线圈产生的环向磁场。</p>
      <p><b>Tₑ₀</b> 表示中心电子温度，<b>n̄ₑ</b> 表示线平均电子密度，二者共同影响反应率和约束。</p>
      <p><b>Wₜₕ</b> 是热储能，<b>τE = Wₜₕ/Ploss</b> 是能量约束时间。</p>
    </Section>
    <p className="text-gray-500">这些量来自 0D 输运与解析剖面模型，适合定性比较，不代表真实装置的逐诊断重建结果。</p>
  </>
)

export const stabilityInfo = (
  <>
    <Section title="运行极限">
      <p><b>q₉₅</b> 过低会接近外扭曲模极限；<b>βN</b> 过高会接近 Troyon 比压极限。</p>
      <p><b>fGW</b> 是 Greenwald 密度分数；接近或超过 1 时，辐射坍缩与密度极限破裂风险升高。</p>
      <p><b>H98</b> 表示相对 IPB98(y,2) 定标的约束水平；<b>lᵢ</b> 反映电流剖面尖峰程度。</p>
    </Section>
    <p className="text-gray-500">风险条是教学用综合指标，并非经实验验证的实时破裂预测器。</p>
  </>
)

export const powerBalanceInfo = (
  <>
    <Section title="0D 功率平衡">
      <p className="text-center text-cyan-300">dWₜₕ/dt = P输入 − P输运损失 − P辐射</p>
      <p>输入包括欧姆加热、NBI、ECH、ICH，以及 D–T 场景中的 α 粒子自加热。</p>
      <p>输出包括跨分离面的输运损失和电磁辐射。稳态时，输入与输出近似平衡。</p>
    </Section>
    <Section title="聚变增益">
      <p><b>Q = P聚变/P外部加热</b>。Q = 1 表示功率盈亏平衡，ITER 的设计目标为 Q ≥ 10。</p>
    </Section>
  </>
)

export const divertorInfo = (
  <>
    <Section title="刮削层与偏滤器">
      <p>穿过分离面的功率沿开放磁力线到达偏滤器靶板。狭窄的 SOL 功率宽度会形成很高的峰值热流。</p>
      <p>高密度和杂质注入可促进脱靶，使能量在到达靶板前通过辐射和复合耗散。</p>
    </Section>
    <Section title="材料限制">
      <p>钨在约 1200–1300°C 以上会发生重结晶，长期热循环下更易脆化和开裂。</p>
      <p>这里使用 0D 集总热模型，不能解析 ELM 在薄表层产生的真实瞬态温度峰值。</p>
    </Section>
  </>
)

export const neutronDiagnosticInfo = (
  <>
    <Section title="中子与聚变性能">
      <p>D–T 反应产生 14.1 MeV 中子，D–D 的中子支路产生 2.45 MeV 中子。中子率是聚变反应强度的直接指标。</p>
      <p>真实装置通常使用裂变室、活化箔和中子相机；本模拟器依据 Bosch–Hale 反应率参数化计算总中子源。</p>
    </Section>
  </>
)

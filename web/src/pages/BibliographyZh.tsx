import { Link } from 'react-router-dom'

function ModelCard({ title, children, reference }: { title: string; children: React.ReactNode; reference?: React.ReactNode }) {
  return (
    <article className="border border-gray-800 bg-gray-900/70 p-5">
      <h2 className="font-mono text-sm font-semibold text-cyan-300">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-gray-400">{children}</div>
      {reference && <div className="mt-4 border-t border-gray-800 pt-3 text-xs text-gray-600">{reference}</div>}
    </article>
  )
}

export default function BibliographyZh() {
  return (
    <div className="page-enter min-h-screen bg-[var(--c-base)]">
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-800 bg-[var(--c-base)]/90 px-6 py-3 backdrop-blur sm:px-10">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.18em] text-gray-500 transition-colors hover:text-cyan-400">
          ← 返回装置选择
        </Link>
        <span className="font-mono text-[11px] tracking-[0.22em] text-gray-300">fusionsimulator<span className="text-gray-600">.io</span></span>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
        <div className="panel-title"><span className="panel-num">04 · </span>物理模型与参考文献</div>
        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">模拟器采用了哪些物理近似？</h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-400">
          本页说明公式、适用范围和主要来源。fusionsimulator.io 是教学型 0D/解析模型，
          适合比较趋势和运行场景，不是预测性输运程序，也不能替代真实装置的平衡重建或诊断分析。
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <ModelCard title="MHD 平衡：Cerfon–Freidberg" reference="A. Cerfon & J. Freidberg, Physics of Plasmas 17, 032502 (2010).">
            <p>在 Solov&apos;ev 假设下求解 Grad–Shafranov 方程的解析形式，用伸长率、三角度和 X 点等形状约束确定系数。</p>
            <p className="text-cyan-300">Δ*ψ = −R μ₀ jφ</p>
            <p>优点是计算快速；局限是不能复现实验 EFIT 的所有电流、压强和边界细节。</p>
          </ModelCard>

          <ModelCard title="0D 功率平衡与能量约束" reference="ITER Physics Basis, Nuclear Fusion 39 (1999); IPB98(y,2).">
            <p className="text-cyan-300">dWth/dt = P输入 − Wth/τE − P辐射</p>
            <p>能量约束时间由 IPB98(y,2) 定标估算，并叠加装置与场景修正。平均温度由总储能和粒子数反推。</p>
          </ModelCard>

          <ModelCard title="L–H 转换、密度与比压极限" reference="Martin et al. (2008); Greenwald (2002); Troyon et al. (1984).">
            <p>净加热功率超过 Martin 阈值时进入 H 模。Greenwald 分数用于描述密度极限，βN 用于描述归一化比压水平。</p>
            <p>这些经验定标适合趋势分析，不应当作所有装置和工况通用的硬阈值。</p>
          </ModelCard>

          <ModelCard title="聚变反应率与 Q" reference="H.-S. Bosch & G. M. Hale, Nuclear Fusion 32, 611 (1992).">
            <p>采用 Bosch–Hale 参数化计算 D–D 和 D–T 热核反应率，再沿径向剖面积分得到聚变功率和中子源。</p>
            <p className="text-cyan-300">Q = P聚变 / P外部加热</p>
          </ModelCard>

          <ModelCard title="偏滤器与热模型" reference="Eich et al., Nuclear Fusion 53, 093031 (2013).">
            <p>刮削层功率宽度采用 Eich 定标；偏滤器表面温度使用单层集总热容模型。</p>
            <p>该近似能表示稳态趋势，但会低估 ELM 在薄表层产生的快速温度峰值。</p>
          </ModelCard>

          <ModelCard title="径向剖面与 ELM">
            <p>H 模温度和密度采用 mtanh 台座剖面，L 模采用抛物线型剖面。ELM 按类型设置能量损失比例与重复频率。</p>
            <p>模拟器中的 ELM 是低维事件模型，不解析剥离–气球模的完整非线性演化。</p>
          </ModelCard>
        </div>

        <section className="mt-12">
          <h2 className="panel-title">主要参考资料</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-500">
            <li>J. Wesson, <i>Tokamaks</i>, 4th ed., Oxford University Press (2011).</li>
            <li>J. Freidberg, <i>Ideal MHD</i>, Cambridge University Press (2014).</li>
            <li>ITER Physics Expert Groups, “ITER Physics Basis,” <i>Nuclear Fusion</i> 39 (1999).</li>
            <li>H.-S. Bosch & G. M. Hale, “Improved formulas for fusion cross-sections and thermal reactivities,” <i>Nuclear Fusion</i> 32 (1992).</li>
            <li>T. Eich et al., “Scaling of the tokamak near the scrape-off layer H-mode power width,” <i>Nuclear Fusion</i> 53 (2013).</li>
          </ul>
        </section>
      </main>
    </div>
  )
}

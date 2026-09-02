export default function Hl3ContextPanel() {
  return (
    <section className="mb-10 border border-cyan-900/50 bg-cyan-950/10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/40 px-4 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-500">
            HL-3 实验背景
          </div>
          <h2 className="mt-1 text-lg font-semibold text-white">环流三号（原 HL-2M）</h2>
        </div>
        <div className="font-mono text-[10px] text-gray-500">中国成都 · 核工业西南物理研究院</div>
      </div>

      <div className="grid gap-px bg-gray-800/80 md:grid-cols-4">
        {[
          ['大半径 R₀', '1.78 m'],
          ['小半径 a', '约 0.65 m'],
          ['环向磁场 Bₜ', '仿真上限 2.3 T'],
          ['等离子体电流 Iₚ', '仿真上限 3.0 MA'],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#0b111c] px-4 py-3">
            <div className="text-[10px] text-gray-600">{label}</div>
            <div className="mt-1 font-mono text-sm text-gray-200">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-3">
        <article>
          <h3 className="font-mono text-xs font-semibold text-cyan-300">ECE · 电子回旋辐射</h3>
          <p className="mt-2 text-xs leading-relaxed text-gray-400">
            40 路 DMW 与 56 路 MDR，共 96 路配置。它测量共振层附近的局域电子温度；通道位置会随
            Bₜ 和磁平衡变化，不能把固定通道号当作固定半径。
          </p>
        </article>
        <article>
          <h3 className="font-mono text-xs font-semibold text-amber-300">SXR · 软 X 射线</h3>
          <p className="mt-2 text-xs leading-relaxed text-gray-400">
            资料给出 176 个有效/配置通道，典型采样 100 kHz–1 MHz。每一路都是沿视线的辐射积分，
            同时受 Tₑ、nₑ、杂质与滤片响应影响，不是一个空间点。
          </p>
        </article>
        <article>
          <h3 className="font-mono text-xs font-semibold text-fuchsia-300">Mirnov · 高频磁线圈</h3>
          <p className="mt-2 text-xs leading-relaxed text-gray-400">
            MDBP 41 路与 NDBPL/NDBPH 各 12 路，典型采样约 1 MHz。单线圈测量局域 dB/dt；只有结合
            阵列角度、方向、极性与相位，才能分析 m/n 模结构。
          </p>
        </article>
      </div>

      <div className="border-t border-gray-800 px-4 py-4">
        <h3 className="font-mono text-xs font-semibold text-rose-300">锯齿预测目标</h3>
        <p className="mt-2 text-xs leading-relaxed text-gray-400">
          研究任务分为三类：在一次 crash 后估计下一周期长度；在周期进行中持续更新未来
          1/2/5/10/20 ms 内发生 crash 的概率；在 crash 前判断崩塌幅度及其触发 (2/1)
          撕裂模或 NTM 的风险。第一版应以动态映射后的 ECE 与 Mirnov 快信号为主要提前输入，
          SXR 先用于独立生成和复核 crash 标签；crash 后才出现的热脉冲、信号下降或 (2/1) 模不能回填到预测窗口。
        </p>
      </div>

      <div className="border-t border-gray-800 px-4 py-3 text-[11px] leading-relaxed text-gray-500">
        <span className="font-semibold text-gray-300">本模拟器的边界：</span>
        当前模型采用 0D 输运与解析 MHD 平衡，用于教学和定性探索；上面的真实诊断阵列信息是 HL-3
        实验背景，并不表示模拟器已经逐通道复现 ECE、SXR 或 Mirnov 的测量响应。
      </div>
    </section>
  )
}

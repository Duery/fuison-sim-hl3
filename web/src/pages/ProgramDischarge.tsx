import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getDevice,
  getPreset,
  type PresetId,
  type WaveformPoint,
  type DischargeProgram,
} from '../lib/wasm'
import Hl3ContextPanel from '../components/Hl3ContextPanel'

// ── Preset metadata ──────────────────────────────────────────────
const ALL_PRESETS: { id: PresetId; name: string; desc: string; color: string }[] = [
  {
    id: 'hmode',
    name: '标准 H 模',
    desc: '等离子体电流爬升 → 中性束加热 → L-H 转换 → H 模平台 → 下降段',
    color: 'cyan',
  },
  {
    id: 'lmode',
    name: 'L 模',
    desc: '欧姆加热配合适度中性束加热，全程保持 L 模约束',
    color: 'amber',
  },
  {
    id: 'density_limit',
    name: '密度极限',
    desc: '过量加料，将密度推过 Greenwald 极限，观察是否发生破裂',
    color: 'red',
  },
]

// CENTAUR uses negative-triangularity edge mode, not conventional H/L-mode
const CENTAUR_PRESETS: typeof ALL_PRESETS = [
  {
    id: 'hmode',
    name: '负三角边缘模',
    desc: '负三角形变边缘运行，无 ELM 的高约束场景',
    color: 'cyan',
  },
  {
    id: 'density_limit',
    name: '密度极限',
    desc: '过量加料，将密度推过 Greenwald 极限，观察是否发生破裂',
    color: 'red',
  },
]

function getPresets(deviceId: string) {
  return deviceId === 'centaur' ? CENTAUR_PRESETS : ALL_PRESETS
}

// ── Mini sparkline SVG for a waveform ────────────────────────────
// Uses a wide viewBox (600px) to minimize aspect ratio distortion
// when the SVG is scaled to fill its container.
function Sparkline({
  points,
  duration,
  color = '#22d3ee',
  height = 32,
}: {
  points: WaveformPoint[]
  duration: number
  color?: string
  height?: number
}) {
  if (points.length < 2) return null

  const vals = points.map((p) => p[1])
  const vMin = Math.min(...vals, 0)
  const vMax = Math.max(...vals) * 1.1 || 1

  const w = 600 // wide viewBox to match typical rendered aspect ratio
  const h = height
  const pad = 2
  const toX = (t: number) => pad + (t / duration) * (w - 2 * pad)
  const toY = (v: number) => pad + (h - 2 * pad) - ((v - vMin) / (vMax - vMin)) * (h - 2 * pad)

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p[0]).toFixed(1)} ${toY(p[1]).toFixed(1)}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <path
        className="trace-sweep"
        pathLength={1}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Waveform row in the detail panel ─────────────────────────────
function WaveformRow({
  label,
  unit,
  title,
  points,
  duration,
  color,
}: {
  label: string
  unit: string
  title: string
  points: WaveformPoint[]
  duration: number
  color: string
}) {
  const peak = Math.max(...points.map((p) => p[1]))
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-20 text-right text-xs text-gray-500 shrink-0 cursor-help"
        title={unit ? `${title} (${unit})` : title}
      >
        {label}
        {unit && <span className="text-gray-600 ml-1">({unit})</span>}
      </div>
      <div className="flex-1 bg-gray-950 rounded px-2 py-1">
        <Sparkline points={points} duration={duration} color={color} />
      </div>
      <div className="w-14 text-right text-xs text-gray-400 font-mono shrink-0">
        {peak.toFixed(1)}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function ProgramDischarge() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const navigate = useNavigate()

  const device = useMemo(() => (deviceId ? getDevice(deviceId) : null), [deviceId])
  const [selected, setSelected] = useState<PresetId>('hmode')

  // Load the selected preset's waveforms
  const program: DischargeProgram | null = useMemo(
    () => (deviceId ? getPreset(deviceId, selected) : null),
    [deviceId, selected],
  )

  if (!device) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        未知装置：{deviceId}
      </div>
    )
  }

  const accentColor =
    selected === 'hmode' ? '#e0a23a' : selected === 'lmode' ? '#56B4E9' : '#c8553d'

  return (
    <div className="page-enter min-h-screen flex flex-col">
      {/* ── Top nav ── */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-3 border-b border-gray-800">
        <button
          onClick={() => navigate('/')}
          className="font-mono text-[10px] tracking-[0.18em] uppercase text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer"
        >
          ← 返回装置选择
        </button>
        <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-gray-300">
          fusionsimulator<span className="text-gray-600">.io</span>
        </span>
      </nav>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-10 py-12">
        {/* Header */}
        <div className="panel-title mb-2">
          <span className="panel-num">02 · </span>编排放电
        </div>
        <h1 className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          {device.name}
        </h1>
        <p className="text-gray-500 text-sm font-mono mb-10">
          选择运行场景，检查各控制波形，然后启动模拟。
        </p>

        {/* Scenario selector — hairline-tiled */}
        {deviceId === 'hl3' && <Hl3ContextPanel />}

        <div className="panel-title pb-2 mb-px">运行场景</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--c-line)] border-y border-gray-800 mb-10">
          {getPresets(deviceId ?? '').map((p) => {
            const isSelected = p.id === selected
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`relative p-4 text-left transition-colors cursor-pointer
                  ${isSelected ? 'bg-[var(--c-raised)]' : 'bg-gray-900 hover:bg-[var(--c-raised)]'}`}
              >
                {isSelected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-500" />}
                <h3 className={`font-mono text-[11px] uppercase tracking-wider mb-1.5 ${isSelected ? 'text-cyan-400' : 'text-gray-300'}`}>
                  {p.name}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">{p.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Waveform detail */}
        {program && (
          <div className="mb-10">
            <div className="flex items-baseline justify-between mb-3 border-b border-gray-800 pb-2">
              <h2 className="panel-title">预设控制波形</h2>
              <span className="text-xs text-gray-500 font-mono tabular-nums">
                持续时间 {program.duration.toFixed(1)} 秒
              </span>
            </div>

            <div className="space-y-2" key={selected}>
              <WaveformRow label="Iₚ" unit="MA" title="等离子体电流" points={program.ip} duration={program.duration} color={accentColor} />
              <WaveformRow label="Bₜ" unit="T" title="环向磁场" points={program.bt} duration={program.duration} color={accentColor} />
              <WaveformRow label="n̄ₑ" unit="10²⁰m⁻³" title="线平均电子密度" points={program.ne_target} duration={program.duration} color={accentColor} />
              <WaveformRow label="P_NBI" unit="MW" title="中性束注入功率" points={program.p_nbi} duration={program.duration} color={accentColor} />
              <WaveformRow label="P_ECH" unit="MW" title="电子回旋加热功率" points={program.p_ech} duration={program.duration} color={accentColor} />
              <WaveformRow label="P_ICH" unit="MW" title="离子回旋加热功率" points={program.p_ich} duration={program.duration} color={accentColor} />
              <WaveformRow label="κ" unit="" title="伸长率" points={program.kappa} duration={program.duration} color={accentColor} />
              <WaveformRow label="δ" unit="" title="三角度" points={program.delta} duration={program.duration} color={accentColor} />
            </div>
          </div>
        )}

        {/* Run button */}
        <button
          onClick={() => navigate(`/run/${deviceId}?preset=${selected}`)}
          className="bg-cyan-600 px-8 py-3 text-base cursor-pointer"
        >
          ▶ 启动放电模拟
        </button>
      </main>
    </div>
  )
}

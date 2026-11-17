import { clamp } from './numerics'

type Signal = readonly (number | null)[]
const wrap = (radians: number) => Math.atan2(Math.sin(radians), Math.cos(radians))

export function estimatePhase(x: Signal, y: Signal, sampleRate: number, frequency: number) {
  if (!Number.isFinite(sampleRate) || !Number.isFinite(frequency) || frequency <= 0 || frequency >= sampleRate/2 || x.length !== y.length) return null
  const segment = Math.round(6*sampleRate/frequency)
  const stride = Math.floor(segment/2)
  if (segment < 12 || segment > x.length) return null
  let xx = 0, yy = 0, crossRe = 0, crossIm = 0, windows = 0, attempted = 0
  for (let start = 0; start+segment <= x.length; start += stride) {
    attempted++
    const a = x.slice(start,start+segment)
    const b = y.slice(start,start+segment)
    if (a.some(v => v === null || !Number.isFinite(v)) || b.some(v => v === null || !Number.isFinite(v))) continue
    const coefficient = (samples: Signal) => {
      const mean = samples.reduce<number>((sum,value) => sum + Number(value),0)/segment
      let real = 0, imaginary = 0
      samples.forEach((value,index) => {
        const w = 0.5-0.5*Math.cos(2*Math.PI*index/segment)
        const theta = 2*Math.PI*frequency*index/sampleRate
        real += w*(Number(value)-mean)*Math.cos(theta)
        imaginary -= w*(Number(value)-mean)*Math.sin(theta)
      })
      return [real,imaginary]
    }
    const [ar,ai] = coefficient(a)
    const [br,bi] = coefficient(b)
    xx += ar*ar+ai*ai
    yy += br*br+bi*bi
    crossRe += ar*br+ai*bi
    crossIm += ai*br-ar*bi
    windows++
  }
  if (windows < 3 || windows / attempted < 0.5 || xx < 1e-16 || yy < 1e-16 || Math.hypot(crossRe,crossIm) < 1e-16) return null
  const coherence = clamp((crossRe**2+crossIm**2)/(xx*yy),0,1)
  return { phaseDeg:wrap(Math.atan2(crossIm,crossRe))*180/Math.PI, coherence, windows,
    quality: coherence >= 0.85 ? 'Eligible for review' : 'Insufficient coherence' }
}

export function syntheticPhase(fs: number, f: number, deg: number, noise: number, dropout: boolean) {
  let state = 0x71e01
  const perturb = () => {
    state = (Math.imul(1664525,state)+1013904223) >>> 0
    return (2*state/0xffffffff-1)*noise
  }
  const points = Array.from({length: Math.round(4*fs)}, (_,i) => ({
    t:i/fs,
    x:Math.sin(2*Math.PI*f*i/fs)+perturb(),
    y:dropout && i >= fs && i < fs*3.5 ? null : Math.sin(2*Math.PI*f*i/fs-deg*Math.PI/180)+perturb(),
  }))
  return { points, estimate:estimatePhase(points.map(p => p.x),points.map(p => p.y),fs,f) }
}

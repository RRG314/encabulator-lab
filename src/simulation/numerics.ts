export const rpmToRad = (rpm: number) => rpm * 2 * Math.PI / 60
export const radToRpm = (rad: number) => rad * 60 / (2 * Math.PI)
export const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x))

export function integrate(initial: number[], end: number, maxStep: number,
  derivative: (t: number, state: number[]) => number[], recordEvery = 1) {
  const steps = Math.ceil(end / maxStep)
  if (!Number.isFinite(steps) || steps < 1 || steps > 100_000 || !Number.isInteger(recordEvery) || recordEvery < 1) {
    throw new RangeError('Time grid is outside the supported integration range')
  }
  const step = end / steps
  let state = initial.slice()
  const points = [{ t: 0, state }]
  const offset = (y: number[], rate: number[], h: number) => y.map((value, i) => value + rate[i] * h)
  for (let i = 0; i < steps; i++) {
    const t = i * step
    const a = derivative(t, state)
    const b = derivative(t + step/2, offset(state, a, step/2))
    const c = derivative(t + step/2, offset(state, b, step/2))
    const d = derivative(t + step, offset(state, c, step))
    state = state.map((value, j) => value + step * (a[j] + 2*b[j] + 2*c[j] + d[j]) / 6)
    if (state.some(value => !Number.isFinite(value))) throw new Error('Numerical solution diverged')
    if ((i+1) % recordEvery === 0 || i+1 === steps) points.push({ t: (i+1) * step, state })
  }
  return points
}

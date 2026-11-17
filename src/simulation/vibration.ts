import { integrate, rpmToRad } from './numerics'

export type VibratoryInput = { mass: number, stiffness: number, damping: number, rpm: number, unbalance: number }

export function responseAmplitude(mass: number, stiffness: number, damping: number, omega: number, force: number) {
  return force / Math.hypot(stiffness - mass*omega**2, damping*omega)
}

export function vibration(input: VibratoryInput, stop = 1.1, dtMaximum = 0.001) {
  const {mass, stiffness, damping, rpm, unbalance} = input
  const omega = rpmToRad(rpm)
  const wn = Math.sqrt(stiffness/mass)
  const zeta = damping/(2*Math.sqrt(stiffness*mass))
  const acceleration = (t: number,y: number,v: number) => (unbalance*omega**2*Math.cos(omega*t)-damping*v-stiffness*y)/mass
  const dt = Math.min(dtMaximum,2*Math.PI/(60*Math.max(omega,wn,damping/mass,1)))
  const time = integrate([0,0], stop, dt, (t,[y,v]) => [v,acceleration(t,y,v)],
    Math.max(1,Math.round(stop/dt/360))).map(({t,state:[y,v]}) => ({t,y,a:acceleration(t,y,v)}))
  const sweep = Array.from({length:201},(_,i) => {
    const f = i/200*2.2*wn/(2*Math.PI)
    const w = 2*Math.PI*f
    return { f, amplitude: responseAmplitude(mass,stiffness,damping,w,unbalance*w*w) }
  })
  return { fn:wn/(2*Math.PI), zeta, time, sweep }
}

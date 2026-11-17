import { integrate, radToRpm, rpmToRad } from './numerics'

export type RotorInput = { inertia: number, torque: number, drag: number, aero: number, load: number }
export const unbalanceForce = (unbalanceKgM: number, rpm: number) => unbalanceKgM * rpmToRad(rpm)**2

export function rotor(input: RotorInput, end = 12, step = 0.02) {
  const { inertia, torque, drag, aero, load } = input
  const rate = (w: number) => (torque - load - drag*w - aero*w*Math.abs(w))/inertia
  return integrate([0], end, step, (_, [w]) => [rate(w)], 2).map(({t,state:[w]}) => ({
    t, rpm: radToRpm(w), acceleration: rate(w), torque: inertia*rate(w),
    inputPower: torque*w, dissipatedPower: drag*w*w + aero*Math.abs(w)**3,
  }))
}

export function idealSpinup(t: number, torque: number, inertia: number, drag: number) {
  return drag > 0 ? -torque * Math.expm1(-drag*t/inertia)/drag : torque*t/inertia
}

export function torsion(J1: number, J2: number, stiffness: number, damping: number, torque: number,
  end = 2, timestep = 0.002) {
  const fn = Math.sqrt(stiffness*(1/J1+1/J2))/(2*Math.PI)
  const k = (deflection: number, w1: number, w2: number) => stiffness*deflection+damping*(w1-w2)
  const dt = Math.min(timestep, 1/(60*fn))
  const points = integrate([0,0,0], end, dt, (_, [deflection,w1,w2]) => {
    const transmitted = k(deflection,w1,w2)
    return [w1-w2, (torque-transmitted)/J1, transmitted/J2]
  }, Math.max(1,Math.round(end / dt / 360)))
  return { fn, points: points.map(({t,state:[angle,w1,w2]}) => ({
    t, angle, transmitted:k(angle,w1,w2), momentum:J1*w1+J2*w2, w1, w2,
  })) }
}

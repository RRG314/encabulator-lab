import { clamp, integrate, radToRpm } from './numerics'

export function drive(voltage: number, omega: number, duty: number, resistance: number, kt: number, limit = 4) {
  const applied = voltage*clamp(duty,0,1)
  const current = clamp((applied-kt*omega)/resistance,0,limit)
  const effective = current > 0 ? kt*omega+current*resistance : 0
  const converted = kt*current*omega
  const copperLoss = current**2*resistance
  const controllerLoss = copperLoss*0.08
  const busPower = effective*current+controllerLoss
  return { current, torque:kt*current, converted, copperLoss, controllerLoss, busPower,
    busCurrent:voltage > 0 ? busPower/voltage : 0 }
}

export function flow(duty: number, freeFlow: number, head: number, restriction: number, omega: number, drag: number) {
  const q0 = freeFlow*duty
  const dp0 = head*duty*duty
  const q = q0 > 0 ? Math.sqrt(dp0/(restriction+dp0/(q0*q0))) : 0
  const pressure = restriction*q*q
  return { q, pressure, fluidPower:q*pressure, rotorDrag: drag*omega*Math.abs(omega) }
}

export function acPhase(voltageRms: number, resistance: number, inductance: number, frequency: number, compensation: number) {
  const omega = 2*Math.PI*frequency
  const reactance = omega*inductance
  const denominator = resistance**2+reactance**2
  const real = voltageRms**2*resistance/denominator
  const uncompensated = voltageRms**2*reactance/denominator
  const vars = uncompensated - voltageRms**2*omega*compensation
  const optimal = uncompensated/(voltageRms**2*omega)
  return {real, vars, angleDeg:Math.atan2(vars,real)*180/Math.PI, factor:real/Math.hypot(real,vars), optimal}
}

export const faults = ['None','Tachometer dropout','IMU saturation','Overtemperature','Guard open','Overspeed','Communications loss'] as const
export type Fault = typeof faults[number]

export function faultState(fault: Fault, t: number, rpm: number, temperature: number, latched = false) {
  const active = t >= 3 ? fault : 'None'
  const quality = !['Tachometer dropout','IMU saturation','Communications loss'].includes(active)
  const reason = (active !== 'None' ? active : rpm > 3000 ? 'Overspeed' : temperature > 65 ? 'Overtemperature' : '')
  return { inhibit:latched || Boolean(reason), phaseQualified:quality && !reason && !latched, reason }
}

export function plant(voltage: number, speedTarget: number, load: number, fanDuty: number, fault: Fault, step = 0.005) {
  const ambient = 22, inertia = 0.002, viscous = 0.00024, aero = 1.1e-6
  const flowPoint = flow(fanDuty,0.015,65,800_000,0,aero)
  const evaluate = (t: number, w: number, motor: number, inhibited: boolean) => {
    const actual = faultState(fault,t,radToRpm(w),motor,inhibited)
    const input = clamp((speedTarget-radToRpm(w))/1150 + 0.05*w/Math.max(voltage,1),0,1)
    return { actual, motorDrive:drive(voltage,w,actual.inhibit ? 0 : input,2.2,0.05) }
  }
  // The study faults are sustained from t=3. The analytic model ceilings are monotone for this envelope.
  const points = integrate([0,ambient,ambient,0,0],10,step,(t,[w,tm,tc]) => {
    const { motorDrive } = evaluate(t,w,tm,false)
    const drag = viscous*w+aero*w*Math.abs(w)
    const external = load*Math.tanh(w/2)
    return [
      (motorDrive.torque-drag-external)/inertia,
      (motorDrive.copperLoss+viscous*w*w-(0.35+35*flowPoint.q)*(tm-ambient))/54,
      (motorDrive.controllerLoss-(0.22+15*flowPoint.q)*(tc-ambient))/16,
      motorDrive.busPower,
      motorDrive.copperLoss+motorDrive.controllerLoss+drag*w+external*w,
    ]
  },4)
  let inhibited = false
  return points.map(({t,state:[w,motor,controller,input,loss]}) => {
    const { actual,motorDrive } = evaluate(t,w,motor,inhibited)
    inhibited ||= actual.inhibit
    return { t,rpm:radToRpm(w),voltage,current:motorDrive.busCurrent,motor,controller,flow:flowPoint.q,
      vibrationUm:1e6*(0.0000015*w*w/Math.hypot(15000-0.45*w*w,22*w)),phaseQualified:actual.phaseQualified,inhibited,
      reason:actual.reason, auditJ:input-loss-0.5*inertia*w*w }
  })
}

export const isolatedReaction = (total: number, span: number, fromLeft: number) =>
  [total*(span-fromLeft)/span,total*fromLeft/span]

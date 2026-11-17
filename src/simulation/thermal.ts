import { integrate } from './numerics'
export const temperature = (t: number, ambient: number, initial: number, capacity: number, conductance: number, watts: number) =>
  ambient + (initial-ambient)*Math.exp(-conductance*t/capacity) +
    (conductance > 0 ? -watts*Math.expm1(-conductance*t/capacity)/conductance : watts*t/capacity)

export function thermal(ambient: number, capacity: number, conductance: number, motorLoss: number, controllerLoss: number, end = 300) {
  const boardCapacity = capacity*0.45
  const boardConductance = conductance*0.7
  return integrate([ambient,ambient],end,0.5,(_, [motor,controller]) => [
    (motorLoss-conductance*(motor-ambient))/capacity,
    (controllerLoss-boardConductance*(controller-ambient))/boardCapacity,
  ],2).map(({t,state:[motor,controller]}) => ({t,motor,controller}))
}

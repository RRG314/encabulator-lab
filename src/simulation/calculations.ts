import { rpmToRad } from './numerics'

export interface ShaftCase {
  diameterM:number, spanM:number, forceN:number, fromLeftM:number, torqueNm:number,
  modulusPa:number, shearModulusPa:number, expansionPerKelvin:number, tempRiseK:number,
  rotorMassKg:number, rotorRadiusM:number, motorInertiaKgM2:number,
  bearingRatingN:number, bearingLoadN:number, rpm:number, eccentricityM:number,
  fasteners:number, fastenerAreaM2:number, accelerationRadS2:number, loadTorqueNm:number,
}
export const baseline: ShaftCase = {
  diameterM:.008, spanM:.096, forceN:20, fromLeftM:.048, torqueNm:.16,
  modulusPa:200e9, shearModulusPa:77e9, expansionPerKelvin:12e-6, tempRiseK:30,
  rotorMassKg:.16, rotorRadiusM:.042, motorInertiaKgM2:.00007,
  bearingRatingN:1000, bearingLoadN:35, rpm:1500, eccentricityM:0.00005,
  fasteners:4, fastenerAreaM2:5.03e-6, accelerationRadS2:50, loadTorqueNm:.06,
}

export function screening(p:ShaftCase) {
  const {diameterM:d,spanM:L,forceN:F,fromLeftM:a,torqueNm:T,modulusPa:E,shearModulusPa:G} = p
  const b=L-a
  const areaMoment=Math.PI*d**4/64
  const left=F*b/L, right=F*a/L
  const moment=left*a
  const shear=16*T/(Math.PI*d**3), bending=32*moment/(Math.PI*d**3)
  const vonMises=Math.hypot(bending,Math.sqrt(3)*shear)
  const deflection=F*a*a*b*b/(3*E*areaMoment*L)
  const shaftStiffness=48*E*areaMoment/L**3
  const criticalRpm=Math.sqrt(shaftStiffness/p.rotorMassKg)*60/(2*Math.PI)
  const polarInertia=.5*p.rotorMassKg*p.rotorRadiusM**2
  const couplingK=G*2*areaMoment/L
  const shaftModeHz=Math.sqrt(couplingK*(1/p.motorInertiaKgM2+1/polarInertia))/(2*Math.PI)
  const l10=(p.bearingRatingN/p.bearingLoadN)**3
  return {
    left,right,shear,bending,vonMises,deflection,criticalRpm,polarInertia,couplingK,shaftModeHz,
    lifeMillionsRev:l10,lifeHours:l10*1e6/(60*p.rpm),
    unbalanceForce:p.rotorMassKg*p.eccentricityM*rpmToRad(p.rpm)**2,
    equalBoltShear:F/(p.fasteners*p.fastenerAreaM2),
    expansion:p.expansionPerKelvin*L*p.tempRiseK,
    motorTorque:(polarInertia+p.motorInertiaKgM2)*p.accelerationRadS2+p.loadTorqueNm,
  }
}

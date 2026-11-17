import type { MeshStandardMaterial } from 'three'
import type { Finish } from './geometry'

const cast = new Set<Finish>(['cast','frame','blue','black','rubber'])
const polished = new Set<Finish>(['plate','steel','gold','amber','bright'])

/** Paint grain, directional machining, and tool marks use the CAD part's local millimetres. */
export function applySurface(material: MeshStandardMaterial, finish: Finish) {
  if (!cast.has(finish) && !polished.has(finish)) return
  const style = cast.has(finish) ? 'cast' : 'machined'
  material.customProgramCacheKey = () => `encabulator-${style}`
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vStock;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvStock = position;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vStock;
float stockHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float stockNoise(vec3 position) {
  vec3 g = floor(position);
  vec3 f = fract(position);
  f = f*f*(3.0-2.0*f);
  return mix(mix(mix(stockHash(g),stockHash(g+vec3(1,0,0)),f.x),
                 mix(stockHash(g+vec3(0,1,0)),stockHash(g+vec3(1,1,0)),f.x),f.y),
             mix(mix(stockHash(g+vec3(0,0,1)),stockHash(g+vec3(1,0,1)),f.x),
                 mix(stockHash(g+vec3(0,1,1)),stockHash(g+vec3(1,1,1)),f.x),f.y),f.z);
}`)
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
float surfaceFine = stockNoise(vStock*${style==='cast'?'1.72':'vec3(0.23,2.9,3.6)'});
float surfaceCoarse = stockNoise(vStock*${style==='cast'?'0.29':'vec3(0.026,0.76,0.81)'});
diffuseColor.rgb *= mix(${style==='cast'?'0.65,1.27':'0.80,1.19'},surfaceFine)
                  * mix(0.92,1.08,surfaceCoarse);
`)
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>',
      '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + 0.22*(surfaceFine-0.48),0.16,0.95);')
  }
}

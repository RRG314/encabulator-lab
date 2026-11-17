import { Mesh } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { finishes } from './geometry'
import type { Finish, makeGeometries } from './geometry'
import type { MachineProfile } from '../machines/profiles'
import { assetUrl } from '../machines/profiles'

export async function loadCadMeshes(machine: Pick<MachineProfile,'mesh'|'placements'>) {
  const model = await new GLTFLoader().loadAsync(assetUrl(machine.mesh))
  const result: ReturnType<typeof makeGeometries> = {}
  for (const node of model.scene.children) {
    const id = node.userData.partId as string | undefined
    if (!id || result[id]) continue
    const pieces: (typeof result)[string] = []
    node.traverse(child => {
      if (!(child instanceof Mesh)) return
      const finish = (child.userData.finish ?? child.geometry.userData.finish) as Finish
      if (!(finish in finishes)) return
      const geometry = child.geometry.clone().rotateX(Math.PI / 2).scale(1000,1000,1000)
      if (!geometry.getAttribute('normal')) geometry.computeVertexNormals()
      geometry.computeBoundingBox()
      pieces.push({ finish, geometry })
    })
    if (pieces.length) result[id] = pieces
  }
  for (const node of model.scene.children) node.traverse(child => {
    if (child instanceof Mesh) {
      child.geometry.dispose()
      child.material.dispose()
    }
  })
  if (machine.placements.some(item => !result[item.partId])) {
    disposeMeshes(result)
    throw new Error('Incomplete solid-to-mesh registry')
  }
  return result
}

export function disposeMeshes(geometry: ReturnType<typeof makeGeometries>) {
  Object.values(geometry).flat().forEach(piece => piece.geometry.dispose())
}

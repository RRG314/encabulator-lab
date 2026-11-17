import { Mesh } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { finishes } from './geometry'
import type { Finish, makeGeometries } from './geometry'
import { placements } from './layout'

export async function loadCadMeshes() {
  const model = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/te01.glb`)
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
  if (placements.some(item => !result[item.partId])) {
    disposeMeshes(result)
    throw new Error('Incomplete solid-to-mesh registry')
  }
  return result
}

export function disposeMeshes(geometry: ReturnType<typeof makeGeometries>) {
  Object.values(geometry).flat().forEach(piece => piece.geometry.dispose())
}

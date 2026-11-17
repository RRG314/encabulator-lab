import { Box3, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { explodePosition } from './layout'
import type { Placement } from './layout'

export function placementMatrix(placement: Placement, fraction: number, target = new Matrix4()) {
  const rotation = new Quaternion().setFromEuler(new Euler(placement.rotation, 0, 0))
  return target.compose(new Vector3(...explodePosition(placement, fraction)), rotation, new Vector3(1, 1, 1))
}

export function placementBounds(
  placement: Placement, fraction: number,
  geometries: ReturnType<typeof import('./geometry').makeGeometries>,
) {
  const bounds = new Box3()
  const matrix = placementMatrix(placement, fraction)
  for (const piece of geometries[placement.partId]) bounds.union(piece.geometry.boundingBox!.clone().applyMatrix4(matrix))
  return bounds
}

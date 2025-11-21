import { cos, randomInt, randomLR, sin, TeamNumber, XY, XYZ } from "@piggo-gg/core"
import { Box3, BoxGeometry, Color, Matrix4, Mesh, MeshBasicMaterial, Object3D, Ray, Scene, Vector3 } from "three"
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

export type ColorMapping = Record<string, Record<TeamNumber, `#${string}`>>

export const colorMaterials = (obj: Object3D, mapping: ColorMapping, team: TeamNumber) => {
  obj.traverse((child) => {
    if (child instanceof Mesh) {
      if (!Array.isArray(child.material)) {
        const color = child.material.color as Color

        const hex = color.getHexString()

        if (mapping[hex]) {
          child.material.color = new Color(mapping[hex][team])
        }
      }
    }
  })
}

export const copyMaterials = (from: Object3D, to: Object3D) => {
  const fromMap: Record<string, Object3D> = {}

  from.traverse((child) => {
    fromMap[child.name] = child
  })

  to.traverse((child) => {
    if (fromMap[child.name] && child instanceof Mesh && fromMap[child.name] instanceof Mesh) {
      const fromChild = fromMap[child.name] as Mesh
      if (Array.isArray(fromChild.material)) {
        child.material = fromChild.material.map(m => m.clone())
      } else {
        child.material = fromChild.material.clone()
      }
    }
  })
}

export const cloneSkeleton = clone

export const cloneThree = <O extends Object3D>(o: O): O => {
  const cloned = o.clone()

  cloned.traverse((child) => {
    if (child instanceof Mesh) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map(m => m.clone())
      } else {
        child.material = child.material.clone()
      }
    }
  })

  return cloned
}

export const randomVector3 = (scale = 1) => {
  return new Vector3(randomLR(), randomLR(), randomLR()).normalize().multiplyScalar(scale)
}

export const modelOffset = (localAim: XY, tip = false, recoil = 0): XYZ => {
  const dir = { x: sin(localAim.x), y: cos(localAim.x), z: sin(localAim.y) }
  const right = { x: cos(localAim.x), y: -sin(localAim.x) }

  const offset = {
    x: -dir.x * 0.05 + right.x * 0.025,
    y: recoil * 0.03,
    z: -dir.y * 0.05 + right.y * 0.025
  }

  if (localAim.y > 0) {
    offset.y += localAim.y * 0.04
  } else {
    offset.x -= dir.x * localAim.y * 0.04
    offset.z -= dir.y * localAim.y * 0.04
  }

  if (tip) {
    offset.x -= dir.x * 0.1
    offset.y -= 0.035 - localAim.y * 0.1
    offset.z -= dir.y * 0.1
  }

  return offset
}

export const destroyIntoVoxels = (mesh: Mesh, scene: Scene, size: number) => {
  const box = new Box3().setFromObject(mesh)
  const bounds = new Vector3()
  box.getSize(bounds)
  console.log("destroyIntoVoxels bounds", bounds, "box", box)

  const particles = []
  for (let x = box.min.x; x < box.max.x; x += size) {
    for (let y = box.min.y; y < box.max.y; y += size) {
      for (let z = box.min.z; z < box.max.z; z += size) {
        const p = new Vector3(x, y, z)
        if (pointInsideMesh(p, mesh)) particles.push(p.clone())
      }
    }
  }

  for (const p of particles) {
    const color = new Color(`rgb(255, ${randomInt(256)}, 0)`)
    const voxel = new Mesh(new BoxGeometry(size, size, size), new MeshBasicMaterial({ color }))
    
    // const modelOffset = p.divide(box.)
    // voxel.position.copy(mesh.position.clone().add(p).sub(box.getCenter(new Vector3())))
    voxel.position.copy(mesh.position)
    voxel.position.x += p.x * size * 1.1
    voxel.position.y += p.y * size * 1.1
    voxel.position.z += p.z * size * 1.1

    console.log(voxel.position)
    scene.add(voxel)
  }

  mesh.visible = false
  scene.add(mesh)
}

const pointInsideMesh = (point: Vector3, mesh: Mesh) => {
  const invMatrix = new Matrix4().copy(mesh.matrixWorld).invert()
  const localPoint = point.clone().applyMatrix4(invMatrix)

  const ray = new Ray(localPoint, new Vector3(1, 0, 0))

  const geometry = mesh.geometry

  if (geometry.boundingBox) {
    const hits = ray.intersectBox(geometry.boundingBox, point)
    return Boolean(hits)
  }

  return false
}

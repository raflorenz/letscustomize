import * as THREE from "three";
import { FINISHES } from "@/lib/materials";
import type {
  FinishId,
  HexColor,
  MaterialOverride,
} from "@/types/configurator";

export function buildMeshMap(
  scene: THREE.Group | THREE.Object3D
): Map<string, THREE.Mesh> {
  const map = new Map<string, THREE.Mesh>();
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      map.set(child.name, child as THREE.Mesh);
    }
  });
  return map;
}

export function applyCustomizationToMesh(
  mesh: THREE.Mesh,
  color: HexColor,
  finishId: FinishId
): void {
  if (!mesh.material) return;

  const materials = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];

  for (let i = 0; i < materials.length; i++) {
    let mat = materials[i];

    // Clone on first write to avoid mutating shared GLB materials
    if (!mesh.userData.materialCloned) {
      mat = mat.clone();
      if (Array.isArray(mesh.material)) {
        mesh.material[i] = mat;
      } else {
        mesh.material = mat;
      }
    }

    const finish = FINISHES[finishId];
    const std = mat as THREE.MeshStandardMaterial;
    if ("color" in std) std.color.set(color);
    if ("roughness" in std) std.roughness = finish.roughness;
    if ("metalness" in std) std.metalness = finish.metalness;
    const phys = mat as THREE.MeshPhysicalMaterial;
    if ("clearcoat" in phys) {
      phys.clearcoat = finish.clearcoat;
      phys.clearcoatRoughness = finish.clearcoatRoughness;
    }
  }

  mesh.userData.materialCloned = true;
}

export function applyCustomizationToPart(
  meshMap: Map<string, THREE.Mesh>,
  meshNames: string[],
  color: HexColor,
  finish: FinishId
): void {
  for (const name of meshNames) {
    const mesh = meshMap.get(name);
    if (mesh) {
      applyCustomizationToMesh(mesh, color, finish);
    }
  }
}

/** Apply a customization to every mesh whose material name matches. */
export function applyCustomizationByMaterial(
  scene: THREE.Object3D,
  materialNames: string[],
  color: HexColor,
  finish: FinishId
): void {
  const wanted = new Set(materialNames);
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    // Match on the original material name, preserved across clones
    if (
      materials.some(
        (m) => wanted.has(m.userData.originalName ?? m.name)
      )
    ) {
      applyCustomizationToMesh(mesh, color, finish);
    }
  });
}

/**
 * Fix up materials from GLB exporters that rely on unsupported extensions
 * (e.g. SketchUp/SimLab spec-gloss): assign sensible dielectric/metal values
 * based on base color so parts don't render as washed-out half-metal.
 */
export function sanitizeGlbMaterials(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const mat of materials) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!("metalness" in std) || std.userData.sanitized) continue;
      std.userData.sanitized = true;

      const { r, g, b } = std.color;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const isGrayscale =
        Math.abs(r - g) < 0.06 && Math.abs(g - b) < 0.06;

      if (std.transparent || std.opacity < 1) {
        // Glass (windscreen, lenses)
        std.roughness = 0.05;
        std.metalness = 0;
        std.opacity = Math.min(std.opacity, 0.35);
      } else if (isGrayscale && luminance > 0.62) {
        // Bright gray → polished metal (exhaust, fork, trim)
        std.metalness = 0.85;
        std.roughness = 0.3;
      } else if (luminance < 0.2) {
        // Dark → rubber / plastic / engine
        std.metalness = 0.05;
        std.roughness = 0.85;
      } else {
        // Everything else → painted or plastic surface
        std.metalness = 0.1;
        std.roughness = 0.55;
      }
      std.needsUpdate = true;
    }
  });
}

/** Apply fixed per-material overrides from the motorcycle config. */
export function applyMaterialOverrides(
  scene: THREE.Object3D,
  overrides: Record<string, MaterialOverride>
): void {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const mat of materials) {
      const std = mat as THREE.MeshStandardMaterial;
      const override =
        overrides[std.userData.originalName ?? std.name];
      if (!override) continue;
      if (override.color !== undefined) std.color.set(override.color);
      if (override.roughness !== undefined) std.roughness = override.roughness;
      if (override.metalness !== undefined) std.metalness = override.metalness;
      if (override.opacity !== undefined) {
        std.transparent = override.opacity < 1;
        std.opacity = override.opacity;
      }
      std.needsUpdate = true;
    }
  });
}

/** Stamp original material names so matching survives material cloning. */
export function preserveMaterialNames(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const m of materials) {
      if (m.userData.originalName === undefined) {
        m.userData.originalName = m.name;
      }
    }
  });
}

export function logSceneMeshNames(
  scene: THREE.Group | THREE.Object3D
): void {
  console.group("Scene mesh names:");
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      console.log(`  Mesh: "${child.name}" (parent: "${child.parent?.name}")`);
    }
  });
  console.groupEnd();
}

"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { useConfiguratorStore } from "@/stores/configurator-store";
import {
  buildMeshMap,
  applyCustomizationToPart,
  applyCustomizationByMaterial,
  applyMaterialOverrides,
  preserveMaterialNames,
  sanitizeGlbMaterials,
  logSceneMeshNames,
} from "@/lib/three-utils";

interface MotorcycleModelProps {
  modelPath: string;
  /** Target overall length in meters; the model is auto-scaled to this */
  targetLength?: number;
  /** Extra yaw (radians) so the bike faces +X, per model */
  modelYaw?: number;
  /** Skip the SketchUp-export material fix-up for properly-authored GLBs */
  sanitize?: boolean;
}

/**
 * Normalize an arbitrary GLB: largest horizontal extent becomes `targetLength`
 * meters along X, the model rests on y=0 and is centered at the origin.
 * Idempotent — safe against double-invoked memos in StrictMode.
 */
function normalizeScene(
  scene: THREE.Object3D,
  targetLength: number,
  modelYaw: number
) {
  if (scene.userData.normalized) return;
  scene.userData.normalized = true;

  scene.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(scene);
  let size = box.getSize(new THREE.Vector3());

  // A bike is longer than tall; if length ended up on Z, yaw it onto X
  if (size.z > size.x) {
    scene.rotation.y = Math.PI / 2;
    scene.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(scene);
    size = box.getSize(new THREE.Vector3());
  }

  scene.rotation.y += modelYaw;
  scene.updateMatrixWorld(true);

  const scale = targetLength / Math.max(size.x, 0.0001);
  scene.scale.setScalar(scale);
  scene.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.position.y -= box.min.y;
}

/** Renders a GLB-based motorcycle and applies part customizations by mesh name. */
export function MotorcycleModel({
  modelPath,
  targetLength = 1.95,
  modelYaw = 0,
  sanitize = true,
}: MotorcycleModelProps) {
  const { scene } = useGLTF(modelPath);
  const meshMapRef = useRef<Map<string, THREE.Mesh> | null>(null);

  const currentMotorcycle = useConfiguratorStore((s) => s.currentMotorcycle);
  const partCustomizations = useConfiguratorStore((s) => s.partCustomizations);
  const setModelLoaded = useConfiguratorStore((s) => s.setModelLoaded);
  const selectPart = useConfiguratorStore((s) => s.selectPart);

  // material name (as preserved in userData.originalName) → part id
  const partByMaterial = useMemo(() => {
    const map = new Map<string, string>();
    for (const part of currentMotorcycle?.parts ?? []) {
      for (const name of part.materialNames ?? []) map.set(name, part.id);
    }
    return map;
  }, [currentMotorcycle]);

  // Only an onClick handler is bound (no pointer-move events), so the
  // raycast against the full mesh runs per click, not per mouse move.
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 6) return; // orbit drag, not a click
    // The nearest hit is often not the paint itself — Sketchfab models carry
    // glass, clearcoat shells and duplicate "rip" meshes in front of the
    // panels — so walk every hit along the ray and take the first paintable.
    for (const hit of event.intersections) {
      const mesh = hit.object as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) continue;
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const mat of materials) {
        const partId = partByMaterial.get(
          mat.userData.originalName ?? mat.name
        );
        if (partId) {
          event.stopPropagation();
          selectPart(partId);
          return;
        }
      }
    }
  };

  const normalized = useMemo(() => {
    normalizeScene(scene, targetLength, modelYaw);
    if (sanitize) sanitizeGlbMaterials(scene);
    preserveMaterialNames(scene);
    return scene;
  }, [scene, targetLength, modelYaw, sanitize]);

  useEffect(() => {
    meshMapRef.current = buildMeshMap(normalized);
    if (currentMotorcycle?.materialOverrides) {
      applyMaterialOverrides(normalized, currentMotorcycle.materialOverrides);
    }
    setModelLoaded(true);

    if (process.env.NODE_ENV === "development") {
      logSceneMeshNames(normalized);
      (window as unknown as { __scene?: THREE.Object3D }).__scene = normalized;
    }
  }, [normalized, currentMotorcycle, setModelLoaded]);

  useEffect(() => {
    if (!meshMapRef.current || !currentMotorcycle) return;

    for (const part of currentMotorcycle.parts) {
      const customization = partCustomizations[part.id];
      if (!customization) continue;
      applyCustomizationToPart(
        meshMapRef.current,
        part.meshNames,
        customization.color,
        customization.finish
      );
      if (part.materialNames?.length) {
        applyCustomizationByMaterial(
          normalized,
          part.materialNames,
          customization.color,
          customization.finish
        );
      }
    }
  }, [partCustomizations, currentMotorcycle, normalized]);

  // The handler lives on a stable group, not the primitive: r3f only
  // registers pointer handlers when an element mounts, so a handler on
  // <primitive> stops firing once the object prop swaps to the next bike's
  // scene. The group persists across swaps and raycasts its children.
  return (
    <group onClick={handleClick}>
      <primitive object={normalized} />
    </group>
  );
}

import type { FinishId, FinishPreset } from "@/types/configurator";

export const FINISHES: Record<FinishId, FinishPreset> = {
  gloss: {
    id: "gloss",
    name: "Gloss",
    description: "Deep clearcoat shine",
    roughness: 0.18,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
  },
  matte: {
    id: "matte",
    name: "Matte",
    description: "Flat, non-reflective",
    roughness: 0.82,
    metalness: 0.05,
    clearcoat: 0,
    clearcoatRoughness: 0,
  },
  metallic: {
    id: "metallic",
    name: "Metallic",
    description: "Metal-flake paint",
    roughness: 0.28,
    metalness: 0.9,
    clearcoat: 0.8,
    clearcoatRoughness: 0.12,
  },
  satin: {
    id: "satin",
    name: "Satin",
    description: "Soft semi-gloss sheen",
    roughness: 0.45,
    metalness: 0.3,
    clearcoat: 0.3,
    clearcoatRoughness: 0.3,
  },
  chrome: {
    id: "chrome",
    name: "Chrome",
    description: "Mirror-polished metal",
    roughness: 0.06,
    metalness: 1,
    clearcoat: 0,
    clearcoatRoughness: 0,
  },
};

export const FINISH_LIST: FinishPreset[] = Object.values(FINISHES);

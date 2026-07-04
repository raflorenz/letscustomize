import type { ComponentType } from "react";
import { Adv150Model } from "./Adv150Model";

/**
 * Procedural models built in code. Future motorcycles can either register
 * a component here or ship a GLB via MotorcycleConfig.modelPath.
 */
export const BUILTIN_MODELS: Record<string, ComponentType> = {
  "honda-adv-150": Adv150Model,
};

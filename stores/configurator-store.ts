import { create } from "zustand";
import type {
  FinishId,
  HexColor,
  MotorcycleConfig,
  PartCustomization,
} from "@/types/configurator";

function defaultCustomizations(
  config: MotorcycleConfig
): Record<string, PartCustomization> {
  const customizations: Record<string, PartCustomization> = {};
  for (const part of config.parts) {
    customizations[part.id] = {
      partId: part.id,
      color: part.defaultColor,
      finish: part.defaultFinish,
    };
  }
  return customizations;
}

interface ConfiguratorState {
  currentMotorcycle: MotorcycleConfig | null;
  partCustomizations: Record<string, PartCustomization>;
  selectedPartId: string | null;
  modelLoaded: boolean;

  setMotorcycle: (config: MotorcycleConfig) => void;
  selectPart: (partId: string | null) => void;
  setPartColor: (partId: string, color: HexColor) => void;
  setPartFinish: (partId: string, finish: FinishId) => void;
  applyToAllFairings: (color: HexColor, finish: FinishId) => void;
  resetToDefaults: () => void;
  setModelLoaded: (loaded: boolean) => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  currentMotorcycle: null,
  partCustomizations: {},
  selectedPartId: null,
  modelLoaded: false,

  setMotorcycle: (config) =>
    set({
      currentMotorcycle: config,
      partCustomizations: defaultCustomizations(config),
      selectedPartId: config.parts[0]?.id ?? null,
      modelLoaded: false,
    }),

  selectPart: (partId) => set({ selectedPartId: partId }),

  setPartColor: (partId, color) =>
    set((state) => ({
      partCustomizations: {
        ...state.partCustomizations,
        [partId]: { ...state.partCustomizations[partId], color },
      },
    })),

  setPartFinish: (partId, finish) =>
    set((state) => ({
      partCustomizations: {
        ...state.partCustomizations,
        [partId]: { ...state.partCustomizations[partId], finish },
      },
    })),

  applyToAllFairings: (color, finish) => {
    const { currentMotorcycle, partCustomizations } = get();
    if (!currentMotorcycle) return;

    const updated = { ...partCustomizations };
    for (const part of currentMotorcycle.parts) {
      if (part.category === "fairing") {
        updated[part.id] = { ...updated[part.id], color, finish };
      }
    }
    set({ partCustomizations: updated });
  },

  resetToDefaults: () => {
    const { currentMotorcycle } = get();
    if (!currentMotorcycle) return;
    set({ partCustomizations: defaultCustomizations(currentMotorcycle) });
  },

  setModelLoaded: (loaded) => set({ modelLoaded: loaded }),
}));

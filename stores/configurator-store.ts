import { create } from "zustand";
import type {
  FinishId,
  HexColor,
  LiveryPreset,
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

export type Theme = "dark" | "light";

interface ConfiguratorState {
  currentMotorcycle: MotorcycleConfig | null;
  partCustomizations: Record<string, PartCustomization>;
  selectedPartId: string | null;
  modelLoaded: boolean;
  theme: Theme;
  /** id bumps on every showToast so repeat messages retrigger the popup */
  toast: { id: number; text: string } | null;

  setMotorcycle: (config: MotorcycleConfig) => void;
  selectPart: (partId: string | null) => void;
  setPartColor: (partId: string, color: HexColor) => void;
  setPartFinish: (partId: string, finish: FinishId) => void;
  applyLivery: (livery: LiveryPreset) => void;
  resetToDefaults: () => void;
  setModelLoaded: (loaded: boolean) => void;
  setTheme: (theme: Theme) => void;
  showToast: (text: string) => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  currentMotorcycle: null,
  partCustomizations: {},
  selectedPartId: null,
  modelLoaded: false,
  theme: "dark",
  toast: null,

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

  applyLivery: (livery) => {
    const { currentMotorcycle, partCustomizations } = get();
    if (!currentMotorcycle) return;

    const updated: Record<string, PartCustomization> = {};
    for (const part of currentMotorcycle.parts) {
      const zone = livery.zones[part.id];
      updated[part.id] = zone
        ? { partId: part.id, color: zone.color, finish: zone.finish }
        : partCustomizations[part.id];
    }
    set({ partCustomizations: updated });
  },

  resetToDefaults: () => {
    const { currentMotorcycle } = get();
    if (!currentMotorcycle) return;
    set({ partCustomizations: defaultCustomizations(currentMotorcycle) });
  },

  setModelLoaded: (loaded) => set({ modelLoaded: loaded }),

  setTheme: (theme) => set({ theme }),

  showToast: (text) =>
    set((state) => ({ toast: { id: (state.toast?.id ?? 0) + 1, text } })),
}));

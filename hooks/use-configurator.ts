import { useConfiguratorStore } from "@/stores/configurator-store";

export function useConfigurator() {
  const store = useConfiguratorStore();

  const selectedPart = store.currentMotorcycle?.parts.find(
    (p) => p.id === store.selectedPartId
  );

  const selectedCustomization = store.selectedPartId
    ? store.partCustomizations[store.selectedPartId]
    : undefined;

  return {
    motorcycle: store.currentMotorcycle,
    selectedPartId: store.selectedPartId,
    selectedPart,
    selectedCustomization,
    partCustomizations: store.partCustomizations,
    selectPart: store.selectPart,
    setPartColor: store.setPartColor,
    setPartFinish: store.setPartFinish,
    applyLivery: store.applyLivery,
    resetToDefaults: store.resetToDefaults,
    showToast: store.showToast,
    modelLoaded: store.modelLoaded,
  };
}

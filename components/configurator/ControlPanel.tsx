"use client";

import { useConfigurator } from "@/hooks/use-configurator";
import { ColorPicker } from "./ColorPicker";
import { FinishPicker } from "./FinishPicker";

export function ControlPanel() {
  const {
    motorcycle,
    selectedPartId,
    selectedPart,
    selectedCustomization,
    partCustomizations,
    selectPart,
    setPartColor,
    setPartFinish,
    applyToAllFairings,
    resetToDefaults,
  } = useConfigurator();

  if (!motorcycle) return null;

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-5 py-4 lg:px-8">
        {/* Part selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Part
          </span>
          {motorcycle.parts.map((part) => (
            <button
              key={part.id}
              onClick={() => selectPart(part.id)}
              className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                selectedPartId === part.id
                  ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span
                className="h-3 w-3 rounded-full ring-1 ring-black/10"
                style={{
                  backgroundColor: partCustomizations[part.id]?.color,
                }}
              />
              {part.label}
            </button>
          ))}
        </div>

        {selectedPart && selectedCustomization && (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10">
            {/* Color */}
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Color
              </p>
              <ColorPicker
                value={selectedCustomization.color}
                presets={motorcycle.colorPresets}
                onChange={(color) => setPartColor(selectedPart.id, color)}
              />
            </div>

            {/* Finish */}
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Finish
              </p>
              <FinishPicker
                value={selectedCustomization.finish}
                onChange={(finish) => setPartFinish(selectedPart.id, finish)}
              />
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-2 lg:ml-auto lg:flex-col">
              <button
                onClick={() =>
                  applyToAllFairings(
                    selectedCustomization.color,
                    selectedCustomization.finish
                  )
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Apply to All
              </button>
              <button
                onClick={resetToDefaults}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

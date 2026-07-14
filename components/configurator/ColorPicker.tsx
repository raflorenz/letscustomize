"use client";

import type { ColorPreset, HexColor } from "@/types/configurator";

interface ColorPickerProps {
  value: HexColor;
  presets: ColorPreset[];
  onChange: (color: HexColor) => void;
}

export function ColorPicker({ value, presets, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => {
        const active = value.toLowerCase() === preset.hex.toLowerCase();
        return (
          <button
            key={preset.id}
            onClick={() => onChange(preset.hex)}
            title={preset.name}
            aria-label={preset.name}
            className="h-9 w-9 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: preset.hex,
              boxShadow: active
                ? "inset 0 0 0 1px var(--ring-inset), 0 0 0 2px var(--swatch-ring), 0 0 0 4px var(--accent)"
                : "inset 0 0 0 1px var(--ring-inset)",
            }}
          />
        );
      })}

      {/* Custom color */}
      <label
        className="relative flex h-9 cursor-pointer items-center gap-2 rounded-full border border-dashed border-[var(--dash)] pl-[5px] pr-[13px] font-mono text-[11px] text-dim transition-colors hover:border-[var(--dash-hover)]"
        title="Custom color"
      >
        <span
          className="h-[26px] w-[26px] rounded-full"
          style={{
            backgroundColor: value,
            boxShadow: "inset 0 0 0 1px var(--ring-inset)",
          }}
        />
        {value}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value as HexColor)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

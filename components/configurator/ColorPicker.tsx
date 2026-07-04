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
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onChange(preset.hex)}
          title={preset.name}
          aria-label={preset.name}
          className="h-9 w-9 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            backgroundColor: preset.hex,
            borderColor:
              value.toLowerCase() === preset.hex.toLowerCase()
                ? "#3b82f6"
                : "rgba(0,0,0,0.08)",
            boxShadow:
              value.toLowerCase() === preset.hex.toLowerCase()
                ? "0 0 0 2px rgba(59,130,246,0.35)"
                : "none",
          }}
        />
      ))}

      {/* Custom color */}
      <label
        className="relative flex h-9 cursor-pointer items-center gap-2 rounded-full border border-dashed border-gray-300 pl-1 pr-3 text-xs text-gray-500 transition-colors hover:border-gray-400"
        title="Custom color"
      >
        <span
          className="h-6 w-6 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: value }}
        />
        <span className="font-mono">{value}</span>
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

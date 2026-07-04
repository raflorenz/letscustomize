"use client";

import { FINISH_LIST } from "@/lib/materials";
import type { FinishId } from "@/types/configurator";

interface FinishPickerProps {
  value: FinishId;
  onChange: (finish: FinishId) => void;
}

/** CSS approximations of each paint finish for the swatch chips */
const FINISH_SWATCH: Record<FinishId, string> = {
  gloss:
    "radial-gradient(circle at 32% 28%, #ffffff 0%, #9aa1ab 22%, #4b5563 70%)",
  matte: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  metallic:
    "linear-gradient(135deg, #d7dbe2 0%, #7c8593 35%, #aab2bd 55%, #5d6570 100%)",
  satin: "linear-gradient(135deg, #9aa1ab 0%, #6b7280 55%, #848b95 100%)",
  chrome:
    "linear-gradient(160deg, #ffffff 0%, #c9ced6 30%, #5d6570 50%, #e5e8ec 70%, #8b929c 100%)",
};

export function FinishPicker({ value, onChange }: FinishPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FINISH_LIST.map((finish) => (
        <button
          key={finish.id}
          onClick={() => onChange(finish.id)}
          title={finish.description}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            value === finish.id
              ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
              : "border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span
            className="h-4 w-4 rounded-full ring-1 ring-black/10"
            style={{ background: FINISH_SWATCH[finish.id] }}
          />
          {finish.name}
        </button>
      ))}
    </div>
  );
}

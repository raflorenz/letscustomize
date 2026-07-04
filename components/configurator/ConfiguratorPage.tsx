"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useConfiguratorStore } from "@/stores/configurator-store";
import { hondaAdv150 } from "@/data/motorcycles/honda-adv-150";
import { SceneCanvas } from "./SceneCanvas";
import { ControlPanel } from "./ControlPanel";

export function ConfiguratorPage() {
  const setMotorcycle = useConfiguratorStore((s) => s.setMotorcycle);
  const motorcycle = useConfiguratorStore((s) => s.currentMotorcycle);

  useEffect(() => {
    setMotorcycle(hondaAdv150);
  }, [setMotorcycle]);

  return (
    <div className="flex h-dvh flex-col">
      {/* 3D viewport — model centered, zoomable */}
      <div className="relative min-h-0 flex-1">
        <SceneCanvas />

        {/* Header overlay */}
        <div className="pointer-events-none absolute left-5 top-4 flex items-center gap-3">
          <Link
            href="/"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-white"
            aria-label="Back to home"
          >
            ←
          </Link>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {motorcycle?.name ?? "Loading..."}
            </h1>
            <p className="text-xs text-gray-500">Fairing Configurator</p>
          </div>
        </div>
      </div>

      {/* Customization controls below the model */}
      <ControlPanel />
    </div>
  );
}

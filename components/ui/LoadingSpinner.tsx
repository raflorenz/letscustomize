"use client";

import { Html } from "@react-three/drei";

export function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-line-strong border-t-accent" />
        <p className="whitespace-nowrap font-mono text-xs tracking-[0.08em] text-dim">
          LOADING MODEL...
        </p>
      </div>
    </Html>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useConfiguratorStore } from "@/stores/configurator-store";

export function Toast() {
  const toast = useConfiguratorStore((s) => s.toast);
  const [dismissedId, setDismissedId] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setDismissedId(toast.id), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast || toast.id === dismissedId) return null;

  return (
    <div
      key={toast.id}
      className="fixed right-5 top-5 z-50 rounded-[10px] px-[18px] py-2.5 text-[13px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
      style={{
        background: "var(--accent)",
        color: "var(--accent-ink)",
        animation: "toast-in .2s ease-out",
      }}
    >
      {toast.text}
    </div>
  );
}

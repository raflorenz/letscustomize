"use client";

import { useConfiguratorStore } from "@/stores/configurator-store";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useConfiguratorStore((s) => s.theme);
  const setTheme = useConfiguratorStore((s) => s.setTheme);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem("kustomoto-theme", next);
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle light and dark mode"
      className={`h-9 w-9 items-center justify-center rounded-full border border-[var(--btn-border)] bg-[var(--btn-bg)] text-soft transition-colors hover:bg-[var(--btn-hover)] ${className}`}
    >
      {theme === "dark" ? (
        // Sun — clicking switches to light
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          <line x1="4.5" y1="4.5" x2="6.6" y2="6.6" />
          <line x1="17.4" y1="17.4" x2="19.5" y2="19.5" />
          <line x1="4.5" y1="19.5" x2="6.6" y2="17.4" />
          <line x1="17.4" y1="6.6" x2="19.5" y2="4.5" />
        </svg>
      ) : (
        // Moon — clicking switches to dark
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

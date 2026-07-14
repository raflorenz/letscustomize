"use client";

import { useConfigurator } from "@/hooks/use-configurator";
import { FINISHES, formatPrice } from "@/lib/materials";
import type { HexColor } from "@/types/configurator";
import { ColorPicker } from "./ColorPicker";
import { FinishPicker } from "./FinishPicker";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div>
      <div
        className={`font-extrabold italic tracking-[0.04em] ${
          compact ? "text-base" : "text-[19px]"
        }`}
      >
        KUSTOMOTO<span className="text-accent">.</span>
      </div>
      <div
        className={`font-mono text-dim ${
          compact
            ? "mt-0.5 text-[8.5px] tracking-[0.18em]"
            : "mt-[3px] text-[9px] tracking-[0.2em]"
        }`}
      >
        PAINT &amp; CUSTOM WORKS
      </div>
    </div>
  );
}

function SectionHeading({
  index,
  title,
  detail,
}: {
  index?: string;
  title: string;
  detail?: string;
}) {
  return (
    <p className="mb-2.5 font-mono text-[10px] tracking-[0.16em] text-dim">
      {index && (
        <>
          <span className="text-accent">{index}</span>
          {" — "}
        </>
      )}
      {title}
      {detail && <span className="text-ink"> · {detail}</span>}
    </p>
  );
}

interface SidebarProps {
  /** Collapse the sidebar (desktop only) */
  onCollapse: () => void;
}

export function Sidebar({ onCollapse }: SidebarProps) {
  const {
    motorcycle,
    selectedPartId,
    selectedPart,
    selectedCustomization,
    partCustomizations,
    selectPart,
    setPartColor,
    setPartFinish,
    applyLivery,
    resetToDefaults,
    showToast,
  } = useConfigurator();

  if (!motorcycle || !selectedPart || !selectedCustomization) return null;

  const nameByHex = new Map(
    motorcycle.colorPresets.map((p) => [p.hex.toLowerCase(), p.name])
  );
  const colorName = (hex: HexColor) =>
    nameByHex.get(hex.toLowerCase()) ?? hex.toUpperCase();

  const total = motorcycle.parts.reduce(
    (sum, part) =>
      sum + (FINISHES[partCustomizations[part.id]?.finish]?.price ?? 0),
    0
  );

  const shareBuild = () => {
    try {
      navigator.clipboard?.writeText(window.location.href);
    } catch {}
    showToast("Share link copied to clipboard");
  };

  return (
    <div className="flex h-full min-h-0 flex-col lg:w-[372px]">
      {/* Desktop header */}
      <div className="hidden items-center justify-between border-b border-line px-[22px] pb-4 pt-5 lg:flex">
        <Brand />
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={shareBuild}
            className="whitespace-nowrap rounded-full border border-accent bg-accent px-[15px] py-[7px] text-xs font-bold text-accent-ink transition-[filter] hover:brightness-[1.08]"
          >
            Share
          </button>
          <button
            onClick={onCollapse}
            aria-label="Collapse panel"
            title="Collapse panel"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-line-strong text-dim transition-colors hover:bg-[var(--fill-hover)]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drag handle */}
      <div className="flex shrink-0 justify-center pb-1 pt-2.5 lg:hidden">
        <div className="h-[5px] w-[38px] rounded-full bg-line-strong" />
      </div>

      {/* Scrollable sections */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-[18px] py-3 lg:px-[22px] lg:py-5">
        <section>
          <SectionHeading
            index="01"
            title="PART"
            detail={selectedPart.label.toUpperCase()}
          />
          <div className="flex flex-col gap-1.5">
            {motorcycle.parts.map((part) => {
              const customization = partCustomizations[part.id];
              const finish = FINISHES[customization.finish];
              const active = part.id === selectedPartId;
              return (
                <button
                  key={part.id}
                  onClick={() => selectPart(part.id)}
                  className={`flex w-full items-center gap-3 rounded-[10px] border px-[11px] py-1.5 text-left text-[13.5px] font-semibold text-ink transition-colors ${
                    active
                      ? "border-accent bg-[var(--fill-active)]"
                      : "border-line hover:bg-[var(--fill-hover)]"
                  }`}
                >
                  <span
                    className="h-[22px] w-[22px] shrink-0 rounded-[7px]"
                    style={{
                      background: customization.color,
                      boxShadow: "inset 0 0 0 1px var(--ring-inset)",
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    {part.label}
                    <span className="mt-0.5 block font-mono text-[9.5px] font-normal tracking-[0.08em] text-dim">
                      {`${colorName(customization.color)} · ${finish.name}`.toUpperCase()}
                    </span>
                  </span>
                  <span
                    className={`font-mono text-[11px] ${
                      active ? "text-accent" : "text-dim"
                    }`}
                  >
                    {formatPrice(finish.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeading
            index="02"
            title="COLOR"
            detail={colorName(selectedCustomization.color).toUpperCase()}
          />
          <ColorPicker
            value={selectedCustomization.color}
            presets={motorcycle.colorPresets}
            onChange={(color) => setPartColor(selectedPart.id, color)}
          />
        </section>

        <section>
          <SectionHeading
            index="03"
            title="FINISH"
            detail={FINISHES[selectedCustomization.finish].name.toUpperCase()}
          />
          <FinishPicker
            value={selectedCustomization.finish}
            onChange={(finish) => setPartFinish(selectedPart.id, finish)}
          />
        </section>

        {motorcycle.liveries && motorcycle.liveries.length > 0 && (
          <section>
            <SectionHeading title="SHOP CUSTOM SETUP" />
            <div className="flex flex-col gap-1.5">
              {motorcycle.liveries.map((livery) => {
                const isCurrent = motorcycle.parts.every((part) => {
                  const zone = livery.zones[part.id];
                  const customization = partCustomizations[part.id];
                  return (
                    zone &&
                    customization &&
                    zone.color.toLowerCase() ===
                      customization.color.toLowerCase() &&
                    zone.finish === customization.finish
                  );
                });
                const dots = motorcycle.parts
                  .slice(0, 3)
                  .map((part) => livery.zones[part.id]?.color)
                  .filter(Boolean);
                return (
                  <button
                    key={livery.id}
                    onClick={() => {
                      applyLivery(livery);
                      showToast(`${livery.name} livery applied`);
                    }}
                    className={`flex w-full items-center gap-3 rounded-[10px] border px-[13px] py-2.5 text-left text-[13px] font-semibold text-ink transition-colors ${
                      isCurrent
                        ? "border-accent bg-[var(--fill-active)]"
                        : "border-line hover:bg-[var(--fill-hover)]"
                    }`}
                  >
                    <span className="flex shrink-0">
                      {dots.map((color, i) => (
                        <span
                          key={i}
                          className="h-[18px] w-[18px] rounded-full"
                          style={{
                            background: color,
                            boxShadow: "0 0 0 2px var(--swatch-ring)",
                            marginLeft: i > 0 ? -7 : 0,
                          }}
                        />
                      ))}
                    </span>
                    <span className="flex-1">{livery.name}</span>
                    <span className="font-mono text-[10px] text-dim">
                      {livery.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Build summary footer */}
      <div className="shrink-0 border-t border-line bg-panel-alt px-[18px] pb-4 pt-3 lg:px-[22px] lg:pb-[18px] lg:pt-4">
        <div className="mb-3 hidden flex-col gap-1.5 lg:flex">
          {motorcycle.parts.map((part) => {
            const finish = FINISHES[partCustomizations[part.id].finish];
            return (
              <div
                key={part.id}
                className="flex items-baseline gap-2.5 text-[12.5px]"
              >
                <span className="whitespace-nowrap text-mid">
                  {part.label} — {finish.name}
                </span>
                <span className="min-w-3 flex-1 border-b border-dotted border-[var(--dotted)]" />
                <span className="whitespace-nowrap font-mono text-[11.5px] text-soft">
                  {formatPrice(finish.price)}
                </span>
              </div>
            );
          })}
          <div className="mt-1 flex items-baseline gap-2.5">
            <span className="whitespace-nowrap text-[13.5px] font-bold">
              Paint estimate
            </span>
            <span className="flex-1" />
            <span className="font-mono text-[17px] font-semibold text-accent">
              {formatPrice(total)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col lg:hidden">
            <span className="whitespace-nowrap font-mono text-[8.5px] tracking-[0.14em] text-dim">
              PAINT ESTIMATE
            </span>
            <span className="font-mono text-xl font-semibold leading-tight text-accent">
              {formatPrice(total)}
            </span>
          </div>
          <button
            onClick={() => showToast("Quote request sent — we'll be in touch")}
            className="flex-1 rounded-[10px] bg-accent px-4 py-3 text-sm font-extrabold tracking-[0.02em] text-accent-ink transition-[filter] hover:brightness-[1.08]"
          >
            REQUEST QUOTE
          </button>
          <button
            onClick={resetToDefaults}
            title="Reset to factory"
            className="hidden rounded-[10px] border border-line-strong px-3.5 py-3 text-[13px] font-semibold text-dim transition-colors hover:bg-[var(--fill-hover)] lg:block"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

import type { MotorcycleConfig } from "@/types/configurator";

export const hondaAdv150: MotorcycleConfig = {
  id: "honda-adv-150",
  name: "Honda ADV",
  modelCode: "ADV 150",
  modelPath: "/models/honda-adv-150.glb",
  modelYaw: Math.PI,
  // Fixed materials for the GLB (SketchUp export ships flat 0.5/0.5 PBR values)
  materialOverrides: {
    // Bulk mesh: engine, tires, seat, black plastics
    "<auto>": { color: "#232327", roughness: 0.75, metalness: 0.15 },
    // Small gray trim bits near the rear wheel — the big center panels were
    // split off to paint_center by scripts/split-adv150-accents.mjs
    "[Color M04]": { color: "#6a6d72", roughness: 0.4, metalness: 0.6 },
    // Silver mechanical bits
    "<auto>9": { color: "#9ea1a6", roughness: 0.32, metalness: 0.8 },
    // Bright metal (exhaust, fork tubes)
    "<auto>12": { color: "#c8cbd0", roughness: 0.26, metalness: 0.85 },
    // Windscreen glass
    "[Translucent Glass Gray]": {
      color: "#b8ccd8",
      roughness: 0.05,
      metalness: 0,
      opacity: 0.3,
    },
  },
  parts: [
    {
      id: "fairing-front",
      label: "Front Fairing",
      meshNames: [],
      // paint_* materials are created by scripts/split-adv150.mjs
      materialNames: ["paint_front", "<auto>8"],
      defaultColor: "#b02330",
      defaultFinish: "gloss",
      category: "fairing",
    },
    {
      id: "center-panels",
      label: "Center Panels",
      meshNames: [],
      // gray mid panels between the front fairing and side panels,
      // split from [Color M04] by scripts/split-adv150-accents.mjs
      materialNames: ["paint_center"],
      defaultColor: "#4b4f54",
      defaultFinish: "gloss",
      category: "body",
    },
    {
      id: "side-panels",
      label: "Side Panels",
      meshNames: [],
      // side panels + rear cowl are one visual unit; the GLB keeps them as
      // two materials (paint_side / paint_rear) but they paint together
      materialNames: ["paint_side", "paint_rear"],
      defaultColor: "#b02330",
      defaultFinish: "gloss",
      category: "fairing",
    },
    {
      id: "panel-accents",
      label: "Panel Accents",
      meshNames: [],
      materialNames: ["<auto>17"],
      defaultColor: "#a8a9ad",
      defaultFinish: "gloss",
      category: "fairing",
    },
    {
      id: "wheel-rims",
      label: "Wheel Rims",
      meshNames: [],
      // split from <auto>17 by scripts/split-adv150-accents.mjs
      materialNames: ["paint_rims"],
      defaultColor: "#4b4f54",
      defaultFinish: "gloss",
      category: "accent",
    },
  ],
  colorPresets: [
    { id: "advance-red", name: "Advance Red", hex: "#b02330" },
    { id: "tough-matte-black", name: "Tough Matte Black", hex: "#17171c" },
    { id: "pearl-white", name: "Pearl White", hex: "#f2f1ec" },
    { id: "midnight-blue", name: "Midnight Blue", hex: "#1b2a52" },
    { id: "silver-metallic", name: "Silver Metallic", hex: "#a8a9ad" },
    { id: "forest-green", name: "Forest Green", hex: "#2d5a3d" },
    { id: "burnt-orange", name: "Burnt Orange", hex: "#cc5500" },
    { id: "gunmetal-gray", name: "Gunmetal Gray", hex: "#4b4f54" },
  ],
  liveries: [
    {
      id: "factory-red",
      name: "Factory Red",
      tag: "OEM",
      zones: {
        "fairing-front": { color: "#b02330", finish: "gloss" },
        "center-panels": { color: "#4b4f54", finish: "gloss" },
        "side-panels": { color: "#b02330", finish: "gloss" },
        "panel-accents": { color: "#a8a9ad", finish: "gloss" },
        "wheel-rims": { color: "#4b4f54", finish: "gloss" },
      },
    },
    {
      id: "stealth",
      name: "Stealth",
      tag: "SHOP",
      zones: {
        "fairing-front": { color: "#17171c", finish: "matte" },
        "center-panels": { color: "#17171c", finish: "matte" },
        "side-panels": { color: "#17171c", finish: "matte" },
        "panel-accents": { color: "#4b4f54", finish: "satin" },
        "wheel-rims": { color: "#17171c", finish: "matte" },
      },
    },
    {
      id: "sunset-gp",
      name: "Sunset GP",
      tag: "SHOP",
      zones: {
        "fairing-front": { color: "#cc5500", finish: "gloss" },
        "center-panels": { color: "#17171c", finish: "matte" },
        "side-panels": { color: "#17171c", finish: "matte" },
        "panel-accents": { color: "#f2f1ec", finish: "gloss" },
        "wheel-rims": { color: "#cc5500", finish: "gloss" },
      },
    },
    {
      id: "ice-runner",
      name: "Ice Runner",
      tag: "SHOP",
      zones: {
        "fairing-front": { color: "#a8a9ad", finish: "chrome" },
        "center-panels": { color: "#1b2a52", finish: "metallic" },
        "side-panels": { color: "#1b2a52", finish: "metallic" },
        "panel-accents": { color: "#c8cbd0", finish: "chrome" },
        "wheel-rims": { color: "#c8cbd0", finish: "chrome" },
      },
    },
    {
      id: "moss-club",
      name: "Moss Club",
      tag: "SHOP",
      zones: {
        "fairing-front": { color: "#2d5a3d", finish: "satin" },
        "center-panels": { color: "#17171c", finish: "matte" },
        "side-panels": { color: "#f2f1ec", finish: "gloss" },
        "panel-accents": { color: "#17171c", finish: "matte" },
        "wheel-rims": { color: "#17171c", finish: "matte" },
      },
    },
  ],
};

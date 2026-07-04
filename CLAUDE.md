# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (runs on http://localhost:3000, uses webpack bundler)
- **Build:** `npm run build`
- **Start production:** `npm start`
- **Lint:** `npm run lint` (ESLint 9 flat config with Next.js core-web-vitals + TypeScript rules)

## Architecture

This is a Next.js 16 app using the App Router with TypeScript, React 19, and Tailwind CSS v4.

- **App Router:** All routes live in `app/` — uses `layout.tsx` / `page.tsx` conventions
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`; theme tokens defined in `app/globals.css` using `@theme inline`
- **Fonts:** Geist and Geist Mono loaded via `next/font/google`, exposed as CSS variables `--font-geist-sans` and `--font-geist-mono`
- **React Compiler:** Enabled in `next.config.ts` (`reactCompiler: true`) with `babel-plugin-react-compiler`
- **Path alias:** `@/*` maps to project root (configured in `tsconfig.json`)

import { A } from "@solidjs/router";
import SettingsIcon from "../components/icons/SettingsIcon";
import ErrorGroupIcon from "../components/icons/ErrorGroupIcon";

export default function HomePage() {
  return (
    <main class="relative flex min-h-[calc(100vh-64px)] flex-1 flex-col items-center overflow-hidden px-4 sm:px-6 py-12 sm:py-16">
      {/* ===== Background atmosphere ===== */}
      <div class="pointer-events-none absolute inset-0">
        {/* Radial spotlight */}
        <div
          class="absolute left-1/2 top-0 h-full w-full -translate-x-1/2"
          style="background: radial-gradient(ellipse 60% 50% at 50% 20%, rgba(255,87,34,0.06) 0%, transparent 70%);"
        />
        {/* Slow spinning orbit ring */}
        <svg
          class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow text-b-border/40"
          width="700"
          height="700"
          viewBox="0 0 700 700"
          fill="none"
        >
          <circle
            cx="350"
            cy="350"
            r="340"
            stroke="currentColor"
            stroke-width="1"
            stroke-dasharray="8 12"
            opacity="0.5"
          />
          <circle
            cx="350"
            cy="350"
            r="280"
            stroke="currentColor"
            stroke-width="1"
            stroke-dasharray="4 16"
            opacity="0.3"
          />
        </svg>
        {/* Scan line */}
        <div class="absolute inset-x-0 animate-scan-line pointer-events-none">
          <div class="h-px w-full bg-gradient-to-r from-transparent via-b-accent/40 to-transparent" />
          <div class="h-8 w-full bg-gradient-to-b from-b-accent/5 to-transparent" />
        </div>
      </div>

      {/* ===== Content ===== */}
      <div class="relative z-10 flex w-full max-w-5xl flex-1 flex-col items-center justify-center">
        {/* Decorative frame corners */}
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-b-accent/30" />
          <div class="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-b-accent/30" />
          <div class="absolute left-0 bottom-0 h-8 w-8 border-l-2 border-b-2 border-b-accent/30" />
          <div class="absolute right-0 bottom-0 h-8 w-8 border-r-2 border-b-2 border-b-accent/30" />
        </div>

        {/* Hero text */}
        <div class="flex flex-col items-center text-center px-4">
          <h1 class="animate-fade-in-up font-['Anton',sans-serif] text-5xl sm:text-6xl md:text-7xl uppercase tracking-wide leading-none">
            <span class="bg-gradient-to-b from-b-ink via-b-ink to-b-ink/60 bg-clip-text text-transparent">
              Farsight RPC
            </span>
          </h1>

          <div class="animate-fade-in-up delay-200 mt-4 flex items-center gap-3">
            <div class="h-px w-8 bg-b-accent/60" />
            <span class="text-[0.65rem] font-bold uppercase tracking-[0.35em] text-b-accent">
              Overview
            </span>
            <div class="h-px w-8 bg-b-accent/60" />
          </div>
        </div>

        {/* Module cards */}
        <div class="animate-fade-in-up delay-500 mt-14 sm:mt-16 grid w-full grid-cols-1 gap-5 sm:grid-cols-2 px-2 sm:px-8">
          {/* Card 1 — Applications */}
          <A
            href="/applications"
            class="group relative flex flex-col items-center gap-6 border border-b-border bg-b-field/80 backdrop-blur-sm p-8 sm:p-10 transition-all duration-300 hover:border-b-accent/50 hover:bg-b-field hover:shadow-[0_8px_40px_rgba(255,87,34,0.12)] hover:-translate-y-1 outline-none focus-visible:ring-2 focus-visible:ring-b-accent/30 overflow-hidden"
          >
            {/* Corner brackets */}
            <div class="absolute left-3 top-3 h-4 w-4 border-l border-t border-b-accent/0 group-hover:border-b-accent/40 transition-colors duration-300" />
            <div class="absolute right-3 top-3 h-4 w-4 border-r border-t border-b-accent/0 group-hover:border-b-accent/40 transition-colors duration-300" />
            <div class="absolute left-3 bottom-3 h-4 w-4 border-l border-b border-b-accent/0 group-hover:border-b-accent/40 transition-colors duration-300" />
            <div class="absolute right-3 bottom-3 h-4 w-4 border-r border-b border-b-accent/0 group-hover:border-b-accent/40 transition-colors duration-300" />

            {/* Top accent line */}
            <div class="absolute left-0 top-0 h-[2px] w-0 bg-b-accent group-hover:w-full transition-all duration-500 ease-out" />

            <div class="flex size-16 items-center justify-center border border-b-border group-hover:border-b-accent/50 bg-b-paper/40 group-hover:bg-b-accent/10 transition-all duration-300">
              <SettingsIcon class="size-8 text-b-ink/50 group-hover:text-b-accent transition-colors duration-300" />
            </div>

            <div class="text-center">
              <h3 class="font-['Anton',sans-serif] text-3xl uppercase tracking-wide text-b-ink group-hover:text-b-accent transition-colors duration-300">
                Applications
              </h3>
              <p class="mt-2 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                Manage apps, environments, and endpoints
              </p>
            </div>
          </A>

          {/* Card 2 — Errors */}
          <A
            href="/errors"
            class="group relative flex flex-col items-center gap-6 border border-b-border bg-b-field/80 backdrop-blur-sm p-8 sm:p-10 transition-all duration-300 hover:border-b-accent/50 hover:bg-b-field hover:shadow-[0_8px_40px_rgba(255,87,34,0.12)] hover:-translate-y-1 outline-none focus-visible:ring-2 focus-visible:ring-b-accent/30 overflow-hidden"
          >
            {/* Corner brackets */}
            <div class="absolute left-3 top-3 h-4 w-4 border-l border-t border-b-accent/0 group-hover:border-b-accent/40 transition-colors duration-300" />
            <div class="absolute right-3 top-3 h-4 w-4 border-r border-t border-b-accent/0 group-hover:border-b-accent/40 transition-colors duration-300" />
            <div class="absolute left-3 bottom-3 h-4 w-4 border-l border-b border-b-accent/0 group-hover:border-b-accent/40 transition-colors duration-300" />
            <div class="absolute right-3 bottom-3 h-4 w-4 border-r border-b border-b-accent/0 group-hover:border-b-accent/40 transition-colors duration-300" />

            {/* Top accent line */}
            <div class="absolute left-0 top-0 h-[2px] w-0 bg-b-accent group-hover:w-full transition-all duration-500 ease-out" />

            <div class="flex size-16 items-center justify-center border border-b-border group-hover:border-b-accent/50 bg-b-paper/40 group-hover:bg-b-accent/10 transition-all duration-300">
              <ErrorGroupIcon class="size-8 text-b-ink/50 group-hover:text-b-accent transition-colors duration-300" />
            </div>

            <div class="text-center">
              <h3 class="font-['Anton',sans-serif] text-3xl uppercase tracking-wide text-b-ink group-hover:text-b-accent transition-colors duration-300">
                Errors
              </h3>
              <p class="mt-2 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                Error classification rules
              </p>
            </div>
          </A>
        </div>
      </div>
    </main>
  );
}

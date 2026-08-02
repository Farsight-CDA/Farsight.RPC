import { A } from "@solidjs/router";
import { For, Show, type JSX } from "solid-js";
import ArrowLeftIcon from "./icons/ArrowLeftIcon";
import { DETAIL_PAGE_MAX_WIDTH } from "../lib/layout";

export type DetailPageTab = {
  href: string;
  label: string;
  icon: JSX.Element;
  active: boolean;
};

type DetailPageHeaderProps = {
  backHref: string;
  backLabel: string;
  title: JSX.Element;
  tabs: DetailPageTab[];
  trailing?: JSX.Element;
  maxWidthClass?: string;
};

export default function DetailPageHeader(props: DetailPageHeaderProps) {
  return (
    <div class="shrink-0 border-b border-b-border bg-b-field/50 px-6 py-3">
      <div class={`mx-auto ${props.maxWidthClass ?? DETAIL_PAGE_MAX_WIDTH}`}>
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <A
              href={props.backHref}
              class="group flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-b-ink/50 transition-colors hover:text-b-accent"
            >
              <ArrowLeftIcon class="size-3.5 transition-transform group-hover:-translate-x-1" />
              {props.backLabel}
            </A>
            <h1 class="flex items-center gap-2.5 font-['Anton',sans-serif] text-3xl leading-none tracking-wide text-b-ink">
              {props.title}
            </h1>
          </div>

          <div class="flex items-center justify-between border-b border-b-border/50">
            <div class="flex">
              <For each={props.tabs}>
                {(tab) => (
                  <A
                    href={tab.href}
                    class={`flex items-center gap-1.5 px-4 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-all duration-200 ${
                      tab.active
                        ? "border-b-2 border-b-accent bg-b-accent/5 text-b-accent"
                        : "text-b-ink/50 hover:text-b-ink hover:bg-b-ink/5"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </A>
                )}
              </For>
            </div>
            <Show when={props.trailing}>{props.trailing}</Show>
          </div>
        </div>
      </div>
    </div>
  );
}

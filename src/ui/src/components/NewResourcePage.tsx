import { A } from "@solidjs/router";
import { Show, type Accessor, type JSX } from "solid-js";
import LoadingSpinner from "./LoadingSpinner";
import CloseIcon from "./icons/CloseIcon";
import {
  nameValidationHint,
  nameValidationPattern,
} from "../lib/name-validation";

type NewResourcePageProps = {
  icon: JSX.Element;
  title: string;
  subtitle: string;
  nameInputId: string;
  namePlaceholder: string;
  cancelHref: string;
  name: Accessor<string>;
  onNameChange: (name: string) => void;
  formError: Accessor<string | null>;
  loading: Accessor<boolean>;
  onSubmit: (e: SubmitEvent) => void;
  children?: JSX.Element;
};

export default function NewResourcePage(props: NewResourcePageProps) {
  return (
    <main class="flex flex-1 flex-col items-center gap-8 px-4 sm:px-6 py-8 sm:py-12">
      <div class="w-full max-w-3xl">
        <section class="border border-b-border bg-b-field overflow-hidden">
          <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center border border-b-accent/30 bg-b-accent/10">
                  {props.icon}
                </div>
                <div>
                  <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                    {props.title}
                  </h2>
                  <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    {props.subtitle}
                  </p>
                </div>
              </div>
              <A
                href={props.cancelHref}
                class="flex size-8 items-center justify-center border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200"
                aria-label="Close"
              >
                <CloseIcon class="size-4" />
              </A>
            </div>
          </div>

          <div class="p-6">
            <form onSubmit={props.onSubmit} class="flex flex-col gap-6">
              <div class="flex flex-col gap-2">
                <label
                  for={props.nameInputId}
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Name
                </label>
                <input
                  id={props.nameInputId}
                  type="text"
                  required
                  pattern={nameValidationPattern}
                  value={props.name()}
                  onInput={(e) => props.onNameChange(e.currentTarget.value)}
                  class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                  placeholder={props.namePlaceholder}
                  title={nameValidationHint}
                  autocomplete="off"
                />
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  {nameValidationHint}
                </p>
              </div>

              {props.children}

              <Show when={props.formError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {props.formError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <A
                  href={props.cancelHref}
                  class="btn btn-md btn-interactive btn-secondary text-center"
                >
                  Cancel
                </A>
                <button
                  type="submit"
                  disabled={props.loading()}
                  class="btn btn-md btn-interactive btn-disabled btn-primary"
                >
                  <Show when={props.loading()}>
                    <LoadingSpinner class="size-3.5 text-b-paper" />
                  </Show>
                  {props.loading() ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

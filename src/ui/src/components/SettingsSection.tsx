import { Show, type JSX } from "solid-js";

type Tone = "default" | "danger" | "warning";

const toneStyles: Record<Tone, {
  section: string;
  header: string;
  iconBox: string;
  title: string;
  subtitle: string;
}> = {
  default: {
    section: "border-b-border",
    header: "border-b-border bg-b-paper/30",
    iconBox: "border-b-ink/20 bg-b-ink/5",
    title: "text-b-ink",
    subtitle: "text-b-ink/50",
  },
  danger: {
    section: "border-red-500/30",
    header: "border-red-500/30 bg-red-500/5",
    iconBox: "border-red-500/30 bg-red-500/10",
    title: "text-red-400",
    subtitle: "text-red-400/60",
  },
  warning: {
    section: "border-amber-500/30",
    header: "border-amber-500/30 bg-amber-500/5",
    iconBox: "border-amber-500/30 bg-amber-500/10",
    title: "text-amber-400",
    subtitle: "text-amber-400/60",
  },
};

type SettingsSectionProps = {
  icon: JSX.Element;
  title: string;
  subtitle?: string;
  tone?: Tone;
  headerAction?: JSX.Element;
  contentClass?: string;
  children?: JSX.Element;
};

export default function SettingsSection(props: SettingsSectionProps) {
  const tone = () => props.tone ?? "default";

  return (
    <section
      class={`border ${toneStyles[tone()].section} bg-b-field overflow-hidden`}
    >
      <div
        class={`border-b ${toneStyles[tone()].header} px-6 py-4`}
      >
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div
              class={`flex size-10 items-center justify-center border ${
                toneStyles[tone()].iconBox
              } shrink-0`}
            >
              {props.icon}
            </div>
            <div>
              <h2
                class={`font-['Anton',sans-serif] text-xl uppercase tracking-wide ${
                  toneStyles[tone()].title
                }`}
              >
                {props.title}
              </h2>
              <Show when={props.subtitle}>
                <p
                  class={`text-xs font-bold uppercase tracking-widest ${
                    toneStyles[tone()].subtitle
                  }`}
                >
                  {props.subtitle}
                </p>
              </Show>
            </div>
          </div>
          <Show when={props.headerAction}>{props.headerAction}</Show>
        </div>
      </div>

      <Show when={props.children}>
        <div class={props.contentClass ?? "p-6"}>{props.children}</div>
      </Show>
    </section>
  );
}

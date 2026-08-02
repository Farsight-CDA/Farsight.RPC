import { createSignal, Show, type Accessor } from "solid-js";
import ColorPicker from "./ColorPicker";
import SettingsSection from "./SettingsSection";

type ColorSettingsSectionProps = {
  value: Accessor<string>;
  subtitle: string;
  onSave: (color: string) => Promise<void>;
  disabled?: Accessor<boolean>;
};

export default function ColorSettingsSection(props: ColorSettingsSectionProps) {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const isDisabled = () => props.disabled?.() ?? false;

  const handleChange = async (color: string) => {
    if (color === props.value() || loading() || isDisabled()) return;
    setError(null);
    setLoading(true);
    try {
      await props.onSave(color);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update color",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsSection
      icon={
        <div
          class="size-5 rounded-full border border-b-border"
          style={{ "background-color": props.value() }}
        />
      }
      title="Color"
      subtitle={props.subtitle}
    >
      <div class="flex flex-col gap-4">
        <ColorPicker
          value={props.value()}
          onChange={(color) => void handleChange(color)}
          disabled={loading() || isDisabled()}
        />
        <Show when={error()}>
          <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
            {error()}
          </p>
        </Show>
      </div>
    </SettingsSection>
  );
}

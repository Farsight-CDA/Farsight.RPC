import { useNavigate } from "@solidjs/router";
import { createSignal, For, Show } from "solid-js";
import NewResourcePage from "../components/NewResourcePage";
import ErrorGroupIcon from "../components/icons/ErrorGroupIcon";
import { useAuth } from "../lib/auth";
import { validateName } from "../lib/name-validation";
import { useReferenceData } from "../lib/reference-data";
import { ACTION_OPTIONS, readErrorMessage } from "../lib/error-groups";

export default function ErrorGroupNewPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [action, setAction] = createSignal("Transient");
  const [formError, setFormError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setFormError(null);
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    if (!token) return;

    const groupName = name();
    const validationError = validateName(groupName);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/RpcErrorGroups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: groupName,
          action: action(),
          errors: [],
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to create error group",
            "An error group with this name already exists.",
          ),
        );
      }
      const created = (await response.json()) as {
        id: string;
        name: string;
        action: string;
        errors: string[];
      };
      referenceData.addErrorGroup(created);
      navigate(`/errors/${created.id}`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create error group",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <NewResourcePage
      icon={<ErrorGroupIcon class="size-5 text-b-accent" />}
      title="New Error Group"
      subtitle="Create a new RPC error classification rule"
      nameInputId="new-group-name"
      namePlaceholder="CRITICAL_ERRORS"
      cancelHref="/errors"
      name={name}
      onNameChange={handleNameChange}
      formError={formError}
      loading={loading}
      onSubmit={handleSubmit}
    >
      <div class="flex flex-col gap-2">
        <label
          for="new-group-action"
          class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
        >
          Action
        </label>
        <select
          id="new-group-action"
          value={action()}
          onChange={(e) => setAction(e.currentTarget.value)}
          class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200 appearance-none cursor-pointer"
        >
          <For each={ACTION_OPTIONS}>
            {(opt) => <option value={opt}>{opt}</option>}
          </For>
        </select>
        <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
          Transient: temporary degrade. SoftOverwhelmed: moderate overload.
          HardOverwhelmed: severe failure.
        </p>
      </div>
    </NewResourcePage>
  );
}

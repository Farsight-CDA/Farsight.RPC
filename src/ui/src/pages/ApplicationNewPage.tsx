import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import ColorPicker from "../components/ColorPicker";
import NewResourcePage from "../components/NewResourcePage";
import ListIcon from "../components/icons/ListIcon";
import { useAuth } from "../lib/auth";
import { validateName } from "../lib/name-validation";
import { useReferenceData } from "../lib/reference-data";

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (data.message && data.message !== "One or more errors occurred!")
      return data.message;
    const first = data.errors && Object.values(data.errors).flat()[0];
    if (first) return first;
  } catch {}
  if (response.status === 409)
    return "An application with this name already exists.";
  return fallback;
}

export default function ApplicationNewPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [color, setColor] = createSignal("#6B7280");
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

    const appName = name();
    const validationError = validateName(appName);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/Applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: appName,
          color: color(),
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to create application"),
        );
      }
      const created = (await response.json()) as {
        id: string;
        name: string;
        color: string;
      };
      referenceData.addApplication({
        id: created.id,
        name: created.name,
        color: created.color,
        apiKeyCount: 0,
        rpcCount: 0,
      });
      navigate(`/applications/${created.id}`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create application",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <NewResourcePage
      icon={<ListIcon class="size-5 text-b-accent" />}
      title="New Application"
      subtitle="Create a new RPC consumer application"
      nameInputId="new-app-name"
      namePlaceholder="MY APPLICATION"
      cancelHref="/applications"
      name={name}
      onNameChange={handleNameChange}
      formError={formError}
      loading={loading}
      onSubmit={handleSubmit}
    >
      <div class="flex flex-col gap-2">
        <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
          Color
        </label>
        <ColorPicker value={color()} onChange={setColor} disabled={loading()} />
      </div>
    </NewResourcePage>
  );
}

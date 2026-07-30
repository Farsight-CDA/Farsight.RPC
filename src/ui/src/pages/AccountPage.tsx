import { createSignal, For, onMount, Show } from "solid-js";
import KeyIcon from "../components/icons/KeyIcon";
import LoadingSpinner from "../components/LoadingSpinner";
import TrashIcon from "../components/icons/TrashIcon";
import UserIcon from "../components/icons/UserIcon";
import { useAuth } from "../lib/auth";
import { createModalBackdropHandlers } from "../lib/createModalBackdropHandlers";
import { useEscapeKey } from "../lib/useEscapeKey";
import {
  isWebAuthnSupported,
  serializeAttestation,
  toCreationOptions,
  webAuthnErrorMessage,
  type CredentialCreateOptionsJson,
} from "../lib/webauthn";

interface SecurityKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

async function readErrorMessage(
  response: Response,
  fallback: string,
  conflictHint?: string,
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
    return conflictHint ?? "This security key is already registered.";
  return fallback;
}

function formatDate(iso?: string) {
  if (!iso) return "Never used";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AccountPage() {
  const auth = useAuth();

  const [keys, setKeys] = createSignal<SecurityKey[] | null>(null);
  const [loadError, setLoadError] = createSignal<string | null>(null);

  const [keyName, setKeyName] = createSignal("");
  const [addError, setAddError] = createSignal<string | null>(null);
  const [addLoading, setAddLoading] = createSignal(false);

  const [keyToRemove, setKeyToRemove] = createSignal<SecurityKey | null>(null);
  const [removeError, setRemoveError] = createSignal<string | null>(null);
  const [removeLoading, setRemoveLoading] = createSignal(false);

  const loadKeys = async () => {
    const token = auth.token;
    if (!token) return;
    try {
      const response = await fetch("/api/Auth/SecurityKeys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to load security keys"),
        );
      }
      setKeys((await response.json()) as SecurityKey[]);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load security keys",
      );
    }
  };

  onMount(() => void loadKeys());

  const handleAddKey = async (e: SubmitEvent) => {
    e.preventDefault();
    const token = auth.token;
    if (!token) return;

    const name = keyName().trim();
    if (!name) {
      setAddError("Enter a name for the security key.");
      return;
    }
    if (!isWebAuthnSupported()) {
      setAddError("This browser does not support security keys.");
      return;
    }

    setAddError(null);
    setAddLoading(true);
    try {
      const optionsResponse = await fetch("/api/Auth/SecurityKeys/Options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!optionsResponse.ok) {
        throw new Error(
          await readErrorMessage(
            optionsResponse,
            "Failed to start security key registration",
          ),
        );
      }
      const { challengeId, options } = (await optionsResponse.json()) as {
        challengeId: string;
        options: CredentialCreateOptionsJson;
      };

      let credential: Credential | null;
      try {
        credential = await navigator.credentials.create({
          publicKey: toCreationOptions(options),
        });
      } catch (err) {
        throw new Error(
          webAuthnErrorMessage(err, "Security key registration failed"),
        );
      }
      if (!(credential instanceof PublicKeyCredential)) {
        throw new Error("Security key registration failed");
      }

      const registerResponse = await fetch("/api/Auth/SecurityKeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId,
          attestation: serializeAttestation(credential),
        }),
      });
      if (!registerResponse.ok) {
        throw new Error(
          await readErrorMessage(
            registerResponse,
            "Failed to register security key",
            "This security key is already registered.",
          ),
        );
      }

      setKeyName("");
      await loadKeys();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Failed to register security key",
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    const token = auth.token;
    const key = keyToRemove();
    if (!token || !key) return;
    setRemoveError(null);
    setRemoveLoading(true);
    try {
      const response = await fetch(`/api/Auth/SecurityKeys/${key.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to remove security key"),
        );
      }
      setKeyToRemove(null);
      await loadKeys();
    } catch (err) {
      setRemoveError(
        err instanceof Error ? err.message : "Failed to remove security key",
      );
    } finally {
      setRemoveLoading(false);
    }
  };

  const removeModalOpen = () => keyToRemove() !== null;
  const closeRemoveModal = () => {
    if (!removeLoading()) setKeyToRemove(null);
  };
  useEscapeKey(removeModalOpen, closeRemoveModal);
  const removeKeyBackdropHandlers = createModalBackdropHandlers(closeRemoveModal);

  return (
    <>
      <main class="flex flex-1 flex-col items-center gap-8 px-4 sm:px-6 py-12 sm:py-16 overflow-y-auto min-h-0">
        <div class="w-full max-w-3xl flex flex-col gap-6">
          <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center border border-b-ink/20 bg-b-ink/5">
              <UserIcon class="size-5 text-b-ink/70" />
            </div>
            <div>
              <h2 class="font-['Anton',sans-serif] text-3xl sm:text-4xl uppercase leading-none text-b-ink">
                Account
              </h2>
              <p class="mt-1 text-xs font-bold uppercase tracking-widest text-b-ink/50">
                Signed in as {auth.username}
              </p>
            </div>
          </div>

          <section class="border border-b-border bg-b-field overflow-hidden">
            <div class="border-b border-b-border bg-b-paper/30 px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center border border-b-ink/20 bg-b-ink/5">
                  <KeyIcon class="size-5 text-b-ink/70" />
                </div>
                <div>
                  <h2 class="font-['Anton',sans-serif] text-xl uppercase tracking-wide text-b-ink">
                    Security Keys
                  </h2>
                  <p class="text-xs font-bold uppercase tracking-widest text-b-ink/50">
                    FIDO2 two-factor authentication
                  </p>
                </div>
              </div>
            </div>

            <div class="p-6 flex flex-col gap-6">
              <Show when={!isWebAuthnSupported()}>
                <p class="border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-amber-300">
                  This browser does not support security keys.
                </p>
              </Show>

              <form onSubmit={handleAddKey} class="flex flex-col gap-2">
                <label
                  for="security-key-name"
                  class="text-xs font-bold uppercase tracking-widest text-b-ink/70"
                >
                  Add a security key
                </label>
                <div class="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="security-key-name"
                    type="text"
                    required
                    maxLength={100}
                    autocomplete="off"
                    value={keyName()}
                    onInput={(e) => {
                      setKeyName(e.currentTarget.value);
                      setAddError(null);
                    }}
                    class="h-11 w-full border border-b-border bg-b-paper px-4 text-sm font-semibold text-b-ink placeholder:text-b-ink/25 outline-none focus-visible:border-b-accent/50 focus-visible:ring-2 focus-visible:ring-b-accent/20 hover:border-b-border-hover transition-all duration-200"
                    placeholder="YUBIKEY 5"
                  />
                  <button
                    type="submit"
                    disabled={
                      addLoading() || keys() === null || !isWebAuthnSupported()
                    }
                    class="btn btn-md btn-interactive btn-disabled btn-primary shrink-0"
                  >
                    <Show when={addLoading()}>
                      <LoadingSpinner class="size-3.5 text-b-paper" />
                    </Show>
                    {addLoading() ? "Waiting for key…" : "Add security key"}
                  </button>
                </div>
                <p class="text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                  Once registered, a security key is required to sign in.
                </p>
                <Show when={addError()}>
                  <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                    {addError()}
                  </p>
                </Show>
              </form>

              <Show when={keys() === null && !loadError()}>
                <div class="flex items-center justify-center gap-3 py-8 text-xs font-bold uppercase tracking-widest text-b-ink/80">
                  <LoadingSpinner class="size-4" />
                  Loading keys…
                </div>
              </Show>

              <Show when={loadError()}>
                <p class="border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {loadError()}
                </p>
              </Show>

              <Show when={keys() !== null && keys()!.length > 0}>
                <ul class="flex flex-col gap-4">
                  <For each={keys()!}>
                    {(key) => (
                      <li class="border border-b-border bg-b-paper/40 shadow-[0_1px_0_rgba(0,0,0,0.35)] transition-colors hover:border-b-border-hover">
                        <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                          <div class="min-w-0 flex-1">
                            <p class="truncate text-sm font-bold uppercase tracking-wider text-b-ink">
                              {key.name}
                            </p>
                            <p class="mt-1 text-xs font-semibold uppercase tracking-wider text-b-ink/40">
                              Added{" "}
                              <span class="font-bold normal-case tracking-normal text-b-ink/70">
                                {formatDate(key.createdAt)}
                              </span>
                              {" · "}Last used{" "}
                              <span class="font-bold normal-case tracking-normal text-b-ink/70">
                                {formatDate(key.lastUsedAt)}
                              </span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setRemoveError(null);
                              setKeyToRemove(key);
                            }}
                            disabled={addLoading() || removeLoading()}
                            class="btn btn-sm btn-interactive btn-disabled btn-danger shrink-0"
                            title="Remove security key"
                          >
                            <TrashIcon class="size-4" />
                          </button>
                        </div>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>

              <Show when={keys() !== null && keys()!.length === 0}>
                <div class="flex flex-col items-center justify-center gap-3 py-8 border border-b-border/50 bg-b-paper/20">
                  <KeyIcon class="size-10 text-b-ink/20" />
                  <p class="text-sm font-semibold uppercase tracking-wider text-b-ink/50">
                    No security keys registered yet.
                  </p>
                </div>
              </Show>
            </div>
          </section>
        </div>
      </main>

      <Show when={keyToRemove()} keyed>
        {(key) => (
          <div
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
            role="presentation"
            {...removeKeyBackdropHandlers}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-security-key-title"
              class="w-full max-w-md border border-red-500/30 bg-b-field p-8 shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()}
            >
              <p class="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-red-400">
                Confirm Removal
              </p>
              <h3
                id="remove-security-key-title"
                class="mb-4 font-['Anton',sans-serif] text-4xl uppercase leading-none tracking-wide text-b-ink"
              >
                Remove Security Key
              </h3>
              <p class="mb-4 text-sm font-semibold text-b-ink/70">
                Permanently remove{" "}
                <span class="font-bold text-red-400">{key.name}</span>? You will
                no longer be able to sign in with this key.
              </p>
              <Show when={(keys()?.length ?? 0) <= 1}>
                <p class="mb-4 text-sm font-semibold text-b-ink/70">
                  This is your only registered key. Removing it means sign-in
                  will no longer require a security key.
                </p>
              </Show>

              <Show when={removeError()}>
                <p class="mb-6 border border-red-500/40 bg-red-500/10 px-3 py-3 text-xs font-bold uppercase leading-snug text-red-400">
                  {removeError()}
                </p>
              </Show>

              <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRemoveModal}
                  disabled={removeLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemoveKey()}
                  disabled={removeLoading()}
                  class="btn btn-md btn-interactive btn-disabled btn-danger"
                >
                  <Show when={removeLoading()}>
                    <LoadingSpinner class="size-3.5" />
                  </Show>
                  {removeLoading() ? "Removing…" : "Remove"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Show>
    </>
  );
}

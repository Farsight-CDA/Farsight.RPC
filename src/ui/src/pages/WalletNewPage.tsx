import { useNavigate } from "@solidjs/router";
import { createSignal } from "solid-js";
import ColorPicker from "../components/ColorPicker";
import MnemonicInput from "../components/MnemonicInput";
import NewResourcePage from "../components/NewResourcePage";
import WalletIcon from "../components/icons/WalletIcon";
import { useAuth } from "../lib/auth";
import { readErrorMessage } from "../lib/error-groups";
import { validateName } from "../lib/name-validation";
import { useReferenceData } from "../lib/reference-data";

export default function WalletNewPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();

  const [name, setName] = createSignal("");
  const [color, setColor] = createSignal("#6B7280");
  const [mnemonic, setMnemonic] = createSignal("");
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

    const walletName = name();
    const validationError = validateName(walletName);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const mnemonicWords = mnemonic().trim().split(/\s+/).filter(Boolean);
    if (mnemonicWords.length !== 12 && mnemonicWords.length !== 24) {
      setFormError("Mnemonic must contain exactly 12 or 24 words.");
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/Wallets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: walletName,
          mnemonic: mnemonicWords.join(" "),
          color: color(),
        }),
      });
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to create wallet",
            "A wallet with this name already exists.",
          ),
        );
      }
      const created = (await response.json()) as {
        id: string;
        name: string;
        color: string;
      };
      referenceData.addWallet({
        id: created.id,
        name: created.name,
        color: created.color,
        privateKeyCount: 0,
      });
      navigate(`/wallets/${created.id}`);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create wallet",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <NewResourcePage
      icon={<WalletIcon class="size-5 text-b-accent" />}
      title="New Wallet"
      subtitle="Create a new wallet"
      nameInputId="new-wallet-name"
      namePlaceholder="MY WALLET"
      cancelHref="/wallets"
      name={name}
      onNameChange={handleNameChange}
      formError={formError}
      loading={loading}
      onSubmit={handleSubmit}
    >
      <MnemonicInput onChange={setMnemonic} disabled={loading()} />
      <div class="flex flex-col gap-2">
        <label class="text-xs font-bold uppercase tracking-widest text-b-ink/70">
          Color
        </label>
        <ColorPicker value={color()} onChange={setColor} disabled={loading()} />
      </div>
    </NewResourcePage>
  );
}

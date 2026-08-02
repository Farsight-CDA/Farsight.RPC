import { useNavigate, useParams } from "@solidjs/router";
import { createMemo, Show } from "solid-js";
import ColorSettingsSection from "../components/ColorSettingsSection";
import DeleteSection from "../components/DeleteSection";
import InlineNameEdit from "../components/InlineNameEdit";
import MnemonicSection from "../components/MnemonicSection";
import SettingsSection from "../components/SettingsSection";
import SettingsIcon from "../components/icons/SettingsIcon";
import { useAuth } from "../lib/auth";
import { readErrorMessage } from "../lib/error-groups";
import { useReferenceData } from "../lib/reference-data";

export default function WalletGeneralPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();
  const params = useParams();
  const walletId = () => params.walletId;

  const wallets = referenceData.wallets.data;
  const wallet = createMemo(
    () => wallets().find((w) => w.id === walletId()) ?? null,
  );

  const handleUpdateName = async (newName: string) => {
    const token = auth.token;
    const w = wallet();
    if (!token || !w) return;

    const response = await fetch(`/api/Wallets/${w.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: newName }),
    });
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(
          response,
          "Failed to update wallet",
          "A wallet with this name already exists.",
        ),
      );
    }
    await referenceData.refreshWallets();
  };

  const handleUpdateColor = async (newColor: string) => {
    const token = auth.token;
    const w = wallet();
    if (!token || !w) return;

    const response = await fetch(`/api/Wallets/${w.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ color: newColor }),
    });
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Failed to update wallet color"),
      );
    }
    await referenceData.refreshWallets();
  };

  const handleDelete = async () => {
    const token = auth.token;
    const w = wallet();
    if (!token || !w) return;

    const response = await fetch(`/api/Wallets/${w.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Failed to delete wallet"),
      );
    }
    referenceData.removeWallet(w.id);
    navigate("/wallets");
  };

  return (
    <div class="flex flex-col gap-6">
      <SettingsSection
        icon={<SettingsIcon class="size-5 text-b-ink/70" />}
        title="General Settings"
        subtitle="Manage wallet name"
      >
        <InlineNameEdit
          value={() => wallet()?.name ?? ""}
          label="Wallet Name"
          onSave={handleUpdateName}
          editButtonTitle="Rename wallet"
          inputId="edit-wallet-name"
        />
      </SettingsSection>

      <ColorSettingsSection
        value={() => wallet()?.color ?? "#6B7280"}
        subtitle="Visual identifier for the wallets list"
        onSave={handleUpdateColor}
      />

      <MnemonicSection walletId={walletId()} />

      <DeleteSection
        title="Delete Wallet"
        subtitle="Remove all data permanently"
        buttonTitle="Delete wallet"
        onDelete={handleDelete}
      >
        <p class="text-sm font-semibold text-b-ink/70">
          Permanently delete{" "}
          <span class="font-bold text-red-400">{wallet()?.name}</span>? This
          will remove its{" "}
          <span class="font-bold text-b-ink">
            {wallet()?.privateKeyCount ?? 0} private key
            {wallet()?.privateKeyCount === 1 ? "" : "s"}
          </span>{" "}
          and any associated API keys. This cannot be undone.
        </p>
      </DeleteSection>
    </div>
  );
}

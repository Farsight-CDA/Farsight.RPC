import { useNavigate, useParams } from "@solidjs/router";
import { createMemo } from "solid-js";
import ColorSettingsSection from "../components/ColorSettingsSection";
import DeleteSection from "../components/DeleteSection";
import InlineNameEdit from "../components/InlineNameEdit";
import SettingsSection from "../components/SettingsSection";
import SettingsIcon from "../components/icons/SettingsIcon";
import { useAuth } from "../lib/auth";
import { readErrorMessage } from "../lib/error-groups";
import { useReferenceData } from "../lib/reference-data";

export default function ApplicationGeneralPage() {
  const auth = useAuth();
  const referenceData = useReferenceData();
  const navigate = useNavigate();
  const params = useParams();
  const applicationId = () => params.applicationId;

  const applications = referenceData.applications.data;
  const application = createMemo(
    () => applications().find((app) => app.id === applicationId()) ?? null,
  );

  const handleUpdateName = async (newName: string) => {
    const token = auth.token;
    const app = application();
    if (!token || !app) return;

    const response = await fetch(`/api/Applications/${app.id}`, {
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
          "Failed to rename application",
          "An application with this name already exists.",
        ),
      );
    }
    await referenceData.refreshApplications();
  };

  const handleUpdateColor = async (newColor: string) => {
    const token = auth.token;
    const app = application();
    if (!token || !app) return;

    const response = await fetch(`/api/Applications/${app.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ color: newColor }),
    });
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Failed to update color"),
      );
    }
    await referenceData.refreshApplications();
  };

  const handleDeleteApplication = async () => {
    const token = auth.token;
    const app = application();
    if (!token || !app) return;

    const response = await fetch(`/api/Applications/${app.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "Failed to delete application"),
      );
    }
    referenceData.removeApplication(app.id);
    navigate("/", { replace: true });
  };

  return (
    <div class="flex flex-col gap-6">
      <SettingsSection
        icon={<SettingsIcon class="size-5 text-b-ink/70" />}
        title="General Settings"
        subtitle="Manage application name"
      >
        <InlineNameEdit
          value={() => application()?.name ?? ""}
          label="Application Name"
          onSave={handleUpdateName}
          editButtonTitle="Rename application"
          inputId="edit-app-name"
        />
      </SettingsSection>

      <ColorSettingsSection
        value={() => application()?.color ?? "#6B7280"}
        subtitle="Visual identifier for the applications list"
        onSave={handleUpdateColor}
      />

      <DeleteSection
        title="Delete Application"
        subtitle="Remove all data permanently"
        buttonTitle="Delete application"
        onDelete={handleDeleteApplication}
      >
        <div class="flex flex-col gap-4">
          <p class="text-sm font-semibold text-b-ink/70">
            Permanently delete{" "}
            <span class="font-bold text-red-400">{application()?.name}</span>?
            This cannot be undone.
          </p>
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-sm text-b-ink/60">
              <span class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500/10 px-1.5 text-xs font-bold text-red-400">
                {application()?.rpcCount ?? 0}
              </span>
              <span>
                RPC{application()?.rpcCount === 1 ? "" : "s"} will be deleted
              </span>
            </div>
            <div class="flex items-center gap-2 text-sm text-b-ink/60">
              <span class="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500/10 px-1.5 text-xs font-bold text-red-400">
                {application()?.apiKeyCount ?? 0}
              </span>
              <span>
                API key{application()?.apiKeyCount === 1 ? "" : "s"} will be
                deleted
              </span>
            </div>
          </div>
        </div>
      </DeleteSection>
    </div>
  );
}

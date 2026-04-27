export const ACTION_OPTIONS = ["Transient", "SoftOverwhelmed", "HardOverwhelmed"] as const;

export function actionBadgeClass(action: string): string {
  switch (action) {
    case "Transient":
      return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    case "SoftOverwhelmed":
      return "text-orange-400 border-orange-500/30 bg-orange-500/10";
    case "HardOverwhelmed":
      return "text-red-400 border-red-500/30 bg-red-500/10";
    default:
      return "text-b-ink/50 border-b-border bg-b-paper/30";
  }
}

export function validateErrorValue(value: string): string | null {
  if (value.length === 0) return null;
  if (value.trim() !== value)
    return "Error values cannot have leading or trailing whitespace.";
  return null;
}

export async function readErrorMessage(
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
    return conflictHint ?? "An error group with this name already exists.";
  return fallback;
}

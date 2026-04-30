export type RpcTypeName = "Realtime" | "Archive" | "Tracing";

export type RpcRequirementMode = "Fixed" | "Range" | "AtLeast" | "AtMost";

export type RpcTypeRequirement = {
  mode: RpcRequirementMode;
  count?: number;
  min?: number;
  max?: number;
};

export type RpcStructureDefinition = {
  realtime: RpcTypeRequirement;
  archive: RpcTypeRequirement;
  tracing: RpcTypeRequirement;
};

type RpcStructureInput = {
  realtime?: Partial<RpcTypeRequirement> | null;
  archive?: Partial<RpcTypeRequirement> | null;
  tracing?: Partial<RpcTypeRequirement> | null;
};

export const rpcTypes: RpcTypeName[] = ["Realtime", "Archive", "Tracing"];

export const rpcTypeStructureKey: Record<RpcTypeName, keyof RpcStructureDefinition> = {
  Realtime: "realtime",
  Archive: "archive",
  Tracing: "tracing",
};

export const defaultRpcStructure: RpcStructureDefinition = {
  realtime: { mode: "AtLeast", count: 0 },
  archive: { mode: "AtLeast", count: 0 },
  tracing: { mode: "AtLeast", count: 0 },
};

export function normalizeRpcStructure(
  structure?: RpcStructureInput | null,
): RpcStructureDefinition {
  return {
    realtime: normalizeRequirement(structure?.realtime),
    archive: normalizeRequirement(structure?.archive),
    tracing: normalizeRequirement(structure?.tracing),
  };
}

export function normalizeRequirement(
  requirement?: Partial<RpcTypeRequirement> | null,
): RpcTypeRequirement {
  if (!requirement) return { mode: "AtLeast", count: 0 };

  switch (requirement.mode) {
    case "Fixed":
      return { mode: "Fixed", count: clampCount(requirement.count) };
    case "Range": {
      const normalizedMin = clampCount(requirement.min);
      const normalizedMax = Math.max(normalizedMin, clampCount(requirement.max));
      return { mode: "Range", min: normalizedMin, max: normalizedMax };
    }
    case "AtMost":
      return { mode: "AtMost", count: clampCount(requirement.count) };
    case "AtLeast":
    default:
      return { mode: "AtLeast", count: clampCount(requirement.count) };
  }
}

export function requirementMatches(
  count: number,
  requirement: RpcTypeRequirement,
): boolean {
  switch (requirement.mode) {
    case "Fixed":
      return count === (requirement.count ?? 0);
    case "Range":
      return count >= (requirement.min ?? 0) && count <= (requirement.max ?? 0);
    case "AtMost":
      return count <= (requirement.count ?? 0);
    case "AtLeast":
      return count >= (requirement.count ?? 0);
  }
}

export function formatRequirement(requirement: RpcTypeRequirement): string {
  switch (requirement.mode) {
    case "Fixed":
      return `${requirement.count ?? 0}x`;
    case "Range":
      return `${requirement.min ?? 0}-${requirement.max ?? 0}x`;
    case "AtMost":
      return `<= ${requirement.count ?? 0}x`;
    case "AtLeast":
      return `>= ${requirement.count ?? 0}x`;
  }
}

function clampCount(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

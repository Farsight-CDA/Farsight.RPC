import type {
  ApplicationRpc,
  ApplicationRpcRule,
  RpcRuleSeverity,
} from "./application-data";

export type RpcCapability =
  | "Archive"
  | "DebugApi"
  | "DebugJsTracers"
  | "TracingApi"
  | "StateOverrides"
  | "BlockOverrides"
  | "Subscriptions"
  | "GetLogs"
  | "SendRawTransaction"
  | "CreateAccessList";

export const allCapabilities: RpcCapability[] = [
  "Archive",
  "DebugApi",
  "DebugJsTracers",
  "TracingApi",
  "StateOverrides",
  "BlockOverrides",
  "Subscriptions",
  "GetLogs",
  "SendRawTransaction",
  "CreateAccessList",
];

export function isKnownCapability(value: string): value is RpcCapability {
  return allCapabilities.includes(value as RpcCapability);
}

export function chainRuleFailureSeverity(
  chain: string,
  environmentId: string,
  rpcs: ApplicationRpc[],
  rules: ApplicationRpcRule[],
): RpcRuleSeverity | null {
  const environmentRules = rules.filter(
    (rule) =>
      rule.environmentId === environmentId &&
      (rule.chains.length === 0 || rule.chains.includes(chain)),
  );
  if (environmentRules.length === 0) return null;

  const chainRpcs = rpcs.filter(
    (rpc) => rpc.chain === chain && rpc.environmentId === environmentId,
  );

  let failureSeverity: RpcRuleSeverity | null = null;
  for (const rule of environmentRules) {
    const allOf = rule.allOf.filter(isKnownCapability);
    const anyOf = rule.anyOf.filter(isKnownCapability);

    const hasMatchingRpc = chainRpcs.some((rpc) => {
      const rpcCapabilities = new Set(
        rpc.capabilities.filter(isKnownCapability),
      );

      return (
        allOf.every((capability) => rpcCapabilities.has(capability)) &&
        (anyOf.length === 0 ||
          anyOf.some((capability) => rpcCapabilities.has(capability)))
      );
    });

    if (!hasMatchingRpc) {
      if (rule.severity === "Red") return "Red";
      failureSeverity = "Yellow";
    }
  }

  return failureSeverity;
}

export function highestChainRuleFailureSeverity(
  environmentId: string | undefined,
  chains: string[],
  rpcs: ApplicationRpc[],
  rules: ApplicationRpcRule[],
): RpcRuleSeverity | null {
  if (!environmentId) return null;
  let failureSeverity: RpcRuleSeverity | null = null;
  for (const chain of chains) {
    const chainSeverity = chainRuleFailureSeverity(
      chain,
      environmentId,
      rpcs,
      rules,
    );
    if (chainSeverity === "Red") return "Red";
    if (chainSeverity === "Yellow") failureSeverity = "Yellow";
  }
  return failureSeverity;
}

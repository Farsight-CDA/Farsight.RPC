import type { ApplicationRpc, ApplicationRpcRule } from "./application-data";

export type RpcCapability =
  | "Archive"
  | "DebugApi"
  | "TracingApi"
  | "StateOverrides"
  | "BlockOverrides"
  | "Subscriptions"
  | "GetLogs"
  | "SendRawTransaction";

export const allCapabilities: RpcCapability[] = [
  "Archive",
  "DebugApi",
  "TracingApi",
  "StateOverrides",
  "BlockOverrides",
  "Subscriptions",
  "GetLogs",
  "SendRawTransaction",
];

export function isKnownCapability(value: string): value is RpcCapability {
  return allCapabilities.includes(value as RpcCapability);
}

export function chainRuleValidation(
  chain: string,
  environmentId: string,
  rpcs: ApplicationRpc[],
  rules: ApplicationRpcRule[],
): boolean {
  const environmentRules = rules.filter(
    (rule) =>
      rule.environmentId === environmentId &&
      (rule.chains.length === 0 || rule.chains.includes(chain)),
  );
  if (environmentRules.length === 0) return true;

  const chainRpcs = rpcs.filter(
    (rpc) => rpc.chain === chain && rpc.environmentId === environmentId,
  );

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

    if (!hasMatchingRpc) return false;
  }

  return true;
}

export function anyChainFailsValidation(
  environmentId: string | undefined,
  chains: string[],
  rpcs: ApplicationRpc[],
  rules: ApplicationRpcRule[],
): boolean {
  if (!environmentId) return false;
  for (const chain of chains) {
    if (!chainRuleValidation(chain, environmentId, rpcs, rules)) {
      return true;
    }
  }
  return false;
}

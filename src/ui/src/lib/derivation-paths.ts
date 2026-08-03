export const MAX_DERIVATION_INDEX = 2147483647;

export const derivationPathPattern = "^m(?:\\/[0-9]+'?)+$";

export const derivationPathHint =
  "BIP44 path, e.g. m/44'/60'/0'/0/0. Ed25519 requires all segments to be hardened (trailing apostrophe).";

export type DerivationCurve = "Secp256k1" | "Ed25519";

export type AddressFormat = "Evm" | "Solana";

export type NamedDerivationPath = {
  id: string;
  label: string;
  description: string;
  curve: DerivationCurve;
  addressFormat: AddressFormat;
  /** Path prefix before the index segment, e.g. "m/44'/60'/0'/0/". */
  prefix: string;
  /** Path suffix after the index segment, e.g. "/0'". */
  suffix: string;
  /** Whether the index segment is hardened (trailing apostrophe). */
  hardenedIndex: boolean;
  /** Regex matching the full path, with the index as capture group 1. */
  pattern: RegExp;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildPattern(
  prefix: string,
  hardenedIndex: boolean,
  suffix: string,
): RegExp {
  const indexSegment = hardenedIndex ? "(\\d+)'" : "(\\d+)";
  return new RegExp(
    `^${escapeRegExp(prefix)}${indexSegment}${escapeRegExp(suffix)}$`,
  );
}

const NAMED_DERIVATION_PATH_DEFINITIONS: readonly Omit<
  NamedDerivationPath,
  "pattern"
>[] = [
  {
    id: "evm",
    label: "EVM",
    description: "Ethereum",
    curve: "Secp256k1",
    addressFormat: "Evm",
    prefix: "m/44'/60'/0'/0/",
    suffix: "",
    hardenedIndex: false,
  },
  {
    id: "solana",
    label: "Solana",
    description: "Solana",
    curve: "Ed25519",
    addressFormat: "Solana",
    prefix: "m/44'/501'/",
    suffix: "/0'",
    hardenedIndex: true,
  },
];

export const NAMED_DERIVATION_PATHS: readonly NamedDerivationPath[] =
  NAMED_DERIVATION_PATH_DEFINITIONS.map((definition) => ({
    ...definition,
    pattern: buildPattern(
      definition.prefix,
      definition.hardenedIndex,
      definition.suffix,
    ),
  }));

export type NamedDerivationPathMatch = {
  namedPath: NamedDerivationPath;
  index: number;
};

export function getNamedDerivationPath(
  id: string,
): NamedDerivationPath | null {
  return NAMED_DERIVATION_PATHS.find((namedPath) => namedPath.id === id) ?? null;
}

export function matchNamedDerivationPath(
  path: string,
): NamedDerivationPathMatch | null {
  for (const namedPath of NAMED_DERIVATION_PATHS) {
    const match = namedPath.pattern.exec(path);
    if (match) {
      const index = Number(match[1]);
      if (Number.isSafeInteger(index) && index >= 0) {
        return { namedPath, index };
      }
    }
  }
  return null;
}

export function isValidDerivationPath(path: string): boolean {
  return new RegExp(derivationPathPattern).test(path);
}

export function validateDerivationIndex(rawIndex: string): string | null {
  const value = rawIndex.trim();
  if (!/^\d+$/.test(value)) {
    return "Index must be a non-negative integer.";
  }
  const index = Number(value);
  if (!Number.isSafeInteger(index) || index > MAX_DERIVATION_INDEX) {
    return `Index must be between 0 and ${MAX_DERIVATION_INDEX}.`;
  }
  return null;
}

export function createNamedDerivationPath(
  id: string,
  index: number,
): string | null {
  const namedPath = getNamedDerivationPath(id);
  if (
    !namedPath ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index > MAX_DERIVATION_INDEX
  ) {
    return null;
  }
  return `${namedPath.prefix}${index}${namedPath.hardenedIndex ? "'" : ""}${namedPath.suffix}`;
}

export function formatDerivationPath(path: string): string {
  const match = matchNamedDerivationPath(path);
  return match ? `${match.namedPath.label} #${match.index}` : path;
}

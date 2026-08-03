export function formatLastUsed(iso?: string): string {
  if (!iso) return "Never used";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function truncateMiddle(
  value: string,
  headLength = 8,
  tailLength = 6,
): string {
  if (value.length <= headLength + tailLength) return value;
  return `${value.slice(0, headLength)}…${value.slice(-tailLength)}`;
}

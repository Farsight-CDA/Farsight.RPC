const allowedCharactersRegex = /^[A-Za-z0-9_.-]+$/;

export const nameValidationPattern = "[A-Za-z0-9_.-]+";
export const nameValidationHint =
  "Use only letters, numbers, periods, underscores, and hyphens.";

export function validateName(name: string): string | null {
  if (name.trim().length === 0) return "Name is required.";
  if (name.trim().length !== name.length)
    return "Name cannot have leading or trailing whitespace.";
  if (!allowedCharactersRegex.test(name)) {
    return "Name can only contain letters, numbers, periods, underscores, and hyphens.";
  }

  return null;
}

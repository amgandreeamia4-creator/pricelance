export function resolveSearchQuery({
  currentQuery,
  inputValue,
}: {
  currentQuery: string;
  inputValue: string;
}): string {
  const normalizedCurrent = currentQuery.trim();
  const normalizedInput = inputValue.trim();

  if (normalizedInput) {
    return normalizedInput;
  }

  return normalizedCurrent;
}

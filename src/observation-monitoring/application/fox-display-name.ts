const numberedFoxId = /^fox_(\d+)$/u;

export function formatFoxDisplayName(foxId: string): string {
  const match = numberedFoxId.exec(foxId);

  if (!match) return formatCustomFoxDisplayName(foxId);

  const numericSuffix = match[1] ?? "0";
  const normalizedSuffix = numericSuffix.replace(/^0+(?=\d)/u, "");
  const canonicalSuffix = normalizedSuffix.padStart(3, "0");

  if (numericSuffix !== canonicalSuffix) {
    return formatCustomFoxDisplayName(foxId);
  }

  return `Лиса ${normalizedSuffix}`;
}

export function formatFoxDisplayNameList(foxIds: readonly string[]): string {
  const displayNames = foxIds.map(formatFoxDisplayName);

  if (displayNames.length === 0) return "";
  if (displayNames.length === 1) return displayNames[0] ?? "";

  const numberedNames = displayNames.map((name) => /^Лиса (.+)$/u.exec(name));
  if (numberedNames.every((match) => match !== null)) {
    return `Лисы ${joinRussianList(
      numberedNames.map((match) => match?.[1] ?? ""),
    )}`;
  }

  return joinRussianList(displayNames);
}

export function formatFoxIdentityList(foxIds: readonly string[]): string {
  const names = formatFoxDisplayNameList(foxIds);
  const hasFriendlyName = foxIds.some(
    (foxId) => formatFoxDisplayName(foxId) !== foxId,
  );

  if (!hasFriendlyName) return names;

  return `${names}, ${foxIds.length === 1 ? "идентификатор" : "идентификаторы"} ${joinRussianList(foxIds)}`;
}

export function formatFoxIdentityLabel(foxId: string): string {
  const displayName = formatFoxDisplayName(foxId);

  return displayName === foxId
    ? foxId
    : `${displayName}, идентификатор ${foxId}`;
}

export function hasDistinctFoxDisplayName(foxId: string): boolean {
  return formatFoxDisplayName(foxId) !== foxId;
}

function joinRussianList(values: readonly string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} и ${values[1]}`;

  return `${values.slice(0, -1).join(", ")} и ${values.at(-1)}`;
}

function formatCustomFoxDisplayName(foxId: string): string {
  return `Лиса «${foxId}»`;
}

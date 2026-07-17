const numberedFoxId = /^fox_(\d+)$/u;

export function formatFoxDisplayName(
  foxId: string,
  explicitName?: string,
): string {
  const normalizedExplicitName =
    typeof explicitName === "string" ? explicitName.trim() : undefined;
  if (normalizedExplicitName) return normalizedExplicitName;

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
  const displayNames = foxIds.map((foxId) => formatFoxDisplayName(foxId));

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
  return formatFoxIdentityEntries(foxIds.map((foxId) => ({ foxId })));
}

export function formatFoxIdentityEntries(
  entries: readonly {
    readonly foxId: string;
    readonly foxName?: string;
  }[],
): string {
  const names = formatDisplayNameValues(
    entries.map(({ foxId, foxName }) => formatFoxDisplayName(foxId, foxName)),
  );
  const hasFriendlyName = entries.some(
    ({ foxId, foxName }) => formatFoxDisplayName(foxId, foxName) !== foxId,
  );

  if (!hasFriendlyName) return names;

  const foxIds = entries.map(({ foxId }) => foxId);
  return `${names}, ${entries.length === 1 ? "идентификатор" : "идентификаторы"} ${joinRussianList(foxIds)}`;
}

export function formatFoxIdentityLabel(
  foxId: string,
  explicitName?: string,
): string {
  const displayName = formatFoxDisplayName(foxId, explicitName);

  return displayName === foxId
    ? foxId
    : `${displayName}, идентификатор ${foxId}`;
}

export function hasDistinctFoxDisplayName(
  foxId: string,
  explicitName?: string,
): boolean {
  return formatFoxDisplayName(foxId, explicitName) !== foxId;
}

function joinRussianList(values: readonly string[]): string {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} и ${values[1]}`;

  return `${values.slice(0, -1).join(", ")} и ${values.at(-1)}`;
}

function formatDisplayNameValues(displayNames: readonly string[]): string {
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

function formatCustomFoxDisplayName(foxId: string): string {
  return `Лиса «${foxId}»`;
}

const numberedFoxId = /^fox_0*(\d+)$/u;

export function formatFoxDisplayName(foxId: string): string {
  const match = numberedFoxId.exec(foxId);

  if (!match) return foxId;

  const numericSuffix = match[1] ?? "0";
  const normalizedSuffix = numericSuffix.replace(/^0+(?=\d)/u, "");

  return `Лиса ${normalizedSuffix}`;
}

export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function startOfUtcDay(epochSeconds: number): number {
  const date = new Date(epochSeconds * 1000);
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) /
      1000,
  );
}

export function startOfUtcMonth(epochSeconds: number): number {
  const date = new Date(epochSeconds * 1000);
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1) / 1000,
  );
}

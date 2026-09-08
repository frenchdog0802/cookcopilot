export enum UnitKind {
  WEIGHT = 'WEIGHT',
  VOLUME = 'VOLUME',
  COUNT = 'COUNT',
}

export function unitKindFromString(
  value: string | null | undefined,
): UnitKind | null {
  if (value == null || value.trim() === '') {
    return null;
  }
  return UnitKind[value.trim().toUpperCase() as keyof typeof UnitKind] ?? null;
}

export function unitKindToApiValue(kind: UnitKind): string {
  return kind.toLowerCase();
}

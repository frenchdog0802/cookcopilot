import { BadRequestError } from '../errors/http-errors';
import { UnitKind, unitKindFromString, unitKindToApiValue } from './unit-kind';

export const G = 'g';
export const KG = 'kg';
export const OZ = 'oz';
export const LB = 'lb';
export const ML = 'ml';
export const L = 'l';
export const TSP = 'tsp';
export const TBSP = 'tbsp';
export const CUP = 'cup';
export const PCS = 'pcs';
export const CLOVE = 'clove';
export const CAN = 'can';
export const SLICE = 'slice';
export const STALK = 'stalk';
export const BUNCH = 'bunch';

const OZ_TO_G = 28.3495;
const LB_TO_G = 453.592;
const TSP_TO_ML = 5.0;
const TBSP_TO_ML = 15.0;
const CUP_TO_ML = 240.0;

const WEIGHT_UNITS = new Set([G, KG, OZ, LB]);
const VOLUME_UNITS = new Set([ML, L, TSP, TBSP, CUP]);
const COUNT_UNITS = new Set([PCS, CLOVE, CAN, SLICE, STALK, BUNCH]);

const ALIASES = new Map<string, string>([
  ['gram', G],
  ['grams', G],
  ['gr', G],
  ['kilogram', KG],
  ['kilograms', KG],
  ['kgs', KG],
  ['ounce', OZ],
  ['ounces', OZ],
  ['pound', LB],
  ['pounds', LB],
  ['lbs', LB],
  ['milliliter', ML],
  ['milliliters', ML],
  ['millilitre', ML],
  ['millilitres', ML],
  ['mls', ML],
  ['liter', L],
  ['liters', L],
  ['litre', L],
  ['litres', L],
  ['teaspoon', TSP],
  ['teaspoons', TSP],
  ['tsps', TSP],
  ['tablespoon', TBSP],
  ['tablespoons', TBSP],
  ['tbsps', TBSP],
  ['tb', TBSP],
  ['cups', CUP],
  ['pc', PCS],
  ['piece', PCS],
  ['pieces', PCS],
  ['ea', PCS],
  ['each', PCS],
  ['cloves', CLOVE],
  ['cans', CAN],
  ['slices', SLICE],
  ['stalks', STALK],
  ['bunches', BUNCH],
  ['大匙', TBSP],
  ['湯匙', TBSP],
  ['小匙', TSP],
  ['茶匙', TSP],
  ['杯', CUP],
  ['克', G],
  ['公克', G],
  ['公斤', KG],
  ['毫升', ML],
  ['升', L],
  ['公升', L],
  ['顆', PCS],
  ['個', PCS],
  ['塊', PCS],
  ['條', PCS],
  ['根', PCS],
  ['片', SLICE],
  ['瓣', CLOVE],
  ['罐', CAN],
  ['把', BUNCH],
  ['束', BUNCH],
]);

export type IngredientLike = {
  name?: string;
  unitKind?: string | null;
  baseUnit?: string | null;
  defaultUnit?: string | null;
  defaultDisplayUnit?: string | null;
};

export function normalize(raw: string | null | undefined): string | null {
  if (raw == null || raw.trim() === '') {
    return null;
  }
  const key = raw.trim().toLowerCase();
  if (ALIASES.has(key)) {
    return ALIASES.get(key)!;
  }
  if (WEIGHT_UNITS.has(key) || VOLUME_UNITS.has(key) || COUNT_UNITS.has(key)) {
    return key;
  }
  return key;
}

export function kindOf(unit: string | null | undefined): UnitKind | null {
  const n = normalize(unit);
  if (n == null) {
    return null;
  }
  if (WEIGHT_UNITS.has(n)) {
    return UnitKind.WEIGHT;
  }
  if (VOLUME_UNITS.has(n)) {
    return UnitKind.VOLUME;
  }
  if (COUNT_UNITS.has(n)) {
    return UnitKind.COUNT;
  }
  return null;
}

export function baseUnitForKind(
  kind: UnitKind,
  preferredCountUnit?: string | null,
): string {
  if (kind === UnitKind.COUNT) {
    const n = normalize(preferredCountUnit);
    if (n != null && COUNT_UNITS.has(n)) {
      return n;
    }
    return PCS;
  }
  return baseUnitForKindSimple(kind);
}

function baseUnitForKindSimple(kind: UnitKind): string {
  switch (kind) {
    case UnitKind.WEIGHT:
      return G;
    case UnitKind.VOLUME:
      return ML;
    case UnitKind.COUNT:
      return PCS;
  }
}

export function allowedUnits(kind: UnitKind): string[] {
  switch (kind) {
    case UnitKind.WEIGHT:
      return [G, KG, OZ, LB];
    case UnitKind.VOLUME:
      return [ML, L, TSP, TBSP, CUP];
    case UnitKind.COUNT:
      return [PCS, CLOVE, CAN, SLICE, STALK, BUNCH];
  }
}

export function displayUnitsForPreference(
  kind: UnitKind,
  measurementSystem: string | null | undefined,
): string[] {
  const imperial =
    measurementSystem != null &&
    measurementSystem.toLowerCase().startsWith('imp');
  switch (kind) {
    case UnitKind.WEIGHT:
      return imperial ? [OZ, LB] : [G, KG];
    case UnitKind.VOLUME:
      return imperial ? [TSP, TBSP, CUP] : [ML, L];
    case UnitKind.COUNT:
      return [PCS, CLOVE, CAN, SLICE, STALK, BUNCH];
  }
}

export function convert(
  quantity: number,
  fromUnit: string,
  toUnit: string,
): number {
  const from = normalize(fromUnit);
  const to = normalize(toUnit);
  if (from == null || to == null) {
    throw new BadRequestError('Unknown unit');
  }
  if (from === to) {
    return quantity;
  }
  const fromKind = kindOf(from);
  const toKind = kindOf(to);
  if (fromKind == null || toKind == null || fromKind !== toKind) {
    throw new BadRequestError(`Cannot convert from ${from} to ${to}`);
  }
  if (fromKind === UnitKind.COUNT) {
    throw new BadRequestError(
      `Count units cannot be converted (${from} → ${to})`,
    );
  }
  const base = toBase(quantity, from, fromKind);
  return fromBase(base, to, fromKind);
}

export function toBase(quantity: number, unit: string, kind: UnitKind): number {
  const n = normalize(unit);
  if (n == null) {
    throw new BadRequestError('Missing unit');
  }
  switch (kind) {
    case UnitKind.WEIGHT:
      switch (n) {
        case G:
          return quantity;
        case KG:
          return quantity * 1000.0;
        case OZ:
          return quantity * OZ_TO_G;
        case LB:
          return quantity * LB_TO_G;
        default:
          throw new BadRequestError(`Invalid weight unit: ${n}`);
      }
    case UnitKind.VOLUME:
      switch (n) {
        case ML:
          return quantity;
        case L:
          return quantity * 1000.0;
        case TSP:
          return quantity * TSP_TO_ML;
        case TBSP:
          return quantity * TBSP_TO_ML;
        case CUP:
          return quantity * CUP_TO_ML;
        default:
          throw new BadRequestError(`Invalid volume unit: ${n}`);
      }
    case UnitKind.COUNT:
      if (!COUNT_UNITS.has(n)) {
        throw new BadRequestError(`Invalid count unit: ${n}`);
      }
      return quantity;
  }
}

export function fromBase(
  baseQuantity: number,
  unit: string,
  kind: UnitKind,
): number {
  const n = normalize(unit);
  if (n == null) {
    throw new BadRequestError('Missing unit');
  }
  switch (kind) {
    case UnitKind.WEIGHT:
      switch (n) {
        case G:
          return baseQuantity;
        case KG:
          return baseQuantity / 1000.0;
        case OZ:
          return baseQuantity / OZ_TO_G;
        case LB:
          return baseQuantity / LB_TO_G;
        default:
          throw new BadRequestError(`Invalid weight unit: ${n}`);
      }
    case UnitKind.VOLUME:
      switch (n) {
        case ML:
          return baseQuantity;
        case L:
          return baseQuantity / 1000.0;
        case TSP:
          return baseQuantity / TSP_TO_ML;
        case TBSP:
          return baseQuantity / TBSP_TO_ML;
        case CUP:
          return baseQuantity / CUP_TO_ML;
        default:
          throw new BadRequestError(`Invalid volume unit: ${n}`);
      }
    case UnitKind.COUNT:
      return baseQuantity;
  }
}

export function ensureCompatible(
  ingredient: IngredientLike,
  unit: string,
): void {
  const kind = resolveKind(ingredient);
  const n = normalize(unit);
  if (n == null) {
    throw new BadRequestError('Unit is required');
  }
  const unitKind = kindOf(n);
  if (unitKind == null) {
    throw new BadRequestError(`Unknown unit: ${unit}`);
  }
  if (kind != null && unitKind !== kind) {
    throw new BadRequestError(
      `Unit ${n} does not match ingredient kind ${unitKindToApiValue(kind)}`,
    );
  }
  if (kind === UnitKind.COUNT) {
    const base = resolveBaseUnit(ingredient);
    if (n !== base) {
      throw new BadRequestError(`Count ingredient must use unit ${base}`);
    }
  }
}

export function resolveKind(ingredient: IngredientLike): UnitKind {
  if (ingredient.unitKind != null && ingredient.unitKind.trim() !== '') {
    return unitKindFromString(ingredient.unitKind) ?? UnitKind.COUNT;
  }
  const base = resolveBaseUnit(ingredient);
  const inferred = kindOf(base);
  return inferred ?? UnitKind.COUNT;
}

export function resolveBaseUnit(ingredient: IngredientLike): string {
  const base = normalize(ingredient.baseUnit);
  if (base != null) {
    return base;
  }
  const legacy = normalize(ingredient.defaultUnit);
  if (legacy != null) {
    const k = kindOf(legacy);
    if (k === UnitKind.WEIGHT) {
      return G;
    }
    if (k === UnitKind.VOLUME) {
      return ML;
    }
    if (k === UnitKind.COUNT) {
      return legacy;
    }
    return legacy;
  }
  return PCS;
}

export function resolveDisplayUnit(ingredient: IngredientLike): string {
  const display = normalize(ingredient.defaultDisplayUnit);
  if (display != null) {
    return display;
  }
  return resolveBaseUnit(ingredient);
}

export function toIngredientBase(
  ingredient: IngredientLike,
  quantity: number,
  unit: string | null | undefined,
): number {
  const kind = resolveKind(ingredient);
  const base = resolveBaseUnit(ingredient);
  if (unit == null || unit.trim() === '') {
    return quantity;
  }
  ensureCompatible(ingredient, unit);
  const n = normalize(unit);
  if (kind === UnitKind.COUNT) {
    return quantity;
  }
  return convert(quantity, n!, base);
}

export function applyDefaults(ingredient: IngredientLike): IngredientLike {
  let kind = resolveKind(ingredient);
  if (ingredient.unitKind == null || ingredient.unitKind.trim() === '') {
    ingredient.unitKind = unitKindToApiValue(kind);
  } else {
    kind = unitKindFromString(ingredient.unitKind) ?? kind;
    ingredient.unitKind = unitKindToApiValue(kind);
  }

  let base = normalize(ingredient.baseUnit);
  if (base == null) {
    base = baseUnitForKind(kind, ingredient.defaultUnit);
  } else if (kind !== UnitKind.COUNT) {
    base = baseUnitForKindSimple(kind);
  } else if (!COUNT_UNITS.has(base)) {
    base = PCS;
  }
  ingredient.baseUnit = base;
  ingredient.defaultUnit = base;

  let display = normalize(ingredient.defaultDisplayUnit);
  if (display == null) {
    display = base;
  } else {
    const displayKind = kindOf(display);
    if (displayKind !== kind) {
      display = base;
    }
    if (kind === UnitKind.COUNT && display !== base) {
      display = base;
    }
  }
  ingredient.defaultDisplayUnit = display;
  return ingredient;
}

export function inferAndBuild(
  name: string,
  unitHint: string | null | undefined,
): IngredientLike {
  let normalized = normalize(unitHint);
  let kind = kindOf(normalized);
  if (kind == null) {
    kind = UnitKind.COUNT;
    normalized = PCS;
  }
  const base =
    kind === UnitKind.COUNT ? normalized! : baseUnitForKindSimple(kind);
  return {
    name,
    unitKind: unitKindToApiValue(kind),
    baseUnit: base,
    defaultUnit: base,
    defaultDisplayUnit: normalized ?? base,
  };
}

export function toIngredientBaseLenient(
  ingredient: IngredientLike,
  quantity: number,
  unit: string | null | undefined,
): number {
  try {
    return toIngredientBase(ingredient, quantity, unit);
  } catch {
    return quantity;
  }
}

export function clampShortage(
  neededBase: number,
  availableBase: number,
): number {
  return Math.max(0.0, neededBase - availableBase);
}

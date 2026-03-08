function clampNonNegativeInteger(value: number) {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

export function normalizeSpellSlotsRemaining(spellSlotsRemaining: number[], spellSlotsMax: number[]) {
  return spellSlotsMax.map((max, index) =>
    Math.min(max, clampNonNegativeInteger(spellSlotsRemaining[index] ?? max)),
  );
}

export function normalizePactSlotsRemaining(pactSlotsRemaining: number | undefined, pactSlotsMax: number) {
  return Math.min(
    pactSlotsMax,
    clampNonNegativeInteger(pactSlotsRemaining === undefined ? pactSlotsMax : pactSlotsRemaining),
  );
}

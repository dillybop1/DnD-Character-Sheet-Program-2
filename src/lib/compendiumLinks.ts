export const RULE_REFERENCE_SLUGS = {
  armorClass: "armor-class",
  proficiencyBonus: "proficiency-bonus",
  skills: "skills",
  initiative: "initiative",
  spellAttackBonus: "spell-attack-bonus",
  spellSaveDC: "spell-save-dc",
  hitDice: "hit-dice",
} as const;

export function getArmorReferenceSlug(armorId: string | null) {
  return armorId ?? "unarmored";
}

export function getSpellcastingReferenceSlug(hasSpellAttackBonus: boolean) {
  return hasSpellAttackBonus ? RULE_REFERENCE_SLUGS.spellAttackBonus : RULE_REFERENCE_SLUGS.spellSaveDC;
}

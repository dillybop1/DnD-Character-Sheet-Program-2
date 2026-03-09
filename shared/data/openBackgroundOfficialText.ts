// Exact CC-BY-4.0 wording transcribed from the SRD 5.2.1 Character Origins section.
export const OPEN_BACKGROUND_OFFICIAL_TEXT: Partial<Record<string, readonly string[]>> = {
  acolyte: [
    "Ability Scores: Intelligence, Wisdom, Charisma",
    "Feat: Magic Initiate (Cleric) (see “Feats”)",
    "Skill Proficiencies: Insight and Religion",
    "Tool Proficiency: Calligrapher’s Supplies",
    "Equipment: Choose A or B: (A) Calligrapher’s Supplies, Book (prayers), Holy Symbol, Parchment (10 sheets), Robe, 8 GP; or (B) 50 GP",
  ],
  sage: [
    "Ability Scores: Constitution, Intelligence, Wisdom",
    "Feat: Magic Initiate (Wizard) (see “Feats”)",
    "Skill Proficiencies: Arcana and History",
    "Tool Proficiency: Calligrapher’s Supplies",
    "Equipment: Choose A or B: (A) Quarterstaff, Calligrapher’s Supplies, Book (history), Parchment (8 sheets), Robe, 8 GP; or (B) 50 GP",
  ],
  soldier: [
    "Ability Scores: Strength, Dexterity, Constitution",
    "Feat: Savage Attacker (see “Feats”)",
    "Skill Proficiencies: Athletics and Intimidation",
    "Tool Proficiency: Choose one kind of Gaming Set (see “Equipment”)",
    "Equipment: Choose A or B: (A) Spear, Shortbow, 20 Arrows, Gaming Set (same as above), Healer’s Kit, Quiver, Traveler’s Clothes, 14 GP; or (B) 50 GP",
  ],
} as const;

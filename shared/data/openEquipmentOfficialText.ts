// Exact CC-BY-4.0 wording transcribed from the SRD 5.2.1 Equipment section.
export const OPEN_EQUIPMENT_OFFICIAL_TEXT: Partial<Record<string, readonly string[]>> = {
  leather: [
    "Light Armor (1 Minute to Don or Doff)",
    "Leather Armor 11 + Dex modifier — — 10 lb. 10 GP",
    "If you wear Light, Medium, or Heavy armor and lack training with it, you have Disadvantage on any D20 Test that involves Strength or Dexterity, and you can't cast spells.",
  ],
  "studded-leather": [
    "Light Armor (1 Minute to Don or Doff)",
    "Studded Leather Armor 12 + Dex modifier — — 13 lb. 45 GP",
    "If you wear Light, Medium, or Heavy armor and lack training with it, you have Disadvantage on any D20 Test that involves Strength or Dexterity, and you can't cast spells.",
  ],
  "scale-mail": [
    "Medium Armor (5 Minutes to Don and 1 Minute to Doff)",
    "Scale Mail 14 + Dex modifier (max 2) — Disadvantage 45 lb. 50 GP",
    "If the table shows \"Disadvantage\" in the Stealth column for an armor type, the wearer has Disadvantage on Dexterity (Stealth) checks.",
    "If you wear Light, Medium, or Heavy armor and lack training with it, you have Disadvantage on any D20 Test that involves Strength or Dexterity, and you can't cast spells.",
  ],
  breastplate: [
    "Medium Armor (5 Minutes to Don and 1 Minute to Doff)",
    "Breastplate 14 + Dex modifier (max 2) — — 20 lb. 400 GP",
    "If you wear Light, Medium, or Heavy armor and lack training with it, you have Disadvantage on any D20 Test that involves Strength or Dexterity, and you can't cast spells.",
  ],
  "chain-mail": [
    "Heavy Armor (10 Minutes to Don and 5 Minutes to Doff)",
    "Chain Mail 16 Str 13 Disadvantage 55 lb. 75 GP",
    "If the table shows a Strength score in the Strength column for an armor type, that armor reduces the wearer's speed by 10 feet unless the wearer has a Strength score equal to or higher than the listed score.",
    "If the table shows \"Disadvantage\" in the Stealth column for an armor type, the wearer has Disadvantage on Dexterity (Stealth) checks.",
    "If you wear Light, Medium, or Heavy armor and lack training with it, you have Disadvantage on any D20 Test that involves Strength or Dexterity, and you can't cast spells.",
  ],
  plate: [
    "Heavy Armor (10 Minutes to Don and 5 Minutes to Doff)",
    "Plate Armor 18 Str 15 Disadvantage 65 lb. 1,500 GP",
    "If the table shows a Strength score in the Strength column for an armor type, that armor reduces the wearer's speed by 10 feet unless the wearer has a Strength score equal to or higher than the listed score.",
    "If the table shows \"Disadvantage\" in the Stealth column for an armor type, the wearer has Disadvantage on Dexterity (Stealth) checks.",
    "If you wear Light, Medium, or Heavy armor and lack training with it, you have Disadvantage on any D20 Test that involves Strength or Dexterity, and you can't cast spells.",
  ],
  shield: [
    "Shield (Utilize Action to Don or Doff)",
    "Shield +2 — — 6 lb. 10 GP",
    "You gain the Armor Class benefit of a Shield only if you have training with it.",
    "A creature can wear only one suit of armor at a time and wield only one Shield at a time.",
  ],
  dagger: [
    "Simple Melee Weapons",
    "Dagger 1d4 Piercing Finesse, Light, Thrown (Range 20/60) Nick 1 lb. 2 GP",
    "When making an attack with a Finesse weapon, use your choice of your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both rolls.",
    "When you take the Attack action on your turn and attack with a Light weapon, you can make one extra attack as a Bonus Action later on the same turn. That extra attack must be made with a different Light weapon, and you don't add your ability modifier to the extra attack's damage unless that modifier is negative.",
    "If a weapon has the Thrown property, you can throw the weapon to make a ranged attack, and you can draw that weapon as part of the attack. If the weapon is a Melee weapon, use the same ability modifier for the attack and damage rolls that you use for a melee attack with that weapon.",
    "When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can make this extra attack only once per turn.",
  ],
  mace: [
    "Simple Melee Weapons",
    "Mace 1d6 Bludgeoning — Sap 4 lb. 5 GP",
    "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
  ],
  spear: [
    "Simple Melee Weapons",
    "Spear 1d6 Piercing Thrown (Range 20/60), Versatile (1d8) Sap 3 lb. 1 GP",
    "If a weapon has the Thrown property, you can throw the weapon to make a ranged attack, and you can draw that weapon as part of the attack. If the weapon is a Melee weapon, use the same ability modifier for the attack and damage rolls that you use for a melee attack with that weapon.",
    "A Versatile weapon can be used with one or two hands. A damage value in parentheses appears with the property. The weapon deals that damage when used with two hands to make a melee attack.",
    "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
  ],
  quarterstaff: [
    "Simple Melee Weapons",
    "Quarterstaff 1d6 Bludgeoning Versatile (1d8) Topple 4 lb. 2 SP",
    "A Versatile weapon can be used with one or two hands. A damage value in parentheses appears with the property. The weapon deals that damage when used with two hands to make a melee attack.",
    "If you hit a creature with this weapon, you can force the creature to make a Constitution saving throw (DC 8 plus the ability modifier used to make the attack roll and your Proficiency Bonus). On a failed save, the creature has the Prone condition.",
  ],
  longsword: [
    "Martial Melee Weapons",
    "Longsword 1d8 Slashing Versatile (1d10) Sap 3 lb. 15 GP",
    "A Versatile weapon can be used with one or two hands. A damage value in parentheses appears with the property. The weapon deals that damage when used with two hands to make a melee attack.",
    "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
  ],
  rapier: [
    "Martial Melee Weapons",
    "Rapier 1d8 Piercing Finesse Vex 2 lb. 25 GP",
    "When making an attack with a Finesse weapon, use your choice of your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both rolls.",
    "If you hit a creature with this weapon and deal damage to the creature, you have Advantage on your next attack roll against that creature before the end of your next turn.",
  ],
  warhammer: [
    "Martial Melee Weapons",
    "Warhammer 1d8 Bludgeoning Versatile (1d10) Push 5 lb. 15 GP",
    "A Versatile weapon can be used with one or two hands. A damage value in parentheses appears with the property. The weapon deals that damage when used with two hands to make a melee attack.",
    "If you hit a creature with this weapon, you can push the creature up to 10 feet straight away from yourself if it is Large or smaller.",
  ],
  shortbow: [
    "Simple Ranged Weapons",
    "Shortbow 1d6 Piercing Ammunition (Range 80/320; Arrow), Two-Handed Vex 2 lb. 25 GP",
    "You can use a weapon that has the Ammunition property to make a ranged attack only if you have ammunition to fire from it. The type of ammunition required is specified with the weapon's range. Each attack expends one piece of ammunition. Drawing the ammunition is part of the attack (you need a free hand to load a one-handed weapon). After a fight, you can spend 1 minute to recover half the ammunition (round down) you used in the fight; the rest is lost.",
    "A Two-Handed weapon requires two hands when you attack with it.",
    "If you hit a creature with this weapon and deal damage to the creature, you have Advantage on your next attack roll against that creature before the end of your next turn.",
  ],
  "light-crossbow": [
    "Simple Ranged Weapons",
    "Light Crossbow 1d8 Piercing Ammunition (Range 80/320; Bolt), Loading, Two-Handed Slow 5 lb. 25 GP",
    "You can use a weapon that has the Ammunition property to make a ranged attack only if you have ammunition to fire from it. The type of ammunition required is specified with the weapon's range. Each attack expends one piece of ammunition. Drawing the ammunition is part of the attack (you need a free hand to load a one-handed weapon). After a fight, you can spend 1 minute to recover half the ammunition (round down) you used in the fight; the rest is lost.",
    "You can fire only one piece of ammunition from a Loading weapon when you use an action, a Bonus Action, or a Reaction to fire it, regardless of the number of attacks you can normally make.",
    "A Two-Handed weapon requires two hands when you attack with it.",
    "If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. If the creature is hit more than once by weapons that have this property, the Speed reduction doesn't exceed 10 feet.",
  ],
  "arcane-focus": [
    "An Arcane Focus takes one of the forms in the Arcane Focuses table and is bejeweled or carved to channel arcane magic. A Sorcerer, Warlock, or Wizard can use such an item as a Spellcasting Focus.",
    "Crystal 1 lb. 10 GP",
    "Orb 3 lb. 20 GP",
    "Rod 2 lb. 10 GP",
    "Staff (also a Quarterstaff) 4 lb. 5 GP",
    "Wand 1 lb. 10 GP",
  ],
  "component-pouch": [
    "A Component Pouch is watertight and filled with compartments that hold all the free Material components of your spells.",
  ],
  "druidic-focus": [
    "A Druidic Focus takes one of the forms in the Druidic Focuses table and is carved, tied with ribbon, or painted to channel primal magic. A Druid or Ranger can use such an object as a Spellcasting Focus.",
    "Sprig of mistletoe — 1 GP",
    "Wooden staff (also a Quarterstaff) 4 lb. 5 GP",
    "Yew wand 1 lb. 10 GP",
  ],
  "burglars-pack": [
    "A Burglar's Pack contains the following items: Backpack, Ball Bearings, Bell, 10 Candles, Crowbar, Hooded Lantern, 7 flasks of Oil, 5 days of Rations, Rope, Tinderbox, and Waterskin.",
  ],
  "dungeoneers-pack": [
    "A Dungeoneer's Pack contains the following items: Backpack, Caltrops, Crowbar, 2 flasks of Oil, 10 days of Rations, Rope, Tinderbox, 10 Torches, and Waterskin.",
  ],
  "explorers-pack": [
    "An Explorer's Pack contains the following items: Backpack, Bedroll, 2 flasks of Oil, 10 days of Rations, Rope, Tinderbox, 10 Torches, and Waterskin.",
  ],
  "healers-kit": [
    "A Healer's Kit has ten uses. As a Utilize action, you can expend one of its uses to stabilize an Unconscious creature that has 0 Hit Points without needing to make a Wisdom (Medicine) check.",
  ],
  "holy-symbol": [
    "A Holy Symbol takes one of the forms in the Holy Symbol table and is bejeweled or painted to channel divine magic. A Cleric or Paladin can use a Holy Symbol as a Spellcasting Focus.",
    "The table indicates whether a Holy Symbol needs to be held, worn, or borne on fabric (such as a tabard or banner) or a Shield.",
    "Amulet (worn or held) 1 lb. 5 GP",
    "Emblem (borne on fabric or a Shield) — 5 GP",
    "Reliquary (held) 2 lb. 5 GP",
  ],
  "thieves-tools": [
    "Ability: Dexterity  Weight: 1 lb.",
    "Utilize: Pick a lock (DC 15), or disarm a trap (DC 15)",
  ],
  "herbalism-kit": [
    "Ability: Intelligence Weight: 3 lb.",
    "Utilize: Identify a plant (DC 10)",
    "Craft: Antitoxin, Candle, Healer's Kit, Potion of Healing",
  ],
  "musical-instrument": [
    "Ability: Charisma  Weight: Varies",
    "Utilize: Play a known tune (DC 10), or improvise a song (DC 15)",
    "Variants: Bagpipes (30 GP, 6 lb.), drum (6 GP, 3 lb.), dulcimer (25 GP, 10 lb.), flute (2 GP, 1 lb.), horn (3 GP, 2 lb.), lute (35 GP, 2 lb.), lyre (30 GP, 2 lb.), pan flute (12 GP, 2 lb.), shawm (2 GP, 1 lb.), viol (30 GP, 1 lb.)",
  ],
  "priests-pack": [
    "A Priest's Pack contains the following items: Backpack, Blanket, Holy Water, Lamp, 7 days of Rations, Robe, and Tinderbox.",
  ],
  rations: [
    "Rations consist of travel-ready food, including jerky, dried fruit, hardtack, and nuts. See \"Malnutrition\" in \"Rules Glossary\" for the risks of not eating.",
  ],
  "rope-hempen": [
    "As a Utilize action, you can tie a knot with Rope if you succeed on a DC 10 Dexterity (Sleight of Hand) check. The Rope can be burst with a successful DC 20 Strength (Athletics) check.",
    "You can bind an unwilling creature with the Rope only if the creature has the Grappled, Incapacitated, or Restrained condition. If the creature's legs are bound, the creature has the Restrained condition until it escapes. Escaping the Rope requires the creature to make a successful DC 15 Dexterity (Acrobatics) check as an action.",
  ],
  torch: [
    "A Torch burns for 1 hour, casting Bright Light in a 20-foot radius and Dim Light for an additional 20 feet. When you take the Attack action, you can attack with the Torch, using it as a Simple Melee weapon. On a hit, the target takes 1 Fire damage.",
  ],
  waterskin: [
    "A Waterskin holds up to 4 pints. If you don't drink sufficient water, you risk dehydration (see \"Rules Glossary\").",
  ],
} as const;

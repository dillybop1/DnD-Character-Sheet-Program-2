import { describe, expect, it } from "vitest";
import {
  CONTENT_PACK_IMPORT_VERSION,
  COMPENDIUM_IMPORT_VERSION,
  COMPENDIUM_SEED,
  creatureRecordFromCompendium,
  findCompendiumEntry,
  listCompendiumCreatures,
  listCompendiumEntries,
  listCompendiumSpells,
  searchCompendiumSeed,
  spellRecordFromCompendium,
} from "../shared/data/compendiumSeed";

describe("compendium seed", () => {
  it("exposes a materially larger versioned dataset", () => {
    const entriesWithOfficialText = COMPENDIUM_SEED.filter((entry) =>
      Array.isArray((entry.payload as { officialText?: unknown }).officialText),
    );

    expect(COMPENDIUM_IMPORT_VERSION).toBeTruthy();
    expect(CONTENT_PACK_IMPORT_VERSION).toBeTruthy();
    expect(COMPENDIUM_SEED.length).toBeGreaterThan(40);
    expect(entriesWithOfficialText.length).toBeGreaterThanOrEqual(45);
    expect(findCompendiumEntry("fighter")?.type).toBe("class");
    expect(findCompendiumEntry("fighter-champion")?.type).toBe("subclass");
    expect(findCompendiumEntry("misty-step")?.type).toBe("spell");
    expect(findCompendiumEntry("wolf")?.type).toBe("creature");
    expect(findCompendiumEntry("alert")?.type).toBe("feat");
    expect(findCompendiumEntry("mobile")?.type).toBe("feat");
    expect(findCompendiumEntry("athlete")?.type).toBe("feat");
    expect(findCompendiumEntry("observant")?.type).toBe("feat");
    expect(findCompendiumEntry("skilled")?.type).toBe("feat");
    expect(findCompendiumEntry("resilient")?.type).toBe("feat");
    expect(findCompendiumEntry("skill-expert")?.type).toBe("feat");
    expect(findCompendiumEntry("plate")?.type).toBe("armor");
    expect(findCompendiumEntry("rapier")?.type).toBe("weapon");
    expect(findCompendiumEntry("arcane-focus")?.type).toBe("gear");
    expect(listCompendiumEntries("gear").length).toBeGreaterThan(10);
    expect(listCompendiumEntries("creature").length).toBeGreaterThanOrEqual(22);
    expect(listCompendiumEntries("subclass").length).toBeGreaterThan(10);
  });

  it("supports local search and structured spell lookup", () => {
    const spellResults = searchCompendiumSeed({
      query: "radiant cleric",
      type: "spell",
    });

    expect(spellResults.some((entry) => entry.slug === "guiding-bolt")).toBe(true);
    expect(spellResults.some((entry) => entry.slug === "sacred-flame")).toBe(true);

    expect(spellRecordFromCompendium("fire-bolt")).toMatchObject({
      id: "fire-bolt",
      name: "Fire Bolt",
      level: 0,
      classes: ["Sorcerer", "Wizard"],
      attackType: "spellAttack",
      description: expect.stringContaining("You hurl a mote of fire"),
    });
    expect(spellRecordFromCompendium("ray-of-frost")).toMatchObject({
      id: "ray-of-frost",
      name: "Ray of Frost",
      level: 0,
      classes: ["Sorcerer", "Wizard"],
      attackType: "spellAttack",
      cantripDamage: "1d8 cold",
    });
    expect(spellRecordFromCompendium("chill-touch")).toMatchObject({
      id: "chill-touch",
      name: "Chill Touch",
      level: 0,
      classes: ["Sorcerer", "Warlock", "Wizard"],
      attackType: "spellAttack",
      description: expect.stringContaining("Channeling the chill of the grave"),
    });
    expect(spellRecordFromCompendium("burning-hands")?.description).toContain("A thin sheet of flames shoots forth from you.");
    expect(spellRecordFromCompendium("burning-hands")?.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(spellRecordFromCompendium("invisibility")).toMatchObject({
      id: "invisibility",
      name: "Invisibility",
      level: 2,
      classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
      concentration: true,
      description: expect.stringContaining("has the Invisible condition"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("invisibility")).toMatchObject({
      id: "invisibility",
    });
    expect(spellRecordFromCompendium("mirror-image")?.description).toContain("Three illusory duplicates of yourself appear in your space.");
    expect(spellRecordFromCompendium("sleep")?.description).toContain("Each creature of your choice in a 5-foot-radius Sphere");
    expect(spellRecordFromCompendium("sleep")?.higherLevel).toBeUndefined();
    expect(spellRecordFromCompendium("sacred-flame")?.saveAbility).toBe("dexterity");
    expect(spellRecordFromCompendium("hold-person")?.saveAbility).toBe("wisdom");
    expect(spellRecordFromCompendium("hold-person")?.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(spellRecordFromCompendium("counterspell")).toMatchObject({
      id: "counterspell",
      name: "Counterspell",
      level: 3,
      classes: ["Sorcerer", "Warlock", "Wizard"],
      saveAbility: "constitution",
    });
    expect(spellRecordFromCompendium("fireball")).toMatchObject({
      id: "fireball",
      name: "Fireball",
      level: 3,
      classes: ["Sorcerer", "Wizard"],
      saveAbility: "dexterity",
    });
    expect(spellRecordFromCompendium("revivify")).toMatchObject({
      id: "revivify",
      name: "Revivify",
      level: 3,
      classes: ["Cleric", "Druid", "Paladin", "Ranger"],
    });
    expect(spellRecordFromCompendium("spirit-guardians")).toMatchObject({
      id: "spirit-guardians",
      name: "Spirit Guardians",
      level: 3,
      classes: ["Cleric"],
      concentration: true,
      saveAbility: "wisdom",
    });
    expect(spellRecordFromCompendium("sending")).toMatchObject({
      id: "sending",
      name: "Sending",
      level: 3,
      classes: ["Bard", "Cleric", "Wizard"],
      range: "Unlimited",
      description: expect.stringContaining("25 words or fewer"),
    });
    expect(spellRecordFromCompendium("water-walk")).toMatchObject({
      id: "water-walk",
      name: "Water Walk",
      level: 3,
      classes: ["Cleric", "Druid", "Ranger", "Sorcerer"],
      ritual: true,
    });
    expect(spellRecordFromCompendium("wind-wall")).toMatchObject({
      id: "wind-wall",
      name: "Wind Wall",
      level: 3,
      classes: ["Druid", "Ranger"],
      concentration: true,
      saveAbility: "strength",
    });
    expect(spellRecordFromCompendium("banishment")).toMatchObject({
      id: "banishment",
      name: "Banishment",
      level: 4,
      classes: ["Cleric", "Paladin", "Sorcerer", "Warlock", "Wizard"],
      concentration: true,
      saveAbility: "charisma",
      description: expect.stringContaining("harmless demiplane"),
    });
    expect(spellRecordFromCompendium("dimension-door")).toMatchObject({
      id: "dimension-door",
      name: "Dimension Door",
      level: 4,
      classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
      range: "500 feet",
      description: expect.stringContaining("one willing creature"),
    });
    expect(spellRecordFromCompendium("polymorph")).toMatchObject({
      id: "polymorph",
      name: "Polymorph",
      level: 4,
      classes: ["Bard", "Druid", "Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      description: expect.stringContaining("into a Beast"),
    });
    expect(spellRecordFromCompendium("blight")).toMatchObject({
      id: "blight",
      name: "Blight",
      level: 4,
      classes: ["Druid", "Sorcerer", "Warlock", "Wizard"],
      saveAbility: "constitution",
      description: expect.stringContaining("8d8 Necrotic damage"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("divination")).toMatchObject({
      id: "divination",
      name: "Divination",
      level: 4,
      classes: ["Cleric", "Druid", "Wizard"],
      ritual: true,
      range: "Self",
      description: expect.stringContaining("You ask one question"),
    });
    expect(spellRecordFromCompendium("wall-of-fire")).toMatchObject({
      id: "wall-of-fire",
      name: "Wall of Fire",
      level: 4,
      classes: ["Druid", "Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "dexterity",
      description: expect.stringContaining("wall of fire"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("otilukes-resilient-sphere")).toMatchObject({
      id: "otilukes-resilient-sphere",
      name: "Otiluke's Resilient Sphere",
      level: 4,
      classes: ["Cleric", "Paladin", "Wizard"],
      saveAbility: "dexterity",
      description: expect.stringContaining("A shimmering sphere encloses"),
    });
    expect(spellRecordFromCompendium("arcane-eye")).toMatchObject({
      id: "arcane-eye",
      name: "Arcane Eye",
      level: 4,
      classes: ["Wizard"],
      concentration: true,
      description: expect.stringContaining("Invisible, invulnerable eye"),
    });
    expect(spellRecordFromCompendium("evards-black-tentacles")).toMatchObject({
      id: "evards-black-tentacles",
      name: "Evard's Black Tentacles",
      level: 4,
      classes: ["Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "strength",
      description: expect.stringContaining("Restrained condition"),
    });
    expect(spellRecordFromCompendium("phantasmal-killer")).toMatchObject({
      id: "phantasmal-killer",
      name: "Phantasmal Killer",
      level: 4,
      classes: ["Bard", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("vitriolic-sphere")).toMatchObject({
      id: "vitriolic-sphere",
      name: "Vitriolic Sphere",
      level: 4,
      classes: ["Sorcerer", "Wizard"],
      saveAbility: "dexterity",
      description: expect.stringContaining("10d4 Acid damage"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("fabricate")).toMatchObject({
      id: "fabricate",
      name: "Fabricate",
      level: 4,
      classes: ["Wizard"],
      castingTime: "10 minutes",
      description: expect.stringContaining("raw materials into products"),
    });
    expect(spellRecordFromCompendium("leomunds-secret-chest")).toMatchObject({
      id: "leomunds-secret-chest",
      name: "Leomund's Secret Chest",
      level: 4,
      classes: ["Cleric", "Wizard"],
      range: "Touch",
      duration: "Until Dispelled",
      description: expect.stringContaining("Ethereal Plane"),
    });
    expect(spellRecordFromCompendium("mordenkainens-private-sanctum")).toMatchObject({
      id: "mordenkainens-private-sanctum",
      name: "Mordenkainen's Private Sanctum",
      level: 4,
      classes: ["Wizard"],
      range: "120 feet (Square)",
      description: expect.stringContaining("Nothing can teleport into or out of the warded area."),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("bigbys-hand")).toMatchObject({
      id: "bigbys-hand",
      name: "Bigby's Hand",
      level: 5,
      classes: ["Sorcerer", "Warlock", "Wizard"],
      range: "120 feet",
      description: expect.stringContaining("Large hand of shimmering magical energy"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("cone-of-cold")).toMatchObject({
      id: "cone-of-cold",
      name: "Cone of Cold",
      level: 5,
      classes: ["Druid", "Sorcerer", "Wizard"],
      saveAbility: "constitution",
      description: expect.stringContaining("8d8 Cold damage"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("greater-restoration")).toMatchObject({
      id: "greater-restoration",
      name: "Greater Restoration",
      level: 5,
      classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger"],
      range: "Touch",
      description: expect.stringContaining("1 Exhaustion level"),
    });
    expect(spellRecordFromCompendium("hold-monster")).toMatchObject({
      id: "hold-monster",
      name: "Hold Monster",
      level: 5,
      classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("raise-dead")).toMatchObject({
      id: "raise-dead",
      name: "Raise Dead",
      level: 5,
      classes: ["Bard", "Cleric", "Paladin"],
      castingTime: "1 hour",
      description: expect.stringContaining("10 days"),
    });
    expect(spellRecordFromCompendium("scrying")).toMatchObject({
      id: "scrying",
      name: "Scrying",
      level: 5,
      classes: ["Bard", "Cleric", "Druid", "Warlock", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      description: expect.stringContaining("Secondhand (heard of the target) +5"),
    });
    expect(spellRecordFromCompendium("wall-of-force")).toMatchObject({
      id: "wall-of-force",
      name: "Wall of Force",
      level: 5,
      classes: ["Wizard"],
      concentration: true,
      description: expect.stringContaining("Nothing can physically pass through the wall."),
    });
    expect(spellRecordFromCompendium("charm-monster")?.higherLevel).toContain("Using a Higher-Level Spell Slot.");

    const reactionSpellResults = searchCompendiumSeed({
      query: "reaction anti-magic spell wizard",
      type: "spell",
    });

    expect(reactionSpellResults.some((entry) => entry.slug === "counterspell")).toBe(true);

    const revivalSpellResults = searchCompendiumSeed({
      query: "revival support paladin ranger spell",
      type: "spell",
    });

    expect(revivalSpellResults.some((entry) => entry.slug === "revivify")).toBe(true);

    const communicationSpellResults = searchCompendiumSeed({
      query: "unlimited message wizard spell",
      type: "spell",
    });

    expect(communicationSpellResults.some((entry) => entry.slug === "sending")).toBe(true);

    const wallSpellResults = searchCompendiumSeed({
      query: "wall bludgeoning strength ranger spell",
      type: "spell",
    });

    expect(wallSpellResults.some((entry) => entry.slug === "wind-wall")).toBe(true);

    const teleportSpellResults = searchCompendiumSeed({
      query: "teleport ally 500 feet wizard spell",
      type: "spell",
    });

    expect(teleportSpellResults.some((entry) => entry.slug === "dimension-door")).toBe(true);

    const transformationSpellResults = searchCompendiumSeed({
      query: "transform beast wisdom save spell",
      type: "spell",
    });

    expect(transformationSpellResults.some((entry) => entry.slug === "polymorph")).toBe(true);

    const blightSpellResults = searchCompendiumSeed({
      query: "necrotic plant constitution spell",
      type: "spell",
    });

    expect(blightSpellResults.some((entry) => entry.slug === "blight")).toBe(true);

    const divinationSpellResults = searchCompendiumSeed({
      query: "one question ritual god cleric spell",
      type: "spell",
    });

    expect(divinationSpellResults.some((entry) => entry.slug === "divination")).toBe(true);

    const fireWallSpellResults = searchCompendiumSeed({
      query: "opaque wall fire dexterity spell",
      type: "spell",
    });

    expect(fireWallSpellResults.some((entry) => entry.slug === "wall-of-fire")).toBe(true);

    const scoutingSpellResults = searchCompendiumSeed({
      query: "invisible eye scouting wizard spell",
      type: "spell",
    });

    expect(scoutingSpellResults.some((entry) => entry.slug === "arcane-eye")).toBe(true);

    const tentacleSpellResults = searchCompendiumSeed({
      query: "tentacles restrained strength spell",
      type: "spell",
    });

    expect(tentacleSpellResults.some((entry) => entry.slug === "evards-black-tentacles")).toBe(true);

    const acidSpellResults = searchCompendiumSeed({
      query: "acid sphere dexterity spell",
      type: "spell",
    });

    expect(acidSpellResults.some((entry) => entry.slug === "vitriolic-sphere")).toBe(true);

    const storageSpellResults = searchCompendiumSeed({
      query: "ethereal chest storage wizard spell",
      type: "spell",
    });

    expect(storageSpellResults.some((entry) => entry.slug === "leomunds-secret-chest")).toBe(true);

    const wardSpellResults = searchCompendiumSeed({
      query: "warded area teleport divination wizard spell",
      type: "spell",
    });

    expect(wardSpellResults.some((entry) => entry.slug === "mordenkainens-private-sanctum")).toBe(true);

    const paralyzeSpellResults = searchCompendiumSeed({
      query: "paralyze creature wisdom spell",
      type: "spell",
    });

    expect(paralyzeSpellResults.some((entry) => entry.slug === "hold-monster")).toBe(true);

    const restorationSpellResults = searchCompendiumSeed({
      query: "remove petrified curse exhaustion spell",
      type: "spell",
    });

    expect(restorationSpellResults.some((entry) => entry.slug === "greater-restoration")).toBe(true);

    const resurrectionSpellResults = searchCompendiumSeed({
      query: "resurrection 10 days paladin spell",
      type: "spell",
    });

    expect(resurrectionSpellResults.some((entry) => entry.slug === "raise-dead")).toBe(true);

    const circleSpellResults = searchCompendiumSeed({
      query: "portal permanent circle wizard spell",
      type: "spell",
    });

    expect(circleSpellResults.some((entry) => entry.slug === "teleportation-circle")).toBe(true);

    const forceSpellResults = searchCompendiumSeed({
      query: "invisible wall force wizard spell",
      type: "spell",
    });

    expect(forceSpellResults.some((entry) => entry.slug === "wall-of-force")).toBe(true);

    const creatureResults = searchCompendiumSeed({
      query: "pack tactics beast",
      type: "creature",
    });

    expect(creatureResults.some((entry) => entry.slug === "wolf")).toBe(true);
    expect(listCompendiumCreatures(undefined, { beastOnly: true }).length).toBeGreaterThanOrEqual(10);
    expect(creatureRecordFromCompendium("wolf")).toMatchObject({
      id: "wolf",
      name: "Wolf",
      creatureType: "Beast",
      beastFormEligible: true,
    });

    const flyingCreatureResults = searchCompendiumSeed({
      query: "flyby beast",
      type: "creature",
    });

    expect(flyingCreatureResults.some((entry) => entry.slug === "giant-owl")).toBe(true);
    expect(creatureRecordFromCompendium("giant-owl")).toMatchObject({
      id: "giant-owl",
      name: "Giant Owl",
      beastFormEligible: true,
    });

    const swimmingCreatureResults = searchCompendiumSeed({
      query: "swim grapple beast",
      type: "creature",
    });

    expect(swimmingCreatureResults.some((entry) => entry.slug === "crocodile")).toBe(true);
    expect(creatureRecordFromCompendium("crocodile")).toMatchObject({
      id: "crocodile",
      name: "Crocodile",
      creatureType: "Beast",
      beastFormEligible: true,
    });

    const undeadCreatureResults = searchCompendiumSeed({
      query: "undead paralyze creature",
      type: "creature",
    });

    expect(undeadCreatureResults.some((entry) => entry.slug === "ghoul")).toBe(true);
    expect(creatureRecordFromCompendium("ghoul")).toMatchObject({
      id: "ghoul",
      name: "Ghoul",
      creatureType: "Undead",
      beastFormEligible: false,
    });
    expect(creatureRecordFromCompendium("ghoul")?.description).toContain("Multiattack. The ghoul makes two Bite attacks.");

    const goblinoidCreatureResults = searchCompendiumSeed({
      query: "goblinoid stealth shortbow creature",
      type: "creature",
    });

    expect(goblinoidCreatureResults.some((entry) => entry.slug === "goblin-warrior")).toBe(true);
    expect(creatureRecordFromCompendium("goblin-warrior")).toMatchObject({
      id: "goblin-warrior",
      name: "Goblin Warrior",
      creatureType: "Fey (Goblinoid)",
      beastFormEligible: false,
    });
    expect(creatureRecordFromCompendium("goblin-warrior")?.description).toContain("Nimble Escape. The goblin takes the Disengage or Hide action.");

    const oozeCreatureResults = searchCompendiumSeed({
      query: "ooze engulf acid creature",
      type: "creature",
    });

    expect(oozeCreatureResults.some((entry) => entry.slug === "gelatinous-cube")).toBe(true);
    expect(creatureRecordFromCompendium("gelatinous-cube")).toMatchObject({
      id: "gelatinous-cube",
      name: "Gelatinous Cube",
      creatureType: "Ooze",
      beastFormEligible: false,
    });

    const dragonCreatureResults = searchCompendiumSeed({
      query: "dragon sting poison creature",
      type: "creature",
    });

    expect(dragonCreatureResults.some((entry) => entry.slug === "pseudodragon")).toBe(true);
    expect(creatureRecordFromCompendium("pseudodragon")).toMatchObject({
      id: "pseudodragon",
      name: "Pseudodragon",
      creatureType: "Dragon",
      beastFormEligible: false,
    });

    const aquaticCreatureResults = searchCompendiumSeed({
      query: "sahuagin shark swim creature",
      type: "creature",
    });

    expect(aquaticCreatureResults.some((entry) => entry.slug === "sahuagin-warrior")).toBe(true);
    expect(creatureRecordFromCompendium("sahuagin-warrior")).toMatchObject({
      id: "sahuagin-warrior",
      name: "Sahuagin Warrior",
      creatureType: "Fiend",
      beastFormEligible: false,
    });

    const stealthUndeadResults = searchCompendiumSeed({
      query: "shadow stealth undead creature",
      type: "creature",
    });

    expect(stealthUndeadResults.some((entry) => entry.slug === "shadow")).toBe(true);
    expect(creatureRecordFromCompendium("shadow")).toMatchObject({
      id: "shadow",
      name: "Shadow",
      creatureType: "Undead",
      beastFormEligible: false,
    });

    const gearResults = searchCompendiumSeed({
      query: "rope torches rations",
      type: "gear",
    });

    expect(gearResults.some((entry) => entry.slug === "dungeoneers-pack")).toBe(true);
    expect(gearResults.some((entry) => entry.slug === "explorers-pack")).toBe(true);

    const subclassResults = searchCompendiumSeed({
      query: "champion fighter critical",
      type: "subclass",
    });

    expect(subclassResults.some((entry) => entry.slug === "fighter-champion")).toBe(true);
    expect(findCompendiumEntry("alert")?.payload.automation).toBe("Derived initiative bonus applies automatically.");
    expect(findCompendiumEntry("mobile")?.payload.support).toBe("Partial");
    expect(findCompendiumEntry("mobile")?.payload.automation).toContain("speed bonus");
    expect(findCompendiumEntry("athlete")?.payload.choiceOptions).toEqual(
      expect.arrayContaining(["Strength", "Dexterity"]),
    );
    expect(findCompendiumEntry("observant")?.payload.choiceOptions).toEqual(
      expect.arrayContaining(["Intelligence", "Wisdom"]),
    );
    expect(findCompendiumEntry("observant")?.payload.automation).toContain("passive Investigation and Perception bonuses apply automatically");
    expect(findCompendiumEntry("magic-initiate")?.payload.automation).toContain("separate feat spellcasting line");
    expect(findCompendiumEntry("skilled")?.payload.choiceSummary).toContain("choose 3");
    expect(findCompendiumEntry("resilient")?.payload.choiceOptions).toEqual(
      expect.arrayContaining(["Strength", "Dexterity", "Wisdom"]),
    );
    expect(findCompendiumEntry("skill-expert")?.payload.choiceSummary).toContain("Expertise Skill");
    expect(findCompendiumEntry("skill-expert")?.payload.choiceOptions).toEqual(
      expect.arrayContaining(["Intelligence", "Arcana", "Perception"]),
    );
    expect(findCompendiumEntry("acolyte")?.payload.startingGear).toEqual(["Priest's Pack", "Holy Symbol", "Healer's Kit"]);
    expect(findCompendiumEntry("leather")?.payload.officialText).toEqual(
      expect.arrayContaining(["Leather Armor 11 + Dex modifier — — 10 lb. 10 GP"]),
    );
    expect(findCompendiumEntry("shield")?.payload.officialText).toEqual(
      expect.arrayContaining(["You gain the Armor Class benefit of a Shield only if you have training with it."]),
    );
    expect(findCompendiumEntry("dagger")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "Dagger 1d4 Piercing Finesse, Light, Thrown (Range 20/60) Nick 1 lb. 2 GP",
        "When making an attack with a Finesse weapon, use your choice of your Strength or Dexterity modifier for the attack and damage rolls. You must use the same modifier for both rolls.",
      ]),
    );
    expect(findCompendiumEntry("arcane-focus")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "An Arcane Focus takes one of the forms in the Arcane Focuses table and is bejeweled or carved to channel arcane magic. A Sorcerer, Warlock, or Wizard can use such an item as a Spellcasting Focus.",
        "Crystal 1 lb. 10 GP",
      ]),
    );
    expect(findCompendiumEntry("thieves-tools")?.payload.officialText).toEqual(
      expect.arrayContaining(["Utilize: Pick a lock (DC 15), or disarm a trap (DC 15)"]),
    );
    expect(findCompendiumEntry("explorers-pack")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "An Explorer's Pack contains the following items: Backpack, Bedroll, 2 flasks of Oil, 10 days of Rations, Rope, Tinderbox, 10 Torches, and Waterskin.",
      ]),
    );
    expect(findCompendiumEntry("studded-leather")?.payload.officialText).toEqual(
      expect.arrayContaining(["Studded Leather Armor 12 + Dex modifier — — 13 lb. 45 GP"]),
    );
    expect(findCompendiumEntry("plate")?.payload.officialText).toEqual(
      expect.arrayContaining(["Plate Armor 18 Str 15 Disadvantage 65 lb. 1,500 GP"]),
    );
    expect(findCompendiumEntry("rapier")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "Rapier 1d8 Piercing Finesse Vex 2 lb. 25 GP",
        "If you hit a creature with this weapon and deal damage to the creature, you have Advantage on your next attack roll against that creature before the end of your next turn.",
      ]),
    );
    expect(findCompendiumEntry("light-crossbow")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "Light Crossbow 1d8 Piercing Ammunition (Range 80/320; Bolt), Loading, Two-Handed Slow 5 lb. 25 GP",
        "You can fire only one piece of ammunition from a Loading weapon when you use an action, a Bonus Action, or a Reaction to fire it, regardless of the number of attacks you can normally make.",
      ]),
    );
    expect(findCompendiumEntry("burglars-pack")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "A Burglar's Pack contains the following items: Backpack, Ball Bearings, Bell, 10 Candles, Crowbar, Hooded Lantern, 7 flasks of Oil, 5 days of Rations, Rope, Tinderbox, and Waterskin.",
      ]),
    );
    expect(findCompendiumEntry("priests-pack")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "A Priest's Pack contains the following items: Backpack, Blanket, Holy Water, Lamp, 7 days of Rations, Robe, and Tinderbox.",
      ]),
    );
    expect(findCompendiumEntry("rope-hempen")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "As a Utilize action, you can tie a knot with Rope if you succeed on a DC 10 Dexterity (Sleight of Hand) check. The Rope can be burst with a successful DC 20 Strength (Athletics) check.",
      ]),
    );
    expect(findCompendiumEntry("armor-class")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "An Armor Class (AC) is the target number for an attack roll. AC represents how difficult it is to hit a target.",
      ]),
    );
    expect(findCompendiumEntry("proficiency-bonus")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "If you have proficiency with something, you can add your Proficiency Bonus to any D20 Test you make using that thing. A creature might have proficiency in a skill or saving throw or with a weapon or tool. See also “Playing the Game” (“Proficiency”).",
        "20 355,000 +6",
      ]),
    );
    expect(findCompendiumEntry("initiative")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "Initiative determines the order of turns during combat. The combat rules in “Playing the Game” explain how to roll Initiative.",
      ]),
    );
    expect(findCompendiumEntry("spell-save-dc")?.payload.officialText).toEqual(
      expect.arrayContaining(["Spell save DC = 8 + spellcasting ability modifier + Proficiency Bonus"]),
    );
    expect(findCompendiumEntry("rests")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "Short Rest",
        "Long Rest",
        "An interrupted Short Rest confers no benefits.",
      ]),
    );
    expect(findCompendiumEntry("weapon-attacks")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "A weapon attack is an attack roll made with a weapon. See also “Weapon.”",
      ]),
    );
    expect(findCompendiumEntry("acolyte")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "Feat: Magic Initiate (Cleric) (see “Feats”)",
        "Skill Proficiencies: Insight and Religion",
      ]),
    );
    expect(findCompendiumEntry("sage")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "Feat: Magic Initiate (Wizard) (see “Feats”)",
        "Equipment: Choose A or B: (A) Quarterstaff, Calligrapher’s Supplies, Book (history), Parchment (8 sheets), Robe, 8 GP; or (B) 50 GP",
      ]),
    );
    expect(findCompendiumEntry("soldier")?.payload.officialText).toEqual(
      expect.arrayContaining([
        "Feat: Savage Attacker (see “Feats”)",
        "Tool Proficiency: Choose one kind of Gaming Set (see “Equipment”)",
      ]),
    );
  });

  it("filters spells by class list for the builder workflow", () => {
    const bardSpells = listCompendiumSpells(undefined, "Bard").map((entry) => entry.slug);
    const clericSpells = listCompendiumSpells(undefined, "Cleric").map((entry) => entry.slug);
    const warlockSpells = listCompendiumSpells(undefined, "Warlock").map((entry) => entry.slug);
    const druidSpells = listCompendiumSpells(undefined, "Druid").map((entry) => entry.slug);
    const paladinSpells = listCompendiumSpells(undefined, "Paladin").map((entry) => entry.slug);
    const rangerSpells = listCompendiumSpells(undefined, "Ranger").map((entry) => entry.slug);
    const sorcererSpells = listCompendiumSpells(undefined, "Sorcerer").map((entry) => entry.slug);
    const wizardSpells = listCompendiumSpells(undefined, "Wizard").map((entry) => entry.slug);

    expect(bardSpells).toContain("minor-illusion");
    expect(bardSpells).toContain("charm-person");
    expect(bardSpells).toContain("disguise-self");
    expect(bardSpells).toContain("hold-person");
    expect(bardSpells).toContain("invisibility");
    expect(bardSpells).toContain("mirror-image");
    expect(bardSpells).toContain("dispel-magic");
    expect(bardSpells).toContain("hypnotic-pattern");
    expect(bardSpells).toContain("plant-growth");
    expect(bardSpells).toContain("nondetection");
    expect(bardSpells).toContain("sending");
    expect(bardSpells).toContain("speak-with-plants");
    expect(bardSpells).toContain("dimension-door");
    expect(bardSpells).toContain("confusion");
    expect(bardSpells).toContain("hallucinatory-terrain");
    expect(bardSpells).toContain("greater-invisibility");
    expect(bardSpells).toContain("locate-creature");
    expect(bardSpells).toContain("compulsion");
    expect(bardSpells).toContain("phantasmal-killer");
    expect(bardSpells).toContain("polymorph");
    expect(bardSpells).toContain("greater-restoration");
    expect(bardSpells).toContain("hold-monster");
    expect(bardSpells).toContain("mass-cure-wounds");
    expect(bardSpells).toContain("raise-dead");
    expect(bardSpells).toContain("scrying");
    expect(bardSpells).toContain("teleportation-circle");
    expect(bardSpells.length).toBeGreaterThanOrEqual(40);

    expect(clericSpells).toContain("guiding-bolt");
    expect(clericSpells).toContain("aid");
    expect(clericSpells).toContain("hold-person");
    expect(clericSpells).toContain("dispel-magic");
    expect(clericSpells).toContain("revivify");
    expect(clericSpells).toContain("spirit-guardians");
    expect(clericSpells).toContain("create-food-and-water");
    expect(clericSpells).toContain("daylight");
    expect(clericSpells).toContain("magic-circle");
    expect(clericSpells).toContain("remove-curse");
    expect(clericSpells).toContain("sending");
    expect(clericSpells).toContain("water-walk");
    expect(clericSpells).toContain("aura-of-life");
    expect(clericSpells).toContain("banishment");
    expect(clericSpells).toContain("control-water");
    expect(clericSpells).toContain("death-ward");
    expect(clericSpells).toContain("divination");
    expect(clericSpells).toContain("freedom-of-movement");
    expect(clericSpells).toContain("guardian-of-faith");
    expect(clericSpells).toContain("locate-creature");
    expect(clericSpells).toContain("otilukes-resilient-sphere");
    expect(clericSpells).toContain("stone-shape");
    expect(clericSpells).toContain("leomunds-secret-chest");
    expect(clericSpells).toContain("greater-restoration");
    expect(clericSpells).toContain("mass-cure-wounds");
    expect(clericSpells).toContain("raise-dead");
    expect(clericSpells).toContain("scrying");
    expect(clericSpells.length).toBeGreaterThanOrEqual(39);

    expect(warlockSpells).toContain("eldritch-blast");
    expect(warlockSpells).toContain("chill-touch");
    expect(warlockSpells).toContain("hex");
    expect(warlockSpells).toContain("minor-illusion");
    expect(warlockSpells).toContain("charm-person");
    expect(warlockSpells).toContain("hold-person");
    expect(warlockSpells).toContain("invisibility");
    expect(warlockSpells).toContain("mirror-image");
    expect(warlockSpells).toContain("speak-with-animals");
    expect(warlockSpells).toContain("counterspell");
    expect(warlockSpells).toContain("dispel-magic");
    expect(warlockSpells).toContain("fly");
    expect(warlockSpells).toContain("hypnotic-pattern");
    expect(warlockSpells).toContain("magic-circle");
    expect(warlockSpells).toContain("remove-curse");
    expect(warlockSpells).toContain("banishment");
    expect(warlockSpells).toContain("blight");
    expect(warlockSpells).toContain("charm-monster");
    expect(warlockSpells).toContain("dimension-door");
    expect(warlockSpells).toContain("hallucinatory-terrain");
    expect(warlockSpells).toContain("bigbys-hand");
    expect(warlockSpells).toContain("hold-monster");
    expect(warlockSpells).toContain("scrying");
    expect(warlockSpells).toContain("teleportation-circle");
    expect(warlockSpells).not.toContain("guiding-bolt");
    expect(warlockSpells.length).toBeGreaterThanOrEqual(27);

    expect(druidSpells).toContain("produce-flame");
    expect(druidSpells).toContain("shillelagh");
    expect(druidSpells).toContain("thorn-whip");
    expect(druidSpells).toContain("charm-person");
    expect(druidSpells).toContain("goodberry");
    expect(druidSpells).toContain("hold-person");
    expect(druidSpells).toContain("moonbeam");
    expect(druidSpells).toContain("pass-without-trace");
    expect(druidSpells).toContain("call-lightning");
    expect(druidSpells).toContain("dispel-magic");
    expect(druidSpells).toContain("plant-growth");
    expect(druidSpells).toContain("revivify");
    expect(druidSpells).toContain("daylight");
    expect(druidSpells).toContain("meld-into-stone");
    expect(druidSpells).toContain("speak-with-plants");
    expect(druidSpells).toContain("water-walk");
    expect(druidSpells).toContain("wind-wall");
    expect(druidSpells).toContain("blight");
    expect(druidSpells).toContain("charm-monster");
    expect(druidSpells).toContain("confusion");
    expect(druidSpells).toContain("conjure-minor-elementals");
    expect(druidSpells).toContain("conjure-woodland-beings");
    expect(druidSpells).toContain("control-water");
    expect(druidSpells).toContain("divination");
    expect(druidSpells).toContain("dominate-beast");
    expect(druidSpells).toContain("fire-shield");
    expect(druidSpells).toContain("freedom-of-movement");
    expect(druidSpells).toContain("giant-insect");
    expect(druidSpells).toContain("hallucinatory-terrain");
    expect(druidSpells).toContain("ice-storm");
    expect(druidSpells).toContain("locate-creature");
    expect(druidSpells).toContain("polymorph");
    expect(druidSpells).toContain("stone-shape");
    expect(druidSpells).toContain("stoneskin");
    expect(druidSpells).toContain("wall-of-fire");
    expect(druidSpells).toContain("cone-of-cold");
    expect(druidSpells).toContain("greater-restoration");
    expect(druidSpells).toContain("mass-cure-wounds");
    expect(druidSpells).toContain("scrying");
    expect(druidSpells).toContain("wall-of-stone");
    expect(druidSpells.length).toBeGreaterThanOrEqual(53);

    expect(paladinSpells).toContain("command");
    expect(paladinSpells).toContain("heroism");
    expect(paladinSpells).toContain("aid");
    expect(paladinSpells).toContain("lesser-restoration");
    expect(paladinSpells).toContain("dispel-magic");
    expect(paladinSpells).toContain("revivify");
    expect(paladinSpells).toContain("create-food-and-water");
    expect(paladinSpells).toContain("daylight");
    expect(paladinSpells).toContain("magic-circle");
    expect(paladinSpells).toContain("remove-curse");
    expect(paladinSpells).toContain("aura-of-life");
    expect(paladinSpells).toContain("banishment");
    expect(paladinSpells).toContain("death-ward");
    expect(paladinSpells).toContain("locate-creature");
    expect(paladinSpells).toContain("otilukes-resilient-sphere");
    expect(paladinSpells).toContain("greater-restoration");
    expect(paladinSpells).toContain("raise-dead");
    expect(paladinSpells).not.toContain("moonbeam");
    expect(paladinSpells.length).toBeGreaterThanOrEqual(21);

    expect(rangerSpells).toContain("hunters-mark");
    expect(rangerSpells).toContain("cure-wounds");
    expect(rangerSpells).toContain("entangle");
    expect(rangerSpells).toContain("goodberry");
    expect(rangerSpells).toContain("aid");
    expect(rangerSpells).toContain("lesser-restoration");
    expect(rangerSpells).toContain("pass-without-trace");
    expect(rangerSpells).toContain("dispel-magic");
    expect(rangerSpells).toContain("plant-growth");
    expect(rangerSpells).toContain("revivify");
    expect(rangerSpells).toContain("daylight");
    expect(rangerSpells).toContain("meld-into-stone");
    expect(rangerSpells).toContain("nondetection");
    expect(rangerSpells).toContain("speak-with-plants");
    expect(rangerSpells).toContain("water-walk");
    expect(rangerSpells).toContain("wind-wall");
    expect(rangerSpells).toContain("conjure-woodland-beings");
    expect(rangerSpells).toContain("dominate-beast");
    expect(rangerSpells).toContain("freedom-of-movement");
    expect(rangerSpells).toContain("locate-creature");
    expect(rangerSpells).toContain("stoneskin");
    expect(rangerSpells).toContain("greater-restoration");
    expect(rangerSpells).not.toContain("magic-missile");
    expect(rangerSpells.length).toBeGreaterThanOrEqual(26);

    expect(sorcererSpells).toContain("chill-touch");
    expect(sorcererSpells).toContain("ray-of-frost");
    expect(sorcererSpells).toContain("burning-hands");
    expect(sorcererSpells).toContain("charm-person");
    expect(sorcererSpells).toContain("disguise-self");
    expect(sorcererSpells).toContain("hold-person");
    expect(sorcererSpells).toContain("invisibility");
    expect(sorcererSpells).toContain("mirror-image");
    expect(sorcererSpells).toContain("counterspell");
    expect(sorcererSpells).toContain("dispel-magic");
    expect(sorcererSpells).toContain("fireball");
    expect(sorcererSpells).toContain("fly");
    expect(sorcererSpells).toContain("hypnotic-pattern");
    expect(sorcererSpells).toContain("daylight");
    expect(sorcererSpells).toContain("water-walk");
    expect(sorcererSpells).toContain("banishment");
    expect(sorcererSpells).toContain("blight");
    expect(sorcererSpells).toContain("charm-monster");
    expect(sorcererSpells).toContain("confusion");
    expect(sorcererSpells).toContain("dimension-door");
    expect(sorcererSpells).toContain("dominate-beast");
    expect(sorcererSpells).toContain("evards-black-tentacles");
    expect(sorcererSpells).toContain("fire-shield");
    expect(sorcererSpells).toContain("greater-invisibility");
    expect(sorcererSpells).toContain("ice-storm");
    expect(sorcererSpells).toContain("polymorph");
    expect(sorcererSpells).toContain("stoneskin");
    expect(sorcererSpells).toContain("vitriolic-sphere");
    expect(sorcererSpells).toContain("wall-of-fire");
    expect(sorcererSpells).toContain("bigbys-hand");
    expect(sorcererSpells).toContain("cone-of-cold");
    expect(sorcererSpells).toContain("hold-monster");
    expect(sorcererSpells).toContain("teleportation-circle");
    expect(sorcererSpells).toContain("wall-of-stone");
    expect(sorcererSpells.length).toBeGreaterThanOrEqual(43);

    expect(wizardSpells).toContain("chill-touch");
    expect(wizardSpells).toContain("ray-of-frost");
    expect(wizardSpells).toContain("burning-hands");
    expect(wizardSpells).toContain("charm-person");
    expect(wizardSpells).toContain("disguise-self");
    expect(wizardSpells).toContain("hold-person");
    expect(wizardSpells).toContain("invisibility");
    expect(wizardSpells).toContain("mirror-image");
    expect(wizardSpells).toContain("counterspell");
    expect(wizardSpells).toContain("dispel-magic");
    expect(wizardSpells).toContain("fireball");
    expect(wizardSpells).toContain("fly");
    expect(wizardSpells).toContain("hypnotic-pattern");
    expect(wizardSpells).toContain("magic-circle");
    expect(wizardSpells).toContain("nondetection");
    expect(wizardSpells).toContain("remove-curse");
    expect(wizardSpells).toContain("sending");
    expect(wizardSpells).toContain("arcane-eye");
    expect(wizardSpells).toContain("banishment");
    expect(wizardSpells).toContain("blight");
    expect(wizardSpells).toContain("charm-monster");
    expect(wizardSpells).toContain("confusion");
    expect(wizardSpells).toContain("conjure-minor-elementals");
    expect(wizardSpells).toContain("control-water");
    expect(wizardSpells).toContain("divination");
    expect(wizardSpells).toContain("dimension-door");
    expect(wizardSpells).toContain("evards-black-tentacles");
    expect(wizardSpells).toContain("fabricate");
    expect(wizardSpells).toContain("fire-shield");
    expect(wizardSpells).toContain("greater-invisibility");
    expect(wizardSpells).toContain("hallucinatory-terrain");
    expect(wizardSpells).toContain("ice-storm");
    expect(wizardSpells).toContain("leomunds-secret-chest");
    expect(wizardSpells).toContain("locate-creature");
    expect(wizardSpells).toContain("mordenkainens-faithful-hound");
    expect(wizardSpells).toContain("mordenkainens-private-sanctum");
    expect(wizardSpells).toContain("otilukes-resilient-sphere");
    expect(wizardSpells).toContain("phantasmal-killer");
    expect(wizardSpells).toContain("polymorph");
    expect(wizardSpells).toContain("stone-shape");
    expect(wizardSpells).toContain("stoneskin");
    expect(wizardSpells).toContain("vitriolic-sphere");
    expect(wizardSpells).toContain("wall-of-fire");
    expect(wizardSpells).toContain("bigbys-hand");
    expect(wizardSpells).toContain("cone-of-cold");
    expect(wizardSpells).toContain("hold-monster");
    expect(wizardSpells).toContain("scrying");
    expect(wizardSpells).toContain("teleportation-circle");
    expect(wizardSpells).toContain("wall-of-force");
    expect(wizardSpells).toContain("wall-of-stone");
    expect(wizardSpells.length).toBeGreaterThanOrEqual(60);
  });
});

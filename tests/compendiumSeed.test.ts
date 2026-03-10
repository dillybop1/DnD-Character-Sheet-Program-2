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
    const emptyCompendiumBrowseResults = searchCompendiumSeed({
      query: "",
    });
    const emptySpellBrowseResults = searchCompendiumSeed({
      query: "",
      type: "spell",
    });
    const spellResults = searchCompendiumSeed({
      query: "radiant cleric",
      type: "spell",
    });

    expect(emptyCompendiumBrowseResults).toHaveLength(50);
    expect(emptySpellBrowseResults).toHaveLength(listCompendiumSpells().length);
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
    expect(spellRecordFromCompendium("commune")).toMatchObject({
      id: "commune",
      name: "Commune",
      level: 5,
      classes: ["Cleric"],
      ritual: true,
      description: expect.stringContaining("ask up to three questions"),
    });
    expect(spellRecordFromCompendium("commune-with-nature")).toMatchObject({
      id: "commune-with-nature",
      name: "Commune with Nature",
      level: 5,
      classes: ["Druid", "Ranger"],
      ritual: true,
      description: expect.stringContaining("Choose three of the following facts"),
    });
    expect(spellRecordFromCompendium("contact-other-plane")).toMatchObject({
      id: "contact-other-plane",
      name: "Contact Other Plane",
      level: 5,
      classes: ["Warlock", "Wizard"],
      ritual: true,
      description: expect.stringContaining("6d6 Psychic damage"),
    });
    expect(spellRecordFromCompendium("dispel-evil-and-good")).toMatchObject({
      id: "dispel-evil-and-good",
      name: "Dispel Evil and Good",
      level: 5,
      classes: ["Cleric", "Paladin"],
      concentration: true,
      saveAbility: "charisma",
      description: expect.stringContaining("Break Enchantment."),
    });
    expect(spellRecordFromCompendium("dominate-person")).toMatchObject({
      id: "dominate-person",
      name: "Dominate Person",
      level: 5,
      classes: ["Bard", "Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("geas")).toMatchObject({
      id: "geas",
      name: "Geas",
      level: 5,
      classes: ["Bard", "Cleric", "Druid", "Paladin", "Wizard"],
      saveAbility: "wisdom",
      description: expect.stringContaining("5d10 Psychic damage"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("legend-lore")).toMatchObject({
      id: "legend-lore",
      name: "Legend Lore",
      level: 5,
      classes: ["Bard", "Cleric", "Wizard"],
      castingTime: "10 minutes",
      description: expect.stringContaining("famous person, place, or object"),
    });
    expect(spellRecordFromCompendium("planar-binding")).toMatchObject({
      id: "planar-binding",
      name: "Planar Binding",
      level: 5,
      classes: ["Bard", "Cleric", "Druid", "Warlock", "Wizard"],
      saveAbility: "charisma",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("rarys-telepathic-bond")).toMatchObject({
      id: "rarys-telepathic-bond",
      name: "Rary’s Telepathic Bond",
      level: 5,
      classes: ["Bard", "Cleric", "Paladin", "Sorcerer", "Wizard"],
      description: expect.stringContaining("up to eight willing creatures"),
    });
    expect(spellRecordFromCompendium("tree-stride")).toMatchObject({
      id: "tree-stride",
      name: "Tree Stride",
      level: 5,
      classes: ["Druid", "Ranger"],
      concentration: true,
      description: expect.stringContaining("inside another tree"),
    });
    expect(spellRecordFromCompendium("animate-objects")).toMatchObject({
      id: "animate-objects",
      name: "Animate Objects",
      level: 5,
      classes: ["Bard", "Sorcerer", "Wizard"],
      concentration: true,
      description: expect.stringContaining("Animated Object stat block"),
    });
    expect(spellRecordFromCompendium("cloudkill")).toMatchObject({
      id: "cloudkill",
      name: "Cloudkill",
      level: 5,
      classes: ["Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "constitution",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("conjure-elemental")).toMatchObject({
      id: "conjure-elemental",
      name: "Conjure Elemental",
      level: 5,
      classes: ["Druid", "Wizard"],
      concentration: true,
      saveAbility: "dexterity",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("contagion")).toMatchObject({
      id: "contagion",
      name: "Contagion",
      level: 5,
      classes: ["Cleric", "Druid"],
      range: "Touch",
      saveAbility: "constitution",
      description: expect.stringContaining("11d8 Necrotic damage"),
    });
    expect(spellRecordFromCompendium("dream")).toMatchObject({
      id: "dream",
      name: "Dream",
      level: 5,
      classes: ["Bard", "Warlock", "Wizard"],
      range: "Special",
      saveAbility: "wisdom",
      description: expect.stringContaining("message of no more than ten words"),
    });
    expect(spellRecordFromCompendium("flame-strike")).toMatchObject({
      id: "flame-strike",
      name: "Flame Strike",
      level: 5,
      classes: ["Cleric"],
      saveAbility: "dexterity",
      description: expect.stringContaining("5d6 Fire damage and 5d6 Radiant damage"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("insect-plague")).toMatchObject({
      id: "insect-plague",
      name: "Insect Plague",
      level: 5,
      classes: ["Cleric", "Druid", "Sorcerer"],
      concentration: true,
      saveAbility: "constitution",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("mislead")).toMatchObject({
      id: "mislead",
      name: "Mislead",
      level: 5,
      classes: ["Bard", "Warlock", "Wizard"],
      concentration: true,
      description: expect.stringContaining("illusory double"),
    });
    expect(spellRecordFromCompendium("seeming")).toMatchObject({
      id: "seeming",
      name: "Seeming",
      level: 5,
      classes: ["Bard", "Sorcerer", "Wizard"],
      saveAbility: "charisma",
      description: expect.stringContaining("illusory appearance"),
    });
    expect(spellRecordFromCompendium("telekinesis")).toMatchObject({
      id: "telekinesis",
      name: "Telekinesis",
      level: 5,
      classes: ["Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "strength",
      description: expect.stringContaining("move or manipulate creatures or objects by thought"),
    });
    expect(spellRecordFromCompendium("antilife-shell")).toMatchObject({
      id: "antilife-shell",
      name: "Antilife Shell",
      level: 5,
      classes: ["Druid"],
      concentration: true,
      description: expect.stringContaining("10-foot Emanation"),
    });
    expect(spellRecordFromCompendium("awaken")).toMatchObject({
      id: "awaken",
      name: "Awaken",
      level: 5,
      classes: ["Bard", "Druid"],
      castingTime: "8 hours",
      description: expect.stringContaining("Intelligence of 10"),
    });
    expect(spellRecordFromCompendium("creation")).toMatchObject({
      id: "creation",
      name: "Creation",
      level: 5,
      classes: ["Sorcerer", "Wizard"],
      duration: "Special",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("hallow")).toMatchObject({
      id: "hallow",
      name: "Hallow",
      level: 5,
      classes: ["Cleric"],
      castingTime: "24 hours",
      duration: "Until dispelled",
      description: expect.stringContaining("Hallowed Ward."),
    });
    expect(spellRecordFromCompendium("modify-memory")).toMatchObject({
      id: "modify-memory",
      name: "Modify Memory",
      level: 5,
      classes: ["Bard", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("passwall")).toMatchObject({
      id: "passwall",
      name: "Passwall",
      level: 5,
      classes: ["Wizard"],
      duration: "1 hour",
      description: expect.stringContaining("A passage appears"),
    });
    expect(spellRecordFromCompendium("reincarnate")).toMatchObject({
      id: "reincarnate",
      name: "Reincarnate",
      level: 5,
      classes: ["Druid"],
      castingTime: "1 hour",
      description: expect.stringContaining("new body"),
    });
    expect(spellRecordFromCompendium("summon-dragon")).toMatchObject({
      id: "summon-dragon",
      name: "Summon Dragon",
      level: 5,
      classes: ["Wizard"],
      concentration: true,
      description: expect.stringContaining("Draconic Spirit stat block"),
    });
    expect(spellRecordFromCompendium("summon-dragon")?.description).toContain("Using a Higher-Level Spell Slot.");
    expect(spellRecordFromCompendium("blade-barrier")).toMatchObject({
      id: "blade-barrier",
      name: "Blade Barrier",
      level: 6,
      classes: ["Cleric"],
      concentration: true,
      saveAbility: "dexterity",
      description: expect.stringContaining("wall of whirling blades"),
    });
    expect(spellRecordFromCompendium("chain-lightning")).toMatchObject({
      id: "chain-lightning",
      name: "Chain Lightning",
      level: 6,
      classes: ["Sorcerer", "Wizard"],
      saveAbility: "dexterity",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("disintegrate")).toMatchObject({
      id: "disintegrate",
      name: "Disintegrate",
      level: 6,
      classes: ["Sorcerer", "Wizard"],
      saveAbility: "dexterity",
      description: expect.stringContaining("gray dust"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("globe-of-invulnerability")).toMatchObject({
      id: "globe-of-invulnerability",
      name: "Globe of Invulnerability",
      level: 6,
      classes: ["Sorcerer", "Wizard"],
      concentration: true,
      description: expect.stringContaining("10-foot Emanation"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("heal")).toMatchObject({
      id: "heal",
      name: "Heal",
      level: 6,
      classes: ["Cleric", "Druid"],
      description: expect.stringContaining("restoring 70 Hit Points"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("heroes-feast")).toMatchObject({
      id: "heroes-feast",
      name: "Heroes' Feast",
      level: 6,
      classes: ["Bard", "Cleric", "Druid"],
      castingTime: "10 minutes",
      description: expect.stringContaining("Up to twelve creatures can partake"),
    });
    expect(spellRecordFromCompendium("mass-suggestion")).toMatchObject({
      id: "mass-suggestion",
      name: "Mass Suggestion",
      level: 6,
      classes: ["Bard", "Sorcerer", "Wizard"],
      duration: "24 hours",
      saveAbility: "wisdom",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("sunbeam")).toMatchObject({
      id: "sunbeam",
      name: "Sunbeam",
      level: 6,
      classes: ["Cleric", "Druid", "Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "constitution",
      description: expect.stringContaining("Magic action"),
    });
    expect(spellRecordFromCompendium("true-seeing")).toMatchObject({
      id: "true-seeing",
      name: "True Seeing",
      level: 6,
      classes: ["Bard", "Cleric", "Sorcerer", "Warlock", "Wizard"],
      range: "Touch",
      description: expect.stringContaining("Truesight"),
    });
    expect(spellRecordFromCompendium("wall-of-ice")).toMatchObject({
      id: "wall-of-ice",
      name: "Wall of Ice",
      level: 6,
      classes: ["Wizard"],
      concentration: true,
      saveAbility: "dexterity",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("eyebite")).toMatchObject({
      id: "eyebite",
      name: "Eyebite",
      level: 6,
      classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      description: expect.stringContaining("inky void"),
    });
    expect(spellRecordFromCompendium("find-the-path")).toMatchObject({
      id: "find-the-path",
      name: "Find the Path",
      level: 6,
      classes: ["Bard", "Cleric", "Druid"],
      castingTime: "1 minute",
      duration: "Concentration, up to 1 day",
      description: expect.stringContaining("most direct physical route"),
    });
    expect(spellRecordFromCompendium("flesh-to-stone")).toMatchObject({
      id: "flesh-to-stone",
      name: "Flesh to Stone",
      level: 6,
      classes: ["Druid", "Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "constitution",
      description: expect.stringContaining("Petrified condition"),
    });
    expect(spellRecordFromCompendium("forbiddance")).toMatchObject({
      id: "forbiddance",
      name: "Forbiddance",
      level: 6,
      classes: ["Cleric"],
      ritual: true,
      castingTime: "10 minutes or Ritual",
      description: expect.stringContaining("40,000 square feet"),
    });
    expect(spellRecordFromCompendium("harm")).toMatchObject({
      id: "harm",
      name: "Harm",
      level: 6,
      classes: ["Cleric"],
      saveAbility: "constitution",
      description: expect.stringContaining("14d6 Necrotic damage"),
    });
    expect(spellRecordFromCompendium("move-earth")).toMatchObject({
      id: "move-earth",
      name: "Move Earth",
      level: 6,
      classes: ["Druid", "Sorcerer", "Wizard"],
      concentration: true,
      description: expect.stringContaining("40 feet on a side"),
    });
    expect(spellRecordFromCompendium("transport-via-plants")).toMatchObject({
      id: "transport-via-plants",
      name: "Transport via Plants",
      level: 6,
      classes: ["Druid"],
      range: "10 feet",
      description: expect.stringContaining("magical link"),
    });
    expect(spellRecordFromCompendium("wall-of-thorns")).toMatchObject({
      id: "wall-of-thorns",
      name: "Wall of Thorns",
      level: 6,
      classes: ["Druid"],
      concentration: true,
      saveAbility: "dexterity",
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("wind-walk")).toMatchObject({
      id: "wind-walk",
      name: "Wind Walk",
      level: 6,
      classes: ["Druid"],
      castingTime: "1 minute",
      duration: "8 hours",
      description: expect.stringContaining("Fly Speed of 300 feet"),
    });
    expect(spellRecordFromCompendium("word-of-recall")).toMatchObject({
      id: "word-of-recall",
      name: "Word of Recall",
      level: 6,
      classes: ["Cleric"],
      range: "5 feet",
      description: expect.stringContaining("previously designated sanctuary"),
    });
    expect(spellRecordFromCompendium("circle-of-death")).toMatchObject({
      id: "circle-of-death",
      name: "Circle of Death",
      level: 6,
      classes: ["Sorcerer", "Warlock", "Wizard"],
      saveAbility: "constitution",
      description: expect.stringContaining("60-foot-radius Sphere"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("conjure-fey")).toMatchObject({
      id: "conjure-fey",
      name: "Conjure Fey",
      level: 6,
      classes: ["Druid"],
      concentration: true,
      attackType: "spellAttack",
      description: expect.stringContaining("Medium spirit from the Feywild"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("contingency")).toMatchObject({
      id: "contingency",
      name: "Contingency",
      level: 6,
      classes: ["Wizard"],
      castingTime: "10 minutes",
      duration: "10 days",
      description: expect.stringContaining("contingent spell"),
    });
    expect(spellRecordFromCompendium("create-undead")).toMatchObject({
      id: "create-undead",
      name: "Create Undead",
      level: 6,
      classes: ["Cleric", "Warlock", "Wizard"],
      castingTime: "1 minute",
      range: "10 feet",
      description: expect.stringContaining("cast this spell only at night"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("guards-and-wards")).toMatchObject({
      id: "guards-and-wards",
      name: "Guards and Wards",
      level: 6,
      classes: ["Bard", "Wizard"],
      castingTime: "1 hour",
      description: expect.stringContaining("2,500 square feet"),
    });
    expect(spellRecordFromCompendium("guards-and-wards")?.description).toContain("Magic Mouth in two locations");
    expect(spellRecordFromCompendium("magic-jar")).toMatchObject({
      id: "magic-jar",
      name: "Magic Jar",
      level: 6,
      classes: ["Wizard"],
      saveAbility: "charisma",
      duration: "Until dispelled",
      description: expect.stringContaining("possess a Humanoid"),
    });
    expect(spellRecordFromCompendium("planar-ally")).toMatchObject({
      id: "planar-ally",
      name: "Planar Ally",
      level: 6,
      classes: ["Cleric"],
      castingTime: "10 minutes",
      description: expect.stringContaining("Celestial, an Elemental, or a Fiend"),
    });
    expect(spellRecordFromCompendium("programmed-illusion")).toMatchObject({
      id: "programmed-illusion",
      name: "Programmed Illusion",
      level: 6,
      classes: ["Bard", "Wizard"],
      range: "120 feet",
      duration: "Until dispelled",
      description: expect.stringContaining("scripted performance can last up to 5 minutes"),
    });
    expect(spellRecordFromCompendium("delayed-blast-fireball")).toMatchObject({
      id: "delayed-blast-fireball",
      name: "Delayed Blast Fireball",
      level: 7,
      classes: ["Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "dexterity",
      description: expect.stringContaining("glowing bead"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("etherealness")).toMatchObject({
      id: "etherealness",
      name: "Etherealness",
      level: 7,
      classes: ["Bard", "Cleric", "Sorcerer", "Warlock", "Wizard"],
      duration: "Up to 8 hours",
      description: expect.stringContaining("Border Ethereal"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("finger-of-death")).toMatchObject({
      id: "finger-of-death",
      name: "Finger of Death",
      level: 7,
      classes: ["Sorcerer", "Warlock", "Wizard"],
      saveAbility: "constitution",
      description: expect.stringContaining("7d8 + 30 Necrotic damage"),
    });
    expect(spellRecordFromCompendium("fire-storm")).toMatchObject({
      id: "fire-storm",
      name: "Fire Storm",
      level: 7,
      classes: ["Cleric", "Druid", "Sorcerer"],
      saveAbility: "dexterity",
      description: expect.stringContaining("up to ten 10-foot Cubes"),
    });
    expect(spellRecordFromCompendium("forcecage")).toMatchObject({
      id: "forcecage",
      name: "Forcecage",
      level: 7,
      classes: ["Bard", "Warlock", "Wizard"],
      concentration: true,
      duration: "Concentration, up to 1 hour",
      description: expect.stringContaining("Invisible, Cube-shaped prison"),
    });
    expect(spellRecordFromCompendium("plane-shift")).toMatchObject({
      id: "plane-shift",
      name: "Plane Shift",
      level: 7,
      classes: ["Cleric", "Druid", "Sorcerer", "Warlock", "Wizard"],
      range: "Touch",
      description: expect.stringContaining("different plane of existence"),
    });
    expect(spellRecordFromCompendium("regenerate")).toMatchObject({
      id: "regenerate",
      name: "Regenerate",
      level: 7,
      classes: ["Bard", "Cleric", "Druid"],
      duration: "1 hour",
      description: expect.stringContaining("severed body parts regrow after 2 minutes"),
    });
    expect(spellRecordFromCompendium("resurrection")).toMatchObject({
      id: "resurrection",
      name: "Resurrection",
      level: 7,
      classes: ["Bard", "Cleric"],
      castingTime: "1 hour",
      description: expect.stringContaining("dead for no more than a century"),
    });
    expect(spellRecordFromCompendium("reverse-gravity")).toMatchObject({
      id: "reverse-gravity",
      name: "Reverse Gravity",
      level: 7,
      classes: ["Druid", "Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "dexterity",
      description: expect.stringContaining("50-foot-radius, 100-foot high Cylinder"),
    });
    expect(spellRecordFromCompendium("teleport")).toMatchObject({
      id: "teleport",
      name: "Teleport",
      level: 7,
      classes: ["Bard", "Sorcerer", "Wizard"],
      range: "10 feet",
      description: expect.stringContaining("Teleportation Outcome table"),
    });
    expect(spellRecordFromCompendium("animal-shapes")).toMatchObject({
      id: "animal-shapes",
      name: "Animal Shapes",
      level: 8,
      classes: ["Druid"],
      duration: "24 hours",
      description: expect.stringContaining("Challenge Rating of 4 or lower"),
    });
    expect(spellRecordFromCompendium("antimagic-field")).toMatchObject({
      id: "antimagic-field",
      name: "Antimagic Field",
      level: 8,
      classes: ["Cleric", "Wizard"],
      concentration: true,
      description: expect.stringContaining("10-foot Emanation"),
    });
    expect(spellRecordFromCompendium("control-weather")).toMatchObject({
      id: "control-weather",
      name: "Control Weather",
      level: 8,
      classes: ["Cleric", "Druid", "Wizard"],
      castingTime: "10 minutes",
      concentration: true,
      description: expect.stringContaining("5 miles of you"),
    });
    expect(spellRecordFromCompendium("dominate-monster")).toMatchObject({
      id: "dominate-monster",
      name: "Dominate Monster",
      level: 8,
      classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      description: expect.stringContaining("telepathic link"),
      higherLevel: expect.stringContaining("level 9 spell slot"),
    });
    expect(spellRecordFromCompendium("earthquake")).toMatchObject({
      id: "earthquake",
      name: "Earthquake",
      level: 8,
      classes: ["Cleric", "Druid", "Sorcerer"],
      concentration: true,
      saveAbility: "dexterity",
      description: expect.stringContaining("100-foot-radius circle"),
    });
    expect(spellRecordFromCompendium("holy-aura")).toMatchObject({
      id: "holy-aura",
      name: "Holy Aura",
      level: 8,
      classes: ["Cleric"],
      concentration: true,
      saveAbility: "constitution",
      description: expect.stringContaining("Advantage on all saving throws"),
    });
    expect(spellRecordFromCompendium("incendiary-cloud")).toMatchObject({
      id: "incendiary-cloud",
      name: "Incendiary Cloud",
      level: 8,
      classes: ["Druid", "Sorcerer", "Wizard"],
      concentration: true,
      saveAbility: "dexterity",
      description: expect.stringContaining("20-foot-radius Sphere"),
    });
    expect(spellRecordFromCompendium("maze")).toMatchObject({
      id: "maze",
      name: "Maze",
      level: 8,
      classes: ["Wizard"],
      concentration: true,
      description: expect.stringContaining("labyrinthine demiplane"),
    });
    expect(spellRecordFromCompendium("power-word-stun")).toMatchObject({
      id: "power-word-stun",
      name: "Power Word Stun",
      level: 8,
      classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
      description: expect.stringContaining("150 Hit Points or fewer"),
    });
    expect(spellRecordFromCompendium("sunburst")).toMatchObject({
      id: "sunburst",
      name: "Sunburst",
      level: 8,
      classes: ["Cleric", "Druid", "Sorcerer", "Wizard"],
      saveAbility: "constitution",
      description: expect.stringContaining("12d6 Radiant damage"),
    });
    expect(spellRecordFromCompendium("antipathy-sympathy")).toMatchObject({
      id: "antipathy-sympathy",
      name: "Antipathy/Sympathy",
      level: 8,
      classes: ["Bard", "Druid", "Wizard"],
      castingTime: "1 hour",
      saveAbility: "wisdom",
      description: expect.stringContaining("comes within 120 feet of the target"),
    });
    expect(spellRecordFromCompendium("befuddlement")).toMatchObject({
      id: "befuddlement",
      name: "Befuddlement",
      level: 8,
      classes: ["Bard", "Druid", "Warlock", "Wizard"],
      saveAbility: "intelligence",
      description: expect.stringContaining("10d12 Psychic damage"),
    });
    expect(spellRecordFromCompendium("clone")).toMatchObject({
      id: "clone",
      name: "Clone",
      level: 8,
      classes: ["Wizard"],
      castingTime: "1 hour",
      description: expect.stringContaining("finishes growing after 120 days"),
    });
    expect(spellRecordFromCompendium("demiplane")).toMatchObject({
      id: "demiplane",
      name: "Demiplane",
      level: 8,
      classes: ["Sorcerer", "Warlock", "Wizard"],
      description: expect.stringContaining("empty room 30 feet in each dimension"),
    });
    expect(spellRecordFromCompendium("glibness")).toMatchObject({
      id: "glibness",
      name: "Glibness",
      level: 8,
      classes: ["Bard", "Warlock"],
      description: expect.stringContaining("replace the number you roll with a 15"),
    });
    expect(spellRecordFromCompendium("mind-blank")).toMatchObject({
      id: "mind-blank",
      name: "Mind Blank",
      level: 8,
      classes: ["Bard", "Wizard"],
      range: "Touch",
      description: expect.stringContaining("Immunity to Psychic damage"),
    });
    expect(spellRecordFromCompendium("tsunami")).toMatchObject({
      id: "tsunami",
      name: "Tsunami",
      level: 8,
      classes: ["Druid"],
      range: "1 mile",
      saveAbility: "strength",
      description: expect.stringContaining("300 feet long, 300 feet high, and 50 feet thick"),
    });
    expect(spellRecordFromCompendium("astral-projection")).toMatchObject({
      id: "astral-projection",
      name: "Astral Projection",
      level: 9,
      classes: ["Cleric", "Warlock", "Wizard"],
      castingTime: "1 hour",
      duration: "Until dispelled",
      description: expect.stringContaining("suspended animation"),
    });
    expect(spellRecordFromCompendium("foresight")).toMatchObject({
      id: "foresight",
      name: "Foresight",
      level: 9,
      classes: ["Bard", "Druid", "Warlock", "Wizard"],
      range: "Touch",
      description: expect.stringContaining("Advantage on D20 Tests"),
    });
    expect(spellRecordFromCompendium("gate")).toMatchObject({
      id: "gate",
      name: "Gate",
      level: 9,
      classes: ["Cleric", "Sorcerer", "Warlock", "Wizard"],
      concentration: true,
      description: expect.stringContaining("portal linking an unoccupied space"),
    });
    expect(spellRecordFromCompendium("imprisonment")).toMatchObject({
      id: "imprisonment",
      name: "Imprisonment",
      level: 9,
      classes: ["Warlock", "Wizard"],
      duration: "Until dispelled",
      saveAbility: "wisdom",
      description: expect.stringContaining("magical restraint"),
    });
    expect(spellRecordFromCompendium("mass-heal")).toMatchObject({
      id: "mass-heal",
      name: "Mass Heal",
      level: 9,
      classes: ["Cleric"],
      description: expect.stringContaining("restore up to 700 Hit Points"),
    });
    expect(spellRecordFromCompendium("meteor-swarm")).toMatchObject({
      id: "meteor-swarm",
      name: "Meteor Swarm",
      level: 9,
      classes: ["Sorcerer", "Wizard"],
      range: "1 mile",
      saveAbility: "dexterity",
      description: expect.stringContaining("20d6 Fire damage and 20d6 Bludgeoning damage"),
    });
    expect(spellRecordFromCompendium("power-word-heal")).toMatchObject({
      id: "power-word-heal",
      name: "Power Word Heal",
      level: 9,
      classes: ["Bard", "Cleric"],
      description: expect.stringContaining("regains all its Hit Points"),
    });
    expect(spellRecordFromCompendium("power-word-kill")).toMatchObject({
      id: "power-word-kill",
      name: "Power Word Kill",
      level: 9,
      classes: ["Bard", "Sorcerer", "Warlock", "Wizard"],
      description: expect.stringContaining("100 Hit Points or fewer"),
    });
    expect(spellRecordFromCompendium("prismatic-wall")).toMatchObject({
      id: "prismatic-wall",
      name: "Prismatic Wall",
      level: 9,
      classes: ["Bard", "Wizard"],
      description: expect.stringContaining("Prismatic Layers"),
    });
    expect(spellRecordFromCompendium("shapechange")).toMatchObject({
      id: "shapechange",
      name: "Shapechange",
      level: 9,
      classes: ["Druid", "Wizard"],
      concentration: true,
      description: expect.stringContaining("Challenge Rating no higher than your level or Challenge Rating"),
    });
    expect(spellRecordFromCompendium("storm-of-vengeance")).toMatchObject({
      id: "storm-of-vengeance",
      name: "Storm of Vengeance",
      level: 9,
      classes: ["Druid"],
      concentration: true,
      description: expect.stringContaining("Turn 2. Acidic rain falls."),
    });
    expect(spellRecordFromCompendium("time-stop")).toMatchObject({
      id: "time-stop",
      name: "Time Stop",
      level: 9,
      classes: ["Sorcerer", "Wizard"],
      description: expect.stringContaining("1d4 + 1 turns in a row"),
    });
    expect(spellRecordFromCompendium("true-polymorph")).toMatchObject({
      id: "true-polymorph",
      name: "True Polymorph",
      level: 9,
      classes: ["Bard", "Warlock", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      description: expect.stringContaining("maintain Concentration on this spell for the full duration"),
    });
    expect(spellRecordFromCompendium("true-resurrection")).toMatchObject({
      id: "true-resurrection",
      name: "True Resurrection",
      level: 9,
      classes: ["Cleric", "Druid"],
      castingTime: "1 hour",
      description: expect.stringContaining("dead for no longer than 200 years"),
    });
    expect(spellRecordFromCompendium("weird")).toMatchObject({
      id: "weird",
      name: "Weird",
      level: 9,
      classes: ["Warlock", "Wizard"],
      concentration: true,
      saveAbility: "wisdom",
      description: expect.stringContaining("10d10 Psychic damage"),
    });
    expect(spellRecordFromCompendium("wish")).toMatchObject({
      id: "wish",
      name: "Wish",
      level: 9,
      classes: ["Sorcerer", "Wizard"],
      description: expect.stringContaining("duplicate any other spell of level 8 or lower"),
    });
    expect(spellRecordFromCompendium("conjure-celestial")).toMatchObject({
      id: "conjure-celestial",
      level: 7,
      classes: ["Cleric"],
      concentration: true,
      saveAbility: "dexterity",
      description: expect.stringContaining("pillar of light"),
      higherLevel: expect.stringContaining("Using a Higher-Level Spell Slot."),
    });
    expect(spellRecordFromCompendium("divine-word")).toMatchObject({
      id: "divine-word",
      level: 7,
      classes: ["Cleric"],
      castingTime: "Bonus Action",
      saveAbility: "charisma",
      description: expect.stringContaining("Divine Word Effects"),
    });
    expect(spellRecordFromCompendium("mirage-arcane")).toMatchObject({
      id: "mirage-arcane",
      level: 7,
      classes: ["Bard", "Druid", "Wizard"],
      range: "Sight",
      duration: "10 days",
      description: expect.stringContaining("1 mile square"),
    });
    expect(spellRecordFromCompendium("mordenkainens-magnificent-mansion")).toMatchObject({
      id: "mordenkainens-magnificent-mansion",
      level: 7,
      classes: ["Bard", "Wizard"],
      castingTime: "1 minute",
      description: expect.stringContaining("extradimensional dwelling"),
    });
    expect(spellRecordFromCompendium("mordenkainens-sword")).toMatchObject({
      id: "mordenkainens-sword",
      level: 7,
      classes: ["Bard", "Wizard"],
      attackType: "spellAttack",
      description: expect.stringContaining("spectral sword"),
    });
    expect(spellRecordFromCompendium("prismatic-spray")).toMatchObject({
      id: "prismatic-spray",
      level: 7,
      classes: ["Bard", "Sorcerer", "Wizard"],
      saveAbility: "dexterity",
      description: expect.stringContaining("Prismatic Rays"),
    });
    expect(spellRecordFromCompendium("project-image")).toMatchObject({
      id: "project-image",
      level: 7,
      classes: ["Bard", "Wizard"],
      concentration: true,
      range: "500 miles",
      description: expect.stringContaining("illusory copy of yourself"),
    });
    expect(spellRecordFromCompendium("sequester")).toMatchObject({
      id: "sequester",
      level: 7,
      classes: ["Wizard"],
      duration: "Until dispelled",
      description: expect.stringContaining("suspended animation"),
    });
    expect(spellRecordFromCompendium("simulacrum")).toMatchObject({
      id: "simulacrum",
      level: 7,
      classes: ["Wizard"],
      castingTime: "12 hours",
      description: expect.stringContaining("Friendly to you"),
    });
    expect(spellRecordFromCompendium("symbol")).toMatchObject({
      id: "symbol",
      level: 7,
      classes: ["Bard", "Cleric", "Druid", "Wizard"],
      duration: "Until dispelled or triggered",
      description: expect.stringContaining("Death."),
    });
    expect(spellRecordFromCompendium("symbol")?.description).toContain("Stunning.");
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

    const communeSpellResults = searchCompendiumSeed({
      query: "three yes no questions cleric ritual spell",
      type: "spell",
    });

    expect(communeSpellResults.some((entry) => entry.slug === "commune")).toBe(true);

    const natureSpellResults = searchCompendiumSeed({
      query: "nature spirits settlements portals ranger ritual spell",
      type: "spell",
    });

    expect(natureSpellResults.some((entry) => entry.slug === "commune-with-nature")).toBe(true);

    const otherPlaneSpellResults = searchCompendiumSeed({
      query: "other plane questions intelligence psychic ritual spell",
      type: "spell",
    });

    expect(otherPlaneSpellResults.some((entry) => entry.slug === "contact-other-plane")).toBe(true);

    const outsiderSpellResults = searchCompendiumSeed({
      query: "dismiss fiend home plane paladin spell",
      type: "spell",
    });

    expect(outsiderSpellResults.some((entry) => entry.slug === "dispel-evil-and-good")).toBe(true);

    const dominationSpellResults = searchCompendiumSeed({
      query: "telepathic command humanoid wisdom spell",
      type: "spell",
    });

    expect(dominationSpellResults.some((entry) => entry.slug === "dominate-person")).toBe(true);

    const commandSpellResults = searchCompendiumSeed({
      query: "long term command 5d10 psychic spell",
      type: "spell",
    });

    expect(commandSpellResults.some((entry) => entry.slug === "geas")).toBe(true);

    const loreSpellResults = searchCompendiumSeed({
      query: "famous person place object lore spell",
      type: "spell",
    });

    expect(loreSpellResults.some((entry) => entry.slug === "legend-lore")).toBe(true);

    const bindingSpellResults = searchCompendiumSeed({
      query: "bind celestial fiend service spell",
      type: "spell",
    });

    expect(bindingSpellResults.some((entry) => entry.slug === "planar-binding")).toBe(true);

    const telepathySpellResults = searchCompendiumSeed({
      query: "telepathic link eight willing creatures spell",
      type: "spell",
    });

    expect(telepathySpellResults.some((entry) => entry.slug === "rarys-telepathic-bond")).toBe(true);

    const treeStrideSpellResults = searchCompendiumSeed({
      query: "enter tree move another tree ranger spell",
      type: "spell",
    });

    expect(treeStrideSpellResults.some((entry) => entry.slug === "tree-stride")).toBe(true);

    const animateSpellResults = searchCompendiumSeed({
      query: "animate objects bonus action construct spell",
      type: "spell",
    });

    expect(animateSpellResults.some((entry) => entry.slug === "animate-objects")).toBe(true);

    const poisonFogSpellResults = searchCompendiumSeed({
      query: "poison fog constitution sphere spell",
      type: "spell",
    });

    expect(poisonFogSpellResults.some((entry) => entry.slug === "cloudkill")).toBe(true);

    const elementalSpellResults = searchCompendiumSeed({
      query: "elemental restrained dexterity spell",
      type: "spell",
    });

    expect(elementalSpellResults.some((entry) => entry.slug === "conjure-elemental")).toBe(true);

    const diseaseSpellResults = searchCompendiumSeed({
      query: "11d8 necrotic poisoned spell",
      type: "spell",
    });

    expect(diseaseSpellResults.some((entry) => entry.slug === "contagion")).toBe(true);

    const nightmareSpellResults = searchCompendiumSeed({
      query: "ten words psychic rest dream spell",
      type: "spell",
    });

    expect(nightmareSpellResults.some((entry) => entry.slug === "dream")).toBe(true);

    const sacredFireSpellResults = searchCompendiumSeed({
      query: "radiant fire cylinder cleric spell",
      type: "spell",
    });

    expect(sacredFireSpellResults.some((entry) => entry.slug === "flame-strike")).toBe(true);

    const swarmSpellResults = searchCompendiumSeed({
      query: "locust difficult terrain constitution spell",
      type: "spell",
    });

    expect(swarmSpellResults.some((entry) => entry.slug === "insect-plague")).toBe(true);

    const doubleSpellResults = searchCompendiumSeed({
      query: "invisible illusory double spell",
      type: "spell",
    });

    expect(doubleSpellResults.some((entry) => entry.slug === "mislead")).toBe(true);

    const disguiseSpellResults = searchCompendiumSeed({
      query: "illusory appearance disguise group spell",
      type: "spell",
    });

    expect(disguiseSpellResults.some((entry) => entry.slug === "seeming")).toBe(true);

    const forceMindSpellResults = searchCompendiumSeed({
      query: "move manipulate objects by thought spell",
      type: "spell",
    });

    expect(forceMindSpellResults.some((entry) => entry.slug === "telekinesis")).toBe(true);

    const barrierSpellResults = searchCompendiumSeed({
      query: "barrier emanation druid spell",
      type: "spell",
    });

    expect(barrierSpellResults.some((entry) => entry.slug === "antilife-shell")).toBe(true);

    const awakenSpellResults = searchCompendiumSeed({
      query: "awaken plant beast intelligence spell",
      type: "spell",
    });

    expect(awakenSpellResults.some((entry) => entry.slug === "awaken")).toBe(true);

    const creationSpellResults = searchCompendiumSeed({
      query: "shadow material cube object spell",
      type: "spell",
    });

    expect(creationSpellResults.some((entry) => entry.slug === "creation")).toBe(true);

    const hallowSpellResults = searchCompendiumSeed({
      query: "hallowed ward teleportation cleric spell",
      type: "spell",
    });

    expect(hallowSpellResults.some((entry) => entry.slug === "hallow")).toBe(true);

    const memorySpellResults = searchCompendiumSeed({
      query: "alter erase memory wisdom spell",
      type: "spell",
    });

    expect(memorySpellResults.some((entry) => entry.slug === "modify-memory")).toBe(true);

    const breachSpellResults = searchCompendiumSeed({
      query: "temporary passage stone wall spell",
      type: "spell",
    });

    expect(breachSpellResults.some((entry) => entry.slug === "passwall")).toBe(true);

    const rebirthSpellResults = searchCompendiumSeed({
      query: "dead humanoid new body druid spell",
      type: "spell",
    });

    expect(rebirthSpellResults.some((entry) => entry.slug === "reincarnate")).toBe(true);

    const dragonSpellResults = searchCompendiumSeed({
      query: "draconic spirit breath weapon wizard spell",
      type: "spell",
    });

    expect(dragonSpellResults.some((entry) => entry.slug === "summon-dragon")).toBe(true);

    const bladeBarrierSpellResults = searchCompendiumSeed({
      query: "blade wall force difficult terrain cleric spell",
      type: "spell",
    });

    expect(bladeBarrierSpellResults.some((entry) => entry.slug === "blade-barrier")).toBe(true);

    const chainLightningSpellResults = searchCompendiumSeed({
      query: "lightning leaps multiple targets wizard spell",
      type: "spell",
    });

    expect(chainLightningSpellResults.some((entry) => entry.slug === "chain-lightning")).toBe(true);

    const disintegrateSpellResults = searchCompendiumSeed({
      query: "green ray gray dust force spell",
      type: "spell",
    });

    expect(disintegrateSpellResults.some((entry) => entry.slug === "disintegrate")).toBe(true);

    const globeSpellResults = searchCompendiumSeed({
      query: "anti magic barrier 10-foot emanation spell",
      type: "spell",
    });

    expect(globeSpellResults.some((entry) => entry.slug === "globe-of-invulnerability")).toBe(true);

    const healSpellResults = searchCompendiumSeed({
      query: "restore 70 hit points blinded deafened poisoned spell",
      type: "spell",
    });

    expect(healSpellResults.some((entry) => entry.slug === "heal")).toBe(true);

    const feastSpellResults = searchCompendiumSeed({
      query: "feast poison frightened immunity bard spell",
      type: "spell",
    });

    expect(feastSpellResults.some((entry) => entry.slug === "heroes-feast")).toBe(true);

    const suggestionSpellResults = searchCompendiumSeed({
      query: "twelve creatures 25 words suggestion spell",
      type: "spell",
    });

    expect(suggestionSpellResults.some((entry) => entry.slug === "mass-suggestion")).toBe(true);

    const sunbeamSpellResults = searchCompendiumSeed({
      query: "sunlight radiant blinded line spell",
      type: "spell",
    });

    expect(sunbeamSpellResults.some((entry) => entry.slug === "sunbeam")).toBe(true);

    const trueSeeingSpellResults = searchCompendiumSeed({
      query: "truesight 120 feet touch spell",
      type: "spell",
    });

    expect(trueSeeingSpellResults.some((entry) => entry.slug === "true-seeing")).toBe(true);

    const wallOfIceSpellResults = searchCompendiumSeed({
      query: "hemispherical dome frigid air wall spell",
      type: "spell",
    });

    expect(wallOfIceSpellResults.some((entry) => entry.slug === "wall-of-ice")).toBe(true);

    const eyebiteSpellResults = searchCompendiumSeed({
      query: "inky void asleep panicked sickened spell",
      type: "spell",
    });

    expect(eyebiteSpellResults.some((entry) => entry.slug === "eyebite")).toBe(true);

    const pathSpellResults = searchCompendiumSeed({
      query: "most direct physical route destination spell",
      type: "spell",
    });

    expect(pathSpellResults.some((entry) => entry.slug === "find-the-path")).toBe(true);

    const petrifySpellResults = searchCompendiumSeed({
      query: "restrained petrified constitution spell",
      type: "spell",
    });

    expect(petrifySpellResults.some((entry) => entry.slug === "flesh-to-stone")).toBe(true);

    const forbiddanceSpellResults = searchCompendiumSeed({
      query: "teleport planar travel password ward spell",
      type: "spell",
    });

    expect(forbiddanceSpellResults.some((entry) => entry.slug === "forbiddance")).toBe(true);

    const harmSpellResults = searchCompendiumSeed({
      query: "14d6 necrotic hit point maximum spell",
      type: "spell",
    });

    expect(harmSpellResults.some((entry) => entry.slug === "harm")).toBe(true);

    const earthSpellResults = searchCompendiumSeed({
      query: "reshape trench pillar terrain spell",
      type: "spell",
    });

    expect(earthSpellResults.some((entry) => entry.slug === "move-earth")).toBe(true);

    const plantsSpellResults = searchCompendiumSeed({
      query: "magical link plant destination spell",
      type: "spell",
    });

    expect(plantsSpellResults.some((entry) => entry.slug === "transport-via-plants")).toBe(true);

    const thornSpellResults = searchCompendiumSeed({
      query: "needle sharp thorns wall spell",
      type: "spell",
    });

    expect(thornSpellResults.some((entry) => entry.slug === "wall-of-thorns")).toBe(true);

    const windWalkSpellResults = searchCompendiumSeed({
      query: "cloud form 300 feet fly speed spell",
      type: "spell",
    });

    expect(windWalkSpellResults.some((entry) => entry.slug === "wind-walk")).toBe(true);

    const recallSpellResults = searchCompendiumSeed({
      query: "prepared sanctuary teleport cleric spell",
      type: "spell",
    });

    expect(recallSpellResults.some((entry) => entry.slug === "word-of-recall")).toBe(true);

    const circleDeathSpellResults = searchCompendiumSeed({
      query: "negative energy 60-foot necrotic sphere spell",
      type: "spell",
    });

    expect(circleDeathSpellResults.some((entry) => entry.slug === "circle-of-death")).toBe(true);

    const conjureFeySpellResults = searchCompendiumSeed({
      query: "feywild spirit psychic frightened spell",
      type: "spell",
    });

    expect(conjureFeySpellResults.some((entry) => entry.slug === "conjure-fey")).toBe(true);

    const contingencySpellResults = searchCompendiumSeed({
      query: "contingent spell trigger self wizard spell",
      type: "spell",
    });

    expect(contingencySpellResults.some((entry) => entry.slug === "contingency")).toBe(true);

    const createUndeadSpellResults = searchCompendiumSeed({
      query: "night ghouls undead corpses spell",
      type: "spell",
    });

    expect(createUndeadSpellResults.some((entry) => entry.slug === "create-undead")).toBe(true);

    const guardsSpellResults = searchCompendiumSeed({
      query: "fog locked doors web stairs ward spell",
      type: "spell",
    });

    expect(guardsSpellResults.some((entry) => entry.slug === "guards-and-wards")).toBe(true);

    const magicJarSpellResults = searchCompendiumSeed({
      query: "soul container possess humanoid spell",
      type: "spell",
    });

    expect(magicJarSpellResults.some((entry) => entry.slug === "magic-jar")).toBe(true);

    const planarAllySpellResults = searchCompendiumSeed({
      query: "celestial elemental fiend aid spell",
      type: "spell",
    });

    expect(planarAllySpellResults.some((entry) => entry.slug === "planar-ally")).toBe(true);

    const programmedIllusionSpellResults = searchCompendiumSeed({
      query: "scripted illusion trigger trapped door spell",
      type: "spell",
    });

    expect(programmedIllusionSpellResults.some((entry) => entry.slug === "programmed-illusion")).toBe(true);

    const delayedBlastSpellResults = searchCompendiumSeed({
      query: "glowing bead delayed blast fire spell",
      type: "spell",
    });

    expect(delayedBlastSpellResults.some((entry) => entry.slug === "delayed-blast-fireball")).toBe(true);

    const etherealnessSpellResults = searchCompendiumSeed({
      query: "border ethereal plane travel spell",
      type: "spell",
    });

    expect(etherealnessSpellResults.some((entry) => entry.slug === "etherealness")).toBe(true);

    const fingerDeathSpellResults = searchCompendiumSeed({
      query: "7d8 30 necrotic zombie spell",
      type: "spell",
    });

    expect(fingerDeathSpellResults.some((entry) => entry.slug === "finger-of-death")).toBe(true);

    const fireStormSpellResults = searchCompendiumSeed({
      query: "ten 10-foot cubes fire storm spell",
      type: "spell",
    });

    expect(fireStormSpellResults.some((entry) => entry.slug === "fire-storm")).toBe(true);

    const forcecageSpellResults = searchCompendiumSeed({
      query: "invisible prison force cage spell",
      type: "spell",
    });

    expect(forcecageSpellResults.some((entry) => entry.slug === "forcecage")).toBe(true);

    const planeShiftSpellResults = searchCompendiumSeed({
      query: "different plane existence linked hands spell",
      type: "spell",
    });

    expect(planeShiftSpellResults.some((entry) => entry.slug === "plane-shift")).toBe(true);

    const regenerateSpellResults = searchCompendiumSeed({
      query: "severed body parts regrow spell",
      type: "spell",
    });

    expect(regenerateSpellResults.some((entry) => entry.slug === "regenerate")).toBe(true);

    const resurrectionLevel7SpellResults = searchCompendiumSeed({
      query: "dead for no more than a century spell",
      type: "spell",
    });

    expect(resurrectionLevel7SpellResults.some((entry) => entry.slug === "resurrection")).toBe(true);

    const reverseGravitySpellResults = searchCompendiumSeed({
      query: "50-foot-radius 100-foot high cylinder spell",
      type: "spell",
    });

    expect(reverseGravitySpellResults.some((entry) => entry.slug === "reverse-gravity")).toBe(true);

    const teleportLevel7SpellResults = searchCompendiumSeed({
      query: "teleportation outcome table spell",
      type: "spell",
    });

    expect(teleportLevel7SpellResults.some((entry) => entry.slug === "teleport")).toBe(true);

    const animalShapesSpellResults = searchCompendiumSeed({
      query: "beast shapes temporary hit points druid spell",
      type: "spell",
    });

    expect(animalShapesSpellResults.some((entry) => entry.slug === "animal-shapes")).toBe(true);

    const antimagicFieldSpellResults = searchCompendiumSeed({
      query: "antimagic aura suppress spells wizard spell",
      type: "spell",
    });

    expect(antimagicFieldSpellResults.some((entry) => entry.slug === "antimagic-field")).toBe(true);

    const controlWeatherSpellResults = searchCompendiumSeed({
      query: "weather 5 miles outdoors spell",
      type: "spell",
    });

    expect(controlWeatherSpellResults.some((entry) => entry.slug === "control-weather")).toBe(true);

    const dominateMonsterSpellResults = searchCompendiumSeed({
      query: "telepathic command charmed monster spell",
      type: "spell",
    });

    expect(dominateMonsterSpellResults.some((entry) => entry.slug === "dominate-monster")).toBe(true);

    const earthquakeSpellResults = searchCompendiumSeed({
      query: "fissures prone ground earthquake spell",
      type: "spell",
    });

    expect(earthquakeSpellResults.some((entry) => entry.slug === "earthquake")).toBe(true);

    const holyAuraSpellResults = searchCompendiumSeed({
      query: "advantage on all saving throws aura cleric spell",
      type: "spell",
    });

    expect(holyAuraSpellResults.some((entry) => entry.slug === "holy-aura")).toBe(true);

    const incendiaryCloudSpellResults = searchCompendiumSeed({
      query: "embers smoke heavily obscured sphere spell",
      type: "spell",
    });

    expect(incendiaryCloudSpellResults.some((entry) => entry.slug === "incendiary-cloud")).toBe(true);

    const mazeSpellResults = searchCompendiumSeed({
      query: "labyrinthine demiplane study action spell",
      type: "spell",
    });

    expect(mazeSpellResults.some((entry) => entry.slug === "maze")).toBe(true);

    const powerWordStunSpellResults = searchCompendiumSeed({
      query: "150 hit points stunned word spell",
      type: "spell",
    });

    expect(powerWordStunSpellResults.some((entry) => entry.slug === "power-word-stun")).toBe(true);

    const sunburstSpellResults = searchCompendiumSeed({
      query: "brilliant sunlight radiant blinded sphere spell",
      type: "spell",
    });

    expect(sunburstSpellResults.some((entry) => entry.slug === "sunburst")).toBe(true);

    const antipathySympathySpellResults = searchCompendiumSeed({
      query: "antipathy sympathy frightened charmed spell",
      type: "spell",
    });

    expect(antipathySympathySpellResults.some((entry) => entry.slug === "antipathy-sympathy")).toBe(true);

    const befuddlementSpellResults = searchCompendiumSeed({
      query: "befuddlement psychic magic action spell",
      type: "spell",
    });

    expect(befuddlementSpellResults.some((entry) => entry.slug === "befuddlement")).toBe(true);

    const cloneSpellResults = searchCompendiumSeed({
      query: "inert duplicate 120 days soul spell",
      type: "spell",
    });

    expect(cloneSpellResults.some((entry) => entry.slug === "clone")).toBe(true);

    const demiplaneSpellResults = searchCompendiumSeed({
      query: "shadowy medium door demiplane spell",
      type: "spell",
    });

    expect(demiplaneSpellResults.some((entry) => entry.slug === "demiplane")).toBe(true);

    const glibnessSpellResults = searchCompendiumSeed({
      query: "charisma check 15 truthful spell",
      type: "spell",
    });

    expect(glibnessSpellResults.some((entry) => entry.slug === "glibness")).toBe(true);

    const mindBlankSpellResults = searchCompendiumSeed({
      query: "psychic damage charmed immunity spell",
      type: "spell",
    });

    expect(mindBlankSpellResults.some((entry) => entry.slug === "mind-blank")).toBe(true);

    const tsunamiSpellResults = searchCompendiumSeed({
      query: "wall of water bludgeoning wave spell",
      type: "spell",
    });

    expect(tsunamiSpellResults.some((entry) => entry.slug === "tsunami")).toBe(true);

    const imprisonmentSpellResults = searchCompendiumSeed({
      query: "hedged prison minimus containment magical restraint spell",
      type: "spell",
    });

    expect(imprisonmentSpellResults.some((entry) => entry.slug === "imprisonment")).toBe(true);

    const meteorSwarmSpellResults = searchCompendiumSeed({
      query: "four blazing orbs fire bludgeoning spell",
      type: "spell",
    });

    expect(meteorSwarmSpellResults.some((entry) => entry.slug === "meteor-swarm")).toBe(true);

    const wishSpellResults = searchCompendiumSeed({
      query: "duplicate any other spell of level 8 or lower reality spell",
      type: "spell",
    });

    expect(wishSpellResults.some((entry) => entry.slug === "wish")).toBe(true);

    const conjureCelestialSpellResults = searchCompendiumSeed({
      query: "upper planes pillar of light radiant spell",
      type: "spell",
    });

    expect(conjureCelestialSpellResults.some((entry) => entry.slug === "conjure-celestial")).toBe(true);

    const divineWordSpellResults = searchCompendiumSeed({
      query: "divine word effects charisma spell",
      type: "spell",
    });

    expect(divineWordSpellResults.some((entry) => entry.slug === "divine-word")).toBe(true);

    const mirageArcaneSpellResults = searchCompendiumSeed({
      query: "1 mile square illusion terrain spell",
      type: "spell",
    });

    expect(mirageArcaneSpellResults.some((entry) => entry.slug === "mirage-arcane")).toBe(true);

    const mansionSpellResults = searchCompendiumSeed({
      query: "extradimensional dwelling banquet servants spell",
      type: "spell",
    });

    expect(mansionSpellResults.some((entry) => entry.slug === "mordenkainens-magnificent-mansion")).toBe(true);

    const swordSpellResults = searchCompendiumSeed({
      query: "spectral sword force spell attack spell",
      type: "spell",
    });

    expect(swordSpellResults.some((entry) => entry.slug === "mordenkainens-sword")).toBe(true);

    const prismaticSpraySpellResults = searchCompendiumSeed({
      query: "prismatic rays cone spell",
      type: "spell",
    });

    expect(prismaticSpraySpellResults.some((entry) => entry.slug === "prismatic-spray")).toBe(true);

    const projectImageSpellResults = searchCompendiumSeed({
      query: "illusory copy of yourself remote spell",
      type: "spell",
    });

    expect(projectImageSpellResults.some((entry) => entry.slug === "project-image")).toBe(true);

    const sequesterSpellResults = searchCompendiumSeed({
      query: "suspended animation invisible divination spell",
      type: "spell",
    });

    expect(sequesterSpellResults.some((entry) => entry.slug === "sequester")).toBe(true);

    const simulacrumSpellResults = searchCompendiumSeed({
      query: "friendly to you ice snow duplicate spell",
      type: "spell",
    });

    expect(simulacrumSpellResults.some((entry) => entry.slug === "simulacrum")).toBe(true);

    const symbolSpellResults = searchCompendiumSeed({
      query: "harmful glyph death discord fear sleep stunning spell",
      type: "spell",
    });

    expect(symbolSpellResults.some((entry) => entry.slug === "symbol")).toBe(true);

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
    expect(bardSpells).toContain("dominate-person");
    expect(bardSpells).toContain("geas");
    expect(bardSpells).toContain("legend-lore");
    expect(bardSpells).toContain("planar-binding");
    expect(bardSpells).toContain("rarys-telepathic-bond");
    expect(bardSpells).toContain("animate-objects");
    expect(bardSpells).toContain("awaken");
    expect(bardSpells).toContain("dream");
    expect(bardSpells).toContain("eyebite");
    expect(bardSpells).toContain("find-the-path");
    expect(bardSpells).toContain("guards-and-wards");
    expect(bardSpells).toContain("heroes-feast");
    expect(bardSpells).toContain("mass-suggestion");
    expect(bardSpells).toContain("modify-memory");
    expect(bardSpells).toContain("mislead");
    expect(bardSpells).toContain("programmed-illusion");
    expect(bardSpells).toContain("etherealness");
    expect(bardSpells).toContain("forcecage");
    expect(bardSpells).toContain("mirage-arcane");
    expect(bardSpells).toContain("mordenkainens-magnificent-mansion");
    expect(bardSpells).toContain("mordenkainens-sword");
    expect(bardSpells).toContain("prismatic-spray");
    expect(bardSpells).toContain("project-image");
    expect(bardSpells).toContain("dominate-monster");
    expect(bardSpells).toContain("power-word-stun");
    expect(bardSpells).toContain("antipathy-sympathy");
    expect(bardSpells).toContain("befuddlement");
    expect(bardSpells).toContain("glibness");
    expect(bardSpells).toContain("mind-blank");
    expect(bardSpells).toContain("regenerate");
    expect(bardSpells).toContain("resurrection");
    expect(bardSpells).toContain("symbol");
    expect(bardSpells).toContain("teleport");
    expect(bardSpells).toContain("seeming");
    expect(bardSpells).toContain("true-seeing");
    expect(bardSpells).toContain("foresight");
    expect(bardSpells).toContain("power-word-heal");
    expect(bardSpells).toContain("power-word-kill");
    expect(bardSpells).toContain("prismatic-wall");
    expect(bardSpells).toContain("true-polymorph");
    expect(bardSpells.length).toBeGreaterThanOrEqual(80);

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
    expect(clericSpells).toContain("commune");
    expect(clericSpells).toContain("dispel-evil-and-good");
    expect(clericSpells).toContain("geas");
    expect(clericSpells).toContain("legend-lore");
    expect(clericSpells).toContain("planar-binding");
    expect(clericSpells).toContain("rarys-telepathic-bond");
    expect(clericSpells).toContain("contagion");
    expect(clericSpells).toContain("flame-strike");
    expect(clericSpells).toContain("hallow");
    expect(clericSpells).toContain("insect-plague");
    expect(clericSpells).toContain("blade-barrier");
    expect(clericSpells).toContain("find-the-path");
    expect(clericSpells).toContain("forbiddance");
    expect(clericSpells).toContain("harm");
    expect(clericSpells).toContain("heal");
    expect(clericSpells).toContain("heroes-feast");
    expect(clericSpells).toContain("create-undead");
    expect(clericSpells).toContain("antimagic-field");
    expect(clericSpells).toContain("conjure-celestial");
    expect(clericSpells).toContain("control-weather");
    expect(clericSpells).toContain("divine-word");
    expect(clericSpells).toContain("earthquake");
    expect(clericSpells).toContain("etherealness");
    expect(clericSpells).toContain("fire-storm");
    expect(clericSpells).toContain("holy-aura");
    expect(clericSpells).toContain("planar-ally");
    expect(clericSpells).toContain("plane-shift");
    expect(clericSpells).toContain("regenerate");
    expect(clericSpells).toContain("resurrection");
    expect(clericSpells).toContain("sunbeam");
    expect(clericSpells).toContain("sunburst");
    expect(clericSpells).toContain("symbol");
    expect(clericSpells).toContain("true-seeing");
    expect(clericSpells).toContain("word-of-recall");
    expect(clericSpells).toContain("astral-projection");
    expect(clericSpells).toContain("gate");
    expect(clericSpells).toContain("mass-heal");
    expect(clericSpells).toContain("power-word-heal");
    expect(clericSpells).toContain("true-resurrection");
    expect(clericSpells.length).toBeGreaterThanOrEqual(78);

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
    expect(warlockSpells).toContain("contact-other-plane");
    expect(warlockSpells).toContain("circle-of-death");
    expect(warlockSpells).toContain("create-undead");
    expect(warlockSpells).toContain("dominate-monster");
    expect(warlockSpells).toContain("etherealness");
    expect(warlockSpells).toContain("eyebite");
    expect(warlockSpells).toContain("befuddlement");
    expect(warlockSpells).toContain("finger-of-death");
    expect(warlockSpells).toContain("forcecage");
    expect(warlockSpells).toContain("demiplane");
    expect(warlockSpells).toContain("glibness");
    expect(warlockSpells).toContain("plane-shift");
    expect(warlockSpells).toContain("planar-binding");
    expect(warlockSpells).toContain("power-word-stun");
    expect(warlockSpells).toContain("dream");
    expect(warlockSpells).toContain("mislead");
    expect(warlockSpells).toContain("true-seeing");
    expect(warlockSpells).toContain("astral-projection");
    expect(warlockSpells).toContain("foresight");
    expect(warlockSpells).toContain("gate");
    expect(warlockSpells).toContain("imprisonment");
    expect(warlockSpells).toContain("power-word-kill");
    expect(warlockSpells).toContain("true-polymorph");
    expect(warlockSpells).toContain("weird");
    expect(warlockSpells).not.toContain("guiding-bolt");
    expect(warlockSpells.length).toBeGreaterThanOrEqual(51);

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
    expect(druidSpells).toContain("antilife-shell");
    expect(druidSpells).toContain("animal-shapes");
    expect(druidSpells).toContain("antipathy-sympathy");
    expect(druidSpells).toContain("awaken");
    expect(druidSpells).toContain("befuddlement");
    expect(druidSpells).toContain("control-weather");
    expect(druidSpells).toContain("commune-with-nature");
    expect(druidSpells).toContain("find-the-path");
    expect(druidSpells).toContain("flesh-to-stone");
    expect(druidSpells).toContain("geas");
    expect(druidSpells).toContain("heal");
    expect(druidSpells).toContain("heroes-feast");
    expect(druidSpells).toContain("move-earth");
    expect(druidSpells).toContain("planar-binding");
    expect(druidSpells).toContain("reincarnate");
    expect(druidSpells).toContain("sunbeam");
    expect(druidSpells).toContain("tree-stride");
    expect(druidSpells).toContain("transport-via-plants");
    expect(druidSpells).toContain("conjure-elemental");
    expect(druidSpells).toContain("conjure-fey");
    expect(druidSpells).toContain("contagion");
    expect(druidSpells).toContain("earthquake");
    expect(druidSpells).toContain("fire-storm");
    expect(druidSpells).toContain("incendiary-cloud");
    expect(druidSpells).toContain("insect-plague");
    expect(druidSpells).toContain("mirage-arcane");
    expect(druidSpells).toContain("plane-shift");
    expect(druidSpells).toContain("regenerate");
    expect(druidSpells).toContain("reverse-gravity");
    expect(druidSpells).toContain("sunburst");
    expect(druidSpells).toContain("symbol");
    expect(druidSpells).toContain("tsunami");
    expect(druidSpells).toContain("wall-of-thorns");
    expect(druidSpells).toContain("wind-walk");
    expect(druidSpells).toContain("foresight");
    expect(druidSpells).toContain("shapechange");
    expect(druidSpells).toContain("storm-of-vengeance");
    expect(druidSpells).toContain("true-resurrection");
    expect(druidSpells.length).toBeGreaterThanOrEqual(91);

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
    expect(paladinSpells).toContain("dispel-evil-and-good");
    expect(paladinSpells).toContain("geas");
    expect(paladinSpells).toContain("rarys-telepathic-bond");
    expect(paladinSpells).not.toContain("moonbeam");
    expect(paladinSpells.length).toBeGreaterThanOrEqual(24);

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
    expect(rangerSpells).toContain("commune-with-nature");
    expect(rangerSpells).toContain("tree-stride");
    expect(rangerSpells).not.toContain("magic-missile");
    expect(rangerSpells.length).toBeGreaterThanOrEqual(28);

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
    expect(sorcererSpells).toContain("dominate-monster");
    expect(sorcererSpells).toContain("dominate-person");
    expect(sorcererSpells).toContain("rarys-telepathic-bond");
    expect(sorcererSpells).toContain("animate-objects");
    expect(sorcererSpells).toContain("cloudkill");
    expect(sorcererSpells).toContain("creation");
    expect(sorcererSpells).toContain("delayed-blast-fireball");
    expect(sorcererSpells).toContain("demiplane");
    expect(sorcererSpells).toContain("eyebite");
    expect(sorcererSpells).toContain("etherealness");
    expect(sorcererSpells).toContain("earthquake");
    expect(sorcererSpells).toContain("finger-of-death");
    expect(sorcererSpells).toContain("flesh-to-stone");
    expect(sorcererSpells).toContain("fire-storm");
    expect(sorcererSpells).toContain("incendiary-cloud");
    expect(sorcererSpells).toContain("insect-plague");
    expect(sorcererSpells).toContain("plane-shift");
    expect(sorcererSpells).toContain("power-word-stun");
    expect(sorcererSpells).toContain("prismatic-spray");
    expect(sorcererSpells).toContain("reverse-gravity");
    expect(sorcererSpells).toContain("seeming");
    expect(sorcererSpells).toContain("sunburst");
    expect(sorcererSpells).toContain("telekinesis");
    expect(sorcererSpells).toContain("teleport");
    expect(sorcererSpells).toContain("chain-lightning");
    expect(sorcererSpells).toContain("circle-of-death");
    expect(sorcererSpells).toContain("disintegrate");
    expect(sorcererSpells).toContain("globe-of-invulnerability");
    expect(sorcererSpells).toContain("mass-suggestion");
    expect(sorcererSpells).toContain("move-earth");
    expect(sorcererSpells).toContain("sunbeam");
    expect(sorcererSpells).toContain("true-seeing");
    expect(sorcererSpells).toContain("gate");
    expect(sorcererSpells).toContain("meteor-swarm");
    expect(sorcererSpells).toContain("power-word-kill");
    expect(sorcererSpells).toContain("time-stop");
    expect(sorcererSpells).toContain("wish");
    expect(sorcererSpells.length).toBeGreaterThanOrEqual(80);

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
    expect(wizardSpells).toContain("contact-other-plane");
    expect(wizardSpells).toContain("dominate-person");
    expect(wizardSpells).toContain("geas");
    expect(wizardSpells).toContain("legend-lore");
    expect(wizardSpells).toContain("planar-binding");
    expect(wizardSpells).toContain("rarys-telepathic-bond");
    expect(wizardSpells).toContain("animate-objects");
    expect(wizardSpells).toContain("antimagic-field");
    expect(wizardSpells).toContain("antipathy-sympathy");
    expect(wizardSpells).toContain("befuddlement");
    expect(wizardSpells).toContain("cloudkill");
    expect(wizardSpells).toContain("chain-lightning");
    expect(wizardSpells).toContain("circle-of-death");
    expect(wizardSpells).toContain("clone");
    expect(wizardSpells).toContain("conjure-elemental");
    expect(wizardSpells).toContain("control-weather");
    expect(wizardSpells).toContain("creation");
    expect(wizardSpells).toContain("contingency");
    expect(wizardSpells).toContain("create-undead");
    expect(wizardSpells).toContain("delayed-blast-fireball");
    expect(wizardSpells).toContain("demiplane");
    expect(wizardSpells).toContain("disintegrate");
    expect(wizardSpells).toContain("dominate-monster");
    expect(wizardSpells).toContain("dream");
    expect(wizardSpells).toContain("etherealness");
    expect(wizardSpells).toContain("eyebite");
    expect(wizardSpells).toContain("finger-of-death");
    expect(wizardSpells).toContain("flesh-to-stone");
    expect(wizardSpells).toContain("forcecage");
    expect(wizardSpells).toContain("globe-of-invulnerability");
    expect(wizardSpells).toContain("guards-and-wards");
    expect(wizardSpells).toContain("incendiary-cloud");
    expect(wizardSpells).toContain("magic-jar");
    expect(wizardSpells).toContain("mass-suggestion");
    expect(wizardSpells).toContain("maze");
    expect(wizardSpells).toContain("mind-blank");
    expect(wizardSpells).toContain("mislead");
    expect(wizardSpells).toContain("modify-memory");
    expect(wizardSpells).toContain("move-earth");
    expect(wizardSpells).toContain("passwall");
    expect(wizardSpells).toContain("plane-shift");
    expect(wizardSpells).toContain("programmed-illusion");
    expect(wizardSpells).toContain("mirage-arcane");
    expect(wizardSpells).toContain("mordenkainens-magnificent-mansion");
    expect(wizardSpells).toContain("mordenkainens-sword");
    expect(wizardSpells).toContain("power-word-stun");
    expect(wizardSpells).toContain("prismatic-spray");
    expect(wizardSpells).toContain("project-image");
    expect(wizardSpells).toContain("reverse-gravity");
    expect(wizardSpells).toContain("sequester");
    expect(wizardSpells).toContain("seeming");
    expect(wizardSpells).toContain("simulacrum");
    expect(wizardSpells).toContain("summon-dragon");
    expect(wizardSpells).toContain("sunbeam");
    expect(wizardSpells).toContain("sunburst");
    expect(wizardSpells).toContain("symbol");
    expect(wizardSpells).toContain("teleport");
    expect(wizardSpells).toContain("telekinesis");
    expect(wizardSpells).toContain("true-seeing");
    expect(wizardSpells).toContain("wall-of-ice");
    expect(wizardSpells).toContain("astral-projection");
    expect(wizardSpells).toContain("foresight");
    expect(wizardSpells).toContain("gate");
    expect(wizardSpells).toContain("imprisonment");
    expect(wizardSpells).toContain("meteor-swarm");
    expect(wizardSpells).toContain("power-word-kill");
    expect(wizardSpells).toContain("prismatic-wall");
    expect(wizardSpells).toContain("shapechange");
    expect(wizardSpells).toContain("time-stop");
    expect(wizardSpells).toContain("true-polymorph");
    expect(wizardSpells).toContain("weird");
    expect(wizardSpells).toContain("wish");
    expect(wizardSpells.length).toBeGreaterThanOrEqual(132);
  });
});

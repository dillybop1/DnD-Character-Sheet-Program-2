import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import generatedBuild from "../shared/data/generated/contentPackBuild.generated.json";

const REPO_ROOT = process.cwd();
const SCRIPT_PATH = join(REPO_ROOT, "scripts", "build-content-packs.mjs");

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function runGenerator(inputDir: string, outputFile: string) {
  execFileSync(process.execPath, [SCRIPT_PATH, "--input-dir", inputDir, "--output-file", outputFile], {
    cwd: REPO_ROOT,
    stdio: "pipe",
  });

  return JSON.parse(readFileSync(outputFile, "utf8"));
}

function makeTempDir(prefix: string) {
  return mkdtempSync(join(tmpdir(), prefix));
}

function writeBaseManifest(root: string, packId = "srd-5.2.1") {
  writeJson(join(root, packId, "manifest.json"), {
    id: packId,
    shortCode: "SRD 5.2.1",
    name: "System Reference Document 5.2.1",
    ruleset: "2024",
    category: "core",
    licenseMode: "open",
    source: "SRD / Free Rules",
    license: "CC-BY-4.0 / Open Content",
    attribution: "Wizards of the Coast open rules content",
    version: "test-v1",
    summary: "Temporary test pack.",
  });

  writeJson(join(root, packId, "textAudit.json"), {
    fieldDefaults: {
      spell: {
        summary: {
          mode: "non-verbatim",
          source: "Test audit summary",
          notes: "Temporary spell summary audit metadata.",
        },
        effect: {
          mode: "non-verbatim",
          source: "Test audit effect",
          notes: "Temporary spell effect audit metadata.",
        },
      },
      creature: {
        summary: {
          mode: "non-verbatim",
          source: "Test audit summary",
          notes: "Temporary creature summary audit metadata.",
        },
        features: {
          mode: "non-verbatim",
          source: "Test audit features",
          notes: "Temporary creature feature audit metadata.",
        },
        actions: {
          mode: "non-verbatim",
          source: "Test audit actions",
          notes: "Temporary creature action audit metadata.",
        },
      },
    },
    descriptions: {
      spells: {},
      creatures: {},
    },
  });
}

describe("content pack build script", () => {
  it("reproduces the committed generated build and preserves description joins", () => {
    const tempDir = makeTempDir("content-pack-build-");
    const outputFile = join(tempDir, "generated.json");
    const built = runGenerator(join(REPO_ROOT, "content", "packs"), outputFile);

    expect(built).toEqual(generatedBuild);
    const fireBolt = built.entries.find((entry: { slug: string }) => entry.slug === "fire-bolt");
    const arcaneEye = built.entries.find((entry: { slug: string }) => entry.slug === "arcane-eye");
    const antilifeShell = built.entries.find((entry: { slug: string }) => entry.slug === "antilife-shell");
    const banishment = built.entries.find((entry: { slug: string }) => entry.slug === "banishment");
    const animateObjects = built.entries.find((entry: { slug: string }) => entry.slug === "animate-objects");
    const animalShapes = built.entries.find((entry: { slug: string }) => entry.slug === "animal-shapes");
    const antimagicField = built.entries.find((entry: { slug: string }) => entry.slug === "antimagic-field");
    const antipathySympathy = built.entries.find((entry: { slug: string }) => entry.slug === "antipathy-sympathy");
    const awaken = built.entries.find((entry: { slug: string }) => entry.slug === "awaken");
    const befuddlement = built.entries.find((entry: { slug: string }) => entry.slug === "befuddlement");
    const bigbysHand = built.entries.find((entry: { slug: string }) => entry.slug === "bigbys-hand");
    const bladeBarrier = built.entries.find((entry: { slug: string }) => entry.slug === "blade-barrier");
    const blight = built.entries.find((entry: { slug: string }) => entry.slug === "blight");
    const chainLightning = built.entries.find((entry: { slug: string }) => entry.slug === "chain-lightning");
    const chillTouch = built.entries.find((entry: { slug: string }) => entry.slug === "chill-touch");
    const charmMonster = built.entries.find((entry: { slug: string }) => entry.slug === "charm-monster");
    const circleOfDeath = built.entries.find((entry: { slug: string }) => entry.slug === "circle-of-death");
    const cloudkill = built.entries.find((entry: { slug: string }) => entry.slug === "cloudkill");
    const clone = built.entries.find((entry: { slug: string }) => entry.slug === "clone");
    const commune = built.entries.find((entry: { slug: string }) => entry.slug === "commune");
    const communeWithNature = built.entries.find((entry: { slug: string }) => entry.slug === "commune-with-nature");
    const conjureElemental = built.entries.find((entry: { slug: string }) => entry.slug === "conjure-elemental");
    const conjureCelestial = built.entries.find((entry: { slug: string }) => entry.slug === "conjure-celestial");
    const conjureFey = built.entries.find((entry: { slug: string }) => entry.slug === "conjure-fey");
    const contagion = built.entries.find((entry: { slug: string }) => entry.slug === "contagion");
    const contingency = built.entries.find((entry: { slug: string }) => entry.slug === "contingency");
    const contactOtherPlane = built.entries.find((entry: { slug: string }) => entry.slug === "contact-other-plane");
    const controlWeather = built.entries.find((entry: { slug: string }) => entry.slug === "control-weather");
    const coneOfCold = built.entries.find((entry: { slug: string }) => entry.slug === "cone-of-cold");
    const creation = built.entries.find((entry: { slug: string }) => entry.slug === "creation");
    const delayedBlastFireball = built.entries.find((entry: { slug: string }) => entry.slug === "delayed-blast-fireball");
    const demiplane = built.entries.find((entry: { slug: string }) => entry.slug === "demiplane");
    const disintegrate = built.entries.find((entry: { slug: string }) => entry.slug === "disintegrate");
    const dispelEvilAndGood = built.entries.find((entry: { slug: string }) => entry.slug === "dispel-evil-and-good");
    const divineWord = built.entries.find((entry: { slug: string }) => entry.slug === "divine-word");
    const divination = built.entries.find((entry: { slug: string }) => entry.slug === "divination");
    const dominateMonster = built.entries.find((entry: { slug: string }) => entry.slug === "dominate-monster");
    const dominatePerson = built.entries.find((entry: { slug: string }) => entry.slug === "dominate-person");
    const dream = built.entries.find((entry: { slug: string }) => entry.slug === "dream");
    const earthquake = built.entries.find((entry: { slug: string }) => entry.slug === "earthquake");
    const eyebite = built.entries.find((entry: { slug: string }) => entry.slug === "eyebite");
    const etherealness = built.entries.find((entry: { slug: string }) => entry.slug === "etherealness");
    const evardsBlackTentacles = built.entries.find((entry: { slug: string }) => entry.slug === "evards-black-tentacles");
    const fabricate = built.entries.find((entry: { slug: string }) => entry.slug === "fabricate");
    const findThePath = built.entries.find((entry: { slug: string }) => entry.slug === "find-the-path");
    const fingerOfDeath = built.entries.find((entry: { slug: string }) => entry.slug === "finger-of-death");
    const fireStorm = built.entries.find((entry: { slug: string }) => entry.slug === "fire-storm");
    const fleshToStone = built.entries.find((entry: { slug: string }) => entry.slug === "flesh-to-stone");
    const flameStrike = built.entries.find((entry: { slug: string }) => entry.slug === "flame-strike");
    const forbiddance = built.entries.find((entry: { slug: string }) => entry.slug === "forbiddance");
    const forcecage = built.entries.find((entry: { slug: string }) => entry.slug === "forcecage");
    const geas = built.entries.find((entry: { slug: string }) => entry.slug === "geas");
    const glibness = built.entries.find((entry: { slug: string }) => entry.slug === "glibness");
    const globeOfInvulnerability = built.entries.find((entry: { slug: string }) => entry.slug === "globe-of-invulnerability");
    const greaterRestoration = built.entries.find((entry: { slug: string }) => entry.slug === "greater-restoration");
    const guardsAndWards = built.entries.find((entry: { slug: string }) => entry.slug === "guards-and-wards");
    const hallow = built.entries.find((entry: { slug: string }) => entry.slug === "hallow");
    const harm = built.entries.find((entry: { slug: string }) => entry.slug === "harm");
    const heal = built.entries.find((entry: { slug: string }) => entry.slug === "heal");
    const heroesFeast = built.entries.find((entry: { slug: string }) => entry.slug === "heroes-feast");
    const holyAura = built.entries.find((entry: { slug: string }) => entry.slug === "holy-aura");
    const incendiaryCloud = built.entries.find((entry: { slug: string }) => entry.slug === "incendiary-cloud");
    const insectPlague = built.entries.find((entry: { slug: string }) => entry.slug === "insect-plague");
    const legendLore = built.entries.find((entry: { slug: string }) => entry.slug === "legend-lore");
    const leomundsSecretChest = built.entries.find((entry: { slug: string }) => entry.slug === "leomunds-secret-chest");
    const magicJar = built.entries.find((entry: { slug: string }) => entry.slug === "magic-jar");
    const massSuggestion = built.entries.find((entry: { slug: string }) => entry.slug === "mass-suggestion");
    const maze = built.entries.find((entry: { slug: string }) => entry.slug === "maze");
    const mirageArcane = built.entries.find((entry: { slug: string }) => entry.slug === "mirage-arcane");
    const mindBlank = built.entries.find((entry: { slug: string }) => entry.slug === "mind-blank");
    const mordenkainensMagnificentMansion = built.entries.find(
      (entry: { slug: string }) => entry.slug === "mordenkainens-magnificent-mansion",
    );
    const mordenkainensSword = built.entries.find((entry: { slug: string }) => entry.slug === "mordenkainens-sword");
    const mordenkainensPrivateSanctum = built.entries.find((entry: { slug: string }) => entry.slug === "mordenkainens-private-sanctum");
    const mislead = built.entries.find((entry: { slug: string }) => entry.slug === "mislead");
    const modifyMemory = built.entries.find((entry: { slug: string }) => entry.slug === "modify-memory");
    const moveEarth = built.entries.find((entry: { slug: string }) => entry.slug === "move-earth");
    const passwall = built.entries.find((entry: { slug: string }) => entry.slug === "passwall");
    const phantasmalKiller = built.entries.find((entry: { slug: string }) => entry.slug === "phantasmal-killer");
    const planarAlly = built.entries.find((entry: { slug: string }) => entry.slug === "planar-ally");
    const planarBinding = built.entries.find((entry: { slug: string }) => entry.slug === "planar-binding");
    const planeShift = built.entries.find((entry: { slug: string }) => entry.slug === "plane-shift");
    const prismaticSpray = built.entries.find((entry: { slug: string }) => entry.slug === "prismatic-spray");
    const programmedIllusion = built.entries.find((entry: { slug: string }) => entry.slug === "programmed-illusion");
    const projectImage = built.entries.find((entry: { slug: string }) => entry.slug === "project-image");
    const rarysTelepathicBond = built.entries.find((entry: { slug: string }) => entry.slug === "rarys-telepathic-bond");
    const regenerate = built.entries.find((entry: { slug: string }) => entry.slug === "regenerate");
    const reincarnate = built.entries.find((entry: { slug: string }) => entry.slug === "reincarnate");
    const resurrection = built.entries.find((entry: { slug: string }) => entry.slug === "resurrection");
    const reverseGravity = built.entries.find((entry: { slug: string }) => entry.slug === "reverse-gravity");
    const scrying = built.entries.find((entry: { slug: string }) => entry.slug === "scrying");
    const seeming = built.entries.find((entry: { slug: string }) => entry.slug === "seeming");
    const sequester = built.entries.find((entry: { slug: string }) => entry.slug === "sequester");
    const simulacrum = built.entries.find((entry: { slug: string }) => entry.slug === "simulacrum");
    const sleep = built.entries.find((entry: { slug: string }) => entry.slug === "sleep");
    const invisibility = built.entries.find((entry: { slug: string }) => entry.slug === "invisibility");
    const sending = built.entries.find((entry: { slug: string }) => entry.slug === "sending");
    const summonDragon = built.entries.find((entry: { slug: string }) => entry.slug === "summon-dragon");
    const sunbeam = built.entries.find((entry: { slug: string }) => entry.slug === "sunbeam");
    const sunburst = built.entries.find((entry: { slug: string }) => entry.slug === "sunburst");
    const symbol = built.entries.find((entry: { slug: string }) => entry.slug === "symbol");
    const teleport = built.entries.find((entry: { slug: string }) => entry.slug === "teleport");
    const teleportationCircle = built.entries.find((entry: { slug: string }) => entry.slug === "teleportation-circle");
    const telekinesis = built.entries.find((entry: { slug: string }) => entry.slug === "telekinesis");
    const treeStride = built.entries.find((entry: { slug: string }) => entry.slug === "tree-stride");
    const trueSeeing = built.entries.find((entry: { slug: string }) => entry.slug === "true-seeing");
    const transportViaPlants = built.entries.find((entry: { slug: string }) => entry.slug === "transport-via-plants");
    const tsunami = built.entries.find((entry: { slug: string }) => entry.slug === "tsunami");
    const astralProjection = built.entries.find((entry: { slug: string }) => entry.slug === "astral-projection");
    const foresight = built.entries.find((entry: { slug: string }) => entry.slug === "foresight");
    const gate = built.entries.find((entry: { slug: string }) => entry.slug === "gate");
    const imprisonment = built.entries.find((entry: { slug: string }) => entry.slug === "imprisonment");
    const massHeal = built.entries.find((entry: { slug: string }) => entry.slug === "mass-heal");
    const meteorSwarm = built.entries.find((entry: { slug: string }) => entry.slug === "meteor-swarm");
    const powerWordHeal = built.entries.find((entry: { slug: string }) => entry.slug === "power-word-heal");
    const powerWordKill = built.entries.find((entry: { slug: string }) => entry.slug === "power-word-kill");
    const prismaticWall = built.entries.find((entry: { slug: string }) => entry.slug === "prismatic-wall");
    const shapechange = built.entries.find((entry: { slug: string }) => entry.slug === "shapechange");
    const stormOfVengeance = built.entries.find((entry: { slug: string }) => entry.slug === "storm-of-vengeance");
    const timeStop = built.entries.find((entry: { slug: string }) => entry.slug === "time-stop");
    const truePolymorph = built.entries.find((entry: { slug: string }) => entry.slug === "true-polymorph");
    const trueResurrection = built.entries.find((entry: { slug: string }) => entry.slug === "true-resurrection");
    const weird = built.entries.find((entry: { slug: string }) => entry.slug === "weird");
    const wish = built.entries.find((entry: { slug: string }) => entry.slug === "wish");
    const vitriolicSphere = built.entries.find((entry: { slug: string }) => entry.slug === "vitriolic-sphere");
    const wallOfForce = built.entries.find((entry: { slug: string }) => entry.slug === "wall-of-force");
    const wallOfFire = built.entries.find((entry: { slug: string }) => entry.slug === "wall-of-fire");
    const wallOfIce = built.entries.find((entry: { slug: string }) => entry.slug === "wall-of-ice");
    const wallOfThorns = built.entries.find((entry: { slug: string }) => entry.slug === "wall-of-thorns");
    const windWalk = built.entries.find((entry: { slug: string }) => entry.slug === "wind-walk");
    const wordOfRecall = built.entries.find((entry: { slug: string }) => entry.slug === "word-of-recall");
    const powerWordStun = built.entries.find((entry: { slug: string }) => entry.slug === "power-word-stun");
    const ghoul = built.entries.find((entry: { slug: string }) => entry.slug === "ghoul");

    expect(fireBolt.payload.description).toContain("You hurl a mote of fire");
    expect(arcaneEye.payload.description).toContain("Invisible, invulnerable eye");
    expect(antilifeShell.payload.description).toContain("10-foot Emanation");
    expect(banishment.payload.description).toContain("harmless demiplane");
    expect(banishment.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(animateObjects.payload.description).toContain("Animated Object stat block");
    expect(animateObjects.payload.description).toContain("Using a Higher-Level Spell Slot.");
    expect(animalShapes.payload.description).toContain("Challenge Rating of 4 or lower");
    expect(antimagicField.payload.description).toContain("10-foot Emanation");
    expect(antipathySympathy.payload.description).toContain("comes within 120 feet of the target");
    expect(awaken.payload.description).toContain("The target gains an Intelligence of 10");
    expect(befuddlement.payload.description).toContain("10d12 Psychic damage");
    expect(bigbysHand.payload.description).toContain("Large hand of shimmering magical energy");
    expect(bigbysHand.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(bladeBarrier.payload.description).toContain("wall of whirling blades");
    expect(blight.payload.description).toContain("8d8 Necrotic damage");
    expect(blight.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(chainLightning.payload.description).toContain("Three bolts then leap");
    expect(chainLightning.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(chillTouch.payload.description).toContain("Channeling the chill of the grave");
    expect(charmMonster.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(circleOfDeath.payload.description).toContain("60-foot-radius Sphere");
    expect(circleOfDeath.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(cloudkill.payload.description).toContain("20-foot-radius Sphere");
    expect(cloudkill.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(clone.payload.description).toContain("finishes growing after 120 days");
    expect(commune.payload.description).toContain("ask up to three questions");
    expect(communeWithNature.payload.description).toContain("Choose three of the following facts");
    expect(conjureElemental.payload.description).toContain("Restrained condition");
    expect(conjureElemental.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(conjureCelestial.payload.description).toContain("pillar of light");
    expect(conjureCelestial.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(conjureFey.payload.description).toContain("Medium spirit from the Feywild");
    expect(conjureFey.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(contagion.payload.description).toContain("11d8 Necrotic damage");
    expect(contingency.payload.description).toContain("contingent spell");
    expect(contactOtherPlane.payload.description).toContain("6d6 Psychic damage");
    expect(coneOfCold.payload.description).toContain("8d8 Cold damage");
    expect(coneOfCold.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(creation.payload.description).toContain("5-foot Cube");
    expect(creation.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(delayedBlastFireball.payload.description).toContain("glowing bead");
    expect(delayedBlastFireball.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(demiplane.payload.description).toContain("empty room 30 feet in each dimension");
    expect(disintegrate.payload.description).toContain("gray dust");
    expect(disintegrate.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(dispelEvilAndGood.payload.description).toContain("Break Enchantment.");
    expect(divineWord.payload.description).toContain("Divine Word Effects");
    expect(divination.payload.description).toContain("You ask one question");
    expect(dominateMonster.payload.description).toContain("telepathic link");
    expect(dominateMonster.payload.higherLevel).toContain("level 9 spell slot");
    expect(dominatePerson.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(dream.payload.description).toContain("message of no more than ten words");
    expect(earthquake.payload.description).toContain("100-foot-radius circle");
    expect(eyebite.payload.description).toContain("your eyes become an inky void");
    expect(etherealness.payload.description).toContain("Border Ethereal");
    expect(etherealness.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(evardsBlackTentacles.payload.description).toContain("Restrained condition");
    expect(fabricate.payload.description).toContain("raw materials into products");
    expect(findThePath.payload.description).toContain("most direct physical route");
    expect(fingerOfDeath.payload.description).toContain("7d8 + 30 Necrotic damage");
    expect(fireStorm.payload.description).toContain("up to ten 10-foot Cubes");
    expect(fleshToStone.payload.description).toContain("Petrified condition");
    expect(flameStrike.payload.description).toContain("5d6 Fire damage and 5d6 Radiant damage");
    expect(flameStrike.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(forbiddance.payload.description).toContain("40,000 square feet");
    expect(forcecage.payload.description).toContain("Invisible, Cube-shaped prison");
    expect(geas.payload.description).toContain("5d10 Psychic damage");
    expect(geas.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(glibness.payload.description).toContain("replace the number you roll with a 15");
    expect(globeOfInvulnerability.payload.description).toContain("10-foot Emanation");
    expect(globeOfInvulnerability.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(greaterRestoration.payload.description).toContain("1 Exhaustion level");
    expect(guardsAndWards.payload.description).toContain("2,500 square feet");
    expect(guardsAndWards.payload.description).toContain("Magic Mouth in two locations");
    expect(hallow.payload.description).toContain("Hallowed Ward.");
    expect(harm.payload.description).toContain("14d6 Necrotic damage");
    expect(heal.payload.description).toContain("restoring 70 Hit Points");
    expect(heal.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(heroesFeast.payload.description).toContain("Up to twelve creatures can partake");
    expect(holyAura.payload.description).toContain("Advantage on all saving throws");
    expect(incendiaryCloud.payload.description).toContain("20-foot-radius Sphere");
    expect(insectPlague.payload.description).toContain("Lightly Obscured and Difficult Terrain");
    expect(insectPlague.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(legendLore.payload.description).toContain("famous person, place, or object");
    expect(leomundsSecretChest.payload.description).toContain("Ethereal Plane");
    expect(magicJar.payload.description).toContain("possess a Humanoid");
    expect(massSuggestion.payload.description).toContain("no more than 25 words");
    expect(massSuggestion.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(maze.payload.description).toContain("labyrinthine demiplane");
    expect(mirageArcane.payload.description).toContain("1 mile square");
    expect(mindBlank.payload.description).toContain("Immunity to Psychic damage");
    expect(mordenkainensMagnificentMansion.payload.description).toContain("extradimensional dwelling");
    expect(mordenkainensSword.payload.description).toContain("spectral sword");
    expect(mordenkainensPrivateSanctum.payload.description).toContain("Nothing can teleport into or out of the warded area.");
    expect(mordenkainensPrivateSanctum.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(mislead.payload.description).toContain("illusory double");
    expect(modifyMemory.payload.description).toContain("reshape another creature");
    expect(modifyMemory.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(moveEarth.payload.description).toContain("40 feet on a side");
    expect(passwall.payload.description).toContain("A passage appears");
    expect(phantasmalKiller.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(planarAlly.payload.description).toContain("Celestial, an Elemental, or a Fiend");
    expect(planarBinding.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(planeShift.payload.description).toContain("different plane of existence");
    expect(prismaticSpray.payload.description).toContain("Prismatic Rays");
    expect(programmedIllusion.payload.description).toContain("scripted performance can last up to 5 minutes");
    expect(projectImage.payload.description).toContain("illusory copy of yourself");
    expect(rarysTelepathicBond.payload.description).toContain("up to eight willing creatures");
    expect(regenerate.payload.description).toContain("severed body parts regrow after 2 minutes");
    expect(reincarnate.payload.description).toContain("new body");
    expect(resurrection.payload.description).toContain("dead for no more than a century");
    expect(reverseGravity.payload.description).toContain("50-foot-radius, 100-foot high Cylinder");
    expect(scrying.payload.description).toContain("Secondhand (heard of the target) +5");
    expect(seeming.payload.description).toContain("illusory appearance");
    expect(sequester.payload.description).toContain("suspended animation");
    expect(simulacrum.payload.description).toContain("Friendly to you");
    expect(sleep.payload.description).toContain("Each creature of your choice in a 5-foot-radius Sphere");
    expect(sleep.payload.higherLevel).toBeUndefined();
    expect(invisibility.payload.description).toContain("has the Invisible condition");
    expect(sending.payload.description).toContain("25 words or fewer");
    expect(summonDragon.payload.description).toContain("Draconic Spirit stat block");
    expect(summonDragon.payload.description).toContain("Using a Higher-Level Spell Slot.");
    expect(sunbeam.payload.description).toContain("Magic action");
    expect(sunburst.payload.description).toContain("12d6 Radiant damage");
    expect(symbol.payload.description).toContain("Death.");
    expect(symbol.payload.description).toContain("Stunning.");
    expect(teleport.payload.description).toContain("Teleportation Outcome table");
    expect(teleport.payload.description).toContain("Familiarity | Mishap | Similar Area | Off Target | On Target");
    expect(teleportationCircle.payload.description).toContain("permanent teleportation circle");
    expect(telekinesis.payload.description).toContain("move or manipulate creatures or objects by thought");
    expect(treeStride.payload.description).toContain("inside another tree");
    expect(trueSeeing.payload.description).toContain("Truesight");
    expect(transportViaPlants.payload.description).toContain("magical link");
    expect(tsunami.payload.description).toContain("300 feet long, 300 feet high, and 50 feet thick");
    expect(astralProjection.payload.description).toContain("state of suspended animation");
    expect(foresight.payload.description).toContain("Advantage on D20 Tests");
    expect(gate.payload.description).toContain("portal linking an unoccupied space");
    expect(imprisonment.payload.description).toContain("Hedged Prison.");
    expect(massHeal.payload.description).toContain("restore up to 700 Hit Points");
    expect(meteorSwarm.payload.description).toContain("20d6 Fire damage and 20d6 Bludgeoning damage");
    expect(powerWordHeal.payload.description).toContain("regains all its Hit Points");
    expect(powerWordKill.payload.description).toContain("100 Hit Points or fewer");
    expect(prismaticWall.payload.description).toContain("Prismatic Layers");
    expect(shapechange.payload.description).toContain("Challenge Rating no higher than your level or Challenge Rating");
    expect(stormOfVengeance.payload.description).toContain("Turn 2. Acidic rain falls.");
    expect(timeStop.payload.description).toContain("1d4 + 1 turns in a row");
    expect(truePolymorph.payload.description).toContain("maintain Concentration on this spell for the full duration");
    expect(trueResurrection.payload.description).toContain("dead for no longer than 200 years");
    expect(weird.payload.description).toContain("10d10 Psychic damage");
    expect(wish.payload.description).toContain("duplicate any other spell of level 8 or lower");
    expect(vitriolicSphere.payload.description).toContain("10d4 Acid damage");
    expect(vitriolicSphere.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(wallOfForce.payload.description).toContain("Nothing can physically pass through the wall.");
    expect(wallOfFire.payload.description).toContain("You create a wall of fire");
    expect(wallOfFire.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(wallOfIce.payload.description).toContain("hemispherical dome");
    expect(wallOfIce.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(wallOfThorns.payload.description).toContain("needle-sharp thorns");
    expect(wallOfThorns.payload.higherLevel).toContain("Using a Higher-Level Spell Slot.");
    expect(windWalk.payload.description).toContain("Fly Speed of 300 feet");
    expect(wordOfRecall.payload.description).toContain("previously designated sanctuary");
    expect(controlWeather.payload.description).toContain("5 miles of you");
    expect(controlWeather.payload.description).toContain("Torrential rain, driving hail, or blizzard");
    expect(powerWordStun.payload.description).toContain("150 Hit Points or fewer");
    expect(ghoul.payload.description).toContain("Multiattack. The ghoul makes two Bite attacks.");
  }, 20_000);

  it("rejects duplicate slugs across packs", () => {
    const tempDir = makeTempDir("content-pack-duplicates-");
    const outputFile = join(tempDir, "generated.json");
    writeBaseManifest(tempDir, "pack-a");
    writeBaseManifest(tempDir, "pack-b");
    writeJson(join(tempDir, "pack-a", "spells.json"), [
      {
        slug: "duplicate-spell",
        name: "Duplicate Spell A",
        summary: "First copy.",
        tags: ["test"],
        level: 0,
        school: "Evocation",
        classes: ["Wizard"],
        castingTime: "Action",
        range: "30 feet",
        duration: "Instantaneous",
      },
    ]);
    writeJson(join(tempDir, "pack-b", "spells.json"), [
      {
        slug: "duplicate-spell",
        name: "Duplicate Spell B",
        summary: "Second copy.",
        tags: ["test"],
        level: 0,
        school: "Evocation",
        classes: ["Wizard"],
        castingTime: "Action",
        range: "30 feet",
        duration: "Instantaneous",
      },
    ]);

    expect(() => runGenerator(tempDir, outputFile)).toThrow(/Duplicate compendium slug "duplicate-spell"/);
  });

  it("rejects rows that are missing required spell fields", () => {
    const tempDir = makeTempDir("content-pack-missing-field-");
    const outputFile = join(tempDir, "generated.json");
    writeBaseManifest(tempDir);
    writeJson(join(tempDir, "srd-5.2.1", "spells.json"), [
      {
        slug: "broken-spell",
        name: "Broken Spell",
        summary: "Missing casting time.",
        tags: ["test"],
        level: 0,
        school: "Evocation",
        classes: ["Wizard"],
        range: "30 feet",
        duration: "Instantaneous",
      },
    ]);

    expect(() => runGenerator(tempDir, outputFile)).toThrow(/castingTime/i);
  });

  it("rejects missing description files when a row references one", () => {
    const tempDir = makeTempDir("content-pack-missing-description-");
    const outputFile = join(tempDir, "generated.json");
    writeBaseManifest(tempDir);
    writeJson(join(tempDir, "srd-5.2.1", "textAudit.json"), {
      fieldDefaults: {
        spell: {
          summary: {
            mode: "non-verbatim",
            source: "Test audit summary",
            notes: "Temporary spell summary audit metadata.",
          },
          effect: {
            mode: "non-verbatim",
            source: "Test audit effect",
            notes: "Temporary spell effect audit metadata.",
          },
        },
        creature: {
          summary: {
            mode: "non-verbatim",
            source: "Test audit summary",
            notes: "Temporary creature summary audit metadata.",
          },
          features: {
            mode: "non-verbatim",
            source: "Test audit features",
            notes: "Temporary creature feature audit metadata.",
          },
          actions: {
            mode: "non-verbatim",
            source: "Test audit actions",
            notes: "Temporary creature action audit metadata.",
          },
        },
      },
      descriptions: {
        spells: {
          "missing-text": {
            mode: "non-verbatim",
            source: "Test audit description",
            notes: "Temporary spell description audit metadata.",
          },
        },
        creatures: {},
      },
    });
    writeJson(join(tempDir, "srd-5.2.1", "spells.json"), [
      {
        slug: "described-spell",
        name: "Described Spell",
        summary: "Points to a missing file.",
        tags: ["test"],
        level: 1,
        school: "Divination",
        classes: ["Wizard"],
        castingTime: "Action",
        range: "Self",
        duration: "1 minute",
        descriptionKey: "missing-text",
      },
    ]);

    expect(() => runGenerator(tempDir, outputFile)).toThrow(/Missing description file for key "missing-text"/);
  });

  it("rejects missing text audit entries when a row references a description file", () => {
    const tempDir = makeTempDir("content-pack-missing-text-audit-");
    const outputFile = join(tempDir, "generated.json");
    writeBaseManifest(tempDir);
    mkdirSync(join(tempDir, "srd-5.2.1", "descriptions", "spells"), { recursive: true });
    writeJson(join(tempDir, "srd-5.2.1", "spells.json"), [
      {
        slug: "audited-spell",
        name: "Audited Spell",
        summary: "Has a description file but no audit entry.",
        tags: ["test"],
        level: 1,
        school: "Divination",
        classes: ["Wizard"],
        castingTime: "Action",
        range: "Self",
        duration: "1 minute",
        descriptionKey: "audited-spell",
      },
    ]);
    writeFileSync(join(tempDir, "srd-5.2.1", "descriptions", "spells", "audited-spell.md"), "Temporary spell text.", "utf8");

    expect(() => runGenerator(tempDir, outputFile)).toThrow(/Missing text audit entry for description key "audited-spell"/);
  });
});

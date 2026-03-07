import { readFile, writeFile } from "node:fs/promises";
import { app, dialog, ipcMain } from "electron";
import type { BrowserWindow } from "electron";
import type { BuilderInput, CharacterRecord, HomebrewEntry, SearchInput } from "../../shared/types";
import { parseCharacterImport } from "../../shared/validation";
import type { DatabaseContext } from "../db/client";
import {
  createCharacter,
  deleteCharacter,
  deleteHomebrew,
  getCharacter,
  getCompendiumEntry,
  listCharacters,
  listHomebrew,
  saveCharacter,
  saveHomebrew,
  searchCompendium,
} from "../db/storage";

const CHANNELS = [
  "app:get-info",
  "characters:list",
  "characters:get",
  "characters:save",
  "characters:create",
  "characters:delete",
  "characters:import-json",
  "characters:export-json",
  "characters:export-pdf",
  "builder:create-from-wizard",
  "compendium:search",
  "compendium:get",
  "homebrew:list",
  "homebrew:save",
  "homebrew:delete",
] as const;

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function exportCharacterJson(context: DatabaseContext, id: string) {
  const record = await getCharacter(context, id);

  if (!record) {
    return null;
  }

  const result = await dialog.showSaveDialog({
    defaultPath: `${sanitizeFilename(record.name)}.dndsheet.json`,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  await writeFile(
    result.filePath,
    JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        character: record,
      },
      null,
      2,
    ),
    "utf8",
  );

  return result.filePath;
}

async function importCharacterJson(context: DatabaseContext) {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "D&D Character Sheet JSON", extensions: ["json", "dndsheet.json"] }, { name: "JSON", extensions: ["json"] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const raw = await readFile(result.filePaths[0], "utf8");
  const imported = parseCharacterImport(JSON.parse(raw));
  return saveCharacter(context, imported);
}

async function exportCharacterPdf(context: DatabaseContext, getWindow: () => BrowserWindow | null, id: string) {
  const window = getWindow();
  const record = await getCharacter(context, id);

  if (!window || !record) {
    return null;
  }

  const result = await dialog.showSaveDialog({
    defaultPath: `${sanitizeFilename(record.name)}.pdf`,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  const pdf = await window.webContents.printToPDF({
    printBackground: true,
    landscape: false,
  });

  await writeFile(result.filePath, pdf);
  return result.filePath;
}

export function registerIpcHandlers(context: DatabaseContext, getWindow: () => BrowserWindow | null) {
  for (const channel of CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle("app:get-info", async () => ({
    appVersion: app.getVersion(),
    databasePath: context.databasePath,
  }));

  ipcMain.handle("characters:list", async () => listCharacters(context));
  ipcMain.handle("characters:get", async (_event, id: string) => getCharacter(context, id));
  ipcMain.handle("characters:save", async (_event, record: CharacterRecord) => saveCharacter(context, record));
  ipcMain.handle("characters:create", async (_event, input: BuilderInput) => createCharacter(context, input));
  ipcMain.handle("characters:delete", async (_event, id: string) => deleteCharacter(context, id));
  ipcMain.handle("characters:import-json", async () => importCharacterJson(context));
  ipcMain.handle("characters:export-json", async (_event, id: string) => exportCharacterJson(context, id));
  ipcMain.handle("characters:export-pdf", async (_event, id: string) => exportCharacterPdf(context, getWindow, id));
  ipcMain.handle("builder:create-from-wizard", async (_event, input: BuilderInput) => createCharacter(context, input));
  ipcMain.handle("compendium:search", async (_event, input: SearchInput) => searchCompendium(context, input));
  ipcMain.handle("compendium:get", async (_event, slug: string) => getCompendiumEntry(context, slug));
  ipcMain.handle("homebrew:list", async () => listHomebrew(context));
  ipcMain.handle("homebrew:save", async (_event, entry: HomebrewEntry) => saveHomebrew(context, entry));
  ipcMain.handle("homebrew:delete", async (_event, id: string) => deleteHomebrew(context, id));
}

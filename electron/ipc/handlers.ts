import { readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { app, dialog, ipcMain, shell } from "electron";
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
  "app:open-external-url",
  "app:reveal-database-file",
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

function getLaunchPath() {
  const executablePath = app.getPath("exe");

  if (app.isPackaged && process.platform === "darwin") {
    return dirname(dirname(dirname(executablePath)));
  }

  return executablePath;
}

async function getBuildTimestamp(launchPath: string) {
  const candidatePaths = app.isPackaged
    ? [launchPath, app.getPath("exe"), join(process.resourcesPath, "app.asar")]
    : [
        join(process.cwd(), "dist-electron", "main.cjs"),
        join(process.cwd(), "dist", "index.html"),
        join(process.cwd(), "package.json"),
      ];

  for (const candidatePath of candidatePaths) {
    try {
      return (await stat(candidatePath)).mtime.toISOString();
    } catch {
      continue;
    }
  }

  return null;
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
    filters: [
      { name: "D&D Character Sheet JSON", extensions: ["json", "dndsheet.json"] },
      { name: "JSON", extensions: ["json"] },
    ],
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
    preferCSSPageSize: true,
  });

  await writeFile(result.filePath, pdf);
  return result.filePath;
}

export function registerIpcHandlers(context: DatabaseContext, getWindow: () => BrowserWindow | null) {
  for (const channel of CHANNELS) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle("app:get-info", async () => {
    const launchPath = getLaunchPath();

    return {
      appVersion: app.getVersion(),
      builtAt: await getBuildTimestamp(launchPath),
      databasePath: context.databasePath,
      launchPath,
      runtime: "electron" as const,
      storageKind: "sqlite" as const,
      isPackaged: app.isPackaged,
      platform: process.platform,
      userDataPath: app.getPath("userData"),
    };
  });

  ipcMain.handle("app:reveal-database-file", async () => {
    shell.showItemInFolder(context.databasePath);
    return true;
  });

  ipcMain.handle("app:open-external-url", async (_event, url: string) => {
    await shell.openExternal(url);
    return true;
  });

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

import { findCompendiumEntry, searchCompendiumSeed } from "../../shared/data/compendiumSeed";
import { buildCharacterFromInput } from "../../shared/factories";
import { parseCharacterImport, parseCharacterRecord } from "../../shared/validation";
import packageManifest from "../../package.json";
import type {
  AppInfo,
  BuilderInput,
  CharacterRecord,
  CharacterSummary,
  DndApi,
  HomebrewEntry,
  SearchInput,
} from "../../shared/types";

const CHARACTERS_KEY = "dnd-character-sheet:characters";
const HOMEBREW_KEY = "dnd-character-sheet:homebrew";

function downloadFile(filename: string, contents: string, contentType: string) {
  const blob = new Blob([contents], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function readStore<T>(key: string, fallback: T) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function listStoredCharacters() {
  return readStore<unknown[]>(CHARACTERS_KEY, [])
    .flatMap((entry) => {
      try {
        return [parseCharacterRecord(entry) as CharacterRecord];
      } catch {
        return [];
      }
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function listStoredHomebrew() {
  return readStore<HomebrewEntry[]>(HOMEBREW_KEY, []).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

function toSummary(record: CharacterRecord): CharacterSummary {
  return {
    id: record.id,
    name: record.name,
    classId: record.classId,
    speciesId: record.speciesId,
    level: record.level,
    updatedAt: record.updatedAt,
  };
}

function saveStoredCharacters(records: CharacterRecord[]) {
  writeStore(CHARACTERS_KEY, records);
}

function saveStoredHomebrew(records: HomebrewEntry[]) {
  writeStore(HOMEBREW_KEY, records);
}

async function pickJsonImportText() {
  if ("showOpenFilePicker" in window && typeof window.showOpenFilePicker === "function") {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      excludeAcceptAllOption: false,
      types: [
        {
          description: "JSON",
          accept: {
            "application/json": [".json"],
          },
        },
      ],
    });

    const file = await handle.getFile();
    return file.text();
  }

  return new Promise<string | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);

    const cleanup = () => {
      input.remove();
      window.removeEventListener("focus", handleFocus);
    };

    const finish = (value: string | null) => {
      cleanup();
      resolve(value);
    };

    const handleFocus = () => {
      window.setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          finish(null);
        }
      }, 0);
    };

    input.addEventListener(
      "change",
      async () => {
        const file = input.files?.[0];
        if (!file) {
          finish(null);
          return;
        }

        finish(await file.text());
      },
      { once: true },
    );

    window.addEventListener("focus", handleFocus, { once: true });
    input.click();
  });
}

function makeBrowserApi(): DndApi {
  return {
    app: {
      getInfo: async (): Promise<AppInfo> => ({
        appVersion: packageManifest.version,
        builtAt: null,
        databasePath: "localStorage",
        launchPath: window.location.origin,
        runtime: "browser-dev",
        storageKind: "localStorage",
        isPackaged: false,
        platform: "browser",
        userDataPath: "browser-storage",
      }),
      revealDatabaseFile: async () => false,
    },
    characters: {
      list: async () => listStoredCharacters().map(toSummary),
      get: async (id) => listStoredCharacters().find((record) => record.id === id) ?? null,
      save: async (record) => {
        const now = new Date().toISOString();
        const records = listStoredCharacters().filter((entry) => entry.id !== record.id);
        const nextRecord = parseCharacterRecord({ ...record, updatedAt: now }) as CharacterRecord;
        saveStoredCharacters([nextRecord, ...records]);
        return nextRecord;
      },
      create: async (input) => {
        const homebrew = listStoredHomebrew().filter((entry) => input.homebrewIds.includes(entry.id));
        const record = buildCharacterFromInput(input, homebrew);
        const records = listStoredCharacters();
        saveStoredCharacters([record, ...records]);
        return record;
      },
      delete: async (id) => {
        saveStoredCharacters(listStoredCharacters().filter((record) => record.id !== id));
      },
      importJson: async () => {
        const raw = await pickJsonImportText();
        if (!raw) {
          return null;
        }

        const imported = parseCharacterImport(JSON.parse(raw));
        return makeBrowserApi().characters.save(imported);
      },
      exportJson: async (id) => {
        const record = listStoredCharacters().find((entry) => entry.id === id);
        if (!record) {
          return null;
        }

        const filename = `${record.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.dndsheet.json`;
        downloadFile(
          filename,
          JSON.stringify(
            {
              version: 1,
              exportedAt: new Date().toISOString(),
              character: record,
            },
            null,
            2,
          ),
          "application/json",
        );
        return `browser-download:${filename}`;
      },
      exportPdf: async () => {
        window.print();
        return "browser-print-dialog";
      },
    },
    builder: {
      createFromWizard: async (input: BuilderInput) => makeBrowserApi().characters.create(input),
    },
    compendium: {
      search: async (input: SearchInput) => searchCompendiumSeed(input),
      get: async (slug) => findCompendiumEntry(slug),
    },
    homebrew: {
      list: async () => listStoredHomebrew(),
      save: async (entry) => {
        const now = new Date().toISOString();
        const records = listStoredHomebrew().filter((current) => current.id !== entry.id);
        const nextEntry = { ...entry, updatedAt: now };
        saveStoredHomebrew([nextEntry, ...records]);
        return nextEntry;
      },
      delete: async (id) => {
        saveStoredHomebrew(listStoredHomebrew().filter((entry) => entry.id !== id));
      },
    },
  };
}

export const dndApi: DndApi =
  typeof window !== "undefined" && window.dndApi
    ? window.dndApi
    : makeBrowserApi();

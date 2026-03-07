import { COMPENDIUM_SEED } from "../../shared/data/compendiumSeed";
import { buildCharacterFromInput } from "../../shared/factories";
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
  return readStore<CharacterRecord[]>(CHARACTERS_KEY, []).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
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

function makeBrowserApi(): DndApi {
  return {
    app: {
      getInfo: async (): Promise<AppInfo> => ({
        appVersion: "browser-dev",
        databasePath: "localStorage",
      }),
    },
    characters: {
      list: async () => listStoredCharacters().map(toSummary),
      get: async (id) => listStoredCharacters().find((record) => record.id === id) ?? null,
      save: async (record) => {
        const now = new Date().toISOString();
        const records = listStoredCharacters().filter((entry) => entry.id !== record.id);
        const nextRecord: CharacterRecord = { ...record, updatedAt: now };
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
      search: async ({ query, type }: SearchInput) => {
        const normalized = query.trim().toLowerCase();
        return COMPENDIUM_SEED.filter((entry) => {
          if (type && entry.type !== type) {
            return false;
          }

          if (!normalized) {
            return true;
          }

          return [entry.name, entry.summary, entry.searchText].some((value) =>
            value.toLowerCase().includes(normalized),
          );
        });
      },
      get: async (slug) => COMPENDIUM_SEED.find((entry) => entry.slug === slug) ?? null,
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

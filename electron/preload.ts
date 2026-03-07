import { contextBridge, ipcRenderer } from "electron";
import type { DndApi } from "../shared/types";

const api: DndApi = {
  app: {
    getInfo: () => ipcRenderer.invoke("app:get-info"),
  },
  characters: {
    list: () => ipcRenderer.invoke("characters:list"),
    get: (id) => ipcRenderer.invoke("characters:get", id),
    save: (record) => ipcRenderer.invoke("characters:save", record),
    create: (input) => ipcRenderer.invoke("characters:create", input),
    delete: (id) => ipcRenderer.invoke("characters:delete", id),
    exportJson: (id) => ipcRenderer.invoke("characters:export-json", id),
    exportPdf: (id) => ipcRenderer.invoke("characters:export-pdf", id),
  },
  builder: {
    createFromWizard: (input) => ipcRenderer.invoke("builder:create-from-wizard", input),
  },
  compendium: {
    search: (input) => ipcRenderer.invoke("compendium:search", input),
    get: (slug) => ipcRenderer.invoke("compendium:get", slug),
  },
  homebrew: {
    list: () => ipcRenderer.invoke("homebrew:list"),
    save: (entry) => ipcRenderer.invoke("homebrew:save", entry),
    delete: (id) => ipcRenderer.invoke("homebrew:delete", id),
  },
};

contextBridge.exposeInMainWorld("dndApi", api);

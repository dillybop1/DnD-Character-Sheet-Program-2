import type { DndApi } from "../shared/types";

declare global {
  interface Window {
    dndApi?: DndApi;
  }
}

export {};

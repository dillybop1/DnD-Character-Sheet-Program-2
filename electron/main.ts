import { existsSync } from "node:fs";
import { join } from "node:path";
import { app, BrowserWindow } from "electron";
import { getDatabaseContext } from "./db/client";
import { registerIpcHandlers } from "./ipc/handlers";
import { createStartupErrorHtml, getRendererLoadPlan } from "./startup";

let mainWindow: BrowserWindow | null = null;

function getWindowIconPath() {
  if (process.platform === "darwin") {
    return undefined;
  }

  const iconFileName = process.platform === "win32" ? "icon.ico" : "icon.png";
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, iconFileName)
    : join(process.cwd(), "build", iconFileName);

  return existsSync(iconPath) ? iconPath : undefined;
}

async function createMainWindow() {
  const preloadPath = join(__dirname, "preload.cjs");
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1240,
    minHeight: 820,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#120f0d",
    icon: getWindowIconPath(),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  let showedStartupError = false;

  const showStartupError = async (title: string, details: string[]) => {
    if (!mainWindow || showedStartupError) {
      return;
    }

    showedStartupError = true;
    await mainWindow.loadURL(
      `data:text/html;charset=UTF-8,${encodeURIComponent(createStartupErrorHtml({ title, details }))}`,
    );
  };

  mainWindow.webContents.on(
    "did-fail-load",
    async (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) {
        return;
      }

      await showStartupError("Renderer failed to load", [
        `Electron reported ${errorCode}: ${errorDescription}.`,
        `Attempted URL: ${validatedURL || "unknown"}.`,
      ]);
    },
  );

  const rendererLoadPlan = getRendererLoadPlan(
    join(__dirname, "../dist"),
    process.env.VITE_DEV_SERVER_URL,
  );

  if (rendererLoadPlan.kind === "dev-server") {
    await mainWindow.loadURL(rendererLoadPlan.url);
    return;
  }

  if (rendererLoadPlan.kind === "startup-error") {
    await showStartupError(rendererLoadPlan.issue.title, rendererLoadPlan.issue.details);
    return;
  }

  await mainWindow.loadFile(rendererLoadPlan.htmlPath);
}

async function bootstrap() {
  const context = await getDatabaseContext(app.getPath("userData"));
  registerIpcHandlers(context, () => mainWindow);
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
}

app.whenReady().then(bootstrap);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

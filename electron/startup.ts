import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ABSOLUTE_ASSET_PATH_PATTERN = /\b(?:src|href)=["']\/assets\//i;

type StartupIssue = {
  title: string;
  details: string[];
};

export type RendererLoadPlan =
  | {
      kind: "dev-server";
      url: string;
    }
  | {
      kind: "dist-file";
      htmlPath: string;
    }
  | {
      kind: "startup-error";
      issue: StartupIssue;
    };

export function inspectRendererHtml(html: string): StartupIssue | null {
  if (ABSOLUTE_ASSET_PATH_PATTERN.test(html)) {
    return {
      title: "Renderer bundle uses absolute asset paths",
      details: [
        "dist/index.html references /assets/... paths, which do not resolve inside a packaged Electron app.",
        "Rebuild the app so Vite emits relative asset paths like ./assets/...",
      ],
    };
  }

  return null;
}

export function getRendererLoadPlan(distRoot: string, devServerUrl?: string): RendererLoadPlan {
  if (devServerUrl) {
    return {
      kind: "dev-server",
      url: devServerUrl,
    };
  }

  const htmlPath = join(distRoot, "index.html");
  if (!existsSync(htmlPath)) {
    return {
      kind: "startup-error",
      issue: {
        title: "Renderer bundle is missing",
        details: [
          `Could not find ${htmlPath}.`,
          "Run the production build again before packaging the app.",
        ],
      },
    };
  }

  const html = readFileSync(htmlPath, "utf8");
  const issue = inspectRendererHtml(html);
  if (issue) {
    return {
      kind: "startup-error",
      issue,
    };
  }

  return {
    kind: "dist-file",
    htmlPath,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createStartupErrorHtml(issue: StartupIssue) {
  const details = issue.details
    .map((detail) => `<li>${escapeHtml(detail)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DND Character Sheet Startup Error</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at top, #2b1e19 0%, #120f0d 62%);
        color: #f6efe4;
      }

      main {
        width: min(720px, calc(100vw - 48px));
        padding: 32px;
        border: 1px solid rgba(246, 239, 228, 0.12);
        border-radius: 18px;
        background: rgba(20, 16, 14, 0.92);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
      }

      h1 {
        margin: 0 0 16px;
        font-size: 28px;
        line-height: 1.15;
      }

      p,
      li {
        font-size: 16px;
        line-height: 1.55;
        color: #e5d9ca;
      }

      ul {
        margin: 16px 0 0;
        padding-left: 20px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(issue.title)}</h1>
      <p>DND Character Sheet could not load its renderer bundle.</p>
      <ul>${details}</ul>
    </main>
  </body>
</html>`;
}

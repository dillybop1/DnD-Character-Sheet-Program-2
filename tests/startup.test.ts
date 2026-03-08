import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import {
  createStartupErrorHtml,
  getRendererLoadPlan,
  inspectRendererHtml,
} from "../electron/startup";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { force: true, recursive: true });
    }
  }
});

function makeDistDir(indexHtml?: string) {
  const dir = mkdtempSync(join(tmpdir(), "dnd-startup-"));
  tempDirs.push(dir);

  if (indexHtml) {
    writeFileSync(join(dir, "index.html"), indexHtml, "utf8");
  }

  return dir;
}

describe("inspectRendererHtml", () => {
  it("accepts renderer bundles that use relative asset paths", () => {
    expect(
      inspectRendererHtml(
        '<script type="module" src="./assets/index.js"></script><link rel="stylesheet" href="./assets/index.css">',
      ),
    ).toBeNull();
  });

  it("flags renderer bundles that use absolute asset paths", () => {
    expect(
      inspectRendererHtml(
        '<script type="module" src="/assets/index.js"></script><link rel="stylesheet" href="/assets/index.css">',
      ),
    ).toEqual({
      title: "Renderer bundle uses absolute asset paths",
      details: [
        "dist/index.html references /assets/... paths, which do not resolve inside a packaged Electron app.",
        "Rebuild the app so Vite emits relative asset paths like ./assets/...",
      ],
    });
  });
});

describe("getRendererLoadPlan", () => {
  it("prefers the Vite dev server when one is configured", () => {
    expect(getRendererLoadPlan("/tmp/does-not-matter", "http://localhost:5173")).toEqual({
      kind: "dev-server",
      url: "http://localhost:5173",
    });
  });

  it("reports a missing dist/index.html file", () => {
    const distDir = makeDistDir();
    expect(getRendererLoadPlan(distDir)).toEqual({
      kind: "startup-error",
      issue: {
        title: "Renderer bundle is missing",
        details: [
          `Could not find ${join(distDir, "index.html")}.`,
          "Run the production build again before packaging the app.",
        ],
      },
    });
  });

  it("loads the dist index when the bundle is valid", () => {
    const distDir = makeDistDir('<script type="module" src="./assets/index.js"></script>');
    expect(getRendererLoadPlan(distDir)).toEqual({
      kind: "dist-file",
      htmlPath: join(distDir, "index.html"),
    });
  });
});

describe("createStartupErrorHtml", () => {
  it("escapes issue details before rendering the error page", () => {
    const html = createStartupErrorHtml({
      title: "Bad <Bundle>",
      details: ['Path was "/assets/index.js"'],
    });

    expect(html).toContain("Bad &lt;Bundle&gt;");
    expect(html).toContain("Path was &quot;/assets/index.js&quot;");
    expect(html).not.toContain("<Bundle>");
  });
});

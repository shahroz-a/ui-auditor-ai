import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

const onePixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lL+n3wAAAABJRU5ErkJggg==",
  "base64"
);

describe("ui-auditor CLI", () => {
  it("emits JSON audit reports for local screenshots", () => {
    const directory = mkdtempSync(path.join(tmpdir(), "ui-auditor-cli-"));
    const screenshotPath = path.join(directory, "tiny.png");
    writeFileSync(screenshotPath, onePixelPng);

    const output = execFileSync("node", ["bin/ui-auditor.mjs", "audit", screenshotPath, "--viewport", "320"], {
      cwd: process.cwd(),
      encoding: "utf8"
    });
    const report = JSON.parse(output);

    expect(report.image).toMatchObject({
      name: "tiny.png",
      type: "image/png",
      width: 1,
      height: 1
    });
    expect(report.mode).toBe("node-metadata");
    expect(report.agentHints.limitation).toContain("metadata-only");
    expect(report.summary.critical).toBeGreaterThanOrEqual(1);
  });
});

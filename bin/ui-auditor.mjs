#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { auditScreenshot, formatReport } from "../lib/node-audit.mjs";

async function readPackageVersion() {
  try {
    const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
    return packageJson.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function printHelp() {
  process.stdout.write(`UI Auditor AI CLI

Usage:
  ui-auditor audit <screenshot> [--viewport <width>] [--format json|markdown] [--out <file>]
  ui-auditor <screenshot> [--viewport <width>] [--format json|markdown]
  ui-auditor --help

Examples:
  ui-auditor audit ./screenshots/dashboard.png --viewport 1440 --format json
  ui-auditor audit ./screenshots/mobile.png --viewport 390 --format markdown --out audit.md

Notes:
  CLI mode is local and metadata-only. Use the browser app for pixel-sampled overlays.
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const command = args[0] && !args[0].startsWith("-") && args[0] !== "audit" ? "audit" : args.shift();

  if (!command || command === "--help" || command === "-h") {
    return { help: true };
  }

  if (command === "--version" || command === "-v") {
    return { version: true };
  }

  if (command !== "audit") {
    throw new Error(`Unknown command: ${command}`);
  }

  const options = {
    command,
    format: "json",
    input: undefined,
    out: undefined,
    viewportWidth: undefined
  };

  while (args.length > 0) {
    const value = args.shift();

    if (!value) {
      continue;
    }

    if (value === "--format") {
      options.format = args.shift();
      continue;
    }

    if (value === "--out") {
      options.out = args.shift();
      continue;
    }

    if (value === "--viewport") {
      options.viewportWidth = Number(args.shift());
      continue;
    }

    if (value.startsWith("--viewport=")) {
      options.viewportWidth = Number(value.slice("--viewport=".length));
      continue;
    }

    if (value.startsWith("--format=")) {
      options.format = value.slice("--format=".length);
      continue;
    }

    if (value.startsWith("--out=")) {
      options.out = value.slice("--out=".length);
      continue;
    }

    if (value.startsWith("-")) {
      throw new Error(`Unknown option: ${value}`);
    }

    options.input = value;
  }

  if (!options.input) {
    throw new Error("Missing screenshot path.");
  }

  if (!["json", "markdown"].includes(options.format)) {
    throw new Error("--format must be json or markdown.");
  }

  if (options.viewportWidth !== undefined && (!Number.isFinite(options.viewportWidth) || options.viewportWidth < 1)) {
    throw new Error("--viewport must be a positive number.");
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    process.stdout.write(`${await readPackageVersion()}\n`);
    return;
  }

  const report = await auditScreenshot(path.resolve(options.input), {
    viewportWidth: options.viewportWidth
  });
  const output = `${formatReport(report, options.format)}\n`;

  if (options.out) {
    await mkdir(path.dirname(path.resolve(options.out)), { recursive: true });
    await writeFile(options.out, output);
    return;
  }

  process.stdout.write(output);
}

main().catch((error) => {
  process.stderr.write(`ui-auditor: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

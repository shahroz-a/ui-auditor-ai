import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

const requiredFiles = [
  "README.md",
  "ARCHITECTURE.md",
  "ROADMAP.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "STYLEGUIDE.md",
  "LICENSE",
  "docs/getting-started.md",
  "docs/how-it-works.md",
  "docs/rule-engine.md",
  "docs/architecture.md",
  "docs/faq.md",
  "docs/performance.md",
  "docs/accessibility.md",
  "docs/contributing.md"
];

const missing = requiredFiles.filter((file) => !existsSync(file));

if (missing.length > 0) {
  throw new Error(`Missing repository files: ${missing.join(", ")}`);
}

const readme = await readFile("README.md", "utf8");
const requiredReadmeSections = [
  "Features",
  "Installation",
  "Architecture",
  "Screenshots",
  "Roadmap",
  "Contributing",
  "FAQ",
  "Benchmarks",
  "License"
];

const missingSections = requiredReadmeSections.filter((section) => !readme.includes(`## ${section}`));

if (missingSections.length > 0) {
  throw new Error(`README is missing sections: ${missingSections.join(", ")}`);
}

process.stdout.write("Repository quality files are present.\n");

import { spawnSync } from "node:child_process";

const labels = [
  ["good first issue", "7057ff", "A small, well-scoped contribution"],
  ["help wanted", "008672", "Maintainer-approved community work"],
  ["bug", "d73a4a", "Something is not working"],
  ["enhancement", "a2eeef", "A new capability or improvement"],
  ["documentation", "0075ca", "Docs, examples, or guides"],
  ["performance", "fbca04", "Speed, memory, or bundle-size work"],
  ["accessibility", "0e8a16", "Keyboard, screen reader, contrast, or WCAG work"],
  ["ui", "c5def5", "Visual design and interface polish"],
  ["backend", "bfdadc", "Server, API, or infrastructure work"],
  ["frontend", "c2e0c6", "Client-side app work"],
  ["discussion", "d4c5f9", "Needs design or product conversation"],
  ["question", "cc317c", "Usage, architecture, or contribution question"],
  ["duplicate", "cfd3d7", "Already reported"],
  ["invalid", "e4e669", "Not actionable as reported"],
  ["wontfix", "ffffff", "Intentionally not planned"]
];

for (const [name, color, description] of labels) {
  spawnSync(
    "gh",
    [
      "label",
      "create",
      name,
      "--color",
      color,
      "--description",
      description,
      "--force"
    ],
    { stdio: "inherit" }
  );
}

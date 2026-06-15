#!/usr/bin/env node
import path from "node:path";

import { auditScreenshot, formatReport } from "../lib/node-audit.mjs";

const serverInfo = {
  name: "ui-auditor-ai",
  version: "0.1.0"
};

const tools = [
  {
    name: "audit_screenshot",
    description:
      "Audit a local UI screenshot and return metadata-based findings for an LLM coding agent. No screenshots leave the local machine.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute or workspace-relative path to a PNG, JPEG, WebP, or AVIF screenshot."
        },
        viewportWidth: {
          type: "number",
          description: "Optional viewport width to compare against the screenshot width, for example 390 or 1440."
        },
        format: {
          type: "string",
          enum: ["json", "markdown"],
          description: "Response format. Markdown is compact for agent context; JSON is best for automation."
        }
      },
      required: ["path"],
      additionalProperties: false
    }
  }
];

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  send({
    jsonrpc: "2.0",
    id,
    result: value
  });
}

function error(id, code, message) {
  send({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message
    }
  });
}

async function handleRequest(request) {
  if (!request || typeof request !== "object") {
    return;
  }

  const { id, method, params } = request;

  if (!id && method?.startsWith("notifications/")) {
    return;
  }

  try {
    if (method === "initialize") {
      result(id, {
        protocolVersion: params?.protocolVersion ?? "2024-11-05",
        capabilities: {
          tools: {}
        },
        serverInfo
      });
      return;
    }

    if (method === "tools/list") {
      result(id, { tools });
      return;
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const args = params?.arguments ?? {};

      if (toolName !== "audit_screenshot") {
        error(id, -32602, `Unknown tool: ${toolName}`);
        return;
      }

      if (!args.path || typeof args.path !== "string") {
        error(id, -32602, "audit_screenshot requires a local path.");
        return;
      }

      const report = await auditScreenshot(path.resolve(args.path), {
        viewportWidth: args.viewportWidth
      });
      const format = args.format === "markdown" ? "markdown" : "json";

      result(id, {
        content: [
          {
            type: "text",
            text: formatReport(report, format)
          }
        ]
      });
      return;
    }

    error(id, -32601, `Method not found: ${method}`);
  } catch (caught) {
    error(id, -32000, caught instanceof Error ? caught.message : String(caught));
  }
}

let buffer = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;

  let newlineIndex = buffer.indexOf("\n");
  while (newlineIndex !== -1) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);

    if (line) {
      try {
        void handleRequest(JSON.parse(line));
      } catch {
        error(null, -32700, "Parse error");
      }
    }

    newlineIndex = buffer.indexOf("\n");
  }
});

process.stdin.resume();

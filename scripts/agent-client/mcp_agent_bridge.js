#!/usr/bin/env node
/**
 * MCP Server for QLMT Agent-to-Agent Bridge
 * Provides standard MCP Tools to Laptop AI Agents (Claude Desktop, Cursor, Antigravity, etc.)
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");
const readline = require("readline");

const ENDPOINT = process.env.QLMT_AGENT_ENDPOINT || "https://caplienchieu.dpdns.org/api/agent";
const SECRET = process.env.QLMT_AGENT_SECRET || "";

function sendHttpRequest(path, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${ENDPOINT}${path}`;
    const parsed = new URL(fullUrl);
    const isHttps = parsed.protocol === "https:";
    const transport = isHttps ? https : http;

    const payload = data ? JSON.stringify(data) : null;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: method,
      headers: {
        "x-agent-secret": SECRET,
        "Content-Type": "application/json",
        "User-Agent": "QLMT-MCP-Bridge/1.0",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
      timeout: 15000,
    };

    const req = transport.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve(parsedBody);
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out after 15s"));
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

const TOOLS = [
  {
    name: "qlmt_ping",
    description: "Check connectivity, server time, uptime, and database latency of the remote QLMT Server PC.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "qlmt_chat",
    description: "Send a direct message/dialogue to Server PC Agent and receive an immediate contextual response from the PC server.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Message to send to Server PC Agent" },
      },
      required: ["message"],
    },
  },
  {
    name: "qlmt_status",
    description: "Get comprehensive system resources (CPU, RAM) and database entity counts (Subjects, TDPs, Rentals, etc.) from QLMT Server.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "qlmt_list_tasks",
    description: "List coordination tasks in the agent inbox.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", description: "Filter by status: pending, in_progress, completed, failed" },
        limit: { type: "number", description: "Max tasks to return (default 20)" },
      },
    },
  },
  {
    name: "qlmt_create_task",
    description: "Send a new directive or task to the Server Agent on the PC server.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Task title/summary" },
        type: { type: "string", description: "Task category (e.g. general, analysis, data_sync, maintenance)" },
        priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
        payload: { type: "object", description: "Parameters or instructions dictionary for the task" },
      },
      required: ["title"],
    },
  },
  {
    name: "qlmt_update_task",
    description: "Update the status, results, or logs of a task in the agent inbox.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "Unique task ID" },
        status: { type: "string", enum: ["pending", "in_progress", "completed", "failed", "cancelled"] },
        result: { type: "object", description: "Task output result object" },
        log_message: { type: "string", description: "Progress log message" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "qlmt_query_db",
    description: "Query authorized collections safely from the remote QLMT MongoDB database (subjects, tdp, rentals, conditional_businesses, schedules, users, audit_logs).",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection name (e.g. subjects, tdp, rentals, conditional_businesses, schedules, users)" },
        operation: { type: "string", enum: ["find", "findOne", "count", "distinct"], default: "find" },
        query: { type: "object", description: "MongoDB JSON query filter" },
        projection: { type: "object", description: "Fields projection" },
        limit: { type: "number", description: "Max documents to return (max 500)" },
      },
      required: ["collection"],
    },
  },
  {
    name: "qlmt_action",
    description: "Execute allowed maintenance and diagnostic actions on the server (health_check, fetch_logs, sync_status, data_integrity_check).",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["health_check", "fetch_logs", "sync_status", "data_integrity_check"] },
        params: { type: "object", description: "Action parameters" },
      },
      required: ["action"],
    },
  },
];

async function handleToolCall(name, args) {
  switch (name) {
    case "qlmt_ping":
      return await sendHttpRequest("/ping", "GET");
    case "qlmt_chat":
      return await sendHttpRequest("/chat", "POST", {
        message: args.message,
        sender: "Laptop AI Agent",
      });
    case "qlmt_status":
      return await sendHttpRequest("/status", "GET");
    case "qlmt_list_tasks": {
      let url = `/tasks?limit=${args.limit || 20}`;
      if (args.status) url += `&status=${args.status}`;
      return await sendHttpRequest(url, "GET");
    }
    case "qlmt_create_task":
      return await sendHttpRequest("/tasks", "POST", {
        title: args.title,
        type: args.type || "general",
        priority: args.priority || "normal",
        payload: args.payload || {},
        created_by: "laptop_agent",
        assigned_to: "server_agent",
      });
    case "qlmt_update_task":
      return await sendHttpRequest("/tasks", "POST", {
        task_id: args.task_id,
        status: args.status,
        result: args.result,
        log_message: args.log_message,
      });
    case "qlmt_query_db":
      return await sendHttpRequest("/db", "POST", {
        collection: args.collection,
        operation: args.operation || "find",
        query: args.query || {},
        projection: args.projection,
        limit: args.limit || 50,
      });
    case "qlmt_action":
      return await sendHttpRequest("/action", "POST", {
        action: args.action,
        params: args.params || {},
      });
    default:
      throw new Error(`Tool not found: ${name}`);
  }
}

// JSON-RPC stdio loop
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on("line", async (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    const { id, method, params } = msg;

    if (method === "initialize") {
      const response = {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "qlmt-agent-bridge", version: "1.0.0" },
        },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
      return;
    }

    if (method === "notifications/initialized") {
      return; // Ignore initialization notification
    }

    if (method === "tools/list") {
      const response = {
        jsonrpc: "2.0",
        id,
        result: { tools: TOOLS },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
      return;
    }

    if (method === "tools/call") {
      const { name, arguments: toolArgs } = params;
      try {
        const result = await handleToolCall(name, toolArgs || {});
        const response = {
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
        process.stdout.write(JSON.stringify(response) + "\n");
      } catch (toolErr) {
        const response = {
          jsonrpc: "2.0",
          id,
          result: {
            isError: true,
            content: [{ type: "text", text: `Tool error: ${toolErr.message}` }],
          },
        };
        process.stdout.write(JSON.stringify(response) + "\n");
      }
      return;
    }

    // Default unknown method
    if (id !== undefined) {
      process.stdout.write(
        JSON.stringify({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        }) + "\n"
      );
    }
  } catch (err) {
    console.error("JSON parsing error:", err);
  }
});

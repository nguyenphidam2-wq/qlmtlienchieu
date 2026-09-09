#!/usr/bin/env node
/**
 * Laptop Agent Client (Node.js)
 * Giao tiếp trực tiếp hai chiều (Agent-to-Agent) với QLMT Server PC.
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

const DEFAULT_ENDPOINT = process.env.QLMT_AGENT_ENDPOINT || "https://caplienchieu.dpdns.org/api/agent";
const DEFAULT_SECRET = process.env.QLMT_AGENT_SECRET || "";

function request(urlStr, secret, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const isHttps = parsed.protocol === "https:";
    const transport = isHttps ? https : http;

    const payload = data ? JSON.stringify(data) : null;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: method,
      headers: {
        "x-agent-secret": secret,
        "Content-Type": "application/json",
        "User-Agent": "LaptopAgentClient-Node/1.0",
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
          if (res.statusCode >= 400) {
            resolve({ http_error: res.statusCode, details: parsedBody });
          } else {
            resolve(parsedBody);
          }
        } catch (e) {
          resolve({ http_error: res.statusCode, raw: body });
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

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  let endpoint = DEFAULT_ENDPOINT;
  let secret = DEFAULT_SECRET;

  // Simple CLI flag parsing
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--endpoint" && args[i + 1]) endpoint = args[i + 1];
    if (args[i] === "--secret" && args[i + 1]) secret = args[i + 1];
  }

  if (!secret) {
    console.error("Error: Agent Secret Token is required. Use --secret or set QLMT_AGENT_SECRET env var.");
    process.exit(1);
  }

  try {
    switch (command) {
      case "ping": {
        const res = await request(`${endpoint}/ping`, secret, "GET");
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case "status": {
        const res = await request(`${endpoint}/status`, secret, "GET");
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case "tasks": {
        const res = await request(`${endpoint}/tasks`, secret, "GET");
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case "create-task": {
        const titleIndex = args.indexOf("--title");
        const title = titleIndex !== -1 ? args[titleIndex + 1] : null;
        if (!title) {
          console.error("Error: --title is required");
          process.exit(1);
        }
        const res = await request(`${endpoint}/tasks`, secret, "POST", {
          title,
          created_by: "laptop_agent",
          assigned_to: "server_agent",
        });
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case "query-db": {
        const collIndex = args.indexOf("--collection");
        const collection = collIndex !== -1 ? args[collIndex + 1] : null;
        if (!collection) {
          console.error("Error: --collection is required");
          process.exit(1);
        }
        const res = await request(`${endpoint}/db`, secret, "POST", {
          collection,
          operation: "find",
          limit: 20,
        });
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case "chat": {
        const msgIndex = args.indexOf("--message");
        const message = msgIndex !== -1 ? args[msgIndex + 1] : args[1];
        if (!message) {
          console.error("Error: --message is required (e.g. --message 'Xin chào Server PC Agent')");
          process.exit(1);
        }
        const res = await request(`${endpoint}/chat`, secret, "POST", {
          message,
          sender: "Laptop AI Agent",
        });
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      case "action": {
        const nameIndex = args.indexOf("--name");
        const name = nameIndex !== -1 ? args[nameIndex + 1] : null;
        if (!name) {
          console.error("Error: --name is required (e.g. health_check, fetch_logs, sync_status, data_integrity_check)");
          process.exit(1);
        }
        const res = await request(`${endpoint}/action`, secret, "POST", { action: name });
        console.log(JSON.stringify(res, null, 2));
        break;
      }
      default:
        console.log("Usage: node laptop_agent_client.js <ping|status|chat|tasks|create-task|query-db|action> [--secret TOKEN] [--endpoint URL]");
        break;
    }
  } catch (err) {
    console.error("Request Failed:", err.message);
    process.exit(1);
  }
}

main();

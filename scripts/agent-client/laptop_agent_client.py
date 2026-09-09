#!/usr/bin/env python3
"""
Laptop Agent Client (Python)
Giao tiếp trực tiếp hai chiều (Agent-to-Agent) với QLMT Server PC.
"""

import sys
import os
import json
import argparse
import urllib.request
import urllib.error
import ssl

DEFAULT_ENDPOINT = os.environ.get("QLMT_AGENT_ENDPOINT", "https://caplienchieu.dpdns.org/api/agent")
DEFAULT_SECRET = os.environ.get("QLMT_AGENT_SECRET", "")


def make_request(url: str, secret: str, method: str = "GET", data: dict = None) -> dict:
    headers = {
        "x-agent-secret": secret,
        "Content-Type": "application/json",
        "User-Agent": "LaptopAgentClient/1.0",
    }
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    ctx = ssl.create_default_context()
    
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return {"http_error": e.code, "details": json.loads(err_body)}
        except Exception:
            return {"http_error": e.code, "details": err_body}
    except Exception as e:
        return {"error": str(e)}


def ping(endpoint: str, secret: str):
    res = make_request(f"{endpoint}/ping", secret, "GET")
    print(json.dumps(res, indent=2, ensure_ascii=False))


def status(endpoint: str, secret: str):
    res = make_request(f"{endpoint}/status", secret, "GET")
    print(json.dumps(res, indent=2, ensure_ascii=False))


def list_tasks(endpoint: str, secret: str, status_filter: str = None, limit: int = 20):
    url = f"{endpoint}/tasks?limit={limit}"
    if status_filter:
        url += f"&status={status_filter}"
    res = make_request(url, secret, "GET")
    print(json.dumps(res, indent=2, ensure_ascii=False))


def create_task(endpoint: str, secret: str, title: str, task_type: str = "general", priority: str = "normal", payload: dict = None):
    data = {
        "title": title,
        "type": task_type,
        "priority": priority,
        "payload": payload or {},
        "created_by": "laptop_agent",
        "assigned_to": "server_agent",
    }
    res = make_request(f"{endpoint}/tasks", secret, "POST", data)
    print(json.dumps(res, indent=2, ensure_ascii=False))


def update_task(endpoint: str, secret: str, task_id: str, status_val: str, result: dict = None, log_msg: str = None):
    data = {
        "task_id": task_id,
        "status": status_val,
        "result": result,
        "log_message": log_msg,
    }
    res = make_request(f"{endpoint}/tasks", secret, "POST", data)
    print(json.dumps(res, indent=2, ensure_ascii=False))


def query_db(endpoint: str, secret: str, collection: str, operation: str = "find", query: dict = None, limit: int = 50):
    data = {
        "collection": collection,
        "operation": operation,
        "query": query or {},
        "limit": limit,
    }
    res = make_request(f"{endpoint}/db", secret, "POST", data)
    print(json.dumps(res, indent=2, ensure_ascii=False))


def run_action(endpoint: str, secret: str, action: str, params: dict = None):
    data = {
        "action": action,
        "params": params or {},
    }
    res = make_request(f"{endpoint}/action", secret, "POST", data)
    print(json.dumps(res, indent=2, ensure_ascii=False))


def chat(endpoint: str, secret: str, message: str):
    data = {
        "message": message,
        "sender": "Laptop AI Agent",
    }
    res = make_request(f"{endpoint}/chat", secret, "POST", data)
    print(json.dumps(res, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="Laptop Agent Bridge Client")
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT, help="Agent endpoint URL")
    parser.add_argument("--secret", default=DEFAULT_SECRET, help="Agent secret token (or set QLMT_AGENT_SECRET)")
    
    subparsers = parser.add_subparsers(dest="cmd", required=True)
    
    # Ping
    subparsers.add_parser("ping", help="Ping QLMT server agent")
    
    # Status
    subparsers.add_parser("status", help="Get server & database status")

    # Chat
    p_chat = subparsers.add_parser("chat", help="Direct conversation with Server PC Agent")
    p_chat.add_argument("--message", required=True, help="Message to send to Server PC Agent")
    
    # List tasks
    p_tasks = subparsers.add_parser("tasks", help="List agent tasks")
    p_tasks.add_argument("--status", help="Filter by status (pending/in_progress/completed/failed)")
    p_tasks.add_argument("--limit", type=int, default=20, help="Max items")
    
    # Create task
    p_create = subparsers.add_parser("create-task", help="Create task for Server Agent")
    p_create.add_argument("--title", required=True, help="Task title")
    p_create.add_argument("--type", default="general", help="Task type")
    p_create.add_argument("--priority", default="normal", choices=["low", "normal", "high", "urgent"])
    p_create.add_argument("--payload", help="JSON payload string")
    
    # Update task
    p_upd = subparsers.add_parser("update-task", help="Update task status")
    p_upd.add_argument("--task-id", required=True, help="Task ID")
    p_upd.add_argument("--status", required=True, choices=["pending", "in_progress", "completed", "failed", "cancelled"])
    p_upd.add_argument("--result", help="JSON result string")
    p_upd.add_argument("--log", help="Log message")
    
    # Query DB
    p_db = subparsers.add_parser("query-db", help="Query collection safely")
    p_db.add_argument("--collection", required=True, help="Collection (subjects, tdp, rentals, conditional_businesses, schedules, users)")
    p_db.add_argument("--operation", default="find", choices=["find", "findOne", "count", "distinct"])
    p_db.add_argument("--query", default="{}", help="JSON query string")
    p_db.add_argument("--limit", type=int, default=50, help="Query limit")
    
    # Action
    p_act = subparsers.add_parser("action", help="Execute server action")
    p_act.add_argument("--name", required=True, help="Action (health_check, fetch_logs, sync_status, data_integrity_check)")
    p_act.add_argument("--params", default="{}", help="JSON params string")
    
    args = parser.parse_args()
    
    if not args.secret:
        print("Error: Agent Secret Token is required. Use --secret or set QLMT_AGENT_SECRET env var.", file=sys.stderr)
        sys.exit(1)
        
    if args.cmd == "ping":
        ping(args.endpoint, args.secret)
    elif args.cmd == "status":
        status(args.endpoint, args.secret)
    elif args.cmd == "chat":
        chat(args.endpoint, args.secret, args.message)
    elif args.cmd == "tasks":
        list_tasks(args.endpoint, args.secret, args.status, args.limit)
    elif args.cmd == "create-task":
        payload = json.loads(args.payload) if args.payload else {}
        create_task(args.endpoint, args.secret, args.title, args.type, args.priority, payload)
    elif args.cmd == "update-task":
        res = json.loads(args.result) if args.result else None
        update_task(args.endpoint, args.secret, args.task_id, args.status, res, args.log)
    elif args.cmd == "query-db":
        q = json.loads(args.query) if args.query else {}
        query_db(args.endpoint, args.secret, args.collection, args.operation, q, args.limit)
    elif args.cmd == "action":
        params = json.loads(args.params) if args.params else {}
        run_action(args.endpoint, args.secret, args.name, params)


if __name__ == "__main__":
    main()

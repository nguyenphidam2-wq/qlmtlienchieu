# Hướng dẫn Kết nối Kênh Giao tiếp Trực tiếp Hai Chiều (Agent-to-Agent)

Tài liệu này hướng dẫn cách kết nối và phối hợp công việc giữa **AI Agent trên Laptop của người dùng** và **AI Agent trên Server PC (QLMT)**.

---

## 1. Thông số kết nối & Xác thực

| Thông số | Giá trị |
| :--- | :--- |
| **Internet Endpoint (Cloudflare Tunnel)** | `https://caplienchieu.dpdns.org/api/agent` |
| **LAN Endpoint (Nội bộ cơ quan)** | `http://192.168.2.234:3000/api/agent` |
| **Cơ chế xác thực** | Header `x-agent-secret: <AGENT_SECRET_KEY>` hoặc `Authorization: Bearer <AGENT_SECRET_KEY>` |
| **Cấu hình Secret** | Khai báo biến `AGENT_SECRET_KEY` trong file `.env.production` trên Server PC |

---

## 2. Danh mục API Endpoints

### 2.1. `GET /api/agent/ping`
Kiểm tra kết nối, độ trễ database, uptime và phiên bản server.
* **Header:** `x-agent-secret: <AGENT_SECRET_KEY>`
* **Response mẫu:**
```json
{
  "status": "ok",
  "server_time": "2026-09-09T14:15:00.000Z",
  "service": "qlmt-agent-bridge",
  "version": "0.1.0",
  "uptime_seconds": 18240,
  "database": { "status": "connected", "latency_ms": 12 },
  "memory_mb": { "rss": 142, "heap_used": 85 }
}
```

### 2.2. `POST /api/agent/chat` *(Đối thoại Trực tiếp - Phản hồi Tức thì)*
Gửi thông điệp/hỏi đáp trực tiếp đến Server PC Agent và nhận ngay câu trả lời ngữ cảnh trong cùng một HTTP request (không qua hàng đợi chờ đợi).
* **Body JSON:** `{"message": "Xin chào PC Agent, tình hình hệ thống thế nào?"}`
* **Response mẫu:**
```json
{
  "status": "ok",
  "sender": "QLMT Server PC Agent",
  "recipient": "Laptop AI Agent",
  "timestamp": "2026-09-09T14:25:00.000Z",
  "reply": "Xin chào Laptop AI Agent! Tôi là QLMT Server PC Agent. Hệ thống đang hoạt động ổn định...",
  "server_context": {
    "hostname": "SERVER-QLMT",
    "uptime": "5.2 giờ",
    "ram_usage": "35.4% (5.6GB / 16.0GB)",
    "db_stats": { "subjects": "133", "tdp": "27 TDP" }
  }
}
```

### 2.3. `GET /api/agent/status`
Báo cáo tài nguyên CPU, RAM, ổ đĩa và thống kê số lượng dữ liệu toàn bộ các module (Đối tượng, 27 TDP, Nhà trọ, Cơ sở có điều kiện, Lịch xét nghiệm, Tài khoản).

### 2.3. `POST /api/agent/tasks` & `GET /api/agent/tasks`
Hộp thư phối hợp nhiệm vụ (Task Inbox):
* **Tạo Task mới từ Laptop:**
  ```json
  POST /api/agent/tasks
  {
    "title": "Kiểm tra và chuẩn hóa tọa độ đối tượng TDP 12",
    "type": "data_sync",
    "priority": "high",
    "payload": { "tdp_id": "TDP_12" }
  }
  ```
* **Lấy danh sách Task:** `GET /api/agent/tasks?status=pending&limit=10`
* **Nhận và xử lý Task (Claim):** `POST /api/agent/tasks` với body `{"action": "claim", "assigned_to": "server_agent"}`
* **Cập nhật kết quả:** `POST /api/agent/tasks` với body `{"task_id": "task_123", "status": "completed", "result": {...}, "log_message": "Da xu ly xong"}`

### 2.4. `POST /api/agent/db`
Truy vấn dữ liệu an toàn từ xa (Read-only an toàn, giới hạn tối đa 500 bản ghi/lần):
* **Collections cho phép:** `subjects`, `tdp`, `rentals`, `conditional_businesses`, `schedules`, `users`, `audit_logs`, `agent_tasks`.
* **Operations hỗ trợ:** `find`, `findOne`, `count`, `distinct`, `aggregate`.
* **Ví dụ truy vấn:**
  ```json
  POST /api/agent/db
  {
    "collection": "subjects",
    "operation": "find",
    "query": { "approval_status": "Pending" },
    "limit": 20
  }
  ```

### 2.5. `POST /api/agent/action`
Thực thi các hành động điều hành và chẩn đoán:
* `health_check`: Kiểm tra toàn diện hệ thống.
* `fetch_logs`: Lấy log thao tác người dùng (`audit`) hoặc log phối hợp (`agent_tasks`).
* `sync_status`: Kiểm tra trạng thái đồng bộ dữ liệu.
* `data_integrity_check`: Quét lỗi thiếu tọa độ, thiếu TDP, hoặc dữ liệu bất thường.

---

## 3. Sử dụng Script Client từ Laptop

Thư mục `scripts/agent-client/` cung cấp sẵn 2 client:

### A. Python Client (`laptop_agent_client.py`)
```bash
# Thiết lập biến môi trường (hoặc truyền qua cờ --secret)
export QLMT_AGENT_SECRET="chuoi_secret_key_cua_ban"
export QLMT_AGENT_ENDPOINT="https://caplienchieu.dpdns.org/api/agent"

# Kiểm tra kết nối
python scripts/agent-client/laptop_agent_client.py ping

# Báo cáo tài nguyên & số lượng bản ghi
python scripts/agent-client/laptop_agent_client.py status

# Giao việc cho Server Agent
python scripts/agent-client/laptop_agent_client.py create-task --title "Tổng hợp danh sách đối tượng cần xét nghiệm tuần này" --priority high

# Tra cứu dữ liệu từ xa
python scripts/agent-client/laptop_agent_client.py query-db --collection subjects --query '{"approval_status": "Approved"}' --limit 10

# Chạy kiểm tra tính toàn vẹn dữ liệu
python scripts/agent-client/laptop_agent_client.py action --name data_integrity_check
```

### B. Node.js Client (`laptop_agent_client.js`)
```bash
node scripts/agent-client/laptop_agent_client.js ping --secret "chuoi_secret_key_cua_ban"
node scripts/agent-client/laptop_agent_client.js status --secret "chuoi_secret_key_cua_ban"
node scripts/agent-client/laptop_agent_client.js query-db --collection tdp --secret "chuoi_secret_key_cua_ban"
```

---

## 4. Tích hợp MCP (Model Context Protocol) vào Laptop AI Agent

Nếu sử dụng **Cursor**, **Claude Desktop**, **Antigravity**, hoặc **Windsurf** trên Laptop:

Thêm cấu hình sau vào file MCP Config (`claude_desktop_config.json` hoặc cấu hình MCP của Cursor/Antigravity):

```json
{
  "mcpServers": {
    "qlmt_server_pc": {
      "command": "node",
      "args": ["/duong/dan/toi/scripts/agent-client/mcp_agent_bridge.js"],
      "env": {
        "QLMT_AGENT_ENDPOINT": "https://caplienchieu.dpdns.org/api/agent",
        "QLMT_AGENT_SECRET": "CHUOI_AGENT_SECRET_KEY_CUA_BAN"
      }
    }
  }
}
```

Sau khi cấu hình, Laptop Agent sẽ tự động nhận diện các công cụ nghiệp vụ:
* `qlmt_ping`
* `qlmt_status`
* `qlmt_list_tasks`
* `qlmt_create_task`
* `qlmt_update_task`
* `qlmt_query_db`
* `qlmt_action`

---

## 5. Mẫu Chỉ thị (System Prompt) cho Laptop AI Agent

Khi bắt đầu phiên làm việc trên Laptop, bạn có thể dán đoạn chỉ thị này cho AI Agent trên Laptop:

```markdown
Bạn đang kết nối với máy chủ QLMT Server PC thông qua Kênh Giao tiếp Agent Bridge (https://caplienchieu.dpdns.org/api/agent).
Bạn có thể sử dụng các công cụ MCP hoặc script `laptop_agent_client.py` để:
1. Tra cứu trực tiếp dữ liệu nghiệp vụ (Đối tượng, 27 TDP, Nhà trọ, Cơ sở có điều kiện).
2. Tạo các nhiệm vụ (Task) trong hộp thư để AI Agent trên Server PC xử lý các tác vụ can thiệp sâu vào server.
3. Kiểm tra nhật ký thao tác và tính toàn vẹn dữ liệu trước khi thực hiện các thay đổi.
```

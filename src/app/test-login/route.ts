// Standalone test login page - serves from Next.js /test-login route
import { NextResponse } from "next/server";

export function GET() {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>Quản lý địa bàn TEST</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: white; padding: 20px; margin: 0; }
        .container { max-width: 400px; margin: 50px auto; text-align: center; }
        h1 { color: #f59e0b; }
        input {
            width: 100%;
            padding: 20px;
            margin: 10px 0;
            font-size: 24px;
            border-radius: 15px;
            border: 2px solid #334155;
            background: #1e293b;
            color: white;
            box-sizing: border-box;
            -webkit-appearance: none;
        }
        button {
            width: 100%;
            padding: 25px;
            margin: 15px 0;
            font-size: 24px;
            border-radius: 15px;
            border: none;
            cursor: pointer;
            font-weight: bold;
            -webkit-appearance: none;
            touch-action: manipulation;
        }
        .green { background: #22c55e; color: white; }
        .red { background: #dc2626; color: white; }
        #result {
            margin-top: 20px;
            padding: 20px;
            border-radius: 15px;
            display: none;
            font-size: 16px;
        }
        .success { background: #22c55e; }
        .error { background: #dc2626; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔴 Quản lý địa bàn TEST</h1>
        <input type="text" id="user" value="admin" readonly>
        <input type="password" id="pass" value="123456" readonly>
        <button class="green" onclick="login()">BẤM ĐỂ ĐĂNG NHẬP</button>
        <div id="result"></div>
    </div>
    <script>
        async function login() {
            var u = document.getElementById('user').value;
            var p = document.getElementById('pass').value;
            var r = document.getElementById('result');
            r.style.display = 'block';
            r.className = '';
            r.textContent = '⏳ Đang đăng nhập...';
            try {
                var res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify({username: u, password: p})
                });
                var data = await res.json();
                r.textContent = 'Kết quả: ' + res.status + ' - ' + JSON.stringify(data);
                r.className = res.ok ? 'success' : 'error';
                if (res.ok) {
                    setTimeout(function() { window.location.href = '/'; }, 1000);
                }
            } catch(e) {
                r.textContent = '❌ Lỗi: ' + e.message;
                r.className = 'error';
            }
        }
    </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
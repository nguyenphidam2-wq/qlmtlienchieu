"use client";
import { useState } from "react";
import { User, Lock } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const doLogin = async () => {
    setStatus("Đang đăng nhập...");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/";
      } else {
        setStatus("Lỗi: " + JSON.stringify(data));
      }
    } catch (e: unknown) {
      setStatus("Lỗi kết nối: " + (e as Error).message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "400px", margin: "0 auto", background: "#1e293b", borderRadius: "20px", padding: "30px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img
            src="/logo.png"
            alt="Công An Phường Liên Chiểu"
            style={{ width: "120px", height: "auto", margin: "0 auto 15px" }}
          />
          <h1 style={{ color: "white", fontSize: "24px", margin: "0 0 5px" }}>Quản lý địa bàn phường Liên Chiểu</h1>
          <p style={{ color: "#94a3b8", margin: "0" }}>Quản lý địa bàn phường Liên Chiểu</p>
        </div>

        {status && (
          <div style={{ padding: "15px", background: status.includes("Lỗi") ? "#dc2626" : "#22c55e", borderRadius: "10px", color: "white", marginBottom: "20px", textAlign: "center" }}>
            {status}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <label style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "5px", display: "block" }}>Tên đăng nhập</label>
          <div style={{ position: "relative" }}>
            <User style={{ position: "absolute", left: "12px", top: "12px", width: "20px", height: "20px", color: "#64748b" }} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: "100%", padding: "12px 12px 12px 40px", background: "#0f172a", border: "1px solid #334155", borderRadius: "10px", color: "white", fontSize: "16px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "30px" }}>
          <label style={{ color: "#cbd5e1", fontSize: "14px", marginBottom: "5px", display: "block" }}>Mật khẩu</label>
          <div style={{ position: "relative" }}>
            <Lock style={{ position: "absolute", left: "12px", top: "12px", width: "20px", height: "20px", color: "#64748b" }} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 12px 12px 40px", background: "#0f172a", border: "1px solid #334155", borderRadius: "10px", color: "white", fontSize: "16px", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <button
          onClick={doLogin}
          style={{ width: "100%", padding: "15px", background: "#dc2626", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", cursor: "pointer" }}
        >
          ĐĂNG NHẬP
        </button>

        <div style={{ marginTop: "30px", padding: "15px", background: "#334155", borderRadius: "10px" }}>
          <p style={{ color: "#94a3b8", fontSize: "12px", textAlign: "center", margin: "0 0 10px" }}>Tài khoản Demo:</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button onClick={() => { setUsername("admin"); setPassword("123456"); }} style={{ padding: "10px", background: "#475569", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>Admin</button>
            <button onClick={() => { setUsername("lanhdao"); setPassword("123456"); }} style={{ padding: "10px", background: "#475569", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>Lãnh Đạo</button>
            <button onClick={() => { setUsername("canbo"); setPassword("123456"); }} style={{ padding: "10px", background: "#475569", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>Cán bộ</button>
            <button onClick={() => { setUsername("khach"); setPassword("123456"); }} style={{ padding: "10px", background: "#475569", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px" }}>Khách</button>
          </div>
        </div>
      </div>
    </div>
  );
}

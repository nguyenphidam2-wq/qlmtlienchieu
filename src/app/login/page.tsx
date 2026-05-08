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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden">
          <div className="text-center mb-10">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
              <img
                src="/logo.png?v=2"
                alt="Công An Phường Liên Chiểu"
                className="w-full h-full object-contain relative z-10"
              />
            </div>
            <h1 className="text-white text-2xl font-black tracking-tight leading-tight uppercase">
              Bản đồ số <br/>
              <span className="text-yellow-500">Liên Chiểu</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-widest">Hệ thống quản trị nghiệp vụ</p>
          </div>

          {status && (
            <div className={`p-4 rounded-2xl text-xs font-bold mb-6 text-center animate-in slide-in-from-top-2 duration-300 ${status.includes("Lỗi") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
              {status}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Tên đăng nhập</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="Nhập tài khoản..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-slate-400 text-[10px] font-black uppercase tracking-widest ml-1">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              onClick={doLogin}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] mt-4"
            >
              ĐĂNG NHẬP HỆ THỐNG
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-slate-500 text-[10px] font-black text-center mb-4 uppercase tracking-widest">Truy cập nhanh (Demo)</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setUsername("admin"); setPassword("123456"); }} className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold rounded-xl border border-white/5 transition-all">Admin</button>
              <button onClick={() => { setUsername("lanhdao"); setPassword("123456"); }} className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold rounded-xl border border-white/5 transition-all">Lãnh Đạo</button>
              <button onClick={() => { setUsername("canbo"); setPassword("123456"); }} className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold rounded-xl border border-white/5 transition-all">Cán bộ</button>
              <button onClick={() => { setUsername("khach"); setPassword("123456"); }} className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold rounded-xl border border-white/5 transition-all">Khách</button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-slate-600 text-[10px] mt-8 font-medium">
          &copy; 2024 CÔNG AN PHƯỜNG LIÊN CHIỂU. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { User, Lock, Shield, ShieldCheck, ArrowRight, KeyRound, Sparkles, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = async (customUser?: string, customPass?: string) => {
    const userToUse = customUser || username;
    const passToUse = customPass || password;

    if (!userToUse || !passToUse) {
      setStatus("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
      return;
    }

    setLoading(true);
    setStatus("Đang xác thực thông tin đăng nhập...");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userToUse, password: passToUse }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Đăng nhập thành công! Đang chuyển hướng...");
        window.location.href = "/";
      } else {
        setLoading(false);
        setStatus(data.error || "Tên đăng nhập hoặc mật khẩu không chính xác.");
      }
    } catch (e: unknown) {
      setLoading(false);
      setStatus("Lỗi kết nối máy chủ: " + (e as Error).message);
    }
  };

  const handleQuickLogin = (roleUser: string, rolePass: string) => {
    setUsername(roleUser);
    setPassword(rolePass);
    doLogin(roleUser, rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Autofill CSS Fix to prevent Chrome white background bug */}
      <style jsx global>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px #090d16 inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Ambient Grid & Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[460px] relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Main Glassmorphism Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 relative overflow-hidden">
          
          {/* Subtle Top Accent Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-emerald-500"></div>

          {/* Header & Logo */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-5 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-xl animate-pulse"></div>
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 flex items-center justify-center shadow-lg relative z-10 overflow-hidden p-2">
                <img
                  src="/logo.png"
                  alt="Công An Phường Liên Chiểu"
                  className="w-full h-full object-contain filter drop-shadow"
                  onError={(e) => {
                    // Fallback icon if logo image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="text-3xl">🛡️</div>';
                  }}
                />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                CÔNG AN PHƯỜNG LIÊN CHIỂU
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-none">
              BẢN ĐỒ SỐ <span className="text-amber-400">LIÊN CHIỂU</span>
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-2">
              Hệ thống Giám sát Geospatial & Quản lý Nghiệp vụ
            </p>
          </div>

          {/* Status Alert Banner */}
          {status && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold mb-6 flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300 ${
                status.includes("Lỗi") || status.includes("Vui lòng")
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : status.includes("thành công")
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              }`}
            >
              {status.includes("Lỗi") || status.includes("Vui lòng") ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              ) : (
                <Sparkles className="w-4 h-4 flex-shrink-0 text-blue-400 animate-spin" />
              )}
              <span>{status}</span>
            </div>
          )}

          {/* Login Form */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-slate-300 text-[11px] font-bold uppercase tracking-wider ml-1">
                Tài khoản làm việc
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none z-10">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doLogin()}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  placeholder="Nhập tên tài khoản..."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 text-[11px] font-bold uppercase tracking-wider ml-1">
                Mật khẩu hệ thống
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none z-10">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doLogin()}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-white text-sm placeholder-slate-500 outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              onClick={() => doLogin()}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-900/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Đang xử lý...</span>
              ) : (
                <>
                  <span>ĐĂNG NHẬP HỆ THỐNG</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-amber-400" />
                Truy cập nhanh tài khoản Demo
              </span>
              <span className="text-[10px] text-slate-400 font-mono">pass: 123456</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLogin("admin", "123456")}
                className="p-2.5 bg-slate-950/60 hover:bg-blue-600/10 hover:border-blue-500/40 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition-all flex items-center gap-2 group cursor-pointer text-left"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform"></span>
                <div>
                  <div className="font-bold text-white leading-tight">Admin</div>
                  <div className="text-[10px] text-slate-400">Quản trị viên</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickLogin("lanhdao", "123456")}
                className="p-2.5 bg-slate-950/60 hover:bg-amber-600/10 hover:border-amber-500/40 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition-all flex items-center gap-2 group cursor-pointer text-left"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:scale-125 transition-transform"></span>
                <div>
                  <div className="font-bold text-white leading-tight">Lãnh Đạo</div>
                  <div className="text-[10px] text-slate-400">Xem & Duyệt</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickLogin("canbo", "123456")}
                className="p-2.5 bg-slate-950/60 hover:bg-emerald-600/10 hover:border-emerald-500/40 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition-all flex items-center gap-2 group cursor-pointer text-left"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-125 transition-transform"></span>
                <div>
                  <div className="font-bold text-white leading-tight">Cán bộ</div>
                  <div className="text-[10px] text-slate-400">Tạo & Cập nhật</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickLogin("khach", "123456")}
                className="p-2.5 bg-slate-950/60 hover:bg-slate-700/20 hover:border-slate-600 text-slate-200 text-xs font-semibold rounded-xl border border-slate-800 transition-all flex items-center gap-2 group cursor-pointer text-left"
              >
                <span className="w-2 h-2 rounded-full bg-slate-400 group-hover:scale-125 transition-transform"></span>
                <div>
                  <div className="font-bold text-white leading-tight">Khách</div>
                  <div className="text-[10px] text-slate-400">Chỉ xem</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-[11px] font-mono text-slate-400">
            &copy; 2026 CÔNG AN PHƯỜNG LIÊN CHIỂU • THÀNH PHỐ ĐÀ NẴNG
          </p>
          <p className="text-[10px] text-slate-400">
            Bảo mật thông tin dữ liệu địa bàn theo quy định Ngành Công An
          </p>
        </div>

      </div>
    </div>
  );
}


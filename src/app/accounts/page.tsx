import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { CopyPlus, ShieldAlert, KeyRound, User as UserIcon, Calendar, CheckSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  // Check Role
  let role = "guest";
  try {
    const JWT_SECRET_KEY = process.env.JWT_SECRET || "qlmt-lienchieu-super-secret-key-12345!@#";
    const key = new TextEncoder().encode(JWT_SECRET_KEY);
    const { payload } = await jwtVerify(token, key);
    role = String(payload.role || "guest");
  } catch (error) {
    redirect("/login");
  }

  if (role !== "admin" && role !== "leader") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Truy cập bị từ chối</h2>
        <p className="text-slate-500 mt-2">Tính năng này chỉ dành cho Admin và Lãnh đạo chỉ huy.</p>
      </div>
    );
  }

  // Fetch users if authorized
  await connectDB();
  const users = await User.find({}).sort({ created_at: -1 }).lean();

  const getRoleStyle = (r: string) => {
    switch(r) {
      case "admin": return "bg-red-100 text-red-700 border-red-200";
      case "leader": return "bg-amber-100 text-amber-700 border-amber-200";
      case "officer": return "bg-blue-100 text-blue-700 border-blue-200";
      case "guest": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getRoleName = (r: string) => {
    switch(r) {
      case "admin": return "Admin";
      case "leader": return "Lãnh đạo";
      case "officer": return "Cảnh sát (CSKV)";
      case "guest": return "Khách (Ngoài ngành)";
      default: return r;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản trị Phân quyền
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            Bạn đang đăng nhập với quyền {getRoleName(role)}. (Chỉ hiển thị demo tĩnh, DB nội bộ)
          </p>
        </div>
        {role === "admin" && (
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-[background,transform] hover:scale-105">
            <CopyPlus className="w-4 h-4" />
            Cấp tài khoản mới
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Cán bộ / Đơn vị</th>
              <th className="px-6 py-4 font-semibold">Tài khoản (ID)</th>
              <th className="px-6 py-4 font-semibold">Mức Phân quyền</th>
              <th className="px-6 py-4 font-semibold text-center">Tình trạng</th>
              <th className="px-6 py-4 font-semibold text-right">Ngày cấp phép</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u: any) => (
              <tr key={u._id.toString()} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{u.full_name}</div>
                      <div className="text-xs text-slate-500">{u.username}@lien-chieu.xn</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <code className="text-sm font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{u.username}</code>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${getRoleStyle(u.role)}`}>
                     {getRoleName(u.role)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Mở khóa
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm text-slate-500">
                  {new Date(u.created_at).toLocaleDateString('vi-VN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

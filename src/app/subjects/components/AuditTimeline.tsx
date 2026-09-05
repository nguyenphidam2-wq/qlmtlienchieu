"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { getAuditLogs } from "@/lib/actions/audit";

interface AuditEntry {
  _id: string;
  action: string;
  actor_id: string;
  actor_name?: string;
  actor_role: string;
  reason?: string;
  occurred_at: string;
  changes?: Array<{ field: string; before?: unknown; after?: unknown }>;
}

const actionLabels: Record<string, string> = {
  CREATE: "Tạo hồ sơ",
  UPDATE: "Cập nhật hồ sơ",
  SUBMIT: "Gửi duyệt",
  APPROVE: "Đã duyệt",
  REJECT: "Từ chối",
  VERIFY: "Xác minh",
  IMPORT: "Nhập dữ liệu",
  DELETE: "Xóa hồ sơ",
};

export function AuditTimeline({ entityType, entityId }: { entityType: string; entityId?: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);

  useEffect(() => {
    if (!entityId) return;
    getAuditLogs({ entityType, entityId, limit: 50 }).then(setLogs).catch(() => setLogs([]));
  }, [entityId, entityType]);

  return (
    <section className="mb-4">
      <h4 className="text-base font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b-2 border-slate-200 dark:border-slate-700 uppercase tracking-wide flex items-center gap-2">
        <Clock3 className="w-4 h-4" /> Lịch sử xử lý
      </h4>
      {logs.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Chưa có nhật ký.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log._id} className="border-l-2 border-blue-400 pl-3 py-1 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-slate-800 dark:text-slate-100">{actionLabels[log.action] || log.action}</strong>
                <span className="text-slate-500">{log.actor_name || log.actor_id} ({log.actor_role})</span>
                <time className="text-slate-400">{new Date(log.occurred_at).toLocaleString("vi-VN")}</time>
              </div>
              {log.reason && <p className="text-slate-500 mt-1">{log.reason}</p>}
              {!!log.changes?.length && (
                <div className="mt-1 text-slate-500 space-y-0.5">
                  {log.changes.slice(0, 8).map((change) => (
                    <div key={`${log._id}-${change.field}`}>
                      <span className="font-medium">{change.field}:</span>{" "}
                      {String(change.before ?? "-")} -&gt; {String(change.after ?? "-")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

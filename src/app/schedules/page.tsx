import { Suspense } from "react";
import { ScheduleList } from "./ScheduleList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Lịch Kiểm danh & Thử test Ma túy - Công an phường Liên Chiểu",
};

export default function SchedulesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 animate-pulse">Đang tải lịch kiểm tra ma túy...</div>}>
      <ScheduleList />
    </Suspense>
  );
}

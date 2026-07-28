import { Suspense } from "react";
import { SubjectList } from "./SubjectList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Quản lý Đối tượng - Bản đồ số Liên Chiểu",
};

export default function SubjectsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 animate-pulse">Đang tải danh sách đối tượng...</div>}>
      <SubjectList />
    </Suspense>
  );
}
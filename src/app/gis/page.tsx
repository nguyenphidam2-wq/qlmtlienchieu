import { Suspense } from "react";
import GISMapWrapper from "./GISMapWrapper";

export const metadata = {
  title: "Bản đồ số GIS - Bản đồ số Liên Chiểu",
};

export default function GISPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Bản đồ số GIS</h1>
        <p className="text-slate-500 mt-1">
          Phân bố đối tượng và cơ sở kinh doanh trên bản đồ
        </p>
      </div>
      <Suspense fallback={
        <div className="h-[calc(100vh-120px)] flex items-center justify-center bg-slate-100 rounded-xl">
          <div className="text-center text-slate-500 italic">Đang khởi tạo bản đồ...</div>
        </div>
      }>
        <GISMapWrapper />
      </Suspense>
    </div>
  );
}
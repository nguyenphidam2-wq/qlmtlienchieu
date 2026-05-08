import { Suspense } from "react";
import GISMapWrapper from "./GISMapWrapper";

export const metadata = {
  title: "Bản đồ số GIS - Bản đồ số Liên Chiểu",
};

export default function GISPage() {
  return (
    <div className="h-full w-full">
      <Suspense fallback={
        <div className="h-screen w-full flex items-center justify-center bg-slate-100">
          <div className="text-center text-slate-500 italic">Đang khởi tạo bản đồ...</div>
        </div>
      }>
        <GISMapWrapper />
      </Suspense>
    </div>
  );
}
"use client";

import dynamic from "next/dynamic";

const GISMap = dynamic(
  () => import("./GISMap").then((mod) => mod.GISMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center bg-slate-100 rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500">Đang tải bản đồ...</p>
        </div>
      </div>
    ),
  }
);

export default function GISMapWrapper() {
  return <GISMap />;
}
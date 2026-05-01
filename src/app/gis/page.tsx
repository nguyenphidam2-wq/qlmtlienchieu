import GISMapWrapper from "./GISMapWrapper";

export const metadata = {
  title: "Bản đồ GIS - Quản lý địa bàn Liên Chiểu",
};

export default function GISPage() {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Bản đồ GIS</h1>
        <p className="text-slate-500 mt-1">
          Phân bố đối tượng và cơ sở kinh doanh trên bản đồ
        </p>
      </div>
      <GISMapWrapper />
    </div>
  );
}
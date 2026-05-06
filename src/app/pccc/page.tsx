import { getPCCCRecords } from "@/lib/actions/pccc";
import PCCCList from "./PCCCList";

export const metadata = {
  title: "Quản lý An toàn PCCC - Bản đồ số Liên Chiểu",
};

export default async function PCCCPage() {
  const records = await getPCCCRecords();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PCCCList initialRecords={records} />
    </div>
  );
}

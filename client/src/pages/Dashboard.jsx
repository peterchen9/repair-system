import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, Package, Wrench } from "lucide-react";
import { api, dateOnly, transactionLabel } from "../lib/api";
import { Empty, LowStock, Panel, Section } from "../components/UI.jsx";

export default function Dashboard({ refreshKey }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/api/dashboard/summary").then((res) => setData(res.data));
  }, [refreshKey]);

  const metrics = [
    ["待修數量", data?.counts?.pending ?? 0, Clock3, "text-slate-700"],
    ["維修中數量", data?.counts?.repairing ?? 0, Wrench, "text-amber-700"],
    ["維修完成數量", data?.counts?.completed ?? 0, Package, "text-emerald-700"],
    ["無法維修數量", data?.counts?.unrepairable ?? 0, AlertTriangle, "text-rose-700"]
  ];

  return (
    <Section title="儀表板">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, tone]) => (
          <Panel key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </div>
              <Icon className={tone} size={30} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel>
          <h3 className="mb-3 font-semibold">低庫存零件</h3>
          {!data?.lowStockParts?.length ? <Empty text="目前沒有低庫存零件" /> : (
            <div className="space-y-2">
              {data.lowStockParts.map((part) => (
                <div key={part.id} className="flex items-center justify-between rounded-md border border-rose-100 bg-rose-50 px-3 py-2">
                  <span>{part.name}</span>
                  <span className="text-sm font-semibold text-rose-700">{part.quantity} / {part.safetyStock}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <h3 className="mb-3 font-semibold">最近維修紀錄</h3>
          {!data?.recentRepairRecords?.length ? <Empty /> : (
            <div className="space-y-3">
              {data.recentRepairRecords.map((record) => (
                <div key={record.id} className="border-b border-slate-100 pb-2 last:border-0">
                  <p className="font-medium">{record.repairItem?.itemName}</p>
                  <p className="text-sm text-slate-500">{record.technicianName} · {dateOnly(record.updatedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel>
          <h3 className="mb-3 font-semibold">最近零件異動</h3>
          {!data?.recentPartTransactions?.length ? <Empty /> : (
            <div className="space-y-3">
              {data.recentPartTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{tx.part?.name}</p>
                    <p className="text-sm text-slate-500">{transactionLabel[tx.type]} · {dateOnly(tx.transactionDate)}</p>
                  </div>
                  <span className="text-sm font-semibold">{tx.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </Section>
  );
}

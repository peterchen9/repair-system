import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { api, completionLabel, dateOnly } from "../lib/api";
import { Button, Empty, Panel, StatusBadge } from "../components/UI.jsx";
import BarcodeLabel from "../components/BarcodeLabel.jsx";

export default function TrackItem() {
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const code = decodeURIComponent(window.location.pathname.replace("/track/", ""));

  useEffect(() => {
    api.get(`/api/repair-items/tracking/${code}`)
      .then((res) => setItem(res.data))
      .catch(() => setError("找不到此追蹤碼"));
  }, [code]);

  return (
    <div className="min-h-screen bg-mist px-4 py-6">
      <main className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">維修品追蹤</h1>
            <p className="mt-1 text-sm text-slate-600">追蹤碼：{code}</p>
          </div>
          <a href="/register"><Button type="button" variant="secondary"><Search size={16} />新增登記</Button></a>
        </div>

        {error && <Empty text={error} />}
        {item && (
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <Panel>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{item.itemName}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.customerName} · {item.customerPhone}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="登記日期" value={dateOnly(item.receivedDate)} />
                <Info label="完成後處理方式" value={completionLabel[item.completionPreference]} />
                <Info label="故障問題" value={item.problemDescription} />
                <Info label="最近異動" value={item.statusHistories?.[0] ? `${dateOnly(item.statusHistories[0].changedAt)} ${item.statusHistories[0].reason || ""}` : "-"} />
              </div>
              {item.photoUrl && <img className="mt-4 max-h-72 rounded-md border object-cover" src={item.photoUrl} alt="維修品照片" />}
            </Panel>
            <BarcodeLabel item={item} />
          </div>
        )}
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="font-medium">{value || "-"}</p></div>;
}

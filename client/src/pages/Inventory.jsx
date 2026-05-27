import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { api, completionLabel, dateOnly, statusLabel, statuses, transactionLabel } from "../lib/api";
import { Button, Empty, Panel, Section, StatusBadge } from "../components/UI.jsx";

export default function Inventory({ refreshKey, onChanged }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [nextStatus, setNextStatus] = useState("");

  const load = () => api.get("/api/repair-items").then((res) => setItems(res.data));
  useEffect(() => { load(); }, [refreshKey]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const okStatus = !status || item.status === status;
      const okSearch = !search.trim() || `${item.itemName} ${item.customerName} ${item.customerPhone} ${item.trackingCode || ""}`.includes(search.trim());
      return okStatus && okSearch;
    });
  }, [items, status, search]);

  async function updateStatus(item) {
    if (!nextStatus) return alert("請選擇新狀態");
    await api.patch(`/api/repair-items/${item.id}/status`, { status: nextStatus, changedBy: "管理員", reason: "維修品庫存更新" });
    setNextStatus("");
    const res = await api.get(`/api/repair-items/${item.id}`);
    setSelected(res.data);
    await load();
    onChanged();
  }

  return (
    <Section
      title="維修品庫存"
      actions={<a href="/api/export/repair-items.csv"><Button type="button" variant="secondary"><Download size={16} />匯出 CSV</Button></a>}
    >
      <Panel>
        <div className="grid gap-3 md:grid-cols-[220px_1fr]">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部狀態</option>
            {statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <input placeholder="搜尋品名、姓名、電話、追蹤碼" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Panel>
          {!filtered.length ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500"><tr><th className="p-2">品名</th><th className="p-2">姓名</th><th className="p-2">處理方式</th><th className="p-2">狀態</th><th className="p-2">操作</th></tr></thead>
                <tbody>{filtered.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="p-2">
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-xs text-slate-500">{item.trackingCode || "尚無追蹤碼"}</p>
                    </td>
                    <td className="p-2">{item.customerName}</td>
                    <td className="p-2">{completionLabel[item.completionPreference]}</td>
                    <td className="p-2"><StatusBadge status={item.status} /></td>
                    <td className="p-2"><Button variant="secondary" onClick={() => { setSelected(item); setNextStatus(""); }}>查看歷程</Button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel>
          {!selected ? <Empty text="請選擇一筆維修品查看完整歷程" /> : (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selected.itemName}</h3>
                <p className="text-sm text-slate-500">{selected.customerName} · {selected.customerPhone}</p>
                <p className="mt-2">{selected.problemDescription}</p>
              </div>
              <div className="flex gap-2">
                <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                  <option value="">更新目前狀態</option>
                  {statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
                <Button onClick={() => updateStatus(selected)}>更新</Button>
              </div>
              {selected.photoUrl && <img className="max-h-48 rounded-md border object-cover" src={selected.photoUrl} alt="維修品照片" />}

              <Block title="維修紀錄">
                {!selected.repairRecords?.length ? <p className="text-sm text-slate-500">尚無維修紀錄</p> : selected.repairRecords.map((record) => (
                  <div key={record.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-medium">{record.technicianName} · {dateOnly(record.acceptedDate)}</p>
                    <p>{record.initialDiagnosis || "未填初判"}</p>
                    {!!record.partTransactions?.length && <p className="mt-1 text-slate-500">使用零件：{record.partTransactions.map((tx) => `${tx.part?.name} ${tx.quantity}`).join("、")}</p>}
                  </div>
                ))}
              </Block>

              <Block title="狀態異動歷程">
                {!selected.statusHistories?.length ? <p className="text-sm text-slate-500">尚無歷程</p> : selected.statusHistories.map((history) => (
                  <div key={history.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-medium">{statusLabel[history.fromStatus] || "建立"} → {statusLabel[history.toStatus]}</p>
                    <p className="text-slate-500">{dateOnly(history.changedAt)} · {history.changedBy || "系統"} · {history.reason || "未填原因"}</p>
                  </div>
                ))}
              </Block>
            </div>
          )}
        </Panel>
      </div>
    </Section>
  );
}

function Block({ title, children }) {
  return <div className="space-y-2"><h4 className="font-semibold">{title}</h4>{children}</div>;
}

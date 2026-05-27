import { useEffect, useState } from "react";
import { Boxes, ClipboardList, ExternalLink, Gauge, PackageSearch, Wrench } from "lucide-react";
import Dashboard from "./pages/Dashboard.jsx";
import RepairItems from "./pages/RepairItems.jsx";
import RepairRecords from "./pages/RepairRecords.jsx";
import Parts from "./pages/Parts.jsx";
import Inventory from "./pages/Inventory.jsx";
import PublicRegister from "./pages/PublicRegister.jsx";
import TrackItem from "./pages/TrackItem.jsx";

const tabs = [
  ["dashboard", "儀表板", Gauge, Dashboard],
  ["items", "待修品登記", ClipboardList, RepairItems],
  ["records", "維修過程", Wrench, RepairRecords],
  ["parts", "零件庫存", Boxes, Parts],
  ["inventory", "維修品庫存", PackageSearch, Inventory]
];

export default function App() {
  const path = window.location.pathname;
  if (path === "/register") return <PublicRegister />;
  if (path.startsWith("/track/")) return <TrackItem />;
  return <AdminApp />;
}

function AdminApp() {
  const [active, setActive] = useState("dashboard");
  const Current = tabs.find(([key]) => key === active)?.[3] || Dashboard;
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((key) => key + 1);

  useEffect(() => {
    document.title = "重修舊好維修系統後台";
    if (window.location.pathname === "/") window.history.replaceState(null, "", "/admin");
  }, []);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="px-5 py-5">
          <h1 className="text-2xl font-bold text-ink">重修舊好</h1>
          <p className="mt-1 text-sm text-slate-500">維修系統後台</p>
          <a className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-pine hover:underline" href="/register">
            前台登記
            <ExternalLink size={14} />
          </a>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1">
          {tabs.map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition lg:w-full ${
                active === key ? "bg-pine text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <Current refreshKey={refreshKey} onChanged={refresh} />
      </main>
    </div>
  );
}

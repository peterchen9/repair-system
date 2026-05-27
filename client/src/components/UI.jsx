import { AlertTriangle } from "lucide-react";
import { statusLabel } from "../lib/api";

export function Section({ title, actions, children }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-pine text-white hover:bg-pine/90",
    secondary: "bg-white text-slate-800 border border-slate-300 hover:bg-slate-50",
    danger: "bg-coral text-white hover:bg-coral/90",
    warning: "bg-amber text-white hover:bg-amber/90"
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }) {
  return <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function StatusBadge({ status }) {
  const tone = {
    PENDING: "bg-slate-100 text-slate-700",
    ACCEPTED: "bg-sky-100 text-sky-800",
    REPAIRING: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    UNREPAIRABLE: "bg-rose-100 text-rose-800",
    PICKED_UP: "bg-indigo-100 text-indigo-800",
    RECYCLED: "bg-zinc-200 text-zinc-800",
    DONATED: "bg-teal-100 text-teal-800",
    TRANSFERRED: "bg-cyan-100 text-cyan-800",
    CHARITY_SALE: "bg-orange-100 text-orange-800"
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone[status]}`}>{statusLabel[status] || status}</span>;
}

export function LowStock({ part }) {
  if (!part || part.quantity > part.safetyStock) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">
      <AlertTriangle size={14} />
      低庫存
    </span>
  );
}

export function Empty({ text = "目前沒有資料" }) {
  return <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">{text}</div>;
}

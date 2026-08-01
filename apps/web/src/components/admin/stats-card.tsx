export function StatsCard({
  title,
  value,
  icon,
  detail,
  tone = "emerald",
}: {
  title: string;
  value: string | number;
  icon: string;
  detail?: string;
  tone?: "emerald" | "amber" | "slate";
}) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          {detail && <p className="mt-1 text-xs text-slate-400">{detail}</p>}
        </div>
        <span className={`grid size-12 place-items-center rounded-2xl text-xl ring-1 ${toneClasses[tone]}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}

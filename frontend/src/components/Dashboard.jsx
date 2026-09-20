import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getDashboard, inr, pretty } from "../api.js";

const Card = ({ label, value, tone = "" }) => (
  <div className="bg-white rounded-xl shadow-sm p-5">
    <div className="text-sm text-slate-500">{label}</div>
    <div className={`text-3xl font-semibold mt-1 ${tone}`}>{value}</div>
  </div>
);

export default function Dashboard({ version }) {
  const [d, setD] = useState(null);
  useEffect(() => { getDashboard().then(setD).catch(console.error); }, [version]);
  if (!d) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card label="Failed revenue" value={inr(d.failed_revenue)} tone="text-rose-600" />
        <Card label="Potentially recoverable" value={inr(d.potential_recovery)} tone="text-emerald-600" />
        <Card label="Failed payments" value={`${d.failed_count} / ${d.total_transactions}`} />
        <Card label="High-priority" value={d.priority_transactions} tone="text-amber-600" />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card label="High priority" value={d.by_priority.HIGH} />
        <Card label="Medium priority" value={d.by_priority.MEDIUM} />
        <Card label="Low priority" value={d.by_priority.LOW} />
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-medium mb-3">Failure reasons</h2>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={d.failure_reasons.map((r) => ({ ...r, reason: pretty(r.reason) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="reason" /><YAxis allowDecimals={false} /><Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-slate-500">{d.note}</p>
    </div>
  );
}

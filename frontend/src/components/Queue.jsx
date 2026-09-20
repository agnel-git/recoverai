import { useEffect, useState } from "react";
import { analyze, getQueue, inr, pretty } from "../api.js";

export const PriorityBadge = ({ p }) => {
  const c = { HIGH: "bg-rose-100 text-rose-700", MEDIUM: "bg-amber-100 text-amber-700", LOW: "bg-slate-200 text-slate-600" }[p];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${c}`}>{p}</span>;
};

export default function Queue({ version, onSelect, onChanged }) {
  const [rows, setRows] = useState([]);
  const [priority, setPriority] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { getQueue(priority).then(setRows).catch(console.error); }, [priority, version]);

  const runAgent = async () => {
    setBusy(true);
    try { await analyze({ top: 15 }); onChanged(); } finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="font-medium">Priority recovery queue</h2>
        <div className="flex gap-2">
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="border rounded px-2 py-1 text-sm">
            <option value="">All priorities</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option>
          </select>
          <button onClick={runAgent} disabled={busy}
            className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded hover:bg-emerald-700 disabled:opacity-50">
            {busy ? "Analyzing…" : "Run AI agent on top 15"}
          </button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr><th className="p-3">Txn</th><th>Amount</th><th>Failure</th><th>Score</th><th>Priority</th><th>AI action</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.slice(0, 100).map((t) => (
            <tr key={t.transaction_id} onClick={() => onSelect(t.transaction_id)} className="border-t hover:bg-slate-50 cursor-pointer">
              <td className="p-3 font-mono">{t.transaction_id}</td>
              <td>{inr(t.amount)}</td>
              <td>{pretty(t.failure_reason)}</td>
              <td>{t.recovery_score}</td>
              <td><PriorityBadge p={t.priority} /></td>
              <td>{t.recommendation?.action || <span className="text-slate-400">not analyzed</span>}</td>
              <td>{t.action_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

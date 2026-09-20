import { useEffect, useState } from "react";
import { analyze, decide, getTransaction, inr, pretty } from "../api.js";
import { PriorityBadge } from "./Queue.jsx";

export default function TransactionDetail({ id, onClose, onChanged }) {
  const [t, setT] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = () => getTransaction(id).then(setT);
  useEffect(() => { load(); }, [id]);

  const run = async () => { setBusy(true); try { await analyze({ transaction_id: id }); await load(); onChanged(); } finally { setBusy(false); } };
  const choose = async (d) => { await decide(id, d); await load(); onChanged(); };

  if (!t) return null;
  const r = t.recommendation;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end" onClick={onClose}>
      <aside className="bg-white w-full max-w-md h-full overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">Transaction {t.transaction_id}</h2>
            <p className="text-sm text-slate-500">{t.name} · {t.customer_id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 text-2xl leading-none">×</button>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-500">Amount</dt><dd className="font-medium">{inr(t.amount)}</dd></div>
          <div><dt className="text-slate-500">Failure</dt><dd className="font-medium">{pretty(t.failure_reason)}</dd></div>
          <div><dt className="text-slate-500">Recovery score</dt><dd className="font-medium">{t.recovery_score}/100</dd></div>
          <div><dt className="text-slate-500">Priority</dt><dd><PriorityBadge p={t.priority} /></dd></div>
          <div><dt className="text-slate-500">History</dt><dd>{t.previous_successes} ok / {t.previous_failures} failed</dd></div>
          <div><dt className="text-slate-500">Subscription</dt><dd>{pretty(t.subscription_status)}</dd></div>
        </dl>

        <div>
          <h3 className="text-sm font-medium mb-1">Score breakdown (0–1)</h3>
          {Object.entries(t.score_breakdown).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-xs mb-1">
              <span className="w-32 text-slate-500">{pretty(k)}</span>
              <div className="flex-1 bg-slate-100 rounded h-2"><div className="bg-emerald-500 h-2 rounded" style={{ width: `${v * 100}%` }} /></div>
              <span className="w-8 text-right">{v}</span>
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-4 bg-emerald-50 space-y-2">
          <h3 className="font-medium">AI recommendation {r && <span className="text-xs text-slate-500">({r.source})</span>}</h3>
          {!r ? (
            <button onClick={run} disabled={busy} className="bg-emerald-600 text-white text-sm px-3 py-1.5 rounded disabled:opacity-50">
              {busy ? "Analyzing…" : "Analyze with AI"}
            </button>
          ) : (
            <>
              <p className="font-medium">{r.action}{r.retry_after && ` — after ${r.retry_after}`}</p>
              <p className="text-sm"><b>Why:</b> {r.reason}</p>
              <p className="text-sm"><b>Expected recovery:</b> {inr(r.expected_recovery)}</p>
              {r.message && <blockquote className="text-sm italic border-l-4 border-emerald-300 pl-3">{r.message}</blockquote>}
            </>
          )}
        </div>

        {r && (
          <div className="flex gap-2 items-center">
            <button onClick={() => choose("APPROVED")} className="bg-emerald-600 text-white px-4 py-2 rounded">Approve</button>
            <button onClick={() => choose("REJECTED")} className="bg-slate-200 px-4 py-2 rounded">Reject</button>
            <span className="text-sm text-slate-500">Status: {t.action_status}</span>
          </div>
        )}
      </aside>
    </div>
  );
}

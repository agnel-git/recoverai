import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { inr, simulate } from "../api.js";

export default function Simulator() {
  const [threshold, setThreshold] = useState(70);
  const [current, setCurrent] = useState(null);
  const [compare, setCompare] = useState([]);

  useEffect(() => { simulate([threshold]).then((r) => setCurrent(r[0])); }, [threshold]);
  useEffect(() => { simulate([40, 50, 60, 70, 80, 90]).then(setCompare); }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-medium mb-3">What-if simulator: only act on transactions with score ≥ {threshold}</h2>
        <input type="range" min="0" max="100" value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="w-full" />
        {current && (
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div><div className="text-3xl font-semibold">{current.transactions_selected}</div><div className="text-sm text-slate-500">transactions selected</div></div>
            <div><div className="text-3xl font-semibold text-emerald-600">{inr(current.potential_recovery)}</div><div className="text-sm text-slate-500">potential recovery</div></div>
            <div><div className="text-3xl font-semibold">{inr(current.failed_amount_covered)}</div><div className="text-sm text-slate-500">failed amount covered</div></div>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-medium mb-3">Threshold comparison</h2>
        <div style={{ height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={compare.map((c) => ({ ...c, name: `≥ ${c.threshold}` }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" /><YAxis yAxisId="l" /><YAxis yAxisId="r" orientation="right" />
              <Tooltip /><Legend />
              <Bar yAxisId="l" dataKey="transactions_selected" name="Transactions" fill="#64748b" />
              <Bar yAxisId="r" dataKey="potential_recovery" name="Potential recovery (₹)" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

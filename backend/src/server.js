// PERSON 3 - REST API. Run: npm install && npm run dev
import "dotenv/config";
import express from "express";
import cors from "cors";
import { analyzeTransaction } from "../../ai-agent/agent.js";
import { failed, analysis, actions, byId, withState, totalTransactions } from "./store.js";

const app = express();
app.use(cors());
app.use(express.json());

const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

// ---- Dashboard summary ----
app.get("/api/dashboard", (_req, res) => {
  const byPriority = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  const reasons = {};
  failed.forEach((t) => {
    byPriority[t.priority]++;
    reasons[t.failure_reason] = (reasons[t.failure_reason] || 0) + 1;
  });
  res.json({
    total_transactions: totalTransactions,
    failed_count: failed.length,
    failed_revenue: Math.round(sum(failed, (t) => t.amount)),
    potential_recovery: Math.round(sum(failed, (t) => t.expected_recovery)),
    priority_transactions: byPriority.HIGH,
    by_priority: byPriority,
    failure_reasons: Object.entries(reasons).map(([reason, count]) => ({ reason, count })),
    note: "Prototype model estimates on synthetic data, not guaranteed recovery.",
  });
});

// ---- Lists ----
app.get("/api/failed-transactions", (req, res) => {
  const { priority } = req.query;
  const rows = failed
    .filter((t) => !priority || t.priority === priority)
    .sort((a, b) => b.expected_recovery - a.expected_recovery)   // priority queue order
    .map(withState);
  res.json(rows);
});
app.get("/api/transactions", (_req, res) => res.json(failed.map(withState)));
app.get("/api/recovery-analysis", (_req, res) =>
  res.json([...analysis.entries()].map(([transaction_id, r]) => ({ transaction_id, ...r }))));

app.get("/api/transactions/:id", (req, res) => {
  const t = byId(req.params.id);
  t ? res.json(withState(t)) : res.status(404).json({ error: "not found" });
});

// ---- Run the AI agent: { transaction_id } for one, or { top: 10 } for the best N by expected recovery ----
app.post("/api/analyze", async (req, res) => {
  const { transaction_id, top } = req.body || {};
  let targets = [];
  if (transaction_id) {
    const t = byId(transaction_id);
    if (!t) return res.status(404).json({ error: "not found" });
    targets = [t];
  } else {
    targets = [...failed].sort((a, b) => b.expected_recovery - a.expected_recovery).slice(0, Math.min(top || 10, 50));
  }
  const out = [];
  for (const t of targets) {
    const rec = await analyzeTransaction(t);
    analysis.set(t.transaction_id, rec);
    out.push({ transaction_id: t.transaction_id, ...rec });
  }
  res.json(out);
});

// ---- Merchant approval: { transaction_id, decision: "APPROVED" | "REJECTED" } (never charges a real card) ----
app.post("/api/recovery-action", (req, res) => {
  const { transaction_id, decision } = req.body || {};
  if (!byId(transaction_id)) return res.status(404).json({ error: "not found" });
  if (!["APPROVED", "REJECTED"].includes(decision)) return res.status(400).json({ error: "bad decision" });
  actions.set(transaction_id, { status: decision, timestamp: new Date().toISOString() });
  res.json({ transaction_id, status: decision });
});

// ---- What-if simulator: { threshold: 80 } ----
app.post("/api/simulator", (req, res) => {
  const thresholds = req.body?.thresholds || [req.body?.threshold ?? 70];
  res.json(thresholds.map((th) => {
    const sel = failed.filter((t) => t.recovery_score >= th);
    return {
      threshold: th,
      transactions_selected: sel.length,
      potential_recovery: Math.round(sum(sel, (t) => t.expected_recovery)),
      failed_amount_covered: Math.round(sum(sel, (t) => t.amount)),
    };
  }));
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`RecoverAI API on http://localhost:${port}`));

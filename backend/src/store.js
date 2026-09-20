// PERSON 3 - data access layer. In-memory for the hackathon; swap internals for Supabase/Postgres later
// without touching server.js.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(here, "../../data/scored.json");

if (!fs.existsSync(file)) {
  console.error("data/scored.json not found. Run: cd data-scoring && python generate_data.py && python run_pipeline.py");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(file, "utf8"));
export const totalTransactions = raw.total_transactions;
export const failed = raw.failed;                 // scored failed transactions
export const analysis = new Map();                // transaction_id -> AI recommendation
export const actions = new Map();                 // transaction_id -> { status, timestamp }

export const byId = (id) => failed.find((t) => t.transaction_id === id);
export const withState = (t) => ({
  ...t,
  recommendation: analysis.get(t.transaction_id) || null,
  action_status: actions.get(t.transaction_id)?.status || "PENDING",
});

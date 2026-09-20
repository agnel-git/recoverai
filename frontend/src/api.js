// PERSON 4 - thin API client. Every call goes through the Vite proxy to the Express backend.
const j = async (url, opts) => {
  const r = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opts });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
};
const post = (url, body) => j(url, { method: "POST", body: JSON.stringify(body) });

export const getDashboard = () => j("/api/dashboard");
export const getQueue = (priority) => j(`/api/failed-transactions${priority ? `?priority=${priority}` : ""}`);
export const getTransaction = (id) => j(`/api/transactions/${id}`);
export const analyze = (body) => post("/api/analyze", body);
export const decide = (transaction_id, decision) => post("/api/recovery-action", { transaction_id, decision });
export const simulate = (thresholds) => post("/api/simulator", { thresholds });

export const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
export const pretty = (s) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

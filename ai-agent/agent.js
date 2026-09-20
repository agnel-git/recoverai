// PERSON 2 - AI Recovery Agent.
// Input : one scored transaction (from Person 1's scored.json)
// Output: { action, priority, retry_after, reason, message, expected_recovery, source }
// Works WITHOUT an API key (rule-based fallback), so the demo never breaks.

const ACTIONS = ["Retry payment", "Ask customer to update payment details", "Escalate to account manager",
  "Avoid repeated retry", "Notify merchant"];

// ---------- Reason-aware strategy (also used as fallback) ----------
export function ruleBasedRecommendation(t) {
  const score = t.recovery_score;
  let action, retry_after = null, reason;

  if (t.amount >= 10000 && score >= 60) {
    action = "Escalate to account manager";
    reason = `High-value payment (₹${t.amount.toLocaleString("en-IN")}) with a decent recovery score of ${score}; worth personal follow-up.`;
  } else if (t.failure_reason === "expired_card") {
    action = "Ask customer to update payment details";
    reason = "The card has expired, so retrying will fail until the customer adds a new card.";
  } else if (t.failure_reason === "gateway_error") {
    action = "Retry payment"; retry_after = "1 hour";
    reason = "Gateway errors are usually temporary and not the customer's fault, so a quick retry is low risk.";
  } else if (t.failure_reason === "insufficient_funds" && score >= 40) {
    action = "Retry payment"; retry_after = "48 hours";
    reason = "Funds may be available after a short wait (e.g. payday); retrying immediately would likely fail again.";
  } else if (t.failure_reason === "do_not_honor" || score < 40) {
    action = "Avoid repeated retry";
    reason = `Low recovery probability (score ${score}); repeated retries waste effort and may annoy the customer.`;
  } else if (score >= 65) {
    action = "Retry payment"; retry_after = "6 hours";
    reason = `Customer pays successfully ${Math.round(t.success_rate * 100)}% of the time, so this looks like a one-off failure.`;
  } else {
    action = "Notify merchant";
    reason = "Signals are mixed; a human should decide.";
  }
  return {
    action,
    priority: t.priority,
    retry_after,
    reason,
    message: buildMessage(t, action),
    expected_recovery: Math.round(t.amount * t.recovery_probability),
    source: "rules",
  };
}

function buildMessage(t, action) {
  const first = (t.name || "there").split(" ")[0];
  const amt = `₹${Math.round(t.amount).toLocaleString("en-IN")}`;
  if (action.startsWith("Ask customer"))
    return `Hi ${first}, your payment of ${amt} could not be processed because your card has expired. Please update your payment details to keep your service uninterrupted.`;
  if (action.startsWith("Avoid") || action.startsWith("Notify")) return "";
  return `Hi ${first}, we couldn't process your recent payment of ${amt}. We'll try again shortly — no action needed unless you'd like to update your payment method.`;
}

// ---------- LLM layer (Gemini REST by default; swap fetch for OpenAI/Groq if needed) ----------
const SYSTEM = `You are a payment recovery assistant for a merchant.
Analyse ONE failed transaction and recommend a recovery action.
Rules: use ONLY the provided data, never invent facts. The recovery_score was computed already; do not change it.
Return ONLY JSON: {"action": one of ${JSON.stringify(ACTIONS)}, "retry_after": string|null, "reason": string (max 2 sentences),
"message": string (short, polite customer message; empty string if no customer contact), "expected_recovery": number (INR)}`;

async function callGemini(t) {
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const facts = {
    amount_inr: t.amount, failure_reason: t.failure_reason, previous_successes: t.previous_successes,
    previous_failures: t.previous_failures, success_rate: t.success_rate, days_since_last_success: t.days_since_last_success,
    hours_since_failure: t.hours_since_failure, subscription_status: t.subscription_status,
    customer_lifetime_value_inr: t.lifetime_value, recovery_score: t.recovery_score,
    recovery_probability: t.recovery_probability, customer_first_name: (t.name || "").split(" ")[0],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(facts) }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    }),
  });
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

export async function analyzeTransaction(t) {
  const fallback = ruleBasedRecommendation(t);
  if (!process.env.GEMINI_API_KEY) return fallback;
  try {
    const out = await callGemini(t);
    if (!ACTIONS.includes(out.action)) throw new Error("invalid action from LLM");
    return {
      action: out.action,
      priority: t.priority,                       // priority stays deterministic
      retry_after: out.retry_after ?? null,
      reason: String(out.reason || fallback.reason),
      message: String(out.message ?? fallback.message),
      expected_recovery: Number.isFinite(out.expected_recovery) ? Math.round(out.expected_recovery) : fallback.expected_recovery,
      source: "llm",
    };
  } catch (e) {
    console.warn(`[agent] LLM failed for ${t.transaction_id} (${e.message}); using rules`);
    return fallback;
  }
}

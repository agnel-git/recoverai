"""PERSON 1 - Steps 2-3: cleaning, behaviour metrics, weighted Recovery Score (0-100).

Not an ML model - an explainable weighted formula, exactly as the Round 2 abstract proposes.
"""
import numpy as np
import pandas as pd

VALID_REASONS = {"card_declined", "insufficient_funds", "expired_card", "gateway_error", "do_not_honor"}

# How "recoverable" each failure type tends to be (0-1). Tune these!
FAILURE_TYPE_SCORE = {
    "gateway_error": 0.90,       # temporary, retry usually works
    "expired_card": 0.70,        # recoverable once the customer updates the card
    "insufficient_funds": 0.55,  # retry later (e.g. after salary day)
    "card_declined": 0.50,
    "do_not_honor": 0.30,        # bank refusal, repeated retries rarely help
}

WEIGHTS = {
    "payment_history": 0.30,
    "customer_value": 0.20,
    "failure_type": 0.20,
    "recency": 0.15,
    "recovery_history": 0.15,
}


def clean(txns: pd.DataFrame) -> pd.DataFrame:
    df = txns.drop_duplicates().copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["timestamp", "customer_id", "amount"])
    df = df[df["amount"] > 0]
    df["failure_reason"] = df["failure_reason"].fillna("")
    bad = (df["status"] == "failed") & (~df["failure_reason"].isin(VALID_REASONS))
    df.loc[bad, "failure_reason"] = "card_declined"  # safest default for unknown reasons
    return df


def score_failed(txns: pd.DataFrame, customers: pd.DataFrame, now=None) -> pd.DataFrame:
    now = now or pd.Timestamp.now()
    failed = txns[txns["status"] == "failed"].merge(customers, on="customer_id", how="left")

    total = failed["previous_successes"] + failed["previous_failures"]
    failed["success_rate"] = ((failed["previous_successes"] + 1) / (total + 2)).round(3)  # smoothed

    f = pd.DataFrame(index=failed.index)
    f["payment_history"] = failed["success_rate"]
    f["customer_value"] = (failed["lifetime_value"] / 100_000).clip(0, 1)
    f["failure_type"] = failed["failure_reason"].map(FAILURE_TYPE_SCORE).fillna(0.4)
    hours = (now - failed["timestamp"]).dt.total_seconds() / 3600
    failed["hours_since_failure"] = hours.round(1)
    f["recency"] = (1 - hours / (24 * 30)).clip(0, 1)
    attempts = failed["previous_recovery_attempts"]
    f["recovery_history"] = np.where(attempts > 0, failed["previous_recoveries"] / attempts.replace(0, 1), 0.5)

    score = sum(f[k] * w for k, w in WEIGHTS.items()) * 100
    # Cancelled subscriptions are much less likely to be worth chasing.
    score = np.where(failed["subscription_status"] == "cancelled", score * 0.7, score)
    failed["recovery_score"] = np.round(score).astype(int)
    failed["recovery_probability"] = (failed["recovery_score"] / 100).round(2)
    failed["priority"] = pd.cut(failed["recovery_score"], [-1, 49, 74, 100], labels=["LOW", "MEDIUM", "HIGH"]).astype(str)
    failed["expected_recovery"] = (failed["amount"] * failed["recovery_probability"]).round(0)
    failed["score_breakdown"] = f.round(2).to_dict("records")
    return failed

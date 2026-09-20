"""PERSON 1 - Step 1: generate a synthetic merchant dataset (no real payment data needed)."""
import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

random.seed(42)
np.random.seed(42)

OUT = Path(__file__).resolve().parent.parent / "data"
OUT.mkdir(exist_ok=True)

N_CUSTOMERS, N_TXNS = 200, 1000
NOW = datetime.now()
FAILURE_REASONS = ["card_declined", "insufficient_funds", "expired_card", "gateway_error", "do_not_honor"]
FAILURE_WEIGHTS = [0.32, 0.28, 0.16, 0.14, 0.10]


def make_customers():
    rows = []
    for i in range(1, N_CUSTOMERS + 1):
        successes = int(np.random.poisson(6))
        failures = int(np.random.poisson(1.2))
        attempts = int(np.random.poisson(1.5))
        rows.append({
            "customer_id": f"C{1000 + i}",
            "name": f"Customer {i}",
            "email": f"customer{i}@example.com",
            "lifetime_value": int(np.random.lognormal(mean=10.2, sigma=0.9)),  # INR
            "subscription_status": random.choice(["active", "active", "active", "paused", "cancelled"]),
            "previous_successes": successes,
            "previous_failures": failures,
            "previous_recovery_attempts": attempts,
            "previous_recoveries": int(np.random.binomial(attempts, 0.55)) if attempts else 0,
            "days_since_last_success": int(np.random.exponential(15)),
        })
    return pd.DataFrame(rows)


def make_transactions(customers):
    rows = []
    for i in range(1, N_TXNS + 1):
        c = customers.sample(1).iloc[0]
        failed = random.random() < 0.27
        rows.append({
            "transaction_id": f"T{i:04d}",
            "customer_id": c.customer_id,
            "amount": round(float(np.random.lognormal(mean=7.3, sigma=1.0)), 2),  # INR
            "status": "failed" if failed else "success",
            "failure_reason": random.choices(FAILURE_REASONS, FAILURE_WEIGHTS)[0] if failed else "",
            "timestamp": (NOW - timedelta(hours=random.randint(1, 24 * 20))).isoformat(timespec="seconds"),
        })
    df = pd.DataFrame(rows)
    # Inject some dirty rows so the cleaning step has something to do (Person 1 demo value).
    dirty = df.sample(12, random_state=1).copy()
    dirty.loc[dirty.index[:4], "amount"] = -50
    dirty.loc[dirty.index[4:8], "failure_reason"] = "???"
    df = pd.concat([df, dirty.iloc[8:]], ignore_index=True)  # 4 exact duplicates
    return df


if __name__ == "__main__":
    customers = make_customers()
    txns = make_transactions(customers)
    customers.to_csv(OUT / "customers.csv", index=False)
    txns.to_csv(OUT / "transactions.csv", index=False)
    print(f"customers: {len(customers)}  transactions: {len(txns)}  -> {OUT}")

"""Run: python run_pipeline.py   ->  writes ../data/scored.json (the backend loads this)."""
import json

import pandas as pd

from generate_data import OUT, make_customers, make_transactions
from scoring import clean, score_failed

if __name__ == "__main__":
    if not (OUT / "transactions.csv").exists():
        customers = make_customers()
        customers.to_csv(OUT / "customers.csv", index=False)
        make_transactions(customers).to_csv(OUT / "transactions.csv", index=False)

    customers = pd.read_csv(OUT / "customers.csv")
    txns = clean(pd.read_csv(OUT / "transactions.csv"))
    scored = score_failed(txns, customers)
    scored["timestamp"] = scored["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%S")

    cols = ["transaction_id", "customer_id", "name", "amount", "failure_reason", "timestamp",
            "hours_since_failure", "previous_successes", "previous_failures", "lifetime_value",
            "subscription_status", "days_since_last_success", "success_rate",
            "recovery_score", "recovery_probability", "priority", "expected_recovery", "score_breakdown"]
    records = scored[cols].to_dict("records")
    (OUT / "scored.json").write_text(json.dumps({
        "total_transactions": int(len(txns)),
        "failed": records,
    }, indent=2, default=str))
    print(f"scored {len(records)} failed transactions of {len(txns)} -> {OUT / 'scored.json'}")
    print(scored["priority"].value_counts().to_string())

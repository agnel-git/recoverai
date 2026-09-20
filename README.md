# RecoverAI — AI Revenue Recovery Agent (hackathon starter)

```
data-scoring/   PERSON 1  Python: synthetic data, cleaning, weighted Recovery Score  -> data/scored.json
ai-agent/       PERSON 2  agent.js: reason-aware rules + Gemini LLM (falls back to rules without a key)
backend/        PERSON 3  Express REST API (+ schema.sql for Postgres/Supabase)
frontend/       PERSON 4  React + Vite + Tailwind v4 + Recharts dashboard, queue, simulator, approval
data/           generated CSV/JSON
```

## Run it
```bash
# 1. data + scores (Person 1)
cd data-scoring && pip install -r requirements.txt
python generate_data.py && python run_pipeline.py

# 2. API (Person 3) - optional: cp .env.example .env and add GEMINI_API_KEY
cd ../backend && npm install && npm run dev        # http://localhost:4000

# 3. UI (Person 4)
cd ../frontend && npm install && npm run dev       # http://localhost:5173
```

## Demo flow
Dashboard -> Priority Queue -> "Run AI agent on top 15" -> click a row (score breakdown, AI reason, customer message)
-> Approve/Reject (only sets a status, never charges a card) -> Simulator (threshold slider).

## Contracts between modules
- P1 -> P3: `data/scored.json` = `{ total_transactions, failed: [ {transaction_id, amount, failure_reason, recovery_score, recovery_probability, priority, expected_recovery, ...} ] }`
- P2 -> P3: `analyzeTransaction(t) -> { action, priority, retry_after, reason, message, expected_recovery, source }`
- P3 -> P4: endpoints in `backend/src/server.js` (`/api/dashboard`, `/api/failed-transactions`, `/api/transactions/:id`, `/api/analyze`, `/api/recovery-action`, `/api/simulator`)

## Next steps per person
- P1: tune `WEIGHTS` / `FAILURE_TYPE_SCORE` in `scoring.py`; add more behaviour metrics.
- P2: improve the prompt in `agent.js`; add A/B of rules vs LLM.
- P3: replace `store.js` with Supabase queries using `schema.sql`.
- P4: polish UI, add customer view, loading/error states.

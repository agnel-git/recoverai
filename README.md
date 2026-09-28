# RecoverAI — AI Revenue Recovery Agent

> An AI-assisted system for analyzing failed payments, prioritizing recovery opportunities, and recommending recovery actions.

## 🚀 Live Demo

**Frontend:** [Open RecoverAI] https://recoverai-one.vercel.app/

**Backend API:** [RecoverAI API](https://recoverai-backend-tkig.onrender.com)

---

## 📌 Overview

RecoverAI is an AI-assisted payment recovery prototype designed to help businesses identify failed transactions that have a higher likelihood of recovery.

The system:

- Generates and processes failed-payment data
- Calculates a Recovery Score and recovery probability
- Prioritizes failed transactions
- Uses an AI agent to analyze failed payments
- Recommends an appropriate recovery action
- Generates a customer-facing recovery message
- Provides a dashboard for monitoring recovery opportunities
- Includes a simulator for experimenting with recovery thresholds

> **Note:** RecoverAI is currently a prototype using synthetic transaction data. It does not actually charge cards or send real customer messages.

---

## 🏗️ Project Structure

```text
RecoverAI/
│
├── data-scoring/
│   ├── generate_data.py
│   ├── run_pipeline.py
│   └── scoring.py
│
├── ai-agent/
│   └── agent.js
│
├── backend/
│   ├── src/
│   ├── schema.sql
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── vite.config.js
│   └── package.json
│
├── data/
│   ├── transactions.csv
│   └── scored.json
│
└── README.md
-- PERSON 3 - PostgreSQL / Supabase schema. The starter server keeps data in memory (store.js);
-- when you have time, replace store.js functions with queries against these tables.
create table customers (
  customer_id text primary key, name text, email text,
  lifetime_value numeric, subscription_status text
);
create table transactions (
  transaction_id text primary key, customer_id text references customers,
  amount numeric, status text, failure_reason text, "timestamp" timestamptz
);
create table payment_history (
  history_id serial primary key, customer_id text references customers,
  successful_payments int, failed_payments int, average_amount numeric, last_success timestamptz
);
create table recovery_analysis (
  transaction_id text primary key references transactions,
  recovery_score int, priority text, recommended_action text, retry_after text,
  expected_recovery numeric, reason text, customer_message text, source text
);
create table recovery_actions (
  action_id serial primary key, transaction_id text references transactions,
  action text, status text default 'PENDING', approved_by_merchant boolean, "timestamp" timestamptz default now()
);

# Insurance Policy & Accounting Module

A small backend covering policy issuance, payments, and a double-entry
accounting ledger, built with Node.js, Express, and MySQL.

## Tech stack

- Node.js + Express 4
- MySQL 8 / MariaDB (via **Sequelize** ORM, `mysql2` as the underlying driver)
- Repository layer wraps every Sequelize model call, so the JOIN/GROUP BY/
  SUM/transaction requirements are still explicit and easy to point to.

## Setup


Setup `.env`

```bash
PORT=5000
DB_URL=""
```

Then Run Commands

```bash
npm install
npm run db:migrate           # Sequelize sync() creates all tables from src/models/
npm run db:seed              # seeds chart of accounts + one sample customer
npm start                    # http://localhost:3000
```


`GET /health` confirms the server is up without touching the database.

## Project structure

```
src/
  config/database.js      Sequelize instance
  models/                  one file per table + index.js wiring associations
  db/migrate.js            sequelize.sync({ alter: true }) - schema from models
  db/seed.js                chart of accounts + sample customer via findOrCreate
  routes/                  thin Express routers
  controllers/             HTTP <-> service translation, no business logic
  services/                accounting logic, validation, transactions
  repositories/             all Sequelize model calls live here
  utils/                    AppError, validators, money rounding
```

Request flow: **routes → controllers → services → repositories → database**.
Controllers never touch SQL; services never touch `req`/`res`.

## Database design

| Table | Purpose |
|---|---|
| `customers` | Policyholders |
| `accounts` | Chart of accounts (Cash, Receivable, GST Payable, Premium Income) — static reference data |
| `policies` | One row per policy, with the computed premium/GST/total snapshot |
| `policy_transactions` | Insert-only audit trail of every business event on a policy |
| `payments` | Insert-only payment history; reversals are new rows, never edits |
| `ledger_entries` | Double-entry rows; `debit`/`credit` per account per event |

All financial tables are `INSERT ONLY`. There is no `.update()` or
`.destroy()` anywhere in the business logic (`repositories/*.js` — check
for yourself, the calls don't appear). `LedgerEntry` also has a Sequelize
model-level validation (`exactlyOneSide` in `models/LedgerEntry.js`) that
rejects any row unless it is a debit *or* a credit, never both — the ORM
equivalent of a `CHECK` constraint, run explicitly on every `bulkCreate`
via `{ validate: true }` since Sequelize skips per-row validation on bulk
inserts by default.

## Accounting logic

**GST calculation** (`services/policyService.js::calculatePremiumBreakdown`):
premium ₹10,000 + 18% GST → ₹1,800 GST → ₹11,800 total. Matches the
assignment's example exactly (verified in testing).

**On policy creation**, one balanced ledger event is posted:

| Account | Debit | Credit |
|---|---|---|
| Customer Receivable | 11,800 | |
| Premium Income | | 10,000 |
| GST Payable | | 1,800 |

**On payment**, another balanced event is posted:

| Account | Debit | Credit |
|---|---|---|
| Cash / Bank | amount | |
| Customer Receivable | | amount |

**Outstanding balance** is never stored — it's derived on every read as
`policy.total_amount - SUM(payments.amount)` for that policy
(`policyService.getOutstanding`). Because reversal rows carry a negative
amount, a reversed payment nets itself out of that sum automatically.

**Balance guard**: `ledgerService.postEntries()` calls `assertBalanced()`
before every insert, which sums debits and credits to the nearest paisa
and throws (rolling back the transaction) if they don't match. No
unbalanced ledger can reach the database.

## Insert-only corrections

If a payment turns out to be wrong, `POST /payments/:id/reverse` inserts:
1. A new `payments` row with a **negative** amount, linked back via
   `reverses_payment_id` (the original row is untouched).
2. A `PAYMENT_REVERSED` row in `policy_transactions`.
3. A mirror-image ledger entry (Dr Receivable / Cr Cash) that unwinds
   the original posting.

The full history — including the mistake and its correction — stays
queryable forever via `GET /policies/:id/ledger`.

## Transactions

Every multi-table write (`createPolicy`, `recordPayment`,
`reversePayment`) runs inside `ledgerService.runInTransaction()`, a
thin wrapper around Sequelize's **managed transaction**
(`sequelize.transaction(async (t) => ...)`) — it commits automatically
if the callback resolves and rolls back automatically if anything
throws (a failed validation, a DB error, the unbalanced-ledger check).
No partial row is ever left behind. `recordPayment` also takes a row
lock (`lock: transaction.LOCK.UPDATE` in `policyRepository.findByIdForUpdate`,
Sequelize's `SELECT ... FOR UPDATE`) on the policy so two simultaneous
payments against the same policy can't both read the same outstanding
balance and both get approved.

## API reference

### `POST /customers`
```json
{ "name": "Ravi Kumar", "email": "ravi@example.com", "phone": "9876543210" }
```

### `POST /policies`
```json
{ "policyNumber": "POL-1001", "customerId": 1, "premiumAmount": 10000, "gstRate": 18 }
```
`gstRate` is optional (defaults to 18).

### `POST /payments`
```json
{ "policyId": 1, "amount": 5000, "method": "UPI" }
```
Rejects: unknown policy, non-active policy, amount ≤ 0, amount >
outstanding balance.

### `POST /payments/:id/reverse` (bonus, not in the required list)
```json
{ "reason": "wrong amount entered" }
```

### `GET /policies/:id`
Policy header info plus derived `netPaid` / `outstanding`.

### `GET /policies/:id/ledger`
Every ledger row for the policy, in order, with account name/code joined in.

### `GET /policies/:id/summary`
Per-account totals (`SUM`/`GROUP BY` across `ledger_entries` joined to
`accounts`), the derived outstanding balance, and the raw
`policy_transactions` + `payments` history.

## Validation covered

- Duplicate policy numbers (`409`)
- Duplicate customer email (`409`)
- Unknown customer/policy id (`404`)
- Non-positive amounts (`422`)
- Overpayment beyond outstanding balance (`422`)
- Unbalanced ledger entries — defensive, should be unreachable given the
  service logic, but guarded anyway (`500` + rollback)
- FK violations / duplicate-key errors from MySQL itself are mapped to
  `422`/`409` in the central error handler as a second line of defense

## Testing

`postman_collection.json` in the repo root has all endpoints pre-filled
with the assignment's example numbers — import it into Postman or
Thunder Client. A suggested manual run-through:

1. `POST /customers` → note the returned `id`
2. `POST /policies` with `premiumAmount: 10000` → confirm `totalAmount: 11800`
3. `GET /policies/:id/ledger` → confirm 3 balanced rows
4. `POST /payments` with `amount: 5000` → confirm `outstanding: 6800`
5. `POST /payments` with `amount: 7000` (exceeds new outstanding) → confirm `422`
6. `POST /payments/:id/reverse` on the first payment → confirm outstanding goes back up, original row unchanged
7. `GET /policies/:id/summary` → confirm per-account SUMs reconcile

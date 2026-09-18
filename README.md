# NUVIA — Global Payments Platform

> "Global payments. One intelligent rail."

Nuvia is a B2B global payments platform built natively on the Arc blockchain with USDC as the settlement currency. Blockchain complexity is abstracted from end users — they see **payments**, **amounts**, and **statuses**, not wallets and gas.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React + TypeScript + wagmi)                           │
│  ├── Landing page  (public)                                     │
│  └── Dashboard (protected routes)                               │
│      ├── Overview · Payments · Beneficiaries                    │
│      ├── Wallet · Activity · API Docs · Settings                │
│      └── CreatePayment (6-step modal, wagmi ERC-20 transfer)    │
├────────────────────┬────────────────────────────────────────────┤
│  Vite /api proxy   │  Express API server (port 3001)            │
│  (dev only)        │  ├── POST /v1/payments                     │
│                    │  ├── GET  /v1/payments/:id                 │
│                    │  ├── GET  /v1/beneficiaries                 │
│                    │  ├── POST /v1/beneficiaries                 │
│                    │  ├── GET  /v1/wallet/balance               │
│                    │  └── GET  /v1/activity                     │
├────────────────────┴────────────────────────────────────────────┤
│  Bun SQLite (nuvia.db)                                          │
│  organizations · users · payments · transactions ·              │
│  beneficiaries · wallets · balances · webhook_events ·          │
│  audit_logs                                                      │
├─────────────────────────────────────────────────────────────────┤
│  Arc Testnet (Arc blockchain) — USDC ERC-20 settlement          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) >= 1.1.0
- Node 20+ (for tooling only)
- A browser wallet (MetaMask or any injected wallet) — optional in demo mode

### 1. Install dependencies
```bash
bun install
```

### 2. Configure environment
```bash
cp env.example .env
# Edit .env if needed (defaults work for demo/testnet)
```

### 3. Start (frontend + backend together)
```bash
bun run start
```

Or start them separately:
```bash
# Terminal 1 — API server (port 3001)
bun run server

# Terminal 2 — Vite dev server (port 5173)
bun run dev
```

### 4. Open
- App: http://localhost:5173
- API health: http://localhost:3001/health

---

## Payment Lifecycle

```
DRAFT → QUOTED → PENDING_APPROVAL → PROCESSING → SUBMITTED → CONFIRMED
                                                             ↘ FAILED
                                                 ↘ CANCELLED
```

Every state transition emits a webhook event (`payment.created`, `payment.confirmed`, etc.) stored in `webhook_events` and logged in `audit_logs`.

---

## Demo Mode

When no wallet is connected, NUVIA runs in **demo mode**:
- Payment records are created in the database with real lifecycle transitions
- A fake transaction hash is generated (clearly marked as DEMO/TESTNET)
- No real funds are moved

Connect an injected wallet to Arc Testnet for live on-chain USDC transfers.

Get testnet USDC from the Arc Studio sidebar ("Get test USDC").

---

## Production Readiness

| Component | Status |
|-----------|--------|
| Payment CRUD + lifecycle | ✅ Production-ready |
| Beneficiary management | ✅ Production-ready |
| Audit logs | ✅ Production-ready |
| Webhook event store | ✅ Production-ready (delivery TBD) |
| Idempotency keys | ✅ Production-ready |
| Role-based access (demo: owner) | ⚠️ Demo — needs real auth |
| On-chain USDC transfer (wagmi) | ✅ Arc Testnet live |
| Database (SQLite) | ⚠️ Demo — swap for Postgres in production |
| Fiat on/off-ramp | 🔲 Roadmap — FiatProvider abstraction scaffolded |
| Multi-org / real auth | 🔲 Roadmap — JWT or session layer needed |
| Webhook delivery (HTTP POST) | 🔲 Roadmap — store-and-forward queue |

---

## API Reference

See the **API** tab in the dashboard, or `src/pages/ApiDocs.tsx`.

Base URL (local): `http://localhost:3001/v1`

Key endpoints:
- `POST /v1/payments` — create payment (idempotency_key supported)
- `GET  /v1/payments/:id` — get payment + transaction
- `POST /v1/beneficiaries` — create beneficiary
- `GET  /v1/wallet/balance` — USDC balance

---

## Security Notes

- No private keys in source code or environment files
- All amounts treated as strings to avoid floating-point precision loss
- Wallet addresses validated with regex before database insertion
- Rate limiting (200 req/min per IP) on all API routes
- Organization isolation on every query (`WHERE org_id = ?`)
- Idempotency keys prevent duplicate payments on retry
- Audit log records every state transition and entity mutation

In production: replace demo auth with JWT + short-lived tokens, use Postgres with connection pooling, add HTTPS, and enforce CSP headers.

---

## Fiat Provider Abstraction

The system is architected to accept fiat rail providers via a `FiatProvider` interface (see `server/services/` — scaffolded for v2):

```typescript
interface FiatProvider {
  createQuote(from: string, to: string, amount: string): Promise<Quote>;
  createOnRamp(quoteId: string, userDetails: object): Promise<OnRampSession>;
  createOffRamp(quoteId: string, destination: object): Promise<OffRampSession>;
  getStatus(sessionId: string): Promise<FiatSessionStatus>;
}
```

Supported rails (roadmap): BRL, EUR, USD → USDC → Arc → USDC → fiat.

---

## Testing

```bash
# Type-check
bun run typecheck

# Lint
bun run lint

# Both
bun run check
```

Integration tests (payment lifecycle): see `contracts/test-integration/`.

---

Built with Arc Studio — https://studio.arc.io

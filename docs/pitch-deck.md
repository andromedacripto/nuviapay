# NUVIA
## Global Payments. One Intelligent Rail.

*Investor Pitch Deck — Mainnet Edition*
*September 2026 — Confidential*

---

## SLIDE 1 — Cover

# NUVIA
### Business payments powered by stablecoins.

**"Move money globally. Without the complexity."**

nuvia.io · contact@nuvia.io

---

## SLIDE 2 — The Problem

### Global B2B payments are broken.

Businesses today face:

- **3–5 business days** to settle international payments via SWIFT
- **2–7% fees** between banking intermediaries, FX spreads, and correspondent banks
- **Opaque pricing** — final cost unknown until settlement
- **Fragmented infrastructure** — different providers per corridor, each with different APIs and compliance requirements
- **No real-time visibility** — businesses can't track payment status until it's done

> **$150 trillion** in B2B payments are processed globally each year.
> The infrastructure powering them was built in the 1970s.

---

## SLIDE 3 — The Opportunity

### The stablecoin moment has arrived.

| | Traditional Rails | Nuvia / Stablecoin Rails |
|---|---|---|
| Settlement time | 1–5 business days | < 1 second |
| Cost | 2–7% | < 0.1% |
| Availability | Business hours | 24/7/365 |
| Transparency | Opaque | Full onchain visibility |
| Programmability | None | Native |

- **$27.6T** in stablecoin transaction volume in 2025 (up 3x YoY)
- **USDC** is the world's most trusted regulated stablecoin, issued by Circle
- **Arc** delivers sub-second finality with USDC as the native gas token — purpose-built for payments

---

## SLIDE 4 — The Solution

### Nuvia is the business interface for the new payment rail.

Nuvia gives companies a **simple, familiar dashboard** to send global payments — powered by USDC and Arc under the hood.

**The user experience:**
> "Send $50,000 to our supplier in Singapore."
> Done in under 1 second. Receipt with blockchain proof. No banks. No delays.

**The infrastructure:**
> USDC on Arc. Near-instant. Programmable. Auditable. Always on.

Nuvia abstracts 100% of the blockchain complexity.
Businesses never touch wallets, gas, or private keys.

---

## SLIDE 5 — Product

### A premium B2B payments platform.

**Dashboard**
- Overview with real-time balance, payment volume, and network status
- Payment history with full lifecycle tracking

**Payments**
- Multi-step payment flow: Amount → Beneficiary → Review → Confirm → Settlement → Receipt
- Real on-chain USDC transfer on Arc at confirmation
- Transaction hash and explorer link on every receipt
- 6-state lifecycle: Draft → Quoted → Pending → Processing → Submitted → Confirmed

**Beneficiary Management**
- Save, label, and manage payment recipients
- Wallet address validation

**Wallet**
- Live USDC balance from Arc
- Send and receive USDC directly
- Full transaction history

**API**
- REST API for B2B integrations
- Webhook events for every payment state change
- Idempotency keys, rate limiting, audit logs

---

## SLIDE 6 — Architecture

### Built for scale from day one.

```
Business User
     ↓
Nuvia Dashboard (React + TypeScript)
     ↓
Nuvia API (Node.js / Bun + Express)
     ↓
Arc Blockchain — USDC Settlement (< 1 second)
     ↓
Recipient Wallet
```

**Security stack:**
- Helmet CSP/HSTS, strict CORS
- Rate limiting per IP and per route
- HMAC-SHA256 webhook signature verification
- Org-isolation on every database query
- No private keys in source code — ever
- Full audit log on every action

**Designed for fiat on/off-ramp integration:**
- `FiatProvider` abstraction already in architecture
- Plug in any provider (Circle, Transak, Stripe) without changing core payment logic

---

## SLIDE 7 — Traction

### Built, deployed, and live on testnet.

- ✅ Full MVP live at **nuviapay-production.up.railway.app**
- ✅ End-to-end payment flow working on Arc Testnet
- ✅ Real USDC transfer on Arc at payment confirmation
- ✅ Full backend API with payment lifecycle, webhooks, beneficiaries
- ✅ Codebase at **github.com/andromedacripto/nuviapay**
- ✅ Production-hardened security stack
- ✅ Onchain explorer links on every transaction

**Next: Arc Mainnet launch with first paying customers**

---

## SLIDE 8 — Market

### A massive and underserved market.

| Segment | Size |
|---|---|
| Global B2B cross-border payments | $150T/year |
| SMB international payments | $8T/year |
| Stablecoin B2B settlement (2025) | $2T/year (growing 3x YoY) |

**Target customer:**
- Mid-market companies ($1M–$500M revenue) making regular international payments
- Companies paying suppliers, contractors, and partners in multiple countries
- Companies frustrated with SWIFT delays, high FX fees, and opaque pricing

**Initial focus corridors:**
- USD → BRL (Brazil)
- USD → EUR (Europe)
- USD → SGD (Southeast Asia)

---

## SLIDE 9 — Business Model

### Simple, transparent, scalable.

**Revenue model:**

| Stream | Details |
|---|---|
| Transaction fee | 0.1–0.3% per payment (vs 2–7% traditional) |
| FX spread | Transparent markup on fiat conversion |
| API access | Monthly subscription for high-volume API users |
| Enterprise | Custom pricing for large payment volumes |

**Unit economics (illustrative):**
- Average B2B payment: $25,000
- Nuvia fee: 0.2% = $50 per payment
- 1,000 payments/month = $50,000 MRR
- 10,000 payments/month = $500,000 MRR

> At 10,000 payments/month, Nuvia is a **$6M ARR business** — with near-zero marginal cost per transaction.

---

## SLIDE 10 — Go-to-Market

### Land with early adopters. Scale with API.

**Phase 1 — Direct (now)**
- Target 10 design partners: importers/exporters, remote-first companies, digital agencies with international clients
- White-glove onboarding, product feedback loop
- Goal: $100K in monthly payment volume

**Phase 2 — Self-serve (Q1 2027)**
- Public launch with self-serve signup
- Fiat on/off-ramp integration (BRL, EUR, USD corridors)
- Goal: $1M in monthly payment volume

**Phase 3 — API platform (Q3 2027)**
- B2B SaaS companies embed Nuvia payments into their own products
- Goal: $10M in monthly payment volume

---

## SLIDE 11 — Competitive Landscape

### We compete on simplicity, speed, and cost.

| | SWIFT / Wire | Wise Business | Stripe Treasury | **Nuvia** |
|---|---|---|---|---|
| Settlement | 1–5 days | Hours | Hours | **< 1 second** |
| Cost | 2–7% | 0.5–2% | 0.8–1.5% | **< 0.3%** |
| Blockchain-native | ✗ | ✗ | ✗ | **✓** |
| 24/7 | ✗ | Partial | Partial | **✓** |
| Programmable | ✗ | ✗ | Limited | **✓** |
| Open API | ✗ | Limited | ✓ | **✓** |

**Our moat:**
- Arc blockchain gives us settlement speed and cost no traditional provider can match
- USDC is regulated, trusted, and liquid — not a speculative asset
- B2B focus means we build features banks ignore

---

## SLIDE 12 — Team

### Built by people who understand payments and infrastructure.

*(Add your team bios here)*

- **[Founder Name]** — CEO. [Background]
- **[Co-founder Name]** — CTO. [Background]
- **[Advisor Name]** — [Role/Background]

**Backed by:**
- Built on Circle's infrastructure (USDC issuer, $9B+ in regulated reserves)
- Deployed on Arc — Circle's purpose-built payments blockchain

---

## SLIDE 13 — The Ask

### We are raising a pre-seed round.

**Raising:** $[X]M pre-seed

**Use of funds:**
| | % | Use |
|---|---|---|
| Engineering | 45% | Core product, fiat on/off-ramp integration, mobile |
| Go-to-market | 30% | Sales, design partners, first corridors |
| Compliance & Licensing | 15% | MSB registration, KYC/AML infrastructure |
| Operations | 10% | Team, infrastructure, legal |

**Milestones:**
- Month 3: Arc Mainnet launch with first 10 paying customers
- Month 6: BRL and EUR fiat corridors live
- Month 12: $10M monthly payment volume, Series A ready

---

## SLIDE 14 — Vision

### The financial infrastructure layer for the next decade.

Today, Nuvia is a B2B payments dashboard.

Tomorrow, Nuvia is the **payment orchestration layer** that every business uses to move money globally — the same way Stripe became the payment layer for the internet.

> **"Global payments. One intelligent rail."**

The rail exists. The infrastructure is live. The timing is right.

**Nuvia is how businesses move money in 2027.**

---

## SLIDE 15 — Contact

# Let's build the future of global payments together.

**NUVIA**

- 🌐 nuvia.io
- 📧 contact@nuvia.io
- 🐙 github.com/andromedacripto/nuviapay
- 🚀 nuviapay-production.up.railway.app

*This document is confidential and intended solely for the recipient.
All financial projections are illustrative and forward-looking.*

---

*NUVIA — Global payments. One intelligent rail.*
*© 2026 Nuvia. All rights reserved.*

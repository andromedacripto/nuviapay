/**
 * Nuvia — Database (Bun SQLite)
 * Schema: users, organizations, org_members, beneficiaries, payments,
 *         transactions, wallets, balances, exchange_quotes, webhook_events, audit_logs
 */
import { Database } from 'bun:sqlite';
import { v4 as uuid } from 'uuid';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'nuvia.db');

const db = new Database(DB_PATH, { create: true });
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

// ──────────────────────────────────────────────────────────────────────────────
// Schema
// ──────────────────────────────────────────────────────────────────────────────
db.exec(`
CREATE TABLE IF NOT EXISTS organizations (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'demo',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organizations(id),
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'viewer',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS organization_members (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organizations(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  role        TEXT NOT NULL DEFAULT 'viewer',
  joined_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wallets (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES organizations(id),
  address     TEXT,
  network     TEXT NOT NULL DEFAULT 'arc',
  is_primary  INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS balances (
  id            TEXT PRIMARY KEY,
  wallet_id     TEXT NOT NULL REFERENCES wallets(id),
  usdc_balance  TEXT NOT NULL DEFAULT '0',
  last_synced_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id             TEXT PRIMARY KEY,
  org_id         TEXT NOT NULL REFERENCES organizations(id),
  name           TEXT NOT NULL,
  company        TEXT,
  wallet_address TEXT NOT NULL,
  country        TEXT NOT NULL DEFAULT 'US',
  label          TEXT,
  is_active      INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_intents (
  id             TEXT PRIMARY KEY,
  org_id         TEXT NOT NULL REFERENCES organizations(id),
  amount         TEXT NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'USDC',
  status         TEXT NOT NULL DEFAULT 'draft',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id               TEXT PRIMARY KEY,
  org_id           TEXT NOT NULL REFERENCES organizations(id),
  beneficiary_id   TEXT REFERENCES beneficiaries(id),
  beneficiary_name TEXT NOT NULL,
  wallet_address   TEXT NOT NULL,
  amount           TEXT NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'USDC',
  status           TEXT NOT NULL DEFAULT 'draft',
  network          TEXT NOT NULL DEFAULT 'arc',
  reference        TEXT,
  fee_usdc         TEXT NOT NULL DEFAULT '0.001',
  idempotency_key  TEXT UNIQUE,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(org_id, status);

CREATE TABLE IF NOT EXISTS transactions (
  id            TEXT PRIMARY KEY,
  payment_id    TEXT NOT NULL REFERENCES payments(id),
  org_id        TEXT NOT NULL,
  tx_hash       TEXT,
  from_address  TEXT,
  to_address    TEXT,
  amount        TEXT NOT NULL,
  fee_usdc      TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  confirmations INTEGER NOT NULL DEFAULT 0,
  confirmed_at  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exchange_quotes (
  id              TEXT PRIMARY KEY,
  org_id          TEXT NOT NULL,
  from_currency   TEXT NOT NULL,
  to_currency     TEXT NOT NULL,
  rate            TEXT NOT NULL,
  fee             TEXT NOT NULL DEFAULT '0',
  expires_at      TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL,
  event_type  TEXT NOT NULL,
  payload     TEXT NOT NULL,
  delivered   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_webhook_org ON webhook_events(org_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT PRIMARY KEY,
  org_id      TEXT NOT NULL,
  user_id     TEXT NOT NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  metadata    TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(org_id, created_at DESC);
`);

// ──────────────────────────────────────────────────────────────────────────────
// Seed demo data
// ──────────────────────────────────────────────────────────────────────────────
const ORG_ID = 'org_demo';
const USER_ID = 'mem_01';

// ── Remove any legacy seed/demo data from previous versions ──────────────────
// This runs once and cleans up fake payments/beneficiaries that were seeded in
// older builds. Safe to run on every boot — deletes only known fake IDs.
const LEGACY_PAYMENT_IDS = ['pay_001','pay_002','pay_003','pay_004'];
const LEGACY_BEN_IDS     = ['ben_001','ben_002','ben_003'];
for (const id of LEGACY_PAYMENT_IDS) {
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
}
for (const id of LEGACY_BEN_IDS) {
  db.prepare('DELETE FROM beneficiaries WHERE id = ?').run(id);
}
// Also nuke any payment whose beneficiary_name looks like seed data
db.prepare(`DELETE FROM payments WHERE beneficiary_name IN ('Apex Logistics','TechFlow GmbH','Pacific Freight')`).run();
db.prepare(`DELETE FROM beneficiaries WHERE name IN ('Apex Logistics','TechFlow GmbH','Pacific Freight')`).run();

// ── Bootstrap org (first run only) ───────────────────────────────────────────
const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(ORG_ID);
if (!org) {
  db.exec(`INSERT INTO organizations(id,name,plan) VALUES('${ORG_ID}','My Organization','starter')`);
  db.exec(`INSERT INTO users(id,org_id,email,role) VALUES('${USER_ID}','${ORG_ID}','admin@nuvia.io','owner')`);
  db.exec(`INSERT INTO organization_members(id,org_id,user_id,role) VALUES('mem_link_01','${ORG_ID}','${USER_ID}','owner')`);

  const walletId = `wal_${uuid().replace(/-/g,'').slice(0,12)}`;
  db.exec(`INSERT INTO wallets(id,org_id,network,is_primary) VALUES('${walletId}','${ORG_ID}','arc',1)`);
  db.exec(`INSERT INTO balances(id,wallet_id,usdc_balance) VALUES('bal_01','${walletId}','0')`);
} else {
  // Update org name if still showing old demo value
  db.prepare(`UPDATE organizations SET name = 'My Organization', plan = 'starter' WHERE id = ? AND name IN ('Nuvia Demo Org','Demo Org')`).run(ORG_ID);
}

export default db;

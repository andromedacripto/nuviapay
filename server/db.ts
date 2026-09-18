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
  network     TEXT NOT NULL DEFAULT 'arc-testnet',
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
  network          TEXT NOT NULL DEFAULT 'arc-testnet',
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

const org = db.prepare('SELECT id FROM organizations WHERE id = ?').get(ORG_ID);
if (!org) {
  db.exec(`INSERT INTO organizations(id,name,plan) VALUES('${ORG_ID}','Nuvia Demo Org','demo')`);
  db.exec(`INSERT INTO users(id,org_id,email,role) VALUES('${USER_ID}','${ORG_ID}','demo@nuvia.io','owner')`);
  db.exec(`INSERT INTO organization_members(id,org_id,user_id,role) VALUES('mem_link_01','${ORG_ID}','${USER_ID}','owner')`);

  const walletId = `wal_${uuid().replace(/-/g,'').slice(0,12)}`;
  db.exec(`INSERT INTO wallets(id,org_id,network,is_primary) VALUES('${walletId}','${ORG_ID}','arc-testnet',1)`);
  db.exec(`INSERT INTO balances(id,wallet_id,usdc_balance) VALUES('bal_01','${walletId}','0')`);

  // Seed demo beneficiaries — these are demo wallet addresses for testnet use only // arc-studio-allow-onchain-literal
  const demoBens = [
    { id:'ben_001', name:'Apex Logistics', company:'Apex Group', addr:'0x742d35Cc6634C0532925a3b8D4c9A1234567890a', country:'US', label:'Supplier' }, // arc-studio-allow-onchain-literal
    { id:'ben_002', name:'TechFlow GmbH',  company:'TechFlow',  addr:'0x1234567890AbCdEf1234567890abcdef12345678', country:'EU', label:'Partner' },   // arc-studio-allow-onchain-literal
    { id:'ben_003', name:'Pacific Freight',company:null,        addr:'0xAbCdEf1234567890abcdef1234567890abcdef12', country:'SG', label:'Freight' },    // arc-studio-allow-onchain-literal
  ];
  for (const b of demoBens) {
    db.prepare(`INSERT INTO beneficiaries(id,org_id,name,company,wallet_address,country,label) VALUES(?,?,?,?,?,?,?)`)
      .run(b.id, ORG_ID, b.name, b.company, b.addr, b.country, b.label);
  }

  // Seed demo payments
  const now = new Date().toISOString();
  const demoPays = [
    { id:'pay_001', name:'Apex Logistics', addr: demoBens[0].addr, amount:'12500.00', status:'confirmed', ref:'INV-2026-001' },
    { id:'pay_002', name:'TechFlow GmbH',  addr: demoBens[1].addr, amount:'5000.00',  status:'confirmed', ref:'INV-2026-002' },
    { id:'pay_003', name:'Pacific Freight',addr: demoBens[2].addr, amount:'28000.00', status:'processing',ref:'INV-2026-003' },
    { id:'pay_004', name:'Apex Logistics', addr: demoBens[0].addr, amount:'7500.00',  status:'pending_approval', ref:'INV-2026-004' },
  ];
  const stmt = db.prepare(`INSERT INTO payments(id,org_id,beneficiary_name,wallet_address,amount,currency,status,network,reference,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`);
  for (const p of demoPays) {
    stmt.run(p.id, ORG_ID, p.name, p.addr, p.amount, 'USDC', p.status, 'arc-testnet', p.ref, now, now);
  }

  // Seed audit log
  const alStmt = db.prepare(`INSERT INTO audit_logs(id,org_id,user_id,action,entity_type,entity_id) VALUES(?,?,?,?,?,?)`);
  alStmt.run('al_001', ORG_ID, USER_ID, 'payment.confirmed', 'payment', 'pay_001');
  alStmt.run('al_002', ORG_ID, USER_ID, 'payment.confirmed', 'payment', 'pay_002');
  alStmt.run('al_003', ORG_ID, USER_ID, 'payment.processing','payment', 'pay_003');
  alStmt.run('al_004', ORG_ID, USER_ID, 'beneficiary.created','beneficiary','ben_001');
  alStmt.run('al_005', ORG_ID, USER_ID, 'beneficiary.created','beneficiary','ben_002');
  alStmt.run('al_006', ORG_ID, USER_ID, 'beneficiary.created','beneficiary','ben_003');

  console.log('[Nuvia DB] Seeded demo data');
}

export default db;

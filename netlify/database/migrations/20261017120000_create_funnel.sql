CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nome TEXT,
  whatsapp TEXT UNIQUE,
  instagram TEXT,
  dor TEXT,
  faturamento TEXT,
  motivo TEXT,
  status_funil TEXT NOT NULL DEFAULT 'parcial'
    CHECK (status_funil IN ('parcial', 'completo', 'enviou_whatsapp')),
  status_comercial TEXT NOT NULL DEFAULT 'novo'
    CHECK (status_comercial IN ('novo', 'contatado', 'qualificado', 'call agendada', 'fechado', 'descartado')),
  notas TEXT NOT NULL DEFAULT '',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  user_agent TEXT,
  session_id TEXT,
  consentimento BOOLEAN NOT NULL DEFAULT false,
  consentimento_em TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  step INTEGER NOT NULL CHECK (step BETWEEN 0 AND 7),
  event TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_funil_idx ON leads(status_funil);
CREATE INDEX IF NOT EXISTS funnel_events_session_idx ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS funnel_events_step_idx ON funnel_events(step);

import { NextRequest, NextResponse } from 'next/server';
import { leadSchema } from '@/lib/schema';
import { getDb, hasDatabaseConfiguration, isMissingDatabaseError } from '@/lib/db';
import { limited, blocked } from '@/lib/security';
import { sendWebhook } from '@/lib/webhook';

const leadColumns = ['nome', 'whatsapp', 'instagram', 'dor', 'faturamento', 'motivo', 'consentimento', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer', 'user_agent', 'session_id', 'updated_at', 'status_funil', 'consentimento_em'] as const;

function placeholders(start: number, count: number) {
  return Array.from({ length: count }, (_, index) => `$${start + index}`).join(', ');
}

export async function POST(req: NextRequest) {
  if (limited(req)) return blocked();

  let input;
  try {
    input = leadSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Confira os dados informados.' }, { status: 400 });
  }
  if (input.honeypot) return NextResponse.json({ ok: true });
  if (!hasDatabaseConfiguration()) return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 503 });

  try {
    const database = getDb();
    const { id, session_id, step, event, honeypot, ...fields } = input;
    let leadId = id ?? null;
    let lead: Record<string, unknown> | null = null;
    const data: Record<string, unknown> = { ...fields, session_id, updated_at: new Date().toISOString() };

    if (id) {
      const { rows } = await database.pool.query('SELECT id, session_id, whatsapp FROM leads WHERE id = $1 LIMIT 1', [id]);
      const owned = rows[0];
      if (!owned) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
      if (owned.session_id !== session_id && owned.whatsapp !== fields.whatsapp) return NextResponse.json({ error: 'Sessão inválida.' }, { status: 403 });
    }

    if (step >= 2 && fields.whatsapp && fields.consentimento) {
      data.status_funil = step >= 7 ? 'completo' : 'parcial';
      data.consentimento_em = new Date().toISOString();
      const columns = leadColumns.filter((column) => column in data);
      const values = columns.map((column) => data[column]);
      const updates = columns.filter((column) => column !== 'whatsapp' && column !== 'session_id')
        .map((column) => `${column} = EXCLUDED.${column}`).join(', ');
      const { rows } = await database.pool.query(
        `INSERT INTO leads (${columns.join(', ')}) VALUES (${placeholders(1, columns.length)}) ON CONFLICT (whatsapp) DO UPDATE SET ${updates} RETURNING *`,
        values,
      );
      lead = rows[0];
      leadId = String(rows[0].id);
    } else if (id && Object.keys(data).length > 1) {
      const columns = leadColumns.filter((column) => column in data);
      const values = columns.map((column) => data[column]);
      const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(', ');
      const { rows } = await database.pool.query(`UPDATE leads SET ${assignments} WHERE id = $${columns.length + 1} RETURNING *`, [...values, id]);
      lead = rows[0] ?? null;
    }

    if (event) {
      await database.pool.query('INSERT INTO funnel_events (lead_id, session_id, step, event) VALUES ($1, $2, $3, $4)', [leadId, session_id, step, event]);
    }

    if (lead && step === 7 && event !== 'whatsapp_click') void sendWebhook(lead);
    if (lead && event === 'whatsapp_click') {
      const { rows } = await database.pool.query("UPDATE leads SET status_funil = 'enviou_whatsapp', updated_at = now() WHERE id = $1 RETURNING *", [lead.id]);
      lead = rows[0];
      void sendWebhook(lead);
    }
    return NextResponse.json({ ok: true, id: leadId });
  } catch (error) {
    console.error('Lead database operation failed:', error);
    return isMissingDatabaseError(error)
      ? NextResponse.json({ error: 'Banco de dados Netlify ainda não configurado.' }, { status: 503 })
      : NextResponse.json({ error: 'Não foi possível salvar seu progresso.' }, { status: 500 });
  }
}

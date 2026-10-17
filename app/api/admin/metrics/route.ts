import { NextResponse } from 'next/server';
import { getDb, hasDatabaseConfiguration, isMissingDatabaseError } from '@/lib/db';

type EventRow = { session_id: string; step: number; event: string; created_at: string };
type LeadRow = { id: string; status_funil: string; created_at: string };

export async function GET() {
  if (!hasDatabaseConfiguration()) return NextResponse.json({ error: 'Banco não configurado.' }, { status: 503 });
  try {
    const database = getDb();
    const [{ rows: events }, { rows: leads }] = await Promise.all([
      database.pool.query('SELECT session_id, step, event, created_at FROM funnel_events'),
      database.pool.query('SELECT id, status_funil, created_at FROM leads'),
    ]) as [{ rows: EventRow[] }, { rows: LeadRow[] }];
    const unique = new Set(events.filter((row) => row.step === 0).map((row) => row.session_id));
    const starts = new Set(events.filter((row) => row.step === 1).map((row) => row.session_id));
    const captured = leads.filter((row) => row.status_funil !== '').length;
    const complete = leads.filter((row) => ['completo', 'enviou_whatsapp'].includes(row.status_funil)).length;
    const clicks = events.filter((row) => row.event === 'whatsapp_click').length;
    const byStep = Array.from({ length: 8 }, (_, step) => ({
      step,
      visitors: new Set(events.filter((row) => row.step === step && row.event === 'view').map((row) => row.session_id)).size,
    }));
    return NextResponse.json({ visitors: unique.size, starts: starts.size, captured, complete, clicks, byStep });
  } catch (error) {
    console.error('Admin metrics query failed:', error);
    const missing = isMissingDatabaseError(error);
    return NextResponse.json({ error: missing ? 'Banco de dados Netlify ainda não configurado.' : 'Falha ao consultar métricas.' }, { status: missing ? 503 : 500 });
  }
}

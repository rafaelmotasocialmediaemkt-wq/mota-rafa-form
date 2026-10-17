import { NextRequest, NextResponse } from 'next/server';
import { getDb, hasDatabaseConfiguration, isMissingDatabaseError } from '@/lib/db';

export async function GET(req: NextRequest) {
  if (!hasDatabaseConfiguration()) return NextResponse.json({ error: 'Banco não configurado.' }, { status: 503 });
  const leadId = req.nextUrl.searchParams.get('lead_id');
  if (!leadId) return NextResponse.json({ error: 'Lead obrigatório.' }, { status: 400 });
  try {
    const { rows } = await getDb().pool.query('SELECT * FROM funnel_events WHERE lead_id = $1 ORDER BY created_at ASC', [leadId]);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Admin events query failed:', error);
    const missing = isMissingDatabaseError(error);
    return NextResponse.json({ error: missing ? 'Banco de dados Netlify ainda não configurado.' : 'Falha ao consultar eventos.' }, { status: missing ? 503 : 500 });
  }
}

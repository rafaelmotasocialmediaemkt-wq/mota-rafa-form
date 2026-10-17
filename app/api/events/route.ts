import { NextRequest, NextResponse } from 'next/server';
import { getDb, hasDatabaseConfiguration, isMissingDatabaseError } from '@/lib/db';
import { limited, blocked } from '@/lib/security';

export async function POST(req: NextRequest) {
  if (limited(req)) return blocked();
  if (!hasDatabaseConfiguration()) return NextResponse.json({ ok: true });
  try {
    const payload = await req.json();
    if (typeof payload.session_id !== 'string' || payload.session_id.length < 8 || !Number.isInteger(payload.step) || payload.step < 0 || payload.step > 7 || payload.event !== 'view') {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }
    await getDb().pool.query('INSERT INTO funnel_events (session_id, step, event) VALUES ($1, $2, $3)', [payload.session_id, payload.step, payload.event]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Event insert failed:', error);
    return isMissingDatabaseError(error)
      ? NextResponse.json({ error: 'Banco de dados Netlify ainda não configurado.' }, { status: 503 })
      : NextResponse.json({ ok: false }, { status: 500 });
  }
}

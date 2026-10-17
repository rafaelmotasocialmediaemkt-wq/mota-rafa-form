import { NextResponse } from 'next/server';
import { getDb, hasDatabaseConfiguration, isMissingDatabaseError } from '@/lib/db';
import { commercialSchema } from '@/lib/schema';

export async function GET() {
  if (!hasDatabaseConfiguration()) return NextResponse.json({ error: 'Banco não configurado.' }, { status: 503 });
  try {
    const { rows } = await getDb().pool.query('SELECT * FROM leads ORDER BY created_at DESC LIMIT 2000');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Admin lead query failed:', error);
    return NextResponse.json({ error: isMissingDatabaseError(error) ? 'Banco de dados Netlify ainda não configurado.' : 'Falha ao consultar leads.' }, { status: isMissingDatabaseError(error) ? 503 : 500 });
  }
}

export async function PATCH(req: Request) {
  if (!hasDatabaseConfiguration()) return NextResponse.json({ error: 'Banco não configurado.' }, { status: 503 });
  let payload;
  try { payload = commercialSchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 }); }
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });
  try {
    const { rows } = await getDb().pool.query('UPDATE leads SET status_comercial = $1, notas = $2, updated_at = now() WHERE id = $3 RETURNING id', [payload.status_comercial, payload.notas, id]);
    if (!rows.length) return NextResponse.json({ error: 'Lead não encontrado.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin lead update failed:', error);
    return NextResponse.json({ error: isMissingDatabaseError(error) ? 'Banco de dados Netlify ainda não configurado.' : 'Não foi possível atualizar o lead.' }, { status: isMissingDatabaseError(error) ? 503 : 500 });
  }
}

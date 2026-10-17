import {NextRequest,NextResponse} from 'next/server';
const hits=new Map<string,{count:number;reset:number}>();
export function limited(req:NextRequest){const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';const now=Date.now(),h=hits.get(ip);if(!h||h.reset<now){hits.set(ip,{count:1,reset:now+60000});return false;}h.count++;return h.count>30;}
export function blocked(){return NextResponse.json({error:'Muitas tentativas. Tente novamente em instantes.'},{status:429});}

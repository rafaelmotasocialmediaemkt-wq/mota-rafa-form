import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
export async function middleware(req:NextRequest){if(!req.nextUrl.pathname.startsWith('/admin')&&!req.nextUrl.pathname.startsWith('/api/admin'))return NextResponse.next();const res=NextResponse.next();if(req.nextUrl.pathname==='/admin/login'||req.nextUrl.pathname==='/api/admin/login')return res;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)return req.nextUrl.pathname.startsWith('/api/')?NextResponse.json({error:'Não configurado'},{status:503}):NextResponse.redirect(new URL('/admin/login',req.url));const supabase=createServerClient(url,key,{cookies:{getAll:()=>req.cookies.getAll(),setAll:(cs:any)=>cs.forEach((cookie:any)=>res.cookies.set(cookie.name,cookie.value,cookie.options))}});const {data:{user}}=await supabase.auth.getUser();const admins=(process.env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase());if(!user||!admins.includes(user.email?.toLowerCase()||''))return req.nextUrl.pathname.startsWith('/api/')?NextResponse.json({error:'Não autorizado'},{status:401}):NextResponse.redirect(new URL('/admin/login',req.url));return res;}
export const config={matcher:['/admin/:path*','/api/admin/:path*']};




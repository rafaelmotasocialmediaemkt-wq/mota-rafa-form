import {createServerClient} from '@supabase/ssr';import {cookies} from 'next/headers';
export async function authClient(){const c=cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{get(n:string){return c.get(n)?.value},set(n:string,v:string,o:any){c.set(n,v,o)},remove(n:string,o:any){c.set(n,'',{...o,maxAge:0})}}});}

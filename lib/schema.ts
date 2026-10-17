import {z} from 'zod';
const emptyAsUndefined=(v:unknown)=>v===''?undefined:v;
const optionalText=(max:number,min=0)=>z.preprocess(emptyAsUndefined,z.string().trim().min(min).max(max).optional());
export const leadSchema=z.object({id:z.string().uuid().optional(),session_id:z.string().min(8).max(100),step:z.number().int().min(0).max(7),event:z.string().optional(),nome:optionalText(120,1),whatsapp:z.preprocess(emptyAsUndefined,z.string().regex(/^\d{10,11}$/).optional()),instagram:optionalText(100),dor:optionalText(1500,1),faturamento:optionalText(100),motivo:optionalText(160),consentimento:z.boolean().optional(),honeypot:z.string().max(2000).optional(),utm_source:optionalText(300),utm_medium:optionalText(300),utm_campaign:optionalText(300),utm_content:optionalText(300),utm_term:optionalText(300),referrer:optionalText(1000),user_agent:optionalText(1000)});
export const commercialSchema=z.object({status_comercial:z.enum(['novo','contatado','qualificado','call agendada','fechado','descartado']),notas:z.string().max(5000)});
export const adminLoginSchema=z.object({email:z.string().trim().email().max(254),password:z.string().min(1).max(256)});

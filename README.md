# Mota Rafa | Estratégia & Conteúdo

Funil de diagnóstico em Next.js, TypeScript e Tailwind. Leads e eventos são salvos no PostgreSQL do Netlify Database. O Supabase continua sendo usado somente para autenticar administradores.

## Requisitos

- Node.js 20+
- Projeto conectado ao Netlify em plano com Database disponível
- Projeto Supabase para autenticação administrativa

## Desenvolvimento local

1. `npm install`
2. Copie `.env.example` para `.env.local` e configure as variáveis de autenticação do Supabase e os dados opcionais do funil.
3. Para usar o banco local provisionado pelo Netlify, instale o Netlify CLI compatível e execute `netlify dev`; as migrations locais são aplicadas com `netlify database migrations apply`.
4. `npm run dev` pode ser usado para páginas e funções que não acessam o banco. Rotas que acessam o banco exigem `NETLIFY_DB_URL` ou execução dentro de `netlify dev`.
5. Abra http://localhost:3000.

## Banco e deploy

As migrations SQL ficam em `netlify/database/migrations/` e são aplicadas automaticamente pelo Netlify no deploy. Deploys de produção usam o banco de produção; previews usam branches isoladas. A migration inicial cria `leads` e `funnel_events`.

O app usa `@netlify/database` nos route handlers Next.js, executados em Netlify Functions pelo adaptador OpenNext automático. Não configure `NETLIFY_DB_URL` em `NEXT_PUBLIC_*` nem versione a string de conexão. O Netlify Database consome créditos para compute e tráfego.

O Supabase continua necessário para Auth: configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `ADMIN_EMAILS` no ambiente de deploy. Crie/convide administradores pelo Supabase Auth e inclua seus e-mails na allowlist. Leads anteriores no Supabase não são copiados automaticamente; faça a migração de dados para o ambiente de destino antes de usar o novo banco em produção.

## Configuração opcional

- `NEXT_PUBLIC_WHATSAPP_NUMBER`: número internacional sem `+` (padrão `5582993685144`).
- `NEXT_PUBLIC_META_PIXEL_ID`: ativa o evento Lead se o pixel estiver carregado pelo site.
- `VIDEO_1_URL` / `VIDEO_2_URL`: links MP4, YouTube ou Vimeo.
- `WEBHOOK_URL` / `WEBHOOK_SECRET`: destino e chave HMAC SHA-256 do webhook.

## Rotas

- `/`: funil de captação
- `/privacidade`: aviso de privacidade
- `/admin/login` e `/admin`: painel de leads (e-mail deve estar em `ADMIN_EMAILS`)
- `/api/leads`, `/api/events`: gravação pública validada no servidor
- `/api/admin/*`: APIs administrativas protegidas por middleware

## Segurança e operação

As rotas administrativas validam a sessão Supabase e a allowlist de e-mails. As operações PostgreSQL são parametrizadas e somente feitas no servidor. Webhooks têm timeout e falhas são registradas no log sem interromper o funil. O rate limit de exemplo é em memória por instância; em deploy com várias instâncias, use um limitador distribuído para limite global consistente. Ajuste o prazo de retenção conforme a política operacional e solicitações dos titulares.

## Verificações

- `npm test` executa testes de contrato para a migration, consentimento e proteção das rotas administrativas.
- `npm run typecheck` valida os tipos TypeScript.
- `npm run build` gera o build de produção.

As fontes Poppins e Cormorant Garamond são carregadas pelo navegador a partir do Google Fonts; configure uma política de rede que permita essa origem para manter a tipografia da identidade visual.

## Acesso administrativo

- Tela de login local: `http://localhost:3000/admin/login`.
- Após publicar: `https://SEU-DOMINIO/admin/login`.
- Não há cadastro público de administradores. Crie o usuário no Supabase Auth e inclua o mesmo e-mail em `ADMIN_EMAILS`.

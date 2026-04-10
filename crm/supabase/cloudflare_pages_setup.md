Cloudflare Pages + Supabase setup (crm.kukahome.uz)

Build settings (Pages project)
- Framework preset: `None`
- Build command: *(empty)*
- Build output directory: `/` (root)
- Root directory: `crm`

Functions
- Functions directory: `functions`
- `_routes.json` is used from project root (`crm/_routes.json`)
- Active routes handled by functions: `/api/*`

Production environment variables (Pages -> Settings -> Environment variables)
- `SUPABASE_URL` = your Supabase project URL (example: `https://xxxx.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key

Required API checks after deploy
- `https://crm.kukahome.uz/api/login`
- `https://crm.kukahome.uz/api/db`
- `https://crm.kukahome.uz/api/managers`
- `https://crm.kukahome.uz/api/showrooms`
- `https://crm.kukahome.uz/api/clients`
- `https://crm.kukahome.uz/api/notifications`
- `https://crm.kukahome.uz/api/sales-check-file`
- `https://crm.kukahome.uz/api/warranty-tickets`
- `https://crm.kukahome.uz/api/vacancies`

Expected behavior
- API endpoints must NOT return `index.html`
- For unsupported method, you may see 405/400/500 JSON responses (this is normal)
- CRM login should work only when `/api/login` returns function response

Common failure and fix
- If `/api/*` returns HTML page: Functions are not attached or root directory is wrong.
  - Ensure Root directory is `crm`
  - Ensure Functions directory is `functions`
  - Ensure `_routes.json` exists at `crm/_routes.json`
  - Redeploy after saving settings

# Shoply

Shoply is a premium React + TypeScript dashboard for managing digital products, email templates, inventory credentials, notes, and sales.

## Stack

- Vite
- React
- TypeScript
- Supabase Auth
- Supabase Postgres
- Lucide React icons
- Git / GitHub

## Local setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and add your Supabase project values:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run `supabase/schema.sql` in the Supabase SQL editor to create the Postgres tables and row-level security policies.

## GitHub

Repository: https://github.com/desamparado13/shoply

# Shoply

Shoply is a premium React + TypeScript dashboard for managing digital products, email templates, inventory credentials, notes, defects, and troubleshooting fixes.

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

Run `supabase/schema.sql` in the Supabase SQL editor to create the Postgres tables, storage buckets, and row-level security policies. After signing in, Products, Product Variations, Email Templates, Accounts & Keys, Notes, Defects, and Troubleshooting records are saved to Supabase Postgres. For an existing Shoply database, run `supabase/fix-defects.sql` to add the Defects table and picture storage.

## GitHub

Repository: https://github.com/desamparado13/shoply

## Vercel deployment

Shoply is ready for Vercel as a Vite static app.

Project settings:

- Framework preset: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables to add in Vercel for Production, Preview, and Development:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The committed `vercel.json` includes a fallback rewrite to `index.html`, so the app will keep working if client-side routes are added later.

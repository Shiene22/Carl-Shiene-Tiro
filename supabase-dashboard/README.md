# Tidewater — React + Supabase Dashboard

A React (Vite) web app with:

- **Dashboard**: total rows, rows added today, busiest day, a 14-day activity chart and a table of the latest rows from any Supabase table.
- **Settings**: enter your Supabase URL and anon key, choose the table and date column, test the connection, save or clear credentials.

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173), go to **Settings**, paste your credentials, click **Test connection**, then **Save settings**.

## Supabase setup

1. Create a project at https://supabase.com.
2. Copy **Project URL** and **anon public key** from *Project Settings → API*.
3. (Optional demo) Run `supabase/setup.sql` in the SQL Editor. It creates an `items` table, a read policy for the `anon` role and 60 sample rows.
4. To use your own table, enter its name and a timestamp column in Settings and make sure the `anon` role has a SELECT policy.

## Optional defaults via .env

Copy `.env.example` to `.env` to pre-fill credentials. Values saved in Settings take priority.

## Build

```bash
npm run build     # outputs to dist/
npm run preview
```

The app uses hash routing, so `dist/` works on any static host.

## Security notes

- Use only the **anon** key. Never put the `service_role` key in a browser app.
- Credentials are kept in the browser's `localStorage`.
- Control access with Row Level Security policies on every table.

## Structure

```
src/
  lib/config.js            load/save/validate settings
  lib/supabase.js          client factory, connection test, friendly errors
  context/ConfigContext.jsx
  components/              Layout, StatCard
  pages/                   Dashboard, Settings
supabase/setup.sql         sample table + policy + seed data
```

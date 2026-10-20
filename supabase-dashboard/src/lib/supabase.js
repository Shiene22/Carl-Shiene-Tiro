import { createClient } from "@supabase/supabase-js";

export function makeClient(url, anonKey) {
  return createClient(url.trim(), anonKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Checks that the URL + key are valid and the chosen table can be read.
export async function testConnection({ url, anonKey, table }) {
  try {
    const client = makeClient(url, anonKey);
    const { count, error } = await client
      .from(table.trim())
      .select("*", { count: "exact", head: true });
    if (error) {
      return { ok: false, message: friendlyError(error, table) };
    }
    return { ok: true, count: count ?? 0 };
  } catch (e) {
    return { ok: false, message: e?.message || "Could not reach Supabase." };
  }
}

export function friendlyError(error, table) {
  const msg = error?.message || String(error);
  const code = error?.code;
  if (code === "PGRST205" || code === "42P01" || /could not find the table/i.test(msg)) {
    return `The table "${table}" was not found. Check the name, or run supabase/setup.sql.`;
  }
  if (code === "42501" || /permission denied|row-level security/i.test(msg)) {
    return `Access to "${table}" was denied. Add a read policy for the anon role (see supabase/setup.sql).`;
  }
  if (code === "42703" || /column .* does not exist/i.test(msg)) {
    return `A column was not found in "${table}". Check the date column on the Settings page.`;
  }
  if (/invalid api key|jwt/i.test(msg)) {
    return "The API key was rejected. Copy the anon key again from Project Settings → API.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(msg)) {
    return "Could not reach the project URL. Check the URL and your internet connection.";
  }
  return msg;
}

const STORAGE_KEY = "sb-dashboard:config:v1";

export const DEFAULT_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  table: import.meta.env.VITE_SUPABASE_TABLE || "items",
  dateColumn: "created_at",
  rowLimit: 10,
};

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Could not save settings", e);
  }
}

export function clearConfig() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isConfigured(config) {
  return Boolean(config.url && config.anonKey);
}

export function validateConfig(config) {
  const errors = {};
  if (!config.url.trim()) {
    errors.url = "Enter your project URL.";
  } else {
    try {
      const u = new URL(config.url.trim());
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      errors.url = "Use a full URL, like https://abcdxyz.supabase.co";
    }
  }
  if (!config.anonKey.trim()) errors.anonKey = "Enter your anon (public) key.";
  if (!config.table.trim()) errors.table = "Enter the table to show on the dashboard.";
  if (!config.dateColumn.trim()) errors.dateColumn = "Enter a date column, like created_at.";
  const limit = Number(config.rowLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    errors.rowLimit = "Choose a number from 1 to 100.";
  }
  return errors;
}

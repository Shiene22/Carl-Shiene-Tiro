import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { clearConfig, DEFAULT_CONFIG, isConfigured, loadConfig, saveConfig } from "../lib/config.js";
import { makeClient } from "../lib/supabase.js";

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(loadConfig);

  const update = useCallback((next) => {
    saveConfig(next);
    setConfig(next);
  }, []);

  const reset = useCallback(() => {
    clearConfig();
    setConfig({ ...DEFAULT_CONFIG, url: "", anonKey: "" });
  }, []);

  const client = useMemo(() => {
    if (!isConfigured(config)) return null;
    try {
      return makeClient(config.url, config.anonKey);
    } catch {
      return null;
    }
  }, [config.url, config.anonKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({ config, update, reset, client, configured: isConfigured(config) }),
    [config, update, reset, client]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used inside ConfigProvider");
  return ctx;
}

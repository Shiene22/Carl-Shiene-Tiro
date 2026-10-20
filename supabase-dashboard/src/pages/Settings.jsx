import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.jsx";
import { validateConfig } from "../lib/config.js";
import { testConnection } from "../lib/supabase.js";

export default function Settings() {
  const { config, update, reset } = useConfig();
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...config, rowLimit: String(config.rowLimit) });
  const [errors, setErrors] = useState({});
  const [showKey, setShowKey] = useState(false);
  const [test, setTest] = useState({ status: "idle", message: "" });
  const [saved, setSaved] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setSaved(false);
    setTest({ status: "idle", message: "" });
  };

  const normalized = () => ({
    ...form,
    url: form.url.trim().replace(/\/+$/, ""),
    anonKey: form.anonKey.trim(),
    table: form.table.trim(),
    dateColumn: form.dateColumn.trim(),
    rowLimit: Number(form.rowLimit),
  });

  const runTest = async () => {
    const values = normalized();
    const errs = validateConfig(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setTest({ status: "loading", message: "Testing connection…" });
    const res = await testConnection(values);
    setTest(
      res.ok
        ? { status: "ok", message: `Connected. Found ${res.count.toLocaleString()} rows in "${values.table}".` }
        : { status: "error", message: res.message }
    );
  };

  const onSave = (e) => {
    e.preventDefault();
    const values = normalized();
    const errs = validateConfig(values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    update(values);
    setSaved(true);
  };

  const onClear = () => {
    if (!window.confirm("Remove the saved credentials from this browser?")) return;
    reset();
    setForm({ url: "", anonKey: "", table: "items", dateColumn: "created_at", rowLimit: "10" });
    setErrors({});
    setTest({ status: "idle", message: "" });
    setSaved(false);
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">Connect the dashboard to your Supabase project.</p>
        </div>
      </header>

      <form className="form-panel" onSubmit={onSave} noValidate>
        <fieldset>
          <legend>Credentials</legend>

          <div className={errors.url ? "field has-error" : "field"}>
            <label htmlFor="url">Project URL</label>
            <input id="url" type="url" inputMode="url" autoComplete="off" spellCheck="false" placeholder="https://abcdxyz.supabase.co" value={form.url} onChange={set("url")} />
            {errors.url ? <p className="field-error">{errors.url}</p> : <p className="field-hint">Find it in Project Settings → API.</p>}
          </div>

          <div className={errors.anonKey ? "field has-error" : "field"}>
            <label htmlFor="anonKey">Anon (public) key</label>
            <div className="input-row">
              <input id="anonKey" type={showKey ? "text" : "password"} autoComplete="off" spellCheck="false" placeholder="eyJhbGciOi…" value={form.anonKey} onChange={set("anonKey")} />
              <button type="button" className="btn btn-ghost" onClick={() => setShowKey((s) => !s)}>
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
            {errors.anonKey ? (
              <p className="field-error">{errors.anonKey}</p>
            ) : (
              <p className="field-hint">Use the anon key only. Never paste the service_role key into a browser app.</p>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend>Dashboard data</legend>
          <div className="grid-3">
            <div className={errors.table ? "field has-error" : "field"}>
              <label htmlFor="table">Table</label>
              <input id="table" autoComplete="off" spellCheck="false" value={form.table} onChange={set("table")} />
              {errors.table && <p className="field-error">{errors.table}</p>}
            </div>
            <div className={errors.dateColumn ? "field has-error" : "field"}>
              <label htmlFor="dateColumn">Date column</label>
              <input id="dateColumn" autoComplete="off" spellCheck="false" value={form.dateColumn} onChange={set("dateColumn")} />
              {errors.dateColumn && <p className="field-error">{errors.dateColumn}</p>}
            </div>
            <div className={errors.rowLimit ? "field has-error" : "field"}>
              <label htmlFor="rowLimit">Rows to show</label>
              <input id="rowLimit" type="number" min="1" max="100" value={form.rowLimit} onChange={set("rowLimit")} />
              {errors.rowLimit && <p className="field-error">{errors.rowLimit}</p>}
            </div>
          </div>
        </fieldset>

        {test.status !== "idle" && (
          <div className={`alert ${test.status === "ok" ? "alert-ok" : test.status === "error" ? "alert-error" : ""}`} role="status">
            {test.message}
          </div>
        )}
        {saved && (
          <div className="alert alert-ok" role="status">
            Settings saved in this browser.{" "}
            <button type="button" className="link-btn" onClick={() => navigate("/")}>
              Open dashboard
            </button>
          </div>
        )}

        <div className="actions">
          <button type="submit" className="btn btn-primary">Save settings</button>
          <button type="button" className="btn" onClick={runTest} disabled={test.status === "loading"}>
            Test connection
          </button>
          <span className="spacer" />
          <button type="button" className="btn btn-danger" onClick={onClear}>
            Clear credentials
          </button>
        </div>

        <p className="muted small">
          Credentials are stored in this browser&apos;s local storage and are sent only to your Supabase project.
          Protect your data with Row Level Security policies.
        </p>
      </form>
    </>
  );
}

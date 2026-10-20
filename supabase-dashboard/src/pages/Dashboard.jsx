import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import StatCard from "../components/StatCard.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import { friendlyError } from "../lib/supabase.js";

const DAYS = 14;
const DAY_MS = 86400000;

function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWindow() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return new Date(start.getTime() - (DAYS - 1) * DAY_MS);
}

function buildSeries(rows, dateColumn) {
  const start = startOfWindow();
  const buckets = new Map();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    buckets.set(dayKey(d), {
      key: dayKey(d),
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 0,
    });
  }
  for (const row of rows) {
    const raw = row[dateColumn];
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const b = buckets.get(dayKey(d));
    if (b) b.count += 1;
  }
  return [...buckets.values()];
}

function formatCell(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  const s = String(value);
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
}

export default function Dashboard() {
  const { client, config, configured } = useConfig();
  const { table, dateColumn, rowLimit } = config;

  const [state, setState] = useState({ loading: false, error: "", total: null, rows: [], series: [], updatedAt: null });

  const load = useCallback(async () => {
    if (!client) return;
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const since = startOfWindow();
      const [totalRes, recentRes, seriesRes] = await Promise.all([
        client.from(table).select("*", { count: "exact", head: true }),
        client.from(table).select("*").order(dateColumn, { ascending: false }).limit(Number(rowLimit) || 10),
        client.from(table).select(dateColumn).gte(dateColumn, since.toISOString()).limit(5000),
      ]);

      const failed = [totalRes, recentRes, seriesRes].find((r) => r.error);
      if (failed) throw failed.error;

      setState({
        loading: false,
        error: "",
        total: totalRes.count ?? 0,
        rows: recentRes.data || [],
        series: buildSeries(seriesRes.data || [], dateColumn),
        updatedAt: new Date(),
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: friendlyError(e, table) }));
    }
  }, [client, table, dateColumn, rowLimit]);

  useEffect(() => {
    load();
  }, [load]);

  const { total, rows, series, loading, error, updatedAt } = state;

  const last7 = useMemo(() => series.slice(-7).reduce((a, b) => a + b.count, 0), [series]);
  const today = series.length ? series[series.length - 1].count : 0;
  const peak = useMemo(() => series.reduce((a, b) => (b.count > a.count ? b : a), { count: 0, label: "—" }), [series]);
  const columns = useMemo(() => (rows[0] ? Object.keys(rows[0]) : []), [rows]);
  const firstLoad = loading && total === null;

  if (!configured) {
    return (
      <>
        <header className="page-head">
          <h1>Dashboard</h1>
        </header>
        <section className="empty">
          <h2>Connect your Supabase project</h2>
          <p>Add your project URL and anon key to see live numbers from your database.</p>
          <Link className="btn btn-primary" to="/settings">
            Add credentials
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Reading from <code>{table}</code>
            {updatedAt && <> · updated {updatedAt.toLocaleTimeString()}</>}
          </p>
        </div>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          <strong>Could not load data.</strong> {error} <Link to="/settings">Review settings</Link>
        </div>
      )}

      <section className="chart-panel" aria-label={`New rows per day, last ${DAYS} days`}>
        <div className="chart-head">
          <div>
            <div className="chart-title">New rows per day</div>
            <div className="muted small">Last {DAYS} days, by {dateColumn}</div>
          </div>
          <div className="chart-big">
            {firstLoad ? <span className="skeleton" /> : last7.toLocaleString()}
            <span className="chart-big-label">in the last 7 days</span>
          </div>
        </div>
        <div className="chart-body">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)" }}
                formatter={(v) => [v, "Rows"]}
              />
              <Area type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2.5} fill="url(#fillArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="stats">
        <StatCard label="Total rows" value={total === null ? "—" : total.toLocaleString()} loading={firstLoad} />
        <StatCard label="Added today" value={today.toLocaleString()} loading={firstLoad} />
        <StatCard label="Busiest day" value={peak.count ? `${peak.count.toLocaleString()} rows` : "—"} hint={peak.count ? peak.label : "No activity yet"} loading={firstLoad} />
      </section>

      <section className="table-panel">
        <div className="table-head">
          <h2>Latest rows</h2>
          <span className="muted small">Newest {rows.length || rowLimit} by {dateColumn}</span>
        </div>
        {rows.length === 0 && !loading && !error ? (
          <p className="muted pad">No rows yet. Insert a record in Supabase and refresh.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id ?? i}>
                    {columns.map((c) => (
                      <td key={c} title={typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c] ?? "")}>
                        {formatCell(r[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

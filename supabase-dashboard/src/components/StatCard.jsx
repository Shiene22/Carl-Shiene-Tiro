export default function StatCard({ label, value, hint, loading }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{loading ? <span className="skeleton" /> : value}</div>
      {hint && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

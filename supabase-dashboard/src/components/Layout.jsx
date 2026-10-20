import { NavLink, Outlet } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.jsx";

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

export default function Layout() {
  const { config, configured } = useConfig();

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22">
              <path d="M7 22l5-7 4 4 6-9 3 4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="brand-name">Tidewater</span>
        </div>

        <nav className="nav" aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Dashboard
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Settings
          </NavLink>
        </nav>

        <div className="rail-foot">
          <div className={configured ? "dot dot-on" : "dot dot-off"} aria-hidden="true" />
          <div>
            <div className="rail-foot-title">{configured ? "Project connected" : "Not connected"}</div>
            <div className="rail-foot-sub">{configured ? hostOf(config.url) : "Add credentials in Settings"}</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

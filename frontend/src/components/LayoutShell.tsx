import type { PropsWithChildren, ReactNode } from "react";

type LayoutShellProps = PropsWithChildren<{
  sidebar: ReactNode;
  map: ReactNode;
  results: ReactNode;
  themeMode: "light" | "dark";
  onToggleTheme: () => void;
}>;

export function LayoutShell({
  sidebar,
  map,
  results,
  themeMode,
  onToggleTheme,
}: LayoutShellProps) {
  const isDarkTheme = themeMode === "dark";

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__content">
          <div>
            <p className="eyebrow">Lead generation MVP</p>
            <h1>Find local businesses inside a precise search radius.</h1>
            <p className="hero-copy">
              Search a city, pick the exact point on the map, and surface outreach-ready leads
              without scanning an entire metro area.
            </p>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${isDarkTheme ? "light" : "dark"} theme`}
            aria-pressed={isDarkTheme}
          >
            <span className="theme-toggle__track">
              <span className="theme-toggle__icon theme-toggle__icon--sun">Light</span>
              <span className="theme-toggle__icon theme-toggle__icon--moon">Dark</span>
              <span className="theme-toggle__thumb" />
            </span>
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="sidebar-panel">{sidebar}</section>
        <section className="map-panel">{map}</section>
        <section className="results-panel">{results}</section>
      </main>
    </div>
  );
}

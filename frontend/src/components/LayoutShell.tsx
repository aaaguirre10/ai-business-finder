import type { PropsWithChildren, ReactNode } from "react";

type LayoutShellProps = PropsWithChildren<{
  sidebar: ReactNode;
  map: ReactNode;
  results: ReactNode;
}>;

export function LayoutShell({ sidebar, map, results }: LayoutShellProps) {
  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Lead generation MVP</p>
          <h1>Find local businesses inside a precise search radius.</h1>
          <p className="hero-copy">
            Search a city, pick the exact point on the map, and surface outreach-ready leads
            without scanning an entire metro area.
          </p>
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

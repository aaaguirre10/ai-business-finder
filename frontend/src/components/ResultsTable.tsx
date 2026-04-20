import type { Lead, WebsiteStatusFilter } from "@/types/api";

type ResultsTableProps = {
  leads: Lead[];
  hasSearched: boolean;
  totalFetchedCount: number;
  rawPlacesCount: number;
  tilesSearched: number;
  usedDeeperScan: boolean;
  noWebsiteCount: number;
  hasWebsiteCount: number;
  unknownCount: number;
  websiteStatusFilter: WebsiteStatusFilter;
  onWebsiteStatusFilterChange: (value: WebsiteStatusFilter) => void;
  onExport: () => Promise<void>;
  isExporting: boolean;
  canExport: boolean;
};

function formatStatusLabel(status: Lead["website_status"]): string {
  switch (status) {
    case "has_website":
      return "Has website";
    case "no_website":
      return "No website";
    default:
      return "Unknown";
  }
}

export function ResultsTable({
  leads,
  hasSearched,
  totalFetchedCount,
  rawPlacesCount,
  tilesSearched,
  usedDeeperScan,
  noWebsiteCount,
  hasWebsiteCount,
  unknownCount,
  websiteStatusFilter,
  onWebsiteStatusFilterChange,
  onExport,
  isExporting,
  canExport,
}: ResultsTableProps) {
  return (
    <div className="panel-card">
      <div className="panel-card__header panel-card__header--split">
        <div>
          <h2>Lead results</h2>
          <p>
            Filter the current search results and export only the visible lead set.
            {hasSearched
              ? usedDeeperScan
                ? ` Showing ${leads.length} of ${totalFetchedCount} unique places from ${rawPlacesCount} total place hits across ${tilesSearched} zone scans.`
                : ` Showing ${leads.length} of ${totalFetchedCount} fetched places.`
              : ""}
          </p>
          {hasSearched && usedDeeperScan ? (
            <div className="scan-badge-row">
              <span className="scan-badge">Deeper scan used</span>
            </div>
          ) : null}
        </div>
        <div className="table-actions">
          <label className="field field--compact">
            <span className="field__label">Website status</span>
            <select
              value={websiteStatusFilter}
              onChange={(event) =>
                onWebsiteStatusFilterChange(event.target.value as WebsiteStatusFilter)
              }
              disabled={!hasSearched}
            >
              <option value="no_website">No website</option>
              <option value="all">All results</option>
              <option value="has_website">Has website</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => {
              void onExport().catch(() => undefined);
            }}
            disabled={!canExport || isExporting}
          >
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {hasSearched ? (
        <div className="results-summary">
          <span className="results-summary__item">
            <strong>{noWebsiteCount}</strong> no website
          </span>
          <span className="results-summary__item">
            <strong>{hasWebsiteCount}</strong> has website
          </span>
          <span className="results-summary__item">
            <strong>{unknownCount}</strong> unknown
          </span>
        </div>
      ) : null}

      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>Business name</th>
              <th>Address</th>
              <th>Phone number</th>
              <th>Website status</th>
            </tr>
          </thead>
          <tbody>
            {leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.place_id}>
                  <td>{lead.name}</td>
                  <td>{lead.address}</td>
                  <td>{lead.phone ?? "Not available"}</td>
                  <td>
                    <span className={`status-chip status-chip--${lead.website_status}`}>
                      {formatStatusLabel(lead.website_status)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="results-table__empty">
                  {hasSearched
                    ? "No leads match the current website-status filter."
                    : "No results yet. Run a search to populate this table."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

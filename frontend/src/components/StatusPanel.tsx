import type { WebsiteStatusFilter } from "@/types/api";

type StatusPanelProps = {
  isSearching: boolean;
  isGeocoding: boolean;
  error: string | null;
  resultCount: number;
  totalFetchedCount: number;
  rawPlacesCount: number;
  tilesSearched: number;
  usedDeeperScan: boolean;
  websiteStatusFilter: WebsiteStatusFilter;
  hasSearched: boolean;
};

function formatFilterLabel(filter: WebsiteStatusFilter): string {
  switch (filter) {
    case "no_website":
      return "no-website";
    case "has_website":
      return "with-website";
    case "unknown":
      return "unknown-status";
    default:
      return "visible";
  }
}

function formatFilterDisplay(filter: WebsiteStatusFilter): string {
  switch (filter) {
    case "no_website":
      return "No website";
    case "has_website":
      return "Has website";
    case "unknown":
      return "Unknown";
    default:
      return "All results";
  }
}

export function StatusPanel({
  isSearching,
  isGeocoding,
  error,
  resultCount,
  totalFetchedCount,
  rawPlacesCount,
  tilesSearched,
  usedDeeperScan,
  websiteStatusFilter,
  hasSearched,
}: StatusPanelProps) {
  let title = "Ready to search";
  let message = "Pick a point on the map, adjust the radius, and run a focused local search.";
  let tone = "info";

  if (isGeocoding) {
    title = "Centering the map";
    message = "Resolving the city name and updating the map position.";
  } else if (isSearching) {
    title = "Searching businesses";
    message = "Querying the backend for businesses inside your selected circle.";
  } else if (error) {
    title = "Something went wrong";
    message = error;
    tone = "error";
  } else if (hasSearched && totalFetchedCount === 0) {
    title = usedDeeperScan ? "No unique businesses found" : "No businesses found";
    message = usedDeeperScan
      ? `Scanned ${tilesSearched} nearby zones and found no unique places inside your selected circle. Try moving the point or reducing the radius.`
      : "Try moving the point or increasing the radius to scan a different pocket of the city.";
  } else if (hasSearched && resultCount === 0 && totalFetchedCount > 0) {
    title = `0 ${formatFilterLabel(websiteStatusFilter)} leads shown`;
    message =
      websiteStatusFilter === "all"
        ? `Google returned ${totalFetchedCount} unique places${usedDeeperScan ? ` from ${rawPlacesCount} place hits across ${tilesSearched} zone scans` : ""}, but nothing is currently visible.`
        : `Google returned ${totalFetchedCount} unique places${usedDeeperScan ? ` from ${rawPlacesCount} place hits across ${tilesSearched} zone scans` : ""}, but none match the "${formatFilterDisplay(websiteStatusFilter)}" filter. Try a different point, a smaller radius, or switch to All results.`;
  } else if (hasSearched && resultCount > 0) {
    title =
      websiteStatusFilter === "all"
        ? `${resultCount} lead${resultCount === 1 ? "" : "s"} shown`
        : `${resultCount} ${formatFilterLabel(websiteStatusFilter)} lead${resultCount === 1 ? "" : "s"} shown`;
    message =
      websiteStatusFilter === "all"
        ? usedDeeperScan
          ? `Scanned ${tilesSearched} nearby zones and turned ${rawPlacesCount} place hits into ${totalFetchedCount} unique places inside your exact circle.`
          : `Google returned ${totalFetchedCount} places inside the exact circle you selected.`
        : usedDeeperScan
          ? `Showing ${resultCount} of ${totalFetchedCount} unique places after scanning ${tilesSearched} nearby zones and applying the "${formatFilterDisplay(websiteStatusFilter)}" filter.`
          : `Showing ${resultCount} of ${totalFetchedCount} fetched places after applying the "${formatFilterDisplay(websiteStatusFilter)}" filter.`;
    tone = "success";
  }

  return (
    <div className={`status-panel status-panel--${tone}`}>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

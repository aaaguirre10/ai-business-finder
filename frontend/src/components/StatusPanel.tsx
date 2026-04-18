type StatusPanelProps = {
  isSearching: boolean;
  isGeocoding: boolean;
  error: string | null;
  resultCount: number;
  hasSearched: boolean;
};

export function StatusPanel({
  isSearching,
  isGeocoding,
  error,
  resultCount,
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
  } else if (hasSearched && resultCount === 0) {
    title = "No businesses found";
    message = "Try moving the point or increasing the radius to scan a different pocket of the city.";
  } else if (hasSearched && resultCount > 0) {
    title = `${resultCount} lead${resultCount === 1 ? "" : "s"} found`;
    message = "Results are limited to the exact circle you selected.";
    tone = "success";
  }

  return (
    <div className={`status-panel status-panel--${tone}`}>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

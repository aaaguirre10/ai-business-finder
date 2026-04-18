import { FormEvent } from "react";

type SearchControlsProps = {
  city: string;
  radius: number;
  isSearching: boolean;
  isGeocoding: boolean;
  hasSelectedPoint: boolean;
  onCityChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onCenterCity: () => Promise<void>;
  onSearch: () => Promise<void>;
};

function formatRadius(radius: number): string {
  return radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`;
}

export function SearchControls({
  city,
  radius,
  isSearching,
  isGeocoding,
  hasSelectedPoint,
  onCityChange,
  onRadiusChange,
  onCenterCity,
  onSearch,
}: SearchControlsProps) {
  async function handleCenterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onCenterCity();
    } catch {
      // The error state is surfaced through the shared status panel.
    }
  }

  return (
    <div className="panel-card">
      <div className="panel-card__header">
        <h2>Search controls</h2>
        <p>Center the map with a city or choose a point directly on the map below.</p>
      </div>

      <form className="control-group" onSubmit={handleCenterSubmit}>
        <label className="field">
          <span className="field__label">City</span>
          <input
            type="text"
            value={city}
            placeholder="El Paso, TX"
            onChange={(event) => onCityChange(event.target.value)}
            disabled={isGeocoding || isSearching}
          />
        </label>
        <button
          className="button button--secondary"
          type="submit"
          disabled={!city.trim() || isGeocoding || isSearching}
        >
          {isGeocoding ? "Centering..." : "Center on city"}
        </button>
      </form>

      <div className="control-group">
        <label className="field" htmlFor="radius">
          <span className="field__label">Radius</span>
          <div className="radius-row">
            <input
              id="radius"
              type="range"
              min={100}
              max={5000}
              step={100}
              value={radius}
              onChange={(event) => onRadiusChange(Number(event.target.value))}
              disabled={isSearching}
            />
            <strong>{formatRadius(radius)}</strong>
          </div>
        </label>
      </div>

      <div className="helper-box">
        <p>How it works</p>
        <span>Click the map or drag the marker to define the center of your circular search area.</span>
      </div>

      <button
        className="button"
        type="button"
        onClick={() => {
          void onSearch().catch(() => undefined);
        }}
        disabled={!hasSelectedPoint || isSearching || isGeocoding}
      >
        {isSearching ? "Searching..." : "Search selected area"}
      </button>
    </div>
  );
}

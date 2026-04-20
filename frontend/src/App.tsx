import { useEffect, useState } from "react";

import { LayoutShell } from "@/components/LayoutShell";
import { LeadMap } from "@/components/LeadMap";
import { ResultsTable } from "@/components/ResultsTable";
import { SearchControls } from "@/components/SearchControls";
import { StatusPanel } from "@/components/StatusPanel";
import { useLeadSearch } from "@/hooks/useLeadSearch";
import type { Coordinates, Lead, SearchRequest, WebsiteStatusFilter } from "@/types/api";

const DEFAULT_CITY = "El Paso, TX";
const THEME_STORAGE_KEY = "ai-business-finder-theme";
const DEFAULT_CENTER: Coordinates = {
  latitude: 31.7619,
  longitude: -106.485,
};

function getInitialThemeMode(): "light" | "dark" {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [mapZoom, setMapZoom] = useState(13);
  const [radius, setRadius] = useState(500);
  const [mapCenter, setMapCenter] = useState<Coordinates>(DEFAULT_CENTER);
  const [selectedPoint, setSelectedPoint] = useState<Coordinates | null>(DEFAULT_CENTER);
  const [hasSearched, setHasSearched] = useState(false);
  const [websiteStatusFilter, setWebsiteStatusFilter] = useState<WebsiteStatusFilter>("no_website");
  const [lastSearchRequest, setLastSearchRequest] = useState<SearchRequest | null>(null);
  const [themeMode, setThemeMode] = useState<"light" | "dark">(getInitialThemeMode);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const {
    searchResult,
    error,
    isGeocoding,
    isSearching,
    isExporting,
    centerCity,
    findLeads,
    exportCurrentView,
  } = useLeadSearch();

  async function handleCenterCity() {
    const response = await centerCity(city);
    const nextCenter = {
      latitude: response.latitude,
      longitude: response.longitude,
    };
    setMapCenter(nextCenter);
    setSelectedPoint(nextCenter);
  }

  async function handleSearch() {
    if (!selectedPoint) {
      return;
    }

    const searchRequest: SearchRequest = {
      city,
      latitude: selectedPoint.latitude,
      longitude: selectedPoint.longitude,
      radius,
      limit: 20,
    };

    await findLeads({
      city: searchRequest.city,
      center: {
        latitude: searchRequest.latitude,
        longitude: searchRequest.longitude,
      },
      radius: searchRequest.radius,
      limit: searchRequest.limit,
    });
    setLastSearchRequest(searchRequest);
    setWebsiteStatusFilter("no_website");
    setHasSearched(true);
  }

  async function handleExport() {
    if (!lastSearchRequest) {
      return;
    }

    const blob = await exportCurrentView(lastSearchRequest, websiteStatusFilter);
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "lead-results.csv";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  const filteredLeads: Lead[] = (searchResult?.results ?? []).filter((lead) => {
    if (websiteStatusFilter === "all") {
      return true;
    }

    return lead.website_status === websiteStatusFilter;
  });

  const totalFetchedCount = searchResult?.count ?? 0;
  const rawPlacesCount = searchResult?.scan_metadata.raw_places_count ?? totalFetchedCount;
  const tilesSearched = searchResult?.scan_metadata.tiles_searched ?? 1;
  const usedDeeperScan = searchResult?.scan_metadata.strategy === "tiled";
  const noWebsiteCount = (searchResult?.results ?? []).filter(
    (lead) => lead.website_status === "no_website",
  ).length;
  const hasWebsiteCount = (searchResult?.results ?? []).filter(
    (lead) => lead.website_status === "has_website",
  ).length;
  const unknownCount = (searchResult?.results ?? []).filter(
    (lead) => lead.website_status === "unknown",
  ).length;

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  return (
    <LayoutShell
      themeMode={themeMode}
      onToggleTheme={() => setThemeMode((current) => (current === "light" ? "dark" : "light"))}
      sidebar={
        <SearchControls
          city={city}
          radius={radius}
          isSearching={isSearching}
          isGeocoding={isGeocoding}
          hasSelectedPoint={Boolean(selectedPoint)}
          onCityChange={setCity}
          onRadiusChange={setRadius}
          onCenterCity={handleCenterCity}
          onSearch={handleSearch}
        />
      }
      map={
        <LeadMap
          center={mapCenter}
          zoom={mapZoom}
          radius={radius}
          selectedPoint={selectedPoint}
          onSelectPoint={setSelectedPoint}
          onZoomChange={setMapZoom}
          onExpand={() => setIsMapExpanded(true)}
          isExpanded={isMapExpanded}
          onCloseExpanded={() => setIsMapExpanded(false)}
        />
      }
      results={
        <div className="results-stack">
          <StatusPanel
            isSearching={isSearching}
            isGeocoding={isGeocoding}
            error={error}
            resultCount={filteredLeads.length}
            totalFetchedCount={totalFetchedCount}
            rawPlacesCount={rawPlacesCount}
            tilesSearched={tilesSearched}
            usedDeeperScan={usedDeeperScan}
            websiteStatusFilter={websiteStatusFilter}
            hasSearched={hasSearched}
          />
          <ResultsTable
            leads={filteredLeads}
            hasSearched={hasSearched}
            totalFetchedCount={totalFetchedCount}
            rawPlacesCount={rawPlacesCount}
            tilesSearched={tilesSearched}
            usedDeeperScan={usedDeeperScan}
            noWebsiteCount={noWebsiteCount}
            hasWebsiteCount={hasWebsiteCount}
            unknownCount={unknownCount}
            websiteStatusFilter={websiteStatusFilter}
            onWebsiteStatusFilterChange={setWebsiteStatusFilter}
            onExport={handleExport}
            isExporting={isExporting}
            canExport={hasSearched && filteredLeads.length > 0 && lastSearchRequest !== null}
          />
        </div>
      }
    />
  );
}

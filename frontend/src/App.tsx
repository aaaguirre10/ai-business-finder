import { useState } from "react";

import { LayoutShell } from "@/components/LayoutShell";
import { LeadMap } from "@/components/LeadMap";
import { ResultsTable } from "@/components/ResultsTable";
import { SearchControls } from "@/components/SearchControls";
import { StatusPanel } from "@/components/StatusPanel";
import { useLeadSearch } from "@/hooks/useLeadSearch";
import type { Coordinates, Lead, SearchRequest, WebsiteStatusFilter } from "@/types/api";

const DEFAULT_CITY = "El Paso, TX";
const DEFAULT_CENTER: Coordinates = {
  latitude: 31.7619,
  longitude: -106.485,
};

export default function App() {
  const [city, setCity] = useState(DEFAULT_CITY);
  const [radius, setRadius] = useState(1500);
  const [mapCenter, setMapCenter] = useState<Coordinates>(DEFAULT_CENTER);
  const [selectedPoint, setSelectedPoint] = useState<Coordinates | null>(DEFAULT_CENTER);
  const [hasSearched, setHasSearched] = useState(false);
  const [websiteStatusFilter, setWebsiteStatusFilter] = useState<WebsiteStatusFilter>("all");
  const [lastSearchRequest, setLastSearchRequest] = useState<SearchRequest | null>(null);

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
    setWebsiteStatusFilter("all");
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

  return (
    <LayoutShell
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
          radius={radius}
          selectedPoint={selectedPoint}
          onSelectPoint={setSelectedPoint}
        />
      }
      results={
        <div className="results-stack">
          <StatusPanel
            isSearching={isSearching}
            isGeocoding={isGeocoding}
            error={error}
            resultCount={filteredLeads.length}
            hasSearched={hasSearched}
          />
          <ResultsTable
            leads={filteredLeads}
            hasSearched={hasSearched}
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

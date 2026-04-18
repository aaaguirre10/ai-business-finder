import { useState } from "react";

import { exportLeads, geocodeCity, searchLeads } from "@/api/client";
import type {
  Coordinates,
  GeocodeResponse,
  SearchRequest,
  SearchResponse,
  WebsiteStatusFilter,
} from "@/types/api";

type UseLeadSearchResult = {
  geocodeResult: GeocodeResponse | null;
  searchResult: SearchResponse | null;
  error: string | null;
  isGeocoding: boolean;
  isSearching: boolean;
  isExporting: boolean;
  centerCity: (city: string) => Promise<GeocodeResponse>;
  findLeads: (params: {
    city?: string | null;
    center: Coordinates;
    radius: number;
    limit?: number;
  }) => Promise<SearchResponse>;
  exportCurrentView: (search: SearchRequest, filter: WebsiteStatusFilter) => Promise<Blob>;
  clearError: () => void;
};

export function useLeadSearch(): UseLeadSearchResult {
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResponse | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function centerCity(city: string): Promise<GeocodeResponse> {
    setIsGeocoding(true);
    setError(null);
    try {
      const response = await geocodeCity(city.trim());
      setGeocodeResult(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to center the map.";
      setError(message);
      throw err;
    } finally {
      setIsGeocoding(false);
    }
  }

  async function findLeads(params: {
    city?: string | null;
    center: Coordinates;
    radius: number;
    limit?: number;
  }): Promise<SearchResponse> {
    setIsSearching(true);
    setError(null);
    try {
      const response = await searchLeads({
        city: params.city?.trim() || null,
        latitude: params.center.latitude,
        longitude: params.center.longitude,
        radius: params.radius,
        limit: params.limit,
      });
      setSearchResult(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load business leads.";
      setError(message);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }

  async function exportCurrentView(
    search: SearchRequest,
    filter: WebsiteStatusFilter,
  ): Promise<Blob> {
    setIsExporting(true);
    setError(null);
    try {
      return await exportLeads({
        search,
        website_status_filter: filter,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to export the current view.";
      setError(message);
      throw err;
    } finally {
      setIsExporting(false);
    }
  }

  return {
    geocodeResult,
    searchResult,
    error,
    isGeocoding,
    isSearching,
    isExporting,
    centerCity,
    findLeads,
    exportCurrentView,
    clearError: () => setError(null),
  };
}

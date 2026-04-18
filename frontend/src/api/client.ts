import type { ExportRequest, GeocodeResponse, SearchRequest, SearchResponse } from "@/types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(payload?.detail ?? "Request failed.");
  }

  return (await response.json()) as T;
}

export async function geocodeCity(city: string): Promise<GeocodeResponse> {
  const params = new URLSearchParams({ city });
  const response = await fetch(`${API_BASE_URL}/api/v1/locations/geocode?${params.toString()}`);
  return parseJsonResponse<GeocodeResponse>(response);
}

export async function searchLeads(payload: SearchRequest): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/leads/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<SearchResponse>(response);
}

export async function exportLeads(payload: ExportRequest): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/v1/leads/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(payload?.detail ?? "Export failed.");
  }

  return response.blob();
}

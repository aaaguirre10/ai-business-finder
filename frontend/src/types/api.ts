export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GeocodeResponse = {
  city: string;
  formatted_location: string;
  latitude: number;
  longitude: number;
};

export type Lead = {
  place_id: string;
  name: string;
  address: string;
  phone: string | null;
  website_status: WebsiteStatus;
};

export type WebsiteStatus = "has_website" | "no_website" | "unknown";
export type WebsiteStatusFilter = "all" | WebsiteStatus;

export type SearchRequest = {
  city?: string | null;
  latitude: number;
  longitude: number;
  radius: number;
  limit?: number;
};

export type SearchScanMetadata = {
  strategy: "single" | "tiled";
  tiles_searched: number;
  raw_places_count: number;
  unique_places_count: number;
};

export type SearchResponse = {
  search_center: Coordinates;
  radius: number;
  count: number;
  results: Lead[];
  scan_metadata: SearchScanMetadata;
};

export type ExportRequest = {
  search: SearchRequest;
  website_status_filter: WebsiteStatusFilter;
};

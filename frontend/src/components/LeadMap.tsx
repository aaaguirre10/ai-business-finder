import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";
import { useEffect, useRef } from "react";

import mapMarkerIcon from "@/assets/map-marker.png";
import type { Coordinates } from "@/types/api";

type LeadMapProps = {
  center: Coordinates;
  zoom: number;
  radius: number;
  selectedPoint: Coordinates | null;
  onSelectPoint: (point: Coordinates) => void;
  onZoomChange: (zoom: number) => void;
  onExpand: () => void;
  isExpanded: boolean;
  onCloseExpanded: () => void;
};

const customMarkerIcon = L.icon({
  iconUrl: mapMarkerIcon,
  iconSize: [58, 58],
  iconAnchor: [29, 54],
  popupAnchor: [0, -48],
  shadowUrl: undefined,
});

function MapClickHandler({ onSelectPoint }: { onSelectPoint: (point: Coordinates) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onSelectPoint({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

function RecenterMap({ center }: { center: Coordinates }) {
  const map = useMap();
  const previousCenterRef = useRef<Coordinates | null>(null);

  useEffect(() => {
    const previousCenter = previousCenterRef.current;
    previousCenterRef.current = center;

    if (
      previousCenter &&
      previousCenter.latitude === center.latitude &&
      previousCenter.longitude === center.longitude
    ) {
      return;
    }

    map.panTo([center.latitude, center.longitude], {
      animate: true,
    });
  }, [center, map]);

  return null;
}

function TrackZoom({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });

  return null;
}

function MapViewport({
  center,
  zoom,
  radius,
  selectedPoint,
  onSelectPoint,
  onZoomChange,
  className,
}: {
  center: Coordinates;
  zoom: number;
  radius: number;
  selectedPoint: Coordinates | null;
  onSelectPoint: (point: Coordinates) => void;
  onZoomChange: (zoom: number) => void;
  className: string;
}) {
  const viewportCenter = selectedPoint ?? center;
  const mapCenter: LatLngExpression = [viewportCenter.latitude, viewportCenter.longitude];

  return (
    <div className="map-frame">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom className={className}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onSelectPoint={onSelectPoint} />
        <RecenterMap center={viewportCenter} />
        <TrackZoom onZoomChange={onZoomChange} />
        {selectedPoint ? (
          <>
            <Marker
              position={[selectedPoint.latitude, selectedPoint.longitude]}
              icon={customMarkerIcon}
              draggable
              eventHandlers={{
                dragend: (event) => {
                  const marker = event.target;
                  const position = marker.getLatLng();
                  onSelectPoint({
                    latitude: position.lat,
                    longitude: position.lng,
                  });
                },
              }}
            />
            <Circle
              center={[selectedPoint.latitude, selectedPoint.longitude]}
              radius={radius}
              pathOptions={{
                color: "#2563eb",
                fillColor: "#22d3ee",
                fillOpacity: 0.16,
                weight: 2,
              }}
            />
          </>
        ) : null}
      </MapContainer>
    </div>
  );
}

export function LeadMap({
  center,
  zoom,
  radius,
  selectedPoint,
  onSelectPoint,
  onZoomChange,
  onExpand,
  isExpanded,
  onCloseExpanded,
}: LeadMapProps) {
  useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseExpanded();
      }
    }

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded, onCloseExpanded]);

  return (
    <>
      <div className="map-card">
        <div className="map-card__header map-card__header--split">
          <div>
            <h2>Target area</h2>
            <p>Search only inside the visible circle. The backend uses this exact point and radius.</p>
          </div>
          <button type="button" className="button button--secondary" onClick={onExpand}>
            Expand map
          </button>
        </div>
        <MapViewport
          center={center}
          zoom={zoom}
          radius={radius}
          selectedPoint={selectedPoint}
          onSelectPoint={onSelectPoint}
          onZoomChange={onZoomChange}
          className="leaflet-map"
        />
      </div>
      {isExpanded ? (
        <div className="map-modal" role="dialog" aria-modal="true" aria-label="Expanded map view">
          <div className="map-modal__backdrop" onClick={onCloseExpanded} />
          <div className="map-modal__content">
            <div className="map-modal__header">
              <div>
                <h2>Expanded map view</h2>
                <p>Pick a more precise point, then close the map to return to the dashboard.</p>
              </div>
              <button type="button" className="button button--secondary" onClick={onCloseExpanded}>
                Close
              </button>
            </div>
            <MapViewport
              center={center}
              zoom={zoom}
              radius={radius}
              selectedPoint={selectedPoint}
              onSelectPoint={onSelectPoint}
              onZoomChange={onZoomChange}
              className="leaflet-map leaflet-map--expanded"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

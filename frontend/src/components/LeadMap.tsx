import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";
import { useEffect } from "react";

import type { Coordinates } from "@/types/api";

type LeadMapProps = {
  center: Coordinates;
  radius: number;
  selectedPoint: Coordinates | null;
  onSelectPoint: (point: Coordinates) => void;
};

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

  useEffect(() => {
    map.setView([center.latitude, center.longitude], 13, {
      animate: true,
    });
  }, [center, map]);

  return null;
}

export function LeadMap({ center, radius, selectedPoint, onSelectPoint }: LeadMapProps) {
  const mapCenter: LatLngExpression = [center.latitude, center.longitude];

  return (
    <div className="map-card">
      <div className="map-card__header">
        <h2>Target area</h2>
        <p>Search only inside the visible circle. The backend uses this exact point and radius.</p>
      </div>
      <div className="map-frame">
        <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onSelectPoint={onSelectPoint} />
          <RecenterMap center={center} />
          {selectedPoint ? (
            <>
              <Marker
                position={[selectedPoint.latitude, selectedPoint.longitude]}
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
                  color: "#0f766e",
                  fillColor: "#14b8a6",
                  fillOpacity: 0.15,
                  weight: 2,
                }}
              />
            </>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}

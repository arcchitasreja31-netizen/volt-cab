"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLng } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LocationPoint = {
  lat: number;
  lng: number;
};

type LeafletMapProps = {
  onPickupSelect?: (point: LocationPoint) => void;
  onDropoffSelect?: (point: LocationPoint) => void;
  onDistanceChange?: (distanceKm: number | null) => void;
};

const pickupIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({
  onSelect,
}: {
  onSelect: (point: LocationPoint) => void;
}) {
  useMapEvents({
    click(event: { latlng: LatLng }) {
      onSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

function RouteDisplay({
  pickup,
  dropoff,
  onDistanceChange,
}: {
  pickup: LocationPoint | null;
  dropoff: LocationPoint | null;
  onDistanceChange?: (distanceKm: number | null) => void;
}) {
  const map = useMap();
  const [routeStatus, setRouteStatus] = useState("");

  useEffect(() => {
    let cancelled = false;
    let control: L.Control | undefined;

    async function drawRoute() {
      if (!pickup || !dropoff) {
        setRouteStatus("");
        onDistanceChange?.(null);
        return;
      }

      setRouteStatus("Calculating driving route...");
      onDistanceChange?.(null);

      try {
        // Load routing only in the browser.
        await import("leaflet-routing-machine");

        if (cancelled) return;

        const routing = (L as typeof L & {
          Routing: {
            control: (options: Record<string, unknown>) => L.Control;
          };
        }).Routing;

        if (!routing) {
          throw new Error("Routing library did not load.");
        }

        control = routing.control({
          waypoints: [
            L.latLng(pickup.lat, pickup.lng),
            L.latLng(dropoff.lat, dropoff.lng),
          ],
          routeWhileDragging: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          show: false,
          lineOptions: {
            styles: [{ color: "#2563eb", opacity: 0.85, weight: 6 }],
            extendToWaypoints: true,
            missingRouteTolerance: 0,
          },
          createMarker: () => null,
        });

        control.addTo(map);

        const routingControl = control as L.Control & {
          on: (
            event: string,
            callback: (event: {
              routes: Array<{
                summary: { totalDistance: number };
              }>;
            }) => void
          ) => void;
        };

        routingControl.on("routesfound", (event) => {
          if (cancelled) return;

          const meters = event.routes[0]?.summary.totalDistance;

          if (typeof meters === "number" && meters > 0) {
            const distanceKm = meters / 1000;
            onDistanceChange?.(distanceKm);
            setRouteStatus(
              `Driving distance: ${distanceKm.toFixed(1)} km`
            );
          } else {
            onDistanceChange?.(null);
            setRouteStatus("Couldn't calculate the route distance.");
          }
        });

        routingControl.on("routingerror", () => {
          if (cancelled) return;
          onDistanceChange?.(null);
          setRouteStatus(
            "Route unavailable. Please select the locations again."
          );
        });
      } catch {
        if (cancelled) return;
        onDistanceChange?.(null);
        setRouteStatus(
          "Couldn't load the routing service. Please try again."
        );
      }
    }

    void drawRoute();

    return () => {
      cancelled = true;

      if (control) {
        map.removeControl(control);
      }
    };
  }, [map, pickup, dropoff, onDistanceChange]);

  return (
    <div className="mt-2 text-sm font-medium text-blue-700" aria-live="polite">
      {routeStatus}
    </div>
  );
}

export default function LeafletMap({
  onPickupSelect,
  onDropoffSelect,
  onDistanceChange,
}: LeafletMapProps) {
  const position: [number, number] = [15.8281, 78.0373];

  const [pickup, setPickup] = useState<LocationPoint | null>(null);
  const [dropoff, setDropoff] = useState<LocationPoint | null>(null);
  const [nextSelection, setNextSelection] = useState<
    "pickup" | "dropoff"
  >("pickup");

  function handleMapClick(point: LocationPoint) {
    if (nextSelection === "pickup") {
      setPickup(point);
      onPickupSelect?.(point);
      setNextSelection("dropoff");
    } else {
      setDropoff(point);
      onDropoffSelect?.(point);
      setNextSelection("pickup");
    }
  }

  return (
    <div className="w-full overflow-hidden rounded-xl">
      <p className="mb-2 text-sm text-gray-700">
        Click the map to select your{" "}
        <strong>
          {nextSelection === "pickup" ? "pickup" : "destination"}
        </strong>
        .
      </p>

      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onSelect={handleMapClick} />

        {pickup && (
          <Marker
            position={[pickup.lat, pickup.lng]}
            icon={pickupIcon}
          >
            <Popup>Pickup location</Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker
            position={[dropoff.lat, dropoff.lng]}
            icon={pickupIcon}
          >
            <Popup>Destination</Popup>
          </Marker>
        )}

        <RouteDisplay
          pickup={pickup}
          dropoff={dropoff}
          onDistanceChange={onDistanceChange}
        />
      </MapContainer>

      <div className="mt-3 space-y-1 text-sm text-gray-700">
        <p>
          <strong>Pickup:</strong>{" "}
          {pickup
            ? `${pickup.lat.toFixed(5)}, ${pickup.lng.toFixed(5)}`
            : "Not selected"}
        </p>

        <p>
          <strong>Destination:</strong>{" "}
          {dropoff
            ? `${dropoff.lat.toFixed(5)}, ${dropoff.lng.toFixed(5)}`
            : "Not selected"}
        </p>
      </div>
    </div>
  );
}
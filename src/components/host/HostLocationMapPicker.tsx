"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Crosshair, Globe, MapPin, Navigation, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { centroidForCityId } from "@/lib/geo/cityCentroids";

import "leaflet/dist/leaflet.css";

function fixLeafletDefaultIcons() {
  const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  L.Marker.prototype.options.icon = icon;
}

function MapViewSync({
  hasPin,
  lat,
  lng,
  fallback,
}: {
  hasPin: boolean;
  lat: number | null;
  lng: number | null;
  fallback: [number, number];
}) {
  const map = useMap();
  useEffect(() => {
    if (hasPin && lat != null && lng != null) {
      map.setView([lat, lng], 15, { animate: true });
    } else {
      map.setView(fallback, 12, { animate: true });
    }
  }, [hasPin, lat, lng, fallback, map]);
  return null;
}

function MapClickPlace({
  onPlace,
}: {
  onPlace: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export type HostLocationMapPickerProps = {
  cityId: string;
  latitude: number | null;
  longitude: number | null;
  onCoordinatesChange: (latitude: number | null, longitude: number | null) => void;
  className?: string;
};

export function HostLocationMapPicker({
  cityId,
  latitude,
  longitude,
  onCoordinatesChange,
  className,
}: HostLocationMapPickerProps) {
  const iconsFixed = useRef(false);
  const fallback = useMemo(() => centroidForCityId(cityId), [cityId]);

  const hasPin =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  useEffect(() => {
    if (iconsFixed.current) return;
    fixLeafletDefaultIcons();
    iconsFixed.current = true;
  }, []);

  const setPin = useCallback(
    (lat: number, lng: number) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        toast.error("Invalid coordinates.");
        return;
      }
      onCoordinatesChange(lat, lng);
    },
    [onCoordinatesChange],
  );

  const locateWithDevice = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPin(pos.coords.latitude, pos.coords.longitude);
        toast.success("Using your device location.");
      },
      (err) => {
        toast.error(err.message || "Could not read your location.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60_000 },
    );
  }, [setPin]);

  const loadApproximateLocationFromIp = useCallback(async () => {
    try {
      const res = await fetch("/api/geo/ip", { cache: "no-store" });
      const data = (await res.json()) as {
        latitude?: number;
        longitude?: number;
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        toast.error(data.message ?? data.error ?? "Could not look up location.");
        return;
      }
      if (
        typeof data.latitude !== "number" ||
        typeof data.longitude !== "number"
      ) {
        toast.error("Could not look up location.");
        return;
      }
      setPin(data.latitude, data.longitude);
      toast.message("Approximate location from IP — drag the pin to refine.");
    } catch {
      toast.error("Network error while looking up location.");
    }
  }, [setPin]);

  const useCityCenter = useCallback(() => {
    setPin(fallback[0], fallback[1]);
    toast.message("Placed pin on selected city center — adjust on the map if needed.");
  }, [fallback, setPin]);

  const clearPin = useCallback(() => {
    onCoordinatesChange(null, null);
  }, [onCoordinatesChange]);

  const center: [number, number] = hasPin
    ? [latitude!, longitude!]
    : fallback;

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-semibold text-neutral-900">Map pin</p>
        <p className="mt-1 text-xs text-neutral-600">
          Tap the map to place a pin, or use your location / IP / city center.
          Coordinates are saved with your meet (
          <span className="font-mono text-[11px]">latitude</span>,{" "}
          <span className="font-mono text-[11px]">longitude</span>).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={locateWithDevice}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden />
          Use my location
        </button>
        <button
          type="button"
          onClick={() => void loadApproximateLocationFromIp()}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
        >
          <Globe className="h-3.5 w-3.5" aria-hidden />
          Approximate from IP
        </button>
        <button
          type="button"
          onClick={useCityCenter}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          Use city center
        </button>
        <button
          type="button"
          onClick={clearPin}
          disabled={!hasPin}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Clear pin
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 shadow-sm">
        <MapContainer
          center={center}
          zoom={hasPin ? 15 : 12}
          className="z-0 h-[min(320px,55vh)] w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewSync
            hasPin={hasPin}
            lat={latitude}
            lng={longitude}
            fallback={fallback}
          />
          <MapClickPlace onPlace={setPin} />
          {hasPin ? (
            <Marker
              position={[latitude!, longitude!]}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const p = e.target.getLatLng();
                  setPin(p.lat, p.lng);
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-700">
        <Crosshair className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {hasPin ? (
          <span>
            <span className="font-medium text-neutral-900">Selected:</span>{" "}
            <span className="font-mono tabular-nums">
              {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
            </span>
          </span>
        ) : (
          <span>No pin — optional. Add one so guests see the meet on a map.</span>
        )}
      </div>
    </div>
  );
}

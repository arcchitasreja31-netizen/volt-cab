"use client";

import dynamic from "next/dynamic";

type LocationPoint = {
  lat: number;
  lng: number;
};

type MapWrapperProps = {
  onPickupSelect?: (point: LocationPoint) => void;
  onDropoffSelect?: (point: LocationPoint) => void;
  onDistanceChange?: (distanceKm: number | null) => void;
};

const LeafletMap = dynamic(() => import("./leafletmaps"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center rounded-xl bg-gray-100 text-gray-700">
      Loading map...
    </div>
  ),
});

export default function MapWrapper(props: MapWrapperProps) {
  return <LeafletMap {...props} />;
}
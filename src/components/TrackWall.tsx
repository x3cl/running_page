import React from "react";
import polyline from "@mapbox/polyline";

const TrackItem = ({ activity }: { activity: any }) => {
  const points = polyline.decode(activity.summary_polyline);
  if (!points.length) return null;

  const lats = points.map((p) => p[0]);
  const lons = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latRange = maxLat - minLat;
  const lonRange = maxLon - minLon;
  const maxRange = Math.max(latRange, lonRange);

  const scale = 90 / (maxRange || 1);
  const path = points
    .map((p) => {
      const x = 5 + (p[1] - minLon) * scale;
      const y = 5 + (maxLat - p[0]) * scale;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const getColor = (type: string) => {
    if (type.includes("Run")) return "#ff5a5f";
    if (type.includes("Ski")) return "#00bfff";
    if (type.includes("Hike") || type.includes("Trail")) return "#2ecc71";
    return "#9b59b6";
  };

  return (
    <div className="flex flex-col items-center p-1 bg-white rounded border border-gray-100 hover:shadow-sm">
      <svg viewBox="0 0 100 100" className="w-full h-auto">
        <polyline
          points={path}
          fill="none"
          stroke={getColor(activity.type)}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export const TrackWall = ({ activities }: { activities: any[] }) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 p-4 bg-gray-50 rounded-xl">
      {activities
        .filter((a) => a.summary_polyline)
        .map((a) => (
          <TrackItem key={a.run_id} activity={a} />
        ))}
    </div>
  );
};
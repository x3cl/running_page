import React from 'react';
import polyline from '@mapbox/polyline';

export const TrackWall = ({ activities }: { activities: any[] }) => {
    const filtered = activities.filter(a => a.summary_polyline);

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 p-4 bg-gray-50 rounded-xl">
            {filtered.map((activity) => {
                const points = polyline.decode(activity.summary_polyline);
                if (!points.length) return null;

                const lats = points.map(p => p[0]);
                const lons = points.map(p => p[1]);
                const minLat = Math.min(...lats);
                const maxLat = Math.max(...lats);
                const minLon = Math.min(...lons);
                const maxLon = Math.max(...lons);
                const maxRange = Math.max(maxLat - minLat, maxLon - minLon) || 1;
                const scale = 90 / maxRange;

                const path = points.map(p => `${(5 + (p[1] - minLon) * scale).toFixed(2)},${(5 + (maxLat - p[0]) * scale).toFixed(2)}`).join(' ');

                const color = activity.type.includes('Run') ? '#ff5a5f' : (activity.type.includes('Ski') ? '#00bfff' : '#2ecc71');

                return (
                    <div key={activity.run_id} className="p-1 bg-white rounded border border-gray-100 shadow-sm">
                        <svg viewBox="0 0 100 100" className="w-full h-auto">
                            <polyline points={path} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                    </div>
                );
            })}
        </div>
    );
};
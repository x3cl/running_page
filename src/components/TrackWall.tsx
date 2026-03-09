import React from 'react';
import polyline from '@mapbox/polyline';

const TrackItem = ({ activity }: { activity: any }) => {
    // 解析压缩的 GPS 轨迹
    const points = polyline.decode(activity.summary_polyline);
    if (!points.length) return null;

    const lats = points.map(p => p[0]);
    const lons = points.map(p => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;
    const maxRange = Math.max(latRange, lonRange);

    // 坐标归一化到 100x100 的画布，并根据运动类型配色
    const scale = 90 / (maxRange || 1);
    const path = points.map(p => {
        const x = 5 + (p[1] - minLon) * scale;
        const y = 5 + (maxLat - p[0]) * scale;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');

    // 根据你的兴趣爱好自动配色
    const getColor = (type: string) => {
        if (type.includes('Run')) return '#ff5a5f'; // 跑步用橙红色
        if (type.includes('Ski')) return '#00bfff'; // 滑雪用天蓝色
        if (type.includes('Hike') || type.includes('Trail')) return '#2ecc71'; // 越野/徒步用绿色
        return '#9b59b6'; // 其他用紫色
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

export const TrackWall = ({ activities }: { activities: any[] }) => (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 p-4 bg-gray-50 rounded-xl">
        {activities
            .filter(a => a.summary_polyline)
            .map(a => <TrackItem key={a.run_id} activity={a} />)}
    </div>
);
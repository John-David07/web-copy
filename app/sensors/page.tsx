'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SensorData {
  nodeId: string;
  moisture: number;
  temperature: number;
  humidity: number;
}

export default function SensorsPage() {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sensors/current');
        const data = await res.json();
        
        const sensorList = Object.entries(data.Soil_Moisture || {}).map(([nodeId, value]) => ({
          nodeId,
          moisture: value as number,
          temperature: data.Temperature,
          humidity: data.Humidity,
        }));
        
        setSensors(sensorList);
      } catch (error) {
        console.error('Error fetching sensors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (moisture: number) => {
    if (moisture > 80) return { label: 'Saturated', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
    if (moisture > 40) return { label: 'Optimal', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    return { label: 'Dry', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' };
  };

  if (loading) return <div className="text-center py-8 text-gray-800 dark:text-white">Loading sensors...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sensor Hub</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400">Monitoring all {sensors.length} sensors</p>

      {/* Removed Filter Bar */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensors.map((sensor) => {
          const status = getStatus(sensor.moisture);
          return (
            <Link key={sensor.nodeId} href={`/sensors/${sensor.nodeId}`}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all border-green-400 shadow-green-200 shadow-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {sensor.nodeId.replace('_', ' ')}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${status.color} ${status.bgColor}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {sensor.moisture}%
                    </div>
                    <div className="text-sm text-gray-500">Moisture</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {sensor.temperature}°C
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {sensor.humidity}% Humidity
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {sensors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sensors found.
        </div>
      )}
    </div>
  );
}
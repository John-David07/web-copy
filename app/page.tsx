'use client';

import { useEffect, useState } from 'react';
import { PlantCarousel } from '@/components/PlantCarousel';
import { SmartInsight } from '@/components/SmartInsight';
import { NotificationButton } from '@/components/NotificationButton';

interface SensorData {
  Humidity: number;
  Temperature: number;
  Soil_Moisture: Record<string, number>;
}

export default function Home() {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sensors/current');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-800 dark:text-white">Loading sensor data...</div>;
  if (error) return <div className="text-center py-8 text-red-600 dark:text-red-400">Error: {error}</div>;
  if (!data) return <div className="text-center py-8 text-gray-800 dark:text-white">No data available</div>;

  // Transform sensor data for carousel
  const sensors = Object.entries(data.Soil_Moisture || {}).map(([nodeId, value]) => ({
    nodeId,
    moisture: value,
    temperature: data.Temperature,
    humidity: data.Humidity,
  }));

  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <NotificationButton />
    </div>
      <SmartInsight 
        temperature={data.Temperature} 
        humidity={data.Humidity}
      />
      
      <PlantCarousel sensors={sensors} />
    </div>
  );
}
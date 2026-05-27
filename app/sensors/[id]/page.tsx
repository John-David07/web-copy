'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { SmartInsight } from '@/components/SmartInsight';
import { SoilIdentifier } from '@/components/SoilIdentifier';
import { RecommendationHistory } from '@/components/RecommendationHistory';

interface SensorDetail {
  nodeId: string;
  moisture: number;
  temperature: number;
  humidity: number;
  history: Array<{ time: string; moisture: number }>;
}

export default function SensorDetailPage() {
  const { id } = useParams();
  const [sensor, setSensor] = useState<SensorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentRes = await fetch('/api/sensors/current');
        const currentData = await currentRes.json();
        
        const moisture = currentData.Soil_Moisture?.[id as string] || 0;
        
        const historyRes = await fetch('/api/sensors/history');
        const historyData = await historyRes.json();

        let history: Array<{ time: string; moisture: number }> = [];

        const soilSensorData = Array.isArray(historyData) 
          ? historyData.find((item: any) => item.id === 'soil_sensor')
          : null;

        if (soilSensorData && soilSensorData[id as string]) {
          const sensorHistory = soilSensorData[id as string];
          history = Object.entries(sensorHistory)
            .slice(-15)
            .map(([pushId, value]) => {
              let moistureValue = 0;
              if (typeof value === 'number') {
                moistureValue = value;
              } else if (value && typeof value === 'object' && 'value' in value) {
                moistureValue = (value as { value: number }).value;
              }
              
              let timeStr = 'recent';
              if (pushId.length >= 8 && pushId[0] === '-') {
                const hexPart = pushId.substring(1, 9);
                try {
                  const timeValue = parseInt(hexPart, 16);
                  if (!isNaN(timeValue)) {
                    const date = new Date(timeValue);
                    timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                } catch (e) {}
              }
              return { time: timeStr, moisture: moistureValue };
            })
            .reverse();
        }
        
        setSensor({
          nodeId: id as string,
          moisture,
          temperature: currentData.Temperature,
          humidity: currentData.Humidity,
          history,
        });
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load sensor data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-8 text-gray-800 dark:text-white">Loading sensor data...</div>;
  if (error) return <div className="text-center py-8 text-red-600 dark:text-red-400">{error}</div>;
  if (!sensor) return <div className="text-center py-8 text-gray-800 dark:text-white">Sensor not found</div>;

  const getStatus = (value: number) => {
    if (value > 80) return { label: 'Saturated', color: 'text-blue-600' };
    if (value > 40) return { label: 'Optimal', color: 'text-green-600' };
    return { label: 'Dry', color: 'text-orange-600' };
  };

  const status = getStatus(sensor.moisture);
  const getChange = () => {
    if (sensor.history.length < 2) return '0%';
    const last = sensor.history[sensor.history.length - 1]?.moisture || 0;
    const previous = sensor.history[sensor.history.length - 2]?.moisture || 0;
    const diff = last - previous;
    if (diff > 0) return `+${diff}%`;
    if (diff < 0) return `${diff}%`;
    return '0%';
  };
  const change = getChange();

  return (
    <div className="space-y-6">
      <Link href="/sensors" className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
        ← Back to Sensors
      </Link>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sensor {sensor.nodeId.replace('_', ' ')}
        </h1>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          status.label === 'Saturated' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
          status.label === 'Optimal' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
          'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
        }`}>
          {status.label}
        </span>
      </div>

      <SmartInsight temperature={sensor.temperature} humidity={sensor.humidity} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💧</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Moisture</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sensor.moisture}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌡️</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Temperature</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sensor.temperature}°C
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💨</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Humidity</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sensor.humidity}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-400">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Moisture Tracking
            </h2>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {sensor.moisture}%
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">{change}</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Last 15 readings</p>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sensor.history}>
              <XAxis dataKey="time" stroke="#888" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#888" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              <Line type="monotone" dataKey="moisture" stroke="#4CAF50" strokeWidth={2} dot={{ fill: '#4CAF50', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Soil Identifier */}
      <SoilIdentifier />

      {/* Recommendation History */}
      <RecommendationHistory sensorId={sensor.nodeId} />
    </div>
  );
}
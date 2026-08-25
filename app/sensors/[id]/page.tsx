'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { database } from '@/lib/firebase/client';
import { ref, onValue } from 'firebase/database';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { SmartInsight } from '@/components/SmartInsight';
import { SoilIdentifier } from '@/components/SoilIdentifier';
import { RecommendationHistory } from '@/components/RecommendationHistory';
import { PlantRecommendationChat } from '@/components/PlantRecommendationChat';
import { PlantIdentifier } from '@/components/PlantIdentifier';

interface HistoryPoint {
  time: string;
  moisture: number;
}

interface SensorDetail {
  nodeId: string;
  moisture: number;
  temperature: number;
  humidity: number;
  history: HistoryPoint[];
}

export default function SensorDetailPage() {
  const { id } = useParams();
  const [sensor, setSensor] = useState<SensorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time sensor data
  useEffect(() => {
    const currentDataRef = ref(database, 'CurrentData');
    
    const unsubscribe = onValue(currentDataRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        
        // Get moisture for this specific sensor
        const soilData = rawData.soil_moisture || rawData.Soil_Moisture || {};
        const nodeKey = (id as string).toLowerCase().replace('node_', 'node_');
        const moisture = soilData[nodeKey] || 0;
        
        setSensor(prev => ({
          nodeId: id as string,
          moisture: moisture,
          temperature: rawData.temperature || rawData.Temperature || 0,
          humidity: rawData.humidity || rawData.Humidity || 0,
          history: prev?.history || [] // Preserve history
        }));
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching sensor data:', err);
      setError('Failed to load sensor data');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [id]);

  // Fetch history data separately
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyRes = await fetch('/api/sensors/history');
        const historyData = await historyRes.json();
        
        // Find soil sensor data
        const soilSensorData = Array.isArray(historyData) 
          ? historyData.find((item: any) => item.id === 'soil_sensor')
          : null;
        
        if (soilSensorData) {
          const nodeKey = (id as string).toLowerCase().replace('Node_', 'node_');
          const sensorHistory = soilSensorData[nodeKey];
          
          if (sensorHistory && typeof sensorHistory === 'object') {
            const historyPoints: HistoryPoint[] = [];
            
            // Get last 15 readings
            const entries = Object.entries(sensorHistory).slice(-15);
            
            for (const [pushId, value] of entries) {
              let moistureValue = 0;
              if (typeof value === 'number') {
                moistureValue = value;
              } else if (value && typeof value === 'object' && 'value' in value) {
                moistureValue = (value as { value: number }).value;
              }
              
              // Parse timestamp from pushId
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
              historyPoints.push({ time: timeStr, moisture: moistureValue });
            }
            
            // Reverse to show chronological order (oldest to newest)
            historyPoints.reverse();
            
            setSensor(prev => prev ? {
              ...prev,
              history: historyPoints
            } : null);
          }
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      }
    };
    
    fetchHistory();
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
      <Link href="/sensors" className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700">
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
          
          {sensor.history.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensor.history}>
                <XAxis 
                  dataKey="time" 
                  stroke="#888" 
                  fontSize={12}
                  interval={Math.floor(sensor.history.length / 5)}
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#888" 
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)', 
                    color: 'var(--text-primary)' 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="moisture" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  dot={{ fill: '#4CAF50', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No historical data available
            </div>
          )}
        </div>
      </div>

      {/* AI Soil Identifier */}
      <SoilIdentifier sensorId={sensor.nodeId} />

      {/* AI Plant Identifier */}
      <PlantIdentifier />

      {/* Recommendation History */}
      <RecommendationHistory sensorId={sensor.nodeId} />

      {/* Plant Recommendation Chat - Manual Input */}
      <PlantRecommendationChat 
        sensorId={sensor.nodeId}
        defaultTemperature={sensor.temperature}
        defaultHumidity={sensor.humidity}
      />
    </div>
  );
}
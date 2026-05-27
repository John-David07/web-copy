'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface SensorData {
  nodeId: string;
  moisture: number;
  temperature: number;
  humidity: number;
}

interface FilterOptions {
  type: 'all' | 'moisture' | 'temperature' | 'humidity' | 'status';
  value: string;
  min?: number;
  max?: number;
}

export default function SensorsPage() {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [filteredSensors, setFilteredSensors] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterRange, setFilterRange] = useState({ min: 0, max: 100 });
  const [filterStatus, setFilterStatus] = useState('all');

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
        setFilteredSensors(sensorList);
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
    if (moisture > 80) return { label: 'saturated', color: 'text-blue-600 dark:text-blue-400', 'bgColor': 'bg-blue-100 dark:bg-blue-900/30' };
    if (moisture > 40) return { label: 'Optimal', color: 'text-green-600 dark:text-green-400', 'bgColor': 'bg-green-100 dark:bg-green-900/30' };
    return { label: 'Dry', color: 'text-orange-600 dark:text-orange-400', 'bgColor': 'bg-orange-100 dark:bg-orange-900/30' };
  };

  const applyFilters = () => {
    let filtered = [...sensors];

    // Filter by moisture range
    if (filterType === 'moisture') {
      filtered = filtered.filter(s => s.moisture >= filterRange.min && s.moisture <= filterRange.max);
    }
    
    // Filter by temperature range
    if (filterType === 'temperature') {
      filtered = filtered.filter(s => s.temperature >= filterRange.min && s.temperature <= filterRange.max);
    }
    
    // Filter by humidity range
    if (filterType === 'humidity') {
      filtered = filtered.filter(s => s.humidity >= filterRange.min && s.humidity <= filterRange.max);
    }
    
    // Filter by status
    if (filterType === 'status' && filterStatus !== 'all') {
      filtered = filtered.filter(s => {
        const status = getStatus(s.moisture).label;
        return status === filterStatus;
      });
    }

    setFilteredSensors(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filterType, filterRange, filterStatus, sensors]);

  if (loading) return <div className="text-center py-8 text-gray-800 dark:text-white">Loading sensors...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sensor Hub</h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400">Monitoring all {sensors.length} sensors</p>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-green-400 shadow-green-200 shadow-md">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Filter Type Selector */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Filter by</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterRange({ min: 0, max: 100 });
                setFilterStatus('all');
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Sensors</option>
              <option value="moisture">Moisture Level</option>
              <option value="temperature">Temperature</option>
              <option value="humidity">Humidity</option>
              <option value="status">Status (saturated/Optimal/Dry)</option>
            </select>
          </div>

          {/* Range Filter (for moisture/temp/humidity) */}
          {(filterType === 'moisture' || filterType === 'temperature' || filterType === 'humidity') && (
            <div className="flex gap-2">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Min</label>
                <input
                  type="number"
                  value={filterRange.min}
                  onChange={(e) => setFilterRange({ ...filterRange, min: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Max</label>
                <input
                  type="number"
                  value={filterRange.max}
                  onChange={(e) => setFilterRange({ ...filterRange, max: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 self-end"
              >
                Apply
              </button>
            </div>
          )}

          {/* Status Filter */}
          {filterType === 'status' && (
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="saturated">saturated</option>
                <option value="Optimal">Optimal</option>
                <option value="Dry">Dry</option>
              </select>
            </div>
          )}

          {/* Clear Filters */}
          {filterType !== 'all' && (
            <button
              onClick={() => {
                setFilterType('all');
                setFilterRange({ min: 0, max: 100 });
                setFilterStatus('all');
              }}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 self-end"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Sensors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSensors.map((sensor) => {
          const status = getStatus(sensor.moisture);
          return (
            <Link key={sensor.nodeId} href={`/sensors/${sensor.nodeId}`}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all border-green-400 shadow-green-200 shadow-md">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {sensor.nodeId.replace('_', ' ')}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${status.color} bg-opacity-10 ${status.bgColor}`}>
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

      {/* No Results */}
      {filteredSensors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No sensors match the selected filters.
        </div>
      )}
    </div>
  );
}
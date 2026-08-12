'use client';

import { useEffect, useState } from 'react';
import { database } from '@/lib/firebase/client';
import { ref, onValue } from 'firebase/database';
import { SmartInsight } from '@/components/SmartInsight';
import { NotificationButton } from '@/components/NotificationButton';
import { PlantRecommendationChat } from '@/components/PlantRecommendationChat';

interface SensorData {
  Humidity: number;
  Temperature: number;
  Soil_Moisture: Record<string, number>;
}

export default function Home() {
  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Load saved auto-play state
  useEffect(() => {
    const savedAutoPlay = localStorage.getItem('dashboard_auto_play');
    setIsAutoPlaying(savedAutoPlay === 'true' ? true : false);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('dashboard_auto_play', String(isAutoPlaying));
    }
  }, [isAutoPlaying, isInitialized]);

  // REAL-TIME Firebase listener
  useEffect(() => {
    if (!database) {
      setFirebaseError('Firebase not initialized. Please check environment variables.');
      setLoading(false);
      return;
    }

    const currentDataRef = ref(database, 'CurrentData');
    
    const unsubscribe = onValue(currentDataRef, (snapshot) => {
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        
        const transformedData: SensorData = {
          Humidity: rawData.humidity || rawData.Humidity || 0,
          Temperature: rawData.temperature || rawData.Temperature || 0,
          Soil_Moisture: {}
        };
        
        const soilData = rawData.soil_moisture || rawData.Soil_Moisture || {};
        
        Object.entries(soilData).forEach(([key, value]) => {
          const nodeId = key.replace('node_', 'Node_');
          transformedData.Soil_Moisture[nodeId] = value as number;
        });
        
        setData(transformedData);
        setLoading(false);
        setFirebaseError(null);
      } else {
        setLoading(false);
      }
    }, (error) => {
      console.error('Firebase listener error:', error);
      setFirebaseError('Failed to connect to Firebase.');
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Auto-cycle carousel
  useEffect(() => {
    if (!isAutoPlaying || !data) return;
    const sensors = Object.entries(data.Soil_Moisture || {});
    if (sensors.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sensors.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, data]);

  if (loading) return <div className="text-center py-8 text-gray-800 dark:text-white">Loading sensor data...</div>;
  
  if (firebaseError) {
    return <div className="text-center py-8 text-red-600 dark:text-red-400">{firebaseError}</div>;
  }
  
  if (!data) return <div className="text-center py-8 text-gray-800 dark:text-white">No data available</div>;

  const sensors = Object.entries(data.Soil_Moisture || {}).map(([nodeId, value]) => ({
    nodeId,
    moisture: value,
    temperature: data.Temperature,
    humidity: data.Humidity,
  }));

  if (sensors.length === 0) {
    return <div className="text-center py-8 text-gray-800 dark:text-white">No sensors found</div>;
  }

  const currentSensor = sensors[currentIndex];

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + sensors.length) % sensors.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % sensors.length);
  };

  const togglePause = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <NotificationButton />
      </div>
      
      <SmartInsight temperature={data.Temperature} humidity={data.Humidity} />

      {currentSensor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Sensor Card - Fixed height */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-8 flex flex-col items-center border-2 border-green-400 transition-all min-h-[400px]">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              {currentSensor.nodeId.replace('_', ' ')} - Plant {currentSensor.nodeId.replace('Node_', '')}
            </h3>
            <div className="w-32 h-32 relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - currentSensor.moisture / 100)}
                  className={currentSensor.moisture > 80 ? 'text-blue-500' : currentSensor.moisture > 40 ? 'text-green-500' : 'text-orange-500'}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-800 dark:text-white">{currentSensor.moisture}%</span>
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                currentSensor.moisture > 80 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                currentSensor.moisture > 40 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
              }`}>
                {currentSensor.moisture > 80 ? 'Saturated' : currentSensor.moisture > 40 ? 'Optimal' : 'Dry'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 w-full">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-2xl">🌡️</span>
                <div className="text-xl font-bold text-gray-800 dark:text-white">{currentSensor.temperature}°C</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Temperature</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-2xl">💧</span>
                <div className="text-xl font-bold text-gray-800 dark:text-white">{currentSensor.humidity}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
              </div>
            </div>
          </div>

          {/* Right Side - Chat Component */}
          <div className="h-full">
            <PlantRecommendationChat 
              sensorId={currentSensor.nodeId}
              defaultTemperature={currentSensor.temperature}
              defaultHumidity={currentSensor.humidity}
            />
          </div>
        </div>
      )}

      {/* Pagination Dots */}
      <div className="flex justify-center items-center gap-3 mt-8">
        {sensors.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAutoPlaying(false);
              setCurrentIndex(index);
            }}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-2 bg-green-500'
                : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Manual Controls + Pause Button */}
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={handlePrevious}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={togglePause}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          {isAutoPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Next →
        </button>
      </div>

      {isAutoPlaying && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Auto-cycling • Next in 6 seconds
        </p>
      )}
    </div>
  );
}
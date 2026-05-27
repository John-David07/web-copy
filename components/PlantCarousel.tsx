'use client';

import { useState, useEffect } from 'react';
import { CircularProgress } from './CircularProgress';
import { PlantRecommendations } from './PlantRecommendations';

interface PlantCarouselProps {
  sensors: Array<{
    nodeId: string;
    moisture: number;
    temperature: number;
    humidity: number;
  }>;
}

export function PlantCarousel({ sensors }: PlantCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-cycle every 6 seconds
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sensors.length);
    }, 6000); // 6 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, sensors.length]);

  const currentSensor = sensors[currentIndex];

  if (!currentSensor) return null;

  return (
    <div className="flex flex-col">
      {/* Main Carousel Content - Sensor + Recommendations Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Sensor Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-8 flex flex-col items-center border-2 border-green-400 shadow-green-200 dark:shadow-green-500/25 hover:shadow-lg dark:hover:shadow-green-500/40 hover:border-green-300 dark:hover:border-green-300 transition-all">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {currentSensor.nodeId.replace('_', ' ')} - Plant {currentSensor.nodeId.replace('Node_', '')}
          </h3>
          <CircularProgress value={currentSensor.moisture} label="Moisture" />
          <div className="grid grid-cols-2 gap-4 mt-6 w-full">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-2xl">🌡️</span>
              <div className="text-xl font-bold text-gray-800 dark:text-white">{currentSensor.temperature}°C</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Temperature</div>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-2xl">💨</span>
              <div className="text-xl font-bold text-gray-800 dark:text-white">{currentSensor.humidity}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
            </div>
          </div>
        </div>

        {/* Right Side - Plant Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 border-2 border-green-400 shadow-green-200 dark:shadow-green-500/25 hover:shadow-lg dark:hover:shadow-green-500/40 hover:border-green-300 dark:hover:border-green-300 transition-all">
          <PlantRecommendations 
            moisture={currentSensor.moisture}
            temperature={currentSensor.temperature}
            humidity={currentSensor.humidity}
          />
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center items-center gap-3 mt-8">
        {sensors.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsAutoPlaying(false);
              setCurrentIndex(index);
              // Resume auto-play after 10 seconds of inactivity
              setTimeout(() => setIsAutoPlaying(true), 10000);
            }}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-2 bg-green-500'
                : 'w-2 h-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Manual Controls */}
      <div className="flex justify-center gap-4 mt-4">
        <button
          onClick={() => {
            setIsAutoPlaying(false);
            setCurrentIndex((prev) => (prev - 1 + sensors.length) % sensors.length);
            setTimeout(() => setIsAutoPlaying(true), 10000);
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={() => {
            setIsAutoPlaying(false);
            setCurrentIndex((prev) => (prev + 1) % sensors.length);
            setTimeout(() => setIsAutoPlaying(true), 10000);
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Next →
        </button>
      </div>

      {/* Auto-play indicator */}
      {isAutoPlaying && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
          Auto-cycling • Next in 6 seconds
        </p>
      )}
    </div>
  );
}
'use client';

import { useEffect, useState, useRef } from 'react';

interface Plant {
  name: string;
  scientificName: string;
  reason: string;
}

interface PlantRecommendationsProps {
  moisture: number;
  temperature: number;
  humidity: number;
  onRefresh?: () => void;
}

const FALLBACK_PLANTS: Plant[] = [
  {
    name: "Snake Plant",
    scientificName: "Sansevieria trifasciata",
    reason: "Extremely adaptable and tolerates a wide range of conditions."
  },
  {
    name: "ZZ Plant",
    scientificName: "Zamioculcas zamiifolia",
    reason: "Survives in low light and irregular watering schedules."
  },
  {
    name: "Pothos",
    scientificName: "Epipremnum aureum",
    reason: "Very forgiving plant that adapts to most indoor environments."
  }
];

export function PlantRecommendations({ 
  moisture, 
  temperature, 
  humidity, 
  onRefresh 
}: PlantRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Plant[]>(FALLBACK_PLANTS);
  const [loading, setLoading] = useState(true);
  const [isAiMode, setIsAiMode] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track previous values for deadband
  const prevMoistureRef = useRef<number>(moisture);
  const prevTempRef = useRef<number>(temperature);
  const prevHumidityRef = useRef<number>(humidity);
  const hasFetchedRef = useRef<boolean>(false);

  // Deadband tolerance
  const DEADBAND_TOLERANCE = 10;

  const shouldFetchNewRecommendations = (newMoisture: number, newTemp: number, newHumidity: number) => {
    const moistureDiff = Math.abs(newMoisture - prevMoistureRef.current);
    const tempDiff = Math.abs(newTemp - prevTempRef.current);
    const humidityDiff = Math.abs(newHumidity - prevHumidityRef.current);
    
    if (moistureDiff >= DEADBAND_TOLERANCE || tempDiff >= 2 || humidityDiff >= 5) {
      console.log(`🔄 Deadband triggered: moisture Δ=${moistureDiff}%, temp Δ=${tempDiff}°C, humidity Δ=${humidityDiff}%`);
      return true;
    }
    
    console.log(`⏸️ Deadband ignored: moisture Δ=${moistureDiff}%, temp Δ=${tempDiff}°C, humidity Δ=${humidityDiff}%`);
    return false;
  };

  const fetchRecommendations = async (force = false) => {
    // Check deadband unless forced
    if (!force && hasFetchedRef.current && !shouldFetchNewRecommendations(moisture, temperature, humidity)) {
      return;
    }
    
    // Update previous values
    prevMoistureRef.current = moisture;
    prevTempRef.current = temperature;
    prevHumidityRef.current = humidity;
    hasFetchedRef.current = true;
    
    setLoading(true);
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moisture, temperature, humidity }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setIsAiMode(true);
        setCurrentIndex(0);
      } else {
        setRecommendations(FALLBACK_PLANTS);
        setIsAiMode(false);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setRecommendations(FALLBACK_PLANTS);
      setIsAiMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await fetchRecommendations(true);
    setIsRefreshing(false);
    if (onRefresh) onRefresh();
  };

  // Initial fetch only
  useEffect(() => {
    fetchRecommendations(false);
  }, []);

  if (loading && recommendations === FALLBACK_PLANTS) {
    return (
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 text-center">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-4">AI is analyzing conditions...</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 border-2 border-green-400 shadow-green-200 dark:shadow-green-500/25 hover:shadow-lg dark:hover:shadow-green-500/40 hover:border-green-300 dark:hover:border-green-300 transition-all">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Plant Recommendation
            </h3>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50"
            >
              {isRefreshing ? (
                <div className="w-5 h-5 border-2 border-green-600 dark:border-green-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recommendations available</p>
        </div>
      </div>
    );
  }

  const plant = recommendations[currentIndex];

  return (
    <div className="mt-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 border-2 border-green-400 shadow-green-200 dark:shadow-green-500/25 hover:shadow-lg dark:hover:shadow-green-500/40 hover:border-green-300 dark:hover:border-green-300 transition-all">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Plant Recommendation
          </h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50 transition-colors"
            title="Get new recommendations"
          >
            {isRefreshing ? (
              <div className="w-5 h-5 border-2 border-green-600 dark:border-green-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>

        <div className="text-center">
          <h4 className="text-xl font-bold text-gray-900 dark:text-white">
            {plant.name}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
            {plant.scientificName}
          </p>
          <p className="text-gray-700 dark:text-gray-300 mt-4">
            {plant.reason}
          </p>
        </div>

        {recommendations.length > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setCurrentIndex(prev => prev - 1)}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              ←
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentIndex + 1} of {recommendations.length}
            </span>
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              disabled={currentIndex === recommendations.length - 1}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              →
            </button>
          </div>
        )}

        {recommendations.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {recommendations.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-green-500' : 'w-2 bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-500 mt-4 text-center">
        {isAiMode 
          ? "AI-powered recommendations based on current sensor readings"
          : "Using default recommendations (AI service temporarily unavailable)"}
      </p>
    </div>
  );
}
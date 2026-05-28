'use client';

import { useEffect, useState, useRef } from 'react';

interface Plant {
  name: string;
  scientificName: string;
  reason: string;
  care?: {
    light: string;
    water: string;
    temperature: string;
    humidity: string;
    soil: string;
    fertilizer: string;
    tips: string;
    commonProblems: string;
  };
}

interface PlantRecommendationsProps {
  moisture: number;
  temperature: number;
  humidity: number;
  sensorId?: string;
}

const FALLBACK_PLANTS: Plant[] = [
  {
    name: "Snake Plant",
    scientificName: "Sansevieria trifasciata",
    reason: "Extremely adaptable and tolerates a wide range of conditions.",
    care: {
      light: "Low to bright indirect light. Avoid direct sunlight.",
      water: "Water every 2-6 weeks. Let soil dry completely between waterings.",
      temperature: "18-27°C (65-80°F)",
      humidity: "Low to moderate. Very adaptable.",
      soil: "Well-draining cactus/succulent mix.",
      fertilizer: "Fertilize once in spring and summer with cactus fertilizer.",
      tips: "Very hard to kill! Perfect for beginners. Wipe leaves occasionally.",
      commonProblems: "Overwatering (yellow leaves), Cold damage, Root rot"
    }
  },
  {
    name: "ZZ Plant",
    scientificName: "Zamioculcas zamiifolia",
    reason: "Survives in low light and irregular watering schedules.",
    care: {
      light: "Low to bright indirect light. Very shade tolerant.",
      water: "Water every 2-3 weeks. Allow soil to dry completely.",
      temperature: "18-24°C (65-75°F)",
      humidity: "Low to high. Very adaptable.",
      soil: "Well-draining potting mix with perlite.",
      fertilizer: "Fertilize 2-3 times per year with balanced fertilizer.",
      tips: "Drought tolerant. Wipe leaves to keep them shiny.",
      commonProblems: "Yellow leaves (overwatering), Root rot, Slow growth"
    }
  },
  {
    name: "Pothos",
    scientificName: "Epipremnum aureum",
    reason: "Very forgiving plant that adapts to most indoor environments.",
    care: {
      light: "Low to bright indirect light. Variegation needs more light.",
      water: "Water when top 2 inches of soil are dry.",
      temperature: "18-29°C (65-85°F)",
      humidity: "Moderate to high. Benefits from occasional misting.",
      soil: "Well-draining potting mix.",
      fertilizer: "Fertilize monthly during growing season.",
      tips: "Trailing or climbing. Propagate easily from cuttings.",
      commonProblems: "Brown leaves (underwatering), Yellow leaves (overwatering), Leggy growth (not enough light)"
    }
  }
];

// Cache functions
const getCachedRecommendations = (cacheKey: string): Plant[] | null => {
  try {
    const cached = localStorage.getItem(`rec_cache_${cacheKey}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 30 * 60 * 1000) {
        return data;
      }
    }
  } catch (e) {}
  return null;
};

const setCachedRecommendations = (cacheKey: string, data: Plant[]) => {
  try {
    localStorage.setItem(`rec_cache_${cacheKey}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {}
};

// Save current recommendations for persistence on app restart
const saveCurrentRecommendations = (sensorId: string, recommendations: Plant[], currentIndex: number) => {
  try {
    localStorage.setItem(`rec_current_${sensorId}`, JSON.stringify({
      recommendations,
      currentIndex,
      timestamp: Date.now()
    }));
  } catch (e) {}
};

const loadCurrentRecommendations = (sensorId: string): { recommendations: Plant[]; currentIndex: number } | null => {
  try {
    const saved = localStorage.getItem(`rec_current_${sensorId}`);
    if (saved) {
      const { recommendations, currentIndex, timestamp } = JSON.parse(saved);
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return { recommendations, currentIndex };
      }
    }
  } catch (e) {}
  return null;
};

let lastFetchedKey: string | null = null;

// History functions
const getHistory = (sensorId: string): any[] => {
  try {
    const stored = localStorage.getItem(`rec_history_${sensorId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return [];
};

const addToHistory = (sensorId: string, entry: any) => {
  const history = getHistory(sensorId);
  const newEntry = { ...entry, id: Date.now().toString() };
  history.unshift(newEntry);
  const trimmed = history.slice(0, 10);
  localStorage.setItem(`rec_history_${sensorId}`, JSON.stringify(trimmed));
};

export function PlantRecommendations({ moisture, temperature, humidity, sensorId = 'default' }: PlantRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiMode, setIsAiMode] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showCareDialog, setShowCareDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const getCacheKey = (m: number, t: number, h: number) => {
    const roundedMoisture = Math.round(m / 10) * 10;
    const roundedTemp = Math.round(t);
    const roundedHumidity = Math.round(h / 10) * 10;
    return `${roundedMoisture}_${roundedTemp}_${roundedHumidity}`;
  };

  // Load saved recommendations on app restart
  useEffect(() => {
    const saved = loadCurrentRecommendations(sensorId);
    if (saved && saved.recommendations.length > 0) {
      console.log(`📦 Restored saved recommendations for ${sensorId}`);
      setRecommendations(saved.recommendations);
      setCurrentIndex(saved.currentIndex);
      setIsAiMode(true);
      setLoading(false);
    }
    setIsInitialized(true);
  }, [sensorId]);

  // Save recommendations when they change
  useEffect(() => {
    if (recommendations.length > 0 && isInitialized) {
      saveCurrentRecommendations(sensorId, recommendations, currentIndex);
    }
  }, [recommendations, currentIndex, sensorId, isInitialized]);

  // Add to history when carousel cycles to a new sensor
  useEffect(() => {
    if (recommendations.length > 0 && sensorId !== 'default' && isInitialized) {
      const existingHistory = getHistory(sensorId);
      const today = new Date().toISOString().split('T')[0];
      const hasTodayEntry = existingHistory.some(entry => 
        entry.dateRecommended && entry.dateRecommended.startsWith(today)
      );
      
      if (!hasTodayEntry) {
        console.log(`📝 Carousel cycle - adding to history for ${sensorId}`);
        recommendations.forEach(plant => {
          addToHistory(sensorId, {
            plantName: plant.name,
            scientificName: plant.scientificName,
            reason: plant.reason,
            dateRecommended: new Date().toISOString(),
            moisture: moisture,
            moistureStatus: moisture > 80 ? 'Saturated' : moisture > 40 ? 'Optimal' : 'Dry',
            temperature: temperature,
            humidity: humidity,
          });
        });
      }
    }
  }, [sensorId, moisture, temperature, humidity, recommendations, isInitialized]);

  const fetchRecommendations = async () => {
    const cacheKey = getCacheKey(moisture, temperature, humidity);
    
    // Check localStorage cache first
    const cached = getCachedRecommendations(cacheKey);
    if (cached) {
      console.log(`📦 Using cached recommendations for ${cacheKey}`);
      console.log('📦 Cached plant has care:', !!cached[0]?.care);
      setRecommendations(cached);
      setIsAiMode(true);
      setLoading(false);
      return;
    }
    
    if (lastFetchedKey === cacheKey) {
      console.log(`⏸️ Skipping API call - identical conditions to last fetch`);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    lastFetchedKey = cacheKey;
    
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moisture, temperature, humidity }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        console.log('📦 API response - first plant has care:', !!data.recommendations[0]?.care);
        setRecommendations(data.recommendations);
        setIsAiMode(true);
        setCurrentIndex(0);
        setCachedRecommendations(cacheKey, data.recommendations);
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

  // Fetch only if no saved recommendations exist
  useEffect(() => {
    if (isInitialized && recommendations.length === 0) {
      fetchRecommendations();
    }
  }, [moisture, temperature, humidity, isInitialized]);

  const handlePlantClick = (plant: Plant) => {
    console.log('Plant clicked - has care:', !!plant.care);
    if (plant.care) {
      console.log('Care data:', plant.care);
    }
    setSelectedPlant(plant);
    setShowCareDialog(true);
  };

  const closeCareDialog = () => {
    setShowCareDialog(false);
    setSelectedPlant(null);
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 text-center border-2 border-green-400">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-4">AI is analyzing conditions...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 border-2 border-green-400">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Plant Recommendation</h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recommendations available</p>
      </div>
    );
  }

  const plant = recommendations[currentIndex];

  return (
    <>
      {/* Care Dialog Modal */}
      {showCareDialog && selectedPlant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeCareDialog}>
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-green-700 text-white p-4 rounded-t-xl">
              <h3 className="text-xl font-bold">{selectedPlant.name}</h3>
              <p className="text-sm italic opacity-90">{selectedPlant.scientificName}</p>
            </div>
            <div className="p-4 space-y-4">
              {selectedPlant.care ? (
                <>
                  <div className="border-b dark:border-gray-700 pb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">☀️ Light</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{selectedPlant.care.light}</p>
                  </div>
                  <div className="border-b dark:border-gray-700 pb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">💧 Water</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{selectedPlant.care.water}</p>
                  </div>
                  <div className="border-b dark:border-gray-700 pb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">🌡️ Temperature</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{selectedPlant.care.temperature}</p>
                  </div>
                  <div className="border-b dark:border-gray-700 pb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">💨 Humidity</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{selectedPlant.care.humidity}</p>
                  </div>
                  <div className="border-b dark:border-gray-700 pb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">🌱 Soil</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{selectedPlant.care.soil}</p>
                  </div>
                  <div className="border-b dark:border-gray-700 pb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">🧪 Fertilizer</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{selectedPlant.care.fertilizer}</p>
                  </div>
                  <div className="border-b dark:border-gray-700 pb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">💡 Pro Tips</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{selectedPlant.care.tips}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">⚠️ Common Problems</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{selectedPlant.care.commonProblems}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Care information temporarily unavailable</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Please check back later</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-900 p-4 rounded-b-xl">
              <button
                onClick={closeCareDialog}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 border-2 border-green-400 transition-all cursor-pointer hover:shadow-lg"
           onClick={() => handlePlantClick(plant)}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Plant Recommendation
          </h3>
          <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
            <span className="text-xs text-green-600 dark:text-green-400">Tap for care guide</span>
          </div>
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
          <>
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev - 1); }}
                disabled={currentIndex === 0}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                ←
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentIndex + 1} of {recommendations.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev + 1); }}
                disabled={currentIndex === recommendations.length - 1}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                →
              </button>
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {recommendations.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentIndex ? 'w-6 bg-green-500' : 'w-2 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-500 mt-6 text-center">
          {isAiMode 
            ? "AI-powered recommendations based on current sensor readings • Tap for care guide"
            : "Using default recommendations (AI service temporarily unavailable)"}
        </p>
      </div>
    </>
  );
}
'use client';

import { useEffect, useState } from 'react';

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
  ph: number;
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
      soil: "Well-draining cactus/succulent mix. pH 6.0-7.5",
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
      soil: "Well-draining potting mix with perlite. pH 6.0-7.0",
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
      soil: "Well-draining potting mix. pH 6.0-7.0",
      fertilizer: "Fertilize monthly during growing season.",
      tips: "Trailing or climbing. Propagate easily from cuttings.",
      commonProblems: "Brown leaves (underwatering), Yellow leaves (overwatering), Leggy growth (not enough light)"
    }
  }
];

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
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}_${history.length}_${sensorId}`;
  const newEntry = { ...entry, id: uniqueId };
  history.unshift(newEntry);
  const trimmed = history.slice(0, 10);
  localStorage.setItem(`rec_history_${sensorId}`, JSON.stringify(trimmed));
};

export function PlantRecommendations({ moisture, temperature, humidity, sensorId = 'default', ph }: PlantRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Plant[]>([]);
  const [plantImages, setPlantImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [isAiMode, setIsAiMode] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showCareDialog, setShowCareDialog] = useState(false);

  const fetchPlantImage = async (plantName: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/plant-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantName }),
      });
      
      const data = await response.json();
      return data.imageUrl || null;
    } catch (error) {
      console.error('Failed to fetch plant image:', error);
      return null;
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    
    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moisture, ph, temperature, humidity }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setIsAiMode(true);
        setCurrentIndex(0);
        
        // Fetch images for each plant
        const images: Record<string, string> = {};
        for (const plant of data.recommendations) {
          const imageUrl = await fetchPlantImage(plant.name);
          if (imageUrl) {
            images[plant.name] = imageUrl;
          }
        }
        setPlantImages(images);
        
        // Add to history
        if (sensorId !== 'default') {
          const today = new Date().toISOString().split('T')[0];
          const existingHistory = getHistory(sensorId);
          const hasTodayEntry = existingHistory.some((entry: any) => 
            entry.dateRecommended && entry.dateRecommended.startsWith(today)
          );
          
          if (!hasTodayEntry) {
            data.recommendations.forEach((plant: Plant) => {
              addToHistory(sensorId, {
                plantName: plant.name,
                scientificName: plant.scientificName,
                reason: plant.reason,
                dateRecommended: new Date().toISOString(),
                moisture: moisture,
                ph: ph,
                moistureStatus: moisture > 80 ? 'Saturated' : moisture > 40 ? 'Optimal' : 'Dry',
                temperature: temperature,
                humidity: humidity,
              });
            });
          }
        }
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

  useEffect(() => {
    fetchRecommendations();
  }, [moisture, ph, temperature, humidity]);

  const handlePlantClick = (plant: Plant) => {
    setSelectedPlant(plant);
    setShowCareDialog(true);
  };

  const closeCareDialog = () => {
    setShowCareDialog(false);
    setSelectedPlant(null);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 text-center border-2 border-green-400">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-4">AI is generating recommendations...</p>
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
  const plantImage = plantImages[plant.name] || null;

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

        {/* Image + Plant Info */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {plantImage && (
            <div className="w-32 h-32 relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
              <img
                src={plantImage}
                alt={plant.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              {plant.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
              {plant.scientificName}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-2 text-sm">
              {plant.reason}
            </p>
          </div>
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

        <div className="mt-6 text-center">
          {isAiMode ? (
            <>
              <p className="text-xs text-green-600 dark:text-green-400">
                🤖 AI-powered recommendations based on your inputs
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                💡 Tip: Tap any plant for detailed care guide
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                ⚠️ AI service is currently experiencing high demand
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                💡 Showing fallback recommendations. Try again later.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
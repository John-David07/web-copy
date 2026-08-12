'use client';

import { useState } from 'react';
import { PlantRecommendations } from './PlantRecommendations';

interface PlantRecommendationChatProps {
  sensorId?: string;
  defaultTemperature?: number;
  defaultHumidity?: number;
}

export function PlantRecommendationChat({ 
  sensorId = 'default',
  defaultTemperature = 25,
  defaultHumidity = 60
}: PlantRecommendationChatProps) {
  const [moisture, setMoisture] = useState('');
  const [ph, setPh] = useState('');
  const [temperature, setTemperature] = useState(defaultTemperature.toString());
  const [humidity, setHumidity] = useState(defaultHumidity.toString());
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState({
    moisture: 50,
    ph: 7,
    temperature: 25,
    humidity: 60
  });
  const [sensorInput, setSensorInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const moistureNum = parseFloat(moisture);
    const phNum = parseFloat(ph);
    const tempNum = parseFloat(temperature);
    const humNum = parseFloat(humidity);
    
    if (isNaN(moistureNum) || isNaN(phNum) || isNaN(tempNum) || isNaN(humNum)) {
      alert('Please enter valid numbers for all fields');
      return;
    }
    
    setSubmittedData({
      moisture: moistureNum,
      ph: phNum,
      temperature: tempNum,
      humidity: humNum
    });
    setSubmitted(true);
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Moisture: ${moistureNum}%, pH: ${phNum}, Temperature: ${tempNum}°C, Humidity: ${humNum}%`
    }]);
  };

  const handleReset = () => {
    setSubmitted(false);
    setMoisture('');
    setPh('');
    setMessages([]);
  };

  return (
    <div className="space-y-4">
      {/* Chat Input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-400">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          🌱 Plant Recommendation Chat
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Enter your soil and environmental conditions to get AI plant recommendations
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Soil Moisture (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={moisture}
                onChange={(e) => setMoisture(e.target.value)}
                placeholder="e.g. 65"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Soil pH (0-14)
              </label>
              <input
                type="number"
                min="0"
                max="14"
                step="0.1"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                placeholder="e.g. 6.5"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                min="-10"
                max="60"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 28"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Humidity (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                placeholder="e.g. 60"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔍 Get Recommendations
            </button>
            
            {submitted && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Start New Search
              </button>
            )}
          </div>
        </form>
        
        <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          💡 Tip: Moisture 40-80% = Optimal | pH 6.0-7.5 = Ideal for most plants | Temp 18-28°C = Ideal
        </div>
      </div>
      
      {/* Results */}
      {submitted && (
        <PlantRecommendations 
          moisture={submittedData.moisture}
          temperature={submittedData.temperature}
          humidity={submittedData.humidity}
          sensorId={sensorId}
          ph={submittedData.ph}
          key={`${sensorId}_${submittedData.moisture}_${submittedData.ph}_${Date.now()}`}
        />
      )}
    </div>
  );
}
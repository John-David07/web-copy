'use client';

import { useState, useEffect } from 'react';
import { PlantRecommendations } from './PlantRecommendations';

interface PlantRecommendationChatProps {
  sensorId?: string;
  defaultTemperature?: number;
  defaultHumidity?: number;
  defaultMoisture?: number;
}

// Per-node session storage
interface NodeSession {
  moisture: number;
  ph: number;
  temperature: number;
  humidity: number;
  recommendations: PlantRecommendationsProps | null;
  hasSubmitted: boolean;
}

interface PlantRecommendationsProps {
  moisture: number;
  temperature: number;
  humidity: number;
  sensorId?: string;
  ph: number;
}

export function PlantRecommendationChat({ 
  sensorId = 'default',
  defaultTemperature = 25,
  defaultHumidity = 60,
  defaultMoisture = 50
}: PlantRecommendationChatProps) {
  const [moisture, setMoisture] = useState(defaultMoisture.toString());
  const [ph, setPh] = useState('');
  const [temperature, setTemperature] = useState(defaultTemperature.toString());
  const [humidity, setHumidity] = useState(defaultHumidity.toString());
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState({
    moisture: defaultMoisture,
    ph: 7,
    temperature: defaultTemperature,
    humidity: defaultHumidity
  });
  const [recommendationKey, setRecommendationKey] = useState(0);
  
  // Store session data per sensor
  const [nodeSessions, setNodeSessions] = useState<Record<string, NodeSession>>({});

  // Load session data for current sensor
  useEffect(() => {
    // Check if we have a saved session for this sensor
    const savedSession = localStorage.getItem(`node_session_${sensorId}`);
    if (savedSession) {
      try {
        const session: NodeSession = JSON.parse(savedSession);
        if (session.hasSubmitted && session.recommendations) {
          // Restore the session
          setSubmittedData({
            moisture: session.moisture,
            ph: session.ph,
            temperature: session.temperature,
            humidity: session.humidity
          });
          setMoisture(session.moisture.toString());
          setPh(session.ph.toString());
          setTemperature(session.temperature.toString());
          setHumidity(session.humidity.toString());
          setSubmitted(true);
          setRecommendationKey(prev => prev + 1);
          
          // Store in memory
          setNodeSessions(prev => ({
            ...prev,
            [sensorId]: session
          }));
          return;
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      }
    }
    
    // No saved session - reset to defaults
    setSubmitted(false);
    setPh('');
    setMoisture(defaultMoisture.toString());
    setTemperature(defaultTemperature.toString());
    setHumidity(defaultHumidity.toString());
  }, [sensorId, defaultMoisture, defaultTemperature, defaultHumidity]);

  // Save session when recommendations are made
  const saveSession = (data: { moisture: number; ph: number; temperature: number; humidity: number }) => {
    const session: NodeSession = {
      moisture: data.moisture,
      ph: data.ph,
      temperature: data.temperature,
      humidity: data.humidity,
      recommendations: {
        moisture: data.moisture,
        ph: data.ph,
        temperature: data.temperature,
        humidity: data.humidity,
        sensorId: sensorId,
      },
      hasSubmitted: true
    };
    
    localStorage.setItem(`node_session_${sensorId}`, JSON.stringify(session));
    setNodeSessions(prev => ({
      ...prev,
      [sensorId]: session
    }));
  };

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
    
    const data = {
      moisture: moistureNum,
      ph: phNum,
      temperature: tempNum,
      humidity: humNum
    };
    
    setSubmittedData(data);
    setSubmitted(true);
    setRecommendationKey(prev => prev + 1);
    
    // Save session
    saveSession(data);
  };

  const handleReset = () => {
    setSubmitted(false);
    setMoisture(defaultMoisture.toString());
    setPh('');
    setTemperature(defaultTemperature.toString());
    setHumidity(defaultHumidity.toString());
    setRecommendationKey(prev => prev + 1);
    
    // Clear session for this sensor
    localStorage.removeItem(`node_session_${sensorId}`);
    setNodeSessions(prev => {
      const updated = { ...prev };
      delete updated[sensorId];
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {/* Chat Input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-400">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          🌱 A.I. Plant Recommendation
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Enter soil conditions to get AI plant recommendations
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
          key={recommendationKey}
          moisture={submittedData.moisture}
          temperature={submittedData.temperature}
          humidity={submittedData.humidity}
          sensorId={sensorId}
          ph={submittedData.ph}
        />
      )}
    </div>
  );
}
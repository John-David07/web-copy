'use client';

import { useEffect, useState } from 'react';

interface HistoryEntry {
  id: string;
  plantName: string;
  scientificName: string;
  reason: string;
  dateRecommended: string;
  moisture: number;
  moistureStatus: string;
  temperature: number;
  humidity: number;
}

interface RecommendationHistoryProps {
  sensorId: string;
}

// Load history from localStorage
export const getHistory = (sensorId: string): HistoryEntry[] => {
  try {
    const stored = localStorage.getItem(`rec_history_${sensorId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return [];
};

const saveHistory = (sensorId: string, history: HistoryEntry[]) => {
  try {
    // Keep only last 10 entries
    const trimmed = history.slice(0, 10);
    localStorage.setItem(`rec_history_${sensorId}`, JSON.stringify(trimmed));
  } catch (e) {}
};

export const addToHistory = (sensorId: string, entry: Omit<HistoryEntry, 'id'>) => {
  const history = getHistory(sensorId);
  const newEntry = {
    ...entry,
    id: Date.now().toString(),
  };
  history.unshift(newEntry);
  saveHistory(sensorId, history);
  return history;
};

export function RecommendationHistory({ sensorId }: RecommendationHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    setHistory(getHistory(sensorId));
  }, [sensorId]);

  const clearHistory = () => {
    if (confirm('Clear all recommendation history for this sensor?')) {
      localStorage.removeItem(`rec_history_${sensorId}`);
      setHistory([]);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMoistureColor = (status: string) => {
    switch (status) {
      case 'Saturated': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'Optimal': return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default: return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
    }
  };

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const displayedHistory = history.slice(startIndex, startIndex + itemsPerPage);

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-400">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plant Recommendation History</h3>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No recommendations recorded yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-400">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Plant Recommendation History</h3>
        <button
          onClick={clearHistory}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-700"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-4">
        {displayedHistory.map((entry) => (
          <div key={entry.id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{entry.plantName}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">{entry.scientificName}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMoistureColor(entry.moistureStatus)}`}>
                {entry.moistureStatus}
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(entry.dateRecommended)}</p>
            <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
              <span>💧 {entry.moisture}%</span>
              <span>🌡️ {entry.temperature}°C</span>
              <span>💨 {entry.humidity}%</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{entry.reason}</p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
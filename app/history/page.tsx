'use client';

import { useEffect, useState } from 'react';

interface SensorReading {
  nodeId: string;
  moisture: number;
}

interface HistoryRecord {
  time: string;
  date: Date;
  sensorReadings: SensorReading[];
  temperature: number;
  humidity: number;
  previousMoistureMap: Map<string, number>;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const recordsPerPage = 10;

  const [selectedSensor, setSelectedSensor] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/sensors/history');
        const data = await res.json();
        setAllData(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  useEffect(() => {
    if (!allData || !Array.isArray(allData)) return;

    const soilSensor = allData.find((item: any) => item.id === 'soil_sensor');
    const temperatureData = allData.find((item: any) => item.id === 'temperature');
    const humidityData = allData.find((item: any) => item.id === 'humidity');

    if (!soilSensor) {
      setHistory([]);
      return;
    }

    const sensors = ['node_1', 'node_2', 'node_3', 'node_4', 'node_5'];
    const historyMap = new Map<string, HistoryRecord>();

    sensors.forEach(sensor => {
      const sensorData = soilSensor[sensor];
      if (!sensorData || typeof sensorData !== 'object') return;

      Object.values(sensorData).forEach((entry: any) => {
        if (entry && typeof entry === 'object' && 'value' in entry && 'time' in entry) {
          const timeStr = entry.time;
          const moistureValue = entry.value;

          if (!historyMap.has(timeStr)) {
            historyMap.set(timeStr, {
              time: timeStr,
              date: parseCustomDate(timeStr),
              sensorReadings: [],
              temperature: 0,
              humidity: 0,
              previousMoistureMap: new Map(),
            });
          }

          historyMap.get(timeStr)!.sensorReadings.push({
            nodeId: sensor,
            moisture: moistureValue,
          });
        }
      });
    });

    if (temperatureData && typeof temperatureData === 'object') {
      Object.values(temperatureData).forEach((entry: any) => {
        if (entry && typeof entry === 'object' && 'value' in entry && 'time' in entry) {
          const timeStr = entry.time;
          if (historyMap.has(timeStr)) {
            historyMap.get(timeStr)!.temperature = entry.value;
          }
        }
      });
    }

    if (humidityData && typeof humidityData === 'object') {
      Object.values(humidityData).forEach((entry: any) => {
        if (entry && typeof entry === 'object' && 'value' in entry && 'time' in entry) {
          const timeStr = entry.time;
          if (historyMap.has(timeStr)) {
            historyMap.get(timeStr)!.humidity = entry.value;
          }
        }
      });
    }

    const parsedHistory = Array.from(historyMap.values());
    parsedHistory.sort((a, b) => b.date.getTime() - a.date.getTime());

    for (let i = 0; i < parsedHistory.length; i++) {
      const current = parsedHistory[i];
      const olderRecord = i + 1 < parsedHistory.length ? parsedHistory[i + 1] : null;
      if (olderRecord) {
        olderRecord.sensorReadings.forEach(olderSensor => {
          current.previousMoistureMap.set(olderSensor.nodeId, olderSensor.moisture);
        });
      }
    }

    setHistory(parsedHistory);
    setCurrentPage(1);
  }, [allData]);

  const parseCustomDate = (dateString: string): Date => {
    const [datePart, timePart] = dateString.split(' ');
    const [month, day, year] = datePart.split('-');
    const [hour, minute, second] = timePart.split(':');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
  };

  const formatDate = (date: Date): string => {
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    let filtered = [...history];

    if (selectedSensor !== 'all') {
      filtered = filtered.filter(record =>
        record.sensorReadings.some(s => s.nodeId === selectedSensor)
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(record => record.date >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(record => record.date <= end);
    }

    setFilteredHistory(filtered);
    setCurrentPage(1);
  }, [history, selectedSensor, startDate, endDate]);

  const clearFilters = () => {
    setSelectedSensor('all');
    setStartDate('');
    setEndDate('');
  };

  const handleMouseEnter = (e: React.MouseEvent, change: number, previous: number | undefined) => {
    if (previous === undefined) {
      setTooltipText('No previous data available');
    } else {
      const direction = change > 0 ? 'increased' : change < 0 ? 'decreased' : 'no change';
      const absChange = Math.abs(change);
      setTooltipText(`${direction} by ${absChange}% since last reading (was ${previous}%)`);
    }
    setTooltipPosition({ x: e.clientX + 10, y: e.clientY - 30 });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const totalPages = Math.ceil(filteredHistory.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredHistory.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="text-center text-white py-8">Loading history...</div>;

  const getCondition = (value: number) => {
    if (value > 80) return { label: 'Saturated', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30' };
    if (value > 40) return { label: 'Optimal', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30' };
    return { label: 'Dry', color: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30' };
  };

  const getTrend = (current: number, previousMap: Map<string, number>, nodeId: string) => {
    const previous = previousMap.get(nodeId);
    if (previous === undefined) return { icon: '●', color: 'text-gray-400', text: '0%', change: 0, previousValue: undefined };
    const change = current - previous;
    if (change > 0) return { icon: '▲', color: 'text-green-600', text: `+${change}%`, change, previousValue: previous };
    if (change < 0) return { icon: '▼', color: 'text-red-600', text: `${change}%`, change, previousValue: previous };
    return { icon: '●', color: 'text-gray-400', text: '0%', change: 0, previousValue: previous };
  };

  const sensors = ['node_1', 'node_2', 'node_3', 'node_4', 'node_5'];

  return (
    <div className="space-y-6">
      {showTooltip && (
        <div
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          {tooltipText}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">History</h1>
      </div>

      {/* Filter Bar - Removed moisture min/max */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-green-400 shadow-green-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sensor</label>
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Sensors</option>
              {sensors.map(sensor => (
                <option key={sensor} value={sensor}>{sensor.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {(selectedSensor !== 'all' || startDate || endDate) && (
          <div className="mt-4 text-right">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {currentRecords.length} of {filteredHistory.length} records
      </p>

      <div className="space-y-6">
        {currentRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No records match your filters</p>
        ) : (
          currentRecords.map((record) => (
            <div key={record.time} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-green-400 shadow-md">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {formatDate(record.date)}
                </p>
              </div>
              
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {record.sensorReadings
                  .filter(s => selectedSensor === 'all' || s.nodeId === selectedSensor)
                  .map((sensor) => {
                    const status = getCondition(sensor.moisture);
                    const trend = getTrend(sensor.moisture, record.previousMoistureMap, sensor.nodeId);
                    
                    return (
                      <div key={sensor.nodeId} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {sensor.nodeId.replace('_', ' ')}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              <span className="text-2xl mr-2">💧</span>
                              {sensor.moisture}%
                            </div>
                            <div className="text-xs text-gray-500">Moisture</div>
                            <div
                              className={`text-xs font-medium mt-1 inline-block cursor-help ${trend.color}`}
                              onMouseEnter={(e) => handleMouseEnter(e, trend.change, trend.previousValue)}
                              onMouseLeave={handleMouseLeave}
                            >
                              {trend.icon} {trend.text}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              <span className="text-2xl mr-2">🌡️</span>
                              {record.temperature !== 0 ? `${record.temperature}°C` : '--'}
                            </div>
                            <div className="text-xs text-gray-500">Temperature</div>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              <span className="text-2xl mr-2">💨</span>
                              {record.humidity !== 0 ? `${record.humidity}%` : '--'}
                            </div>
                            <div className="text-xs text-gray-500">Humidity</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            ← Previous
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-8 h-8 rounded-lg transition ${
                    currentPage === pageNum
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
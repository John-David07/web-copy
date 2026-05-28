'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface SensorData {
  nodeId: string;
  moisture: number;
  temperature: number;
  humidity: number;
}

export function NotificationButton() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('web_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) })));
      } catch (e) {}
    }
    
    // Check for weekly check-in
    const lastCheckIn = localStorage.getItem('last_web_checkin');
    const now = new Date();
    if (!lastCheckIn || (now.getTime() - new Date(lastCheckIn).getTime()) >= 7 * 24 * 60 * 60 * 1000) {
      addNotification({
        title: '🌱 Weekly Plant Check',
        message: 'Time to check on your plants! Review moisture levels and plant health.'
      });
      localStorage.setItem('last_web_checkin', now.toISOString());
    }
    
    // Fetch sensor data and check dry patterns
    fetchSensorDataAndCheckDryPattern();
    
    // Set up interval to check every hour
    const interval = setInterval(fetchSensorDataAndCheckDryPattern, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSensorDataAndCheckDryPattern = async () => {
    try {
      const res = await fetch('/api/sensors/current');
      const data = await res.json();
      
      const sensors = Object.entries(data.Soil_Moisture || {}).map(([nodeId, value]) => ({
        nodeId,
        moisture: value as number,
        temperature: data.Temperature,
        humidity: data.Humidity,
      }));
      
      checkDryPattern(sensors);
    } catch (err) {
      console.error('Failed to fetch sensor data for dry pattern check:', err);
    }
  };

  const checkDryPattern = (sensors: SensorData[]) => {
    // Get stored moisture history
    const storedHistory = localStorage.getItem('moisture_history');
    let moistureHistory: Record<string, { moisture: number; date: string }[]> = storedHistory ? JSON.parse(storedHistory) : {};
    
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];
    
    sensors.forEach(sensor => {
      if (!moistureHistory[sensor.nodeId]) {
        moistureHistory[sensor.nodeId] = [];
      }
      
      // Check if we already recorded today for this sensor
      const alreadyRecordedToday = moistureHistory[sensor.nodeId].some(
        entry => entry.date === todayKey
      );
      
      if (!alreadyRecordedToday) {
        // Add today's reading
        moistureHistory[sensor.nodeId].push({
          moisture: sensor.moisture,
          date: todayKey
        });
        // Keep only last 10 days of readings
        if (moistureHistory[sensor.nodeId].length > 10) {
          moistureHistory[sensor.nodeId].shift();
        }
      }
      
      // Get recent readings (last 3 days)
      const recentReadings = moistureHistory[sensor.nodeId].slice(-3);
      const allDry = recentReadings.length === 3 && recentReadings.every(r => r.moisture < 40);
      const isDry = sensor.moisture < 40;
      
      if (isDry && allDry) {
        const lastNotification = localStorage.getItem(`dry_pattern_${sensor.nodeId}`);
        if (!lastNotification || (now.getTime() - new Date(lastNotification).getTime()) > 24 * 60 * 60 * 1000) {
          addNotification({
            title: '⚠️ Dry Pattern Detected',
            message: `${sensor.nodeId.replace('_', ' ')} has been dry for 3 days in a row. Time to water!`
          });
          localStorage.setItem(`dry_pattern_${sensor.nodeId}`, now.toISOString());
        }
      }
    });
    
    localStorage.setItem('moisture_history', JSON.stringify(moistureHistory));
  };

  const addNotification = ({ title, message }: { title: string; message: string }) => {
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newNotification: Notification = {
      id: uniqueId,
      title,
      message,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} min ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} hours ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} days ago`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            {notifications.length > 0 && (
              <div className="flex gap-2">
                <button onClick={markAllAsRead} className="text-xs text-green-600 dark:text-green-400 hover:underline">
                  Mark all read
                </button>
                <button onClick={clearAll} className="text-xs text-red-600 hover:underline">
                  Clear all
                </button>
              </div>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notif.read ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTime(notif.timestamp)}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
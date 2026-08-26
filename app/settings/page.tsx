'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [resetMessage, setResetMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset all data (localStorage + Firebase)
  const handleResetAll = async () => {
    if (confirm('⚠️ CAUTION! This action cannot be undone.\n\nThis will clear:\n• AI recommendations cache\n• Notification history\n• All preferences\n\nAre you sure you want to proceed?')) {
      setIsLoading(true);
      setResetMessage('');

      try {
        localStorage.clear();
        sessionStorage.clear();

        setResetMessage('✅ All local data has been reset. Refresh the page for complete effect.');
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        setResetMessage('❌ Error resetting data. Please try again.');
        console.error('Reset error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Reset ONLY history (Firebase)
  const handleResetHistory = async () => {
    if (confirm('⚠️ CAUTION! This action cannot be undone.\n\nThis will permanently delete ALL history logs from Firebase.\n\n✅ The ESP32 will automatically repopulate history with new data once running.\n\nAre you sure you want to proceed?')) {
      setIsLoading(true);
      setResetMessage('');

      try {
        const response = await fetch('/api/reset-history', {
          method: 'POST',
        });
        
        if (!response.ok) {
          throw new Error('Failed to reset history');
        }

        setResetMessage('✅ History logs have been cleared from Firebase. New data will be recorded once the ESP32 runs.');
        setTimeout(() => window.location.reload(), 3000);
      } catch (error) {
        setResetMessage('❌ Error resetting history. Please try again.');
        console.error('Reset error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h1>

      {resetMessage && (
        <div className={`mb-4 p-3 rounded-lg ${
          resetMessage.includes('Error') 
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        }`}>
          {resetMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Reset History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-400 shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reset History</h2>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Clear All History Logs</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permanently delete ALL history logs from Firebase
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                ✅ ESP32 will repopulate with new data once running
              </p>
            </div>
            <button
              onClick={handleResetHistory}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? 'Clearing...' : 'Clear History'}
            </button>
          </div>
        </div>

        {/* Reset All Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-yellow-400 shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reset Preferences</h2>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-yellow-600 dark:text-yellow-400">Reset Local Settings</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Clear AI cache, notifications, and all preferences
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                ⚠️ Does NOT affect history logs or sensor data
              </p>
            </div>
            <button
              onClick={handleResetAll}
              disabled={isLoading}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {isLoading ? 'Resetting...' : 'Reset Local'}
            </button>
          </div>
        </div>

        {/* System Info Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-green-400 shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Info</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Firmware Version</span>
              <span className="font-medium text-gray-900 dark:text-white">v2.4.12-stable</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Hardware ID</span>
              <span className="font-medium text-gray-900 dark:text-white">EG-SENS-8842-X</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">Network Status</span>
              <span className="font-medium text-green-600">Connected</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">AI Model</span>
              <span className="font-medium text-gray-900 dark:text-white">Gemini 2.5 Flash Lite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [resetMessage, setResetMessage] = useState('');

  const handleResetData = async () => {
    if (confirm('⚠️ CAUTION! This action cannot be undone.\n\nAll locally stored data will be cleared:\n• AI recommendations cache\n• Notification history\n• All preferences\n\nAre you sure you want to proceed?')) {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear IndexedDB if any
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
      
      setResetMessage('All local data has been reset. Refresh the page for complete effect.');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">System Settings</h1>

      {resetMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
          {resetMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Reset Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-400 shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reset Data</h2>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-red-600 dark:text-red-400">Reset All Settings</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Clear AI cache, notifications, and all preferences</p>
            </div>
            <button
              onClick={handleResetData}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              Reset
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
'use client';

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number;
  label: string;
}

export function CircularProgress({ value, label }: CircularProgressProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(prefersDark);

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const getColor = (val: number) => {
    if (val > 80) return '#2196F3'; // saturated - Blue
    if (val > 40) return '#4CAF50'; // Optimal - Green
    return '#FF9800'; // Dry - Orange
  };

  const getStatus = (val: number) => {
    if (val > 80) return 'saturated';
    if (val > 40) return 'Optimal';
    return 'Dry';
  };

  const color = getColor(value);
  const status = getStatus(value);
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const trailColor = isDark ? '#374151' : '#e0e0e0';

  return (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32">
        <CircularProgressbar
          value={value}
          text={`${value}%`}
          styles={buildStyles({
            textSize: '24px',
            textColor: textColor,
            pathColor: color,
            trailColor: trailColor,
          })}
        />
      </div>
      <div className="mt-2 text-center">
        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
          status === 'saturated' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
          status === 'Optimal' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
          'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
        }`}>
          {status}
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
}
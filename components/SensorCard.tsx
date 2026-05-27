import Link from 'next/link';

interface SensorCardProps {
  nodeId: string;
  moisture: number;
  temperature: number;
  humidity: number;
}

export function SensorCard({ nodeId, moisture, temperature, humidity }: SensorCardProps) {
  const getCondition = (value: number) => {
    if (value > 80) return { 
      label: 'saturated', 
      color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
      barColor: 'bg-blue-500'
    };
    if (value > 40) return { 
      label: 'Optimal', 
      color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
      barColor: 'bg-green-600'
    };
    return { 
      label: 'Dry', 
      color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
      barColor: 'bg-orange-600'
    };
  };

  const condition = getCondition(moisture);

  return (
    <Link href={`/sensors/${nodeId}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg p-6 border-2 border-green-400 shadow-green-200 dark:shadow-green-500/25 cursor-pointer hover:shadow-lg dark:hover:shadow-green-500/40 transition-shadow hover:border-green-300 dark:hover:border-green-300">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {nodeId.replace('_', ' ')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Plant {nodeId.replace('Node_', '')}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${condition.color}`}>
            {condition.label}
          </span>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-300">Moisture Level</span>
            <span className="text-sm font-medium text-gray-800 dark:text-white">{moisture}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${condition.barColor}`}
              style={{ width: `${moisture}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-xl font-bold text-gray-800 dark:text-white">{temperature}°C</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Temperature</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-xl font-bold text-gray-800 dark:text-white">{humidity}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Humidity</div>
          </div>
        </div>
      </div>
    </Link>
  );
} 
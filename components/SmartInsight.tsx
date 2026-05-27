interface SmartInsightProps {
  temperature: number;
  humidity: number;
}

export function SmartInsight({ temperature, humidity }: SmartInsightProps) {
  const getInsight = () => {
    if (temperature > 30) {
      return {
        message: "High temperature detected. Consider moving plants away from direct sunlight.",
        type: "warning"
      };
    }
    if (humidity < 40) {
      return {
        message: "Low humidity. Consider misting your plants.",
        type: "warning"
      };
    }
    return {
      message: "Optimal for Growth: Current conditions are perfect for tropical varieties. No action needed.",
      type: "success"
    };
  };

  const insight = getInsight();
  const colors = insight.type === 'success' 
    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400';

  return (
    <div className={`rounded-lg shadow-md dark:shadow-lg p-4 border-2 border-green-400 shadow-green-200 dark:shadow-green-500/25 hover:shadow-lg dark:hover:shadow-green-500/40 transition-all ${colors}`}>
      <h3 className="font-semibold mb-1">Smart Insight</h3>
      <p className="text-sm">{insight.message}</p>
    </div>
  );
}